// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@2.0.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const APP_URL = 'https://www.glowapp.app'
const FROM_EMAIL = 'GlowApp <contacto@glowapp.app>'

// Logos de GlowApp (públicos en /public)
const LOGO_ICON_URL = `${APP_URL}/email-assets/glowapp-icon.png`
const LOGO_TEXT_URL = `${APP_URL}/email-assets/glowapp-logo.png`

// Brand Colors - GlowApp Design System
const BRAND = {
  // Primary gradient
  primaryStart: '#6366F1',    // Indigo
  primaryEnd: '#8B5CF6',      // Violet
  primary: '#7C3AED',         // Purple main
  
  // Text hierarchy
  textPrimary: '#1E1B4B',     // Deep indigo
  textSecondary: '#4B5563',   // Gray 600
  textMuted: '#6B7280',       // Gray 500
  textLight: '#9CA3AF',       // Gray 400
  
  // Backgrounds
  bgGradientStart: '#FAF5FF', // Purple 50
  bgGradientEnd: '#F3E8FF',   // Purple 100
  bgCard: '#FFFFFF',
  bgSoft: '#F5F3FF',          // Violet 50
  
  // Others
  white: '#FFFFFF',
  border: '#E5E7EB',
  borderSoft: '#DDD6FE',      // Violet 200
}

function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

const emailTemplate = (userName: string, verificationUrl: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <title>Verifica tu cuenta · Glowapp</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F6F7FB;padding:28px 12px"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #ECEDF3">
    <tr><td style="height:5px;line-height:5px;font-size:0;background:#22408B;background-image:linear-gradient(100deg,#22408B,#98329A)">&nbsp;</td></tr>
    <tr><td align="center" style="padding:26px 28px 0">
      <img src="${LOGO_TEXT_URL}" width="128" alt="Glowapp" style="display:block">
    </td></tr>
    <tr><td align="center" style="padding:18px 28px 0">
      <span style="display:inline-block;padding:5px 14px;border-radius:999px;background:#EEF1FA;color:#22408B;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Verifica tu email</span>
      <h1 style="color:#131520;font-size:24px;font-weight:800;margin:14px 0 8px;letter-spacing:-.02em;line-height:1.25">¡Ya casi estás!</h1>
      <p style="color:#4a4d5c;font-size:15px;margin:0;line-height:1.6">Hola <strong style="color:#131520">${userName}</strong>, confirma tu email para activar tu cuenta de Glowapp.</p>
    </td></tr>
    <tr><td align="center" style="padding:24px 28px 0">
      <a href="${verificationUrl}" target="_blank" style="display:inline-block;background:#22408B;background-image:linear-gradient(100deg,#22408B,#98329A);color:#ffffff;padding:13px 30px;border-radius:999px;text-decoration:none;font-weight:700;font-size:15px">Verificar mi cuenta</a>
    </td></tr>
    <tr><td style="padding:22px 28px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F6F7FB;border-radius:16px"><tr><td style="padding:18px 20px">
        <p style="margin:0 0 6px;color:#131520;font-size:14px;font-weight:700">¿Qué sigue después?</p>
        <p style="margin:0;color:#4a4d5c;font-size:13px;line-height:1.6">Descubre salones cerca de ti, reserva en segundos y guarda tu historial de citas.</p>
      </td></tr></table>
    </td></tr>
    <tr><td align="center" style="padding:18px 28px 26px">
      <p style="color:#8A8FA3;font-size:12px;margin:0 0 10px;line-height:1.6">El enlace caduca en 24 horas. Si no creaste una cuenta, ignora este email.</p>
      <p style="color:#A2A6B6;font-size:11px;margin:0;word-break:break-all">${verificationUrl}</p>
    </td></tr>
    <tr><td style="padding:16px 28px 22px;background:#FBFBFD;border-top:1px solid #ECEDF3;text-align:center">
      <p style="margin:0;font-size:11px;color:#A2A6B6">Enviado con <a href="${APP_URL}" style="color:#22408B;font-weight:700;text-decoration:none">Glowapp</a> · reservas y gestión para tu salón</p>
    </td></tr>
  </table>
</td></tr></table>
</body>
</html>
`

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId, email, userName } = await req.json()

    if (!userId || !email) {
      throw new Error('Missing required fields: userId, email')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Generate verification token
    const token = generateToken()
    
    // Store in database
    const { error: insertError } = await supabaseAdmin
      .from('email_verification_tokens')
      .insert({
        user_id: userId,
        email: email,
        token: token
      })

    if (insertError) {
      console.error('Error inserting token:', insertError)
      throw new Error('Failed to create verification token')
    }

    // Build verification URL
    const verificationUrl = `${APP_URL}/verify-email?token=${token}`

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      reply_to: 'gglowapp@gmail.com',
      to: [email],
      subject: '✨ Verifica tu cuenta de GlowApp',
      html: emailTemplate(userName || 'amante de la belleza', verificationUrl),
    })

    if (emailResponse.error) {
      console.error(`Resend rejected verification email to ${email}:`, emailResponse.error)
      return new Response(
        JSON.stringify({ error: emailResponse.error.message ?? 'Resend error', details: emailResponse.error }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      )
    }

    console.log(`Verification email sent to ${email}`, emailResponse.data)

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error("Error in send-verification-email:", error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  }
})
