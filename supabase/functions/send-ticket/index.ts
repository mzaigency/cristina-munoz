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
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-ticket function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ticketData: TicketRequest = await req.json();
    console.log("Ticket data received:", ticketData);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Get tenant info for branding
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: tenant } = await supabase
      .from("tenants")
      .select("name, logo_url, primary_color, phone, address, city")
      .eq("id", ticketData.tenantId)
      .single();

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    const primaryColor = tenant.primary_color || "#8B5CF6";
    const formatCurrency = (amount: number) => 
      new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);

    // Generate items HTML
    const itemsHtml = ticketData.items.map(item => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
          <span style="font-weight: 500;">${item.name}</span>
          ${item.quantity > 1 ? `<span style="color: #666;"> x${item.quantity}</span>` : ""}
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 500;">
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
        <title>Ticket de ${tenant.name}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 400px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: ${primaryColor}; padding: 24px; text-align: center;">
            ${tenant.logo_url 
              ? `<img src="${tenant.logo_url}" alt="${tenant.name}" style="height: 60px; margin-bottom: 12px; border-radius: 50%;">`
              : ""
            }
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">${tenant.name}</h1>
            ${tenant.address ? `<p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">${tenant.address}${tenant.city ? `, ${tenant.city}` : ""}</p>` : ""}
          </div>

          <!-- Ticket Content -->
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

          <!-- Footer -->
          <div style="background: #f8f8f8; padding: 20px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 14px;">¡Gracias por tu visita!</p>
            ${tenant.phone ? `<p style="margin: 8px 0 0; color: #888; font-size: 12px;">📞 ${tenant.phone}</p>` : ""}
          </div>

        </div>
      </body>
      </html>
    `;

    console.log("Sending email to:", ticketData.customerEmail);

    // Send email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${tenant.name} <onboarding@resend.dev>`,
        to: [ticketData.customerEmail],
        subject: `Tu ticket de ${tenant.name} - ${ticketData.date}`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email API response:", emailResult);

    if (!emailResponse.ok) {
      throw new Error(emailResult.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, emailId: emailResult.id }), {
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
