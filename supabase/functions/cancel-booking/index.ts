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
    const cancelWebhookUrl = Deno.env.get('N8N_CANCEL_WEBHOOK_URL')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId, bookingIds, user = 'client' } = await req.json();

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

    // Trigger n8n webhook with all bookings data
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
          user: user,
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
