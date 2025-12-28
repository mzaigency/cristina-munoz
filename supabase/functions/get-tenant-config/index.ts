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
    // Verify webhook token for security
    const authHeader = req.headers.get('Authorization');
    const expectedToken = Deno.env.get('WHATSAPP_WEBHOOK_TOKEN');
    
    if (!authHeader || !authHeader.includes(expectedToken || '')) {
      console.error('Unauthorized access attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenant_id');
    const tenantSlug = url.searchParams.get('slug');

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    let query = supabase.from('tenants_n8n_config').select('*');

    // Filter by tenant_id or slug if provided
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    } else if (tenantSlug) {
      query = query.eq('slug', tenantSlug);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} tenant configs`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: tenantId || tenantSlug ? data?.[0] || null : data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-tenant-config:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
