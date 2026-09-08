import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendAndLogTemplateEmail } from "../_shared/transactional-email-templates/send-and-log.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const isBlockRow = (name: string | null) => {
  const n = (name || "").toUpperCase();
  return n.includes("BLOQUEADO") || n.includes("VACACIONES");
};

const ymd = (d: Date) => d.toISOString().split("T")[0];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Auth: cron (service role) o superadmin ────────────────
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const isService = token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!isService) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: isSuperadmin } = await userClient.rpc("is_superadmin");
      if (!isSuperadmin) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Modo prueba: { tenantSlug | tenantId, testEmail }
    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {
      body = {};
    }
    const testEmail: string | null = body?.testEmail ?? null;
    const onlyTenantSlug: string | null = body?.tenantSlug ?? null;
    const onlyTenantId: string | null = body?.tenantId ?? null;


    // Semana natural cerrada: lunes -> domingo anterior al día de envío.
    const now = new Date();
    const dow = (now.getUTCDay() + 6) % 7; // 0 = lunes
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dow - 1)); // domingo
    const start = new Date(end.getTime() - 6 * 86400000); // lunes
    const prevEnd = new Date(start.getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - 6 * 86400000);

    const rangeLabel =
      start.getUTCMonth() === end.getUTCMonth()
        ? `${start.getUTCDate()} al ${end.getUTCDate()} de ${MONTHS[end.getUTCMonth()]}`
        : `${start.getUTCDate()} de ${MONTHS[start.getUTCMonth()]} al ${end.getUTCDate()} de ${MONTHS[end.getUTCMonth()]}`;

    let tenantsQuery = supabase
      .from("tenants")
      .select("id, name, email, logo_url, slug, is_active, subscription_expires_at")
      .eq("is_active", true);

    if (onlyTenantId) tenantsQuery = tenantsQuery.eq("id", onlyTenantId);
    else if (onlyTenantSlug) tenantsQuery = tenantsQuery.eq("slug", onlyTenantSlug);
    else tenantsQuery = tenantsQuery.not("email", "is", null);

    const { data: tenants, error: tenantsError } = await tenantsQuery;

    if (tenantsError) throw tenantsError;

    const results = { tenants: 0, sent: 0, skipped: 0, errors: [] as string[] };

    for (const tenant of tenants || []) {
      results.tenants++;

      if (!testEmail && tenant.subscription_expires_at && new Date(tenant.subscription_expires_at) < now) {
        results.skipped++;
        continue;
      }

      try {
        const [txRes, txPrevRes, bookRes, bookPrevRes, clientsRes] = await Promise.all([
          supabase
            .from("transactions")
            .select("total, tip_amount")
            .eq("tenant_id", tenant.id)
            .eq("voided", false)
            .gte("created_at", `${ymd(start)}T00:00:00Z`)
            .lte("created_at", `${ymd(end)}T23:59:59Z`),
          supabase
            .from("transactions")
            .select("total")
            .eq("tenant_id", tenant.id)
            .eq("voided", false)
            .gte("created_at", `${ymd(prevStart)}T00:00:00Z`)
            .lte("created_at", `${ymd(prevEnd)}T23:59:59Z`),
          supabase
            .from("bookings")
            .select('id, customer_name, "Fecha", "Hora", services, status, user_id')
            .eq("tenant_id", tenant.id)
            .gte("Fecha", ymd(start))
            .lte("Fecha", ymd(end)),
          supabase
            .from("bookings")
            .select('id, customer_name, status')
            .eq("tenant_id", tenant.id)
            .gte("Fecha", ymd(prevStart))
            .lte("Fecha", ymd(prevEnd)),
          supabase
            .from("clients")
            .select("id")
            .eq("tenant_id", tenant.id)
            .gte("created_at", `${ymd(start)}T00:00:00Z`)
            .lte("created_at", `${ymd(end)}T23:59:59Z`),
        ]);

        const revenue = (txRes.data || []).reduce(
          (sum, t: any) => sum + Number(t.total || 0) + Number(t.tip_amount || 0),
          0,
        );
        const revenuePrev = (txPrevRes.data || []).reduce((sum, t: any) => sum + Number(t.total || 0), 0);

        const rows = (bookRes.data || []).filter((b: any) => !isBlockRow(b.customer_name));
        const attended = rows.filter((b: any) => b.status !== "cancelled");
        const cancelled = rows.filter((b: any) => b.status === "cancelled").length;

        // Varias filas pueden ser la misma visita (servicio compuesto o varios servicios)
        const visitKey = (b: any) => `${b.user_id || b.customer_name}|${b["Fecha"]}`;
        const visits = new Set(attended.map(visitKey));
        const bookingsCount = visits.size;

        const prevRows = (bookPrevRes.data || []).filter(
          (b: any) => !isBlockRow(b.customer_name) && b.status !== "cancelled",
        );
        const bookingsPrev = prevRows.length;

        // Servicios top
        const serviceCount = new Map<string, number>();
        for (const b of attended as any[]) {
          const names = Array.isArray(b.services)
            ? b.services.map((srv: any) => srv?.name).filter(Boolean)
            : [];
          for (const n of names) serviceCount.set(n, (serviceCount.get(n) || 0) + 1);
        }
        const topServices = [...serviceCount.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));

        // Horas punta (por hora en punto, una sola vez por visita)
        const hourCount = new Map<string, number>();
        const seenVisit = new Set<string>();
        for (const b of attended as any[]) {
          const key = visitKey(b);
          if (seenVisit.has(key)) continue;
          seenVisit.add(key);
          const hh = String(b["Hora"] || "").slice(0, 2);
          if (!hh) continue;
          const label = `${hh}:00`;
          hourCount.set(label, (hourCount.get(label) || 0) + 1);
        }
        const peakHours = [...hourCount.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([hour, count]) => ({ hour, count }));

        // Sin actividad: no molestamos con un correo vacío
        if (!testEmail && bookingsCount === 0 && revenue === 0) {
          results.skipped++;
          continue;
        }

        const recipient = (testEmail || tenant.email) as string;
        if (!recipient) {
          results.skipped++;
          continue;
        }

        await sendAndLogTemplateEmail("weekly-summary", recipient, {
          idempotencyKey: testEmail
            ? `weekly-summary-test-${tenant.id}-${Date.now()}`
            : `weekly-summary-${tenant.id}-${ymd(start)}`,
          templateData: {
            ownerName: "Hola",
            tenantName: tenant.name,
            tenantLogoUrl: tenant.logo_url ?? null,
            rangeLabel,
            revenue: Math.round(revenue),
            revenuePrev: Math.round(revenuePrev),
            bookings: bookingsCount,
            bookingsPrev,
            avgTicket: bookingsCount ? Math.round(revenue / bookingsCount) : 0,
            newClients: (clientsRes.data || []).length,
            cancelled,
            topServices,
            peakHours,
            panelUrl: "https://www.glowapp.app/admin",
          },
        });

        results.sent++;
      } catch (err) {
        console.error(`weekly-summary failed for tenant ${tenant.id}:`, err);
        results.errors.push(`${tenant.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return new Response(JSON.stringify({ range: rangeLabel, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("weekly-summary-email error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
