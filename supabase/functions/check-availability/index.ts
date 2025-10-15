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
    const crisBookedSlots: Array<{ Hora: string; total_duration: number }> = [];
    const desiBookedSlots: Array<{ Hora: string; total_duration: number }> = [];

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
            const startTimeStr = event.start.dateTime.split('T')[1].substring(0, 8);
            const endTimeStr = event.end.dateTime.split('T')[1].substring(0, 8);
            
            // Calculate duration in minutes
            const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
            const [endHours, endMinutes] = endTimeStr.split(':').map(Number);
            const startTotalMinutes = startHours * 60 + startMinutes;
            const endTotalMinutes = endHours * 60 + endMinutes;
            const durationMinutes = endTotalMinutes - startTotalMinutes;

            const slot = {
              Hora: startTimeStr,
              total_duration: durationMinutes
            };

            // Store in the appropriate array based on stylist
            if (calendar.name === 'cris') {
              crisBookedSlots.push(slot);
            } else {
              desiBookedSlots.push(slot);
            }
          }
        }
      }
    }

    // If stylist is 'any', only block slots where BOTH are busy
    let finalBookedSlots: Array<{ Hora: string; total_duration: number }> = [];
    
    if (stylist === 'any') {
      console.log('Cris booked slots:', crisBookedSlots);
      console.log('Desi booked slots:', desiBookedSlots);
      
      // Convert to minute ranges
      const crisRanges = crisBookedSlots.map(slot => {
        const [hours, minutes] = slot.Hora.split(':').map(Number);
        const start = hours * 60 + minutes;
        return { start, end: start + slot.total_duration };
      });
      
      const desiRanges = desiBookedSlots.map(slot => {
        const [hours, minutes] = slot.Hora.split(':').map(Number);
        const start = hours * 60 + minutes;
        return { start, end: start + slot.total_duration };
      });

      // Find overlapping ranges (where BOTH are busy)
      const blockedRanges: Array<{ start: number; end: number }> = [];
      
      for (let minute = 0; minute < 24 * 60; minute++) {
        const crisBusy = crisRanges.some(range => minute >= range.start && minute < range.end);
        const desiBusy = desiRanges.some(range => minute >= range.start && minute < range.end);
        
        if (crisBusy && desiBusy) {
          const lastRange = blockedRanges[blockedRanges.length - 1];
          if (lastRange && lastRange.end === minute) {
            lastRange.end = minute + 1;
          } else {
            blockedRanges.push({ start: minute, end: minute + 1 });
          }
        }
      }

      // Convert blocked ranges back to slots
      blockedRanges.forEach(range => {
        const hours = Math.floor(range.start / 60);
        const minutes = range.start % 60;
        const horaStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
        finalBookedSlots.push({
          Hora: horaStr,
          total_duration: range.end - range.start
        });
      });

      console.log('Final blocked slots (both busy):', finalBookedSlots);
    } else {
      // For specific stylist, return their booked slots
      finalBookedSlots = stylist === 'cris' ? crisBookedSlots : desiBookedSlots;
    }

    console.log(`Total booked slots found: ${finalBookedSlots.length}`, finalBookedSlots);

    return new Response(
      JSON.stringify({ bookedSlots: finalBookedSlots }),
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
