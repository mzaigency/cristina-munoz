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

async function getWhatsAppCredentials(supabase: any, tenantId: string) {
  // Get WhatsApp integration settings
  const { data: integration, error: integrationError } = await supabase
    .from('tenant_integrations')
    .select('settings, credentials_encrypted, is_enabled')
    .eq('tenant_id', tenantId)
    .eq('integration_type', 'whatsapp')
    .single();

  if (integrationError || !integration) {
    console.error('Error fetching WhatsApp integration:', integrationError);
    return null;
  }

  if (!integration.is_enabled) {
    console.log('WhatsApp integration is not enabled for tenant:', tenantId);
    return null;
  }

  // Decrypt the API token
  let apiToken = null;
  if (integration.credentials_encrypted) {
    const { data: decryptedToken, error: decryptError } = await supabase
      .rpc('decrypt_sensitive_data', {
        _ciphertext: integration.credentials_encrypted,
        _tenant_id: tenantId
      });

    if (decryptError) {
      console.error('Error decrypting WhatsApp token:', decryptError);
      return null;
    }
    apiToken = decryptedToken;
  }

  return {
    apiToken,
    senderId: integration.settings?.sender_id || null,
    phoneNumber: integration.settings?.phone_number || null,
  };
}

async function sendWhatsAppMessage(credentials: any, phoneNumber: string, message: string) {
  const { apiToken, senderId } = credentials;

  if (!apiToken || !senderId) {
    throw new Error('Missing WhatsApp API credentials');
  }

  // Format phone number (remove spaces, dashes, etc.)
  const formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Ensure phone has country code
  let cleanPhone = formattedPhone;
  if (!cleanPhone.startsWith('+')) {
    // Assume Spanish number if no country code
    if (cleanPhone.startsWith('6') || cleanPhone.startsWith('7') || cleanPhone.startsWith('9')) {
      cleanPhone = '34' + cleanPhone;
    }
  } else {
    cleanPhone = cleanPhone.substring(1); // Remove + sign
  }

  console.log(`Sending WhatsApp message to ${cleanPhone} via Meta API`);

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${senderId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: message,
        },
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    console.error('WhatsApp API error:', JSON.stringify(result));
    throw new Error(result.error?.message || 'Failed to send WhatsApp message');
  }

  console.log('WhatsApp message sent successfully:', result.messages?.[0]?.id);
  return result;
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
      throw new Error('No tenant_id found for contact');
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

    // Use contact's tenant_id if available
    const effectiveTenantId = contact.tenant_id || tenantId;

    // Get WhatsApp credentials for this tenant
    const credentials = await getWhatsAppCredentials(supabase, effectiveTenantId);

    if (!credentials || !credentials.apiToken) {
      throw new Error('WhatsApp integration not configured or API token missing for this tenant');
    }

    // Send message via Meta API
    await sendWhatsAppMessage(credentials, contact.phone_number, message_content);

    // Save message to database with tenant_id
    const { error: messageError } = await supabase
      .from('whatsapp_messages')
      .insert({
        contact_id,
        message_type: 'assistant',
        content: message_content,
        tenant_id: effectiveTenantId,
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

    console.log('Manual message sent and saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Manual message sent successfully',
        tenant_id: effectiveTenantId,
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
