import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendAndLogTemplateEmail } from "../_shared/transactional-email-templates/send-and-log.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const isBlockRow = (name: string | null) => {
  const n = (name || "").toUpperCase();
  return n.includes("BLOQUEADO") || n.includes("VACACIONES");
};

const hhmm = (t: string | null) => String(t || "").slice(0, 5);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Auth: cron (service role) o superadmin
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

    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {
      body = {};
    }
    const testEmail: string | null = body?.testEmail ?? null;
    const onlyTenantSlug: string | null = body?.tenantSlug ?? null;
    const onlyTenantId: string | null = body?.tenantId ?? null;

    // Día local de España (UTC+1/+2); el cron corre de madrugada, así que
    // sumamos el desplazamiento para no equivocarnos de día.
    const now = new Date();
    const madrid = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
    const target: string = body?.date || [
      madrid.getFullYear(),
      String(madrid.getMonth() + 1).padStart(2, "0"),
      String(madrid.getDate()).padStart(2, "0"),
    ].join("-");
    const targetDate = new Date(`${target}T12:00:00Z`);
    const dateLabel = `${DAYS[targetDate.getUTCDay()]} ${targetDate.getUTCDate()} de ${MONTHS[targetDate.getUTCMonth()]}`;

    let tenantsQuery = supabase
      .from("tenants")
      .select("id, name, email, logo_url, slug, is_active, subscription_expires_at")
      .eq("is_active", true);

    if (onlyTenantId) tenantsQuery = tenantsQuery.eq("id", onlyTenantId);
    else if (onlyTenantSlug) tenantsQuery = tenantsQuery.eq("slug", onlyTenantSlug);
    else tenantsQuery = tenantsQuery.not("email", "is", null);

    const { data: tenants, error: tenantsError } = await tenantsQuery;
    if (tenantsError) throw tenantsError;

    const results = { date: target, tenants: 0, sent: 0, skipped: 0, errors: [] as string[] };

    for (const tenant of tenants || []) {
      results.tenants++;

      if (!testEmail && tenant.subscription_expires_at && new Date(tenant.subscription_expires_at) < now) {
        results.skipped++;
        continue;
      }

      const recipient = (testEmail || tenant.email) as string;
      if (!recipient) {
        results.skipped++;
        continue;
      }

      try {
        const [bookRes, stylistRes] = await Promise.all([
          supabase
            .from("bookings")
            .select('id, customer_name, "Telefono", "Hora", end_time, stylist, services, status, compound_part, user_id, created_at')
            .eq("tenant_id", tenant.id)
            .eq("Fecha", target)
            .order("Hora", { ascending: true }),
          supabase
            .from("tenant_stylists")
            .select("slug, name, color")
            .eq("tenant_id", tenant.id),
        ]);

        const stylistMap = new Map<string, { name: string; color: string | null }>();
        for (const st of stylistRes.data || []) {
          stylistMap.set(st.slug, { name: st.name, color: st.color ?? null });
        }

        // Una cita real puede ser varias filas: partes de un servicio
        // compuesto o varios servicios a la misma hora.
        const rows = (bookRes.data || []).filter(
          (b: any) =>
            !isBlockRow(b.customer_name) &&
            b.status !== "cancelled" &&
            b.compound_part !== "part2",
        );

        const merged = new Map<string, any>();
        for (const b of rows as any[]) {
          const key = `${b.stylist}|${hhmm(b["Hora"])}|${b.user_id || b.customer_name}`;
          const names = Array.isArray(b.services)
            ? b.services.map((srv: any) => srv?.name).filter(Boolean)
            : [];
          const price = Array.isArray(b.services)
            ? b.services.reduce((sum: number, srv: any) => sum + Number(srv?.price || 0), 0)
            : 0;
          const existing = merged.get(key);
          if (existing) {
            for (const n of names) if (!existing.names.includes(n)) existing.names.push(n);
            existing.price += price;
            if (b.end_time && (!existing.endTime || hhmm(b.end_time) > existing.endTime)) {
              existing.endTime = hhmm(b.end_time);
            }
          } else {
            merged.set(key, {
              stylist: b.stylist,
              time: hhmm(b["Hora"]),
              endTime: b.end_time ? hhmm(b.end_time) : null,
              customerName: b.customer_name || "Cliente",
              phone: b["Telefono"] || null,
              names: [...names],
              price,
              createdAt: b.created_at,
            });
          }
        }

        const appts = [...merged.values()].sort((a, b) => a.time.localeCompare(b.time));

        // Clientas nuevas: sin visitas anteriores en este salón
        const phones = [...new Set(appts.map((a) => a.phone).filter(Boolean))] as string[];
        const returning = new Set<string>();
        if (phones.length) {
          const { data: past } = await supabase
            .from("bookings")
            .select('"Telefono"')
            .eq("tenant_id", tenant.id)
            .in("Telefono", phones)
            .lt("Fecha", target)
            .neq("status", "cancelled");
          for (const p of past || []) returning.add((p as any)["Telefono"]);
        }

        const byStylist = new Map<string, { name: string; color: string | null; appointments: any[] }>();
        for (const a of appts) {
          const info = stylistMap.get(a.stylist) || { name: a.stylist || "Sin asignar", color: null };
          const group = byStylist.get(a.stylist) || { name: info.name, color: info.color, appointments: [] };
          group.appointments.push({
            time: a.time,
            endTime: a.endTime,
            customerName: a.customerName,
            phone: a.phone,
            services: a.names.join(" + ") || "Servicio",
            price: a.price || null,
            isNew: a.phone ? !returning.has(a.phone) : false,
          });
          byStylist.set(a.stylist, group);
        }

        const stylists = [...byStylist.values()].sort((x, y) =>
          (x.appointments[0]?.time || "").localeCompare(y.appointments[0]?.time || ""),
        );

        // Sin citas no molestamos, salvo en modo prueba
        if (!testEmail && appts.length === 0) {
          results.skipped++;
          continue;
        }

        const expectedRevenue = appts.reduce((sum, a) => sum + Number(a.price || 0), 0);

        await sendAndLogTemplateEmail("daily-agenda", recipient, {
          idempotencyKey: testEmail
            ? `daily-agenda-test-${tenant.id}-${Date.now()}`
            : `daily-agenda-${tenant.id}-${target}`,
          templateData: {
            tenantName: tenant.name,
            tenantLogoUrl: tenant.logo_url ?? null,
            dateLabel,
            totalCount: appts.length,
            expectedRevenue: Math.round(expectedRevenue),
            firstTime: appts[0]?.time || null,
            lastTime: appts.length
              ? appts[appts.length - 1].endTime || appts[appts.length - 1].time
              : null,
            stylists,
            panelUrl: `https://www.glowapp.app/admin/${tenant.slug}/agenda`,
          },
        });

        results.sent++;
      } catch (err) {
        console.error(`daily-agenda failed for tenant ${tenant.id}:`, err);
        results.errors.push(`${tenant.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("daily-agenda-email error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
