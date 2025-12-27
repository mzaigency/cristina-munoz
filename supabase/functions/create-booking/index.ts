import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { format } from "https://esm.sh/date-fns@3.6.0";
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
  stylist: z.enum(['cris', 'desi', 'any']),
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

interface GoogleCalendarCredentials {
  client_id: string;
  client_secret: string;
  refresh_token: string;
}

interface TenantIntegrationSettings {
  calendar_id_cris?: string;
  calendar_id_desi?: string;
  n8n_webhook_url?: string;
}

// Helper function to get tenant credentials
async function getTenantCredentials(
  supabase: any, 
  tenantId: string, 
  integrationType: string
): Promise<{ credentials: any; settings: any } | null> {
  const { data: integration, error } = await supabase
    .from('tenant_integrations')
    .select('credentials_encrypted, settings, is_enabled')
    .eq('tenant_id', tenantId)
    .eq('integration_type', integrationType)
    .eq('is_enabled', true)
    .maybeSingle();

  if (error || !integration) {
    console.log(`No ${integrationType} integration found for tenant ${tenantId}`);
    return null;
  }

  let credentials = null;
  if (integration.credentials_encrypted) {
    const { data: decrypted } = await supabase.rpc('decrypt_sensitive_data', {
      _ciphertext: integration.credentials_encrypted,
      _tenant_id: tenantId
    });
    if (decrypted) {
      try {
        credentials = JSON.parse(decrypted);
      } catch (e) {
        console.error('Error parsing credentials:', e);
      }
    }
  }

  return { credentials, settings: integration.settings || {} };
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

    // Get Google Calendar credentials from tenant_integrations
    let googleCreds: GoogleCalendarCredentials | null = null;
    let calendarSettings: TenantIntegrationSettings = {};
    
    const gcalIntegration = await getTenantCredentials(supabase, tenantId, 'google_calendar');
    if (gcalIntegration) {
      googleCreds = gcalIntegration.credentials;
      calendarSettings = gcalIntegration.settings || {};
      console.log('Using tenant Google Calendar integration');
    } else {
      // Fallback to environment variables
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
      const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');
      
      if (clientId && clientSecret && refreshToken) {
        googleCreds = { client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken };
        calendarSettings = {
          calendar_id_cris: Deno.env.get('GOOGLE_CALENDAR_ID_CRIS'),
          calendar_id_desi: Deno.env.get('GOOGLE_CALENDAR_ID_DESI')
        };
        console.log('Using environment Google Calendar credentials (fallback)');
      }
    }

    // Get n8n credentials from tenant_integrations
    let n8nWebhookUrl: string | null = null;
    const n8nIntegration = await getTenantCredentials(supabase, tenantId, 'n8n');
    if (n8nIntegration?.settings?.webhook_url) {
      n8nWebhookUrl = n8nIntegration.settings.webhook_url;
      console.log('Using tenant n8n webhook URL');
    } else {
      n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL') || null;
      if (n8nWebhookUrl) console.log('Using environment n8n webhook URL (fallback)');
    }

    // Get customer data - either from user profile or from direct input
    let customer_name: string;
    let customer_email: string | null = null;
    let customer_phone: string;

    if (bookingData.user_id) {
      // User booking - get data from profile
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
      // Admin booking - use provided data
      if (!bookingData.customer_name) {
        throw new Error('Customer name is required');
      }
      customer_name = bookingData.customer_name;
      customer_phone = bookingData.phone || '';
    }

    // Determine actual stylist for "any" selection
    let actualStylist = bookingData.stylist;
    
    if (bookingData.stylist === 'any' && googleCreds) {
      // Get OAuth2 access token first
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: googleCreds.client_id,
          client_secret: googleCreds.client_secret,
          refresh_token: googleCreds.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to authenticate with Google Calendar');
      }

      const { access_token } = await tokenResponse.json();

      // Calculate time range for the booking
      const [startHours, startMinutes] = bookingTime.split(':').map(Number);
      const startMinutesTotal = startHours * 60 + startMinutes;
      const endMinutesTotal = startMinutesTotal + bookingData.total_duration;
      
      // Check Cris calendar
      const crisCalendarId = calendarSettings.calendar_id_cris;
      const timeMin = `${bookingDate}T00:00:00Z`;
      const timeMax = `${bookingDate}T23:59:59Z`;

      let crisAvailable = false;
      if (crisCalendarId) {
        const crisEventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(crisCalendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`;
        const crisResponse = await fetch(crisEventsUrl, {
          headers: { 'Authorization': `Bearer ${access_token}` },
        });
        
        const crisEvents = await crisResponse.json();
        crisAvailable = !crisEvents.items?.some((event: any) => {
          if (event.start?.date) {
            const eventStart = event.start.date;
            const eventEnd = event.end.date;
            return bookingDate >= eventStart && bookingDate < eventEnd;
          }
          if (!event.start?.dateTime || !event.end?.dateTime) return false;
          const startTimeStr = event.start.dateTime.split('T')[1].substring(0, 5);
          const endTimeStr = event.end.dateTime.split('T')[1].substring(0, 5);
          const [eStartH, eStartM] = startTimeStr.split(':').map(Number);
          const [eEndH, eEndM] = endTimeStr.split(':').map(Number);
          const eStart = eStartH * 60 + eStartM;
          const eEnd = eEndH * 60 + eEndM;
          return (startMinutesTotal < eEnd && endMinutesTotal > eStart);
        });
      }

      // Check Desi calendar
      const desiCalendarId = calendarSettings.calendar_id_desi;
      let desiAvailable = false;
      if (desiCalendarId) {
        const desiEventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(desiCalendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`;
        const desiResponse = await fetch(desiEventsUrl, {
          headers: { 'Authorization': `Bearer ${access_token}` },
        });
        
        const desiEvents = await desiResponse.json();
        desiAvailable = !desiEvents.items?.some((event: any) => {
          if (event.start?.date) {
            const eventStart = event.start.date;
            const eventEnd = event.end.date;
            return bookingDate >= eventStart && bookingDate < eventEnd;
          }
          if (!event.start?.dateTime || !event.end?.dateTime) return false;
          const startTimeStr = event.start.dateTime.split('T')[1].substring(0, 5);
          const endTimeStr = event.end.dateTime.split('T')[1].substring(0, 5);
          const [eStartH, eStartM] = startTimeStr.split(':').map(Number);
          const [eEndH, eEndM] = endTimeStr.split(':').map(Number);
          const eStart = eStartH * 60 + eStartM;
          const eEnd = eEndH * 60 + eEndM;
          return (startMinutesTotal < eEnd && endMinutesTotal > eStart);
        });
      }
      
      // Assign to available stylist (prefer Cris if both available)
      if (crisAvailable) {
        actualStylist = 'cris';
      } else if (desiAvailable) {
        actualStylist = 'desi';
      } else {
        throw new Error('No stylist available for the selected time');
      }
      
      console.log(`Auto-assigned "any" booking to: ${actualStylist} (Cris available: ${crisAvailable}, Desi available: ${desiAvailable})`);
    }
    
    // Get calendar ID based on actual stylist
    let calendarId: string | null = null;
    if (actualStylist === 'cris') {
      calendarId = calendarSettings.calendar_id_cris || null;
    } else if (actualStylist === 'desi') {
      calendarId = calendarSettings.calendar_id_desi || null;
    }

    // Separate services by type
    const simpleServices = bookingData.services.filter(s => s.type === 'Simple');
    const compoundServices = bookingData.services.filter(s => s.type === 'Compuesto');

    // Helper function to create Google Calendar event
    const createCalendarEvent = async (
      summary: string,
      description: string,
      startTime: string,
      endTime: string,
      accessToken: string
    ) => {
      if (!calendarId) return null;
      
      const event = {
        summary,
        description,
        start: {
          dateTime: `${bookingDate}T${startTime}`,
          timeZone: 'Europe/Madrid',
        },
        end: {
          dateTime: `${bookingDate}T${endTime}`,
          timeZone: 'Europe/Madrid',
        },
      };

      const calendarResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!calendarResponse.ok) {
        console.error('Failed to create calendar event:', await calendarResponse.text());
        throw new Error('Failed to create calendar event');
      }

      const calendarEvent = await calendarResponse.json();
      return calendarEvent.id;
    };

    // Get access token if Google Calendar is configured
    let accessToken: string | null = null;
    if (calendarId && googleCreds) {
      try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: googleCreds.client_id,
            client_secret: googleCreds.client_secret,
            refresh_token: googleCreds.refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        if (!tokenResponse.ok) {
          console.error('Failed to get access token:', await tokenResponse.text());
        } else {
          const tokenData = await tokenResponse.json();
          accessToken = tokenData.access_token;
        }
      } catch (error) {
        console.error('Error getting access token:', error);
      }
    }

    const [startHours, startMinutes] = bookingTime.split(':').map(Number);
    let currentMinutes = startHours * 60 + startMinutes;

    // Normalize phone for consistent comparison
    const normalizedPhone = normalizePhone(customer_phone);
    
    // Skip validations if admin explicitly requests it (custom time mode)
    if (!bookingData.skipAvailabilityCheck) {
      // VALIDATION 1: Check if customer already has a booking at this date/time
      console.log('Checking for duplicate customer booking...');
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
          console.error('Duplicate booking detected:', duplicateBooking);
          return new Response(
            JSON.stringify({ 
              error: 'Ya existe una reserva para este cliente en esta fecha y hora',
              details: { 
                existing_booking_id: duplicateBooking.id,
                customer_name: duplicateBooking.customer_name 
              }
            }),
            {
              status: 409,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
      
      // VALIDATION 2: Check stylist availability in database
      console.log('Checking stylist availability in database...');
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
          const bookingEnd = bookingStart + booking.total_duration;
          
          const hasOverlap = (currentMinutes < bookingEnd && endMinutesTotal > bookingStart);
          
          if (hasOverlap) {
            console.log(`Conflict detected with booking ${booking.id} for ${booking.customer_name}: ${booking.Hora} (${booking.total_duration} min)`);
          }
          
          return hasOverlap;
        });
        
        if (hasConflict) {
          return new Response(
            JSON.stringify({ 
              error: `${actualStylist === 'cris' ? 'Cris' : 'Desi'} no está disponible en este horario`,
              details: 'Ya existe otra reserva en este intervalo de tiempo'
            }),
            {
              status: 409,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
    } else {
      console.log('Skipping availability checks (admin override)...');
    }
    
    console.log('Validations passed. Creating bookings...');

    const createdBookings = [];

    // Create bookings for simple services
    if (simpleServices.length > 0) {
      const simpleDuration = simpleServices.reduce((sum, s) => sum + s.duration_part1_active, 0);
      const endMinutes = currentMinutes + simpleDuration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00`;

      let googleEventId: string | null = null;
      if (accessToken) {
        try {
          const serviceNames = simpleServices.map(s => s.name).join(', ');
          const description = customer_email ? `${customer_email} - ${customer_phone}` : customer_phone;
          googleEventId = await createCalendarEvent(
            `${customer_name} - ${serviceNames}`,
            description,
            `${bookingTime}:00`,
            endTime,
            accessToken
          );
        } catch (error) {
          console.error('Error creating Google Calendar event for simple services:', error);
        }
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          customer_name,
          Telefono: normalizedPhone,
          Fecha: bookingDate,
          Hora: bookingTime,
          end_time: endTime,
          stylist: actualStylist,
          services: simpleServices.map(s => ({ name: s.name })),
          total_duration: simpleDuration,
          status: 'confirmed',
          google_calendar_event_id: googleEventId,
          calendar_id: calendarId,
          is_part_of_compound: false,
          user_id: bookingData.user_id || null,
          skip_availability_check: bookingData.skipAvailabilityCheck || false,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving simple services booking:', error);
        throw new Error('Failed to save booking');
      }

      createdBookings.push(data);
      currentMinutes = endMinutes;
    }

    // Create bookings for compound services (each gets 2 separate bookings)
    for (const service of compoundServices) {
      // Part 1: Active work
      const part1Duration = service.duration_part1_active;
      const part1EndMinutes = currentMinutes + part1Duration;
      const part1EndHours = Math.floor(part1EndMinutes / 60);
      const part1EndMins = part1EndMinutes % 60;
      const part1EndTime = `${String(part1EndHours).padStart(2, '0')}:${String(part1EndMins).padStart(2, '0')}:00`;
      const part1StartTime = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}:00`;

      let part1GoogleEventId: string | null = null;
      if (accessToken) {
        try {
          const description = customer_email ? `${customer_email} - ${customer_phone}` : customer_phone;
          part1GoogleEventId = await createCalendarEvent(
            `${customer_name} - ${service.name} (Parte 1)`,
            description,
            part1StartTime,
            part1EndTime,
            accessToken
          );
        } catch (error) {
          console.error('Error creating Google Calendar event for part 1:', error);
        }
      }

      const { data: part1Data, error: part1Error } = await supabase
        .from('bookings')
        .insert({
          customer_name,
          Telefono: normalizedPhone,
          Fecha: bookingDate,
          Hora: part1StartTime,
          end_time: part1EndTime,
          stylist: actualStylist,
          services: [{ name: `${service.name} - Parte 1` }],
          total_duration: part1Duration,
          status: 'confirmed',
          google_calendar_event_id: part1GoogleEventId,
          calendar_id: calendarId,
          is_part_of_compound: true,
          compound_part: 'part1',
          user_id: bookingData.user_id || null,
          skip_availability_check: bookingData.skipAvailabilityCheck || false,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (part1Error) {
        console.error('Error saving part 1 booking:', part1Error);
        throw new Error('Failed to save part 1 booking');
      }

      // Move time forward past exposure time
      currentMinutes = part1EndMinutes + service.duration_exposure_pause;

      // Part 2: Final work (only if there's a part 2 duration)
      if (service.duration_part2_active > 0) {
        const part2Duration = service.duration_part2_active;
        const part2StartMinutes = currentMinutes;
        const part2EndMinutes = currentMinutes + part2Duration;
        const part2StartTime = `${String(Math.floor(part2StartMinutes / 60)).padStart(2, '0')}:${String(part2StartMinutes % 60).padStart(2, '0')}:00`;
        const part2EndTime = `${String(Math.floor(part2EndMinutes / 60)).padStart(2, '0')}:${String(part2EndMinutes % 60).padStart(2, '0')}:00`;

        let part2GoogleEventId: string | null = null;
        if (accessToken) {
          try {
            const description = customer_email ? `${customer_email} - ${customer_phone}` : customer_phone;
            part2GoogleEventId = await createCalendarEvent(
              `${customer_name} - ${service.name} (Parte 2)`,
              description,
              part2StartTime,
              part2EndTime,
              accessToken
            );
          } catch (error) {
            console.error('Error creating Google Calendar event for part 2:', error);
          }
        }

        const { data: part2Data, error: part2Error } = await supabase
          .from('bookings')
          .insert({
            customer_name,
            Telefono: normalizedPhone,
            Fecha: bookingDate,
            Hora: part2StartTime,
            end_time: part2EndTime,
            stylist: actualStylist,
            services: [{ name: `${service.name} - Parte 2` }],
            total_duration: part2Duration,
            status: 'confirmed',
            google_calendar_event_id: part2GoogleEventId,
            calendar_id: calendarId,
            is_part_of_compound: true,
            compound_part: 'part2',
            related_booking_id: part1Data.id,
            user_id: bookingData.user_id || null,
            skip_availability_check: bookingData.skipAvailabilityCheck || false,
            tenant_id: tenantId,
          })
          .select()
          .single();

        if (part2Error) {
          console.error('Error saving part 2 booking:', part2Error);
          throw new Error('Failed to save part 2 booking');
        }

        // Update part 1 to reference part 2
        await supabase
          .from('bookings')
          .update({ related_booking_id: part2Data.id })
          .eq('id', part1Data.id);

        createdBookings.push(part1Data, part2Data);
        currentMinutes = part2EndMinutes;
      } else {
        createdBookings.push(part1Data);
      }
    }

    console.log('Bookings created successfully:', createdBookings);

    // Trigger n8n webhook for WhatsApp notification
    if (n8nWebhookUrl) {
      try {
        // Format date for webhook (dd-mm-yyyy) - parse string directly to avoid timezone issues
        const [year, month, day] = bookingDate.split('-');
        const formattedDate = `${day}-${month}-${year}`;
        
        console.log('Triggering webhook:', n8nWebhookUrl);
        await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name,
            Telefono: customer_phone,
            Fecha: formattedDate,
            Hora: bookingTime,
            stylist: actualStylist,
            services: bookingData.services.map(s => s.name),
            bookings: createdBookings,
            canal: bookingData.user_id ? 'WEB' : 'CRM',
            tenant_id: tenantId,
          }),
        });
        console.log('n8n webhook triggered successfully');
      } catch (error) {
        console.error('Error sending webhook:', error);
        // Don't fail the booking if webhook fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        bookings: createdBookings,
        googleEventCreated: createdBookings.some(b => b.google_calendar_event_id !== null)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-booking function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
