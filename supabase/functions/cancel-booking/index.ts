import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleCalendarCredentials {
  client_id: string;
  client_secret: string;
  refresh_token: string;
}

// Helper function to get tenant credentials
async function getTenantCredentials(
  supabase: any, 
  tenantId: string, 
  integrationType: string
): Promise<{ credentials: any; settings: any } | null> {
  const { data: integration, error } = await supabase
    .from('tenant_integrations')
    .select('credentials_encrypted, settings, is_enabled')
    .eq('tenant_id', tenantId)
    .eq('integration_type', integrationType)
    .eq('is_enabled', true)
    .maybeSingle();

  if (error || !integration) {
    console.log(`No ${integrationType} integration found for tenant ${tenantId}`);
    return null;
  }

  let credentials = null;
  if (integration.credentials_encrypted) {
    const { data: decrypted } = await supabase.rpc('decrypt_sensitive_data', {
      _ciphertext: integration.credentials_encrypted,
      _tenant_id: tenantId
    });
    if (decrypted) {
      try {
        credentials = JSON.parse(decrypted);
      } catch (e) {
        console.error('Error parsing credentials:', e);
      }
    }
  }

  return { credentials, settings: integration.settings || {} };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the JWT token from the request header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log('Authenticated user:', user.id);

    // Check if user has admin or stylist role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'stylist', 'superadmin']);

    const isAdminOrStylist = roleData && roleData.length > 0;
    const isSuperAdmin = roleData?.some(r => r.role === 'superadmin');
    console.log('User is admin/stylist:', isAdminOrStylist, 'SuperAdmin:', isSuperAdmin);

    const { bookingId, bookingIds, user: cancelUser = 'client', tenant_id: requestTenantId } = await req.json();

    // Handle both single and multiple bookings
    const idsToCancel = bookingIds || [bookingId];
    
    console.log('Cancelling bookings:', { idsToCancel });

    // Get all booking details before deleting
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .in('id', idsToCancel);

    if (fetchError || !bookings || bookings.length === 0) {
      console.error('Error fetching bookings:', fetchError);
      throw new Error('Bookings not found');
    }

    // Determine tenant_id from the first booking
    const tenantId = requestTenantId || bookings[0].tenant_id;
    console.log('Using tenant_id:', tenantId);

    // Verify ownership: user must own all bookings OR be admin/stylist
    if (!isAdminOrStylist) {
      const unauthorizedBookings = bookings.filter(booking => booking.user_id !== user.id);
      if (unauthorizedBookings.length > 0) {
        console.error('User does not own all bookings. Unauthorized booking IDs:', unauthorizedBookings.map(b => b.id));
        return new Response(
          JSON.stringify({ error: 'No tienes permiso para cancelar esta cita' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }
    }

    console.log('Authorization verified, proceeding with cancellation');

    // Collect all related bookings
    const relatedBookingIds = bookings
      .filter(b => b.is_part_of_compound && b.related_booking_id)
      .map(b => b.related_booking_id)
      .filter(Boolean);

    let relatedBookings = [];
    if (relatedBookingIds.length > 0) {
      const { data: related } = await supabase
        .from('bookings')
        .select('*')
        .in('id', relatedBookingIds);
      relatedBookings = related || [];
    }

    const allBookings = [...bookings, ...relatedBookings];

    // Get Google Calendar credentials from tenant_integrations
    let googleCreds: GoogleCalendarCredentials | null = null;
    
    if (tenantId) {
      const gcalIntegration = await getTenantCredentials(supabase, tenantId, 'google_calendar');
      if (gcalIntegration?.credentials) {
        googleCreds = gcalIntegration.credentials;
        console.log('Using tenant Google Calendar integration');
      }
    }
    
    // Fallback to environment variables
    if (!googleCreds) {
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
      const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');
      
      if (clientId && clientSecret && refreshToken) {
        googleCreds = { client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken };
        console.log('Using environment Google Calendar credentials (fallback)');
      }
    }

    // Helper function to delete Google Calendar event
    const deleteGoogleCalendarEvent = async (eventId: string, calId: string) => {
      if (!googleCreds) {
        console.log('No Google Calendar credentials available, skipping calendar event deletion');
        return;
      }
      
      try {
        // Get access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: googleCreds.client_id,
            client_secret: googleCreds.client_secret,
            refresh_token: googleCreds.refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to get access token');
        }

        const { access_token } = await tokenResponse.json();

        // Delete the event from Google Calendar
        const deleteUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${eventId}`;
        const deleteResponse = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${access_token}`,
          },
        });

        if (!deleteResponse.ok && deleteResponse.status !== 404) {
          console.error('Failed to delete Google Calendar event:', await deleteResponse.text());
        } else {
          console.log('Successfully deleted Google Calendar event:', eventId);
        }
      } catch (error) {
        console.error('Error deleting from Google Calendar:', error);
      }
    };

    // Delete all calendar events
    for (const booking of allBookings) {
      if (booking.google_calendar_event_id && booking.calendar_id) {
        await deleteGoogleCalendarEvent(booking.google_calendar_event_id, booking.calendar_id);
      }
    }

    // Get all booking IDs to delete
    const allBookingIds = allBookings.map(b => b.id);

    // Break foreign key relationships by setting related_booking_id to null
    await supabase
      .from('bookings')
      .update({ related_booking_id: null })
      .in('id', allBookingIds);

    // Delete all bookings from database
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .in('id', allBookingIds);

    if (deleteError) {
      console.error('Error deleting bookings:', deleteError);
      throw deleteError;
    }

    console.log('Booking(s) cancelled successfully');

    // Get n8n cancel webhook URL from tenant_integrations
    let cancelWebhookUrl: string | null = null;
    
    if (tenantId) {
      const n8nIntegration = await getTenantCredentials(supabase, tenantId, 'n8n');
      if (n8nIntegration?.settings?.cancel_webhook_url) {
        cancelWebhookUrl = n8nIntegration.settings.cancel_webhook_url;
        console.log('Using tenant n8n cancel webhook URL');
      }
    }
    
    // Fallback to environment variable
    if (!cancelWebhookUrl) {
      cancelWebhookUrl = Deno.env.get('N8N_CANCEL_WEBHOOK_URL') || null;
      if (cancelWebhookUrl) console.log('Using environment n8n cancel webhook URL (fallback)');
    }

    // Trigger n8n webhook with all bookings data
    console.log('Preparing to send cancellation webhook...');
    let webhookSuccess = false;
    
    try {
      if (!cancelWebhookUrl) {
        console.error('WARNING: No cancel webhook URL configured');
      } else {
        const webhookData = bookings.map(booking => {
          // Format date for webhook (dd-mm-yyyy) - parse string directly to avoid timezone issues
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
            tenant_id: tenantId,
          };
        });

        console.log('Sending webhook to:', cancelWebhookUrl);
        console.log('Webhook data:', JSON.stringify(webhookData, null, 2));

        const webhookResponse = await fetch(cancelWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'cancellation',
            bookings: webhookData,
            user: cancelUser,
            tenant_id: tenantId,
          }),
        });

        if (webhookResponse.ok) {
          console.log('✓ n8n webhook triggered successfully');
          webhookSuccess = true;
        } else {
          console.error('✗ Webhook request failed with status:', webhookResponse.status);
          console.error('Response:', await webhookResponse.text());
        }
      }
    } catch (error) {
      console.error('✗ Error triggering n8n webhook:', error);
      // Don't fail the cancellation if webhook fails, but log it prominently
    }
    
    if (!webhookSuccess) {
      console.warn('⚠️ CANCELLATION COMPLETED BUT WEBHOOK FAILED - Manual notification may be required');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Booking cancelled successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in cancel-booking function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
