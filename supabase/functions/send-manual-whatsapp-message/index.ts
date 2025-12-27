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

async function getTenantIdFromContact(supabase: any, contactId: string): Promise<string | null> {
  const { data } = await supabase
    .from('whatsapp_contacts')
    .select('tenant_id')
    .eq('id', contactId)
    .single();

  return data?.tenant_id || null;
}

async function getN8nCredentials(supabase: any, tenantId: string) {
  const { data } = await supabase
    .from('tenant_integrations')
    .select('settings, is_enabled')
    .eq('tenant_id', tenantId)
    .eq('integration_type', 'n8n_webhooks')
    .single();

  if (!data || !data.is_enabled) {
    // Fallback to environment variables
    return {
      n8n_send_whatsapp_webhook: Deno.env.get('N8N_SEND_WHATSAPP_MESSAGE_WEBHOOK'),
    };
  }

  return data.settings || {};
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();
    const { contact_id, message_content, tenant_id: requestTenantId } = await req.json();

    if (!contact_id || !message_content) {
      throw new Error('Missing required fields: contact_id, message_content');
    }

    console.log('Sending manual message to contact:', contact_id);

    // Get tenant ID from contact or request
    let tenantId = requestTenantId;
    if (!tenantId) {
      tenantId = await getTenantIdFromContact(supabase, contact_id);
    }

    if (!tenantId) {
      console.warn('No tenant_id found for contact, using default credentials');
    }

    // Get contact info
    const { data: contact, error: contactError } = await supabase
      .from('whatsapp_contacts')
      .select('phone_number, name, tenant_id')
      .eq('id', contact_id)
      .single();

    if (contactError || !contact) {
      console.error('Error fetching contact:', contactError);
      throw new Error('Contact not found');
    }

    // Get n8n credentials for this tenant
    const n8nCredentials = await getN8nCredentials(supabase, contact.tenant_id || tenantId);
    const n8nWebhook = n8nCredentials.n8n_send_whatsapp_webhook;

    if (!n8nWebhook) {
      throw new Error('n8n WhatsApp webhook not configured for this tenant');
    }

    // Send message via n8n webhook
    console.log('Calling n8n webhook to send WhatsApp message');
    const n8nResponse = await fetch(n8nWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: contact.phone_number,
        message: message_content,
        contact_name: contact.name,
        is_manual: true,
        tenant_id: contact.tenant_id,
      }),
    });

    if (!n8nResponse.ok) {
      console.error('n8n webhook error:', await n8nResponse.text());
      throw new Error('Failed to send WhatsApp message via n8n');
    }

    console.log('WhatsApp message sent via n8n successfully');

    // Save message to database with tenant_id
    const { error: messageError } = await supabase
      .from('whatsapp_messages')
      .insert({
        contact_id,
        message_type: 'assistant',
        content: message_content,
        tenant_id: contact.tenant_id,
      });

    if (messageError) {
      console.error('Error saving manual message:', messageError);
      throw messageError;
    }

    // Update contact last_message_at
    const { error: updateError } = await supabase
      .from('whatsapp_contacts')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', contact_id);

    if (updateError) {
      console.error('Error updating contact:', updateError);
      throw updateError;
    }

    console.log('Manual message saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Manual message sent successfully',
        tenant_id: contact.tenant_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-manual-whatsapp-message:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
