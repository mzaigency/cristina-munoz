// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = "https://www.glowapp.app";
const FROM_EMAIL = "GlowApp <contacto@glowapp.app>";

// Logos de GlowApp (públicos en /public)
const LOGO_ICON_URL = `${APP_URL}/email-assets/glowapp-icon.png`;
const LOGO_TEXT_URL = `${APP_URL}/email-assets/glowapp-logo.png`;

// Brand Colors - Glowapp (misma estética que el ticket de caja)
const BRAND = {
  primaryStart: "#22408B",
  primaryEnd: "#98329A",
  primary: "#22408B",
  success: "#0F7A47",
  warning: "#E07A21",
  textPrimary: "#131520",
  textSecondary: "#4a4d5c",
  textLight: "#8A8FA3",
  bgGradientStart: "#F6F7FB",
  bgGradientEnd: "#F6F7FB",
  bgCard: "#FFFFFF",
  bgSoft: "#F6F7FB",
  bgHighlight: "#EEF1FA",
  white: "#FFFFFF",
  border: "#ECEDF3",
  borderSoft: "#ECEDF3",
};

const GRADIENT = `linear-gradient(100deg, ${BRAND.primaryStart}, ${BRAND.primaryEnd})`;

// Envoltorio: fondo gris muy claro + tarjeta blanca con barra de marca
const emailWrapper = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <title>Glowapp</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.bgGradientStart};padding:28px 12px;">
    <tr>
      <td align="center">
`;

const emailContainerStart = `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:${BRAND.bgCard};border-radius:22px;overflow:hidden;border:1px solid ${BRAND.border};">
          <tr><td style="height:5px;line-height:5px;font-size:0;background:${BRAND.primaryStart};background-image:${GRADIENT};">&nbsp;</td></tr>
          <tr>
            <td style="padding:26px 28px 24px;">
`;

const emailContainerEnd = `
            </td>
          </tr>
        </table>
`;

const emailFooterWrapper = `
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Cabecera con el logotipo de Glowapp
const logoHeader = `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="padding-bottom:18px;">
                <img src="${LOGO_TEXT_URL}" width="128" height="auto" alt="Glowapp" style="display:block;">
              </td>
            </tr>
          </table>
`;

const emailFooter = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;">
    <tr>
      <td align="center" style="padding-top:18px;border-top:1px solid ${BRAND.border};">
        <p style="color:#A2A6B6;font-size:11px;margin:0;line-height:1.6;">
          Enviado con <a href="${APP_URL}" style="color:${BRAND.primary};text-decoration:none;font-weight:700;">Glowapp</a> · reservas y gestión para tu salón
        </p>
      </td>
    </tr>
  </table>
`;

// Botón píldora con gradiente de marca
const button = (text: string, href: string, _variant: "primary" | "warning" = "primary") => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0;">
    <tr>
      <td align="center">
        <a href="${href}" target="_blank" style="display:inline-block;background:${BRAND.primaryStart};background-image:${GRADIENT};color:${BRAND.white};padding:13px 30px;border-radius:999px;text-decoration:none;font-weight:700;font-size:15px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>
`;

// Píldora sobria (no gradiente) como en el ticket
const badge = (text: string, variant: "primary" | "success" | "warning" = "primary") => {
  const bg = variant === "success" ? "#E8F7EF" : variant === "warning" ? "#FDF1E3" : BRAND.bgHighlight;
  const fg = variant === "success" ? BRAND.success : variant === "warning" ? BRAND.warning : BRAND.primary;
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
    <tr>
      <td align="center">
        <span style="display:inline-block;background:${bg};color:${fg};padding:5px 14px;border-radius:999px;font-weight:700;font-size:11px;letter-spacing:.08em;text-transform:uppercase;">
          ${text}
        </span>
      </td>
    </tr>
  </table>
`;
};

const infoBox = (content: string) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;">
    <tr>
      <td style="background:${BRAND.bgSoft};border-radius:16px;padding:20px;">
        ${content}
      </td>
    </tr>
  </table>
`;

const warningBox = (title: string, items: string[]) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr>
      <td style="background:${BRAND.bgSoft};border-radius:16px;padding:18px 20px;border-left:3px solid ${BRAND.warning};">
        <p style="color:${BRAND.textPrimary};font-weight:700;margin:0 0 8px;font-size:14px;">${title}</p>
        ${items.map((item) => `<p style="color:${BRAND.textSecondary};font-size:13px;margin:4px 0;line-height:1.55;">• ${item}</p>`).join("")}
      </td>
    </tr>
  </table>
`;

const featureItem = (emoji: string, text: string) => `
  <tr>
    <td style="padding:8px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align:middle;padding-right:12px;">
            <div style="background:${BRAND.primaryStart};background-image:${GRADIENT};width:34px;height:34px;border-radius:11px;text-align:center;line-height:34px;font-size:16px;">${emoji}</div>
          </td>
          <td style="vertical-align:middle;">
            <span style="color:${BRAND.textSecondary};font-size:14px;line-height:1.45;">${text}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
`;


const templates = {
  "email-verification": (data: { userName?: string; confirmationUrl: string }) => ({
    subject: "✨ Verifica tu cuenta de GlowApp",
    html: `
      ${emailWrapper}
        ${emailContainerStart}
          ${logoHeader}
          
          ${badge("✉️ Verifica tu email")}
          
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
            Hola <strong style="color: ${BRAND.textPrimary}; font-weight: 600;">${data.userName || "amante de la belleza"}</strong>,
          </p>
          <p style="color: ${BRAND.textSecondary}; font-size: 16px; line-height: 1.7; text-align: center; margin: 0;">
            Gracias por unirte a <strong style="color: ${BRAND.primary};">GlowApp</strong>. Para activar tu cuenta, solo necesitas verificar tu email haciendo clic en el botón:
          </p>
          
          ${button("Verificar mi cuenta", data.confirmationUrl)}
          
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

          ${warningBox("⏰ Este enlace expira en 24 horas", [
            "Si no creaste una cuenta en GlowApp, puedes ignorar este email",
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
    `,
  }),

  welcome: (data: { userName?: string }) => ({
    subject: "🎉 ¡Bienvenido a GlowApp!",
    html: `
      ${emailWrapper}
        ${emailContainerStart}
          ${logoHeader}
          
          ${badge("🎉 Bienvenido", "success")}
          
          <h1 style="
            color: ${BRAND.textPrimary};
            font-size: 28px;
            text-align: center;
            margin: 0 0 20px;
            font-weight: 800;
            letter-spacing: -0.02em;
            line-height: 1.2;
          ">
            ¡Hola ${data.userName || "amante de la belleza"}!
          </h1>
          
          <p style="color: ${BRAND.textSecondary}; font-size: 16px; line-height: 1.7; text-align: center; margin: 0 0 28px;">
            Nos alegra que te hayas unido a la comunidad de <strong style="color: ${BRAND.primary};">GlowApp</strong>. Ahora tienes acceso a los mejores salones de belleza cerca de ti.
          </p>
          
          ${infoBox(`
            <p style="color: ${BRAND.textPrimary}; font-weight: 700; margin: 0 0 16px; font-size: 16px; text-align: center;">Con GlowApp puedes:</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${featureItem("✨", "Descubrir salones increíbles cerca de ti")}
              ${featureItem("📅", "Reservar citas en segundos")}
              ${featureItem("💬", "Chatear directamente con los salones")}
              ${featureItem("⭐", "Leer y dejar reseñas")}
            </table>
          `)}
          
          ${button("Explorar salones", APP_URL)}
          
          <p style="color: ${BRAND.textSecondary}; font-size: 15px; text-align: center; line-height: 1.6; margin: 0;">
            Con cariño,<br />
            <strong style="color: ${BRAND.textPrimary}; font-weight: 600;">El equipo de GlowApp</strong> 💜
          </p>
          
          ${emailFooter}
        ${emailContainerEnd}
      ${emailFooterWrapper}
    `,
  }),

  "password-reset": (data: { userName?: string; resetLink: string }) => ({
    subject: "🔐 Recupera tu contraseña de GlowApp",
    html: `
      ${emailWrapper}
        ${emailContainerStart}
          ${logoHeader}
          
          ${badge("🔐 Recuperar contraseña", "warning")}
          
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
            Hola <strong style="color: ${BRAND.textPrimary}; font-weight: 600;">${data.userName || "usuario"}</strong>,
          </p>
          <p style="color: ${BRAND.textSecondary}; font-size: 16px; text-align: center; line-height: 1.7; margin: 0;">
            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong style="color: ${BRAND.primary};">GlowApp</strong>.
          </p>
          <p style="color: ${BRAND.textSecondary}; font-size: 16px; text-align: center; line-height: 1.7; margin: 16px 0 0;">
            Haz clic en el siguiente botón para crear una nueva contraseña:
          </p>
          
          ${button("Restablecer contraseña", data.resetLink, "warning")}

          ${warningBox("⏰ Importante:", [
            "Este enlace expira en 1 hora",
            "Si no solicitaste este cambio, ignora este email",
            "Tu contraseña actual seguirá siendo válida",
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
    `,
  }),
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data }: EmailRequest = await req.json();

    if (!type || !to) {
      throw new Error("Missing required fields: type, to");
    }

    const template = templates[type];
    if (!template) {
      throw new Error(`Unknown email type: ${type}. Available types: welcome, password-reset, email-verification`);
    }

    const { subject, html } = template(data as never);

    const emailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      reply_to: "gglowapp@gmail.com",
      to: [to],
      subject,
      html,
    });

    if (emailResponse.error) {
      console.error(`Resend rejected email (${type} to ${to}):`, emailResponse.error);
      return new Response(
        JSON.stringify({ error: emailResponse.error.message ?? "Resend error", details: emailResponse.error }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    console.log(`Email sent successfully: ${type} to ${to}`, emailResponse.data);

    return new Response(JSON.stringify({ success: true, data: emailResponse.data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-email function:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
