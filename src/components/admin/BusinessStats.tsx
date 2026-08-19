import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { chartColor, readableInk } from "@/lib/chartColors";
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
            color: stylist.color || chartColor(0),
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
      { name: "Efectivo", value: paymentData.cash, color: chartColor(2), icon: Banknote },
      { name: "Tarjeta", value: paymentData.card, color: chartColor(0), icon: CreditCard },
      { name: "Mixto", value: paymentData.mixed, color: chartColor(3), icon: Wallet },
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
    const startDate = period === "week" ? subDays(now, 7) : period === "month" ? startOfMonth(now) : subMonths(now, 3);

    const { data: bookings } = await supabase
      .from("bookings")
      .select("Hora, Fecha")
      .eq("tenant_id", tenantId)
      .eq("status", "confirmed")
      .gte("created_at", startDate.toISOString());

    const hourCounts: Record<string, number> = {};
    const dayCounts: Record<number, number> = {};
    (bookings || []).forEach((b: any) => {
      const hour = b.Hora?.split(":")[0];
      if (hour) hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      if (b.Fecha) {
        const d = new Date(b.Fecha).getDay();
        dayCounts[d] = (dayCounts[d] || 0) + 1;
      }
    });

    const peakData = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: `${hour}:00`, bookings: count }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    setPeakHours(peakData);

    const bestHourEntry = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    const bestDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
    const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    setInsights({
      bestHour: bestHourEntry ? `${bestHourEntry[0]}:00` : null,
      bestDay: bestDayEntry ? dayNames[Number(bestDayEntry[0])] : null,
    });
  };

  const fetchNewToday = async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const [{ data: today }, { count: prevCount }] = await Promise.all([
      supabase.from("bookings").select("canal").eq("tenant_id", tenantId)
        .gte("created_at", todayStart.toISOString()).lt("created_at", tomorrowStart.toISOString()),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId)
        .gte("created_at", yesterdayStart.toISOString()).lt("created_at", todayStart.toISOString()),
    ]);

    const list = today || [];
    const crm = list.filter((b: any) => b.canal === "crm").length;
    const web = list.length - crm;
    setNewToday({ total: list.length, crm, web, previous: prevCount || 0 });
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
      <div className="glow-toolbar">
        {(["week", "month", "quarter"] as Period[]).map((p) => (
          <button
            key={p}
            className={`glow-chip${period === p ? " glow-chip--on" : ""}`}
            onClick={() => setPeriod(p)}
          >
            {p === "week" ? "7 días" : p === "month" ? "Este mes" : "Trimestre"}
          </button>
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
        <div className="glow-card overflow-hidden">
          <div className="glow-card-b">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-glow-ok/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-glow-ok-ink" />
                </div>
                <div>
                  <p className="text-xs text-outline">Objetivo {format(new Date(), "MMMM", { locale: es })}</p>
                  <p className="font-semibold">{formatCurrency(monthlyGoal.revenue)} <span className="text-outline font-normal">/ {formatCurrency(monthlyGoal.goal)}</span></p>
                </div>
              </div>
              <Badge variant={monthlyGoal.revenue >= monthlyGoal.goal ? "default" : "secondary"} className={monthlyGoal.revenue >= monthlyGoal.goal ? "bg-glow-ok" : ""}>
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
                    ? "bg-gradient-to-r from-glow-ok to-glow-ok"
                    : "bg-gradient-to-r from-primary to-glow-accent"
                )}
              />
            </div>
            {monthlyGoal.projected > 0 && (
              <p className="text-xs text-outline mt-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Proyección: {formatCurrency(monthlyGoal.projected)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Citas nuevas hoy — destacado */}
      <div className="glow-card overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-glow-accent/5">
        <div className="glow-card-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-outline">Citas nuevas hoy</p>
                <p className="font-bold text-2xl leading-tight">{newToday.total}</p>
              </div>
            </div>
            {newToday.previous > 0 && (
              <Badge variant="outline" className={cn(
                "text-[10px]",
                newToday.total >= newToday.previous ? "text-glow-ok-ink border-glow-ok/30" : "text-glow-danger-ink border-glow-danger/30"
              )}>
                {newToday.total >= newToday.previous ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                vs ayer ({newToday.previous})
              </Badge>
            )}
          </div>
          {newToday.total > 0 ? (
            <>
              <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(newToday.crm / newToday.total) * 100}%` }} transition={{ duration: 0.6 }} className="bg-glow-brand" />
                <motion.div initial={{ width: 0 }} animate={{ width: `${(newToday.web / newToday.total) * 100}%` }} transition={{ duration: 0.6, delay: 0.1 }} className="bg-glow-warn" />
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-glow-brand" /> Admin (CRM) · <strong>{newToday.crm}</strong></span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-glow-warn" /> Web · <strong>{newToday.web}</strong></span>
              </div>
            </>
          ) : (
            <p className="text-xs text-outline">Aún no se han creado citas hoy.</p>
          )}
        </div>
      </div>

      {/* Reservas: cancelación + canal */}
      {bookingStats.total > 0 && (
        <div className="glow-card">
          <div className="glow-card-b">
            <div className="flex items-center justify-between text-sm">
              <span className="text-outline">Tasa de cancelación</span>
              <span className={cn(
                "font-semibold",
                bookingStats.cancelled / bookingStats.total > 0.15 ? "text-glow-danger-ink" : "text-glow-ok-ink"
              )}>
                {((bookingStats.cancelled / bookingStats.total) * 100).toFixed(1)}%
                <span className="text-xs text-outline font-normal ml-1">({bookingStats.cancelled}/{bookingStats.total})</span>
              </span>
            </div>
            <div>
              <div className="flex justify-between text-xs text-outline mb-1">
                <span>Online vs CRM</span>
                <span>{bookingStats.channels.web} web · {bookingStats.channels.crm} crm</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                <div className="bg-glow-brand" style={{ width: `${(bookingStats.channels.crm / bookingStats.total) * 100}%` }} />
                <div className="bg-glow-warn" style={{ width: `${(bookingStats.channels.web / bookingStats.total) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Chart */}
      {revenueData.length > 0 && (
        <div className="glow-card">
          <div className="glow-card-h"><div>
            <h3>
              <TrendingUp className="h-4 w-4 text-primary" />
              Evolución de ingresos
            </h3>
          </div></div>
          <div className="glow-card-b">
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
                  <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), "d MMM", { locale: es })} fontSize={10} tickLine={false} />
                  <YAxis tickFormatter={(v) => formatCompact(v)} fontSize={10} tickLine={false} axisLine={false} width={50} />
                  <Tooltip content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="glow-card glow-card--pad" style={{ boxShadow: "var(--glow-e2)" }}>
                        <p className="text-xs text-outline mb-1">{format(new Date(label), "d MMMM yyyy", { locale: es })}</p>
                        <p className="font-semibold">{formatCurrency(payload[0].value as number)}</p>
                      </div>
                    ) : null
                  } />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glow-card">
          <div className="glow-card-h"><div>
            <h3><CreditCard className="h-4 w-4" /> Métodos de pago</h3>
          </div></div>
          <div className="glow-card-b">
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
                        <span className="text-outline">{formatCurrency(pm.value)} ({percent.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 0.5 }} className="h-full rounded-full" style={{ backgroundColor: pm.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-outline text-center py-6">Sin datos</p>
            )}
          </div>
        </div>

        <div className="glow-card">
          <div className="glow-card-h"><div>
            <h3><BarChart3 className="h-4 w-4" /> Resumen rápido</h3>
          </div></div>
          <div className="glow-card-b">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-glow-accent/5">
                <div className="flex items-center gap-2 mb-1"><Gift className="h-4 w-4 text-glow-accent-ink" /><span className="text-xs text-outline">Propinas</span></div>
                <p className="font-bold text-glow-accent-ink">{formatCurrency(totals.tips)}</p>
              </div>
              <div className="p-3 rounded-xl bg-glow-warn/5">
                <div className="flex items-center gap-2 mb-1"><TrendingDown className="h-4 w-4 text-glow-warn-ink" /><span className="text-xs text-outline">Descuentos</span></div>
                <p className="font-bold text-glow-warn-ink">-{formatCurrency(totals.discounts)}</p>
              </div>
              <div className="p-3 rounded-xl bg-glow-brand/5">
                <div className="flex items-center gap-2 mb-1"><Repeat className="h-4 w-4 text-glow-brand-ink" /><span className="text-xs text-outline">Transacciones</span></div>
                <p className="font-bold text-glow-brand-ink">{totals.transactions}</p>
              </div>
              <div className="p-3 rounded-xl bg-glow-accent/5">
                <div className="flex items-center gap-2 mb-1"><Activity className="h-4 w-4 text-glow-accent-ink" /><span className="text-xs text-outline">Media/día</span></div>
                <p className="font-bold text-glow-accent-ink">{formatCurrency(revenueData.length > 0 ? totals.revenue / revenueData.length : 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Equipo: ingresos por estilista (pie + ranking unificado) */}
      {stylistStats.length > 0 && (
        <div className="glow-card">
          <div className="glow-card-h"><div>
            <h3><Users className="h-4 w-4 text-glow-accent-ink" /> Equipo · ingresos por estilista</h3>
          </div></div>
          <div className="glow-card-b">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="h-[200px] w-full md:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {stylistStats.map((s, i) => (
                        <linearGradient key={s.id} id={`gradient-${s.id}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={s.color || chartColor(i)} stopOpacity={1} />
                          <stop offset="100%" stopColor={s.color || chartColor(i)} stopOpacity={0.7} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie data={stylistStats} dataKey="revenue" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                      {stylistStats.map((s, i) => (
                        <Cell key={s.id} fill={`url(#gradient-${s.id})`} className="drop-shadow-sm" />
                      ))}
                    </Pie>
                    <Tooltip content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="bg-background/95 backdrop-blur border rounded-xl p-3 shadow-xl">
                          <p className="font-semibold">{payload[0].payload.name}</p>
                          <p className="text-lg font-bold">{formatCurrency(payload[0].value as number)}</p>
                          <p className="text-xs text-outline">{payload[0].payload.transactions} transacciones</p>
                        </div>
                      ) : null
                    } />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 space-y-2">
                {stylistStats.map((s, i) => {
                  const totalRevenue = stylistStats.reduce((sum, st) => sum + st.revenue, 0);
                  const percent = totalRevenue > 0 ? (s.revenue / totalRevenue) * 100 : 0;
                  return (
                    <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs", i === 0 && "ring-2 ring-glow-warn/30 ring-offset-1")} style={{ backgroundColor: s.color || chartColor(i) }}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-tight">{s.name}</p>
                          <p className="text-[10px] text-outline">{s.transactions} tx · {s.services} servicios</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCurrency(s.revenue)}</p>
                        <p className="text-[10px] text-outline">{percent.toFixed(0)}%{s.tips > 0 && ` · +${formatCurrency(s.tips)} propinas`}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top servicios */}
      {topServices.length > 0 && (
        <div className="glow-card">
          <div className="glow-card-h"><div>
            <h3><Scissors className="h-4 w-4" /> Top servicios</h3>
          </div></div>
          <div className="glow-card-b">
            <div className="space-y-2">
              {topServices.map((svc, i) => {
                const maxRev = topServices[0].revenue || 1;
                const percent = (svc.revenue / maxRev) * 100;
                return (
                  <div key={svc.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: chartColor(i), color: readableInk(chartColor(i)) }}>
                          {i + 1}
                        </div>
                        <span className="font-medium truncate">{svc.name}</span>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="font-semibold">{formatCurrency(svc.revenue)}</span>
                        <span className="text-outline ml-1">· {svc.count}x</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 0.5, delay: i * 0.05 }} className="h-full rounded-full" style={{ backgroundColor: chartColor(i) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Clientes — KPIs en línea */}
      <div className="glow-card">
        <div className="glow-card-h"><div>
          <h3><UserPlus className="h-4 w-4" /> Clientes</h3>
        </div></div>
        <div className="glow-card-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniKPI icon={Users} label="Totales" value={clientMetrics.total.toString()} color="text-glow-brand-ink" bg="bg-glow-brand/5" />
            <MiniKPI icon={UserPlus} label="Nuevos este mes" value={clientMetrics.new.toString()} color="text-glow-ok-ink" bg="bg-glow-ok/5" />
            <MiniKPI icon={Repeat} label="Recurrentes" value={clientMetrics.returning.toString()} color="text-glow-accent-ink" bg="bg-glow-accent/5" />
            <MiniKPI icon={TrendingUp} label="Retención" value={`${clientMetrics.retentionRate.toFixed(0)}%`} color="text-glow-warn-ink" bg="bg-glow-warn/5" />
          </div>
        </div>
      </div>

      {/* Horas pico + insight */}
      {peakHours.length > 0 && (
        <div className="glow-card">
          <div className="glow-card-h"><div>
            <h3><Clock className="h-4 w-4" /> Horas pico</h3>
          </div></div>
          <div className="glow-card-b">
            {(insights.bestDay || insights.bestHour) && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-primary/10 to-glow-accent/10 text-xs">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span>
                  {insights.bestDay && <>Tu mejor día: <strong className="capitalize">{insights.bestDay}</strong></>}
                  {insights.bestDay && insights.bestHour && " · "}
                  {insights.bestHour && <>Hora estrella: <strong>{insights.bestHour}</strong></>}
                </span>
              </div>
            )}
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHours}>
                  <XAxis dataKey="hour" fontSize={10} tickLine={false} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} width={30} />
                  <Tooltip content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="bg-background/95 backdrop-blur border rounded-lg p-2 shadow-lg text-xs">
                        <p className="font-semibold">{payload[0].payload.hour}</p>
                        <p className="text-outline">{payload[0].value} reservas</p>
                      </div>
                    ) : null
                  } />
                  <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
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
    violet: "bg-glow-accent/10 text-glow-accent-ink",
    blue: "bg-glow-brand/10 text-glow-brand-ink",
    amber: "bg-glow-warn/10 text-glow-warn-ink",
    green: "bg-glow-ok/10 text-glow-ok-ink",
    pink: "bg-glow-accent/10 text-glow-accent-ink",
  };

  return (
    <div className="glow-card">
      <div className="glow-card-b">
        <div className="flex items-start justify-between mb-2">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", colorClasses[color])}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          {change !== undefined && change !== 0 && (
            <Badge variant="outline" className={cn("text-[10px] px-1.5", change > 0 ? "text-glow-ok-ink border-glow-ok/30" : "text-glow-danger-ink border-glow-danger/30")}>
              {change > 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
              {Math.abs(change)}%
            </Badge>
          )}
        </div>
        <p className="text-lg font-bold truncate">
          {value}
          {suffix && <span className="text-sm text-outline font-normal">{suffix}</span>}
        </p>
        <p className="text-xs text-outline">{title}</p>
      </div>
    </div>
  );
}

function MiniKPI({ icon: Icon, label, value, color, bg }: { icon: React.ElementType; label: string; value: string; color: string; bg: string }) {
  return (
    <div className={cn("p-3 rounded-xl text-center", bg)}>
      <Icon className={cn("h-5 w-5 mx-auto mb-1", color)} />
      <p className="text-xl font-bold leading-tight">{value}</p>
      <p className="text-[10px] text-outline">{label}</p>
    </div>
  );
}

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="glow-empty">
      <div className="glow-empty-ic"><BarChart3 style={{ width: 24, height: 24 }} /></div>
      <h4>Sin datos</h4>
      <p>{message}</p>
    </div>
  );
}
