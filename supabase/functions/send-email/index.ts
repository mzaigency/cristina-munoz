// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const APP_URL = 'https://glowapp.app'
const FROM_EMAIL = 'GlowApp <contacto@glowapp.app>'
const LOGO_URL = `${APP_URL}/og-image.png`

// Brand Colors (HSL to HEX)
const BRAND = {
  primary: '#4169E1',      // Blue - hsl(230, 85%, 60%)
  accent: '#9333EA',       // Purple - hsl(270, 80%, 60%)
  success: '#10B981',      // Green
  warning: '#F59E0B',      // Amber
  danger: '#EF4444',       // Red
  text: '#1a1a2e',         // Dark text
  textMuted: '#6B7280',    // Gray text
  textLight: '#9CA3AF',    // Light gray
  bgLight: '#F8F7FF',      // Light purple bg
  bgGray: '#F6F9FC',       // Gray bg
  white: '#FFFFFF',
  border: '#E5E7EB',
}

// Shared email styles
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

type EmailType = 'welcome' | 'booking-confirmation' | 'booking-reminder' | 'new-message' | 'password-reset'

interface EmailRequest {
  type: EmailType
  to: string
  data: Record<string, unknown>
}

// Email templates
const templates = {
  welcome: (data: { userName?: string }) => ({
    subject: '¡Bienvenido a GlowApp! ✨',
    html: `
      ${emailWrapper}
        ${emailContainer}
          ${logoHeader}
          
          ${badge('✨ Bienvenido a GlowApp', `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%)`)}
          
          <h1 style="
            color: ${BRAND.text};
            font-size: 26px;
            text-align: center;
            margin: 0 0 16px;
            font-weight: 700;
          ">
            ¡Hola ${data.userName || 'amante de la belleza'}!
          </h1>
          
          <p style="color: ${BRAND.textMuted}; font-size: 16px; line-height: 26px; text-align: center; margin: 0 0 24px;">
            Nos alegra que te hayas unido a la comunidad de GlowApp. Ahora tienes acceso a los mejores salones de belleza cerca de ti.
          </p>
          
          ${infoBox(`
            <p style="color: ${BRAND.text}; font-weight: 600; margin: 0 0 16px; font-size: 15px;">Con GlowApp puedes:</p>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%); width: 32px; height: 32px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 16px;">✨</span>
                <span style="color: ${BRAND.textMuted}; font-size: 14px;">Descubrir salones increíbles cerca de ti</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%); width: 32px; height: 32px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 16px;">📅</span>
                <span style="color: ${BRAND.textMuted}; font-size: 14px;">Reservar citas en segundos</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%); width: 32px; height: 32px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 16px;">💬</span>
                <span style="color: ${BRAND.textMuted}; font-size: 14px;">Chatear directamente con los salones</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%); width: 32px; height: 32px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 16px;">⭐</span>
                <span style="color: ${BRAND.textMuted}; font-size: 14px;">Leer y dejar reseñas</span>
              </div>
            </div>
          `)}
          
          ${button('Explorar salones', APP_URL)}
          
          <p style="color: ${BRAND.textMuted}; font-size: 14px; text-align: center;">
            Con cariño,<br />
            <strong style="color: ${BRAND.text};">El equipo de GlowApp</strong> 💜
          </p>
          
          ${emailFooter}
        </div>
      </body>
      </html>
    `
  }),

  'booking-confirmation': (data: { 
    customerName: string; 
    salonName: string; 
    date: string; 
    time: string; 
    services?: string[]; 
    stylist: string;
    address?: string;
    totalDuration?: number;
  }) => ({
    subject: `✓ Cita confirmada en ${data.salonName} - ${data.date}`,
    html: `
      ${emailWrapper}
        ${emailContainer}
          ${logoHeader}
          
          ${badge('✓ Reserva confirmada', BRAND.success)}
          
          <h1 style="
            color: ${BRAND.text};
            font-size: 24px;
            text-align: center;
            margin: 0 0 16px;
            font-weight: 700;
          ">
            ¡Tu cita está lista!
          </h1>
          
          <p style="color: ${BRAND.textMuted}; font-size: 16px; text-align: center; margin: 0 0 8px;">
            Hola <strong style="color: ${BRAND.text}">${data.customerName}</strong>,
          </p>
          <p style="color: ${BRAND.textMuted}; font-size: 16px; text-align: center; margin: 0;">
            Tu cita en <strong style="color: ${BRAND.primary}">${data.salonName}</strong> ha sido confirmada.
          </p>
          
          ${infoBox(`
            <p style="
              color: ${BRAND.text};
              font-size: 20px;
              font-weight: 700;
              margin: 0 0 20px;
              text-align: center;
            ">${data.salonName}</p>
            
            <div style="text-align: center;">
              <p style="color: ${BRAND.textMuted}; margin: 8px 0; font-size: 15px;">
                📅 <strong style="color: ${BRAND.text}">${data.date}</strong> a las <strong style="color: ${BRAND.text}">${data.time}</strong>
              </p>
              <p style="color: ${BRAND.textMuted}; margin: 8px 0; font-size: 15px;">
                💇 Profesional: <strong style="color: ${BRAND.text}">${data.stylist}</strong>
              </p>
              <p style="color: ${BRAND.textMuted}; margin: 8px 0; font-size: 15px;">
                ⏱️ Duración: <strong style="color: ${BRAND.text}">${data.totalDuration || 60} min</strong>
              </p>
            </div>
            
            ${data.services?.length ? `
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid ${BRAND.border};">
                <p style="color: ${BRAND.textLight}; font-size: 11px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">Servicios</p>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                  ${data.services.map(s => `
                    <span style="
                      background: linear-gradient(135deg, ${BRAND.primary}15 0%, ${BRAND.accent}15 100%);
                      color: ${BRAND.primary};
                      padding: 6px 14px;
                      border-radius: 100px;
                      font-size: 13px;
                      font-weight: 500;
                    ">${s}</span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            
            ${data.address ? `
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid ${BRAND.border};">
                <p style="color: ${BRAND.textLight}; font-size: 11px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">📍 Dirección</p>
                <p style="color: ${BRAND.text}; margin: 0; font-size: 14px;">${data.address}</p>
                <a href="https://maps.google.com/?q=${encodeURIComponent(data.address)}" style="color: ${BRAND.primary}; font-size: 13px; margin-top: 8px; display: inline-block;">
                  Ver en Google Maps →
                </a>
              </div>
            ` : ''}
          `)}

          ${button('Ver mis citas', `${APP_URL}/mis-citas`)}

          ${warningBox('💡 Recuerda:', [
            'Llega 5 minutos antes de tu cita',
            'Si necesitas cancelar, hazlo con 24h de anticipación'
          ])}
          
          ${emailFooter}
        </div>
      </body>
      </html>
    `
  }),

  'booking-reminder': (data: { 
    customerName: string; 
    salonName: string; 
    date: string; 
    time: string; 
    services?: string[];
    stylist: string;
    address?: string;
    hoursUntil?: number;
  }) => {
    const isUrgent = (data.hoursUntil || 24) <= 1
    return {
      subject: isUrgent 
        ? `⏰ ¡Tu cita es en 1 hora! - ${data.salonName}`
        : `📅 Recordatorio: Tu cita mañana en ${data.salonName}`,
      html: `
        ${emailWrapper}
          ${emailContainer}
            ${logoHeader}
            
            ${badge(
              isUrgent ? '⏰ ¡Ya casi!' : '📅 Recordatorio',
              isUrgent ? BRAND.warning : `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%)`
            )}
            
            <h1 style="
              color: ${BRAND.text};
              font-size: 22px;
              text-align: center;
              margin: 0 0 16px;
              font-weight: 700;
            ">
              ${isUrgent ? '¡Tu cita es en 1 hora!' : `Tu cita es mañana a las ${data.time}`}
            </h1>
            
            <p style="color: ${BRAND.textMuted}; font-size: 16px; text-align: center;">
              Hola <strong style="color: ${BRAND.text}">${data.customerName}</strong>,
            </p>
            <p style="color: ${BRAND.textMuted}; font-size: 16px; text-align: center; margin: 0;">
              ${isUrgent 
                ? `No olvides tu cita en <strong style="color: ${BRAND.primary}">${data.salonName}</strong>. ¡Te esperamos!`
                : `Te recordamos que mañana tienes una cita en <strong style="color: ${BRAND.primary}">${data.salonName}</strong>.`
              }
            </p>
            
            ${infoBox(`
              <p style="color: ${BRAND.text}; font-size: 20px; font-weight: 700; margin: 0 0 16px; text-align: center;">
                ${data.salonName}
              </p>
              <p style="color: ${BRAND.textMuted}; margin: 8px 0; text-align: center; font-size: 15px;">
                📅 ${data.date} • 🕐 ${data.time}
              </p>
              <p style="color: ${BRAND.textMuted}; margin: 8px 0; text-align: center; font-size: 15px;">
                💇 ${data.stylist}
              </p>
              ${data.services?.length ? `
                <div style="margin-top: 16px; text-align: center;">
                  ${data.services.map(s => `
                    <span style="
                      background: ${BRAND.white};
                      border: 1px solid ${BRAND.border};
                      border-radius: 100px;
                      color: ${BRAND.primary};
                      padding: 6px 14px;
                      margin: 4px;
                      display: inline-block;
                      font-size: 13px;
                    ">${s}</span>
                  `).join('')}
                </div>
              ` : ''}
              ${data.address ? `
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid ${BRAND.border}; text-align: center;">
                  <p style="color: ${BRAND.textLight}; font-size: 11px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">📍 Dirección</p>
                  <p style="color: ${BRAND.text}; margin: 0 0 8px; font-size: 14px;">${data.address}</p>
                  <a href="https://maps.google.com/?q=${encodeURIComponent(data.address)}" style="color: ${BRAND.primary}; font-size: 13px;">
                    Ver en Google Maps →
                  </a>
                </div>
              ` : ''}
            `)}

            ${button('Ver detalles de la cita', `${APP_URL}/mis-citas`)}
            
            ${emailFooter}
          </div>
        </body>
        </html>
      `
    }
  },

  'new-message': (data: { 
    recipientName: string; 
    senderName: string; 
    messagePreview: string;
    conversationId: string;
  }) => ({
    subject: `💬 ${data.senderName} te ha enviado un mensaje`,
    html: `
      ${emailWrapper}
        ${emailContainer}
          ${logoHeader}
          
          ${badge('💬 Nuevo mensaje', BRAND.primary)}
          
          <h1 style="
            color: ${BRAND.text};
            font-size: 24px;
            text-align: center;
            margin: 0 0 16px;
            font-weight: 700;
          ">
            Tienes un mensaje nuevo
          </h1>
          
          <p style="color: ${BRAND.textMuted}; font-size: 16px; text-align: center;">
            Hola <strong style="color: ${BRAND.text}">${data.recipientName}</strong>,
          </p>
          <p style="color: ${BRAND.textMuted}; font-size: 16px; text-align: center; margin: 0;">
            <strong style="color: ${BRAND.primary}">${data.senderName}</strong> te ha enviado un mensaje en GlowApp.
          </p>
          
          ${infoBox(`
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
              <div style="
                background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%);
                width: 48px;
                height: 48px;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: ${BRAND.white};
                font-weight: 700;
                font-size: 18px;
              ">
                ${data.senderName.charAt(0).toUpperCase()}
              </div>
              <div style="margin-left: 14px;">
                <p style="color: ${BRAND.text}; font-weight: 600; margin: 0; font-size: 15px;">${data.senderName}</p>
                <p style="color: ${BRAND.textLight}; font-size: 12px; margin: 4px 0 0;">Hace unos momentos</p>
              </div>
            </div>
            <div style="
              background: ${BRAND.white};
              border-radius: 14px;
              border-left: 4px solid ${BRAND.primary};
              padding: 16px;
            ">
              <p style="color: ${BRAND.textMuted}; font-style: italic; margin: 0; font-size: 14px; line-height: 22px;">
                "${data.messagePreview.length > 150 ? data.messagePreview.substring(0, 150) + '...' : data.messagePreview}"
              </p>
            </div>
          `)}

          ${button('Responder mensaje', `${APP_URL}/mensajes?chat=${data.conversationId}`)}
          
          <p style="color: ${BRAND.textLight}; font-size: 13px; text-align: center;">
            No respondas a este email. Para enviar un mensaje, usa el botón de arriba.
          </p>
          
          ${emailFooter}
        </div>
      </body>
      </html>
    `
  }),

  'password-reset': (data: { 
    userName?: string; 
    resetLink: string;
  }) => ({
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
            Hola <strong style="color: ${BRAND.text}">${data.userName || 'usuario'}</strong>,
          </p>
          <p style="color: ${BRAND.textMuted}; font-size: 16px; text-align: center; line-height: 26px; margin: 0;">
            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en GlowApp.
          </p>
          <p style="color: ${BRAND.textMuted}; font-size: 16px; text-align: center; line-height: 26px;">
            Haz clic en el siguiente botón para crear una nueva contraseña:
          </p>
          
          ${button('Restablecer contraseña', data.resetLink)}

          ${warningBox('⏰ Importante:', [
            'Este enlace expira en 1 hora',
            'Si no solicitaste este cambio, ignora este email'
          ])}

          <p style="color: ${BRAND.textLight}; font-size: 12px; text-align: center; line-height: 20px;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
            <a href="${data.resetLink}" style="color: ${BRAND.primary}; word-break: break-all; font-size: 11px;">
              ${data.resetLink}
            </a>
          </p>
          
          ${emailFooter}
        </div>
      </body>
      </html>
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
      throw new Error(`Unknown email type: ${type}`)
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
