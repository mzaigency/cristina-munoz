// Commits reviewed booking rows: upserts clients and inserts bookings.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingRow {
  date: string | null;
  time: string | null;
  duration_minutes: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  service_name: string | null;
  stylist_name: string | null;
  notes: string | null;
}

function normalizePhone(p: string | null): string | null {
  if (!p) return null;
  const cleaned = p.replace(/[^\d+]/g, "");
  return cleaned || null;
}

async function getAuthenticatedUserId(supabase: ReturnType<typeof createClient>, token: string) {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

async function canManageTenant(supabase: ReturnType<typeof createClient>, tenantId: string, userId: string) {
  const { data: adminRow } = await supabase
    .from("tenant_admins")
    .select("tenant_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();

  if (adminRow) return true;

  const { data: isSuperadmin } = await supabase.rpc("is_superadmin");
  return Boolean(isSuperadmin);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(
      supabaseUrl,
      anonKey,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const userId = await getAuthenticatedUserId(supabase, token);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tenant_id, rows } = await req.json();
    if (!tenant_id || !Array.isArray(rows)) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!(await canManageTenant(supabase, tenant_id, userId))) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let createdBookings = 0;
    let createdClients = 0;
    const skipped: { row: BookingRow; reason: string }[] = [];

    // Cache existing clients by normalized phone for this tenant
    const { data: existingClients } = await adminClient
      .from("clients")
      .select("id, name, phone")
      .eq("tenant_id", tenant_id);

    const phoneIdx = new Map<string, string>();
    const nameIdx = new Map<string, string>();
    (existingClients ?? []).forEach((c: any) => {
      const np = normalizePhone(c.phone);
      if (np) phoneIdx.set(np, c.id);
      if (c.name) nameIdx.set(c.name.trim().toLowerCase(), c.id);
    });

    for (const r of rows as BookingRow[]) {
      if (!r.date || !r.time || !r.customer_name) {
        skipped.push({ row: r, reason: "missing_required" });
        continue;
      }

      // Find or create client
      let clientId: string | undefined;
      const np = normalizePhone(r.customer_phone);
      if (np && phoneIdx.has(np)) clientId = phoneIdx.get(np);
      if (!clientId) {
        const key = r.customer_name.trim().toLowerCase();
        if (nameIdx.has(key)) clientId = nameIdx.get(key);
      }
      if (!clientId) {
        const { data: newClient, error: clientErr } = await adminClient
          .from("clients")
          .insert({
            tenant_id,
            name: r.customer_name.trim(),
            phone: r.customer_phone,
            tags: ["Importado"],
          })
          .select("id")
          .single();
        if (clientErr) {
          skipped.push({ row: r, reason: `client_error:${clientErr.message}` });
          continue;
        }
        clientId = newClient.id;
        createdClients++;
        if (np) phoneIdx.set(np, clientId);
        nameIdx.set(r.customer_name.trim().toLowerCase(), clientId);
      }

      const duration = r.duration_minutes && r.duration_minutes > 0 ? r.duration_minutes : 30;
      const services = [{
        name: r.service_name ?? "Servicio",
        duration,
        price: 0,
      }];

      const { error: bookingErr } = await adminClient.from("bookings").insert({
        tenant_id,
        user_id: null,
        customer_name: r.customer_name.trim(),
        Telefono: r.customer_phone ?? "",
        Fecha: r.date,
        Hora: r.time,
        services,
        total_duration: duration,
        stylist: r.stylist_name ?? "any",
        status: "confirmed",
        canal: "imported",
        skip_availability_check: true,
        notes: r.notes,
      } as any);

      if (bookingErr) {
        skipped.push({ row: r, reason: `booking_error:${bookingErr.message}` });
        continue;
      }
      createdBookings++;
    }

    // Update audit with last job
    await adminClient
      .from("import_jobs")
      .update({ rows_committed: createdBookings })
      .eq("tenant_id", tenant_id)
      .eq("user_id", userId)
      .eq("mode", "bookings")
      .order("created_at", { ascending: false })
      .limit(1);

    return new Response(
      JSON.stringify({ created_bookings: createdBookings, created_clients: createdClients, skipped }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("commit-imported-bookings error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message ?? "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
