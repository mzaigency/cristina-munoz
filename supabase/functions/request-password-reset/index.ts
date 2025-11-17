import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: Track requests by email/IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
const MAX_REQUESTS_PER_WINDOW = 3; // Máximo 3 solicitudes por ventana

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count++;
  return true;
}

// Limpiar registros antiguos periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Limpiar cada minuto

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

    // Rate limiting por email y por IP
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `${email}:${clientIp}`;
    
    if (!checkRateLimit(rateLimitKey)) {
      console.log(`Rate limit exceeded for ${email} from ${clientIp}`);
      return new Response(
        JSON.stringify({ 
          error: 'Demasiados intentos. Por favor, espera 15 minutos antes de intentar nuevamente.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
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
