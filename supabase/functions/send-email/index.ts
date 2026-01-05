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

type EmailType = 'welcome' | 'booking-confirmation' | 'booking-reminder' | 'new-message' | 'password-reset'

interface EmailRequest {
  type: EmailType
  to: string
  data: Record<string, unknown>
}

// Email templates as HTML strings
const templates = {
  welcome: (data: { userName?: string }) => ({
    subject: '¡Bienvenido a GlowApp! 💅',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f6f9fc; padding: 40px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${APP_URL}/og-image.png" width="150" alt="GlowApp" />
          </div>
          <h1 style="color: #1a1a2e; font-size: 28px; text-align: center;">¡Bienvenido a GlowApp! 💅</h1>
          <p style="color: #4a4a68; font-size: 16px; line-height: 26px;">Hola ${data.userName || 'amante de la belleza'},</p>
          <p style="color: #4a4a68; font-size: 16px; line-height: 26px;">
            Nos alegra que te hayas unido a la comunidad de GlowApp. Ahora tienes acceso a los mejores salones de belleza cerca de ti.
          </p>
          <div style="background: #f8f7ff; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="color: #1a1a2e; font-weight: 600; margin: 0 0 12px;">Con GlowApp puedes:</p>
            <p style="color: #4a4a68; margin: 4px 0;">✨ Descubrir salones increíbles cerca de ti</p>
            <p style="color: #4a4a68; margin: 4px 0;">📅 Reservar citas en segundos</p>
            <p style="color: #4a4a68; margin: 4px 0;">💬 Chatear directamente con los salones</p>
            <p style="color: #4a4a68; margin: 4px 0;">⭐ Leer y dejar reseñas</p>
          </div>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${APP_URL}" style="background: #6366f1; color: #fff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">
              Explorar salones
            </a>
          </div>
          <p style="color: #4a4a68; font-size: 14px;">Con cariño,<br />El equipo de GlowApp 💜</p>
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
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f6f9fc; padding: 40px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px;">
          <div style="text-align: center; margin-bottom: 16px;">
            <img src="${APP_URL}/og-image.png" width="120" alt="GlowApp" />
          </div>
          <div style="background: #10b981; border-radius: 20px; padding: 8px 16px; text-align: center; max-width: 180px; margin: 0 auto 24px;">
            <span style="color: #fff; font-weight: 600;">✓ Reserva confirmada</span>
          </div>
          <h1 style="color: #1a1a2e; font-size: 24px; text-align: center;">¡Tu cita está lista!</h1>
          <p style="color: #4a4a68; font-size: 16px;">Hola ${data.customerName},</p>
          <p style="color: #4a4a68; font-size: 16px;">Tu cita en <strong>${data.salonName}</strong> ha sido confirmada. ¡Te esperamos!</p>
          
          <div style="background: #f8f7ff; border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="color: #1a1a2e; font-size: 20px; font-weight: 700; margin: 0 0 16px;">${data.salonName}</p>
            <p style="color: #4a4a68; margin: 8px 0;">📅 <strong>${data.date}</strong> a las <strong>${data.time}</strong></p>
            <p style="color: #4a4a68; margin: 8px 0;">💇 Profesional: <strong>${data.stylist}</strong></p>
            <p style="color: #4a4a68; margin: 8px 0;">⏱️ Duración: ${data.totalDuration || 60} min</p>
            ${data.services?.length ? `
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: left;">
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px;">SERVICIOS:</p>
                ${data.services.map(s => `<p style="color: #4a4a68; margin: 4px 0;">• ${s}</p>`).join('')}
              </div>
            ` : ''}
            ${data.address ? `
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: left;">
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px;">📍 DIRECCIÓN:</p>
                <p style="color: #4a4a68; margin: 0;">${data.address}</p>
              </div>
            ` : ''}
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${APP_URL}/mis-reservas" style="background: #6366f1; color: #fff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">
              Ver mis citas
            </a>
          </div>

          <div style="background: #fef3c7; border-radius: 12px; padding: 16px; margin: 24px 0;">
            <p style="color: #92400e; font-weight: 600; margin: 0 0 8px;">💡 Recuerda:</p>
            <p style="color: #92400e; font-size: 13px; margin: 4px 0;">• Llega 5 minutos antes de tu cita</p>
            <p style="color: #92400e; font-size: 13px; margin: 4px 0;">• Si necesitas cancelar, hazlo con 24h de anticipación</p>
          </div>
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
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f6f9fc; padding: 40px 20px;">
          <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px;">
            <div style="text-align: center; margin-bottom: 16px;">
              <img src="${APP_URL}/og-image.png" width="120" alt="GlowApp" />
            </div>
            <div style="background: ${isUrgent ? '#f59e0b' : '#6366f1'}; border-radius: 20px; padding: 8px 16px; text-align: center; max-width: 160px; margin: 0 auto 24px;">
              <span style="color: #fff; font-weight: 600;">${isUrgent ? '⏰ ¡Ya casi!' : '📅 Recordatorio'}</span>
            </div>
            <h1 style="color: #1a1a2e; font-size: 22px; text-align: center;">
              ${isUrgent ? '¡Tu cita es en 1 hora!' : `Tu cita es mañana a las ${data.time}`}
            </h1>
            <p style="color: #4a4a68; font-size: 16px;">Hola ${data.customerName},</p>
            <p style="color: #4a4a68; font-size: 16px;">
              ${isUrgent 
                ? `No olvides tu cita en ${data.salonName}. ¡Te esperamos en unos minutos!`
                : `Te recordamos que mañana tienes una cita en ${data.salonName}.`
              }
            </p>
            
            <div style="background: #f8f7ff; border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
              <p style="color: #1a1a2e; font-size: 20px; font-weight: 700; margin: 0 0 16px;">${data.salonName}</p>
              <p style="color: #4a4a68; margin: 8px 0;">📅 ${data.date} • 🕐 ${data.time}</p>
              <p style="color: #4a4a68; margin: 8px 0;">💇 ${data.stylist}</p>
              ${data.services?.length ? `
                <div style="margin-top: 16px;">
                  ${data.services.map(s => `<span style="background: #fff; border-radius: 16px; color: #6366f1; padding: 6px 12px; margin: 4px; display: inline-block; font-size: 13px;">${s}</span>`).join('')}
                </div>
              ` : ''}
              ${data.address ? `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: left;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px;">📍 Dirección:</p>
                  <p style="color: #4a4a68; margin: 0;">${data.address}</p>
                  <a href="https://maps.google.com/?q=${encodeURIComponent(data.address)}" style="color: #6366f1; font-size: 13px;">Ver en Google Maps →</a>
                </div>
              ` : ''}
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${APP_URL}/mis-reservas" style="background: #6366f1; color: #fff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">
                Ver detalles de la cita
              </a>
            </div>
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
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f6f9fc; padding: 40px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px;">
          <div style="text-align: center; margin-bottom: 16px;">
            <img src="${APP_URL}/og-image.png" width="120" alt="GlowApp" />
          </div>
          <div style="background: #3b82f6; border-radius: 20px; padding: 8px 16px; text-align: center; max-width: 160px; margin: 0 auto 24px;">
            <span style="color: #fff; font-weight: 600;">💬 Nuevo mensaje</span>
          </div>
          <h1 style="color: #1a1a2e; font-size: 24px; text-align: center;">Tienes un mensaje nuevo</h1>
          <p style="color: #4a4a68; font-size: 16px;">Hola ${data.recipientName},</p>
          <p style="color: #4a4a68; font-size: 16px;"><strong>${data.senderName}</strong> te ha enviado un mensaje en GlowApp.</p>
          
          <div style="background: #f8f7ff; border-radius: 16px; padding: 20px; margin: 24px 0;">
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
              <div style="background: #6366f1; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600;">
                ${data.senderName.charAt(0).toUpperCase()}
              </div>
              <div style="margin-left: 12px;">
                <p style="color: #1a1a2e; font-weight: 600; margin: 0;">${data.senderName}</p>
                <p style="color: #9ca3af; font-size: 12px; margin: 2px 0 0;">Hace unos momentos</p>
              </div>
            </div>
            <div style="background: #fff; border-radius: 12px; border-left: 4px solid #6366f1; padding: 12px;">
              <p style="color: #4a4a68; font-style: italic; margin: 0;">
                "${data.messagePreview.length > 150 ? data.messagePreview.substring(0, 150) + '...' : data.messagePreview}"
              </p>
            </div>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${APP_URL}/mensajes?chat=${data.conversationId}" style="background: #6366f1; color: #fff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">
              Responder mensaje
            </a>
          </div>
          
          <p style="color: #9ca3af; font-size: 13px; text-align: center;">
            No respondas a este email. Para enviar un mensaje, usa el botón de arriba.
          </p>
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
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f6f9fc; padding: 40px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px;">
          <div style="text-align: center; margin-bottom: 16px;">
            <img src="${APP_URL}/og-image.png" width="120" alt="GlowApp" />
          </div>
          <div style="background: #f59e0b; border-radius: 20px; padding: 8px 16px; text-align: center; max-width: 200px; margin: 0 auto 24px;">
            <span style="color: #fff; font-weight: 600;">🔐 Recuperar contraseña</span>
          </div>
          <h1 style="color: #1a1a2e; font-size: 24px; text-align: center;">Restablece tu contraseña</h1>
          <p style="color: #4a4a68; font-size: 16px;">Hola ${data.userName || 'usuario'},</p>
          <p style="color: #4a4a68; font-size: 16px;">
            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en GlowApp.
          </p>
          <p style="color: #4a4a68; font-size: 16px;">
            Haz clic en el siguiente botón para crear una nueva contraseña:
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.resetLink}" style="background: #6366f1; color: #fff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block;">
              Restablecer contraseña
            </a>
          </div>

          <div style="background: #fef3c7; border-radius: 12px; padding: 16px; margin: 24px 0;">
            <p style="color: #92400e; font-weight: 600; margin: 0 0 8px;">⏰ Importante:</p>
            <p style="color: #92400e; font-size: 13px; margin: 4px 0;">• Este enlace expira en 1 hora</p>
            <p style="color: #92400e; font-size: 13px; margin: 4px 0;">• Si no solicitaste este cambio, ignora este email</p>
          </div>

          <p style="color: #9ca3af; font-size: 13px; text-align: center;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
            <a href="${data.resetLink}" style="color: #6366f1; word-break: break-all;">${data.resetLink}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Este email fue enviado automáticamente. Por favor, no respondas a este mensaje.
          </p>
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
