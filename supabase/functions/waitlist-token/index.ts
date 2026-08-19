import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { z } from "https://esm.sh/zod@3.22.4";
import { checkRateLimit, clientIp, rateLimited } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Confirmar/rechazar un hueco de lista de espera SIN cuenta.
 *
 * El permiso lo da el token único que va en el email (igual que las
 * valoraciones): la clienta abre el enlace, ve el hueco reservado para ella y
 * confirma o lo suelta en un clic.
 *
 * POST { action: "get", token }     → datos de la propuesta
 * POST { action: "accept", token }  → crea la cita real
 * POST { action: "reject", token }  → libera el hueco, sigue en lista
 */

const baseSchema = z.object({
  action: z.enum(["get", "accept", "reject"]),
  token: z.string().min(16).max(128),
});

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const parsed = baseSchema.safeParse(await req.json());

    if (!(await checkRateLimit("waitlist-token", clientIp(req), 20, 600))) {
      return json({ error: "Demasiados intentos. Espera unos minutos." }, 429);
    }
    if (!parsed.success) return json({ error: "Enlace no válido" }, 400);
    const { action, token } = parsed.data;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: entry } = await admin
      .from("waitlist")
      .select("*, tenants(name, slug, logo_url, address)")
      .eq("proposal_token", token)
      .maybeSingle();

    if (!entry) return json({ error: "Enlace no válido" }, 404);

    const tenant = (entry as any).tenants || {};
    const services = Array.isArray(entry.services) ? entry.services : [];
    const info = {
      customerName: entry.client_name,
      date: entry.proposed_date,
      time: entry.proposed_time ? String(entry.proposed_time).slice(0, 5) : null,
      services: services.map((s: any) => s?.name).filter(Boolean),
      expiresAt: entry.proposed_expires_at,
      tenant: {
        name: tenant.name ?? "el salón",
        slug: tenant.slug ?? "",
        logoUrl: tenant.logo_url ?? null,
        address: tenant.address ?? null,
      },
    };

    const expired =
      entry.proposed_expires_at && new Date(entry.proposed_expires_at) < new Date();

    if (action === "get") {
      if (entry.status === "booked") return json({ ...info, state: "booked" });
      if (entry.status !== "proposed") return json({ ...info, state: "unavailable" });
      if (expired) return json({ ...info, state: "expired" });
      return json({ ...info, state: "ready" });
    }

    if (entry.status !== "proposed") {
      return json({ error: "Esta propuesta ya no está activa", state: entry.status === "booked" ? "booked" : "unavailable" }, 409);
    }
    if (expired) {
      await admin.from("waitlist").update({ status: "waiting" }).eq("id", entry.id);
      return json({ error: "La propuesta ha caducado", state: "expired" }, 410);
    }

    if (action === "reject") {
      await admin
        .from("waitlist")
        .update({
          status: "waiting",
          proposed_date: null,
          proposed_time: null,
          proposed_stylist_id: null,
          proposed_at: null,
          proposed_expires_at: null,
          proposal_token: null,
          proposal_responded_at: new Date().toISOString(),
        })
        .eq("id", entry.id);

      const { data: admins } = await admin
        .from("tenant_admins")
        .select("user_id")
        .eq("tenant_id", entry.tenant_id);

      if (admins?.length) {
        await admin.from("notifications").insert(
          admins.map((a: any) => ({
            user_id: a.user_id,
            tenant_id: entry.tenant_id,
            type: "waitlist_rejected",
            title: "Hueco rechazado",
            message: `${entry.client_name} no puede con el hueco propuesto. Sigue en lista de espera.`,
            metadata: { waitlist_id: entry.id },
            action_url: "/admin?tab=waitlist",
          })),
        );
      }

      return json({ success: true, state: "rejected", ...info });
    }

    // ---- accept: crear la cita real ----
    const proposedDate = entry.proposed_date;
    const proposedTime = entry.proposed_time ? String(entry.proposed_time).slice(0, 5) : null;
    if (!proposedDate || !proposedTime) return json({ error: "Propuesta inválida" }, 400);

    let stylistSlug = "any";
    if (entry.proposed_stylist_id) {
      const { data: st } = await admin
        .from("tenant_stylists")
        .select("slug")
        .eq("id", entry.proposed_stylist_id)
        .maybeSingle();
      stylistSlug = st?.slug || "any";
    } else {
      const { data: anyStylist } = await admin
        .from("tenant_stylists")
        .select("slug")
        .eq("tenant_id", entry.tenant_id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      stylistSlug = anyStylist?.slug || "any";
    }

    let totalDuration = 60;
    if (services.length > 0) {
      totalDuration = services.reduce(
        (sum: number, s: any) =>
          sum + (s.duration || s.total_duration || s.duration_part1_active || 30),
        0,
      );
    }

    const start = timeToMinutes(proposedTime);
    const end = start + totalDuration;

    const { data: conflicts } = await admin
      .from("bookings")
      .select("Hora, total_duration, stylist")
      .eq("tenant_id", entry.tenant_id)
      .eq("Fecha", proposedDate)
      .eq("status", "confirmed")
      .eq("stylist", stylistSlug);

    const hasConflict = (conflicts || []).some((b: any) => {
      const bStart = timeToMinutes(String(b.Hora).slice(0, 5));
      const bEnd = bStart + (b.total_duration || 60);
      return start < bEnd && end > bStart;
    });

    if (hasConflict) {
      return json(
        { error: "Alguien se ha adelantado y el hueco ya está ocupado", state: "taken" },
        409,
      );
    }

    const { data: booking, error: bookErr } = await admin
      .from("bookings")
      .insert({
        tenant_id: entry.tenant_id,
        user_id: entry.user_id ?? null,
        customer_name: entry.client_name || "Cliente",
        Telefono: entry.client_phone || "",
        Fecha: proposedDate,
        Hora: proposedTime,
        end_time: minutesToTime(end),
        services,
        stylist: stylistSlug,
        total_duration: totalDuration,
        status: "confirmed",
        canal: "web",
        source: "waitlist",
        notes: "Reserva confirmada desde lista de espera (email)",
        skip_availability_check: true,
      })
      .select("id")
      .single();

    if (bookErr) throw bookErr;

    await admin
      .from("waitlist")
      .update({
        status: "booked",
        proposal_token: null,
        proposal_responded_at: new Date().toISOString(),
      })
      .eq("id", entry.id);

    const { data: admins } = await admin
      .from("tenant_admins")
      .select("user_id")
      .eq("tenant_id", entry.tenant_id);

    if (admins?.length) {
      await admin.from("notifications").insert(
        admins.map((a: any) => ({
          user_id: a.user_id,
          tenant_id: entry.tenant_id,
          type: "waitlist_accepted",
          title: "¡Cita confirmada desde lista de espera!",
          message: `${entry.client_name} ha aceptado el hueco del ${proposedDate} a las ${proposedTime}.`,
          metadata: { waitlist_id: entry.id, booking_id: booking.id },
          action_url: "/admin?tab=agenda",
        })),
      );
    }

    // Email de confirmación de cita (si tenemos email)
    try {
      let email: string | null = entry.client_email;
      if (!email && entry.user_id) {
        const { data: authUser } = await admin.auth.admin.getUserById(entry.user_id);
        email = authUser?.user?.email ?? null;
      }
      if (email) {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "booking-confirmation",
            recipientEmail: email,
            idempotencyKey: `booking-confirm-${booking.id}`,
            templateData: {
              customerName: entry.client_name || "Hola",
              tenantName: tenant.name ?? "el salón",
              tenantLogoUrl: tenant.logo_url ?? null,
              tenantAddress: tenant.address ?? null,
              date: proposedDate,
              time: proposedTime,
              services: services.map((s: any) => s?.name).filter(Boolean).join(", "),
            },
          },
        });
      }
    } catch (mailErr) {
      console.error("waitlist-token: email error", mailErr);
    }

    return json({ success: true, state: "accepted", bookingId: booking.id, ...info });
  } catch (error: any) {
    console.error("waitlist-token error:", error);
    return json({ error: error.message ?? "Error inesperado" }, 500);
  }
});
