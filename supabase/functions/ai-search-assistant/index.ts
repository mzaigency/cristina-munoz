import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      // Fallback when no API key
      return new Response(
        JSON.stringify({
          suggestion: query.toLowerCase().trim(),
          explanation: "Búsqueda preparada."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Eres un asistente de búsqueda para GlowApp, una app de reservas de belleza en España.

Tu tarea es optimizar las búsquedas de usuarios para encontrar los mejores salones y servicios.

IMPORTANTE:
- Extrae palabras clave relevantes: servicio, ubicación, tipo de salón
- Si mencionan una ciudad/zona, inclúyela en la búsqueda
- Si buscan algo específico (balayage, mechas, keratina, etc), enfócate en eso
- Mantén la búsqueda concisa pero completa

Responde SOLO en JSON:
{
  "suggestion": "búsqueda optimizada para filtrar salones",
  "explanation": "explicación breve de qué buscarás (máx 30 palabras)"
}

Ejemplos:
- "mejores balayage en manresa" → {"suggestion": "balayage manresa", "explanation": "Busco salones en Manresa especializados en técnica balayage."}
- "peluqueria barata barcelona" → {"suggestion": "peluquería económica barcelona", "explanation": "Salones con buenos precios en Barcelona."}
- "quiero cortarme el pelo" → {"suggestion": "corte de pelo", "explanation": "Salones que ofrecen servicios de corte."}
- "tratamiento para pelo seco" → {"suggestion": "tratamiento hidratación capilar", "explanation": "Salones con tratamientos de hidratación y reparación."}`
          },
          {
            role: 'user',
            content: query
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorStatus = response.status;
      console.error('AI gateway error:', errorStatus);
      
      if (errorStatus === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas búsquedas. Espera un momento." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (errorStatus === 402) {
        return new Response(
          JSON.stringify({ error: "Límite de uso alcanzado." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Fallback
      return new Response(
        JSON.stringify({
          suggestion: query.toLowerCase().trim(),
          explanation: "Búsqueda lista."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse AI response
    let parsed;
    try {
      // Clean potential markdown formatting
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanContent);
    } catch {
      parsed = {
        suggestion: query.toLowerCase().trim(),
        explanation: "Búsqueda preparada."
      };
    }

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-search-assistant:', error);
    
    return new Response(
      JSON.stringify({
        suggestion: '',
        explanation: 'Error al procesar. Inténtalo de nuevo.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});