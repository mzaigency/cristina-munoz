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
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
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

    const { eventId, calendarId } = await req.json();

    if (!eventId || !calendarId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: eventId, calendarId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // First, get the booking(s) from database using the google calendar event id
    const { data: bookings, error: fetchError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('google_calendar_event_id', eventId);

    if (fetchError) {
      console.error('Error fetching bookings:', fetchError);
      throw new Error('Failed to fetch bookings from database');
    }

    // Collect all related bookings if they exist
    const relatedBookingIds = bookings
      ?.filter(b => b.is_part_of_compound && b.related_booking_id)
      .map(b => b.related_booking_id)
      .filter(Boolean) || [];

    let relatedBookings = [];
    if (relatedBookingIds.length > 0) {
      const { data: related } = await supabaseClient
        .from('bookings')
        .select('*')
        .in('id', relatedBookingIds);
      relatedBookings = related || [];
    }

    const allBookings = [...(bookings || []), ...relatedBookings];

    // Delete from Google Calendar
    const accessToken = await getAccessToken();
    console.log(`Deleting event ${eventId} from calendar`);

    const deleteResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      const error = await deleteResponse.text();
      console.error('Error deleting event:', error);
      throw new Error(`Failed to delete event: ${error}`);
    }

    console.log('Event deleted from Google Calendar successfully');

    // Delete related calendar events for compound bookings
    for (const booking of relatedBookings) {
      if (booking.google_calendar_event_id && booking.calendar_id) {
        try {
          const relatedDeleteResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(booking.calendar_id)}/events/${booking.google_calendar_event_id}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          if (relatedDeleteResponse.ok || relatedDeleteResponse.status === 404) {
            console.log('Related calendar event deleted:', booking.google_calendar_event_id);
          }
        } catch (error) {
          console.error('Error deleting related calendar event:', error);
        }
      }
    }

    // Delete from database if bookings exist
    if (allBookings.length > 0) {
      const allBookingIds = allBookings.map(b => b.id);

      // Break foreign key relationships
      await supabaseClient
        .from('bookings')
        .update({ related_booking_id: null })
        .in('id', allBookingIds);

      // Delete bookings from database
      const { error: deleteError } = await supabaseClient
        .from('bookings')
        .delete()
        .in('id', allBookingIds);

      if (deleteError) {
        console.error('Error deleting bookings from database:', deleteError);
        throw new Error('Failed to delete bookings from database');
      }

      console.log('Bookings deleted from database successfully');

      // Trigger n8n cancellation webhook
      const cancelWebhookUrl = Deno.env.get('N8N_CANCEL_WEBHOOK_URL');
      if (cancelWebhookUrl && bookings && bookings.length > 0) {
        try {
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
            };
          });

          await fetch(cancelWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'cancellation',
              bookings: webhookData,
              user: 'admin',
            }),
          });

          console.log('n8n cancellation webhook triggered successfully');
        } catch (error) {
          console.error('Error sending cancellation webhook:', error);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in delete-calendar-event:', error);
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
