import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { format } from "https://esm.sh/date-fns@3.6.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cancelWebhookUrl = 'https://n8n-n8n.fzgtc4.easypanel.host/webhook/18e4c56c-6dc2-47bb-b4c4-73700574a4a7';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId, googleEventId, calendarId, customerPhone } = await req.json();

    console.log('Cancelling booking:', { bookingId, googleEventId, calendarId, customerPhone });

    // Get booking details before deleting
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError) {
      console.error('Error fetching booking:', fetchError);
      throw new Error('Booking not found');
    }

    // If this is a compound service, also get the related booking
    let relatedBooking = null;
    if (booking.is_part_of_compound && booking.related_booking_id) {
      const { data: related } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', booking.related_booking_id)
        .single();
      relatedBooking = related;
    }

    // Helper function to delete Google Calendar event
    const deleteGoogleCalendarEvent = async (eventId: string, calId: string) => {
      try {
        const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN')!;
        const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
        const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

        // Get access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
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

    // Delete from Google Calendar if we have the event ID and calendar ID
    if (googleEventId && calendarId) {
      await deleteGoogleCalendarEvent(googleEventId, calendarId);
    }

    // Also delete related booking's calendar event
    if (relatedBooking && relatedBooking.google_calendar_event_id && relatedBooking.calendar_id) {
      await deleteGoogleCalendarEvent(relatedBooking.google_calendar_event_id, relatedBooking.calendar_id);
    }

    // Update booking status to cancelled
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      throw updateError;
    }

    // Also cancel related booking if exists
    if (relatedBooking) {
      await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', relatedBooking.id);
    }

    console.log('Booking(s) cancelled successfully');

    // Trigger n8n webhook for cancellation notification
    try {
      // Format date for webhook (dd-mm-yyyy)
      const formattedDate = format(new Date(booking.booking_date), 'dd-MM-yyyy');
      
      await fetch(cancelWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'cancellation',
          booking_id: bookingId,
          customer_name: booking.customer_name,
          Telefono: customerPhone,
          booking_date: formattedDate,
          booking_time: booking.booking_time,
          stylist: booking.stylist,
          services: booking.services,
          google_calendar_event_id: googleEventId,
          calendar_id: calendarId,
        }),
      });
      console.log('n8n webhook triggered successfully');
    } catch (error) {
      console.error('Error triggering n8n webhook:', error);
      // Don't fail the cancellation if webhook fails
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
