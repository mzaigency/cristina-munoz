// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const APP_URL = 'https://www.glowapp.app'
const FROM_EMAIL = 'GlowApp <contacto@glowapp.app>'
const LOGO_URL = `${APP_URL}/og-image.png`

// Brand Colors
const BRAND = {
  primary: '#4169E1',
  accent: '#9333EA',
  warning: '#F59E0B',
  text: '#1a1a2e',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  bgLight: '#F8F7FF',
  bgGray: '#F6F9FC',
  white: '#FFFFFF',
  border: '#E5E7EB',
}

const emailWrapper = `
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
`

const emailContainer = `
  <div style="
    max-width: 560px;
    margin: 0 auto;
    background: ${BRAND.white};
    border-radius: 24px;
    padding: 40px;
    box-shadow: 0 4px 24px rgba(65, 105, 225, 0.08);
  ">
`

const logoHeader = `
  <div style="text-align: center; margin-bottom: 32px;">
    <img src="${LOGO_URL}" width="140" alt="GlowApp" style="border-radius: 12px;" />
  </div>
`

const emailFooter = `
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
`

const button = (text: string, href: string, color: string = BRAND.primary) => `
  <div style="text-align: center; margin: 32px 0;">
    <a href="${href}" style="
      display: inline-block;
      background: linear-gradient(135deg, ${color} 0%, ${color === BRAND.primary ? BRAND.accent : color} 100%);
      color: ${BRAND.white};
      padding: 16px 40px;
      border-radius: 14px;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 4px 14px rgba(65, 105, 225, 0.3);
    ">
      ${text}
    </a>
  </div>
`

const badge = (text: string, bgColor: string) => `
  <div style="text-align: center; margin-bottom: 24px;">
    <span style="
      display: inline-block;
      background: ${bgColor};
      color: ${BRAND.white};
      padding: 8px 20px;
      border-radius: 100px;
      font-weight: 600;
      font-size: 13px;
    ">
      ${text}
    </span>
  </div>
`

const infoBox = (content: string, bgColor: string = BRAND.bgLight) => `
  <div style="
    background: ${bgColor};
    border-radius: 16px;
    padding: 24px;
    margin: 24px 0;
  ">
    ${content}
  </div>
`

const warningBox = (title: string, items: string[]) => `
  <div style="
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
    border-radius: 14px;
    padding: 20px;
    margin: 24px 0;
  ">
    <p style="color: #92400E; font-weight: 600; margin: 0 0 12px; font-size: 14px;">${title}</p>
    ${items.map(item => `<p style="color: #92400E; font-size: 13px; margin: 4px 0;">• ${item}</p>`).join('')}
  </div>
`

// Email templates
function getConfirmationEmail(userName: string, confirmationUrl: string) {
  return {
    subject: '✨ Verifica tu cuenta de GlowApp',
    html: `
      ${emailWrapper}
        ${emailContainer}
          ${logoHeader}
          
          ${badge('✉️ Verifica tu email', `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%)`)}
          
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
            Hola <strong style="color: ${BRAND.text}">${userName || 'amante de la belleza'}</strong>,
          </p>
          <p style="color: ${BRAND.textMuted}; font-size: 16px; line-height: 26px; text-align: center; margin: 0 0 8px;">
            Gracias por unirte a GlowApp. Para activar tu cuenta, solo necesitas verificar tu email haciendo clic en el botón:
          </p>
          
          ${button('Verificar mi cuenta', confirmationUrl)}
          
          ${infoBox(`
            <div style="text-align: center;">
              <p style="color: ${BRAND.text}; font-weight: 600; margin: 0 0 8px; font-size: 15px;">¿Qué sigue después?</p>
              <p style="color: ${BRAND.textMuted}; font-size: 14px; margin: 0; line-height: 22px;">
                Una vez verificado, podrás descubrir salones, reservar citas y conectar con profesionales de belleza cerca de ti.
              </p>
            </div>
          `)}

          ${warningBox('⏰ Este enlace expira en 24 horas', [
            'Si no creaste una cuenta en GlowApp, ignora este email'
          ])}

          <p style="color: ${BRAND.textLight}; font-size: 12px; text-align: center; line-height: 20px;">
            Si el botón no funciona, copia y pega este enlace:<br />
            <a href="${confirmationUrl}" style="color: ${BRAND.primary}; word-break: break-all; font-size: 11px;">
              ${confirmationUrl}
            </a>
          </p>
          
          ${emailFooter}
        </div>
      </body>
      </html>
    `
  }
}

function getRecoveryEmail(userName: string, recoveryUrl: string) {
  return {
    subject: '🔐 Recupera tu contraseña de GlowApp',
    html: `
      ${emailWrapper}
        ${emailContainer}
          ${logoHeader}
          
          ${badge('🔐 Recuperar contraseña', BRAND.warning)}
          
          <h1 style="
            color: ${BRAND.text};
            font-size: 24px;
            text-align: center;
            margin: 0 0 16px;
            font-weight: 700;
          ">
            Restablece tu contraseña
          </h1>
          
          <p style="color: ${BRAND.textMuted}; font-size: 16px; text-align: center;">
            Hola <strong style="color: ${BRAND.text}">${userName || 'usuario'}</strong>,
          </p>
          <p style="color: ${BRAND.textMuted}; font-size: 16px; text-align: center; line-height: 26px; margin: 0;">
            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en GlowApp.
          </p>
          <p style="color: ${BRAND.textMuted}; font-size: 16px; text-align: center; line-height: 26px;">
            Haz clic en el siguiente botón para crear una nueva contraseña:
          </p>
          
          ${button('Restablecer contraseña', recoveryUrl)}

          ${warningBox('⏰ Importante:', [
            'Este enlace expira en 1 hora',
            'Si no solicitaste este cambio, ignora este email'
          ])}

          <p style="color: ${BRAND.textLight}; font-size: 12px; text-align: center; line-height: 20px;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
            <a href="${recoveryUrl}" style="color: ${BRAND.primary}; word-break: break-all; font-size: 11px;">
              ${recoveryUrl}
            </a>
          </p>
          
          ${emailFooter}
        </div>
      </body>
      </html>
    `
  }
}

// Auth hook handler
serve(async (req: Request): Promise<Response> => {
  try {
    const payload = await req.json()
    console.log('Auth email hook received:', JSON.stringify(payload, null, 2))

    const { email_data } = payload
    
    if (!email_data) {
      console.log('No email_data in payload')
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { token_hash, redirect_to, email_action_type } = email_data
    const userEmail = payload.user?.email
    const userName = payload.user?.user_metadata?.full_name || payload.user?.user_metadata?.name || ''

    if (!token_hash || !userEmail) {
      console.log('Missing token_hash or email')
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Build the confirmation URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const baseRedirect = redirect_to || `${APP_URL}/auth`
    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(baseRedirect)}`

    let emailContent: { subject: string; html: string }

    if (email_action_type === 'signup' || email_action_type === 'email_change') {
      emailContent = getConfirmationEmail(userName, confirmationUrl)
    } else if (email_action_type === 'recovery') {
      emailContent = getRecoveryEmail(userName, confirmationUrl)
    } else {
      console.log('Unknown email_action_type:', email_action_type)
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Send the email via Resend
    const emailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: [userEmail],
      subject: emailContent.subject,
      html: emailContent.html,
    })

    console.log('Email sent successfully:', emailResponse)

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in auth-email-hook:', error)
    // Return 200 to not block auth flow, but log the error
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
