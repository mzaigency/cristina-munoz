import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BrandingRequest {
  tenantId: string;
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
    const { tenantId } = body;

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

    // Fetch ALL real data from the tenant
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

    // Fetch services
    const { data: services } = await adminClient
      .from("services")
      .select("name, price, category, type")
      .eq("tenant_id", tenantId);

    // Fetch stylists
    const { data: stylists } = await adminClient
      .from("tenant_stylists")
      .select("name")
      .eq("tenant_id", tenantId)
      .eq("is_active", true);

    // Fetch business hours
    const { data: businessHours } = await adminClient
      .from("tenant_business_hours")
      .select("day_of_week, is_open, open_time, close_time, break_start, break_end")
      .eq("tenant_id", tenantId)
      .order("day_of_week");

    // Extract business type from features
    const features = tenant.features as { business_type?: string; business_type_label?: string } | null;
    const businessType = features?.business_type_label || "Salón de belleza";

    // Build rich context for AI
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

    console.log("Generating branding for:", name, "Type:", businessType);

    const prompt = `Eres un experto en marketing y copywriting para negocios de belleza en España.

DATOS REALES DEL NEGOCIO (usa esta información exacta, NO inventes datos):

📍 INFORMACIÓN BÁSICA:
- Nombre: ${name}
- Tipo de negocio: ${businessType}
- Dirección: ${address || "No especificada"}
- Ciudad: ${city || "No especificada"}
- Teléfono: ${phone || "No especificado"}
- WhatsApp: ${whatsapp || "No especificado"}
- Instagram: ${instagram || "No especificado"}

✂️ SERVICIOS QUE OFRECEN:
${servicesInfo}

👥 EQUIPO:
${stylistsNames}

🕐 HORARIOS:
${hoursInfo}

---

GENERA contenido de marca BASÁNDOTE ÚNICAMENTE en los datos reales proporcionados arriba.
NO inventes servicios, horarios, o información que no se haya proporcionado.
Si algún dato no está especificado, NO lo menciones en las FAQs o descripción.

Devuelve JSON válido (sin markdown) con esta estructura:
{
  "tagline": "eslogan corto y memorable que refleje la esencia del negocio (máx 60 caracteres)",
  "description": "descripción atractiva del salón mencionando servicios reales y ubicación si está disponible (2-3 frases, máx 250 caracteres)",
  "seoTitle": "${name} - ${businessType}${city ? ` en ${city}` : ""} | Reserva Online",
  "seoDescription": "meta descripción SEO mencionando servicios reales y ciudad (máx 155 caracteres)",
  "faqs": [
    {"question": "pregunta sobre horarios o ubicación REAL", "answer": "respuesta con datos REALES"},
    {"question": "pregunta sobre servicios que REALMENTE ofrecen", "answer": "respuesta mencionando servicios REALES"},
    {"question": "pregunta sobre reservas o contacto", "answer": "respuesta con datos de contacto REALES si están disponibles"}
  ],
  "brandTone": "descripción del tono de marca ideal para este tipo de negocio"
}

REGLAS CRÍTICAS:
1. Solo menciona servicios que aparezcan en la lista de servicios real
2. Solo menciona horarios si están especificados
3. Solo menciona ciudad/dirección si están especificadas
4. Las FAQs deben responder con información REAL, no inventada
5. Si faltan datos, haz las FAQs más genéricas sobre reservas y experiencia
6. El contenido debe ser en español de España
7. Adapta el tono al tipo de negocio (${businessType})`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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

    // Parse AI response - clean up if wrapped in markdown
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

    // Save generation to audit table
    try {
      // Get user from auth header
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: { user } } = await userClient.auth.getUser();

      // Mark previous generations as inactive
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

      // Update tenant with generated content
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
      // Don't fail the request if save fails
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
