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

// Get tenant ID from phone number (for new contacts, we need to determine the tenant)
async function getTenantIdFromPhone(supabase: any, phoneNumber: string): Promise<string | null> {
  // First, check if this phone has existing contacts
  const { data: existingContact } = await supabase
    .from('whatsapp_contacts')
    .select('tenant_id')
    .eq('phone_number', phoneNumber)
    .single();

  if (existingContact?.tenant_id) {
    return existingContact.tenant_id;
  }

  // For new contacts, get the default tenant (first active tenant)
  // In production, this could be determined by webhook configuration per tenant
  const { data: defaultTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  return defaultTenant?.id || null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication with custom Bearer token
    const authHeader = req.headers.get('Authorization');
    const expectedToken = `Bearer ${Deno.env.get('WHATSAPP_WEBHOOK_TOKEN')}`;
    
    if (!authHeader || authHeader !== expectedToken) {
      console.error('Unauthorized access attempt');
      return new Response(
        JSON.stringify({ 
          code: 401,
          message: 'Missing authorization header' 
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = getSupabaseClient();
    const body = await req.json();
    console.log('Received webhook data:', JSON.stringify(body, null, 2));

    const { phone_number, contact_name, user_message, assistant_message, tenant_id: requestTenantId } = body;

    if (!phone_number || !user_message || !assistant_message) {
      throw new Error('Missing required fields: phone_number, user_message, assistant_message');
    }

    // Determine tenant ID
    let tenantId = requestTenantId;
    if (!tenantId) {
      tenantId = await getTenantIdFromPhone(supabase, phone_number);
    }

    console.log(`Processing WhatsApp conversation for tenant: ${tenantId}`);

    // Find or create contact
    let contactId: string;
    let aiAgentEnabled = true;
    
    const { data: existingContact, error: searchError } = await supabase
      .from('whatsapp_contacts')
      .select('id, ai_agent_enabled, tenant_id')
      .eq('phone_number', phone_number)
      .maybeSingle();

    if (searchError) {
      console.error('Error searching contact:', searchError);
      throw searchError;
    }

    if (existingContact) {
      contactId = existingContact.id;
      aiAgentEnabled = existingContact.ai_agent_enabled;
      tenantId = existingContact.tenant_id || tenantId;
      
      const { error: updateError } = await supabase
        .from('whatsapp_contacts')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', contactId);

      if (updateError) {
        console.error('Error updating contact:', updateError);
        throw updateError;
      }
      console.log('Contact updated:', contactId, 'AI Agent enabled:', aiAgentEnabled);
    } else {
      // Create new contact with tenant_id
      const { data: newContact, error: createError } = await supabase
        .from('whatsapp_contacts')
        .insert({
          phone_number,
          name: contact_name || null,
          last_message_at: new Date().toISOString(),
          ai_agent_enabled: true,
          tenant_id: tenantId,
        })
        .select('id, ai_agent_enabled')
        .single();

      if (createError) {
        console.error('Error creating contact:', createError);
        throw createError;
      }
      contactId = newContact.id;
      aiAgentEnabled = newContact.ai_agent_enabled;
      console.log('Contact created:', contactId, 'for tenant:', tenantId);
    }

    // Determine which messages to save
    const messages = [];
    
    // Always save user message with tenant_id
    messages.push({
      contact_id: contactId,
      message_type: 'user',
      content: user_message,
      tenant_id: tenantId,
    });

    // Only save assistant message if AI agent is enabled
    if (aiAgentEnabled && assistant_message) {
      messages.push({
        contact_id: contactId,
        message_type: 'assistant',
        content: assistant_message,
        tenant_id: tenantId,
      });
      console.log('AI agent is enabled, saving assistant message');
    } else {
      console.log('AI agent is disabled, skipping assistant message');
    }

    const { error: messagesError } = await supabase
      .from('whatsapp_messages')
      .insert(messages);

    if (messagesError) {
      console.error('Error saving messages:', messagesError);
      throw messagesError;
    }

    console.log('Messages saved successfully for tenant:', tenantId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        contact_id: contactId,
        ai_agent_enabled: aiAgentEnabled,
        tenant_id: tenantId,
        message: aiAgentEnabled 
          ? 'Conversation saved successfully' 
          : 'User message saved, AI agent is paused'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in whatsapp-conversation:', error);
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
