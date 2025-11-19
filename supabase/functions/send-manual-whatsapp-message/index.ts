import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const n8nWebhook = Deno.env.get('N8N_SEND_WHATSAPP_MESSAGE_WEBHOOK')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { contact_id, message_content } = await req.json();

    if (!contact_id || !message_content) {
      throw new Error('Missing required fields: contact_id, message_content');
    }

    console.log('Sending manual message to contact:', contact_id);

    // Obtener información del contacto
    const { data: contact, error: contactError } = await supabase
      .from('whatsapp_contacts')
      .select('phone_number, name')
      .eq('id', contact_id)
      .single();

    if (contactError || !contact) {
      console.error('Error fetching contact:', contactError);
      throw new Error('Contact not found');
    }

    // Enviar mensaje a través del webhook de n8n
    console.log('Calling n8n webhook to send WhatsApp message');
    const n8nResponse = await fetch(n8nWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: contact.phone_number,
        message: message_content,
        contact_name: contact.name,
        is_manual: true, // Indicador de que es un mensaje manual
      }),
    });

    if (!n8nResponse.ok) {
      console.error('n8n webhook error:', await n8nResponse.text());
      throw new Error('Failed to send WhatsApp message via n8n');
    }

    console.log('WhatsApp message sent via n8n successfully');

    // Insertar mensaje del asistente (mensaje manual de la peluquera)
    const { error: messageError } = await supabase
      .from('whatsapp_messages')
      .insert({
        contact_id,
        message_type: 'assistant',
        content: message_content,
      });

    if (messageError) {
      console.error('Error saving manual message:', messageError);
      throw messageError;
    }

    // Actualizar last_message_at del contacto
    const { error: updateError } = await supabase
      .from('whatsapp_contacts')
      .update({
        last_message_at: new Date().toISOString(),
      })
      .eq('id', contact_id);

    if (updateError) {
      console.error('Error updating contact:', updateError);
      throw updateError;
    }

    console.log('Manual message saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Manual message sent successfully'
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