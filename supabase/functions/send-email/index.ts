// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
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
  
  // Accent
  accent: '#A855F7',          // Purple lighter
  accentSoft: '#C4B5FD',      // Soft violet
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  
  // Text hierarchy
  textPrimary: '#1E1B4B',     // Deep indigo - títulos
  textSecondary: '#4B5563',   // Gray 600 - body
  textMuted: '#6B7280',       // Gray 500
  textLight: '#9CA3AF',       // Gray 400
  
  // Backgrounds
  bgGradientStart: '#FAF5FF', // Purple 50
  bgGradientEnd: '#F3E8FF',   // Purple 100
  bgCard: '#FFFFFF',
  bgSoft: '#F5F3FF',          // Violet 50
  bgHighlight: '#EDE9FE',     // Violet 100
  
  // Others
  white: '#FFFFFF',
  border: '#E5E7EB',
  borderSoft: '#DDD6FE',      // Violet 200
}

// Email base wrapper con gradiente de fondo
const emailWrapper = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>GlowApp</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
    }
    
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
  -moz-osx-font-smoothing: grayscale;
">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
`

const emailContainerStart = `
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
`

const emailContainerEnd = `
            </td>
          </tr>
        </table>
`

const emailFooterWrapper = `
      </td>
    </tr>
  </table>
</body>
</html>
`

// Logo header con imagotipo y tipográfico
const logoHeader = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding-bottom: 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <!-- Imagotipo (icono) -->
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
              <!-- Logotipo tipográfico -->
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
`

// Footer del email
const emailFooter = `
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
`

// Botón con gradiente
const button = (text: string, href: string, variant: 'primary' | 'warning' = 'primary') => {
  const bgGradient = variant === 'primary' 
    ? `linear-gradient(135deg, ${BRAND.primaryStart} 0%, ${BRAND.primaryEnd} 100%)`
    : `linear-gradient(135deg, ${BRAND.warning} 0%, #F97316 100%)`
  
  const shadowColor = variant === 'primary' ? 'rgba(99, 102, 241, 0.35)' : 'rgba(245, 158, 11, 0.35)'
  
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
    <tr>
      <td align="center">
        <a href="${href}" target="_blank" style="
          display: inline-block;
          background: ${bgGradient};
          color: ${BRAND.white};
          padding: 16px 44px;
          border-radius: 14px;
          text-decoration: none;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: -0.01em;
          box-shadow: 0 8px 20px -4px ${shadowColor};
          transition: transform 0.2s;
        ">
          ${text}
        </a>
      </td>
    </tr>
  </table>
`}

// Badge/chip
const badge = (text: string, variant: 'primary' | 'success' | 'warning' = 'primary') => {
  const bgGradient = variant === 'primary' 
    ? `linear-gradient(135deg, ${BRAND.primaryStart} 0%, ${BRAND.primaryEnd} 100%)`
    : variant === 'success'
    ? `linear-gradient(135deg, ${BRAND.success} 0%, #059669 100%)`
    : `linear-gradient(135deg, ${BRAND.warning} 0%, #F97316 100%)`
  
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
    <tr>
      <td align="center">
        <span style="
          display: inline-block;
          background: ${bgGradient};
          color: ${BRAND.white};
          padding: 10px 24px;
          border-radius: 100px;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        ">
          ${text}
        </span>
      </td>
    </tr>
  </table>
`}

// Caja de información
const infoBox = (content: string) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
    <tr>
      <td style="
        background: ${BRAND.bgSoft};
        border-radius: 18px;
        padding: 28px;
        border: 1px solid ${BRAND.borderSoft};
      ">
        ${content}
      </td>
    </tr>
  </table>
`

// Caja de advertencia
const warningBox = (title: string, items: string[]) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
    <tr>
      <td style="
        background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
        border-radius: 16px;
        padding: 22px;
        border: 1px solid #FCD34D;
      ">
        <p style="color: #92400E; font-weight: 700; margin: 0 0 12px; font-size: 14px; letter-spacing: -0.01em;">${title}</p>
        ${items.map(item => `<p style="color: #92400E; font-size: 13px; margin: 4px 0; line-height: 1.5;">• ${item}</p>`).join('')}
      </td>
    </tr>
  </table>
`

// Feature item con icono
const featureItem = (emoji: string, text: string) => `
  <tr>
    <td style="padding: 10px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align: middle; padding-right: 14px;">
            <div style="
              background: linear-gradient(135deg, ${BRAND.primaryStart} 0%, ${BRAND.primaryEnd} 100%);
              width: 40px;
              height: 40px;
              border-radius: 12px;
              text-align: center;
              line-height: 40px;
              font-size: 18px;
            ">${emoji}</div>
          </td>
          <td style="vertical-align: middle;">
            <span style="color: ${BRAND.textSecondary}; font-size: 14px; line-height: 1.4;">${text}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
`

type EmailType = 'welcome' | 'password-reset' | 'email-verification' | 'b2b-lead-confirmation'

interface EmailRequest {
  type: EmailType
  to: string
  data: Record<string, unknown>
}

// ============ EMAIL TEMPLATES ============

const templates = {
  'email-verification': (data: { 
    userName?: string; 
    confirmationUrl: string;
  }) => ({
    subject: '✨ Verifica tu cuenta de GlowApp',
    html: `
      ${emailWrapper}
        ${emailContainerStart}
          ${logoHeader}
          
          ${badge('✉️ Verifica tu email')}
          
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
          
          <p style="color: ${BRAND.textSecondary}; font-size: 16px; text-align: center; margin: 0 0 8px; line-height: 1.6;">
            Hola <strong style="color: ${BRAND.textPrimary}; font-weight: 600;">${data.userName || 'amante de la belleza'}</strong>,
          </p>
          <p style="color: ${BRAND.textSecondary}; font-size: 16px; line-height: 1.7; text-align: center; margin: 0;">
            Gracias por unirte a <strong style="color: ${BRAND.primary};">GlowApp</strong>. Para activar tu cuenta, solo necesitas verificar tu email haciendo clic en el botón:
          </p>
          
          ${button('Verificar mi cuenta', data.confirmationUrl)}
          
          ${infoBox(`
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
          `)}

          ${warningBox('⏰ Este enlace expira en 24 horas', [
            'Si no creaste una cuenta en GlowApp, puedes ignorar este email'
          ])}

          <p style="color: ${BRAND.textLight}; font-size: 12px; text-align: center; line-height: 1.6; margin: 24px 0 0;">
            Si el botón no funciona, copia y pega este enlace:<br />
            <a href="${data.confirmationUrl}" style="color: ${BRAND.primary}; word-break: break-all; font-size: 11px; font-weight: 500;">
              ${data.confirmationUrl}
            </a>
          </p>
          
          ${emailFooter}
        ${emailContainerEnd}
      ${emailFooterWrapper}
    `
  }),

  welcome: (data: { userName?: string }) => ({
    subject: '🎉 ¡Bienvenido a GlowApp!',
    html: `
      ${emailWrapper}
        ${emailContainerStart}
          ${logoHeader}
          
          ${badge('🎉 Bienvenido', 'success')}
          
          <h1 style="
            color: ${BRAND.textPrimary};
            font-size: 28px;
            text-align: center;
            margin: 0 0 20px;
            font-weight: 800;
            letter-spacing: -0.02em;
            line-height: 1.2;
          ">
            ¡Hola ${data.userName || 'amante de la belleza'}!
          </h1>
          
          <p style="color: ${BRAND.textSecondary}; font-size: 16px; line-height: 1.7; text-align: center; margin: 0 0 28px;">
            Nos alegra que te hayas unido a la comunidad de <strong style="color: ${BRAND.primary};">GlowApp</strong>. Ahora tienes acceso a los mejores salones de belleza cerca de ti.
          </p>
          
          ${infoBox(`
            <p style="color: ${BRAND.textPrimary}; font-weight: 700; margin: 0 0 16px; font-size: 16px; text-align: center;">Con GlowApp puedes:</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${featureItem('✨', 'Descubrir salones increíbles cerca de ti')}
              ${featureItem('📅', 'Reservar citas en segundos')}
              ${featureItem('💬', 'Chatear directamente con los salones')}
              ${featureItem('⭐', 'Leer y dejar reseñas')}
            </table>
          `)}
          
          ${button('Explorar salones', APP_URL)}
          
          <p style="color: ${BRAND.textSecondary}; font-size: 15px; text-align: center; line-height: 1.6; margin: 0;">
            Con cariño,<br />
            <strong style="color: ${BRAND.textPrimary}; font-weight: 600;">El equipo de GlowApp</strong> 💜
          </p>
          
          ${emailFooter}
        ${emailContainerEnd}
      ${emailFooterWrapper}
    `
  }),

  'b2b-lead-confirmation': (data: {
    contactName?: string;
    businessName?: string;
  }) => ({
    subject: '💜 Hemos recibido tu solicitud — GlowApp',
    html: `
      ${emailWrapper}
        ${emailContainerStart}
          ${logoHeader}
          
          ${badge('📩 Solicitud recibida', 'success')}
          
          <h1 style="
            color: ${BRAND.textPrimary};
            font-size: 28px;
            text-align: center;
            margin: 0 0 20px;
            font-weight: 800;
            letter-spacing: -0.02em;
            line-height: 1.2;
          ">
            ¡Hola ${data.contactName || 'profesional'}!
          </h1>
          
          <p style="color: ${BRAND.textSecondary}; font-size: 16px; line-height: 1.7; text-align: center; margin: 0 0 12px;">
            Hemos recibido tu solicitud de información sobre <strong style="color: ${BRAND.primary};">GlowApp</strong> y nos alegra mucho que quieras dar el paso para profesionalizar tu salón.
          </p>
          
          <p style="color: ${BRAND.textSecondary}; font-size: 16px; line-height: 1.7; text-align: center; margin: 0 0 12px;">
            Lo ideal es que hablemos <strong style="color: ${BRAND.textPrimary};">10 minutos</strong> para entender las necesidades específicas de tu negocio y mostrarte cómo puedes empezar a ahorrar tiempo y dinero desde el primer día.
          </p>

          ${data.businessName ? infoBox(`
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <p style="color: ${BRAND.textMuted}; font-size: 13px; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Tu negocio</p>
                  <p style="color: ${BRAND.textPrimary}; font-weight: 700; margin: 0; font-size: 18px;">${data.businessName}</p>
                </td>
              </tr>
            </table>
          `) : ''}

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td style="
                background: linear-gradient(135deg, ${BRAND.bgSoft} 0%, ${BRAND.bgHighlight} 100%);
                border-radius: 16px;
                padding: 22px;
                border: 1px solid ${BRAND.borderSoft};
                text-align: center;
              ">
                <p style="color: ${BRAND.primary}; font-weight: 700; margin: 0 0 4px; font-size: 16px;">📞 Te contactaremos en las próximas 24 horas</p>
                <p style="color: ${BRAND.textSecondary}; font-size: 14px; margin: 0; line-height: 1.5;">Prepárate para descubrir cómo GlowApp puede transformar tu negocio.</p>
              </td>
            </tr>
          </table>
          
          ${button('Visita GlowApp', APP_URL)}
          
          <p style="color: ${BRAND.textSecondary}; font-size: 15px; text-align: center; line-height: 1.6; margin: 0;">
            Con cariño,<br />
            <strong style="color: ${BRAND.textPrimary}; font-weight: 600;">El equipo de GlowApp</strong> 💜
          </p>
          
          ${emailFooter}
        ${emailContainerEnd}
      ${emailFooterWrapper}
    `
  }),

  'password-reset': (data: { 
    userName?: string; 
    resetLink: string;
  }) => ({
    subject: '🔐 Recupera tu contraseña de GlowApp',
    html: `
      ${emailWrapper}
        ${emailContainerStart}
          ${logoHeader}
          
          ${badge('🔐 Recuperar contraseña', 'warning')}
          
          <h1 style="
            color: ${BRAND.textPrimary};
            font-size: 26px;
            text-align: center;
            margin: 0 0 20px;
            font-weight: 800;
            letter-spacing: -0.02em;
            line-height: 1.2;
          ">
            Restablece tu contraseña
          </h1>
          
          <p style="color: ${BRAND.textSecondary}; font-size: 16px; text-align: center; margin: 0 0 8px; line-height: 1.6;">
            Hola <strong style="color: ${BRAND.textPrimary}; font-weight: 600;">${data.userName || 'usuario'}</strong>,
          </p>
          <p style="color: ${BRAND.textSecondary}; font-size: 16px; text-align: center; line-height: 1.7; margin: 0;">
            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong style="color: ${BRAND.primary};">GlowApp</strong>.
          </p>
          <p style="color: ${BRAND.textSecondary}; font-size: 16px; text-align: center; line-height: 1.7; margin: 16px 0 0;">
            Haz clic en el siguiente botón para crear una nueva contraseña:
          </p>
          
          ${button('Restablecer contraseña', data.resetLink, 'warning')}

          ${warningBox('⏰ Importante:', [
            'Este enlace expira en 1 hora',
            'Si no solicitaste este cambio, ignora este email',
            'Tu contraseña actual seguirá siendo válida'
          ])}

          <p style="color: ${BRAND.textLight}; font-size: 12px; text-align: center; line-height: 1.6; margin: 24px 0 0;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
            <a href="${data.resetLink}" style="color: ${BRAND.primary}; word-break: break-all; font-size: 11px; font-weight: 500;">
              ${data.resetLink}
            </a>
          </p>
          
          ${emailFooter}
        ${emailContainerEnd}
      ${emailFooterWrapper}
    `
  })
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { type, to, data }: EmailRequest = await req.json()

    if (!type || !to) {
      throw new Error('Missing required fields: type, to')
    }

    const template = templates[type]
    if (!template) {
      throw new Error(`Unknown email type: ${type}. Available types: welcome, password-reset, email-verification`)
    }

    const { subject, html } = template(data as never)

    const emailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    })

    console.log(`Email sent successfully: ${type} to ${to}`, emailResponse)

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error("Error in send-email function:", error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  }
})
