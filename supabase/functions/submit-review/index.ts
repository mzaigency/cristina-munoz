import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { z } from 'https://esm.sh/zod@3.22.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema
const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional()
});

// Lista de palabras malsonantes y spam
const badWords = [
  'puta', 'puto', 'mierda', 'joder', 'coño', 'gilipollas', 'idiota', 'imbecil',
  'cabrón', 'cabron', 'hijo de puta', 'hijoputa', 'tonto', 'estúpido', 'estupido',
  'spam', 'scam', 'fake', 'fraude', 'estafa', 'casino', 'viagra', 'porn', 'xxx'
];

// Función para detectar contenido sospechoso
function detectSuspiciousContent(text: string | null | undefined): boolean {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  
  // Detectar palabras malsonantes
  if (badWords.some(word => lowerText.includes(word))) {
    return true;
  }
  
  // Detectar spam: demasiados enlaces
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urls = lowerText.match(urlPattern);
  if (urls && urls.length > 2) {
    return true;
  }
  
  // Detectar spam: demasiadas mayúsculas
  const upperCaseRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (text.length > 20 && upperCaseRatio > 0.5) {
    return true;
  }
  
  // Detectar spam: repetición excesiva de caracteres
  if (/(.)\1{4,}/.test(text)) {
    return true;
  }
  
  return false;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticación
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autenticación requerida. Por favor, inicia sesión para dejar una reseña.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Crear cliente con el token del usuario
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Verificar usuario autenticado
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Sesión inválida. Por favor, inicia sesión nuevamente.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const rawData = await req.json();
    
    // Validate input
    const validationResult = reviewSchema.safeParse(rawData);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data', 
          details: validationResult.error.errors 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const { rating, comment } = validationResult.data;

    // Detectar contenido sospechoso
    const isSuspicious = detectSuspiciousContent(comment);
    const approved = !isSuspicious;

    console.log('Submitting review:', { rating, comment, approved, isSuspicious, userId: user.id });

    // Verificar rate limiting antes de insertar
    const { data: canCreate, error: rateLimitError } = await supabaseClient
      .rpc('can_create_review');

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      return new Response(
        JSON.stringify({ error: 'Error al verificar el límite de reseñas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!canCreate) {
      console.log('Rate limit exceeded for user:', user.id);
      return new Response(
        JSON.stringify({ 
          error: 'Solo puedes dejar una reseña cada 24 horas. Por favor, inténtalo más tarde.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save review to database (user_id se añade automáticamente por RLS)
    const { data: reviewData, error: dbError } = await supabaseClient
      .from('reviews')
      .insert({
        user_id: user.id,
        rating,
        comment: comment || null,
        approved
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save review' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Review saved to database:', reviewData);

    // Try to send to webhook (optional, don't fail if webhook is down)
    const webhookUrl = Deno.env.get('WEBHOOK_RESENAS');

    // Try to send to webhook if configured
    if (webhookUrl) {
      try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('Webhook error response:', errorText);
        console.warn('Failed to send to webhook, but review data saved locally');
        
        // Return success anyway - the important thing is we received the review
        return new Response(
          JSON.stringify({ 
            success: true, 
            warning: 'Review received but notification system unavailable' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

        console.log('Review submitted successfully to webhook');
      } catch (webhookError) {
        console.error('Webhook request failed:', webhookError);
        console.warn('Webhook unavailable, but review saved to database');
      }
    } else {
      console.log('No webhook configured, review saved to database only');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Review received successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error submitting review:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
