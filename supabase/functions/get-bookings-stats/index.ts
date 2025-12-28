import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin or stylist
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdminOrStylist = roles?.some(r => r.role === 'admin' || r.role === 'stylist' || r.role === 'superadmin');
    if (!isAdminOrStylist) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get tenant_id from request body (optional - for tenant-specific stats)
    let tenantId: string | null = null;
    try {
      const body = await req.json();
      tenantId = body.tenantId || null;
    } catch {
      // No body provided, will return global stats for superadmin
    }

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    // Format dates for Supabase queries
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    console.log(`Fetching stats for tenant: ${tenantId || 'all'}`);
    console.log(`Date ranges - Today: ${formatDate(today)}, Week ago: ${formatDate(weekAgo)}, Month ago: ${formatDate(monthAgo)}`);

    // Build base query
    const buildQuery = (startDate: Date, endDate?: Date) => {
      let query = supabase
        .from('bookings')
        .select('id, Fecha, canal, status')
        .eq('status', 'confirmed')
        .gte('Fecha', formatDate(startDate));
      
      if (endDate) {
        query = query.lt('Fecha', formatDate(endDate));
      }
      
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      return query;
    };

    // Fetch bookings for different periods
    const [
      dailyRes,
      previousDayRes,
      weeklyRes,
      previousWeekRes,
      monthlyRes,
      previousMonthRes,
    ] = await Promise.all([
      buildQuery(today),
      buildQuery(yesterday, today),
      buildQuery(weekAgo),
      buildQuery(twoWeeksAgo, weekAgo),
      buildQuery(monthAgo),
      buildQuery(twoMonthsAgo, monthAgo),
    ]);

    // Count by channel
    const countByChannel = (bookings: { canal: string | null }[]) => {
      const whatsapp = bookings.filter(b => b.canal === 'whatsapp').length;
      const crm = bookings.filter(b => b.canal === 'crm').length;
      const web = bookings.filter(b => b.canal === 'web' || !b.canal).length;
      
      console.log(`Channel counts - WhatsApp: ${whatsapp}, CRM: ${crm}, Web: ${web}`);
      return { whatsapp, crm, web };
    };

    const dailyBookings = dailyRes.data || [];
    const previousDayBookings = previousDayRes.data || [];
    const weeklyBookings = weeklyRes.data || [];
    const previousWeekBookings = previousWeekRes.data || [];
    const monthlyBookings = monthlyRes.data || [];
    const previousMonthBookings = previousMonthRes.data || [];

    console.log(`Daily: ${dailyBookings.length}, Weekly: ${weeklyBookings.length}, Monthly: ${monthlyBookings.length}`);

    // Get average rating from reviews
    let reviewsQuery = supabase
      .from('reviews')
      .select('rating')
      .eq('approved', true);
    
    if (tenantId) {
      reviewsQuery = reviewsQuery.eq('tenant_id', tenantId);
    }
    
    const { data: reviews } = await reviewsQuery;
    
    const averageRating = reviews && reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    return new Response(
      JSON.stringify({
        daily: {
          total: dailyBookings.length,
          previous: previousDayBookings.length,
          byChannel: countByChannel(dailyBookings),
        },
        weekly: {
          total: weeklyBookings.length,
          previous: previousWeekBookings.length,
          byChannel: countByChannel(weeklyBookings),
        },
        monthly: {
          total: monthlyBookings.length,
          previous: previousMonthBookings.length,
          byChannel: countByChannel(monthlyBookings),
        },
        averageRating: Math.round(averageRating * 10) / 10,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching bookings stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
