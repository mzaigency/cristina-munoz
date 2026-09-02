// Send a 6-digit OTP code via email for guest bookings
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";
import { EmailAPIError, sendLovableEmail } from "npm:@lovable.dev/email-js@0.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = "https://www.glowapp.app";
const FROM_EMAIL = "Glowapp <noreply@glowapp.app>";
const SENDER_DOMAIN = "notify.glowapp.app";
const LOGO_ICON = `${APP_URL}/email-assets/glowapp-icon.png`;

const BodySchema = z.object({
  email: z.string().trim().email().max(255),
  tenant_id: z.string().uuid().optional(),
  tenant_name: z.string().max(120).optional(),
});

async function hashCode(code: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(`${code}:${salt}`));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function otpEmail(code: string, tenantName?: string) {
  const title = tenantName ? `Confirma tu reserva en ${tenantName}` : "Confirma tu reserva";
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F6F7FB;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #ECEDF3">
<tr><td style="height:5px;line-height:5px;font-size:0;background:#22408B;background-image:linear-gradient(100deg,#22408B,#98329A)">&nbsp;</td></tr>
<tr><td align="center" style="padding:26px 28px 0"><img src="${LOGO_ICON}" width="56" height="56" alt="Glowapp" style="display:block;border-radius:16px;border:1px solid #ECEDF3"></td></tr>
<tr><td align="center" style="padding:16px 28px 0">
  <span style="display:inline-block;padding:5px 14px;border-radius:999px;background:#EEF1FA;color:#22408B;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Código de confirmación</span>
  <h1 style="color:#131520;font-size:23px;font-weight:800;margin:14px 0 8px;letter-spacing:-.02em;line-height:1.25">${title}</h1>
  <p style="color:#4a4d5c;font-size:15px;margin:0;line-height:1.6">Introduce este código para confirmar tu cita:</p>
</td></tr>
<tr><td style="padding:20px 28px 0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F6F7FB;border-radius:16px"><tr><td align="center" style="padding:22px 16px">
    <span style="font-size:36px;font-weight:800;letter-spacing:.28em;color:#22408B;font-family:'Courier New',monospace">${code}</span>
  </td></tr></table>
</td></tr>
<tr><td align="center" style="padding:16px 28px 26px"><p style="color:#8A8FA3;font-size:13px;margin:0;line-height:1.6">El código caduca en 10 minutos.<br>Si no has solicitado esta reserva, ignora este email.</p></td></tr>
<tr><td style="padding:16px 28px 22px;background:#FBFBFD;border-top:1px solid #ECEDF3;text-align:center">
  <p style="margin:0;font-size:11px;color:#A2A6B6">Enviado con <a href="${APP_URL}" style="color:#22408B;font-weight:700;text-decoration:none">Glowapp</a> · reservas y gestión para tu salón</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "invalid input", details: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { email, tenant_id, tenant_name } = parsed.data;
    const emailLower = email.toLowerCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Rate limit: max 6 OTPs per email per 15 min. Keep it protective, but
    // avoid blocking a client after a couple of resend taps or transient send errors.
    const since = new Date(Date.now() - 15 * 60_000).toISOString();
    const { count } = await supabase
      .from("otp_codes")
      .select("id", { count: "exact", head: true })
      .eq("email", emailLower)
      .gte("created_at", since);
    if ((count ?? 0) >= 6) {
      return new Response(JSON.stringify({ error: "rate_limited", message: "Demasiados intentos. Espera unos minutos." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate 6-digit code
    const codeNum = Math.floor(100000 + Math.random() * 900000);
    const code = codeNum.toString();
    const salt = emailLower;
    const code_hash = await hashCode(code, salt);

    const { data: otp, error: insertErr } = await supabase
      .from("otp_codes")
      .insert({
        email: emailLower,
        code_hash,
        tenant_id: tenant_id ?? null,
      })
      .select("id")
      .single();
    if (insertErr) {
      console.error("insert otp error", insertErr);
      throw new Error("Failed to store OTP");
    }
    if (!otp?.id) throw new Error("Failed to store OTP");

    const subject = `${code} es tu código de Glowapp`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const logEmail = async (status: string, errorMessage?: string) => {
      const { error } = await supabase.from("email_send_log").insert({
        message_id: null,
        template_name: "booking-otp",
        recipient_email: emailLower,
        status,
        error_message: errorMessage ?? null,
      });
      if (error) console.error("email_send_log write failed", { code: error.code, message: error.message });
    };

    try {
      await sendLovableEmail(
        {
          to: emailLower,
          from: FROM_EMAIL,
          sender_domain: SENDER_DOMAIN,
          subject,
          html: otpEmail(code, tenant_name),
          text: `Tu código de Glowapp es ${code}. Caduca en 10 minutos.`,
          purpose: "transactional",
          label: "booking-otp",
          idempotency_key: `booking-otp-${otp.id}`,
        },
        { apiKey, sendUrl: Deno.env.get("LOVABLE_SEND_URL") },
      );
      await logEmail("sent");
    } catch (sendErr) {
      if (sendErr instanceof EmailAPIError && sendErr.code === "recipient_suppressed") {
        await logEmail("suppressed");
      } else {
        const message = sendErr instanceof Error ? sendErr.message : String(sendErr);
        console.error("send otp email error", message);
        await supabase.from("otp_codes").delete().eq("id", otp.id);
        await logEmail("failed", message.slice(0, 1000));
        return new Response(JSON.stringify({ error: "email_failed" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-otp fatal", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
