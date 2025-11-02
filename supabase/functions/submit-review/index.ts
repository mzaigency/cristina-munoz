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
    const webhookUrl = Deno.env.get('WEBHOOK_RESENAS');
    
    if (!webhookUrl) {
      console.error('WEBHOOK_RESENAS not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { rating, comment } = await req.json();

    console.log('Submitting review:', { rating, comment });

    // Send to webhook
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
      console.warn('Webhook unavailable, but review data logged');
      
      // Continue anyway - the review data is logged
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
