import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};


serve(async (req) => {
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
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
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
    console.log('User is admin/stylist:', isAdminOrStylist);

    const requestBody = await req.json();
    const { bookingId, bookingIds, user: cancelUser = 'client', tenant_id: requestTenantId, cancelSeries = false } = requestBody;

    // Handle both single and multiple bookings
    const idsToCancel = bookingIds || [bookingId];
    console.log('Cancelling bookings:', { idsToCancel });

    console.log('cancelSeries:', cancelSeries);
    
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
        return new Response(
          JSON.stringify({ error: 'No tienes permiso para cancelar esta cita' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }
    }

    console.log('Authorization verified, proceeding with cancellation');

    // Collect all related bookings (compound services)
    const relatedBookingIds = bookings
      .filter(b => b.is_part_of_compound && b.related_booking_id)
      .map(b => b.related_booking_id)
      .filter(Boolean);

    let relatedBookings: any[] = [];
    if (relatedBookingIds.length > 0) {
      const { data: related } = await supabase
        .from('bookings')
        .select('*')
        .in('id', relatedBookingIds);
      relatedBookings = related || [];
    }

    // If cancelSeries is true, get all future bookings in the same recurrence group
    let seriesBookings: any[] = [];
    const recurrenceGroupId = bookings[0]?.recurrence_group_id;
    
    if (cancelSeries && recurrenceGroupId) {
      console.log('Cancelling entire series with recurrence_group_id:', recurrenceGroupId);
      const today = new Date().toISOString().split('T')[0];
      
      const { data: futureSeriesBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('recurrence_group_id', recurrenceGroupId)
        .gte('Fecha', today)
        .eq('status', 'confirmed');
      
      seriesBookings = futureSeriesBookings || [];
      console.log('Found', seriesBookings.length, 'future bookings in series');
      
      // Also get related bookings for all series bookings
      const seriesRelatedIds = seriesBookings
        .filter(b => b.is_part_of_compound && b.related_booking_id)
        .map(b => b.related_booking_id)
        .filter(Boolean);
      
      if (seriesRelatedIds.length > 0) {
        const { data: seriesRelated } = await supabase
          .from('bookings')
          .select('*')
          .in('id', seriesRelatedIds);
        relatedBookings = [...relatedBookings, ...(seriesRelated || [])];
      }
    }

    const allBookings = [...bookings, ...relatedBookings, ...seriesBookings];
    // Remove duplicates by id
    const uniqueBookings = allBookings.filter((booking, index, self) =>
      index === self.findIndex((b) => b.id === booking.id)
    );
    const allBookingIds = uniqueBookings.map(b => b.id);

    // Break foreign key relationships
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

    // Send internal message cancellation for bookings with user_id
    for (const booking of bookings) {
      if (booking.user_id) {
        try {
          // Find conversation
          const { data: conversation } = await supabase
            .from('conversations')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('user_id', booking.user_id)
            .maybeSingle();

          if (conversation) {
            const dateStr = booking.Fecha.toString();
            const [year, month, day] = dateStr.split('-');
            const formattedDate = `${day}/${month}/${year}`;
            const formattedTime = booking.Hora.slice(0, 5);

            const cancellationMessage = `❌ *Cita cancelada*\n\nTu cita del ${formattedDate} a las ${formattedTime} ha sido cancelada.\n\nSi tienes alguna duda, no dudes en escribirnos.`;

            await supabase
              .from('direct_messages')
              .insert({
                conversation_id: conversation.id,
                sender_id: tenantId,
                sender_type: 'salon',
                content: cancellationMessage,
                message_type: 'booking_cancellation',
              });

            console.log('Internal cancellation message sent to user:', booking.user_id);
          }
        } catch (msgError) {
          console.error('Error sending internal cancellation message:', msgError);
        }
      }
    }

    // Check waitlist for availability after cancellation
    try {
      for (const booking of bookings) {
        if (booking.Fecha && booking.tenant_id) {
          // Invoke check-waitlist-availability for each cancelled date
          const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/check-waitlist-availability`;
          await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({
              tenant_id: booking.tenant_id,
              date: booking.Fecha
            })
          });
          console.log('Checked waitlist availability for date:', booking.Fecha);
        }
      }
    } catch (waitlistError) {
      console.error('Error checking waitlist:', waitlistError);
      // Don't fail the cancellation if waitlist check fails
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Booking cancelled successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in cancel-booking function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
