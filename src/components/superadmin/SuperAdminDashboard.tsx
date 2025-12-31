import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, Building2, Calendar, DollarSign, 
  TrendingUp, TrendingDown, Star, MessageSquare,
  Activity, Heart, Eye
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  totalTenants: number;
  activeTenants: number;
  totalBookingsToday: number;
  totalBookingsThisWeek: number;
  totalRevenue: number;
  revenueThisWeek: number;
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
  revenue: number;
}

export const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      const weekAgo = subDays(today, 7);
      
      // Fetch all stats in parallel
      const [
        usersResult,
        newUsersTodayResult,
        newUsersWeekResult,
        tenantsResult,
        activeTenantsResult,
        bookingsTodayResult,
        bookingsWeekResult,
        revenueResult,
        revenueWeekResult,
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
        supabase.from('tenants').select('id', { count: 'exact', head: true }),
        supabase.from('tenants').select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase.from('bookings').select('id', { count: 'exact', head: true })
          .eq('Fecha', format(today, 'yyyy-MM-dd')),
        supabase.from('bookings').select('id', { count: 'exact', head: true })
          .gte('Fecha', format(weekAgo, 'yyyy-MM-dd')),
        supabase.from('transactions').select('total').eq('voided', false),
        supabase.from('transactions').select('total')
          .eq('voided', false)
          .gte('created_at', weekAgo.toISOString()),
        supabase.from('reviews').select('rating'),
        supabase.from('favorites').select('id', { count: 'exact', head: true }),
        supabase.from('direct_messages').select('id', { count: 'exact', head: true }),
        supabase.from('salon_stories').select('id', { count: 'exact', head: true }),
        supabase.from('salon_stories').select('id', { count: 'exact', head: true })
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
      ]);

      // Calculate revenue
      const totalRevenue = revenueResult.data?.reduce((sum, t) => sum + (t.total || 0), 0) || 0;
      const revenueThisWeek = revenueWeekResult.data?.reduce((sum, t) => sum + (t.total || 0), 0) || 0;
      
      // Calculate avg rating
      const ratings = reviewsResult.data || [];
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;

      setStats({
        totalUsers: usersResult.count || 0,
        newUsersToday: newUsersTodayResult.count || 0,
        newUsersThisWeek: newUsersWeekResult.count || 0,
        totalTenants: tenantsResult.count || 0,
        activeTenants: activeTenantsResult.count || 0,
        totalBookingsToday: bookingsTodayResult.count || 0,
        totalBookingsThisWeek: bookingsWeekResult.count || 0,
        totalRevenue,
        revenueThisWeek,
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
            supabase.from('transactions').select('total')
              .eq('voided', false)
              .gte('created_at', startOfDay(day).toISOString())
              .lte('created_at', endOfDay(day).toISOString())
          ]).then(([users, bookings, revenue]) => ({
            date: format(day, 'EEE', { locale: es }),
            users: users.count || 0,
            bookings: bookings.count || 0,
            revenue: revenue.data?.reduce((sum, t) => sum + (t.total || 0), 0) || 0
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
    color = "primary"
  }: { 
    title: string; 
    value: string | number; 
    subValue?: string;
    icon: any; 
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
        <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10 bg-${color}`} />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg bg-${color}/10`}>
            <Icon className={`h-4 w-4 text-${color}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold">{value}</div>
              {subValue && (
                <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
              )}
            </div>
            {trend && trendValue && (
              <Badge 
                variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}
                className="flex items-center gap-1"
              >
                {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : 
                 trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Usuarios Totales"
          value={stats.totalUsers}
          subValue={`+${stats.newUsersToday} hoy, +${stats.newUsersThisWeek} esta semana`}
          icon={Users}
          trend={stats.newUsersToday > 0 ? 'up' : 'neutral'}
          trendValue={stats.newUsersToday > 0 ? `+${stats.newUsersToday}` : '0'}
        />
        <StatCard
          title="Negocios Activos"
          value={`${stats.activeTenants}/${stats.totalTenants}`}
          subValue={`${Math.round((stats.activeTenants / stats.totalTenants) * 100)}% activos`}
          icon={Building2}
          trend="up"
          trendValue={`${stats.activeTenants}`}
        />
        <StatCard
          title="Reservas Hoy"
          value={stats.totalBookingsToday}
          subValue={`${stats.totalBookingsThisWeek} esta semana`}
          icon={Calendar}
        />
        <StatCard
          title="Ingresos Totales"
          value={`€${stats.totalRevenue.toLocaleString()}`}
          subValue={`€${stats.revenueThisWeek.toLocaleString()} esta semana`}
          icon={DollarSign}
          trend={stats.revenueThisWeek > 0 ? 'up' : 'neutral'}
          trendValue={stats.revenueThisWeek > 0 ? `+€${stats.revenueThisWeek.toLocaleString()}` : '€0'}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Valoración Media"
          value={stats.avgRating.toFixed(1)}
          subValue={`${stats.totalReviews} reseñas totales`}
          icon={Star}
        />
        <StatCard
          title="Favoritos"
          value={stats.totalFavorites}
          subValue="Salones guardados"
          icon={Heart}
        />
        <StatCard
          title="Mensajes"
          value={stats.totalMessages}
          subValue="Conversaciones activas"
          icon={MessageSquare}
        />
        <StatCard
          title="Stories Activos"
          value={stats.activeStoriesNow}
          subValue={`${stats.totalStories} totales`}
          icon={Eye}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Tendencia de Usuarios y Reservas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                    name="Nuevos usuarios"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bookings" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--secondary))' }}
                    name="Reservas"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Ingresos Diarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `€${v}`} />
                  <Tooltip 
                    formatter={(value: number) => [`€${value}`, 'Ingresos']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#22c55e" 
                    fill="#22c55e" 
                    fillOpacity={0.2}
                    strokeWidth={2}
                    name="Ingresos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
