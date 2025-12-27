import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to get n8n cancel webhook URL
async function getN8nCancelWebhookUrl(supabase: any, tenantId: string): Promise<string | null> {
  const { data: integration } = await supabase
    .from('tenant_integrations')
    .select('settings, is_enabled')
    .eq('tenant_id', tenantId)
    .eq('integration_type', 'n8n')
    .eq('is_enabled', true)
    .maybeSingle();

  if (integration?.settings?.cancel_webhook_url) {
    return integration.settings.cancel_webhook_url;
  }

  return Deno.env.get('N8N_CANCEL_WEBHOOK_URL') || null;
}

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

    let relatedBookings: any[] = [];
    if (relatedBookingIds.length > 0) {
      const { data: related } = await supabase
        .from('bookings')
        .select('*')
        .in('id', relatedBookingIds);
      relatedBookings = related || [];
    }

    const allBookings = [...bookings, ...relatedBookings];
    const allBookingIds = allBookings.map(b => b.id);

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

    // Trigger n8n webhook
    if (tenantId) {
      const cancelWebhookUrl = await getN8nCancelWebhookUrl(supabase, tenantId);
      
      if (cancelWebhookUrl) {
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
              tenant_id: tenantId,
            };
          });

          await fetch(cancelWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'cancellation',
              bookings: webhookData,
              user: cancelUser,
              tenant_id: tenantId,
            }),
          });

          console.log('n8n cancel webhook sent successfully');
        } catch (webhookError) {
          console.error('Error sending n8n webhook:', webhookError);
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
