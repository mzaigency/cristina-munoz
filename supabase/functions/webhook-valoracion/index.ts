import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
}

async function getWebhookUrl(supabase: any, tenantId: string | null): Promise<string | null> {
  if (!tenantId) {
    return Deno.env.get('WEBHOOK_VALORACION') || null;
  }

  const { data } = await supabase
    .from('tenant_integrations')
    .select('settings, is_enabled')
    .eq('tenant_id', tenantId)
    .eq('integration_type', 'n8n_webhooks')
    .single();

  if (!data || !data.is_enabled || !data.settings?.webhook_valoracion) {
    return Deno.env.get('WEBHOOK_VALORACION') || null;
  }

  return data.settings.webhook_valoracion;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { tenant_id: tenantId, ...webhookData } = body;
    
    const supabase = getSupabaseClient();
    const webhookUrl = await getWebhookUrl(supabase, tenantId);

    if (!webhookUrl) {
      throw new Error('WEBHOOK_VALORACION not configured');
    }

    console.log('Sending review request to webhook for tenant:', tenantId);
    console.log('Webhook data:', webhookData);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...webhookData,
        tenant_id: tenantId,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook error:', errorText);
      throw new Error(`Webhook failed: ${response.status}`);
    }

    return new Response(
      JSON.stringify({ success: true, tenant_id: tenantId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in webhook-valoracion:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
