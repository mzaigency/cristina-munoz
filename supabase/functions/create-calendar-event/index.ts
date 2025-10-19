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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'stylist'])
      .single();

    if (!userRole) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { stylist, summary, description, start, end } = await req.json();

    if (!stylist || !summary || !start || !end) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: stylist, summary, start, end' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const accessToken = await getAccessToken();
    const calendarIdCris = Deno.env.get('GOOGLE_CALENDAR_ID_CRIS');
    const calendarIdDesi = Deno.env.get('GOOGLE_CALENDAR_ID_DESI');

    const calendarId = stylist === 'cris' ? calendarIdCris : calendarIdDesi;

    if (!calendarId) {
      return new Response(
        JSON.stringify({ error: `Calendar ID not found for stylist: ${stylist}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const event = {
      summary,
      description: description || '',
      start: {
        dateTime: start,
        timeZone: 'Europe/Madrid',
      },
      end: {
        dateTime: end,
        timeZone: 'Europe/Madrid',
      },
    };

    console.log(`Creating event in calendar for ${stylist}:`, event);

    const createResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error('Error creating event:', error);
      throw new Error(`Failed to create event: ${error}`);
    }

    const createdEvent = await createResponse.json();
    console.log('Event created successfully:', createdEvent.id);

    return new Response(JSON.stringify({ event: createdEvent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in create-calendar-event:', error);
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
