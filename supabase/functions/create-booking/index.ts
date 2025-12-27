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
  tenant_id: z.string().uuid().optional()
}).refine(data => (data.Fecha || data.date) && (data.Hora || data.time), {
  message: "Either Fecha/Hora or date/time must be provided"
});

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
    let currentMinutes = startHours * 60 + startMinutes;
    
    // Skip validations if admin explicitly requests it
    if (!bookingData.skipAvailabilityCheck) {
      // Check if customer already has a booking at this date/time
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

    // Get stylist color for the booking
    const stylistColor = await getStylistColor(supabase, tenantId, actualStylist);

    const createdBookings: any[] = [];
    let mainBookingId: string | null = null;

    // Process simple services
    if (simpleServices.length > 0) {
      const simpleDuration = simpleServices.reduce((sum, s) => sum + s.duration_part1_active, 0);
      const startTime = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}:00`;
      const endTime = calculateEndTime(currentMinutes, simpleDuration);

      const serviceNames = simpleServices.map(s => s.name).join(', ');

      const bookingRecord = {
        tenant_id: tenantId,
        Fecha: bookingDate,
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
        color: stylistColor
      };

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingRecord)
        .select()
        .single();

      if (bookingError) throw bookingError;

      createdBookings.push(booking);
      mainBookingId = booking.id;
      currentMinutes += simpleDuration;
    }

    // Process compound services
    for (const service of compoundServices) {
      // Part 1
      const part1Start = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}:00`;
      const part1End = calculateEndTime(currentMinutes, service.duration_part1_active);

      const part1Record = {
        tenant_id: tenantId,
        Fecha: bookingDate,
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
        color: stylistColor
      };

      const { data: part1Booking, error: part1Error } = await supabase
        .from('bookings')
        .insert(part1Record)
        .select()
        .single();

      if (part1Error) throw part1Error;

      createdBookings.push(part1Booking);
      if (!mainBookingId) mainBookingId = part1Booking.id;

      currentMinutes += service.duration_part1_active + service.duration_exposure_pause;

      // Part 2 if exists
      if (service.duration_part2_active > 0) {
        const part2Start = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}:00`;
        const part2End = calculateEndTime(currentMinutes, service.duration_part2_active);

        const part2Record = {
          tenant_id: tenantId,
          Fecha: bookingDate,
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
          color: stylistColor
        };

        const { data: part2Booking, error: part2Error } = await supabase
          .from('bookings')
          .insert(part2Record)
          .select()
          .single();

        if (part2Error) throw part2Error;

        createdBookings.push(part2Booking);
        currentMinutes += service.duration_part2_active;
      }
    }

    console.log('Created bookings:', createdBookings.length);

    // Trigger n8n webhook
    const n8nWebhookUrl = await getN8nWebhookUrl(supabase, tenantId);
    if (n8nWebhookUrl) {
      try {
        const [day, month, year] = [
          bookingDate.slice(8, 10),
          bookingDate.slice(5, 7),
          bookingDate.slice(0, 4)
        ];
        const formattedDate = `${day}-${month}-${year}`;

        await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'new_booking',
            customer_name,
            phone: customer_phone,
            email: customer_email,
            date: formattedDate,
            time: bookingTime.slice(0, 5),
            stylist: actualStylist,
            services: bookingData.services.map(s => s.name),
            total_duration: bookingData.total_duration,
            tenant_id: tenantId,
            booking_ids: createdBookings.map(b => b.id)
          })
        });
        console.log('n8n webhook sent successfully');
      } catch (webhookError) {
        console.error('Error sending n8n webhook:', webhookError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookings: createdBookings,
        message: 'Booking created successfully',
        stylist: actualStylist,
        tenant_id: tenantId
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
