import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingRequest {
  customer_name: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  stylist: string;
  services: Array<{ name: string; duration: number }>;
  total_duration: number;
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
    
    // Get calendar ID based on stylist
    let calendarId: string | null = null;
    if (bookingData.stylist === 'cris') {
      calendarId = Deno.env.get('GOOGLE_CALENDAR_ID_CRIS') || null;
    } else if (bookingData.stylist === 'desi') {
      calendarId = Deno.env.get('GOOGLE_CALENDAR_ID_DESI') || null;
    } else {
      // For 'any' stylist, use Cris calendar as default
      calendarId = Deno.env.get('GOOGLE_CALENDAR_ID_CRIS') || null;
    }

    let googleEventId: string | null = null;

    // Create Google Calendar event if credentials are configured
    if (calendarId && clientId && clientSecret && refreshToken) {
      try {
        // Get access token
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
          throw new Error('Failed to authenticate with Google');
        }

        const { access_token } = await tokenResponse.json();

        // Create calendar event with Madrid timezone
        // Use date-only format to avoid timezone conversion issues
        const startDate = `${bookingData.booking_date}`;
        const startTime = `${bookingData.booking_time}:00`;
        
        // Calculate end time
        const [startHours, startMinutes] = bookingData.booking_time.split(':').map(Number);
        const totalMinutes = startHours * 60 + startMinutes + bookingData.total_duration;
        const endHours = Math.floor(totalMinutes / 60);
        const endMinutes = totalMinutes % 60;
        const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;

        const event = {
          summary: `Cita - ${bookingData.customer_name}`,
          description: `Cliente: ${bookingData.customer_name}\nTeléfono: ${bookingData.customer_phone}\nServicios: ${bookingData.services.map(s => s.name).join(', ')}\nPeluquera: ${bookingData.stylist === 'any' ? 'Cualquiera' : bookingData.stylist.toUpperCase()}`,
          start: {
            dateTime: `${startDate}T${startTime}`,
            timeZone: 'Europe/Madrid',
          },
          end: {
            dateTime: `${startDate}T${endTime}`,
            timeZone: 'Europe/Madrid',
          },
          attendees: [
            {
              email: calendarId,
              displayName: bookingData.stylist === 'cris' ? 'Cris' : bookingData.stylist === 'desi' ? 'Desi' : 'Peluquería',
            },
          ],
        };

        const calendarResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${access_token}`,
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
        googleEventId = calendarEvent.id;
        console.log('Created Google Calendar event:', googleEventId);
      } catch (error) {
        console.error('Error creating Google Calendar event:', error);
        // Continue even if calendar creation fails
      }
    } else {
      console.warn('Google Calendar credentials not configured, skipping calendar event creation');
    }

    // Calculate end time
    const [startHours, startMinutes] = bookingData.booking_time.split(':').map(Number);
    const totalMinutes = startHours * 60 + startMinutes + bookingData.total_duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;

    // Save booking to database with end_time
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        customer_name: bookingData.customer_name,
        customer_phone: bookingData.customer_phone,
        booking_date: bookingData.booking_date,
        booking_time: bookingData.booking_time,
        end_time: endTime,
        stylist: bookingData.stylist,
        services: bookingData.services,
        total_duration: bookingData.total_duration,
        status: 'confirmed',
        google_calendar_event_id: googleEventId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving booking:', error);
      throw new Error('Failed to save booking');
    }

    console.log('Booking created successfully:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        booking: data,
        googleEventCreated: !!googleEventId 
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
