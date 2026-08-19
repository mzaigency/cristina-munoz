// Extracts bookings or services from uploaded photos using Lovable AI vision.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { checkRateLimit, rateLimited } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BOOKINGS_PROMPT = `Eres un experto en digitalizar agendas de salones de belleza, peluquerías y barberías.
Analiza CADA imagen que recibas y extrae TODAS las citas visibles.

REGLAS CRÍTICAS:
1. NUNCA inventes datos. Si un campo no está claro o no aparece, déjalo como null. Es preferible un null que un dato inventado.
2. Extrae EXACTAMENTE lo que ves. No asumas nombres de servicios, precios ni teléfonos que no aparezcan.
3. Fechas: formato YYYY-MM-DD. Si solo ves "Lunes" o "15", deja date=null y guarda la pista en raw_text.
4. Horas: formato HH:MM 24h. Si ves "10" sin AM/PM y el contexto es agenda de salón, asume horario laboral (8:00-21:00) y elige la más probable. Si imposible, deja null.
5. Cliente: nombre tal cual aparece, aunque sea un mote o inicial. Si no hay nombre legible, deja null.
6. Servicio: usa palabras simples (corte, tinte, mechas, manicura, depilación...). Si solo hay un código, déjalo en raw_text.
7. Profesional/estilista: solo si aparece claramente.
8. Por cada fila incluye confidence (0-1) según lo segura que estés de la lectura.
9. Si la imagen NO es una agenda de citas (recibo, foto personal, paisaje...), devuelve rows=[] y reason="not_an_agenda".`;

const SERVICES_PROMPT = `Eres un experto en digitalizar cartas de servicios y tarifas de salones, peluquerías, barberías y centros de estética.
Analiza CADA imagen y extrae TODOS los servicios visibles.

REGLAS CRÍTICAS:
1. NUNCA inventes precios ni duraciones. Si no aparecen, déjalos como null. Es preferible null que un valor inventado.
2. Nombre: extráelo tal cual aparece (puedes corregir mayúsculas/tildes obvias). Es el único campo obligatorio.
3. Precio: número en euros sin símbolo. "25€" → 25. "Desde 30" → 30 (anota "Desde 30€" en notes). Rango "20-30" → 20 (anota "Desde 20€" en notes).
4. Duración: en minutos. "1h" → 60. "1h30" → 90. "30 min" → 30. Si no aparece → null.
5. Categoría: usa la cabecera de la sección si la ves (Corte, Color, Tratamientos, Manicura...). Si no, deja null.
6. Confidence (0-1) por fila.
7. Si la imagen NO es una carta de servicios, devuelve rows=[] y reason="not_a_service_list".`;

const BOOKINGS_TOOL = {
  type: "function" as const,
  function: {
    name: "extract_bookings",
    description: "Extracts appointment rows from one or more agenda photos.",
    parameters: {
      type: "object",
      properties: {
        rows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: ["string", "null"], description: "YYYY-MM-DD or null" },
              time: { type: ["string", "null"], description: "HH:MM 24h or null" },
              duration_minutes: { type: ["number", "null"] },
              customer_name: { type: ["string", "null"] },
              customer_phone: { type: ["string", "null"] },
              service_name: { type: ["string", "null"] },
              stylist_name: { type: ["string", "null"] },
              notes: { type: ["string", "null"] },
              raw_text: { type: ["string", "null"] },
              confidence: { type: "number" },
            },
            required: ["confidence"],
            additionalProperties: false,
          },
        },
        reason: { type: ["string", "null"] },
      },
      required: ["rows"],
      additionalProperties: false,
    },
  },
};

const SERVICES_TOOL = {
  type: "function" as const,
  function: {
    name: "extract_services",
    description: "Extracts service rows from one or more price-list photos.",
    parameters: {
      type: "object",
      properties: {
        rows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              price: { type: ["number", "null"] },
              duration_minutes: { type: ["number", "null"] },
              category: { type: ["string", "null"] },
              description: { type: ["string", "null"] },
              notes: { type: ["string", "null"] },
              confidence: { type: "number" },
            },
            required: ["name", "confidence"],
            additionalProperties: false,
          },
        },
        reason: { type: ["string", "null"] },
      },
      required: ["rows"],
      additionalProperties: false,
    },
  },
};

async function callAI(mode: "bookings" | "services", image: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const prompt = mode === "bookings" ? BOOKINGS_PROMPT : SERVICES_PROMPT;
  const tool = mode === "bookings" ? BOOKINGS_TOOL : SERVICES_TOOL;

  const body = {
    model: "google/gemini-2.5-pro",
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: [
          { type: "text", text: "Analiza esta imagen y extrae los datos siguiendo las reglas." },
          { type: "image_url", image_url: { url: image } },
        ],
      },
    ],
    tools: [tool],
    tool_choice: { type: "function", function: { name: tool.function.name } },
  };

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    if (resp.status === 429) throw new Error("RATE_LIMITED");
    if (resp.status === 402) throw new Error("PAYMENT_REQUIRED");
    const t = await resp.text();
    throw new Error(`AI_ERROR_${resp.status}:${t.slice(0, 200)}`);
  }

  const data = await resp.json();
  const call = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) return { rows: [], reason: "no_tool_call" };
  try {
    return JSON.parse(call.function.arguments);
  } catch {
    return { rows: [], reason: "invalid_json" };
  }
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

    // Anti-abuso: la extracción con IA cuesta créditos → 20 por usuario/hora
    if (!(await checkRateLimit("extract-from-photos", userId, 20, 3600))) {
      return rateLimited(corsHeaders, "Has hecho muchas importaciones seguidas. Prueba en un rato.");
    }

    const payload = await req.json();
    const { tenant_id, mode, images } = payload ?? {};

    if (!tenant_id || !mode || !Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (mode !== "bookings" && mode !== "services") {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (images.length > 10) {
      return new Response(JSON.stringify({ error: "Max 10 images per job" }), {
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

    // Process images sequentially to avoid rate limits
    const allRows: any[] = [];
    let lastReason: string | null = null;
    for (const img of images) {
      try {
        const out = await callAI(mode, img);
        if (Array.isArray(out?.rows)) allRows.push(...out.rows);
        if (out?.reason) lastReason = out.reason;
      } catch (e) {
        const msg = (e as Error).message;
        if (msg === "RATE_LIMITED") {
          return new Response(
            JSON.stringify({ error: "Demasiadas peticiones. Espera un momento e inténtalo de nuevo." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        if (msg === "PAYMENT_REQUIRED") {
          return new Response(
            JSON.stringify({ error: "Se han agotado los créditos de IA. Contacta con soporte." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        console.error("AI extraction error:", msg);
        lastReason = lastReason ?? msg;
      }
    }

    // Audit
    await adminClient.from("import_jobs").insert({
      tenant_id,
      user_id: userId,
      mode,
      image_count: images.length,
      rows_extracted: allRows.length,
      rows_committed: 0,
    });

    return new Response(
      JSON.stringify({ rows: allRows, reason: lastReason, image_count: images.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("extract-from-photos error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
