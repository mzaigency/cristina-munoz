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

interface TenantCredentials {
  google_client_id?: string;
  google_client_secret?: string;
  google_refresh_token?: string;
  google_calendar_id_cris?: string;
  google_calendar_id_desi?: string;
}

function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
}

async function getTenantIdForUser(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('tenant_admins')
    .select('tenant_id')
    .eq('user_id', userId)
    .single();

  if (!data) {
    const { data: stylistData } = await supabase
      .from('tenant_stylists')
      .select('tenant_id')
      .eq('user_id', userId)
      .single();
    return stylistData?.tenant_id || null;
  }

  return data.tenant_id;
}

async function getTenantCredentials(supabase: any, tenantId: string, integrationType: string) {
  const { data } = await supabase
    .from('tenant_integrations')
    .select('credentials_encrypted, settings, is_enabled')
    .eq('tenant_id', tenantId)
    .eq('integration_type', integrationType)
    .single();

  if (!data || !data.is_enabled) return null;
  return data.settings || {};
}

async function getGoogleCalendarCredentials(supabase: any, tenantId: string): Promise<TenantCredentials | null> {
  const credentials = await getTenantCredentials(supabase, tenantId, 'google_calendar');
  
  if (!credentials) {
    return {
      google_client_id: Deno.env.get('GOOGLE_CLIENT_ID'),
      google_client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
      google_refresh_token: Deno.env.get('GOOGLE_REFRESH_TOKEN'),
      google_calendar_id_cris: Deno.env.get('GOOGLE_CALENDAR_ID_CRIS'),
      google_calendar_id_desi: Deno.env.get('GOOGLE_CALENDAR_ID_DESI'),
    };
  }

  return credentials as TenantCredentials;
}

async function getGoogleAccessToken(credentials: TenantCredentials): Promise<string> {
  const { google_client_id, google_client_secret, google_refresh_token } = credentials;

  if (!google_client_id || !google_client_secret || !google_refresh_token) {
    throw new Error('Missing Google Calendar credentials');
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: google_client_id,
      client_secret: google_client_secret,
      refresh_token: google_refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to refresh access token');
  }

  const data: GoogleTokenResponse = await tokenResponse.json();
  return data.access_token;
}

interface TenantStylist {
  slug: string;
  name: string;
  google_calendar_id: string | null;
  is_active: boolean;
}

async function getTenantStylists(supabase: any, tenantId: string): Promise<TenantStylist[]> {
  const { data } = await supabase
    .from('tenant_stylists')
    .select('slug, name, google_calendar_id, is_active')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  return data || [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = getSupabaseClient();
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'stylist', 'superadmin'])
      .single();

    if (!userRole) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestBody = await req.json();
    const { stylist, summary, description, start, end, allDay, tenant_id: requestTenantId } = requestBody;
    
    // Determine tenant ID
    let tenantId: string | null = null;
    
    if (userRole.role === 'superadmin' && requestTenantId) {
      tenantId = requestTenantId;
    } else {
      tenantId = await getTenantIdForUser(supabase, user.id);
    }

    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'No tenant assigned to user' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!stylist || !summary || !start || !end) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: stylist, summary, start, end' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating calendar event for tenant: ${tenantId}`);

    const credentials = await getGoogleCalendarCredentials(supabase, tenantId);
    
    if (!credentials) {
      return new Response(JSON.stringify({ error: 'Google Calendar not configured for this tenant' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = await getGoogleAccessToken(credentials);
    
    // Get tenant stylists for calendar IDs
    const stylists = await getTenantStylists(supabase, tenantId);
    const stylistData = stylists.find(s => s.slug === stylist);
    const calendarId = stylistData?.google_calendar_id || 
      (stylist === 'cris' ? credentials.google_calendar_id_cris : credentials.google_calendar_id_desi);

    if (!calendarId) {
      return new Response(
        JSON.stringify({ error: `Calendar ID not found for stylist: ${stylist}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const event: any = {
      summary,
      description: description || '',
    };

    if (allDay) {
      const startDate = start.split('T')[0];
      let endDateObj = new Date(end.split('T')[0]);
      endDateObj.setDate(endDateObj.getDate() + 1);
      const endDate = endDateObj.toISOString().split('T')[0];
      
      event.start = { date: startDate };
      event.end = { date: endDate };
    } else {
      event.start = { dateTime: start, timeZone: 'Europe/Madrid' };
      event.end = { dateTime: end, timeZone: 'Europe/Madrid' };
    }

    console.log(`Creating event in calendar for ${stylist}:`, JSON.stringify(event, null, 2));

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

    return new Response(JSON.stringify({ event: createdEvent, tenant_id: tenantId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in create-calendar-event:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
