import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, Building2, Calendar, DollarSign, 
  TrendingUp, TrendingDown, Star, MessageSquare,
  Activity, Heart, Eye, CreditCard
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  monthly_price: number;
}

interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  totalTenants: number;
  activeTenants: number;
  totalBookingsToday: number;
  totalBookingsThisWeek: number;
  // App revenue metrics
  monthlyRecurringRevenue: number;
  projectedAnnualRevenue: number;
  revenueByPlan: { plan: string; count: number; revenue: number }[];
  totalReviews: number;
  avgRating: number;
  totalFavorites: number;
  totalMessages: number;
  totalStories: number;
  activeStoriesNow: number;
}

interface TrendData {
  date: string;
  users: number;
  bookings: number;
  tenants: number;
}

const COLORS = ['#8B5CF6', '#D946EF', '#F59E0B', '#10B981'];

export const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlansAndData();
  }, []);

  const fetchPlansAndData = async () => {
    try {
      // First fetch subscription plans
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('id, name, slug, monthly_price')
        .eq('is_active', true)
        .order('sort_order');
      
      const fetchedPlans = plansData || [];
      setPlans(fetchedPlans);
      
      // Create pricing map from database
      const planPricing: Record<string, number> = {};
      fetchedPlans.forEach(p => {
        planPricing[p.slug] = p.monthly_price;
      });

      await fetchDashboardData(planPricing, fetchedPlans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      setLoading(false);
    }
  };

  const fetchDashboardData = async (planPricing: Record<string, number>, plansList: SubscriptionPlan[]) => {
    try {
      const today = new Date();
      const weekAgo = subDays(today, 7);
      
      // Fetch all stats in parallel
      const [
        usersResult,
        newUsersTodayResult,
        newUsersWeekResult,
        tenantsResult,
        bookingsTodayResult,
        bookingsWeekResult,
        reviewsResult,
        favoritesResult,
        messagesResult,
        storiesResult,
        activeStoriesResult
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .gte('created_at', startOfDay(today).toISOString()),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString()),
        supabase.from('tenants').select('id, is_active, subscription_plan'),
        supabase.from('bookings').select('id', { count: 'exact', head: true })
          .eq('Fecha', format(today, 'yyyy-MM-dd')),
        supabase.from('bookings').select('id', { count: 'exact', head: true })
          .gte('Fecha', format(weekAgo, 'yyyy-MM-dd')),
        supabase.from('reviews').select('rating'),
        supabase.from('favorites').select('id', { count: 'exact', head: true }),
        supabase.from('direct_messages').select('id', { count: 'exact', head: true }),
        supabase.from('salon_stories').select('id', { count: 'exact', head: true }),
        supabase.from('salon_stories').select('id', { count: 'exact', head: true })
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
      ]);

      // Calculate app revenue based on active tenants and their plans from database
      const tenants = tenantsResult.data || [];
      const totalTenants = tenants.length;
      const activeTenants = tenants.filter(t => t.is_active).length;
      
      // Calculate MRR using prices from database
      const revenueByPlan = plansList.map(plan => {
        const count = tenants.filter(t => t.is_active && t.subscription_plan === plan.slug).length;
        const price = planPricing[plan.slug] || 0;
        return {
          plan: plan.name,
          count,
          revenue: count * price
        };
      }).filter(p => p.count > 0);
      
      const monthlyRecurringRevenue = revenueByPlan.reduce((sum, p) => sum + p.revenue, 0);
      const projectedAnnualRevenue = monthlyRecurringRevenue * 12;
      
      // Calculate avg rating
      const ratings = reviewsResult.data || [];
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;

      setStats({
        totalUsers: usersResult.count || 0,
        newUsersToday: newUsersTodayResult.count || 0,
        newUsersThisWeek: newUsersWeekResult.count || 0,
        totalTenants,
        activeTenants,
        totalBookingsToday: bookingsTodayResult.count || 0,
        totalBookingsThisWeek: bookingsWeekResult.count || 0,
        monthlyRecurringRevenue,
        projectedAnnualRevenue,
        revenueByPlan,
        totalReviews: ratings.length,
        avgRating: Math.round(avgRating * 10) / 10,
        totalFavorites: favoritesResult.count || 0,
        totalMessages: messagesResult.count || 0,
        totalStories: storiesResult.count || 0,
        activeStoriesNow: activeStoriesResult.count || 0
      });

      // Fetch trend data for last 7 days
      const trendPromises = [];
      for (let i = 6; i >= 0; i--) {
        const day = subDays(today, i);
        const dayStr = format(day, 'yyyy-MM-dd');
        trendPromises.push(
          Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true })
              .gte('created_at', startOfDay(day).toISOString())
              .lte('created_at', endOfDay(day).toISOString()),
            supabase.from('bookings').select('id', { count: 'exact', head: true })
              .eq('Fecha', dayStr),
            supabase.from('tenants').select('id', { count: 'exact', head: true })
              .gte('created_at', startOfDay(day).toISOString())
              .lte('created_at', endOfDay(day).toISOString())
          ]).then(([users, bookings, tenants]) => ({
            date: format(day, 'EEE', { locale: es }),
            users: users.count || 0,
            bookings: bookings.count || 0,
            tenants: tenants.count || 0
          }))
        );
      }
      
      const trends = await Promise.all(trendPromises);
      setTrendData(trends);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    subValue, 
    icon: Icon, 
    trend, 
    trendValue,
    color = "primary",
    gradient
  }: { 
    title: string; 
    value: string | number; 
    subValue?: string;
    icon: any; 
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color?: string;
    gradient?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
        <div className={`absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 -mr-6 md:-mr-8 -mt-6 md:-mt-8 rounded-full opacity-10 ${gradient || 'bg-primary'}`} />
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6 md:pb-2">
          <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`p-1.5 md:p-2 rounded-lg ${gradient ? gradient : 'bg-primary/10'}`}>
            <Icon className="h-3 w-3 md:h-4 md:w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-lg md:text-2xl font-bold">{value}</div>
              {subValue && (
                <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 line-clamp-1">{subValue}</p>
              )}
            </div>
            {trend && trendValue && (
              <Badge 
                variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}
                className="flex items-center gap-0.5 md:gap-1 text-[10px] md:text-xs h-5 md:h-6"
              >
                {trend === 'up' ? <TrendingUp className="h-2.5 w-2.5 md:h-3 md:w-3" /> : 
                 trend === 'down' ? <TrendingDown className="h-2.5 w-2.5 md:h-3 md:w-3" /> : null}
                {trendValue}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
                <Skeleton className="h-3 md:h-4 w-16 md:w-24" />
              </CardHeader>
              <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                <Skeleton className="h-5 md:h-8 w-12 md:w-16" />
                <Skeleton className="h-2 md:h-3 w-24 md:w-32 mt-1 md:mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Revenue KPIs - App Income */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <StatCard
          title="MRR"
          value={`€${stats.monthlyRecurringRevenue.toLocaleString()}`}
          subValue={`${stats.activeTenants} negocios`}
          icon={DollarSign}
          trend="up"
          trendValue={`${stats.activeTenants}`}
          gradient="bg-gradient-to-br from-green-500 to-emerald-600"
        />
        <StatCard
          title="ARR"
          value={`€${stats.projectedAnnualRevenue.toLocaleString()}`}
          subValue="Anual estimado"
          icon={CreditCard}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
        <StatCard
          title="Negocios"
          value={`${stats.activeTenants}/${stats.totalTenants}`}
          subValue={`${Math.round((stats.activeTenants / Math.max(stats.totalTenants, 1)) * 100)}% activos`}
          icon={Building2}
          trend="up"
          trendValue={`${stats.activeTenants}`}
          gradient="bg-gradient-to-br from-purple-500 to-violet-600"
        />
        <StatCard
          title="Usuarios"
          value={stats.totalUsers}
          subValue={`+${stats.newUsersToday} hoy`}
          icon={Users}
          trend={stats.newUsersToday > 0 ? 'up' : 'neutral'}
          trendValue={stats.newUsersToday > 0 ? `+${stats.newUsersToday}` : '0'}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <StatCard
          title="Reservas Hoy"
          value={stats.totalBookingsToday}
          subValue={`${stats.totalBookingsThisWeek} semana`}
          icon={Calendar}
        />
        <StatCard
          title="Valoración"
          value={stats.avgRating.toFixed(1)}
          subValue={`${stats.totalReviews} reseñas`}
          icon={Star}
        />
        <StatCard
          title="Favoritos"
          value={stats.totalFavorites}
          subValue="Guardados"
          icon={Heart}
        />
        <StatCard
          title="Stories"
          value={stats.activeStoriesNow}
          subValue={`${stats.totalStories} totales`}
          icon={Eye}
        />
      </div>

      {/* Charts - Stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <Activity className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              Tendencia
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-6 pt-0">
            <div className="h-[200px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-[10px] md:text-xs" tick={{ fontSize: 10 }} />
                  <YAxis className="text-[10px] md:text-xs" tick={{ fontSize: 10 }} width={30} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                    name="Usuarios"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bookings" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    dot={{ fill: '#F59E0B', r: 3 }}
                    name="Reservas"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              Ingresos por Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-6 pt-0">
            <div className="h-[200px] md:h-[300px]">
              {stats.revenueByPlan.length > 0 ? (
                <div className="w-full h-full flex flex-col md:flex-row items-center gap-4">
                  <div className="w-full md:w-1/2 h-32 md:h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.revenueByPlan}
                          dataKey="revenue"
                          nameKey="plan"
                          cx="50%"
                          cy="50%"
                          outerRadius="80%"
                          innerRadius="50%"
                          paddingAngle={2}
                        >
                          {stats.revenueByPlan.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`€${value}/mes`, 'Ingresos']}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:flex-1 space-y-2 md:space-y-3">
                    {stats.revenueByPlan.map((plan, index) => (
                      <div key={plan.plan} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-xs md:text-sm font-medium">{plan.plan}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs md:text-sm font-bold">€{plan.revenue}</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground">{plan.count} negocios</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <DollarSign className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-xs md:text-sm">Sin suscripciones</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Tenants Trend */}
      <Card>
        <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-sm md:text-base">
            <Building2 className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
            Nuevos Negocios (7 días)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-6 pt-0">
          <div className="h-[150px] md:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-[10px] md:text-xs" tick={{ fontSize: 10 }} />
                <YAxis className="text-[10px] md:text-xs" tick={{ fontSize: 10 }} width={30} />
                <Tooltip 
                  formatter={(value: number) => [value, 'Nuevos negocios']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="tenants" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.2}
                  strokeWidth={2}
                  name="Negocios"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
