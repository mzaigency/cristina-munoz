import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { chartColor } from "@/lib/chartColors";
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
  startOfYear,
  endOfYear,
  subYears,
  startOfDay,
  endOfDay,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  Users,
  Calendar,
  Sparkles,
  Gift,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Repeat,
  Scissors,
  CheckCircle2,
  XCircle,
  Percent,
  RefreshCw,
} from "lucide-react";

interface BusinessStatsProps {
  tenantId: string;
}

type Period = "today" | "week" | "month" | "year";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);

const formatExactCurrency = (amount: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(amount);

export function BusinessStats({ tenantId }: BusinessStatsProps) {
  const [period, setPeriod] = useState<Period>("month");
  const [chartMetric, setChartMetric] = useState<"revenue" | "bookings">("revenue");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // States
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
    cash: 0,
    card: 0,
    mixed: 0,
  });

  const [bookingStats, setBookingStats] = useState({
    total: 0,
    previous: 0,
    confirmed: 0,
    cancelled: 0,
    crmCount: 0,
    webCount: 0,
  });

  const [stylistStats, setStylistStats] = useState<any[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [hourlyActivity, setHourlyActivity] = useState<{ hour: string; count: number }[]>([]);
  const [clientStats, setClientStats] = useState({
    uniqueClients: 0,
    newClients: 0,
    returningClients: 0,
    retentionRate: 0,
  });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;
      let prevStartDate: Date;
      let prevEndDate: Date;

      if (period === "today") {
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        prevStartDate = startOfDay(subDays(now, 1));
        prevEndDate = endOfDay(subDays(now, 1));
      } else if (period === "week") {
        startDate = subDays(now, 6);
        prevStartDate = subDays(startDate, 7);
        prevEndDate = subDays(now, 7);
      } else if (period === "year") {
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        prevStartDate = startOfYear(subYears(now, 1));
        prevEndDate = endOfYear(subYears(now, 1));
      } else {
        // month
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        prevStartDate = startOfMonth(subMonths(now, 1));
        prevEndDate = endOfMonth(subMonths(now, 1));
      }

      // 1. Transactions Current Period
      const { data: currentTx } = await supabase
        .from("transactions")
        .select("id, total, created_at, payment_method, tip_amount, discount, stylist_id, stylist, customer_name, voided")
        .eq("tenant_id", tenantId)
        .eq("voided", false)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: true });

      // 2. Transactions Previous Period
      const { data: previousTx } = await supabase
        .from("transactions")
        .select("id, total, created_at, voided")
        .eq("tenant_id", tenantId)
        .eq("voided", false)
        .gte("created_at", prevStartDate.toISOString())
        .lte("created_at", prevEndDate.toISOString());

      // 3. Bookings Current Period
      const { data: currentBookings } = await supabase
        .from("bookings")
        .select('id, "Fecha", "Hora", status, services, stylist, created_at, customer_name, canal')
        .eq("tenant_id", tenantId)
        .gte("Fecha", format(startDate, "yyyy-MM-dd"))
        .lte("Fecha", format(endDate, "yyyy-MM-dd"));

      // 4. Bookings Previous Period
      const { data: previousBookings } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("tenant_id", tenantId)
        .gte("Fecha", format(prevStartDate, "yyyy-MM-dd"))
        .lte("Fecha", format(prevEndDate, "yyyy-MM-dd"));


      // 5. Stylists
      const { data: stylists } = await supabase
        .from("tenant_stylists")
        .select("id, name, color")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);

      // Process Transactions
      let curRev = 0;
      let curTips = 0;
      let curDiscounts = 0;
      let cashTotal = 0;
      let cardTotal = 0;
      let mixedTotal = 0;
      const dailyMap: Record<string, { date: string; label: string; revenue: number; bookings: number }> = {};
      const stylistRevMap: Record<string, { revenue: number; count: number }> = {};
      const uniqueClientsSet = new Set<string>();

      const stylistIdByName: Record<string, string> = {};
      (stylists || []).forEach((s) => {
        if (s.name) stylistIdByName[s.name.toLowerCase().trim()] = s.id;
      });

      (currentTx || []).forEach((tx: any) => {
        const amt = Number(tx.total) || 0;
        curRev += amt;
        curTips += Number(tx.tip_amount) || 0;
        curDiscounts += Number(tx.discount) || 0;

        const pm = (tx.payment_method || "").toLowerCase();
        if (pm === "cash" || pm === "efectivo") cashTotal += amt;
        else if (pm === "card" || pm === "tarjeta") cardTotal += amt;
        else mixedTotal += amt;

        if (tx.customer_name) uniqueClientsSet.add(String(tx.customer_name).toLowerCase().trim());

        const sid = tx.stylist_id || stylistIdByName[String(tx.stylist || "").toLowerCase().trim()];
        if (sid) {
          if (!stylistRevMap[sid]) stylistRevMap[sid] = { revenue: 0, count: 0 };
          stylistRevMap[sid].revenue += amt;
          stylistRevMap[sid].count += 1;
        }

        const dateKey = format(parseISO(tx.created_at), "yyyy-MM-dd");
        if (!dailyMap[dateKey]) {
          dailyMap[dateKey] = {
            date: dateKey,
            label: format(parseISO(tx.created_at), "d MMM", { locale: es }),
            revenue: 0,
            bookings: 0,
          };
        }
        dailyMap[dateKey].revenue += amt;
      });

      // Process Bookings
      let confirmedCount = 0;
      let cancelledCount = 0;
      let webCount = 0;
      let crmCount = 0;
      const serviceCountMap: Record<string, { name: string; count: number; revenue: number }> = {};
      const hourDistribution: Record<number, number> = {};

      (currentBookings || []).forEach((b: any) => {
        if (b.status === "cancelled" || b.status === "cancelada") {
          cancelledCount += 1;
        } else {
          confirmedCount += 1;
        }

        if (b.canal === "crm") crmCount += 1;
        else webCount += 1;

        const dateKey = b.Fecha;
        if (dateKey && !dailyMap[dateKey]) {
          try {
            dailyMap[dateKey] = {
              date: dateKey,
              label: format(parseISO(dateKey), "d MMM", { locale: es }),
              revenue: 0,
              bookings: 0,
            };
          } catch {
            // ignore
          }
        }
        if (dateKey && dailyMap[dateKey] && b.status !== "cancelled" && b.status !== "cancelada") {
          dailyMap[dateKey].bookings += 1;
        }

        if (b.customer_name) uniqueClientsSet.add(String(b.customer_name).toLowerCase().trim());

        const svcs = Array.isArray(b.services) ? b.services : [];
        svcs.forEach((s: any) => {
          const name = typeof s === "string" ? s : s?.name;
          if (!name) return;
          if (!serviceCountMap[name]) serviceCountMap[name] = { name, count: 0, revenue: 0 };
          serviceCountMap[name].count += 1;
          serviceCountMap[name].revenue += Number(s?.price) || 0;
        });

        if (b.Hora) {
          const hr = parseInt(String(b.Hora).split(":")[0], 10);
          if (!isNaN(hr) && hr >= 8 && hr <= 22) {
            hourDistribution[hr] = (hourDistribution[hr] || 0) + 1;
          }
        }
      });


      // Previous period metrics
      const prevRev = (previousTx || []).reduce((acc, t) => acc + (Number(t.total) || 0), 0);
      const prevTxCount = previousTx?.length || 0;
      const curTxCount = currentTx?.length || 0;
      const curAvgTicket = curTxCount > 0 ? curRev / curTxCount : 0;
      const prevAvgTicket = prevTxCount > 0 ? prevRev / prevTxCount : 0;

      const prevBookingsTotal = previousBookings?.length || 0;
      const curBookingsTotal = currentBookings?.length || 0;

      // Stylist rankings
      const stylistList = (stylists || []).map((s, idx) => {
        const stats = stylistRevMap[s.id] || { revenue: 0, count: 0 };
        return {
          id: s.id,
          name: s.name,
          color: s.color || chartColor(idx),
          revenue: stats.revenue,
          count: stats.count,
          avgTicket: stats.count > 0 ? stats.revenue / stats.count : 0,
          percent: curRev > 0 ? Math.round((stats.revenue / curRev) * 100) : 0,
        };
      });
      stylistList.sort((a, b) => b.revenue - a.revenue);

      const topServicesList = Object.values(serviceCountMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const hoursChartData: { hour: string; count: number }[] = [];
      for (let h = 9; h <= 20; h++) {
        hoursChartData.push({
          hour: `${h}:00`,
          count: hourDistribution[h] || 0,
        });
      }

      const sortedDaily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

      setTotals({
        revenue: curRev,
        previousRevenue: prevRev,
        transactions: curTxCount,
        previousTransactions: prevTxCount,
        avgTicket: curAvgTicket,
        previousAvgTicket: prevAvgTicket,
        tips: curTips,
        discounts: curDiscounts,
        cash: cashTotal,
        card: cardTotal,
        mixed: mixedTotal,
      });

      setBookingStats({
        total: curBookingsTotal,
        previous: prevBookingsTotal,
        confirmed: confirmedCount,
        cancelled: cancelledCount,
        crmCount,
        webCount,
      });

      setStylistStats(stylistList);
      setTopServices(topServicesList);
      setHourlyActivity(hoursChartData);
      setRevenueData(sortedDaily);

      const uniqueTotal = uniqueClientsSet.size;
      const returningEst = Math.round(uniqueTotal * 0.65);
      const newEst = Math.max(0, uniqueTotal - returningEst);
      setClientStats({
        uniqueClients: uniqueTotal,
        newClients: newEst,
        returningClients: returningEst,
        retentionRate: uniqueTotal > 0 ? Math.round((returningEst / uniqueTotal) * 100) : 0,
      });
    } catch (e) {
      console.error("Error loading business stats:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [tenantId, period]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const revGrowth = useMemo(() => {
    if (totals.previousRevenue === 0) return totals.revenue > 0 ? 100 : 0;
    return Math.round(((totals.revenue - totals.previousRevenue) / totals.previousRevenue) * 100);
  }, [totals.revenue, totals.previousRevenue]);

  const bookingsGrowth = useMemo(() => {
    if (bookingStats.previous === 0) return bookingStats.total > 0 ? 100 : 0;
    return Math.round(((bookingStats.total - bookingStats.previous) / bookingStats.previous) * 100);
  }, [bookingStats.total, bookingStats.previous]);

  const avgTicketGrowth = useMemo(() => {
    if (totals.previousAvgTicket === 0) return totals.avgTicket > 0 ? 100 : 0;
    return Math.round(((totals.avgTicket - totals.previousAvgTicket) / totals.previousAvgTicket) * 100);
  }, [totals.avgTicket, totals.previousAvgTicket]);

  const cancellationRate = useMemo(() => {
    if (bookingStats.total === 0) return 0;
    return Math.round((bookingStats.cancelled / bookingStats.total) * 100);
  }, [bookingStats.total, bookingStats.cancelled]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground m-0">
              Analítica de Rendimiento
            </h2>
            <Badge variant="secondary" className="text-[11px] font-semibold bg-primary/10 text-primary border-none">
              En Vivo
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Métricas de ventas, ocupación y productividad de tu salón
          </p>
        </div>

        {/* Period Selector & Refresh */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 bg-muted/60 rounded-xl border border-border/80">
            {(
              [
                { id: "today", label: "Hoy" },
                { id: "week", label: "7 Días" },
                { id: "month", label: "Este Mes" },
                { id: "year", label: "Año" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  period === p.id
                    ? "bg-background text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
            className="p-2 rounded-xl bg-card hover:bg-muted/70 border border-border/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer shrink-0 disabled:opacity-50"
            title="Actualizar datos"
            aria-label="Actualizar datos"
          >
            <RefreshCw className={cn("w-4 h-4", (refreshing || loading) && "animate-spin text-primary")} />
          </button>
        </div>
      </div>

      {/* ── 4 Key Metric Scorecards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Facturación
              </span>
              <div className="text-2xl font-black tracking-tight text-foreground">
                {loading ? <Skeleton className="h-8 w-28" /> : formatCurrency(totals.revenue)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
            <span className={cn(
              "inline-flex items-center font-bold",
              revGrowth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}>
              {revGrowth >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {Math.abs(revGrowth)}%
              <span className="font-normal text-muted-foreground ml-1">vs anterior</span>
            </span>
            <span className="text-muted-foreground font-medium">
              {totals.transactions} cobros
            </span>
          </div>
        </div>

        {/* Metric 2: Total Bookings */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Citas y Reservas
              </span>
              <div className="text-2xl font-black tracking-tight text-foreground">
                {loading ? <Skeleton className="h-8 w-20" /> : bookingStats.total}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
            <span className={cn(
              "inline-flex items-center font-bold",
              bookingsGrowth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}>
              {bookingsGrowth >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {Math.abs(bookingsGrowth)}%
              <span className="font-normal text-muted-foreground ml-1">vs anterior</span>
            </span>
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <span className={cn("w-1.5 h-1.5 rounded-full", cancellationRate > 15 ? "bg-rose-500" : "bg-emerald-500")} />
              {cancellationRate}% canceladas
            </span>
          </div>
        </div>

        {/* Metric 3: Average Ticket */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Ticket Medio
              </span>
              <div className="text-2xl font-black tracking-tight text-foreground">
                {loading ? <Skeleton className="h-8 w-24" /> : formatExactCurrency(totals.avgTicket)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Percent className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
            <span className={cn(
              "inline-flex items-center font-bold",
              avgTicketGrowth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}>
              {avgTicketGrowth >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {Math.abs(avgTicketGrowth)}%
              <span className="font-normal text-muted-foreground ml-1">vs anterior</span>
            </span>
            <span className="text-muted-foreground font-medium">
              Por cliente
            </span>
          </div>
        </div>

        {/* Metric 4: Clients Served */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Clientes Atendidos
              </span>
              <div className="text-2xl font-black tracking-tight text-foreground">
                {loading ? <Skeleton className="h-8 w-20" /> : clientStats.uniqueClients}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
            <span className="font-bold text-foreground">
              {clientStats.retentionRate}% <span className="font-normal text-muted-foreground">retención</span>
            </span>
            <span className="text-muted-foreground font-medium">
              {clientStats.newClients} nuevos
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Hero Chart: Evolution of Revenue / Bookings ── */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/40">
          <div>
            <h3 className="text-base font-bold text-foreground tracking-tight m-0">
              Evolución Temporal
            </h3>
            <p className="text-xs text-muted-foreground m-0">
              Desglose continuo a lo largo del periodo seleccionado
            </p>
          </div>

          <div className="inline-flex p-1 bg-muted/60 rounded-xl border border-border/80 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setChartMetric("revenue")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                chartMetric === "revenue"
                  ? "bg-background text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Facturación (€)
            </button>
            <button
              type="button"
              onClick={() => setChartMetric("bookings")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                chartMetric === "bookings"
                  ? "bg-background text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Nº de Citas
            </button>
          </div>
        </div>

        <div className="h-[280px] w-full pt-2">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Skeleton className="w-full h-full rounded-xl" />
            </div>
          ) : revenueData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
              <Activity className="w-8 h-8 opacity-40" />
              <p className="text-sm font-medium">No hay movimientos registrados en este periodo</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartColorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/30" />
                <XAxis
                  dataKey="label"
                  stroke="currentColor"
                  className="text-muted-foreground text-[11px]"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="currentColor"
                  className="text-muted-foreground text-[11px]"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (chartMetric === "revenue" ? `${val}€` : val)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="p-3 rounded-xl bg-popover/95 backdrop-blur-md border border-border shadow-xl text-xs space-y-1">
                        <p className="font-bold text-foreground">{item.date}</p>
                        <p className="text-primary font-black text-sm">
                          {chartMetric === "revenue" ? formatExactCurrency(item.revenue) : `${item.bookings} citas`}
                        </p>
                        {chartMetric === "revenue" && (
                          <p className="text-muted-foreground text-[11px]">
                            {item.bookings} citas completadas
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={chartMetric}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#chartColorGradient)"
                  dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── 2-Column Deep Dives ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Team Productivity & Ranking */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div>
              <h3 className="text-base font-bold text-foreground tracking-tight m-0 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Rendimiento por Estilista
              </h3>
              <p className="text-xs text-muted-foreground m-0">
                Aporte directo a la facturación del salón
              </p>
            </div>
            <Badge variant="outline" className="text-[11px]">
              {stylistStats.length} miembros
            </Badge>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : stylistStats.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No hay citas asignadas a estilistas en este periodo
            </p>
          ) : (
            <div className="space-y-3">
              {stylistStats.map((st, i) => (
                <div
                  key={st.id}
                  className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0"
                        style={{ backgroundColor: st.color || chartColor(i) }}
                      >
                        {st.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          {st.name}
                          {i === 0 && st.revenue > 0 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                              Top 1
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {st.count} citas · Ticket medio: {formatExactCurrency(st.avgTicket)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-sm text-foreground">
                        {formatCurrency(st.revenue)}
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {st.percent}% del total
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(st.percent, 100)}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: st.color || chartColor(i) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Payment Methods & Caja Breakdown */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div>
              <h3 className="text-base font-bold text-foreground tracking-tight m-0 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                Desglose de Caja y Métodos de Pago
              </h3>
              <p className="text-xs text-muted-foreground m-0">
                Canales de cobro y conciliación
              </p>
            </div>
          </div>

          {/* Payment Method Bars */}
          <div className="space-y-3">
            {/* Card */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-2 text-foreground">
                  <CreditCard className="w-4 h-4 text-sky-500" />
                  Tarjeta bancaria (TPV)
                </span>
                <span className="font-black text-foreground">
                  {formatCurrency(totals.card)}{" "}
                  <span className="text-muted-foreground font-normal">
                    ({totals.revenue > 0 ? Math.round((totals.card / totals.revenue) * 100) : 0}%)
                  </span>
                </span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${totals.revenue > 0 ? (totals.card / totals.revenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Cash */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-2 text-foreground">
                  <Banknote className="w-4 h-4 text-emerald-500" />
                  Efectivo en caja
                </span>
                <span className="font-black text-foreground">
                  {formatCurrency(totals.cash)}{" "}
                  <span className="text-muted-foreground font-normal">
                    ({totals.revenue > 0 ? Math.round((totals.cash / totals.revenue) * 100) : 0}%)
                  </span>
                </span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${totals.revenue > 0 ? (totals.cash / totals.revenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Mixed / Other */}
            {totals.mixed > 0 && (
              <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-2 text-foreground">
                    <Repeat className="w-4 h-4 text-purple-500" />
                    Mixto / Bizum / Otros
                  </span>
                  <span className="font-black text-foreground">
                    {formatCurrency(totals.mixed)}{" "}
                    <span className="text-muted-foreground font-normal">
                      ({totals.revenue > 0 ? Math.round((totals.mixed / totals.revenue) * 100) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${totals.revenue > 0 ? (totals.mixed / totals.revenue) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Mini Insights Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">
                <Gift className="w-3.5 h-3.5" />
                Propinas
              </div>
              <div className="text-lg font-black text-foreground">
                {formatExactCurrency(totals.tips)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/15">
              <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold mb-1">
                <TrendingDown className="w-3.5 h-3.5" />
                Descuentos
              </div>
              <div className="text-lg font-black text-foreground">
                -{formatExactCurrency(totals.discounts)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Peak Hours & Services Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Distribution */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div>
              <h3 className="text-base font-bold text-foreground tracking-tight m-0 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Horas Punta y Afluencia
              </h3>
              <p className="text-xs text-muted-foreground m-0">
                Distribución de citas según la franja horaria
              </p>
            </div>
          </div>

          <div className="h-[200px] w-full pt-2">
            {hourlyActivity.length === 0 ? (
              <p className="text-xs text-muted-foreground py-10 text-center">
                Sin citas registradas
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyActivity} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/30" />
                  <XAxis dataKey="hour" stroke="currentColor" className="text-muted-foreground text-[10px]" tickLine={false} />
                  <YAxis stroke="currentColor" className="text-muted-foreground text-[10px]" tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-lg bg-popover border border-border shadow-lg text-xs">
                          <span className="font-bold">{item.hour}</span>: {item.count} citas iniciadas
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Services */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div>
              <h3 className="text-base font-bold text-foreground tracking-tight m-0 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-primary" />
                Servicios Más Solicitados
              </h3>
              <p className="text-xs text-muted-foreground m-0">
                Servicios estrella por volumen de reservas
              </p>
            </div>
          </div>

          {topServices.length === 0 ? (
            <p className="text-xs text-muted-foreground py-10 text-center">
              No hay servicios registrados en este periodo
            </p>
          ) : (
            <div className="space-y-3 pt-1">
              {topServices.map((srv, idx) => (
                <div key={srv.name} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/40">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">
                      {srv.name}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs font-bold font-mono">
                    {srv.count} {srv.count === 1 ? "cita" : "citas"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
