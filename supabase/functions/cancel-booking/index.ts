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

    // Get WhatsApp settings for this tenant
    let whatsappTemplateName = 'cita_cancelada';
    let whatsappLanguage = 'es';
    
    if (tenantId) {
      const { data: whatsappIntegration } = await supabase
        .from('tenant_integrations')
        .select('settings')
        .eq('tenant_id', tenantId)
        .eq('integration_type', 'whatsapp')
        .eq('is_enabled', true)
        .maybeSingle();
      
      if (whatsappIntegration?.settings) {
        const wsSettings = whatsappIntegration.settings as any;
        whatsappTemplateName = wsSettings.template_cancellation || 'cita_cancelada';
        whatsappLanguage = wsSettings.template_language || 'es';
      }
    }
    
    console.log('Using WhatsApp template:', whatsappTemplateName, 'language:', whatsappLanguage);

    // Send WhatsApp cancellation via Meta Cloud API
    // Template: cita_cancelada -> {{1}}=fecha, {{2}}=hora
    for (const booking of bookings) {
      if (booking.Telefono && booking.Telefono.length >= 9) {
        try {
          const dateStr = booking.Fecha.toString();
          const [year, month, day] = dateStr.split('-');
          const formattedDate = `${day}/${month}/${year}`;
          const formattedTime = booking.Hora.slice(0, 5);
          
          const response = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenant_id: tenantId,
              to: booking.Telefono,
              template_name: whatsappTemplateName,
              template_language: whatsappLanguage,
              template_components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: formattedDate },
                    { type: 'text', text: formattedTime },
                  ]
                }
              ]
            })
          });
          
          const result = await response.json();
          if (result.success) {
            console.log('WhatsApp cancellation sent to:', booking.Telefono);
          } else {
            console.log('WhatsApp not sent:', result.error);
          }
        } catch (whatsappError) {
          console.error('Error sending WhatsApp cancellation:', whatsappError);
        }
      }
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
