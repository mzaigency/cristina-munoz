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
  n8n_webhook_url?: string;
  n8n_send_whatsapp_webhook?: string;
  n8n_cancel_webhook_url?: string;
}

interface TenantIntegration {
  integration_type: string;
  is_enabled: boolean;
  credentials_encrypted: string | null;
  settings: Record<string, any>;
}

// Get Supabase client with service role
function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
}

// Get tenant ID from user
async function getTenantIdForUser(supabase: any, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('tenant_admins')
    .select('tenant_id')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    // Try tenant_stylists
    const { data: stylistData } = await supabase
      .from('tenant_stylists')
      .select('tenant_id')
      .eq('user_id', userId)
      .single();
    
    return stylistData?.tenant_id || null;
  }

  return data.tenant_id;
}

// Get tenant credentials from tenant_integrations
async function getTenantCredentials(
  supabase: any, 
  tenantId: string, 
  integrationType: string
): Promise<Record<string, any> | null> {
  const { data, error } = await supabase
    .from('tenant_integrations')
    .select('credentials_encrypted, settings, is_enabled')
    .eq('tenant_id', tenantId)
    .eq('integration_type', integrationType)
    .single();

  if (error || !data || !data.is_enabled) {
    console.log(`Integration ${integrationType} not found or disabled for tenant ${tenantId}`);
    return null;
  }

  // For now, credentials are stored in settings as we implement encryption later
  // In production, we would decrypt credentials_encrypted
  return data.settings || {};
}

// Get all Google Calendar credentials for a tenant
async function getGoogleCalendarCredentials(supabase: any, tenantId: string): Promise<TenantCredentials | null> {
  const credentials = await getTenantCredentials(supabase, tenantId, 'google_calendar');
  
  if (!credentials) {
    // Fallback to environment variables for backward compatibility
    console.log('Using fallback environment variables for Google Calendar');
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

// Get n8n webhook credentials for a tenant
async function getN8nCredentials(supabase: any, tenantId: string): Promise<TenantCredentials | null> {
  const credentials = await getTenantCredentials(supabase, tenantId, 'n8n_webhooks');
  
  if (!credentials) {
    // Fallback to environment variables
    console.log('Using fallback environment variables for n8n webhooks');
    return {
      n8n_webhook_url: Deno.env.get('N8N_WEBHOOK_URL'),
      n8n_send_whatsapp_webhook: Deno.env.get('N8N_SEND_WHATSAPP_MESSAGE_WEBHOOK'),
      n8n_cancel_webhook_url: Deno.env.get('N8N_CANCEL_WEBHOOK_URL'),
    };
  }

  return credentials as TenantCredentials;
}

// Get Google access token using tenant credentials
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
    const error = await tokenResponse.text();
    console.error('Token refresh error:', error);
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

// Get tenant stylists with their calendar IDs
async function getTenantStylists(supabase: any, tenantId: string): Promise<TenantStylist[]> {
  const { data, error } = await supabase
    .from('tenant_stylists')
    .select('slug, name, google_calendar_id, is_active')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching tenant stylists:', error);
    return [];
  }

  return data || [];
}

// Check if user is superadmin
async function isSuperAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'superadmin')
    .single();

  return !!data;
}

Deno.serve(async (req) => {
  console.log('list-calendar-events function called');
  
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

    // Check user role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'stylist', 'superadmin'])
      .single();

    if (!userRole) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin, stylist or superadmin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { calendarId, timeMin, timeMax, tenant_id: requestTenantId } = await req.json();
    
    // Determine tenant ID
    let tenantId: string | null = null;
    
    if (userRole.role === 'superadmin' && requestTenantId) {
      // Superadmin can specify tenant
      tenantId = requestTenantId;
    } else {
      // Regular users get their assigned tenant
      tenantId = await getTenantIdForUser(supabase, user.id);
    }

    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'No tenant assigned to user' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching calendar events for tenant: ${tenantId}`);

    // Get Google Calendar credentials for this tenant
    const credentials = await getGoogleCalendarCredentials(supabase, tenantId);
    
    if (!credentials) {
      return new Response(JSON.stringify({ error: 'Google Calendar not configured for this tenant' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = await getGoogleAccessToken(credentials);
    
    // Get tenant stylists
    const stylists = await getTenantStylists(supabase, tenantId);
    
    // If no stylists have calendar IDs configured, fallback to credentials
    const calendarIdCris = stylists.find(s => s.slug === 'cris')?.google_calendar_id || credentials.google_calendar_id_cris;
    const calendarIdDesi = stylists.find(s => s.slug === 'desi')?.google_calendar_id || credentials.google_calendar_id_desi;

    let calendarsToFetch: { id: string; stylist: string }[] = [];

    if (calendarId === 'all') {
      if (calendarIdCris) calendarsToFetch.push({ id: calendarIdCris, stylist: 'cris' });
      if (calendarIdDesi) calendarsToFetch.push({ id: calendarIdDesi, stylist: 'desi' });
    } else if (calendarId === 'cris' && calendarIdCris) {
      calendarsToFetch = [{ id: calendarIdCris, stylist: 'cris' }];
    } else if (calendarId === 'desi' && calendarIdDesi) {
      calendarsToFetch = [{ id: calendarIdDesi, stylist: 'desi' }];
    }

    if (calendarsToFetch.length === 0) {
      return new Response(JSON.stringify({ events: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allEvents = [];

    for (const calendar of calendarsToFetch) {
      const params = new URLSearchParams({
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      const eventsResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?${params}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!eventsResponse.ok) {
        console.error(`Error fetching events for ${calendar.stylist}:`, await eventsResponse.text());
        continue;
      }

      const eventsData = await eventsResponse.json();
      const eventsWithStylist = (eventsData.items || []).map((event: any) => ({
        ...event,
        stylist: calendar.stylist,
        calendarId: calendar.id,
        tenant_id: tenantId,
      }));

      allEvents.push(...eventsWithStylist);
    }

    // Sort all events by start time
    allEvents.sort((a, b) => {
      const aStart = a.start?.dateTime || a.start?.date;
      const bStart = b.start?.dateTime || b.start?.date;
      return new Date(aStart).getTime() - new Date(bStart).getTime();
    });

    console.log(`Retrieved ${allEvents.length} total events for tenant ${tenantId}`);

    return new Response(JSON.stringify({ events: allEvents }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in list-calendar-events:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
