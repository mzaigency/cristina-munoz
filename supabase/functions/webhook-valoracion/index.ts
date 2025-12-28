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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { tenant_id: tenantId, user_id: userId, customer_name, booking_id } = body;
    
    if (!tenantId || !userId) {
      throw new Error('tenant_id and user_id are required');
    }

    const supabase = getSupabaseClient();

    console.log('Sending review request message for tenant:', tenantId, 'user:', userId);

    // Find or create conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!conversation) {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          tenant_id: tenantId,
          user_id: userId,
        })
        .select('id')
        .single();
      
      if (convError) throw convError;
      conversation = newConv;
    }

    // Get tenant name
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name, slug')
      .eq('id', tenantId)
      .single();

    const reviewUrl = tenant?.slug 
      ? `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/valorar/${tenant.slug}`
      : '#';

    const reviewMessage = `⭐ *¡Gracias por visitarnos!*\n\nHola ${customer_name || 'cliente'},\n\nEsperamos que hayas disfrutado de tu visita a ${tenant?.name || 'nuestro salón'}.\n\n¿Te importaría dejarnos tu opinión? Tu feedback nos ayuda a mejorar.\n\n📝 Puedes valorar tu experiencia en la sección de reseñas.\n\n¡Muchas gracias!`;

    await supabase
      .from('direct_messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: tenantId,
        sender_type: 'salon',
        content: reviewMessage,
        message_type: 'review_request',
        metadata: { booking_id }
      });

    console.log('Review request message sent to user:', userId);

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
