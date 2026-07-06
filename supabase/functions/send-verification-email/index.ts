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
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Verifica tu cuenta - GlowApp</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    * { box-sizing: border-box; }
    
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  </style>
</head>
<body style="
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(180deg, ${BRAND.bgGradientStart} 0%, ${BRAND.bgGradientEnd} 50%, ${BRAND.bgGradientStart} 100%);
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px;">
          <tr>
            <td style="
              background: ${BRAND.bgCard};
              border-radius: 28px;
              padding: 48px 40px;
              box-shadow: 
                0 0 0 1px rgba(124, 58, 237, 0.05),
                0 4px 6px -1px rgba(124, 58, 237, 0.05),
                0 20px 40px -8px rgba(124, 58, 237, 0.12);
            ">
              <!-- Logo Header -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <img 
                            src="${LOGO_ICON_URL}" 
                            width="56" 
                            height="56" 
                            alt="GlowApp" 
                            style="display: block; border-radius: 14px; margin-bottom: 12px;"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <img 
                            src="${LOGO_TEXT_URL}" 
                            width="130" 
                            height="auto" 
                            alt="GlowApp" 
                            style="display: block;"
                          />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Badge -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <span style="
                      display: inline-block;
                      background: linear-gradient(135deg, ${BRAND.primaryStart} 0%, ${BRAND.primaryEnd} 100%);
                      color: ${BRAND.white};
                      padding: 10px 24px;
                      border-radius: 100px;
                      font-weight: 700;
                      font-size: 13px;
                      letter-spacing: 0.02em;
                      text-transform: uppercase;
                    ">
                      ✉️ VERIFICA TU EMAIL
                    </span>
                  </td>
                </tr>
              </table>
              
              <!-- Title -->
              <h1 style="
                color: ${BRAND.textPrimary};
                font-size: 28px;
                text-align: center;
                margin: 0 0 20px;
                font-weight: 800;
                letter-spacing: -0.02em;
                line-height: 1.2;
              ">
                ¡Ya casi estás!
              </h1>
              
              <!-- Greeting -->
              <p style="color: ${BRAND.textSecondary}; font-size: 16px; text-align: center; margin: 0 0 8px; line-height: 1.6;">
                Hola <strong style="color: ${BRAND.textPrimary}; font-weight: 600;">${userName}</strong>,
              </p>
              <p style="color: ${BRAND.textSecondary}; font-size: 16px; line-height: 1.7; text-align: center; margin: 0;">
                Gracias por unirte a <strong style="color: ${BRAND.primary};">GlowApp</strong>. Para activar tu cuenta, solo necesitas verificar tu email haciendo clic en el botón:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" target="_blank" style="
                      display: inline-block;
                      background: linear-gradient(135deg, ${BRAND.primaryStart} 0%, ${BRAND.primaryEnd} 100%);
                      color: ${BRAND.white};
                      padding: 16px 44px;
                      border-radius: 14px;
                      text-decoration: none;
                      font-weight: 700;
                      font-size: 15px;
                      letter-spacing: -0.01em;
                      box-shadow: 0 8px 20px -4px rgba(99, 102, 241, 0.35);
                    ">
                      Verificar mi cuenta
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Info Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                <tr>
                  <td style="
                    background: ${BRAND.bgSoft};
                    border-radius: 18px;
                    padding: 28px;
                    border: 1px solid ${BRAND.borderSoft};
                  ">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <p style="color: ${BRAND.textPrimary}; font-weight: 700; margin: 0 0 10px; font-size: 16px;">¿Qué sigue después?</p>
                          <p style="color: ${BRAND.textSecondary}; font-size: 14px; margin: 0; line-height: 1.6;">
                            Una vez verificado, podrás descubrir salones, reservar citas y conectar con profesionales de belleza cerca de ti.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Warning Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td style="
                    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
                    border-radius: 16px;
                    padding: 22px;
                    border: 1px solid #FCD34D;
                  ">
                    <p style="color: #92400E; font-weight: 700; margin: 0 0 12px; font-size: 14px; letter-spacing: -0.01em;">⏰ Este enlace expira en 24 horas</p>
                    <p style="color: #92400E; font-size: 13px; margin: 4px 0; line-height: 1.5;">• Si no creaste una cuenta en GlowApp, puedes ignorar este email</p>
                  </td>
                </tr>
              </table>

              <!-- Fallback Link -->
              <p style="color: ${BRAND.textLight}; font-size: 12px; text-align: center; line-height: 1.6; margin: 24px 0 0;">
                Si el botón no funciona, copia y pega este enlace:<br />
                <a href="${verificationUrl}" style="color: ${BRAND.primary}; word-break: break-all; font-size: 11px; font-weight: 500;">
                  ${verificationUrl}
                </a>
              </p>
              
              <!-- Footer -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 36px;">
                <tr>
                  <td style="padding-top: 28px; border-top: 1px solid ${BRAND.border};">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding-bottom: 16px;">
                          <img 
                            src="${LOGO_ICON_URL}" 
                            width="32" 
                            height="32" 
                            alt="GlowApp" 
                            style="display: block; border-radius: 8px; opacity: 0.8;"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <p style="color: ${BRAND.textLight}; font-size: 13px; margin: 0 0 8px; line-height: 1.5;">
                            © ${new Date().getFullYear()} GlowApp. Todos los derechos reservados.
                          </p>
                          <p style="color: ${BRAND.textLight}; font-size: 12px; margin: 0; line-height: 1.5;">
                            Enviado con 💜 desde 
                            <a href="${APP_URL}" style="color: ${BRAND.primary}; text-decoration: none; font-weight: 500;">glowapp.app</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
