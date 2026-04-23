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

    // Build COUNT-only query for a specific date range using created_at.
    // Using { count: 'exact', head: true } avoids the default 1000-row cap on .select()
    // so totals keep growing past 1000 bookings.
    const buildCountQuery = (startDate: Date, endDate: Date, channelFilter?: 'crm' | 'web') => {
      let query = supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'confirmed')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      if (channelFilter === 'crm') {
        query = query.eq('canal', 'crm');
      } else if (channelFilter === 'web') {
        // web = canal in ('web', 'whatsapp') OR canal IS NULL
        query = query.or('canal.eq.web,canal.eq.whatsapp,canal.is.null');
      }

      return query;
    };

    // Fetch counts (total + per-channel) for each period in parallel
    const [
      dailyTotal, dailyCrm, dailyWeb,
      previousDayTotal,
      weeklyTotal, weeklyCrm, weeklyWeb,
      previousWeekTotal,
      monthlyTotal, monthlyCrm, monthlyWeb,
      previousMonthTotal,
    ] = await Promise.all([
      buildCountQuery(todayStart, todayEnd),
      buildCountQuery(todayStart, todayEnd, 'crm'),
      buildCountQuery(todayStart, todayEnd, 'web'),
      buildCountQuery(yesterdayStart, todayStart),
      buildCountQuery(weekStart, todayEnd),
      buildCountQuery(weekStart, todayEnd, 'crm'),
      buildCountQuery(weekStart, todayEnd, 'web'),
      buildCountQuery(prevWeekStart, prevWeekEnd),
      buildCountQuery(monthStart, todayEnd),
      buildCountQuery(monthStart, todayEnd, 'crm'),
      buildCountQuery(monthStart, todayEnd, 'web'),
      buildCountQuery(prevMonthStart, prevMonthEnd),
    ]);

    const dailyCount = dailyTotal.count || 0;
    const previousDayCount = previousDayTotal.count || 0;
    const weeklyCount = weeklyTotal.count || 0;
    const previousWeekCount = previousWeekTotal.count || 0;
    const monthlyCount = monthlyTotal.count || 0;
    const previousMonthCount = previousMonthTotal.count || 0;

    console.log(`Results - Daily: ${dailyCount}, Weekly: ${weeklyCount}, Monthly: ${monthlyCount}`);
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
