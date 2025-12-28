import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  tenant_id?: string;
  slug?: string;
  to: string; // Phone number with country code (e.g., "34612345678")
  template_name: string; // Meta template name
  template_language?: string; // Default: "es"
  template_components?: any[]; // Template variables
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: WhatsAppMessage = await req.json();
    const { tenant_id, slug, to, template_name, template_language = 'es', template_components } = body;

    if (!to || !template_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, template_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tenant_id && !slug) {
      return new Response(
        JSON.stringify({ error: 'tenant_id or slug required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for database access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get tenant ID from slug if needed
    let resolvedTenantId = tenant_id;
    if (!resolvedTenantId && slug) {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (tenantError || !tenant) {
        console.error('Tenant not found:', slug);
        return new Response(
          JSON.stringify({ error: 'Tenant not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      resolvedTenantId = tenant.id;
    }

    // Fetch WhatsApp integration for this tenant
    const { data: integration, error: integrationError } = await supabase
      .from('tenant_integrations')
      .select('*')
      .eq('tenant_id', resolvedTenantId)
      .eq('integration_type', 'whatsapp')
      .maybeSingle();

    if (integrationError) {
      console.error('Database error:', integrationError);
      throw integrationError;
    }

    if (!integration || !integration.is_enabled) {
      console.error('WhatsApp integration not configured or disabled for tenant:', resolvedTenantId);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'WhatsApp integration not configured or disabled',
          sent: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt the API token
    const { data: decryptedToken, error: decryptError } = await supabase
      .rpc('decrypt_sensitive_data', {
        _ciphertext: integration.credentials_encrypted,
        _tenant_id: resolvedTenantId
      });

    if (decryptError || !decryptedToken) {
      console.error('Failed to decrypt credentials:', decryptError);
      return new Response(
        JSON.stringify({ error: 'Failed to decrypt WhatsApp credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const settings = integration.settings as any || {};
    const phoneNumberId = settings.sender_id; // Meta Phone Number ID

    if (!phoneNumberId) {
      console.error('WhatsApp sender_id (Phone Number ID) not configured');
      return new Response(
        JSON.stringify({ error: 'WhatsApp Phone Number ID not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare Meta Cloud API request
    // Format phone number (remove + and spaces)
    const formattedPhone = to.replace(/[\s\-\+]/g, '');

    const messagePayload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'template',
      template: {
        name: template_name,
        language: {
          code: template_language
        }
      }
    };

    // Add template components if provided
    if (template_components && template_components.length > 0) {
      messagePayload.template.components = template_components;
    }

    console.log(`Sending WhatsApp message to ${formattedPhone} via Meta Cloud API`);
    console.log('Template:', template_name, 'Language:', template_language);

    // Send message via Meta Cloud API
    const metaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${decryptedToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      }
    );

    const metaResult = await metaResponse.json();

    if (!metaResponse.ok) {
      console.error('Meta API error:', metaResult);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: metaResult.error?.message || 'Failed to send WhatsApp message',
          details: metaResult.error
        }),
        { status: metaResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Message sent successfully:', metaResult);

    return new Response(
      JSON.stringify({ 
        success: true,
        message_id: metaResult.messages?.[0]?.id,
        sent: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-whatsapp-notification:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
