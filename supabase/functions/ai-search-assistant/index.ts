import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Use Lovable AI to process the query
    const response = await fetch('https://lovable.ai/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_AI_KEY') || ''}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Eres un asistente de búsqueda para GlowApp, una aplicación de reservas de belleza.
            
Tu tarea es:
1. Entender lo que el usuario busca
2. Generar una búsqueda optimizada que encuentre los mejores salones/servicios
3. Dar una breve explicación de por qué sugieres esa búsqueda

Responde SIEMPRE en formato JSON con esta estructura:
{
  "suggestion": "texto de búsqueda optimizado",
  "explanation": "breve explicación (máx 50 palabras)"
}

Ejemplos:
- "quiero cortarme el pelo" → {"suggestion": "corte de pelo", "explanation": "Buscaré salones que ofrezcan servicios de corte de pelo con buenas valoraciones."}
- "necesito algo para mi boda" → {"suggestion": "peinado novia maquillaje", "explanation": "Te mostraré salones especializados en servicios nupciales."}
- "tengo el pelo muy dañado" → {"suggestion": "tratamiento capilar reparación", "explanation": "Encontraré salones con tratamientos de hidratación y reparación profunda."}

IMPORTANTE: Solo responde con el JSON, sin texto adicional.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      // Fallback if Lovable AI is not available
      console.error('Lovable AI error, using fallback');
      return new Response(
        JSON.stringify({
          suggestion: query.toLowerCase().replace(/[^\w\sáéíóúüñ]/gi, '').trim(),
          explanation: "He preparado tu búsqueda para encontrar los mejores resultados."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse the AI response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // If parsing fails, use the content as suggestion
      parsed = {
        suggestion: query,
        explanation: content || "Búsqueda lista."
      };
    }

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-search-assistant:', error);
    
    // Fallback response
    return new Response(
      JSON.stringify({
        suggestion: '',
        explanation: 'No se pudo procesar la búsqueda. Inténtalo de nuevo.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
