import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

/**
 * Control de frecuencia (anti-abuso) para funciones públicas.
 *
 * Se apoya en la función `check_rate_limit` de la base de datos (solo
 * ejecutable con service role). Si no se puede comprobar, deja pasar:
 * nunca debe romper una reserva real por un fallo de infraestructura.
 */

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "unknown";
}

export async function checkRateLimit(
  bucket: string,
  identifier: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const { data, error } = await admin.rpc("check_rate_limit", {
      _bucket: bucket,
      _identifier: identifier,
      _max_requests: maxRequests,
      _window_seconds: windowSeconds,
    });
    if (error) {
      console.error("rate-limit check failed", error);
      return true;
    }
    return data !== false;
  } catch (e) {
    console.error("rate-limit error", e);
    return true;
  }
}

export function rateLimited(corsHeaders: Record<string, string>, message?: string): Response {
  return new Response(
    JSON.stringify({
      error: "rate_limited",
      message: message ?? "Demasiadas peticiones. Espera unos minutos e inténtalo de nuevo.",
    }),
    {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
    },
  );
}
