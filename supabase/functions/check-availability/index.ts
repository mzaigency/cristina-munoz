import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from 'https://esm.sh/zod@3.22.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema
const availabilityRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  stylist: z.enum(['cris', 'desi', 'any']),
  totalDuration: z.number().int().min(0).max(960).optional()
});

interface AvailabilityRequest {
  date: string; // YYYY-MM-DD
  stylist: string; // 'cris', 'desi', or 'any'
  totalDuration?: number; // Total duration in minutes (optional, for 'any' validation)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();
    
    // Validate input
    const validationResult = availabilityRequestSchema.safeParse(rawData);
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
    
    const { date, stylist, totalDuration }: AvailabilityRequest = validationResult.data;
    console.log(`\n>>> Checking availability for ${stylist} on ${date}${totalDuration ? ` (duration: ${totalDuration}min)` : ''}`);

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

    console.log(`Checking calendars: ${calendarsToCheck.map(c => c.name).join(', ')}`);

    // Fetch events from each calendar
    const crisBookedSlots: Array<{ Hora: string; total_duration: number }> = [];
    const desiBookedSlots: Array<{ Hora: string; total_duration: number }> = [];

    for (const calendar of calendarsToCheck) {
      // Query Google Calendar API using UTC timestamps
      // The API will return events with their original timezone information
      const timeMin = `${date}T00:00:00Z`;
      const timeMax = `${date}T23:59:59Z`;

      const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id!)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`;
      
      console.log(`Fetching from ${calendar.name}: ${eventsUrl}`);

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
      const events = eventsData.items || [];
      
      console.log(`\n${calendar.name.toUpperCase()}: Found ${events.length} event(s)`);

      for (const event of events) {
        // ALL-DAY EVENTS (vacations, blocked periods)
        if (event.start?.date) {
          const eventStart = event.start.date; // YYYY-MM-DD
          const eventEnd = event.end.date;     // YYYY-MM-DD (exclusive)
          
          console.log(`  All-day: "${event.summary}" from ${eventStart} to ${eventEnd}`);
          
          // Check if our target date is within this all-day event
          // Remember: end date is exclusive, so "2025-10-23" means up to but not including Oct 23
          if (date >= eventStart && date < eventEnd) {
            console.log(`  ✓ BLOCKING ${date} - creating hourly slots`);
            
            // Block all business hours (8:00 to 20:00 = 13 slots)
            for (let hour = 8; hour <= 20; hour++) {
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
          } else {
            console.log(`  ✗ Not blocking ${date}`);
          }
        }
        // TIMED EVENTS (regular appointments)
        else if (event.start?.dateTime && event.end?.dateTime) {
          const startTimeStr = event.start.dateTime.split('T')[1].substring(0, 8);
          const endTimeStr = event.end.dateTime.split('T')[1].substring(0, 8);
          
          const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
          const [endHours, endMinutes] = endTimeStr.split(':').map(Number);
          const durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);

          const slot = {
            Hora: startTimeStr,
            total_duration: durationMinutes
          };

          if (calendar.name === 'cris') {
            crisBookedSlots.push(slot);
          } else {
            desiBookedSlots.push(slot);
          }
          
          console.log(`  Timed: "${event.summary}" at ${startTimeStr} (${durationMinutes}min)`);
        }
      }
    }

    console.log(`\nTotal blocked: Cris=${crisBookedSlots.length}, Desi=${desiBookedSlots.length}`);

    // Determine final blocked slots based on stylist selection
    let finalBookedSlots: Array<{ Hora: string; total_duration: number }> = [];
    
    if (stylist === 'any') {
      console.log('Processing "any" stylist');
      
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

      // Helper function to check if a stylist has continuous availability
      const hasContiguousAvailability = (ranges: Array<{ start: number; end: number }>, startMinute: number, durationMinutes: number): boolean => {
        const endMinute = startMinute + durationMinutes;
        
        // Check if any booked range overlaps with the requested time block
        for (const range of ranges) {
          // Overlap occurs if:
          // - Range starts before our block ends AND
          // - Range ends after our block starts
          if (range.start < endMinute && range.end > startMinute) {
            return false; // There's an overlap, not available
          }
        }
        
        return true; // No overlaps, available
      };

      if (totalDuration) {
        // Validate continuous availability for the total duration
        console.log(`Validating continuous ${totalDuration}min blocks`);
        
        const blockedRanges: Array<{ start: number; end: number }> = [];
        
        // Check every minute of the day as potential start time
        for (let minute = 0; minute < 24 * 60; minute++) {
          const crisAvailable = hasContiguousAvailability(crisRanges, minute, totalDuration);
          const desiAvailable = hasContiguousAvailability(desiRanges, minute, totalDuration);
          
          // If NEITHER stylist has continuous availability, block this start time
          if (!crisAvailable && !desiAvailable) {
            const lastRange = blockedRanges[blockedRanges.length - 1];
            if (lastRange && lastRange.end === minute) {
              lastRange.end = minute + 1;
            } else {
              blockedRanges.push({ start: minute, end: minute + 1 });
            }
          }
        }
        
        // Convert ranges back to slots
        for (const range of blockedRanges) {
          const hours = Math.floor(range.start / 60);
          const minutes = range.start % 60;
          finalBookedSlots.push({
            Hora: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`,
            total_duration: range.end - range.start
          });
        }
        
        console.log(`Blocked ${blockedRanges.length} time ranges (no stylist available for ${totalDuration}min)`);
      } else {
        // Original logic: block only when BOTH are busy
        console.log('No duration specified - blocking only when both busy');
        
        const blockedRanges: Array<{ start: number; end: number }> = [];
        
        for (let minute = 0; minute < 24 * 60; minute++) {
          const crisBusy = crisRanges.some(r => minute >= r.start && minute < r.end);
          const desiBusy = desiRanges.some(r => minute >= r.start && minute < r.end);
          
          if (crisBusy && desiBusy) {
            const lastRange = blockedRanges[blockedRanges.length - 1];
            if (lastRange && lastRange.end === minute) {
              lastRange.end = minute + 1;
            } else {
              blockedRanges.push({ start: minute, end: minute + 1 });
            }
          }
        }

        // Convert ranges back to slots
        for (const range of blockedRanges) {
          const hours = Math.floor(range.start / 60);
          const minutes = range.start % 60;
          finalBookedSlots.push({
            Hora: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`,
            total_duration: range.end - range.start
          });
        }
      }
    } else {
      // For specific stylist, return their booked slots
      finalBookedSlots = stylist === 'cris' ? crisBookedSlots : desiBookedSlots;
    }

    console.log(`Returning ${finalBookedSlots.length} blocked slots\n<<<\n`);

    return new Response(
      JSON.stringify({ bookedSlots: finalBookedSlots }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('ERROR:', error);
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