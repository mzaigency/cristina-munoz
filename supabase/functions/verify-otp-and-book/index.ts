// Verify OTP + create/find user + create booking + return magic link
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  email: z.string().trim().email().max(255),
  code: z.string().regex(/^\d{6}$/),
  full_name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(6).max(20),
  booking: z.record(z.any()),
});

async function hashCode(code: string, salt: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${code}:${salt}`));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
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
    const { email, code, full_name, phone, booking } = parsed.data;
    const emailLower = email.toLowerCase();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find latest unexpired unverified OTP for email
    const { data: otps, error: otpErr } = await admin
      .from("otp_codes")
      .select("id, code_hash, attempts, expires_at, verified_at")
      .eq("email", emailLower)
      .is("verified_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);
    if (otpErr) throw otpErr;
    if (!otps || otps.length === 0) {
      return new Response(JSON.stringify({ error: "otp_not_found", message: "Código no válido o caducado." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const otp = otps[0];
    if (otp.attempts >= 5) {
      return new Response(JSON.stringify({ error: "too_many_attempts", message: "Demasiados intentos. Solicita un código nuevo." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const expected = await hashCode(code, emailLower);
    if (expected !== otp.code_hash) {
      await admin.from("otp_codes").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
      return new Response(JSON.stringify({ error: "invalid_code", message: "Código incorrecto." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // NOTE: don't mark verified_at yet — only after the booking succeeds, so a
    // failed create-booking (slot taken, validation error) doesn't burn the OTP.

    // Find or create auth user. Look up by profiles.email first (indexed, O(1))
    // to avoid the 200-user pagination limit of admin.listUsers.
    let userId: string | null = null;
    const { data: profileRow } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", emailLower)
      .maybeSingle();
    if (profileRow?.id) {
      userId = profileRow.id;
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: emailLower,
        email_confirm: true,
        user_metadata: { full_name, phone },
      });
      if (created?.user) {
        userId = created.user.id;
      } else {
        // Fallback: user already exists in auth but no profile row yet — recover via listUsers with email filter.
        const msg = (createErr?.message ?? "").toLowerCase();
        if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
          const { data: byEmail } = await admin.auth.admin.listUsers({ page: 1, perPage: 1, filter: `email.eq.${emailLower}` } as any);
          const u = byEmail?.users?.[0];
          if (u) userId = u.id;
        }
        if (!userId) {
          console.error("createUser error", createErr);
          throw new Error("No se pudo crear la cuenta");
        }
      }
    }

    // Upsert profile phone/name if empty
    await admin.from("profiles").update({ full_name, phone }).eq("id", userId).is("phone", null);

    // Create booking via create-booking
    const bookingResp = await fetch(`${SUPABASE_URL}/functions/v1/create-booking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ ...booking, user_id: userId }),
    });
    const bookingJson = await bookingResp.json();
    if (!bookingResp.ok) {
      console.error("create-booking failed", bookingResp.status, bookingJson);
      return new Response(JSON.stringify({ error: "booking_failed", details: bookingJson }), {
        status: bookingResp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate magic link so client can auto sign-in via verifyOtp(token_hash)
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: emailLower,
      options: { redirectTo: `https://www.glowapp.app/mis-citas` },
    });

    return new Response(
      JSON.stringify({
        success: true,
        booking: bookingJson,
        user_id: userId,
        email: emailLower,
        action_link: linkData?.properties?.action_link ?? null,
        token_hash: (linkData?.properties as any)?.hashed_token ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("verify-otp fatal", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
