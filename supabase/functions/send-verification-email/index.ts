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
const LOGO_URL = `${APP_URL}/og-image.png`

const BRAND = {
  primary: '#4169E1',
  accent: '#9333EA',
  text: '#1a1a2e',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  bgLight: '#F8F7FF',
  bgGray: '#F6F9FC',
  white: '#FFFFFF',
  border: '#E5E7EB',
}

function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

const emailTemplate = (userName: string, verificationUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, ${BRAND.bgLight} 0%, ${BRAND.bgGray} 100%);
  margin: 0;
  padding: 40px 20px;
  -webkit-font-smoothing: antialiased;
">
  <div style="
    max-width: 560px;
    margin: 0 auto;
    background: ${BRAND.white};
    border-radius: 24px;
    padding: 40px;
    box-shadow: 0 4px 24px rgba(65, 105, 225, 0.08);
  ">
    <div style="text-align: center; margin-bottom: 32px;">
      <img src="${LOGO_URL}" width="140" alt="GlowApp" style="border-radius: 12px;" />
    </div>
    
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="
        display: inline-block;
        background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%);
        color: ${BRAND.white};
        padding: 8px 20px;
        border-radius: 100px;
        font-weight: 600;
        font-size: 13px;
      ">
        ✉️ Verifica tu email
      </span>
    </div>
    
    <h1 style="
      color: ${BRAND.text};
      font-size: 26px;
      text-align: center;
      margin: 0 0 16px;
      font-weight: 700;
    ">
      ¡Ya casi estás!
    </h1>
    
    <p style="color: ${BRAND.textMuted}; font-size: 16px; text-align: center;">
      Hola <strong style="color: ${BRAND.text}">${userName}</strong>,
    </p>
    <p style="color: ${BRAND.textMuted}; font-size: 16px; line-height: 26px; text-align: center; margin: 0 0 8px;">
      Gracias por unirte a GlowApp. Para activar tu cuenta, solo necesitas verificar tu email haciendo clic en el botón:
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verificationUrl}" style="
        display: inline-block;
        background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%);
        color: ${BRAND.white};
        padding: 16px 40px;
        border-radius: 14px;
        text-decoration: none;
        font-weight: 600;
        font-size: 15px;
        box-shadow: 0 4px 14px rgba(65, 105, 225, 0.3);
      ">
        Verificar mi cuenta
      </a>
    </div>
    
    <div style="
      background: ${BRAND.bgLight};
      border-radius: 16px;
      padding: 24px;
      margin: 24px 0;
    ">
      <div style="text-align: center;">
        <p style="color: ${BRAND.text}; font-weight: 600; margin: 0 0 8px; font-size: 15px;">¿Qué sigue después?</p>
        <p style="color: ${BRAND.textMuted}; font-size: 14px; margin: 0; line-height: 22px;">
          Una vez verificado, podrás descubrir salones, reservar citas y conectar con profesionales de belleza cerca de ti.
        </p>
      </div>
    </div>

    <div style="
      background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
      border-radius: 14px;
      padding: 20px;
      margin: 24px 0;
    ">
      <p style="color: #92400E; font-weight: 600; margin: 0 0 12px; font-size: 14px;">⏰ Este enlace expira en 24 horas</p>
      <p style="color: #92400E; font-size: 13px; margin: 4px 0;">• Si no creaste una cuenta en GlowApp, ignora este email</p>
    </div>

    <p style="color: ${BRAND.textLight}; font-size: 12px; text-align: center; line-height: 20px;">
      Si el botón no funciona, copia y pega este enlace:<br />
      <a href="${verificationUrl}" style="color: ${BRAND.primary}; word-break: break-all; font-size: 11px;">
        ${verificationUrl}
      </a>
    </p>
    
    <div style="
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid ${BRAND.border};
      text-align: center;
    ">
      <p style="color: ${BRAND.textLight}; font-size: 12px; margin: 0 0 8px;">
        © ${new Date().getFullYear()} GlowApp. Todos los derechos reservados.
      </p>
      <p style="color: ${BRAND.textLight}; font-size: 11px; margin: 0;">
        Este email fue enviado desde <a href="${APP_URL}" style="color: ${BRAND.primary}; text-decoration: none;">glowapp.app</a>
      </p>
    </div>
  </div>
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
      to: [email],
      subject: '✨ Verifica tu cuenta de GlowApp',
      html: emailTemplate(userName || 'amante de la belleza', verificationUrl),
    })

    console.log(`Verification email sent to ${email}`, emailResponse)

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
