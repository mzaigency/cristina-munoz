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

async function getGoogleCalendarCredentials(supabase: any, tenantId: string): Promise<TenantCredentials> {
  const { data } = await supabase
    .from('tenant_integrations')
    .select('settings, is_enabled')
    .eq('tenant_id', tenantId)
    .eq('integration_type', 'google_calendar')
    .single();

  if (!data || !data.is_enabled) {
    return {
      google_client_id: Deno.env.get('GOOGLE_CLIENT_ID'),
      google_client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
      google_refresh_token: Deno.env.get('GOOGLE_REFRESH_TOKEN'),
    };
  }

  return data.settings || {};
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

    const { eventId, calendarId, summary, description, start, end, tenant_id: requestTenantId } = await req.json();

    if (!eventId || !calendarId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: eventId, calendarId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    console.log(`Updating calendar event for tenant: ${tenantId}`);

    const credentials = await getGoogleCalendarCredentials(supabase, tenantId);
    const accessToken = await getGoogleAccessToken(credentials);

    // Build the update object
    const updateData: any = {};
    
    if (summary) updateData.summary = summary;
    if (description !== undefined) updateData.description = description;
    if (start) {
      updateData.start = { dateTime: start, timeZone: 'Europe/Madrid' };
    }
    if (end) {
      updateData.end = { dateTime: end, timeZone: 'Europe/Madrid' };
    }

    console.log(`Updating event ${eventId}:`, updateData);

    const updateResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.error('Error updating event:', error);
      throw new Error(`Failed to update event: ${error}`);
    }

    const updatedEvent = await updateResponse.json();
    console.log('Event updated successfully:', updatedEvent.id);

    return new Response(JSON.stringify({ event: updatedEvent, tenant_id: tenantId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in update-calendar-event:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
