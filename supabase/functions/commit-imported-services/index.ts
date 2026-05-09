// Commits reviewed service rows: inserts into services table.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ServiceRow {
  name: string;
  price: number | null;
  duration_minutes: number | null;
  category: string | null;
  description: string | null;
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

    let created = 0;
    const skipped: { row: ServiceRow; reason: string }[] = [];

    for (const r of rows as ServiceRow[]) {
      if (!r.name || !r.name.trim()) {
        skipped.push({ row: r, reason: "missing_name" });
        continue;
      }
      const duration = r.duration_minutes && r.duration_minutes > 0 ? r.duration_minutes : 30;
      const { error } = await adminClient.from("services").insert({
        tenant_id,
        name: r.name.trim(),
        type: "Simple",
        category: r.category,
        duration_part1_active: duration,
        duration_exposure_pause: 0,
        duration_part2_active: 0,
        price: r.price,
      } as any);
      if (error) {
        skipped.push({ row: r, reason: error.message });
        continue;
      }
      created++;
    }

    await adminClient
      .from("import_jobs")
      .update({ rows_committed: created })
      .eq("tenant_id", tenant_id)
      .eq("user_id", userId)
      .eq("mode", "services")
      .order("created_at", { ascending: false })
      .limit(1);

    return new Response(
      JSON.stringify({ created_services: created, skipped }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("commit-imported-services error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message ?? "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
