import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email es requerido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar usuario por email en auth.users
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error buscando usuarios:', userError);
      throw new Error('Error al buscar usuario');
    }

    const user = users.find(u => u.email === email);

    if (!user) {
      // Por seguridad, no revelar si el usuario existe o no
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Si el email existe, recibirás un enlace de recuperación' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Generar token único
    const token = crypto.randomUUID();
    
    // Guardar token en la base de datos (expira en 1 hora)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const { error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: token,
        email: email,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Error creando token:', tokenError);
      throw new Error('Error al generar el token');
    }

    // Obtener el origin desde el header o usar un valor por defecto
    const origin = req.headers.get('origin') || Deno.env.get('SITE_URL') || '';
    const recoveryLink = `${origin}/auth#type=recovery&token=${token}`;
    
    // Enviar token al webhook de n8n
    const webhookUrl = 'https://n8n-n8n.fzgtc4.easypanel.host/webhook-test/11869131-e1b0-47bc-95cb-96a61df14d0b';
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        recoveryLink: recoveryLink,
        token: token,
        timestamp: new Date().toISOString(),
        origin: origin,
      }),
    });

    if (!webhookResponse.ok) {
      console.error('Error enviando webhook:', await webhookResponse.text());
      throw new Error('Error al enviar email de recuperación');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Si el email existe, recibirás un enlace de recuperación'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error en request-password-reset:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
