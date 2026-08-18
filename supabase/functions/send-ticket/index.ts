import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Generate items HTML
    const itemsHtml = ticketData.items.map(item => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
          <span style="font-weight: 500;">${item.name}</span>
          ${item.quantity > 1 ? `<span style="color: #666;"> x${item.quantity}</span>` : ""}
        </td>
        ${isInvoice ? `
          <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">${formatCurrency(item.price)}</td>
        ` : ""}
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 500;">
          ${formatCurrency(item.total)}
        </td>
      </tr>
    `).join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${documentTitle} de ${tenant.name}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 500px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: ${primaryColor}; padding: 24px; text-align: center;">
            ${tenant.logo_url 
              ? `<img src="${tenant.logo_url}" alt="${tenant.name}" style="height: 60px; margin-bottom: 12px; border-radius: 50%;">`
              : ""
            }
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">${tenant.name}</h1>
            ${tenant.address ? `<p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">${tenant.address}${tenant.city ? `, ${tenant.city}` : ""}</p>` : ""}
          </div>

          <!-- Document Type Badge -->
          <div style="text-align: center; padding: 16px;">
            <span style="background: ${isInvoice ? "#10b981" : primaryColor}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
              ${documentTitle}${documentNumber ? ` Nº ${documentNumber}` : ""}
            </span>
          </div>

          <!-- Content -->
          <div style="padding: 24px;">
            
            <!-- Date and Stylist -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px dashed #e0e0e0;">
              <div>
                <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Fecha</p>
                <p style="margin: 4px 0 0; font-weight: 600;">${ticketData.date}</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Atendido por</p>
                <p style="margin: 4px 0 0; font-weight: 600;">${ticketData.stylistName}</p>
              </div>
            </div>

            <!-- Customer -->
            <div style="margin-bottom: 20px;">
              <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Cliente</p>
              <p style="margin: 4px 0 0; font-weight: 600;">${ticketData.customerName}</p>
            </div>

            <!-- Items -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              ${isInvoice ? `
                <thead>
                  <tr style="background: #f8f8f8;">
                    <th style="padding: 10px; text-align: left; font-size: 12px; color: #666;">Concepto</th>
                    <th style="padding: 10px; text-align: center; font-size: 12px; color: #666;">Cant.</th>
                    <th style="padding: 10px; text-align: right; font-size: 12px; color: #666;">Precio</th>
                    <th style="padding: 10px; text-align: right; font-size: 12px; color: #666;">Total</th>
                  </tr>
                </thead>
              ` : ""}
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Totals -->
            <div style="background: #f8f8f8; padding: 16px; border-radius: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #666;">Subtotal</span>
                <span>${formatCurrency(ticketData.subtotal)}</span>
              </div>
              ${ticketData.discount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #f97316;">
                  <span>Descuento${ticketData.discountReason ? ` (${ticketData.discountReason})` : ""}</span>
                  <span>-${formatCurrency(ticketData.discount)}</span>
                </div>
              ` : ""}
              ${ticketData.tip > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #ec4899;">
                  <span>Propina</span>
                  <span>+${formatCurrency(ticketData.tip)}</span>
                </div>
              ` : ""}
              <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px solid #e0e0e0; font-size: 20px; font-weight: 700;">
                <span>TOTAL</span>
                <span style="color: ${primaryColor};">${formatCurrency(ticketData.total)}</span>
              </div>
            </div>

            <!-- Payment Method -->
            <div style="text-align: center; margin-top: 20px; padding: 12px; background: #f0f0f0; border-radius: 8px;">
              <span style="color: #666; font-size: 14px;">Pagado con: </span>
              <span style="font-weight: 600; text-transform: capitalize;">
                ${ticketData.paymentMethod === "cash" ? "Efectivo" : ticketData.paymentMethod === "card" ? "Tarjeta" : "Mixto"}
              </span>
            </div>

          </div>

          ${
            ticketData.reviewUrl && !isInvoice
              ? `
          <!-- Valoración -->
          <div style="padding: 24px 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #131520;">¿Qué tal fue?</p>
            <p style="margin: 0 0 14px; font-size: 13px; color: #676B7E;">Tu opinión ayuda a ${tenant.name} · te lleva 10 segundos</p>
            <a href="${ticketData.reviewUrl}" style="display: inline-block; padding: 12px 26px; border-radius: 999px; background: linear-gradient(100deg, #22408C, #98329A); color: #fff; font-size: 15px; font-weight: 600; text-decoration: none;">Dejar mi valoración</a>
          </div>`
              : ""
          }

          <!-- Footer -->
          <div style="background: #f8f8f8; padding: 20px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 14px;">¡Gracias por tu visita!</p>
            ${tenant.phone ? `<p style="margin: 8px 0 0; color: #888; font-size: 12px;">📞 ${tenant.phone}</p>` : ""}
            ${tenant.email ? `<p style="margin: 4px 0 0; color: #888; font-size: 12px;">✉️ ${tenant.email}</p>` : ""}
          </div>

        </div>
      </body>
      </html>
    `;

    console.log("Enqueueing email to:", ticketData.customerEmail);

    // Enqueue through Lovable Emails queue (uses verified notify.glowapp.app).
    const messageId = crypto.randomUUID();
    // Unique per attempt: the email API rejects reusing a key from a failed run.
    const idempotencyKey = `ticket-${ticketData.transactionId || messageId}-${Date.now()}`;
    const subject = `${documentTitle} de ${tenant.name} - ${ticketData.date}`;

    // Transactional sends require an unsubscribe token (one per address).
    const normalizedEmail = ticketData.customerEmail.trim().toLowerCase();
    let unsubscribeToken: string | null = null;
    const { data: existingToken } = await supabase
      .from("email_unsubscribe_tokens")
      .select("token")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingToken?.token) {
      unsubscribeToken = existingToken.token;
    } else {
      const newToken = crypto.randomUUID().replace(/-/g, "");
      await supabase
        .from("email_unsubscribe_tokens")
        .upsert({ token: newToken, email: normalizedEmail }, { onConflict: "email" });
      const { data: storedToken } = await supabase
        .from("email_unsubscribe_tokens")
        .select("token")
        .eq("email", normalizedEmail)
        .maybeSingle();
      unsubscribeToken = storedToken?.token || newToken;
    }

    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: "ticket",
      recipient_email: ticketData.customerEmail,
      status: "pending",
    });

    const { error: enqueueError } = await supabase.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        to: ticketData.customerEmail,
        from: `${tenant.name} <noreply@glowapp.app>`,
        sender_domain: "notify.glowapp.app",
        subject,
        html: emailHtml,
        text: subject,
        purpose: "transactional",
        label: "ticket",
        unsubscribe_token: unsubscribeToken,
        idempotency_key: idempotencyKey,
        queued_at: new Date().toISOString(),
      },
    });

    if (enqueueError) {
      console.error("Failed to enqueue ticket email", enqueueError);
      await supabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: "ticket",
        recipient_email: ticketData.customerEmail,
        status: "failed",
        error_message: enqueueError.message,
      });
      throw new Error("Failed to enqueue email");
    }

    return new Response(JSON.stringify({ success: true, queued: true, messageId }), {
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
