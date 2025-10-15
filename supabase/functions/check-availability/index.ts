import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AvailabilityRequest {
  date: string; // YYYY-MM-DD
  stylist: string; // 'cris', 'desi', or 'any'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date, stylist }: AvailabilityRequest = await req.json();
    console.log(`Checking availability for ${stylist} on ${date}`);

    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const googleRefreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');

    if (!googleClientId || !googleClientSecret || !googleRefreshToken) {
      throw new Error('Missing Google Calendar credentials');
    }

    // Get OAuth2 access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        refresh_token: googleRefreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to get access token:', errorText);
      throw new Error('Failed to authenticate with Google Calendar');
    }

    const { access_token } = await tokenResponse.json();

    // Determine which calendars to check
    const calendarsToCheck = [];
    if (stylist === 'cris' || stylist === 'any') {
      calendarsToCheck.push({
        id: Deno.env.get('GOOGLE_CALENDAR_ID_CRIS'),
        name: 'cris'
      });
    }
    if (stylist === 'desi' || stylist === 'any') {
      calendarsToCheck.push({
        id: Deno.env.get('GOOGLE_CALENDAR_ID_DESI'),
        name: 'desi'
      });
    }

    // Fetch events from each calendar
    const allBookedSlots: Array<{ Hora: string; total_duration: number }> = [];

    for (const calendar of calendarsToCheck) {
      const timeMin = `${date}T00:00:00Z`;
      const timeMax = `${date}T23:59:59Z`;

      const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id!)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`;

      const eventsResponse = await fetch(eventsUrl, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!eventsResponse.ok) {
        const errorText = await eventsResponse.text();
        console.error(`Failed to fetch events from ${calendar.name}:`, errorText);
        continue;
      }

      const eventsData = await eventsResponse.json();
      console.log(`Events from ${calendar.name}:`, JSON.stringify(eventsData.items, null, 2));

      // Convert Google Calendar events to the format expected by the frontend
      if (eventsData.items && eventsData.items.length > 0) {
        for (const event of eventsData.items) {
          if (event.start?.dateTime && event.end?.dateTime) {
            // Extract time directly from the ISO string (format: 2025-10-22T09:00:00+02:00)
            // This preserves the local time in the timezone
            const startTimeStr = event.start.dateTime.split('T')[1].substring(0, 8); // Gets "09:00:00"
            const endTimeStr = event.end.dateTime.split('T')[1].substring(0, 8);
            
            // Calculate duration in minutes
            const [startHours, startMinutes, startSeconds] = startTimeStr.split(':').map(Number);
            const [endHours, endMinutes, endSeconds] = endTimeStr.split(':').map(Number);
            const startTotalMinutes = startHours * 60 + startMinutes;
            const endTotalMinutes = endHours * 60 + endMinutes;
            const durationMinutes = endTotalMinutes - startTotalMinutes;

            allBookedSlots.push({
              Hora: startTimeStr,
              total_duration: durationMinutes
            });
          }
        }
      }
    }

    console.log(`Total booked slots found: ${allBookedSlots.length}`, allBookedSlots);

    return new Response(
      JSON.stringify({ bookedSlots: allBookedSlots }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error checking availability:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        bookedSlots: [] 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
