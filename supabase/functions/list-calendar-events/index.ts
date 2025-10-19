import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google Calendar credentials');
  }

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
    const error = await tokenResponse.text();
    console.error('Token refresh error:', error);
    throw new Error('Failed to refresh access token');
  }

  const data: GoogleTokenResponse = await tokenResponse.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  console.log('list-calendar-events function called');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Creating Supabase client...');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    console.log('Getting user...');
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      console.error('No user found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User found:', user.id);

    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'stylist'])
      .single();

    console.log('User role:', userRole);

    if (!userRole) {
      console.error('User does not have admin or stylist role');
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Parsing request body...');
    const { calendarId, timeMin, timeMax } = await req.json();
    console.log('Calendar ID:', calendarId, 'TimeMin:', timeMin, 'TimeMax:', timeMax);

    console.log('Getting access token...');
    const accessToken = await getAccessToken();
    console.log('Access token obtained');
    
    const calendarIdCris = Deno.env.get('GOOGLE_CALENDAR_ID_CRIS');
    const calendarIdDesi = Deno.env.get('GOOGLE_CALENDAR_ID_DESI');

    console.log('Calendar IDs - Cris:', calendarIdCris, 'Desi:', calendarIdDesi);

    let calendarsToFetch: { id: string; stylist: string }[] = [];

    if (calendarId === 'all') {
      calendarsToFetch = [
        { id: calendarIdCris!, stylist: 'cris' },
        { id: calendarIdDesi!, stylist: 'desi' },
      ];
    } else if (calendarId === 'cris') {
      calendarsToFetch = [{ id: calendarIdCris!, stylist: 'cris' }];
    } else if (calendarId === 'desi') {
      calendarsToFetch = [{ id: calendarIdDesi!, stylist: 'desi' }];
    }

    console.log('Calendars to fetch:', calendarsToFetch.length);

    const allEvents = [];

    for (const calendar of calendarsToFetch) {
      const params = new URLSearchParams({
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      console.log(`Fetching events from calendar: ${calendar.stylist}`);

      const eventsResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!eventsResponse.ok) {
        const error = await eventsResponse.text();
        console.error(`Error fetching events for ${calendar.stylist}:`, error);
        continue;
      }

      const eventsData = await eventsResponse.json();
      const eventsWithStylist = (eventsData.items || []).map((event: any) => ({
        ...event,
        stylist: calendar.stylist,
        calendarId: calendar.id,
      }));

      allEvents.push(...eventsWithStylist);
    }

    // Sort all events by start time
    allEvents.sort((a, b) => {
      const aStart = a.start?.dateTime || a.start?.date;
      const bStart = b.start?.dateTime || b.start?.date;
      return new Date(aStart).getTime() - new Date(bStart).getTime();
    });

    console.log(`Retrieved ${allEvents.length} total events`);

    return new Response(JSON.stringify({ events: allEvents }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in list-calendar-events:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
