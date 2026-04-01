import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  TrendingUp, Building2, Calendar, Users, Crown
} from "lucide-react";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";

interface ChannelData {
  name: string;
  value: number;
  color: string;
}

interface TopTenant {
  id: string;
  name: string;
  logo_url: string | null;
  bookings: number;
  revenue: number;
  reviews: number;
}

interface PlanDistribution {
  plan: string;
  count: number;
  color: string;
}

export const PlatformAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [channelData, setChannelData] = useState<ChannelData[]>([]);
  const [topTenants, setTopTenants] = useState<TopTenant[]>([]);
  const [planDistribution, setPlanDistribution] = useState<PlanDistribution[]>([]);
  const [weeklyBookings, setWeeklyBookings] = useState<{day: string; bookings: number}[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch bookings by channel
      const { data: bookings } = await supabase
        .from('bookings')
        .select('canal');

      const channelCounts: Record<string, number> = {};
      bookings?.forEach(b => {
        const channel = b.canal || 'web';
        channelCounts[channel] = (channelCounts[channel] || 0) + 1;
      });

      const channelColors: Record<string, string> = {
        web: '#8B5CF6',
        whatsapp: '#22c55e',
        manual: '#f59e0b',
        phone: '#3b82f6'
      };

      const channelLabels: Record<string, string> = {
        web: 'Web',
        whatsapp: 'WhatsApp',
        manual: 'Manual',
        phone: 'Teléfono'
      };

      setChannelData(
        Object.entries(channelCounts).map(([key, value]) => ({
          name: channelLabels[key] || key,
          value,
          color: channelColors[key] || '#6b7280'
        }))
      );

      // Fetch plan distribution
      const { data: tenants } = await supabase
        .from('tenants')
        .select('subscription_plan');

      const planCounts: Record<string, number> = {};
      tenants?.forEach(t => {
        const plan = t.subscription_plan || 'basic';
        planCounts[plan] = (planCounts[plan] || 0) + 1;
      });

      const planColors: Record<string, string> = {
        basic: '#6b7280',
        professional: '#8B5CF6',
        enterprise: '#f59e0b'
      };

      const planLabels: Record<string, string> = {
        basic: 'Básico',
        professional: 'Profesional',
        enterprise: 'Enterprise'
      };

      setPlanDistribution(
        Object.entries(planCounts).map(([key, value]) => ({
          plan: planLabels[key] || key,
          count: value,
          color: planColors[key] || '#6b7280'
        }))
      );

      // Fetch top tenants with stats
      const { data: allTenants } = await supabase
        .from('tenants')
        .select('id, name, logo_url')
        .eq('is_active', true);

      const tenantStats = await Promise.all(
        (allTenants || []).slice(0, 20).map(async (tenant) => {
          const [bookingsRes, revenueRes, reviewsRes] = await Promise.all([
            supabase.from('bookings').select('id', { count: 'exact', head: true })
              .eq('tenant_id', tenant.id),
            supabase.from('transactions').select('total')
              .eq('tenant_id', tenant.id)
              .eq('voided', false),
            supabase.from('reviews').select('id', { count: 'exact', head: true })
              .eq('tenant_id', tenant.id)
          ]);

          return {
            ...tenant,
            bookings: bookingsRes.count || 0,
            revenue: revenueRes.data?.reduce((sum, t) => sum + (t.total || 0), 0) || 0,
            reviews: reviewsRes.count || 0
          };
        })
      );

      setTopTenants(
        tenantStats
          .sort((a, b) => b.bookings - a.bookings)
          .slice(0, 10)
      );

      // Weekly bookings
      const today = new Date();
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const day = subDays(today, i);
        const { count } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('Fecha', format(day, 'yyyy-MM-dd'));
        
        weeklyData.push({
          day: format(day, 'EEE', { locale: es }),
          bookings: count || 0
        });
      }
      setWeeklyBookings(weeklyData);

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card/40 backdrop-blur-xl border-white/[0.08]">
            <CardHeader className="p-3.5">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="p-3.5 pt-0">
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {/* Bookings by Channel */}
        <Card className="bg-card/40 backdrop-blur-xl border-white/[0.08]">
          <CardHeader className="p-3.5 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              Reservas por Canal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    innerRadius={35}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="bg-card/40 backdrop-blur-xl border-white/[0.08]">
          <CardHeader className="p-3.5 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-primary" />
              Distribución de Planes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ plan, percent }) => `${plan} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    innerRadius={35}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="plan"
                    paddingAngle={2}
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Bookings */}
        <Card className="bg-card/40 backdrop-blur-xl border-white/[0.08]">
          <CardHeader className="p-3.5 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              Reservas Últimos 7 Días
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyBookings} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="bookings" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    name="Reservas"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Tenants */}
        <Card className="bg-card/40 backdrop-blur-xl border-white/[0.08]">
          <CardHeader className="p-3.5 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Crown className="h-4 w-4 text-yellow-500" />
              Top 10 Negocios
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {topTenants.map((tenant, index) => (
                <div 
                  key={tenant.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs">
                    {index + 1}
                  </div>
                  {tenant.logo_url ? (
                    <img 
                      src={tenant.logo_url} 
                      alt={tenant.name}
                      className="w-9 h-9 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                      {tenant.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{tenant.name}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>{tenant.bookings} res.</span>
                      <span>·</span>
                      <span>€{tenant.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] rounded-lg">{tenant.reviews} ⭐</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
