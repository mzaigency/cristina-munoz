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

    console.log(`\n=== Checking availability for ${stylist} on ${date} ===`);
    console.log(`Calendars to check: ${calendarsToCheck.map(c => c.name).join(', ')}`);

    for (const calendar of calendarsToCheck) {
      // Use local timezone (Europe/Madrid) for the date range
      const timeMin = `${date}T00:00:00+01:00`;
      const timeMax = `${date}T23:59:59+01:00`;

      const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id!)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true`;

      console.log(`\nFetching from ${calendar.name}: ${eventsUrl}`);

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
      
      const eventCount = eventsData.items?.length || 0;
      console.log(`\n--- ${calendar.name.toUpperCase()} Calendar ---`);
      console.log(`Found ${eventCount} event(s)`);

      // Convert Google Calendar events to the format expected by the frontend
      if (eventsData.items && eventsData.items.length > 0) {
        for (const event of eventsData.items) {
          console.log(`\nEvent: "${event.summary}"`);
          console.log(`  Start:`, event.start);
          console.log(`  End:`, event.end);
          
          // Check for all-day events (vacations, blocked periods, etc.)
          if (event.start?.date) {
            console.log(`  Type: ALL-DAY EVENT (blocking full day)`);
            
            // Check if this all-day event covers the requested date
            const eventStartDate = event.start.date;
            const eventEndDate = event.end.date;
            
            console.log(`  Checking if ${date} is between ${eventStartDate} and ${eventEndDate}`);
            
            // Google Calendar all-day events have exclusive end dates
            // So if end is "2025-10-23", the event covers up to but not including Oct 23
            if (date >= eventStartDate && date < eventEndDate) {
              console.log(`  ✓ Date ${date} IS within blocked period`);
              // This is an all-day event covering our target date
              // Block all business hours (9:00 to 21:00)
              for (let hour = 9; hour <= 20; hour++) {
                const slot = {
                  Hora: `${String(hour).padStart(2, '0')}:00:00`,
                  total_duration: 60
                };

                if (calendar.name === 'cris') {
                  crisBookedSlots.push(slot);
                } else {
                  desiBookedSlots.push(slot);
                }
              }
              console.log(`  Added ${12} hourly blocks from 09:00 to 20:00`);
            } else {
              console.log(`  ✗ Date ${date} is NOT within this blocked period`);
            }
          } else if (event.start?.dateTime && event.end?.dateTime) {
            console.log(`  Type: TIMED EVENT`);
            // Regular time-specific event
            const startTimeStr = event.start.dateTime.split('T')[1].substring(0, 8);
            const endTimeStr = event.end.dateTime.split('T')[1].substring(0, 8);
            
            const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
            const [endHours, endMinutes] = endTimeStr.split(':').map(Number);
            const startTotalMinutes = startHours * 60 + startMinutes;
            const endTotalMinutes = endHours * 60 + endMinutes;
            const durationMinutes = endTotalMinutes - startTotalMinutes;

            const slot = {
              Hora: startTimeStr,
              total_duration: durationMinutes
            };

            if (calendar.name === 'cris') {
              crisBookedSlots.push(slot);
            } else {
              desiBookedSlots.push(slot);
            }
            
            console.log(`  Added slot: ${startTimeStr} (${durationMinutes} min)`);
          }
        }
      }
      
      console.log(`\n${calendar.name} total slots: ${calendar.name === 'cris' ? crisBookedSlots.length : desiBookedSlots.length}`);
    }

    console.log(`\n=== Summary ===`);
    console.log(`Cris total blocked slots: ${crisBookedSlots.length}`);
    console.log(`Desi total blocked slots: ${desiBookedSlots.length}`);

    // If stylist is 'any', only block slots where BOTH are busy
    let finalBookedSlots: Array<{ Hora: string; total_duration: number }> = [];
    
    if (stylist === 'any') {
      console.log('\nProcessing for "any" stylist (both must be busy)');
      
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

      console.log(`Final blocked slots (both busy): ${finalBookedSlots.length}`);
    } else {
      // For specific stylist, return their booked slots
      finalBookedSlots = stylist === 'cris' ? crisBookedSlots : desiBookedSlots;
      console.log(`Final blocked slots for ${stylist}: ${finalBookedSlots.length}`);
    }

    console.log(`\n=== Returning ${finalBookedSlots.length} blocked slots ===\n`);

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