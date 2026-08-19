import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, clientIp, rateLimited } from "../_shared/rate-limit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchIntent {
  services: string[];
  location: string | null;
  keywords: string[];
}

interface SalonResult {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  logo_url: string | null;
  primary_color: string | null;
  tagline: string | null;
  matchedServices: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    // Anti-abuso: la búsqueda con IA cuesta créditos → 15 por IP cada 5 min
    if (!(await checkRateLimit("ai-search", clientIp(req), 15, 300))) {
      return rateLimited(corsHeaders, "Demasiadas búsquedas seguidas. Espera un momento.");
    }

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Extract search intent using AI
    let searchIntent: SearchIntent = {
      services: [],
      location: null,
      keywords: []
    };

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (LOVABLE_API_KEY) {
      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                content: `Eres un extractor de intención de búsqueda para una app de reservas de belleza en España.

Analiza la búsqueda del usuario y extrae:
- services: array de servicios mencionados (balayage, mechas, corte, keratina, manicura, pedicura, tinte, extensiones, etc.)
- location: ciudad o zona mencionada (puede ser null)
- keywords: otras palabras clave relevantes

IMPORTANTE:
- Normaliza los servicios (ej: "babylight" → "babylight", "mechas californianas" → "mechas")
- Si mencionan "cerca" o "cerca de mí", location debe ser null (se usará geolocalización)
- Los keywords son términos adicionales para buscar en descripción

Responde SOLO en JSON válido:
{
  "services": ["servicio1", "servicio2"],
  "location": "ciudad o null",
  "keywords": ["keyword1"]
}

Ejemplos:
- "babylight en manresa" → {"services": ["babylight"], "location": "manresa", "keywords": []}
- "mejores mechas barcelona" → {"services": ["mechas"], "location": "barcelona", "keywords": ["mejores"]}
- "peluquería cerca de mí" → {"services": [], "location": null, "keywords": ["peluquería"]}
- "corte y color en madrid" → {"services": ["corte", "color", "tinte"], "location": "madrid", "keywords": []}`
              },
              {
                role: 'user',
                content: query
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          searchIntent = JSON.parse(cleanContent);
        }
      } catch (aiError) {
        console.error('AI extraction error:', aiError);
        // Fallback: simple keyword extraction
        const lowerQuery = query.toLowerCase();
        const commonServices = ['balayage', 'babylight', 'mechas', 'corte', 'tinte', 'color', 'keratina', 'alisado', 'manicura', 'pedicura', 'extensiones', 'tratamiento'];
        searchIntent.services = commonServices.filter(s => lowerQuery.includes(s));
        searchIntent.keywords = [query];
      }
    } else {
      // No API key - basic extraction
      const lowerQuery = query.toLowerCase();
      const commonServices = ['balayage', 'babylight', 'mechas', 'corte', 'tinte', 'color', 'keratina', 'alisado', 'manicura', 'pedicura', 'extensiones', 'tratamiento'];
      searchIntent.services = commonServices.filter(s => lowerQuery.includes(s));
      searchIntent.keywords = [query];
    }

    console.log('Search intent:', searchIntent);

    // Step 2: Query the database
    let tenantsQuery = supabase
      .from('tenants')
      .select('id, name, slug, city, logo_url, primary_color, tagline, description')
      .eq('is_active', true);

    // Filter by location if provided
    if (searchIntent.location) {
      tenantsQuery = tenantsQuery.ilike('city', `%${searchIntent.location}%`);
    }

    const { data: tenants, error: tenantsError } = await tenantsQuery;

    if (tenantsError) {
      console.error('Tenants query error:', tenantsError);
      throw tenantsError;
    }

    // Step 3: Get services for matching
    const { data: allServices, error: servicesError } = await supabase
      .from('services')
      .select('id, name, tenant_id')
      .in('tenant_id', (tenants || []).map(t => t.id));

    if (servicesError) {
      console.error('Services query error:', servicesError);
    }

    // Step 4: Score and filter results
    const results: SalonResult[] = [];
    const searchTerms = [...searchIntent.services, ...searchIntent.keywords].map(s => s.toLowerCase());

    for (const tenant of tenants || []) {
      const tenantServices = (allServices || []).filter(s => s.tenant_id === tenant.id);
      const matchedServices: string[] = [];
      let score = 0;

      // Check service matches
      for (const service of tenantServices) {
        const serviceName = service.name.toLowerCase();
        for (const term of searchIntent.services) {
          if (serviceName.includes(term.toLowerCase()) || term.toLowerCase().includes(serviceName)) {
            matchedServices.push(service.name);
            score += 10;
            break;
          }
        }
      }

      // Check description/tagline matches
      const descriptionText = `${tenant.description || ''} ${tenant.tagline || ''} ${tenant.name || ''}`.toLowerCase();
      for (const term of searchTerms) {
        if (descriptionText.includes(term)) {
          score += 3;
        }
      }

      // Location exact match bonus
      if (searchIntent.location && tenant.city?.toLowerCase() === searchIntent.location.toLowerCase()) {
        score += 5;
      }

      // Include if has any match or no specific search terms
      if (score > 0 || searchTerms.length === 0) {
        results.push({
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          city: tenant.city,
          logo_url: tenant.logo_url,
          primary_color: tenant.primary_color,
          tagline: tenant.tagline,
          matchedServices: [...new Set(matchedServices)].slice(0, 3)
        });
      }
    }

    // Sort by score (implicit by order of addition, higher scores first)
    results.sort((a, b) => {
      const scoreA = a.matchedServices.length * 10 + (searchIntent.location && a.city?.toLowerCase() === searchIntent.location.toLowerCase() ? 5 : 0);
      const scoreB = b.matchedServices.length * 10 + (searchIntent.location && b.city?.toLowerCase() === searchIntent.location.toLowerCase() ? 5 : 0);
      return scoreB - scoreA;
    });

    // Limit results
    const limitedResults = results.slice(0, 10);

    // Generate message
    let message = '';
    if (limitedResults.length === 0) {
      message = 'No encontré salones con esos criterios. Prueba con otra búsqueda.';
    } else if (limitedResults.length === 1) {
      message = `1 salón encontrado`;
      if (searchIntent.services.length > 0) {
        message += ` con ${searchIntent.services.join(', ')}`;
      }
      if (searchIntent.location) {
        message += ` en ${searchIntent.location}`;
      }
    } else {
      message = `${limitedResults.length} salones encontrados`;
      if (searchIntent.services.length > 0) {
        message += ` con ${searchIntent.services.join(', ')}`;
      }
      if (searchIntent.location) {
        message += ` en ${searchIntent.location}`;
      }
    }

    return new Response(
      JSON.stringify({
        message,
        results: limitedResults,
        intent: searchIntent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-search-assistant:', error);
    
    return new Response(
      JSON.stringify({
        message: 'Error al buscar. Inténtalo de nuevo.',
        results: [],
        intent: null
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
