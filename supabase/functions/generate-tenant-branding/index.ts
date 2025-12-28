import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BrandingRequest {
  tenantId?: string; // optional if not yet created
  name: string;
  city?: string;
  address?: string;
  services?: string[]; // service names
  stylists?: string[]; // stylist names
  existingTagline?: string;
  existingDescription?: string;
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
    const { name, city, address, services, stylists, tenantId } = body;

    if (!name) {
      return new Response(
        JSON.stringify({ success: false, error: "El nombre del salón es obligatorio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "API de IA no configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context for AI
    const servicesText = services?.length ? `Servicios: ${services.join(", ")}` : "";
    const stylistsText = stylists?.length ? `Estilistas: ${stylists.join(", ")}` : "";
    const locationText = city ? `Ubicación: ${address ? `${address}, ` : ""}${city}` : "";

    const prompt = `Eres un experto en marketing y branding para peluquerías y salones de belleza en España.

Genera contenido de marca para el siguiente salón:

Nombre: ${name}
${locationText}
${servicesText}
${stylistsText}

Genera en formato JSON válido (sin markdown, solo JSON puro) con esta estructura exacta:
{
  "tagline": "eslogan corto y memorable (máx 60 caracteres)",
  "description": "descripción del salón para la web (2-3 frases, máx 200 caracteres)",
  "seoTitle": "título SEO optimizado (máx 60 caracteres)",
  "seoDescription": "meta descripción SEO (máx 155 caracteres)",
  "faqs": [
    {"question": "pregunta frecuente 1", "answer": "respuesta concisa"},
    {"question": "pregunta frecuente 2", "answer": "respuesta concisa"},
    {"question": "pregunta frecuente 3", "answer": "respuesta concisa"}
  ],
  "brandTone": "descripción del tono de marca recomendado (profesional, cercano, juvenil, etc.)"
}

IMPORTANTE:
- El contenido debe ser en español
- Debe ser profesional pero cercano
- Adapta el tono según el tipo de servicios (si hay barba = barbería, si hay coloración/mechas = salón de belleza, etc.)
- Las FAQs deben ser relevantes para el negocio
- Devuelve SOLO el JSON, sin explicaciones adicionales`;

    console.log("Generating branding for:", name);

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

    // Save generation to audit table if tenant exists
    if (tenantId && authHeader) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const adminClient = createClient(supabaseUrl, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        // Get user from auth header
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: { user } } = await userClient.auth.getUser();

        await adminClient.from("tenant_ai_generations").insert({
          tenant_id: tenantId,
          generation_type: "branding",
          prompt: prompt,
          output: branding,
          model: "google/gemini-2.5-flash",
          created_by: user?.id || null,
          is_active: true,
        });

        // Mark previous generations as inactive
        await adminClient
          .from("tenant_ai_generations")
          .update({ is_active: false })
          .eq("tenant_id", tenantId)
          .eq("generation_type", "branding")
          .neq("is_active", false);

        console.log("Saved AI generation to audit table");
      } catch (saveError) {
        console.error("Error saving generation to audit:", saveError);
        // Don't fail the request if audit save fails
      }
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
