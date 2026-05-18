import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  subWeeks,
  subMonths,
  getDate,
  getDaysInMonth,
  differenceInDays,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Euro,
  CreditCard,
  Banknote,
  Users,
  Calendar,
  Star,
  Target,
  Scissors,
  Gift,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  PieChartIcon,
  Activity,
  Wallet,
  UserPlus,
  Repeat,
  Award,
} from "lucide-react";

interface BusinessStatsProps {
  tenantId: string;
}

type Period = "week" | "month" | "quarter";

const COLORS = ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#6366F1", "#14B8A6"];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);

const formatCompact = (amount: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);

export function BusinessStats({ tenantId }: BusinessStatsProps) {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");

  // Data states
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [totals, setTotals] = useState({
    revenue: 0,
    previousRevenue: 0,
    transactions: 0,
    previousTransactions: 0,
    avgTicket: 0,
    previousAvgTicket: 0,
    tips: 0,
    discounts: 0,
    newClients: 0,
    returningClients: 0,
  });
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [stylistStats, setStylistStats] = useState<any[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [monthlyGoal, setMonthlyGoal] = useState({ revenue: 0, goal: 0, projected: 0 });
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    previous: 0,
    confirmed: 0,
    cancelled: 0,
    channels: { crm: 0, web: 0 },
  });
  const [avgRating, setAvgRating] = useState(0);
  const [clientMetrics, setClientMetrics] = useState({
    total: 0,
    new: 0,
    returning: 0,
    retentionRate: 0,
  });
  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [newToday, setNewToday] = useState({ total: 0, crm: 0, web: 0, previous: 0 });
  const [insights, setInsights] = useState<{ bestDay: string | null; bestHour: string | null }>({ bestDay: null, bestHour: null });

  useEffect(() => {
    fetchAllStats();
  }, [tenantId, period]);

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRevenueStats(),
        fetchBookingStats(),
        fetchMonthlyGoal(),
        fetchClientMetrics(),
        fetchPeakHours(),
        fetchNewToday(),
      ]);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueStats = async () => {
    const now = new Date();
    let startDate: Date, previousStartDate: Date, previousEndDate: Date;

    switch (period) {
      case "week":
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        previousStartDate = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        previousEndDate = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        break;
      case "month":
        startDate = startOfMonth(now);
        previousStartDate = startOfMonth(subMonths(now, 1));
        previousEndDate = endOfMonth(subMonths(now, 1));
        break;
      case "quarter":
        startDate = subMonths(startOfMonth(now), 2);
        previousStartDate = subMonths(startOfMonth(now), 5);
        previousEndDate = subMonths(endOfMonth(now), 3);
        break;
      default:
        startDate = startOfMonth(now);
        previousStartDate = startOfMonth(subMonths(now, 1));
        previousEndDate = endOfMonth(subMonths(now, 1));
    }

    // Fetch current period transactions
    const { data: currentTx } = await supabase
      .from("transactions")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("voided", false)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    // Fetch previous period transactions
    const { data: previousTx } = await supabase
      .from("transactions")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("voided", false)
      .gte("created_at", previousStartDate.toISOString())
      .lte("created_at", previousEndDate.toISOString());

    // Fetch stylists
    const { data: stylists } = await supabase
      .from("tenant_stylists")
      .select("id, name, color")
      .eq("tenant_id", tenantId);

    const stylistMap = new Map(stylists?.map((s) => [s.id, s]) || []);

    // Process current period
    const dailyData: Record<string, any> = {};
    const stylistData: Record<string, any> = {};
    const serviceData: Record<string, any> = {};
    const paymentData: Record<string, number> = { cash: 0, card: 0, mixed: 0 };
    let tips = 0, discounts = 0;
    const uniqueClients = new Set<string>();

    (currentTx || []).forEach((tx: any) => {
      const dateKey = format(new Date(tx.created_at), "yyyy-MM-dd");
      const total = Number(tx.total) || 0;

      // Daily data
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { date: dateKey, revenue: 0, transactions: 0 };
      }
      dailyData[dateKey].revenue += total;
      dailyData[dateKey].transactions += 1;

      // Payment methods
      paymentData[tx.payment_method as string] = (paymentData[tx.payment_method as string] || 0) + total;

      // Tips & discounts
      tips += Number(tx.tip_amount) || 0;
      discounts += Number(tx.discount) || 0;

      // Track clients
      if (tx.customer_name) uniqueClients.add(tx.customer_name.toLowerCase());

      // Stylist stats
      const stylistId = tx.stylist_id;
      if (stylistId && stylistMap.has(stylistId)) {
        const stylist = stylistMap.get(stylistId)!;
        if (!stylistData[stylistId]) {
          stylistData[stylistId] = {
            id: stylistId,
            name: stylist.name,
            color: stylist.color || COLORS[0],
            revenue: 0,
            transactions: 0,
            tips: 0,
            services: 0,
          };
        }
        stylistData[stylistId].revenue += total;
        stylistData[stylistId].transactions += 1;
        stylistData[stylistId].tips += Number(tx.tip_amount) || 0;
      }

      // Service stats
      const services = tx.services as any[] || [];
      services.forEach((svc: any) => {
        const name = svc.name || "Sin nombre";
        const qty = svc.quantity || 1;
        const svcRevenue = svc.total || (svc.price || 0) * qty;
        
        if (!serviceData[name]) {
          serviceData[name] = { name, count: 0, revenue: 0 };
        }
        serviceData[name].count += qty;
        serviceData[name].revenue += svcRevenue;

        if (stylistId && stylistData[stylistId]) {
          stylistData[stylistId].services += qty;
        }
      });
    });

    // Calculate previous period totals
    const prevRevenue = (previousTx || []).reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);
    const prevTxCount = previousTx?.length || 0;
    const prevAvgTicket = prevTxCount > 0 ? prevRevenue / prevTxCount : 0;

    // Current totals
    const currentRevenue = Object.values(dailyData).reduce((sum: number, d: any) => sum + d.revenue, 0);
    const currentTxCount = currentTx?.length || 0;
    const currentAvgTicket = currentTxCount > 0 ? currentRevenue / currentTxCount : 0;

    setRevenueData(Object.values(dailyData).sort((a: any, b: any) => a.date.localeCompare(b.date)));
    setTotals({
      revenue: currentRevenue,
      previousRevenue: prevRevenue,
      transactions: currentTxCount,
      previousTransactions: prevTxCount,
      avgTicket: currentAvgTicket,
      previousAvgTicket: prevAvgTicket,
      tips,
      discounts,
      newClients: uniqueClients.size,
      returningClients: 0,
    });
    setPaymentMethods([
      { name: "Efectivo", value: paymentData.cash, color: "#10B981", icon: Banknote },
      { name: "Tarjeta", value: paymentData.card, color: "#8B5CF6", icon: CreditCard },
      { name: "Mixto", value: paymentData.mixed, color: "#F59E0B", icon: Wallet },
    ].filter(d => d.value > 0));
    setStylistStats(Object.values(stylistData).sort((a: any, b: any) => b.revenue - a.revenue));
    setTopServices(Object.values(serviceData).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 8));
  };

  const fetchBookingStats = async () => {
    const now = new Date();
    const startDate = period === "week" ? subDays(now, 7) : period === "month" ? startOfMonth(now) : subMonths(now, 3);
    const previousStart = period === "week" ? subDays(now, 14) : period === "month" ? subMonths(startOfMonth(now), 1) : subMonths(now, 6);

    const [{ data: current }, { data: previous }, { data: reviews }] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, status, canal")
        .eq("tenant_id", tenantId)
        .gte("created_at", startDate.toISOString()),
      supabase
        .from("bookings")
        .select("id")
        .eq("tenant_id", tenantId)
        .gte("created_at", previousStart.toISOString())
        .lt("created_at", startDate.toISOString()),
      supabase
        .from("reviews")
        .select("rating")
        .eq("tenant_id", tenantId)
        .eq("approved", true),
    ]);

    const confirmed = (current || []).filter(b => b.status === "confirmed").length;
    const cancelled = (current || []).filter(b => b.status === "cancelled").length;
    const crm = (current || []).filter(b => b.canal === "crm").length;
    const web = (current || []).filter(b => b.canal !== "crm").length;

    setBookingStats({
      total: current?.length || 0,
      previous: previous?.length || 0,
      confirmed,
      cancelled,
      channels: { crm, web },
    });

    const ratings = reviews || [];
    const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;
    setAvgRating(avgRating);
  };

  const fetchMonthlyGoal = async () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const [{ data: goals }, { data: transactions }] = await Promise.all([
      supabase
        .from("monthly_goals")
        .select("revenue_goal")
        .eq("tenant_id", tenantId)
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .maybeSingle(),
      supabase
        .from("transactions")
        .select("total")
        .eq("tenant_id", tenantId)
        .eq("voided", false)
        .gte("created_at", startOfMonth(now).toISOString())
        .lte("created_at", endOfMonth(now).toISOString()),
    ]);

    const goal = (goals as any)?.revenue_goal || 0;
    const revenue = (transactions || []).reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const dayOfMonth = getDate(now);
    const daysInMonth = getDaysInMonth(now);
    const dailyAvg = dayOfMonth > 0 ? revenue / dayOfMonth : 0;
    const projected = dailyAvg * daysInMonth;

    setMonthlyGoal({ revenue, goal, projected });
  };

  const fetchClientMetrics = async () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));

    const { data: clients } = await supabase
      .from("clients")
      .select("id, created_at, total_visits")
      .eq("tenant_id", tenantId);

    const total = clients?.length || 0;
    const newClients = (clients || []).filter(c => new Date(c.created_at) >= monthStart).length;
    const returningClients = (clients || []).filter(c => (c.total_visits || 0) > 1).length;
    const retentionRate = total > 0 ? (returningClients / total) * 100 : 0;

    setClientMetrics({ total, new: newClients, returning: returningClients, retentionRate });
  };

  const fetchPeakHours = async () => {
    const now = new Date();
    const startDate = startOfMonth(now);

    const { data: bookings } = await supabase
      .from("bookings")
      .select("Hora")
      .eq("tenant_id", tenantId)
      .eq("status", "confirmed")
      .gte("created_at", startDate.toISOString());

    const hourCounts: Record<string, number> = {};
    (bookings || []).forEach((b) => {
      const hour = b.Hora.split(":")[0];
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakData = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: `${hour}:00`, bookings: count }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    setPeakHours(peakData);
  };

  const getChangePercent = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const revenueChange = getChangePercent(totals.revenue, totals.previousRevenue);
  const txChange = getChangePercent(totals.transactions, totals.previousTransactions);
  const bookingChange = getChangePercent(bookingStats.total, bookingStats.previous);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-9 w-24" />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Period Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {(["week", "month", "quarter"] as Period[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p)}
            className="shrink-0 h-9"
          >
            {p === "week" ? "7 días" : p === "month" ? "Este mes" : "Trimestre"}
          </Button>
        ))}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Ingresos"
          value={formatCurrency(totals.revenue)}
          change={revenueChange}
          icon={Euro}
          color="primary"
        />
        <MetricCard
          title="Ticket medio"
          value={formatCurrency(totals.avgTicket)}
          change={getChangePercent(totals.avgTicket, totals.previousAvgTicket)}
          icon={Wallet}
          color="violet"
        />
        <MetricCard
          title="Reservas"
          value={bookingStats.total.toString()}
          change={bookingChange}
          icon={Calendar}
          color="blue"
        />
        <MetricCard
          title="Valoración"
          value={avgRating.toFixed(1)}
          suffix="/5"
          icon={Star}
          color="amber"
        />
      </div>

      {/* Monthly Goal Progress */}
      {monthlyGoal.goal > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Objetivo {format(new Date(), "MMMM", { locale: es })}</p>
                  <p className="font-semibold">{formatCurrency(monthlyGoal.revenue)} <span className="text-muted-foreground font-normal">/ {formatCurrency(monthlyGoal.goal)}</span></p>
                </div>
              </div>
              <Badge variant={monthlyGoal.revenue >= monthlyGoal.goal ? "default" : "secondary"} className={monthlyGoal.revenue >= monthlyGoal.goal ? "bg-emerald-500" : ""}>
                {Math.round((monthlyGoal.revenue / monthlyGoal.goal) * 100)}%
              </Badge>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((monthlyGoal.revenue / monthlyGoal.goal) * 100, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  monthlyGoal.revenue >= monthlyGoal.goal
                    ? "bg-gradient-to-r from-emerald-500 to-green-400"
                    : "bg-gradient-to-r from-primary to-violet-400"
                )}
              />
            </div>
            {monthlyGoal.projected > 0 && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Proyección: {formatCurrency(monthlyGoal.projected)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs for detailed stats */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-auto p-1">
          <TabsTrigger value="overview" className="gap-1.5 py-2.5 text-xs">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="stylists" className="gap-1.5 py-2.5 text-xs">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Equipo</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-1.5 py-2.5 text-xs">
            <Scissors className="h-4 w-4" />
            <span className="hidden sm:inline">Servicios</span>
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-1.5 py-2.5 text-xs">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Clientes</span>
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Revenue Chart */}
            {revenueData.length > 0 ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Evolución de ingresos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(d) => format(new Date(d), "d MMM", { locale: es })}
                          fontSize={10}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={(v) => formatCompact(v)}
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          width={50}
                        />
                        <Tooltip
                          content={({ active, payload, label }) =>
                            active && payload?.length ? (
                              <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
                                <p className="text-xs text-muted-foreground mb-1">
                                  {format(new Date(label), "d MMMM yyyy", { locale: es })}
                                </p>
                                <p className="font-semibold">{formatCurrency(payload[0].value as number)}</p>
                              </div>
                            ) : null
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill="url(#revenueGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <EmptyState message="Sin datos de ingresos en este período" />
            )}

            {/* Payment Methods & Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Payment Methods */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Métodos de pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentMethods.length > 0 ? (
                    <div className="space-y-3">
                      {paymentMethods.map((pm) => {
                        const total = paymentMethods.reduce((sum, p) => sum + p.value, 0);
                        const percent = total > 0 ? (pm.value / total) * 100 : 0;
                        return (
                          <div key={pm.name} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pm.color }} />
                                <span className="font-medium">{pm.name}</span>
                              </div>
                              <span className="text-muted-foreground">
                                {formatCurrency(pm.value)} ({percent.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ duration: 0.5 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: pm.color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">Sin datos</p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats Grid */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Resumen rápido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-pink-50 dark:bg-pink-900/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Gift className="h-4 w-4 text-pink-500" />
                        <span className="text-xs text-muted-foreground">Propinas</span>
                      </div>
                      <p className="font-bold text-pink-600 dark:text-pink-400">{formatCurrency(totals.tips)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingDown className="h-4 w-4 text-orange-500" />
                        <span className="text-xs text-muted-foreground">Descuentos</span>
                      </div>
                      <p className="font-bold text-orange-600 dark:text-orange-400">-{formatCurrency(totals.discounts)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-900/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Repeat className="h-4 w-4 text-cyan-500" />
                        <span className="text-xs text-muted-foreground">Transacciones</span>
                      </div>
                      <p className="font-bold text-cyan-600 dark:text-cyan-400">{totals.transactions}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-4 w-4 text-violet-500" />
                        <span className="text-xs text-muted-foreground">Media/día</span>
                      </div>
                      <p className="font-bold text-violet-600 dark:text-violet-400">
                        {formatCurrency(revenueData.length > 0 ? totals.revenue / revenueData.length : 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue by Stylist - Pie Chart */}
            {stylistStats.length > 0 && (
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-violet-500" />
                    Ingresos por estilista
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    {/* Pie Chart */}
                    <div className="h-[200px] w-full md:w-1/2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <defs>
                            {stylistStats.map((s, i) => (
                              <linearGradient key={s.id} id={`gradient-${s.id}`} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor={s.color || COLORS[i % COLORS.length]} stopOpacity={1} />
                                <stop offset="100%" stopColor={s.color || COLORS[i % COLORS.length]} stopOpacity={0.7} />
                              </linearGradient>
                            ))}
                          </defs>
                          <Pie
                            data={stylistStats}
                            dataKey="revenue"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={3}
                            strokeWidth={0}
                          >
                            {stylistStats.map((s, i) => (
                              <Cell 
                                key={s.id} 
                                fill={`url(#gradient-${s.id})`}
                                className="drop-shadow-sm"
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) =>
                              active && payload?.length ? (
                                <div className="bg-background/95 backdrop-blur border rounded-xl p-3 shadow-xl">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: payload[0].payload.color || COLORS[0] }} 
                                    />
                                    <p className="font-semibold">{payload[0].payload.name}</p>
                                  </div>
                                  <p className="text-lg font-bold">{formatCurrency(payload[0].value as number)}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {payload[0].payload.transactions} transacciones
                                  </p>
                                </div>
                              ) : null
                            }
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Legend with stats */}
                    <div className="w-full md:w-1/2 space-y-2">
                      {stylistStats.map((s, i) => {
                        const totalRevenue = stylistStats.reduce((sum, st) => sum + st.revenue, 0);
                        const percent = totalRevenue > 0 ? (s.revenue / totalRevenue) * 100 : 0;
                        return (
                          <motion.div
                            key={s.id}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div 
                                className="w-4 h-4 rounded-full shadow-sm" 
                                style={{ backgroundColor: s.color || COLORS[i % COLORS.length] }} 
                              />
                              <span className="text-sm font-medium">{s.name}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold">{formatCurrency(s.revenue)}</p>
                              <p className="text-[10px] text-muted-foreground">{percent.toFixed(0)}%</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Peak Hours */}
            {peakHours.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horas pico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={peakHours}>
                        <XAxis dataKey="hour" fontSize={10} tickLine={false} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} width={30} />
                        <Tooltip
                          content={({ active, payload }) =>
                            active && payload?.length ? (
                              <div className="bg-background/95 backdrop-blur border rounded-lg p-2 shadow-lg text-xs">
                                <p className="font-semibold">{payload[0].payload.hour}</p>
                                <p className="text-muted-foreground">{payload[0].value} reservas</p>
                              </div>
                            ) : null
                          }
                        />
                        <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="stylists" className="mt-4 space-y-4">
            {stylistStats.length > 0 ? (
              <>
                {/* Ranking */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-500" />
                      Ranking por ingresos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stylistStats.map((s, i) => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
                              i === 0 && "ring-2 ring-amber-400 ring-offset-2"
                            )}
                            style={{ backgroundColor: s.color }}
                          >
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-medium">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.transactions} transacciones • {s.services} servicios</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(s.revenue)}</p>
                          {s.tips > 0 && (
                            <p className="text-xs text-pink-500">+{formatCurrency(s.tips)} propinas</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>

                {/* Distribution Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Distribución de ingresos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stylistStats}
                            dataKey="revenue"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                          >
                            {stylistStats.map((s, i) => (
                              <Cell key={s.id} fill={s.color || COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                      {stylistStats.slice(0, 4).map((s) => (
                        <div key={s.id} className="flex items-center gap-1.5 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="text-muted-foreground">{s.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <EmptyState message="Sin datos de estilistas en este período" />
            )}
          </TabsContent>

          <TabsContent value="services" className="mt-4 space-y-4">
            {topServices.length > 0 ? (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Scissors className="h-4 w-4" />
                      Top servicios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topServices} layout="vertical">
                          <XAxis type="number" tickFormatter={(v) => formatCompact(v)} fontSize={10} />
                          <YAxis type="category" dataKey="name" width={100} fontSize={11} tickLine={false} />
                          <Tooltip formatter={(v: number) => formatCurrency(v)} />
                          <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                  {topServices.slice(0, 4).map((svc, i) => (
                    <Card key={svc.name}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          >
                            {i + 1}
                          </div>
                          <p className="text-sm font-medium truncate flex-1">{svc.name}</p>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{svc.count}x realizados</span>
                          <span className="font-semibold">{formatCurrency(svc.revenue)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState message="Sin datos de servicios en este período" />
            )}
          </TabsContent>

          <TabsContent value="clients" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold">{clientMetrics.total}</p>
                  <p className="text-xs text-muted-foreground">Clientes totales</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2">
                    <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-2xl font-bold">{clientMetrics.new}</p>
                  <p className="text-xs text-muted-foreground">Nuevos este mes</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-2">
                    <Repeat className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <p className="text-2xl font-bold">{clientMetrics.returning}</p>
                  <p className="text-xs text-muted-foreground">Recurrentes</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold">{clientMetrics.retentionRate.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Retención</p>
                </CardContent>
              </Card>
            </div>

            {/* Booking Channels */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Origen de reservas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-500" />
                      <span>Panel Admin (CRM)</span>
                    </div>
                    <span className="font-medium">{bookingStats.channels.crm}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{
                        width: `${bookingStats.total > 0 ? (bookingStats.channels.crm / bookingStats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span>Web / App</span>
                    </div>
                    <span className="font-medium">{bookingStats.channels.web}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{
                        width: `${bookingStats.total > 0 ? (bookingStats.channels.web / bookingStats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  title,
  value,
  change,
  suffix,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  change?: number;
  suffix?: string;
  icon: React.ElementType;
  color: "primary" | "violet" | "blue" | "amber" | "green" | "pink";
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    pink: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
  };

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", colorClasses[color])}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          {change !== undefined && change !== 0 && (
            <Badge variant="outline" className={cn("text-[10px] px-1.5", change > 0 ? "text-green-600 border-green-200" : "text-red-600 border-red-200")}>
              {change > 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
              {Math.abs(change)}%
            </Badge>
          )}
        </div>
        <p className="text-lg font-bold truncate">
          {value}
          {suffix && <span className="text-sm text-muted-foreground font-normal">{suffix}</span>}
        </p>
        <p className="text-xs text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  );
}

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
