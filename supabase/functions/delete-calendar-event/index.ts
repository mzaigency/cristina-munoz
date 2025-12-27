import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { format } from 'https://esm.sh/date-fns@3.6.0';

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
  n8n_cancel_webhook_url?: string;
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

async function getN8nCredentials(supabase: any, tenantId: string): Promise<TenantCredentials> {
  const { data } = await supabase
    .from('tenant_integrations')
    .select('settings, is_enabled')
    .eq('tenant_id', tenantId)
    .eq('integration_type', 'n8n_webhooks')
    .single();

  if (!data || !data.is_enabled) {
    return {
      n8n_cancel_webhook_url: Deno.env.get('N8N_CANCEL_WEBHOOK_URL'),
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

    const { eventId, calendarId, tenant_id: requestTenantId } = await req.json();

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

    // Get bookings from database
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('google_calendar_event_id', eventId);

    if (fetchError) {
      console.error('Error fetching bookings:', fetchError);
      throw new Error('Failed to fetch bookings from database');
    }

    // Use tenant_id from booking if available
    if (bookings && bookings.length > 0 && bookings[0].tenant_id) {
      tenantId = bookings[0].tenant_id;
    }

    // Get related bookings
    const relatedBookingIds = bookings
      ?.filter(b => b.is_part_of_compound && b.related_booking_id)
      .map(b => b.related_booking_id)
      .filter(Boolean) || [];

    let relatedBookings: any[] = [];
    if (relatedBookingIds.length > 0) {
      const { data: related } = await supabase
        .from('bookings')
        .select('*')
        .in('id', relatedBookingIds);
      relatedBookings = related || [];
    }

    const allBookings = [...(bookings || []), ...relatedBookings];

    // Get Google Calendar credentials for this tenant
    const credentials = await getGoogleCalendarCredentials(supabase, tenantId || '');
    const accessToken = await getGoogleAccessToken(credentials);

    console.log(`Deleting event ${eventId} from calendar for tenant ${tenantId}`);

    const deleteResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      const error = await deleteResponse.text();
      console.error('Error deleting event:', error);
      throw new Error(`Failed to delete event: ${error}`);
    }

    console.log('Event deleted from Google Calendar successfully');

    // Delete related calendar events
    for (const booking of relatedBookings) {
      if (booking.google_calendar_event_id && booking.calendar_id) {
        try {
          await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(booking.calendar_id)}/events/${booking.google_calendar_event_id}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          console.log('Related calendar event deleted:', booking.google_calendar_event_id);
        } catch (error) {
          console.error('Error deleting related calendar event:', error);
        }
      }
    }

    // Delete from database
    if (allBookings.length > 0) {
      const allBookingIds = allBookings.map(b => b.id);

      await supabase
        .from('bookings')
        .update({ related_booking_id: null })
        .in('id', allBookingIds);

      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .in('id', allBookingIds);

      if (deleteError) {
        console.error('Error deleting bookings from database:', deleteError);
        throw new Error('Failed to delete bookings from database');
      }

      console.log('Bookings deleted from database successfully');

      // Trigger n8n cancellation webhook
      const n8nCredentials = await getN8nCredentials(supabase, tenantId || '');
      const cancelWebhookUrl = n8nCredentials.n8n_cancel_webhook_url;
      
      if (cancelWebhookUrl && bookings && bookings.length > 0) {
        try {
          const webhookData = bookings.map(booking => {
            const dateStr = booking.Fecha.toString();
            const [year, month, day] = dateStr.split('-');
            const formattedDate = `${day}-${month}-${year}`;
            
            return {
              booking_id: booking.id,
              customer_name: booking.customer_name,
              Telefono: booking.Telefono,
              Fecha: formattedDate,
              Hora: booking.Hora,
              stylist: booking.stylist,
              services: booking.services,
              google_calendar_event_id: booking.google_calendar_event_id,
              calendar_id: booking.calendar_id,
              tenant_id: booking.tenant_id,
            };
          });

          await fetch(cancelWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'cancellation',
              bookings: webhookData,
              user: 'admin',
              tenant_id: tenantId,
            }),
          });

          console.log('n8n cancellation webhook triggered successfully');
        } catch (error) {
          console.error('Error sending cancellation webhook:', error);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, tenant_id: tenantId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in delete-calendar-event:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
