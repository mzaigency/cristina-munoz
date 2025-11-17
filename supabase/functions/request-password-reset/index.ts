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

    // Check database-level rate limiting (más seguro que en memoria)
    const { data: rateLimitCheck, error: rateLimitError } = await supabaseAdmin
      .rpc('check_password_reset_rate_limit', { user_email: email });

    if (rateLimitError) {
      console.error('Error checking rate limit:', rateLimitError);
      return new Response(
        JSON.stringify({ error: 'Error al procesar la solicitud' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!rateLimitCheck) {
      console.log('Database rate limit exceeded for email:', email);
      return new Response(
        JSON.stringify({ 
          error: 'Demasiados intentos. Por favor, intenta de nuevo en 24 horas.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

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

    // Usar el dominio personalizado para el recovery link
    const recoveryLink = `https://cristinamunozperruqueria.es/auth#type=recovery&token=${token}`;
    
    // Enviar token al webhook de n8n
    const webhookUrl = Deno.env.get('N8N_PASSWORD_RECOVERY_WEBHOOK_URL')!;
    
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
