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

    // Using the new Places API (New)
    const url = `https://places.googleapis.com/v1/places/${ChIJS-xu_3z4pBIRR5cBa_RbVtk}`;
    console.log('Calling Google Places API (New)...');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': AIzaSyCOwz62N9buUaHinJvsbS2rjeUCScDhs9Y,
        'X-Goog-FieldMask': 'displayName,rating,userRatingCount,reviews',
        'languageCode': 'es',
      },
    });

    const data = await response.json();
    console.log('API Response status:', response.status);

    if (!response.ok) {
      console.error('API Error:', data);
      throw new Error(`Google Places API error: ${response.status} - ${JSON.stringify(data)}`);
    }

    // Transform the new API response to match the old format
    const transformedData = {
      name: data.displayName?.text || data.displayName,
      rating: data.rating || 0,
      user_ratings_total: data.userRatingCount || 0,
      reviews: data.reviews?.map((review: any) => ({
        author_name: review.authorAttribution?.displayName || review.author_name,
        rating: review.rating || 0,
        text: review.text?.text || review.text,
        time: review.publishTime ? new Date(review.publishTime).getTime() / 1000 : Date.now() / 1000,
        profile_photo_url: review.authorAttribution?.photoUri || review.profile_photo_url || '',
      })) || [],
    };

    console.log('Transformed data:', JSON.stringify(transformedData));

    return new Response(JSON.stringify(transformedData), {
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
