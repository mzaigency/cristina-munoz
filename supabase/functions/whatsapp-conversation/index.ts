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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log('Received webhook data:', JSON.stringify(body, null, 2));

    const { phone_number, contact_name, user_message, assistant_message } = body;

    if (!phone_number || !user_message || !assistant_message) {
      throw new Error('Missing required fields: phone_number, user_message, assistant_message');
    }

    // Buscar o crear contacto
    let contactId: string;
    const { data: existingContact, error: searchError } = await supabase
      .from('whatsapp_contacts')
      .select('id')
      .eq('phone_number', phone_number)
      .maybeSingle();

    if (searchError) {
      console.error('Error searching contact:', searchError);
      throw searchError;
    }

    if (existingContact) {
      // Actualizar contacto existente
      contactId = existingContact.id;
      const { error: updateError } = await supabase
        .from('whatsapp_contacts')
        .update({
          name: contact_name || null,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', contactId);

      if (updateError) {
        console.error('Error updating contact:', updateError);
        throw updateError;
      }
      console.log('Contact updated:', contactId);
    } else {
      // Crear nuevo contacto
      const { data: newContact, error: createError } = await supabase
        .from('whatsapp_contacts')
        .insert({
          phone_number,
          name: contact_name || null,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating contact:', createError);
        throw createError;
      }
      contactId = newContact.id;
      console.log('Contact created:', contactId);
    }

    // Guardar mensajes (usuario y asistente)
    const messages = [
      {
        contact_id: contactId,
        message_type: 'user',
        content: user_message,
      },
      {
        contact_id: contactId,
        message_type: 'assistant',
        content: assistant_message,
      },
    ];

    const { error: messagesError } = await supabase
      .from('whatsapp_messages')
      .insert(messages);

    if (messagesError) {
      console.error('Error saving messages:', messagesError);
      throw messagesError;
    }

    console.log('Messages saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        contact_id: contactId,
        message: 'Conversation saved successfully' 
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