import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TenantScore {
  tenant_id: string;
  score: number;
  matchReasons: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Calculating recommendations for user: ${user.id}`);

    // 1. Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('city, province, country')
      .eq('id', user.id)
      .single();

    // 2. Get user favorites
    const { data: favorites } = await supabase
      .from('favorites')
      .select('tenant_id')
      .eq('user_id', user.id);
    
    const favoriteIds = favorites?.map(f => f.tenant_id) || [];

    // 3. Get user follows
    const { data: follows } = await supabase
      .from('follows')
      .select('tenant_id')
      .eq('follower_id', user.id);
    
    const followIds = follows?.map(f => f.tenant_id) || [];

    // 4. Get user bookings to analyze preferences
    const { data: bookings } = await supabase
      .from('bookings')
      .select('tenant_id, services, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const bookedTenantIds = [...new Set(bookings?.map(b => b.tenant_id).filter(Boolean) || [])];

    // 5. Get all active tenants with their stats
    const { data: tenants } = await supabase
      .from('tenants')
      .select(`
        id,
        name,
        slug,
        city,
        logo_url,
        tagline,
        primary_color,
        features,
        created_at
      `)
      .eq('is_active', true);

    if (!tenants || tenants.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Get reviews stats for all tenants
    const { data: reviewStats } = await supabase
      .from('reviews')
      .select('tenant_id, rating')
      .eq('approved', true);

    // Calculate avg rating per tenant
    const ratingsByTenant: Record<string, { sum: number; count: number }> = {};
    reviewStats?.forEach(r => {
      if (r.tenant_id) {
        if (!ratingsByTenant[r.tenant_id]) {
          ratingsByTenant[r.tenant_id] = { sum: 0, count: 0 };
        }
        ratingsByTenant[r.tenant_id].sum += r.rating;
        ratingsByTenant[r.tenant_id].count += 1;
      }
    });

    // 7. Get favorite tenants' business types to find similar ones
    let preferredBusinessTypes: string[] = [];
    if (favoriteIds.length > 0) {
      const favTenants = tenants.filter(t => favoriteIds.includes(t.id));
      preferredBusinessTypes = favTenants
        .map(t => (t.features as any)?.business_type)
        .filter(Boolean);
    }

    // 8. Calculate score for each tenant
    const now = Date.now();
    const tenantScores: TenantScore[] = tenants.map(tenant => {
      let score = 0;
      const matchReasons: string[] = [];
      const features = tenant.features as any || {};
      const businessType = features.business_type;

      // Location score (25%)
      if (profile?.city && tenant.city?.toLowerCase() === profile.city.toLowerCase()) {
        score += 25;
        matchReasons.push('Cerca de ti');
      } else if (profile?.province && tenant.city) {
        score += 5;
      }

      // Similar to favorites (25%) — descubrir nuevos del mismo tipo
      if (
        preferredBusinessTypes.length > 0 &&
        businessType &&
        preferredBusinessTypes.includes(businessType) &&
        !favoriteIds.includes(tenant.id)
      ) {
        score += 25;
        matchReasons.push('Similar a tus favoritos');
      }

      // Rating score (20%)
      const tenantRating = ratingsByTenant[tenant.id];
      if (tenantRating && tenantRating.count > 0) {
        const avgRating = tenantRating.sum / tenantRating.count;
        score += (avgRating / 5) * 20;
        // Boost por volumen de reviews (confianza)
        if (tenantRating.count >= 10) score += 3;
        if (avgRating >= 4.5) {
          matchReasons.push('Muy bien valorado');
        }
      }

      // Booking history (15%) — ya lo conoces, vuelve
      if (bookedTenantIds.includes(tenant.id)) {
        score += 15;
        matchReasons.push('Ya lo visitaste');
      }

      // Follows (10%)
      if (followIds.includes(tenant.id)) {
        score += 10;
        matchReasons.push('Lo sigues');
      }

      // Recency boost (5%) — destacar nuevos del último mes
      const createdAt = (tenant as any).created_at ? new Date((tenant as any).created_at).getTime() : 0;
      if (createdAt) {
        const daysOld = (now - createdAt) / (1000 * 60 * 60 * 24);
        if (daysOld <= 30) {
          score += 5;
          matchReasons.push('Recién llegado');
        } else if (daysOld <= 90) {
          score += 2;
        }
      }

      // Penalizar si ya está en favoritos (se muestra en su propia sección)
      if (favoriteIds.includes(tenant.id)) {
        score -= 20;
      }

      // Pequeña aleatoriedad para frescura (±3)
      score += (Math.random() - 0.5) * 6;

      return {
        tenant_id: tenant.id,
        score: Math.round(score * 10) / 10,
        matchReasons: matchReasons.slice(0, 3)
      };
    });

    // Sort by score descending
    tenantScores.sort((a, b) => b.score - a.score);

    console.log(`Generated ${tenantScores.length} recommendations`);

    return new Response(
      JSON.stringify({ recommendations: tenantScores }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating recommendations:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
