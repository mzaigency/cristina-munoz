import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from 'https://esm.sh/zod@3.22.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to normalize phone numbers
const normalizePhone = (phone: string): string => {
  return phone.replace(/[\s\-\(\)]/g, '').replace(/^(\+34)?/, '');
};

// Validation schemas
const serviceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.enum(['Simple', 'Compuesto']),
  duration_part1_active: z.number().int().min(0).max(480),
  duration_exposure_pause: z.number().int().min(0).max(480),
  duration_part2_active: z.number().int().min(0).max(480)
});

const recurrenceSchema = z.object({
  intervalValue: z.number().int().min(1).max(52),
  intervalUnit: z.enum(['days', 'weeks', 'months']),
  occurrences: z.number().int().min(1).max(365),
}).nullable().optional();

const bookingRequestSchema = z.object({
  Fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional(),
  Hora: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format").optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional(),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format").optional(),
  stylist: z.enum(['cris', 'desi', 'any']).or(z.string()),
  services: z.array(serviceSchema).min(1).max(10),
  total_duration: z.number().int().min(1).max(960),
  customer_name: z.string().min(1).max(100).optional(),
  phone: z.union([z.string().min(9).max(15), z.literal('')]).optional(),
  user_id: z.string().uuid().nullable().optional(),
  skipAvailabilityCheck: z.boolean().optional(),
  tenant_id: z.string().uuid().optional(),
  canal: z.enum(['web', 'crm', 'whatsapp']).optional(),
  recurrence: recurrenceSchema,
}).refine(data => (data.Fecha || data.date) && (data.Hora || data.time), {
  message: "Either Fecha/Hora or date/time must be provided"
});

interface RecurrenceConfig {
  intervalValue: number;
  intervalUnit: 'days' | 'weeks' | 'months';
  occurrences: number;
}

interface BookingRequest {
  Fecha?: string;
  Hora?: string;
  date?: string;
  time?: string;
  stylist: string;
  services: Array<{ 
    id: string;
    name: string;
    type: 'Simple' | 'Compuesto';
    duration_part1_active: number;
    duration_exposure_pause: number;
    duration_part2_active: number;
  }>;
  total_duration: number;
  user_id?: string | null;
  customer_name?: string;
  phone?: string;
  skipAvailabilityCheck?: boolean;
  tenant_id?: string;
  canal?: 'web' | 'crm' | 'whatsapp';
  recurrence?: RecurrenceConfig | null;
}

// Helper function to get default tenant ID
async function getDefaultTenantId(supabase: any): Promise<string | null> {
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  
  return tenant?.id || null;
}

// Helper function to get n8n webhook URL from tenant integrations
async function getN8nWebhookUrl(supabase: any, tenantId: string): Promise<string | null> {
  const { data: integration } = await supabase
    .from('tenant_integrations')
    .select('settings, is_enabled')
    .eq('tenant_id', tenantId)
    .eq('integration_type', 'n8n')
    .eq('is_enabled', true)
    .maybeSingle();

  if (integration?.settings?.webhook_url) {
    return integration.settings.webhook_url;
  }

  return Deno.env.get('N8N_WEBHOOK_URL') || null;
}

// Helper function to get stylist color
async function getStylistColor(supabase: any, tenantId: string, stylistSlug: string): Promise<string> {
  const { data: stylist } = await supabase
    .from('tenant_stylists')
    .select('color')
    .eq('tenant_id', tenantId)
    .eq('slug', stylistSlug)
    .maybeSingle();

  return stylist?.color || '#8B5CF6';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();
    
    // Validate input
    const validationResult = bookingRequestSchema.safeParse(rawData);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data', 
          details: validationResult.error.errors 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const bookingData: BookingRequest = validationResult.data;
    console.log('Creating booking:', bookingData);

    // Support both date/time and Fecha/Hora formats
    const bookingDate = bookingData.date || bookingData.Fecha!;
    const bookingTime = bookingData.time || bookingData.Hora!;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // SECURITY: Verify authentication and authorization
    const authHeader = req.headers.get('Authorization');
    let callingUser = null;

    if (authHeader) {
      const anonClient = createClient(
        supabaseUrl,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await anonClient.auth.getUser();
      callingUser = user;
    }

    // Verify user_id ownership (prevent IDOR)
    if (bookingData.user_id) {
      if (!callingUser) {
         return new Response(
          JSON.stringify({ error: 'Unauthorized: Authentication required for user booking' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (callingUser.id !== bookingData.user_id) {
        // Check for admin/stylist role
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', callingUser.id);

        const hasPermission = roles?.some(r => r.role === 'admin' || r.role === 'stylist');

        if (!hasPermission) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized: You can only book for yourself' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Verify skipAvailabilityCheck permission
    if (bookingData.skipAvailabilityCheck) {
      let hasPermission = false;
      if (callingUser) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', callingUser.id);
        hasPermission = roles?.some(r => r.role === 'admin' || r.role === 'stylist') || false;
      }

      if (!hasPermission) {
        console.warn(`Unauthorized attempt to skip checks by ${callingUser?.id || 'anonymous'}`);
        bookingData.skipAvailabilityCheck = false;
      }
    }

    // Determine tenant_id
    let tenantId: string | undefined = bookingData.tenant_id;
    if (!tenantId) {
      const defaultTenant = await getDefaultTenantId(supabase);
      if (!defaultTenant) {
        throw new Error('No active tenant found');
      }
      tenantId = defaultTenant;
    }
    console.log('Using tenant_id:', tenantId);

    // Get customer data - either from user profile or from direct input
    let customer_name: string;
    let customer_email: string | null = null;
    let customer_phone: string;

    if (bookingData.user_id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', bookingData.user_id)
        .single();

      if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        throw new Error('Could not fetch user profile');
      }

      customer_name = profile.full_name;
      customer_email = profile.email;
      customer_phone = profile.phone;
    } else {
      if (!bookingData.customer_name) {
        throw new Error('Customer name is required');
      }
      customer_name = bookingData.customer_name;
      customer_phone = bookingData.phone || '';
    }

    // Determine actual stylist for "any" selection
    let actualStylist = bookingData.stylist;
    
    if (bookingData.stylist === 'any') {
      // Check availability for each stylist in database
      const { data: stylists } = await supabase
        .from('tenant_stylists')
        .select('slug')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (stylists && stylists.length > 0) {
        const [startHours, startMinutes] = bookingTime.split(':').map(Number);
        const startMinutesTotal = startHours * 60 + startMinutes;
        const endMinutesTotal = startMinutesTotal + bookingData.total_duration;

        for (const stylist of stylists) {
          const { data: existingBookings } = await supabase
            .from('bookings')
            .select('Hora, end_time, total_duration')
            .eq('Fecha', bookingDate)
            .eq('stylist', stylist.slug)
            .eq('status', 'confirmed')
            .eq('tenant_id', tenantId);

          const hasConflict = existingBookings?.some(booking => {
            const [bStartH, bStartM] = booking.Hora.split(':').map(Number);
            const bookingStart = bStartH * 60 + bStartM;
            const bookingEnd = bookingStart + (booking.total_duration || 60);
            return (startMinutesTotal < bookingEnd && endMinutesTotal > bookingStart);
          });

          if (!hasConflict) {
            actualStylist = stylist.slug;
            break;
          }
        }

        if (actualStylist === 'any') {
          throw new Error('No stylist available for the selected time');
        }
      }
    }

    const normalizedPhone = normalizePhone(customer_phone);
    const [startHours, startMinutes] = bookingTime.split(':').map(Number);
    const currentMinutes = startHours * 60 + startMinutes;
    
    // Skip validations if admin explicitly requests it
    if (!bookingData.skipAvailabilityCheck) {
      // Check if customer already has a booking at this date/time
      // Only check if phone is provided (can't identify customer without it)
      if (normalizedPhone && normalizedPhone.length >= 9) {
        const { data: existingCustomerBooking } = await supabase
          .from('bookings')
          .select('id, customer_name, Hora, Telefono')
          .eq('Fecha', bookingDate)
          .eq('Hora', bookingTime)
          .eq('status', 'confirmed')
          .eq('tenant_id', tenantId);
        
        if (existingCustomerBooking && existingCustomerBooking.length > 0) {
          const duplicateBooking = existingCustomerBooking.find(booking => 
            normalizePhone(booking.Telefono || '') === normalizedPhone
          );
          
          if (duplicateBooking) {
            return new Response(
              JSON.stringify({ 
                error: 'Ya existe una reserva para este cliente en esta fecha y hora',
                details: { existing_booking_id: duplicateBooking.id }
              }),
              { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
      
      // Check stylist availability in database
      const endMinutesTotal = currentMinutes + bookingData.total_duration;
      
      const { data: stylistBookings } = await supabase
        .from('bookings')
        .select('id, Hora, end_time, customer_name, total_duration')
        .eq('Fecha', bookingDate)
        .eq('stylist', actualStylist)
        .eq('status', 'confirmed')
        .eq('tenant_id', tenantId);
      
      if (stylistBookings && stylistBookings.length > 0) {
        const hasConflict = stylistBookings.some(booking => {
          const [bStartH, bStartM] = booking.Hora.split(':').map(Number);
          const bookingStart = bStartH * 60 + bStartM;
          const bookingEnd = bookingStart + (booking.total_duration || 60);
          return (currentMinutes < bookingEnd && endMinutesTotal > bookingStart);
        });
        
        if (hasConflict) {
          return new Response(
            JSON.stringify({ 
              error: `${actualStylist} ya tiene una cita en ese horario`,
              details: { stylist: actualStylist }
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Separate services by type
    const simpleServices = bookingData.services.filter(s => s.type === 'Simple');
    const compoundServices = bookingData.services.filter(s => s.type === 'Compuesto');

    // Helper function to calculate end time
    const calculateEndTime = (startMinutes: number, durationMinutes: number): string => {
      const totalMinutes = startMinutes + durationMinutes;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    };

    // Helper function to add days to a date string
    const addDaysToDate = (dateStr: string, days: number): string => {
      const date = new Date(dateStr);
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    };

    // Calculate recurrence dates
    const getRecurrenceDates = (): string[] => {
      if (!bookingData.recurrence) return [bookingDate];
      
      const dates: string[] = [];
      let currentDate = bookingDate;
      
      for (let i = 0; i < bookingData.recurrence.occurrences; i++) {
        dates.push(currentDate);
        
        // Calculate next date
        let daysToAdd = 0;
        switch (bookingData.recurrence.intervalUnit) {
          case 'days':
            daysToAdd = bookingData.recurrence.intervalValue;
            break;
          case 'weeks':
            daysToAdd = bookingData.recurrence.intervalValue * 7;
            break;
          case 'months':
            daysToAdd = bookingData.recurrence.intervalValue * 30;
            break;
        }
        currentDate = addDaysToDate(currentDate, daysToAdd);
      }
      
      return dates;
    };

    // Get stylist color for the booking
    const stylistColor = await getStylistColor(supabase, tenantId, actualStylist);

    const createdBookings: any[] = [];
    
    // Generate recurrence group ID if this is a recurring booking
    const recurrenceGroupId = bookingData.recurrence ? crypto.randomUUID() : null;
    const recurrencePattern = bookingData.recurrence ? {
      intervalValue: bookingData.recurrence.intervalValue,
      intervalUnit: bookingData.recurrence.intervalUnit,
      occurrences: bookingData.recurrence.occurrences,
    } : null;

    // Get all dates to create bookings for
    const bookingDates = getRecurrenceDates();
    console.log(`Creating ${bookingDates.length} bookings for dates:`, bookingDates);

    // Create bookings for each date
    for (const currentBookingDate of bookingDates) {
      let dateCurrentMinutes = currentMinutes;
      let mainBookingId: string | null = null;

      // Process simple services
      if (simpleServices.length > 0) {
        const simpleDuration = simpleServices.reduce((sum, s) => sum + s.duration_part1_active, 0);
        const startTime = `${String(Math.floor(dateCurrentMinutes / 60)).padStart(2, '0')}:${String(dateCurrentMinutes % 60).padStart(2, '0')}:00`;
        const endTime = calculateEndTime(dateCurrentMinutes, simpleDuration);

        const serviceNames = simpleServices.map(s => s.name).join(', ');

        const bookingRecord = {
          tenant_id: tenantId,
          Fecha: currentBookingDate,
          Hora: startTime,
          end_time: endTime,
          stylist: actualStylist,
          customer_name: customer_name,
          Telefono: customer_phone,
          services: simpleServices,
          total_duration: simpleDuration,
          user_id: bookingData.user_id || null,
          skip_availability_check: bookingData.skipAvailabilityCheck || false,
          status: 'confirmed',
          title: `${customer_name} - ${serviceNames}`,
          notes: null,
          color: stylistColor,
          canal: bookingData.canal || 'web',
          recurrence_group_id: recurrenceGroupId,
          recurrence_pattern: recurrencePattern,
        };

        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .insert(bookingRecord)
          .select()
          .single();

        if (bookingError) throw bookingError;

        createdBookings.push(booking);
        mainBookingId = booking.id;
        dateCurrentMinutes += simpleDuration;
      }

      // Process compound services
      for (const service of compoundServices) {
        // Part 1
        const part1Start = `${String(Math.floor(dateCurrentMinutes / 60)).padStart(2, '0')}:${String(dateCurrentMinutes % 60).padStart(2, '0')}:00`;
        const part1End = calculateEndTime(dateCurrentMinutes, service.duration_part1_active);

        const part1Record = {
          tenant_id: tenantId,
          Fecha: currentBookingDate,
          Hora: part1Start,
          end_time: part1End,
          stylist: actualStylist,
          customer_name: customer_name,
          Telefono: customer_phone,
          services: [service],
          total_duration: service.duration_part1_active,
          user_id: bookingData.user_id || null,
          is_part_of_compound: true,
          compound_part: 'part1',
          related_booking_id: mainBookingId,
          skip_availability_check: bookingData.skipAvailabilityCheck || false,
          status: 'confirmed',
          title: `${customer_name} - ${service.name} (Parte 1)`,
          notes: null,
          color: stylistColor,
          canal: bookingData.canal || 'web',
          recurrence_group_id: recurrenceGroupId,
          recurrence_pattern: recurrencePattern,
        };

        const { data: part1Booking, error: part1Error } = await supabase
          .from('bookings')
          .insert(part1Record)
          .select()
          .single();

        if (part1Error) throw part1Error;

        createdBookings.push(part1Booking);
        if (!mainBookingId) mainBookingId = part1Booking.id;

        dateCurrentMinutes += service.duration_part1_active + service.duration_exposure_pause;

        // Part 2 if exists
        if (service.duration_part2_active > 0) {
          const part2Start = `${String(Math.floor(dateCurrentMinutes / 60)).padStart(2, '0')}:${String(dateCurrentMinutes % 60).padStart(2, '0')}:00`;
          const part2End = calculateEndTime(dateCurrentMinutes, service.duration_part2_active);

          const part2Record = {
            tenant_id: tenantId,
            Fecha: currentBookingDate,
            Hora: part2Start,
            end_time: part2End,
            stylist: actualStylist,
            customer_name: customer_name,
            Telefono: customer_phone,
            services: [service],
            total_duration: service.duration_part2_active,
            user_id: bookingData.user_id || null,
            is_part_of_compound: true,
            compound_part: 'part2',
            related_booking_id: part1Booking.id,
            skip_availability_check: bookingData.skipAvailabilityCheck || false,
            status: 'confirmed',
            title: `${customer_name} - ${service.name} (Parte 2)`,
            notes: null,
            color: stylistColor,
            canal: bookingData.canal || 'web',
            recurrence_group_id: recurrenceGroupId,
            recurrence_pattern: recurrencePattern,
          };

          const { data: part2Booking, error: part2Error } = await supabase
            .from('bookings')
            .insert(part2Record)
            .select()
            .single();

          if (part2Error) throw part2Error;

          createdBookings.push(part2Booking);
          dateCurrentMinutes += service.duration_part2_active;
        }
      }
    }

    console.log('Created bookings:', createdBookings.length);

    // Send internal message confirmation (if user has account)
    if (bookingData.user_id) {
      try {
        // Find or create conversation
        let { data: conversation } = await supabase
          .from('conversations')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('user_id', bookingData.user_id)
          .maybeSingle();

        if (!conversation) {
          const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({
              tenant_id: tenantId,
              user_id: bookingData.user_id,
            })
            .select('id')
            .single();
          
          if (convError) throw convError;
          conversation = newConv;
        }

        // Format the confirmation message
        const [day, month, year] = [
          bookingDate.slice(8, 10),
          bookingDate.slice(5, 7),
          bookingDate.slice(0, 4)
        ];
        const formattedDateTime = `${day}/${month}/${year} a las ${bookingTime.slice(0, 5)}`;
        const serviceNames = bookingData.services.map(s => s.name).join(', ');
        
        const confirmationMessage = `✅ *Reserva confirmada*\n\nHola ${customer_name},\n\nTu cita ha sido confirmada para el ${formattedDateTime}.\n\n📋 Servicios: ${serviceNames}\n👤 Profesional: ${actualStylist}\n\n¡Te esperamos!`;

        // Insert the message
        await supabase
          .from('direct_messages')
          .insert({
            conversation_id: conversation.id,
            sender_id: tenantId,
            sender_type: 'salon',
            content: confirmationMessage,
            message_type: 'booking_confirmation',
          });

        console.log('Internal confirmation message sent to user:', bookingData.user_id);
      } catch (msgError) {
        console.error('Error sending internal confirmation message:', msgError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookings: createdBookings,
        message: bookingData.recurrence 
          ? `${createdBookings.length} recurring bookings created successfully`
          : 'Booking created successfully',
        stylist: actualStylist,
        tenant_id: tenantId,
        recurrence_group_id: recurrenceGroupId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-booking:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
