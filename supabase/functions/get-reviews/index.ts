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
    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
    const PLACE_ID = Deno.env.get('GOOGLE_PLACE_ID');

    console.log('Checking API credentials...');
    console.log('Has API Key:', !!GOOGLE_PLACES_API_KEY);
    console.log('Has Place ID:', !!PLACE_ID);

    if (!GOOGLE_PLACES_API_KEY || !PLACE_ID) {
      throw new Error('Missing Google Places API key or Place ID');
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=name,rating,reviews,user_ratings_total&key=${GOOGLE_PLACES_API_KEY}&language=es`;
    console.log('Calling Google Places API...');

    const response = await fetch(url);
    const data = await response.json();

    console.log('API Response status:', data.status);
    if (data.error_message) {
      console.log('API Error message:', data.error_message);
    }

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}${data.error_message ? ' - ' + data.error_message : ''}`);
    }

    return new Response(JSON.stringify(data.result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-reviews function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
