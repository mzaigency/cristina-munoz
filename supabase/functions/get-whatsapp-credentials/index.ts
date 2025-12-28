import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook token for n8n access OR JWT for frontend access
    const authHeader = req.headers.get('Authorization');
    const webhookToken = Deno.env.get('WHATSAPP_WEBHOOK_TOKEN');
    
    // Check if it's a webhook call (Bearer token matches webhook token)
    const isWebhookCall = authHeader?.includes(webhookToken || '');
    
    // If not a webhook call, verify it's from an authenticated user
    let userId: string | null = null;
    if (!isWebhookCall) {
      // Create Supabase client with user's JWT
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader || '' },
          },
        }
      );
      
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError || !user) {
        console.error('Unauthorized access attempt');
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userId = user.id;
    }

    // Parse request body
    const body = await req.json();
    const { tenant_id, slug, test_mode } = body;

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
        return new Response(
          JSON.stringify({ error: 'Tenant not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      resolvedTenantId = tenant.id;
    }

    // If user is authenticated (not webhook), verify they have access to this tenant
    if (userId) {
      const { data: access, error: accessError } = await supabase
        .from('tenant_admins')
        .select('id')
        .eq('tenant_id', resolvedTenantId)
        .eq('user_id', userId)
        .maybeSingle();

      if (accessError || !access) {
        // Check if superadmin
        const { data: isSuperAdmin } = await supabase
          .rpc('is_superadmin');

        if (!isSuperAdmin) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
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

    if (!integration) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'WhatsApp integration not configured for this tenant',
          configured: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!integration.is_enabled) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'WhatsApp integration is disabled',
          configured: true,
          enabled: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If test mode, just verify the integration exists and is enabled
    if (test_mode) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          configured: true,
          enabled: true,
          settings: integration.settings
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt the API token
    let decryptedToken = null;
    if (integration.credentials_encrypted) {
      const { data: tokenData, error: decryptError } = await supabase
        .rpc('decrypt_sensitive_data', {
          _ciphertext: integration.credentials_encrypted,
          _tenant_id: resolvedTenantId
        });

      if (decryptError) {
        console.error('Decryption error:', decryptError);
        throw new Error('Failed to decrypt credentials');
      }
      decryptedToken = tokenData;
    }

    // Get tenant info for context
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name, phone, whatsapp_number, whatsapp_sender_id')
      .eq('id', resolvedTenantId)
      .single();

    const settings = integration.settings as any || {};

    console.log(`Fetched WhatsApp credentials for tenant ${resolvedTenantId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        configured: true,
        enabled: true,
        api_token: decryptedToken,
        sender_id: settings.sender_id || tenant?.whatsapp_sender_id,
        phone_number: settings.phone_number || tenant?.whatsapp_number || tenant?.phone,
        business_name: settings.business_name || tenant?.name,
        settings: settings
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-whatsapp-credentials:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
