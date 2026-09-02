import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EmailAPIError, sendLovableEmail } from "npm:@lovable.dev/email-js@0.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TicketItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  type: string;
}

interface TicketRequest {
  type?: "ticket" | "invoice";
  invoiceNumber?: string;
  transactionId?: string;
  customerEmail: string;
  customerName: string;
  tenantId: string;
  items: TicketItem[];
  subtotal: number;
  discount: number;
  discountReason?: string;
  tip: number;
  total: number;
  paymentMethod: string;
  stylistName: string;
  date: string;
  /** Enlace de valoración de un solo uso, creado al cobrar */
  reviewUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-ticket function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ticketData: TicketRequest = await req.json();
    console.log("Ticket data received:", JSON.stringify(ticketData, null, 2));

    // Ticket emails go through the Lovable Emails queue (verified notify.glowapp.app)
    // instead of Resend directly, which would fail on unverified glowapp.app.


    // Get tenant info for branding
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Fetching tenant info for:", ticketData.tenantId);
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("name, logo_url, primary_color, phone, address, city, email")
      .eq("id", ticketData.tenantId)
      .single();

    if (tenantError) {
      console.error("Error fetching tenant:", tenantError);
      throw new Error("Tenant not found: " + tenantError.message);
    }

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    console.log("Tenant found:", tenant.name);

    const primaryColor = tenant.primary_color || "#8B5CF6";
    const formatCurrency = (amount: number) => 
      new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);

    const isInvoice = ticketData.type === "invoice";
    const documentTitle = isInvoice ? "Factura" : "Ticket";
    const documentNumber = ticketData.invoiceNumber || "";

    // ---------- Ticket email (table-based, email-client safe) ----------
    const esc = (v: unknown) =>
      String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const brandGradient = "linear-gradient(100deg, #22408C, #98329A)";
    const rowLabel = "font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8A8FA3;font-weight:600;";
    const rowValue = "font-size:15px;color:#131520;font-weight:600;margin:4px 0 0;";

    const itemsHtml = ticketData.items
      .map(
        (item, i) => `
      <tr>
        <td style="padding:12px 0;border-top:${i === 0 ? "0" : "1px solid #F0F1F5"};font-size:14px;color:#131520;">
          <span style="font-weight:600;">${esc(item.name)}</span>
          ${item.quantity > 1 ? `<span style="color:#8A8FA3;font-weight:500;"> &times;${item.quantity}</span>` : ""}
          ${isInvoice ? `<br><span style="font-size:12px;color:#8A8FA3;">${formatCurrency(item.price)} / ud.</span>` : ""}
        </td>
        <td align="right" style="padding:12px 0;border-top:${i === 0 ? "0" : "1px solid #F0F1F5"};font-size:14px;color:#131520;font-weight:600;white-space:nowrap;">
          ${formatCurrency(item.total)}
        </td>
      </tr>`
      )
      .join("");

    const totalsRow = (label: string, value: string, color = "#676B7E", strong = false) => `
      <tr>
        <td style="padding:5px 0;font-size:14px;color:${color};${strong ? "font-weight:600;" : ""}">${label}</td>
        <td align="right" style="padding:5px 0;font-size:14px;color:${color};font-weight:600;white-space:nowrap;">${value}</td>
      </tr>`;

    const paymentLabel =
      ticketData.paymentMethod === "cash"
        ? "Efectivo"
        : ticketData.paymentMethod === "card"
        ? "Tarjeta"
        : "Mixto";

    const emailHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <title>${esc(documentTitle)} de ${esc(tenant.name)}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(documentTitle)} de ${esc(tenant.name)} · ${formatCurrency(ticketData.total)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F6F7FB;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #ECEDF3;">

          <!-- Barra de marca -->
          <tr><td style="height:5px;background:${primaryColor};background-image:${brandGradient};line-height:5px;font-size:0;">&nbsp;</td></tr>

          <!-- Cabecera del salón -->
          <tr>
            <td style="padding:26px 28px 20px;text-align:center;">
              ${
                tenant.logo_url
                  ? `<img src="${esc(tenant.logo_url)}" alt="${esc(tenant.name)}" width="56" height="56" style="width:56px;height:56px;border-radius:16px;object-fit:cover;display:block;margin:0 auto 12px;border:1px solid #ECEDF3;">`
                  : ""
              }
              <h1 style="margin:0;font-size:20px;line-height:1.3;font-weight:700;color:#131520;">${esc(tenant.name)}</h1>
              ${
                tenant.address
                  ? `<p style="margin:6px 0 0;font-size:13px;color:#8A8FA3;">${esc(tenant.address)}${tenant.city ? `, ${esc(tenant.city)}` : ""}</p>`
                  : ""
              }
              <p style="margin:14px 0 0;">
                <span style="display:inline-block;padding:5px 14px;border-radius:999px;background:${isInvoice ? "#E8F7EF" : "#EEF1FA"};color:${isInvoice ? "#0F7A47" : "#22408C"};font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">
                  ${esc(documentTitle)}${documentNumber ? ` Nº ${esc(documentNumber)}` : ""}
                </span>
              </p>
            </td>
          </tr>

          <!-- Total destacado -->
          <tr>
            <td style="padding:0 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F6F7FB;border-radius:16px;">
                <tr>
                  <td style="padding:18px 20px;text-align:center;">
                    <p style="margin:0;${rowLabel}">Total pagado</p>
                    <p style="margin:6px 0 0;font-size:34px;line-height:1.1;font-weight:800;color:#131520;letter-spacing:-0.02em;">${formatCurrency(ticketData.total)}</p>
                    <p style="margin:8px 0 0;font-size:12px;color:#8A8FA3;">${esc(paymentLabel)} · ${esc(ticketData.date)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Datos -->
          <tr>
            <td style="padding:22px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="50%" style="padding-bottom:14px;vertical-align:top;">
                    <p style="margin:0;${rowLabel}">Cliente</p>
                    <p style="${rowValue}">${esc(ticketData.customerName)}</p>
                  </td>
                  <td width="50%" align="right" style="padding-bottom:14px;vertical-align:top;">
                    <p style="margin:0;${rowLabel}">Atendido por</p>
                    <p style="${rowValue}">${esc(ticketData.stylistName)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Separador perforado -->
          <tr>
            <td style="padding:4px 28px 0;">
              <div style="border-top:2px dashed #E4E6EF;line-height:0;font-size:0;">&nbsp;</div>
            </td>
          </tr>

          <!-- Detalle -->
          <tr>
            <td style="padding:16px 28px 0;">
              <p style="margin:0 0 8px;${rowLabel}">Detalle</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${itemsHtml}
              </table>
            </td>
          </tr>

          <!-- Totales -->
          <tr>
            <td style="padding:14px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #ECEDF3;">
                <tr><td colspan="2" style="height:10px;line-height:10px;font-size:0;">&nbsp;</td></tr>
                ${totalsRow("Subtotal", formatCurrency(ticketData.subtotal))}
                ${
                  ticketData.discount > 0
                    ? totalsRow(
                        `Descuento${ticketData.discountReason ? ` (${esc(ticketData.discountReason)})` : ""}`,
                        `−${formatCurrency(ticketData.discount)}`,
                        "#E07A21"
                      )
                    : ""
                }
                ${ticketData.tip > 0 ? totalsRow("Propina", `+${formatCurrency(ticketData.tip)}`, "#98329A") : ""}
                <tr>
                  <td style="padding:12px 0 0;border-top:1px solid #ECEDF3;font-size:15px;font-weight:700;color:#131520;">Total</td>
                  <td align="right" style="padding:12px 0 0;border-top:1px solid #ECEDF3;font-size:18px;font-weight:800;color:#22408C;white-space:nowrap;">${formatCurrency(ticketData.total)}</td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            ticketData.reviewUrl && !isInvoice
              ? `
          <!-- Valoración -->
          <tr>
            <td style="padding:24px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F6F7FB;border-radius:16px;">
                <tr>
                  <td style="padding:20px;text-align:center;">
                    <p style="margin:0;font-size:16px;font-weight:700;color:#131520;">¿Qué tal fue tu visita?</p>
                    <p style="margin:6px 0 14px;font-size:13px;color:#676B7E;line-height:1.5;">Tu opinión ayuda mucho a ${esc(tenant.name)} · te lleva 10 segundos</p>
                    <a href="${esc(ticketData.reviewUrl)}" style="display:inline-block;padding:13px 28px;border-radius:999px;background:#22408C;background-image:${brandGradient};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">Dejar mi valoración</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ""
          }

          <!-- Contacto -->
          <tr>
            <td style="padding:24px 28px 26px;text-align:center;">
              <p style="margin:0;font-size:14px;color:#131520;font-weight:600;">¡Gracias por tu visita!</p>
              ${
                tenant.phone || tenant.email
                  ? `<p style="margin:8px 0 0;font-size:12px;color:#8A8FA3;line-height:1.7;">
                      ${tenant.phone ? esc(tenant.phone) : ""}${tenant.phone && tenant.email ? " · " : ""}${tenant.email ? esc(tenant.email) : ""}
                     </p>`
                  : ""
              }
            </td>
          </tr>

          <!-- Footer Glowapp -->
          <tr>
            <td style="padding:16px 28px 22px;background:#FBFBFD;border-top:1px solid #ECEDF3;text-align:center;">
              <p style="margin:0;font-size:11px;color:#A2A6B6;letter-spacing:.02em;">Enviado con <span style="color:#22408C;font-weight:700;">Glowapp</span> · reservas y gestión para tu salón</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;


    console.log("Sending ticket email to:", ticketData.customerEmail);

    const idempotencyKey = `ticket-${ticketData.transactionId || crypto.randomUUID()}-${Date.now()}`;
    const subject = `${documentTitle} de ${tenant.name} - ${ticketData.date}`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const logEmail = async (status: string, errorMessage?: string) => {
      const { error } = await supabase.from("email_send_log").insert({
        message_id: null,
        template_name: "ticket",
        recipient_email: ticketData.customerEmail,
        status,
        error_message: errorMessage ?? null,
      });
      if (error) console.error("email_send_log write failed", { code: error.code, message: error.message });
    };

    try {
      await sendLovableEmail(
        {
          to: ticketData.customerEmail,
          from: `${tenant.name} <noreply@glowapp.app>`,
          sender_domain: "notify.glowapp.app",
          subject,
          html: emailHtml,
          text: subject,
          purpose: "transactional",
          label: "ticket",
          idempotency_key: idempotencyKey,
        },
        { apiKey, sendUrl: Deno.env.get("LOVABLE_SEND_URL") },
      );
      await logEmail("sent");
    } catch (sendErr) {
      if (sendErr instanceof EmailAPIError && sendErr.code === "recipient_suppressed") {
        await logEmail("suppressed");
        return new Response(JSON.stringify({ success: true, sent: false, reason: "recipient_suppressed" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const message = sendErr instanceof Error ? sendErr.message : String(sendErr);
      console.error("Failed to send ticket email", message);
      await logEmail("failed", message.slice(0, 1000));
      throw new Error("Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, sent: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });


  } catch (error: any) {
    console.error("Error in send-ticket function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
