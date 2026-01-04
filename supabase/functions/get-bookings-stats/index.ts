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
      // Also check tenant_admins
      const { data: tenantAdmin } = await supabase
        .from('tenant_admins')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      if (!tenantAdmin || tenantAdmin.length === 0) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Get tenant_id from request body
    let tenantId: string | null = null;
    try {
      const body = await req.json();
      tenantId = body.tenantId || null;
    } catch {
      // No body provided
    }

    // Calculate date ranges (today / this week / this month) based on booking creation time (created_at)
    const now = new Date();

    // Today (start and end of today)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Yesterday (for comparison)
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // This week (calendar week, Monday -> today)
    const weekStart = new Date(todayStart);
    const dayOfWeek = weekStart.getDay(); // 0=Sun..6=Sat
    const daysSinceMonday = (dayOfWeek + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
    weekStart.setDate(weekStart.getDate() - daysSinceMonday);

    // Previous week (same length as current week-to-date)
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(todayEnd);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);

    // This month (calendar month, 1st -> today)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Previous month (same length as current month-to-date)
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const daysIntoMonth = Math.floor((todayEnd.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000));
    const prevMonthEnd = new Date(prevMonthStart);
    prevMonthEnd.setDate(prevMonthEnd.getDate() + daysIntoMonth);


    console.log(`Fetching stats for tenant: ${tenantId || 'all'}`);
    console.log(`Today: ${todayStart.toISOString()} to ${todayEnd.toISOString()}`);
    console.log(`This week: ${weekStart.toISOString()} to ${todayEnd.toISOString()}`);
    console.log(`This month: ${monthStart.toISOString()} to ${todayEnd.toISOString()}`);

    // Build query for a specific date range using created_at
    const buildQuery = (startDate: Date, endDate: Date) => {
      let query = supabase
        .from('bookings')
        .select('id, created_at, canal, status')
        .eq('status', 'confirmed')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());
      
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
      buildQuery(todayStart, todayEnd),           // Today only
      buildQuery(yesterdayStart, todayStart),     // Yesterday only
      buildQuery(weekStart, todayEnd),            // Last 7 days
      buildQuery(prevWeekStart, prevWeekEnd),     // Previous 7 days
      buildQuery(monthStart, todayEnd),           // Last 30 days
      buildQuery(prevMonthStart, prevMonthEnd),   // Previous 30 days
    ]);

    // Count by channel (only CRM and Web)
    const countByChannel = (bookings: { canal: string | null }[]) => {
      const crm = bookings.filter(b => b.canal === 'crm').length;
      const web = bookings.filter(b => b.canal === 'web' || b.canal === 'whatsapp' || !b.canal).length;
      return { crm, web };
    };

    const dailyBookings = dailyRes.data || [];
    const previousDayBookings = previousDayRes.data || [];
    const weeklyBookings = weeklyRes.data || [];
    const previousWeekBookings = previousWeekRes.data || [];
    const monthlyBookings = monthlyRes.data || [];
    const previousMonthBookings = previousMonthRes.data || [];

    console.log(`Results - Daily: ${dailyBookings.length}, Weekly: ${weeklyBookings.length}, Monthly: ${monthlyBookings.length}`);

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
