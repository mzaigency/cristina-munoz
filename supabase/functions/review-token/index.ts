import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { z } from "https://esm.sh/zod@3.22.4";
import { checkRateLimit, clientIp, rateLimited } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Valoración sin cuenta.
 *
 * La clienta que paga en el mostrador no tiene usuario, así que no puede pasar
 * por `submit-review` (que exige sesión). Aquí el permiso lo da un token de un
 * solo uso creado al cobrar, ligado a esa transacción: la reseña queda
 * verificada y nadie puede colar reseñas a mano.
 *
 * POST { action: "get", token }              → datos del salón para pintar la página
 * POST { action: "submit", token, rating, comment } → guarda la reseña
 */

const getSchema = z.object({ action: z.literal("get"), token: z.string().min(16).max(128) });
const submitSchema = z.object({
  action: z.literal("submit"),
  token: z.string().min(16).max(128),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

const badWords = [
  "puta", "puto", "mierda", "joder", "coño", "gilipollas", "idiota", "imbecil",
  "cabrón", "cabron", "hijo de puta", "hijoputa", "spam", "scam", "fraude",
  "estafa", "casino", "viagra", "porn", "xxx",
];

function isSuspicious(text?: string | null): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  if (badWords.some((w) => t.includes(w))) return true;
  const urls = t.match(/(https?:\/\/[^\s]+)/g);
  if (urls && urls.length > 2) return true;
  const upper = (text.match(/[A-Z]/g) || []).length / text.length;
  if (text.length > 20 && upper > 0.5) return true;
  if (/(.)\1{4,}/.test(text)) return true;
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = await req.json();

    // Anti-abuso: evita fuerza bruta sobre los enlaces de valoración
    if (!(await checkRateLimit("review-token", clientIp(req), 20, 600))) {
      return json({ error: "Demasiados intentos. Espera unos minutos." }, 429);
    }

    // Service role: la tabla de invitaciones no es accesible de forma anónima
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const action = body?.action;

    if (action === "get") {
      const parsed = getSchema.safeParse(body);
      if (!parsed.success) return json({ error: "Enlace no válido" }, 400);

      const { data: invite } = await admin
        .from("review_invites")
        .select("id, customer_name, used_at, expires_at, tenant_id, tenants(name, slug, logo_url)")
        .eq("token", parsed.data.token)
        .maybeSingle();

      if (!invite) return json({ error: "Enlace no válido" }, 404);
      if (invite.used_at) return json({ error: "Esta valoración ya se envió", used: true }, 409);
      if (new Date(invite.expires_at) < new Date())
        return json({ error: "El enlace ha caducado", expired: true }, 410);

      const tenant = invite.tenants as unknown as {
        name: string;
        slug: string;
        logo_url: string | null;
      } | null;

      return json({
        customerName: invite.customer_name,
        tenant: { name: tenant?.name ?? "el salón", slug: tenant?.slug ?? "", logoUrl: tenant?.logo_url ?? null },
      });
    }

    if (action === "submit") {
      const parsed = submitSchema.safeParse(body);
      if (!parsed.success) return json({ error: "Datos no válidos" }, 400);
      const { token, rating, comment } = parsed.data;

      const { data: invite } = await admin
        .from("review_invites")
        .select("id, tenant_id, customer_name, used_at, expires_at")
        .eq("token", token)
        .maybeSingle();

      if (!invite) return json({ error: "Enlace no válido" }, 404);
      if (invite.used_at) return json({ error: "Esta valoración ya se envió", used: true }, 409);
      if (new Date(invite.expires_at) < new Date())
        return json({ error: "El enlace ha caducado", expired: true }, 410);

      const suspicious = isSuspicious(comment);

      const { data: review, error: reviewError } = await admin
        .from("reviews")
        .insert({
          rating,
          comment: comment?.trim() || null,
          tenant_id: invite.tenant_id,
          customer_name: invite.customer_name,
          verified: true,
          invite_id: invite.id,
          approved: !suspicious,
        })
        .select("id")
        .single();

      if (reviewError) {
        console.error("review insert", reviewError);
        return json({ error: "No se pudo guardar la valoración" }, 500);
      }

      // Un solo uso: se marca después de guardar, nunca antes
      await admin
        .from("review_invites")
        .update({ used_at: new Date().toISOString(), review_id: review.id })
        .eq("id", invite.id);

      return json({ ok: true, pendingModeration: suspicious });
    }

    return json({ error: "Acción no válida" }, 400);
  } catch (error) {
    console.error("review-token", error);
    return json({ error: "Error inesperado" }, 500);
  }
});
