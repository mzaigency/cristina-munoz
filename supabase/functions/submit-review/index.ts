import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

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
    const { rating, comment } = await req.json();

    console.log('Submitting review:', { rating, comment });

    // Initialize Supabase client with service role to bypass RLS for anonymous reviews
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Save review to database
    const { data: reviewData, error: dbError } = await supabaseClient
      .from('reviews')
      .insert({
        rating,
        comment: comment || null
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
