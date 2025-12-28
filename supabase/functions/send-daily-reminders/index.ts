import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppCredentials {
  apiToken: string;
  senderId: string;
  phoneNumber: string;
}

async function getWhatsAppCredentials(
  supabaseClient: any,
  tenantId: string
): Promise<WhatsAppCredentials | null> {
  console.log(`[Reminders] Getting WhatsApp credentials for tenant: ${tenantId}`);

  const { data: integration, error } = await supabaseClient
    .from('tenant_integrations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('integration_type', 'whatsapp')
    .eq('is_enabled', true)
    .single();

  if (error || !integration) {
    console.log(`[Reminders] No WhatsApp integration found for tenant ${tenantId}`);
    return null;
  }

  const settings = integration.settings as any;
  
  // Decrypt credentials
  let apiToken = '';
  if (integration.credentials_encrypted) {
    const { data: decryptedToken, error: decryptError } = await supabaseClient
      .rpc('decrypt_sensitive_data', {
        _ciphertext: integration.credentials_encrypted,
        _tenant_id: tenantId
      });

    if (decryptError) {
      console.error(`[Reminders] Error decrypting credentials:`, decryptError);
      return null;
    }
    apiToken = decryptedToken;
  }

  if (!apiToken || !settings?.sender_id) {
    console.log(`[Reminders] Missing credentials for tenant ${tenantId}`);
    return null;
  }

  return {
    apiToken,
    senderId: settings.sender_id,
    phoneNumber: settings.phone_number || ''
  };
}

function formatPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  if (cleaned.startsWith('34') && cleaned.length === 11) {
    return cleaned;
  }
  
  if (cleaned.length === 9 && /^[6789]/.test(cleaned)) {
    return '34' + cleaned;
  }
  
  return cleaned;
}

function formatTimeForTemplate(hora: string): string {
  // La hora viene como "HH:MM:SS" o "HH:MM", devolver solo "HH:MM"
  const parts = hora.split(':');
  return `${parts[0]}:${parts[1]}`;
}

async function sendReminderWhatsApp(
  credentials: WhatsAppCredentials,
  recipientPhone: string,
  appointmentTime: string,
  tenantName: string
): Promise<boolean> {
  const formattedPhone = formatPhoneForWhatsApp(recipientPhone);
  const formattedTime = formatTimeForTemplate(appointmentTime);
  
  console.log(`[Reminders] Sending reminder to ${formattedPhone} for appointment at ${formattedTime}`);

  const messagePayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formattedPhone,
    type: "template",
    template: {
      name: "recordatorio",
      language: { code: "es" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: formattedTime }
          ]
        }
      ]
    }
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${credentials.senderId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error(`[Reminders] WhatsApp API error:`, result);
      return false;
    }

    console.log(`[Reminders] Reminder sent successfully to ${formattedPhone}, message_id:`, result.messages?.[0]?.id);
    return true;
  } catch (error) {
    console.error(`[Reminders] Error sending reminder:`, error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Calcular la fecha de mañana
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`[Reminders] Starting daily reminders for appointments on ${tomorrowStr}`);

    // Obtener todos los tenants activos
    const { data: tenants, error: tenantsError } = await supabaseClient
      .from('tenants')
      .select('id, name')
      .eq('is_active', true);

    if (tenantsError) {
      console.error('[Reminders] Error fetching tenants:', tenantsError);
      throw tenantsError;
    }

    console.log(`[Reminders] Found ${tenants?.length || 0} active tenants`);

    const results: { tenant: string; sent: number; failed: number; skipped: number }[] = [];

    for (const tenant of tenants || []) {
      console.log(`[Reminders] Processing tenant: ${tenant.name} (${tenant.id})`);

      // Obtener credenciales de WhatsApp del tenant
      const credentials = await getWhatsAppCredentials(supabaseClient, tenant.id);
      
      if (!credentials) {
        console.log(`[Reminders] Skipping tenant ${tenant.name} - no WhatsApp integration`);
        results.push({ tenant: tenant.name, sent: 0, failed: 0, skipped: 0 });
        continue;
      }

      // Obtener citas de mañana para este tenant
      const { data: bookings, error: bookingsError } = await supabaseClient
        .from('bookings')
        .select('id, customer_name, "Telefono", "Hora"')
        .eq('tenant_id', tenant.id)
        .eq('Fecha', tomorrowStr)
        .eq('status', 'confirmed');

      if (bookingsError) {
        console.error(`[Reminders] Error fetching bookings for tenant ${tenant.name}:`, bookingsError);
        results.push({ tenant: tenant.name, sent: 0, failed: 0, skipped: 0 });
        continue;
      }

      console.log(`[Reminders] Found ${bookings?.length || 0} bookings for ${tenant.name} on ${tomorrowStr}`);

      let sent = 0;
      let failed = 0;
      let skipped = 0;

      for (const booking of bookings || []) {
        if (!booking.Telefono) {
          console.log(`[Reminders] Skipping booking ${booking.id} - no phone number`);
          skipped++;
          continue;
        }

        const success = await sendReminderWhatsApp(
          credentials,
          booking.Telefono,
          booking.Hora,
          tenant.name
        );

        if (success) {
          sent++;
        } else {
          failed++;
        }

        // Pequeña pausa para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      results.push({ tenant: tenant.name, sent, failed, skipped });
      console.log(`[Reminders] Tenant ${tenant.name} completed: ${sent} sent, ${failed} failed, ${skipped} skipped`);
    }

    const totalSent = results.reduce((acc, r) => acc + r.sent, 0);
    const totalFailed = results.reduce((acc, r) => acc + r.failed, 0);

    console.log(`[Reminders] Daily reminders completed. Total: ${totalSent} sent, ${totalFailed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        date: tomorrowStr,
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
