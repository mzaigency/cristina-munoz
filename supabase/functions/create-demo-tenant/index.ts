import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-DEMO-TENANT] ${step}${detailsStr}`);
};

// Demo tenants se crean en plan Pro para poder enseñar caja, analytics, etc.
const PRO_CONFIG = {
  max_stylists: 3,
  max_services: 50,
  features: {
    stories: true,
    messages: true,
    cash_register: true,
    commissions: false,
    advanced_analytics: true,
    pdf_reports: true,
    promotions: true,
    packages: true,
    monthly_goals: false,
    waitlist: false,
  },
};

const DEMO_EXPIRY_DAYS = 14;

const STYLIST_COLORS = ["#8B5CF6", "#EC4899", "#0EA5E9", "#F59E0B", "#10B981"];

const DEMO_CLIENT_NAMES = [
  "Maria Puig",
  "Anna Serra",
  "Laura Vila",
  "Núria Costa",
  "Carla Font",
  "Montse Riera",
  "Judit Soler",
  "Paula Camps",
];

interface DemoServicePayload {
  name: string;
  price: number;
  durationMin: number;
  category: string;
}

interface DemoTenantPayload {
  slug: string;
  name: string;
  businessType: string;
  typeLabel: string;
  tagline: string;
  address: string;
  city: string;
  phone: string;
  heroImageUrl: string;
  team: string[];
  services: DemoServicePayload[];
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const toDateStr = (d: Date) => d.toISOString().split("T")[0];
const toTimeStr = (h: number, m: number) =>
  `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
const addMinutes = (h: number, m: number, min: number) => {
  const total = h * 60 + m + min;
  return toTimeStr(Math.floor(total / 60) % 24, total % 60);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );

  try {
    logStep("Function started");

    // ── Auth: solo superadmin ──────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    const { data: roleCheck } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "superadmin")
      .maybeSingle();
    if (!roleCheck) throw new Error("Solo superadmins pueden crear demos");
    logStep("Superadmin verified", { userId: user.id });

    // ── Payload ────────────────────────────────────────────────
    const payload = (await req.json()) as DemoTenantPayload;
    if (!payload?.slug || !payload?.name || !Array.isArray(payload.services) || payload.services.length === 0) {
      throw new Error("Payload incompleto: slug, name y services son obligatorios");
    }
    const slug = slugify(payload.slug);
    logStep("Payload", { slug, name: payload.name });

    // ── Slug disponible ────────────────────────────────────────
    const { data: existing } = await supabaseAdmin
      .from("tenants")
      .select("id, features")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) {
      const isDemo = (existing.features as Record<string, unknown> | null)?.demo === true;
      return new Response(
        JSON.stringify({
          success: true,
          already_exists: true,
          is_demo: isDemo,
          tenant: { id: existing.id, slug },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // ── Crear tenant ───────────────────────────────────────────
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DEMO_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const tenantBase = {
      name: payload.name,
      slug,
      phone: payload.phone || null,
      email: user.email,
      address: payload.address || null,
      city: payload.city || "Manresa",
      tagline: payload.tagline || null,
      description: null,
      hero_image_url: payload.heroImageUrl || null,
      primary_color: "#22408C",
      secondary_color: "#98329A",
      subscription_plan: "pro",
      subscription_expires_at: expiresAt.toISOString(),
      max_stylists: Math.max(PRO_CONFIG.max_stylists, payload.team.length),
      max_services: PRO_CONFIG.max_services,
      features: {
        ...PRO_CONFIG.features,
        business_type: payload.businessType,
        business_type_label: payload.typeLabel,
        demo: true,
      },
      is_active: true,
    };

    // La columna language puede no existir aún (migración pendiente) → fallback
    let tenant: { id: string; slug: string } | null = null;
    {
      const first = await supabaseAdmin
        .from("tenants")
        .insert({ ...tenantBase, language: "ca" })
        .select("id, slug")
        .single();
      if (first.error) {
        logStep("Insert con language falló, reintento sin language", { error: first.error.message });
        const retry = await supabaseAdmin.from("tenants").insert(tenantBase).select("id, slug").single();
        if (retry.error) throw new Error(`Error al crear el tenant: ${retry.error.message}`);
        tenant = retry.data;
      } else {
        tenant = first.data;
      }
    }
    logStep("Tenant created", { tenantId: tenant.id });

    // ── Admin: el superadmin que llama es el dueño del panel ──
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: user.id, role: "admin" });
    if (roleError && !roleError.message.includes("duplicate")) {
      logStep("Warning: could not assign admin role", { error: roleError.message });
    }

    const { error: adminError } = await supabaseAdmin
      .from("tenant_admins")
      .insert({ tenant_id: tenant.id, user_id: user.id, is_owner: true });
    if (adminError) throw new Error(`Error al asignar administrador: ${adminError.message}`);

    // ── Horarios (Ma-Sa 9-20 con pausa, Do-Lu cerrado: típico salón) ──
    const hours = [];
    for (let day = 2; day <= 6; day++) {
      hours.push({
        tenant_id: tenant.id,
        day_of_week: day,
        is_open: true,
        open_time: "09:00",
        close_time: "20:00",
        break_start: "13:30",
        break_end: "15:30",
      });
    }
    for (const day of [0, 1]) {
      hours.push({
        tenant_id: tenant.id,
        day_of_week: day,
        is_open: false,
        open_time: null,
        close_time: null,
        break_start: null,
        break_end: null,
      });
    }
    const { error: hoursError } = await supabaseAdmin.from("tenant_business_hours").insert(hours);
    if (hoursError) logStep("Warning: hours", { error: hoursError.message });

    // ── Equipo ─────────────────────────────────────────────────
    const stylistRows = payload.team.map((name, i) => ({
      tenant_id: tenant!.id,
      name,
      slug: slugify(name) || `estilista-${i + 1}`,
      color: STYLIST_COLORS[i % STYLIST_COLORS.length],
      is_active: true,
    }));
    const { data: stylists, error: stylistsError } = await supabaseAdmin
      .from("tenant_stylists")
      .insert(stylistRows)
      .select("id, name, slug");
    if (stylistsError) logStep("Warning: stylists", { error: stylistsError.message });
    const stylistSlugs = (stylists || []).map((s) => s.slug);

    // ── Servicios ──────────────────────────────────────────────
    const serviceRows = payload.services.map((s, i) => ({
      tenant_id: tenant!.id,
      name: s.name,
      type: "Simple",
      duration_part1_active: s.durationMin,
      duration_exposure_pause: 0,
      duration_part2_active: 0,
      price: s.price,
      category: s.category || null,
      sort_order: i,
    }));
    const { data: services, error: servicesError } = await supabaseAdmin
      .from("services")
      .insert(serviceRows)
      .select("id, name, price, duration_part1_active");
    if (servicesError) throw new Error(`Error al crear servicios: ${servicesError.message}`);

    // ── Clientas de ejemplo ────────────────────────────────────
    const clientCount = Math.min(6, DEMO_CLIENT_NAMES.length);
    const clientRows = DEMO_CLIENT_NAMES.slice(0, clientCount).map((name, i) => ({
      tenant_id: tenant!.id,
      name,
      phone: `6000000${String(i + 10)}`,
      tags: i === 0 ? ["VIP"] : i < 3 ? ["Frecuente"] : ["Nuevo"],
      total_visits: Math.max(1, 8 - i * 2),
    }));
    const { error: clientsError } = await supabaseAdmin.from("clients").insert(clientRows);
    if (clientsError) logStep("Warning: clients", { error: clientsError.message });

    // ── Reservas de ejemplo: agenda viva (ayer, hoy, mañana, +2d) ──
    // user_id null → booking-notifications las ignora (sin push/email fantasma).
    const slots: Array<{ dayOffset: number; h: number; m: number; status: string }> = [
      { dayOffset: -1, h: 10, m: 0, status: "completed" },
      { dayOffset: -1, h: 17, m: 30, status: "completed" },
      { dayOffset: 0, h: 10, m: 30, status: "confirmed" },
      { dayOffset: 0, h: 12, m: 0, status: "confirmed" },
      { dayOffset: 0, h: 17, m: 0, status: "confirmed" },
      { dayOffset: 1, h: 9, m: 30, status: "confirmed" },
      { dayOffset: 1, h: 11, m: 0, status: "confirmed" },
      { dayOffset: 1, h: 16, m: 30, status: "confirmed" },
      { dayOffset: 2, h: 10, m: 0, status: "confirmed" },
      { dayOffset: 2, h: 18, m: 0, status: "confirmed" },
    ];

    const bookingRows = slots.map((slot, i) => {
      const svc = (services || [])[i % (services || []).length];
      const duration = svc?.duration_part1_active || 45;
      const date = new Date(now);
      date.setDate(date.getDate() + slot.dayOffset);
      return {
        tenant_id: tenant!.id,
        customer_name: DEMO_CLIENT_NAMES[i % DEMO_CLIENT_NAMES.length],
        Telefono: `6000000${String((i % clientCount) + 10)}`,
        Fecha: toDateStr(date),
        Hora: toTimeStr(slot.h, slot.m),
        end_time: addMinutes(slot.h, slot.m, duration),
        stylist: stylistSlugs.length > 0 ? stylistSlugs[i % stylistSlugs.length] : "any",
        services: [
          {
            id: svc?.id,
            name: svc?.name || "Servicio",
            type: "Simple",
            duration_part1_active: duration,
            duration_exposure_pause: 0,
            duration_part2_active: 0,
            price: svc?.price ?? null,
          },
        ],
        total_duration: duration,
        status: slot.status,
        skip_availability_check: true,
        canal: "crm",
        user_id: null,
        notes: "Reserva de demostración",
      };
    });

    const { error: bookingsError } = await supabaseAdmin.from("bookings").insert(bookingRows);
    if (bookingsError) logStep("Warning: bookings", { error: bookingsError.message });

    logStep("Demo provisioned", {
      tenantId: tenant.id,
      slug,
      services: (services || []).length,
      stylists: stylistSlugs.length,
      bookings: bookingRows.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        tenant: {
          id: tenant.id,
          slug,
          name: payload.name,
          publicUrl: `/${slug}`,
          adminUrl: `/admin/${slug}`,
          expiresAt: expiresAt.toISOString(),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
