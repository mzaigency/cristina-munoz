// Send a 6-digit OTP code via email for guest bookings
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

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
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F3FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:24px;padding:40px 32px;box-shadow:0 20px 40px -8px rgba(124,58,237,.12)">
<tr><td align="center" style="padding-bottom:24px"><img src="${LOGO_ICON}" width="56" height="56" alt="Glowapp" style="border-radius:14px;display:block"></td></tr>
<tr><td align="center"><h1 style="color:#1E1B4B;font-size:24px;font-weight:800;margin:0 0 8px;letter-spacing:-.02em">${title}</h1>
<p style="color:#6B7280;font-size:15px;margin:0 0 28px;line-height:1.5">Introduce este código para confirmar tu cita:</p></td></tr>
<tr><td align="center" style="padding-bottom:28px">
<div style="display:inline-block;background:linear-gradient(135deg,#22408B,#98329A);padding:2px;border-radius:16px">
<div style="background:#fff;padding:20px 32px;border-radius:14px">
<span style="font-size:42px;font-weight:800;letter-spacing:.4em;color:#22408B;font-family:'Courier New',monospace">${code}</span>
</div></div></td></tr>
<tr><td align="center"><p style="color:#9CA3AF;font-size:13px;margin:0;line-height:1.5">El código caduca en 10 minutos.<br>Si no has solicitado esta reserva, ignora este email.</p></td></tr>
<tr><td align="center" style="padding-top:32px;border-top:1px solid #E5E7EB;margin-top:32px"><p style="color:#9CA3AF;font-size:12px;margin:24px 0 0">© ${new Date().getFullYear()} Glowapp · <a href="${APP_URL}" style="color:#22408B;text-decoration:none">glowapp.app</a></p></td></tr>
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

    const messageId = crypto.randomUUID();
    const subject = `${code} es tu código de Glowapp`;

    const { data: existingToken, error: tokenLookupError } = await supabase
      .from("email_unsubscribe_tokens")
      .select("token")
      .eq("email", emailLower)
      .maybeSingle();

    if (tokenLookupError) {
      console.error("otp unsubscribe token lookup error", tokenLookupError);
      throw new Error("Failed to prepare email");
    }

    let unsubscribeToken = existingToken?.token;
    if (!unsubscribeToken) {
      unsubscribeToken = generateToken();
      const { error: tokenInsertError } = await supabase
        .from("email_unsubscribe_tokens")
        .upsert({ token: unsubscribeToken, email: emailLower }, { onConflict: "email", ignoreDuplicates: true });

      if (tokenInsertError) {
        console.error("otp unsubscribe token insert error", tokenInsertError);
        throw new Error("Failed to prepare email");
      }

      const { data: storedToken, error: tokenReadError } = await supabase
        .from("email_unsubscribe_tokens")
        .select("token")
        .eq("email", emailLower)
        .maybeSingle();

      if (tokenReadError || !storedToken?.token) {
        console.error("otp unsubscribe token read error", tokenReadError);
        throw new Error("Failed to prepare email");
      }
      unsubscribeToken = storedToken.token;
    }

    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: "booking-otp",
      recipient_email: emailLower,
      status: "pending",
    });

    const { error: enqueueError } = await supabase.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        to: emailLower,
        from: FROM_EMAIL,
        sender_domain: SENDER_DOMAIN,
        subject,
        html: otpEmail(code, tenant_name),
        text: `Tu código de Glowapp es ${code}. Caduca en 10 minutos.`,
        purpose: "transactional",
        label: "booking-otp",
        unsubscribe_token: unsubscribeToken,
        idempotency_key: `booking-otp-${otp.id}`,
        queued_at: new Date().toISOString(),
      },
    });

    if (enqueueError) {
      console.error("enqueue otp email error", enqueueError);
      await supabase.from("otp_codes").delete().eq("id", otp.id);
      await supabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: "booking-otp",
        recipient_email: emailLower,
        status: "failed",
        error_message: enqueueError.message,
      });
      return new Response(JSON.stringify({ error: "email_failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
