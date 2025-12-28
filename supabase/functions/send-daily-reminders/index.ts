import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatTimeForMessage(hora: string): string {
  const parts = hora.split(':');
  return `${parts[0]}:${parts[1]}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Parse body for test mode
    let testMode = false;
    let testUserId = '';
    let testTenantId = '';
    let testDate = '';

    try {
      const body = await req.json();
      testMode = body.test_mode === true;
      testUserId = body.test_user_id || '';
      testTenantId = body.tenant_id || '';
      testDate = body.date || '';
    } catch {
      // No body, normal mode
    }

    // Calculate target date
    let targetDateStr: string;
    if (testDate) {
      targetDateStr = testDate;
    } else {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDateStr = tomorrow.toISOString().split('T')[0];
    }

    console.log(`[Reminders] Starting ${testMode ? 'TEST MODE' : 'daily'} reminders for appointments on ${targetDateStr}`);

    // Get tenants
    let tenantsQuery = supabaseClient
      .from('tenants')
      .select('id, name')
      .eq('is_active', true);
    
    if (testMode && testTenantId) {
      tenantsQuery = tenantsQuery.eq('id', testTenantId);
    }

    const { data: tenants, error: tenantsError } = await tenantsQuery;

    if (tenantsError) {
      console.error('[Reminders] Error fetching tenants:', tenantsError);
      throw tenantsError;
    }

    console.log(`[Reminders] Found ${tenants?.length || 0} active tenants`);

    const results: { tenant: string; sent: number; failed: number; skipped: number }[] = [];

    for (const tenant of tenants || []) {
      console.log(`[Reminders] Processing tenant: ${tenant.name} (${tenant.id})`);

      // Get bookings for target date that have a user_id (registered users only)
      let bookingsQuery = supabaseClient
        .from('bookings')
        .select('id, customer_name, "Hora", user_id, stylist, services')
        .eq('tenant_id', tenant.id)
        .eq('Fecha', targetDateStr)
        .eq('status', 'confirmed')
        .not('user_id', 'is', null);

      if (testMode && testUserId) {
        bookingsQuery = bookingsQuery.eq('user_id', testUserId);
      }

      const { data: bookings, error: bookingsError } = await bookingsQuery;

      if (bookingsError) {
        console.error(`[Reminders] Error fetching bookings for tenant ${tenant.name}:`, bookingsError);
        results.push({ tenant: tenant.name, sent: 0, failed: 0, skipped: 0 });
        continue;
      }

      console.log(`[Reminders] Found ${bookings?.length || 0} bookings with registered users for ${tenant.name} on ${targetDateStr}`);

      let sent = 0;
      let failed = 0;
      let skipped = 0;

      for (const booking of bookings || []) {
        if (!booking.user_id) {
          skipped++;
          continue;
        }

        try {
          // Find or create conversation
          let { data: conversation } = await supabaseClient
            .from('conversations')
            .select('id')
            .eq('tenant_id', tenant.id)
            .eq('user_id', booking.user_id)
            .maybeSingle();

          if (!conversation) {
            const { data: newConv, error: convError } = await supabaseClient
              .from('conversations')
              .insert({
                tenant_id: tenant.id,
                user_id: booking.user_id,
              })
              .select('id')
              .single();
            
            if (convError) {
              console.error(`[Reminders] Error creating conversation:`, convError);
              failed++;
              continue;
            }
            conversation = newConv;
          }

          const formattedTime = formatTimeForMessage(booking.Hora);
          const [year, month, day] = targetDateStr.split('-');
          const formattedDate = `${day}/${month}/${year}`;
          
          const serviceNames = Array.isArray(booking.services) 
            ? booking.services.map((s: any) => s.name).join(', ')
            : 'tu cita';

          const reminderMessage = `⏰ *Recordatorio de cita*\n\nHola ${booking.customer_name},\n\nTe recordamos que tienes una cita mañana ${formattedDate} a las ${formattedTime}.\n\n📋 Servicios: ${serviceNames}\n👤 Profesional: ${booking.stylist}\n\n¡Te esperamos!`;

          await supabaseClient
            .from('direct_messages')
            .insert({
              conversation_id: conversation.id,
              sender_id: tenant.id,
              sender_type: 'salon',
              content: reminderMessage,
              message_type: 'booking_reminder',
            });

          console.log(`[Reminders] Reminder sent to user ${booking.user_id}`);
          sent++;
        } catch (msgError) {
          console.error(`[Reminders] Error sending reminder:`, msgError);
          failed++;
        }

        // Small pause to not overload
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      results.push({ tenant: tenant.name, sent, failed, skipped });
      console.log(`[Reminders] Tenant ${tenant.name} completed: ${sent} sent, ${failed} failed, ${skipped} skipped`);
    }

    const totalSent = results.reduce((acc, r) => acc + r.sent, 0);
    const totalFailed = results.reduce((acc, r) => acc + r.failed, 0);

    console.log(`[Reminders] ${testMode ? 'Test' : 'Daily'} reminders completed. Total: ${totalSent} sent, ${totalFailed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        test_mode: testMode,
        date: targetDateStr,
        results,
        totals: { sent: totalSent, failed: totalFailed }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Reminders] Error in daily reminders:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
