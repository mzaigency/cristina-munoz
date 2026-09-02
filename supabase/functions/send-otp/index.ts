// Send a 6-digit OTP code via email for guest bookings
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";
import { EmailAPIError } from "npm:@lovable.dev/email-js@0.1.0";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = "https://www.glowapp.app";

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

    let tenantLogoUrl: string | null = null;
    if (tenant_id) {
      const { data: t } = await supabase.from("tenants").select("logo_url").eq("id", tenant_id).maybeSingle();
      tenantLogoUrl = t?.logo_url ?? null;
    }


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
      await sendTemplateEmail("booking-otp", emailLower, {
        templateData: {
          code,
          tenantName: tenant_name,
          tenantLogoUrl: tenantLogoUrl,
        },
        idempotencyKey: `booking-otp-${otp.id}`,
      });
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
