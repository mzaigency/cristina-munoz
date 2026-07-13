import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type BrandingField = "tagline" | "description" | "faqs" | "seo";

interface BrandingRequest {
  tenantId: string;
  /** Si se indica, regenera SOLO ese campo (no guarda, devuelve parcial). */
  only?: BrandingField;
  /** Fuerza una alternativa distinta (más variedad). */
  regenerate?: boolean;
}

interface BrandingOutput {
  tagline: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  faqs: Array<{ question: string; answer: string }>;
  brandTone: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const body = (await req.json()) as BrandingRequest;
    const { tenantId, only, regenerate } = body;
    const isPartial = Boolean(only);

    if (!tenantId) {
      return new Response(
        JSON.stringify({ success: false, error: "El ID del tenant es obligatorio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "API de IA no configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: tenant, error: tenantError } = await adminClient
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      console.error("Error fetching tenant:", tenantError);
      return new Response(
        JSON.stringify({ success: false, error: "No se encontró el negocio" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: services } = await adminClient
      .from("services")
      .select("name, price, category, type")
      .eq("tenant_id", tenantId);

    const { data: stylists } = await adminClient
      .from("tenant_stylists")
      .select("name")
      .eq("tenant_id", tenantId)
      .eq("is_active", true);

    const { data: businessHours } = await adminClient
      .from("tenant_business_hours")
      .select("day_of_week, is_open, open_time, close_time, break_start, break_end")
      .eq("tenant_id", tenantId)
      .order("day_of_week");

    const features = tenant.features as { business_type?: string; business_type_label?: string } | null;
    const businessType = features?.business_type_label || "Salón de belleza";

    const name = tenant.name;
    const city = tenant.city || "";
    const address = tenant.address || "";
    const phone = tenant.phone || "";
    const whatsapp = tenant.whatsapp_number || "";
    const instagram = tenant.instagram_url || "";

    const servicesInfo = services?.length
      ? services.map(s => `${s.name} (${s.category || s.type})${s.price ? ` - ${s.price}€` : ""}`).join(", ")
      : "No especificados";

    const stylistsNames = stylists?.length
      ? stylists.map(s => s.name).join(", ")
      : "No especificados";

    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const hoursInfo = businessHours?.length
      ? businessHours
          .filter(h => h.is_open)
          .map(h => {
            const day = dayNames[h.day_of_week];
            const morning = h.open_time?.slice(0, 5);
            const close = h.close_time?.slice(0, 5);
            const breakStart = h.break_start?.slice(0, 5);
            const breakEnd = h.break_end?.slice(0, 5);
            if (breakStart && breakEnd) {
              return `${day}: ${morning}-${breakStart} y ${breakEnd}-${close}`;
            }
            return `${day}: ${morning}-${close}`;
          })
          .join("; ")
      : "No especificados";

    console.log("Generating branding for:", name, "Type:", businessType, only ? `(solo: ${only})` : "");

    const FIELD_SCHEMAS: Record<BrandingField, string> = {
      tagline: `{"tagline": "eslogan corto y memorable, en minúscula sostenida salvo nombres propios (máx 55 caracteres)"}`,
      description: `{"description": "descripción cálida del negocio mencionando servicios reales y ubicación si existe (2-3 frases, máx 240 caracteres)"}`,
      faqs: `{"faqs": [
    {"question": "pregunta sobre horarios o ubicación", "answer": "respuesta con datos reales"},
    {"question": "pregunta sobre servicios que ofrecen", "answer": "respuesta mencionando servicios reales"},
    {"question": "pregunta sobre reservas o contacto", "answer": "respuesta con datos de contacto reales si existen"}
  ]}`,
      seo: `{"seoTitle": "${name} - ${businessType}${city ? ` en ${city}` : ""} | Reserva Online", "seoDescription": "meta descripción mencionando servicios reales y ciudad (máx 155 caracteres)"}`,
    };

    const fullSchema = `{
  "tagline": ${FIELD_SCHEMAS.tagline.slice(1, -1)},
  "description": ${FIELD_SCHEMAS.description.slice(1, -1)},
  "seoTitle": "${name} - ${businessType}${city ? ` en ${city}` : ""} | Reserva Online",
  "seoDescription": "meta descripción mencionando servicios reales y ciudad (máx 155 caracteres)",
  "faqs": [
    {"question": "pregunta sobre horarios o ubicación", "answer": "respuesta con datos reales"},
    {"question": "pregunta sobre servicios que ofrecen", "answer": "respuesta mencionando servicios reales"},
    {"question": "pregunta sobre reservas o contacto", "answer": "respuesta con datos de contacto reales si existen"}
  ],
  "brandTone": "descripción del tono de marca ideal para este negocio (1 frase)"
}`;

    const schema = only ? FIELD_SCHEMAS[only] : fullSchema;

    const prompt = `Eres la voz de marca de Glowapp escribiendo el contenido de la web de un negocio de belleza en España.

VOZ GLOWAPP (obligatoria):
- Cercana, clara y con confianza experta. Tuteo siempre. Femenino como referencia principal (la mayoría son dueñas de salón), sin excluir.
- Frases cortas, al grano, sin relleno. Español de España.
- NO uses: emojis, jerga de marketing ("experiencia única", "excelencia", "pasión por"), anglicismos, ni superlativos vacíos.
- Suena a compañera del sector, no a folleto.

DATOS REALES DEL NEGOCIO (usa solo esto, NO inventes nada):
- Nombre: ${name}
- Tipo de negocio: ${businessType}
- Dirección: ${address || "No especificada"}
- Ciudad: ${city || "No especificada"}
- Teléfono: ${phone || "No especificado"}
- WhatsApp: ${whatsapp || "No especificado"}
- Instagram: ${instagram || "No especificado"}
- Servicios: ${servicesInfo}
- Equipo: ${stylistsNames}
- Horarios: ${hoursInfo}

REGLAS:
1. Solo menciona servicios, horarios, ciudad o dirección si aparecen arriba. Si falta un dato, no lo menciones ni lo inventes.
2. Las FAQs deben responder con información real; si faltan datos, hazlas genéricas sobre reservas y experiencia.
3. Adapta el tono al tipo de negocio (${businessType}) sin caer en tópicos.
${regenerate || only ? "4. Da una alternativa CLARAMENTE distinta a lo típico; evita fórmulas manidas.\n" : ""}
${only ? `GENERA SOLO el campo solicitado.` : "GENERA todo el contenido de marca."}
Devuelve únicamente JSON válido (sin markdown, sin texto extra) con esta estructura exacta:
${schema}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: regenerate || only ? 0.95 : 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Demasiadas solicitudes. Intenta de nuevo en unos segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Créditos de IA agotados. Contacta con soporte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: "Error al generar contenido con IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: "La IA no generó contenido" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let cleanContent = content.trim();
    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    let branding: BrandingOutput;
    try {
      branding = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", cleanContent);
      return new Response(
        JSON.stringify({ success: false, error: "Error al procesar respuesta de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (isPartial) {
      console.log("Partial regeneration returned:", only);
      return new Response(
        JSON.stringify({ success: true, branding, model: "google/gemini-2.5-flash" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: { user } } = await userClient.auth.getUser();

      await adminClient
        .from("tenant_ai_generations")
        .update({ is_active: false })
        .eq("tenant_id", tenantId)
        .eq("generation_type", "branding");

      await adminClient.from("tenant_ai_generations").insert({
        tenant_id: tenantId,
        generation_type: "branding",
        prompt: prompt,
        output: branding,
        model: "google/gemini-2.5-flash",
        created_by: user?.id || null,
        is_active: true,
      });

      await adminClient
        .from("tenants")
        .update({
          tagline: branding.tagline,
          description: branding.description,
        })
        .eq("id", tenantId);

      console.log("Saved AI generation and updated tenant");
    } catch (saveError) {
      console.error("Error saving generation:", saveError);
    }

    console.log("Generated branding successfully");

    return new Response(
      JSON.stringify({
        success: true,
        branding,
        prompt,
        model: "google/gemini-2.5-flash",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-tenant-branding error:", e);
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : "Error desconocido",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
