import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { format } from "https://esm.sh/date-fns@3.6.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingRequest {
  customer_name: string;
  Telefono: string;
  Fecha: string;
  Hora: string;
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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bookingData: BookingRequest = await req.json();
    console.log('Creating booking:', bookingData);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Google Calendar credentials
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');
    
    // Determine actual stylist for "any" selection
    let actualStylist = bookingData.stylist;
    
    if (bookingData.stylist === 'any') {
      // Get OAuth2 access token first
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          refresh_token: refreshToken!,
          grant_type: 'refresh_token',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to authenticate with Google Calendar');
      }

      const { access_token } = await tokenResponse.json();

      // Calculate time range for the booking
      const [startHours, startMinutes] = bookingData.Hora.split(':').map(Number);
      const startMinutesTotal = startHours * 60 + startMinutes;
      const endMinutesTotal = startMinutesTotal + bookingData.total_duration;
      
      // Check Cris calendar
      const crisCalendarId = Deno.env.get('GOOGLE_CALENDAR_ID_CRIS');
      const timeMin = `${bookingData.Fecha}T00:00:00Z`;
      const timeMax = `${bookingData.Fecha}T23:59:59Z`;

      const crisEventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(crisCalendarId!)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`;
      const crisResponse = await fetch(crisEventsUrl, {
        headers: { 'Authorization': `Bearer ${access_token}` },
      });
      
      const crisEvents = await crisResponse.json();
      const crisAvailable = !crisEvents.items?.some((event: any) => {
        // Check for all-day events (vacations, etc.)
        if (event.start?.date) {
          return true; // All-day event blocks the entire day
        }
        // Check for time-specific events
        if (!event.start?.dateTime || !event.end?.dateTime) return false;
        const startTimeStr = event.start.dateTime.split('T')[1].substring(0, 5);
        const endTimeStr = event.end.dateTime.split('T')[1].substring(0, 5);
        const [eStartH, eStartM] = startTimeStr.split(':').map(Number);
        const [eEndH, eEndM] = endTimeStr.split(':').map(Number);
        const eStart = eStartH * 60 + eStartM;
        const eEnd = eEndH * 60 + eEndM;
        return (startMinutesTotal < eEnd && endMinutesTotal > eStart);
      });

      // Check Desi calendar
      const desiCalendarId = Deno.env.get('GOOGLE_CALENDAR_ID_DESI');
      const desiEventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(desiCalendarId!)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`;
      const desiResponse = await fetch(desiEventsUrl, {
        headers: { 'Authorization': `Bearer ${access_token}` },
      });
      
      const desiEvents = await desiResponse.json();
      const desiAvailable = !desiEvents.items?.some((event: any) => {
        // Check for all-day events (vacations, etc.)
        if (event.start?.date) {
          return true; // All-day event blocks the entire day
        }
        // Check for time-specific events
        if (!event.start?.dateTime || !event.end?.dateTime) return false;
        const startTimeStr = event.start.dateTime.split('T')[1].substring(0, 5);
        const endTimeStr = event.end.dateTime.split('T')[1].substring(0, 5);
        const [eStartH, eStartM] = startTimeStr.split(':').map(Number);
        const [eEndH, eEndM] = endTimeStr.split(':').map(Number);
        const eStart = eStartH * 60 + eStartM;
        const eEnd = eEndH * 60 + eEndM;
        return (startMinutesTotal < eEnd && endMinutesTotal > eStart);
      });
      
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
      calendarId = Deno.env.get('GOOGLE_CALENDAR_ID_CRIS') || null;
    } else if (actualStylist === 'desi') {
      calendarId = Deno.env.get('GOOGLE_CALENDAR_ID_DESI') || null;
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
      const event = {
        summary,
        description,
        start: {
          dateTime: `${bookingData.Fecha}T${startTime}`,
          timeZone: 'Europe/Madrid',
        },
        end: {
          dateTime: `${bookingData.Fecha}T${endTime}`,
          timeZone: 'Europe/Madrid',
        },
        attendees: [
          {
            email: calendarId,
            displayName: actualStylist === 'cris' ? 'Cris' : actualStylist === 'desi' ? 'Desi' : 'Peluquería',
          },
        ],
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
    if (calendarId && clientId && clientSecret && refreshToken) {
      try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
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

    const [startHours, startMinutes] = bookingData.Hora.split(':').map(Number);
    let currentMinutes = startHours * 60 + startMinutes;

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
          googleEventId = await createCalendarEvent(
            `Cita - ${bookingData.customer_name}`,
            `Cliente: ${bookingData.customer_name}\nTeléfono: ${bookingData.Telefono}\nServicios: ${simpleServices.map(s => s.name).join(', ')}\nPeluquera: ${actualStylist.toUpperCase()}`,
            `${bookingData.Hora}:00`,
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
          customer_name: bookingData.customer_name,
          Telefono: bookingData.Telefono,
          Fecha: bookingData.Fecha,
          Hora: bookingData.Hora,
          end_time: endTime,
          stylist: actualStylist,
          services: simpleServices.map(s => ({ name: s.name })),
          total_duration: simpleDuration,
          status: 'confirmed',
          google_calendar_event_id: googleEventId,
          calendar_id: calendarId,
          is_part_of_compound: false,
          user_id: bookingData.user_id || null,
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
          part1GoogleEventId = await createCalendarEvent(
            `${service.name} - Parte 1 - ${bookingData.customer_name}`,
            `Cliente: ${bookingData.customer_name}\nTeléfono: ${bookingData.Telefono}\nServicio: ${service.name} (Parte 1)\nPeluquera: ${actualStylist.toUpperCase()}`,
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
          customer_name: bookingData.customer_name,
          Telefono: bookingData.Telefono,
          Fecha: bookingData.Fecha,
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
            part2GoogleEventId = await createCalendarEvent(
              `${service.name} - Parte 2 - ${bookingData.customer_name}`,
              `Cliente: ${bookingData.customer_name}\nTeléfono: ${bookingData.Telefono}\nServicio: ${service.name} (Parte 2)\nPeluquera: ${actualStylist.toUpperCase()}`,
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
            customer_name: bookingData.customer_name,
            Telefono: bookingData.Telefono,
            Fecha: bookingData.Fecha,
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

    // Trigger n8n webhook for WhatsApp notification (non-blocking)
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    if (n8nWebhookUrl) {
      try {
        // Format date for webhook (dd-mm-yyyy)
        const formattedDate = format(new Date(bookingData.Fecha), 'dd-MM-yyyy');
        
        fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: bookingData.customer_name,
            Telefono: bookingData.Telefono,
            Fecha: formattedDate,
            Hora: bookingData.Hora,
            stylist: actualStylist,
            services: bookingData.services.map(s => s.name),
            bookings: createdBookings,
          }),
        }).catch(err => console.error('Error triggering n8n webhook:', err));
      } catch (error) {
        console.error('Error sending webhook:', error);
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
