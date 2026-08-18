import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, TrendingUp, TrendingDown, Users, Star, BarChart3, Target, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { format, getDaysInMonth, getDate } from "date-fns";
import { es } from "date-fns/locale";

interface BookingStats {
  daily: {
    total: number;
    previous: number;
    byChannel: {
      crm: number;
      web: number;
    };
  };
  weekly: {
    total: number;
    previous: number;
    byChannel: {
      crm: number;
      web: number;
    };
  };
  monthly: {
    total: number;
    previous: number;
    byChannel: {
      crm: number;
      web: number;
    };
  };
  averageRating: number;
}

interface RevenueData {
  monthlyRevenue: number;
  monthlyGoal: number;
  projectedRevenue: number;
}

interface SecurityMonitorProps {
  tenantId?: string;
}

type PeriodTab = "daily" | "weekly" | "monthly";

export function SecurityMonitor({ tenantId }: SecurityMonitorProps) {
  const { toast } = useToast();
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData>({
    monthlyRevenue: 0,
    monthlyGoal: 3000, // Default goal
    projectedRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PeriodTab>("daily");
  const [totalProfiles, setTotalProfiles] = useState(0);

  useEffect(() => {
    fetchBookingStats();
    fetchTotalProfiles();
    fetchMonthlyRevenue();

    const interval = setInterval(
      () => {
        fetchBookingStats();
        fetchTotalProfiles();
        fetchMonthlyRevenue();
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [tenantId]);

  const fetchBookingStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-bookings-stats", {
        body: { tenantId },
      });

      if (error) throw error;

      // Map old format to new (removing whatsapp)
      const mapPeriod = (period: any) => ({
        total: period.total,
        previous: period.previous,
        byChannel: {
          crm: period.byChannel?.crm || 0,
          web: (period.byChannel?.web || 0) + (period.byChannel?.whatsapp || 0),
        },
      });

      setStats({
        daily: mapPeriod(data.daily),
        weekly: mapPeriod(data.weekly),
        monthly: mapPeriod(data.monthly),
        averageRating: data.averageRating,
      });
    } catch (error) {
      console.error("Error fetching booking stats:", error);
      toast({
        variant: "destructive",
        title: "Error al cargar estadísticas",
        description: "No se pudieron cargar las estadísticas de citas",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalProfiles = async () => {
    if (!tenantId) return;

    try {
      // Count unique customers who have booked with this tenant
      // Using bookings table to get unique user_ids for this tenant
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("user_id")
        .eq("tenant_id", tenantId)
        .not("user_id", "is", null);

      if (error) throw error;

      // Count unique user IDs
      const uniqueUserIds = new Set(bookings?.map((b) => b.user_id) || []);
      setTotalProfiles(uniqueUserIds.size);
    } catch (error) {
      console.error("Error fetching profiles count:", error);
    }
  };

  const fetchMonthlyRevenue = async () => {
    if (!tenantId) return;

    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Fetch monthly goal from monthly_goals table
      const { data: goalsData } = await supabase
        .from("monthly_goals" as any)
        .select("revenue_goal")
        .eq("tenant_id", tenantId)
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .maybeSingle();

      const monthlyGoal = (goalsData as any)?.revenue_goal || 0;

      const { data, error } = await supabase
        .from("transactions")
        .select("total, created_at")
        .eq("tenant_id", tenantId)
        .eq("voided", false)
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", endOfMonth.toISOString());

      if (error) throw error;

      const monthlyRevenue = data?.reduce((sum, t) => sum + (t.total || 0), 0) || 0;

      // Calculate projection based on current pace
      const dayOfMonth = getDate(now);
      const daysInMonth = getDaysInMonth(now);
      const dailyAverage = dayOfMonth > 0 ? monthlyRevenue / dayOfMonth : 0;
      const projectedRevenue = dailyAverage * daysInMonth;

      setRevenueData({
        monthlyRevenue,
        monthlyGoal,
        projectedRevenue,
      });
    } catch (error) {
      console.error("Error fetching monthly revenue:", error);
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
          </div>
          <p className="text-sm text-muted-foreground">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground">No se pudieron cargar las estadísticas</p>
      </div>
    );
  }

  const currentPeriodData = stats[activeTab];
  const periodLabels: Record<PeriodTab, string> = {
    daily: "Hoy",
    weekly: "Esta semana",
    monthly: "Este mes",
  };
  const periodLabel = periodLabels[activeTab];
  const bookingsChange = calculateChange(currentPeriodData.total, currentPeriodData.previous);
  const totalChannelBookings = currentPeriodData.byChannel.crm + currentPeriodData.byChannel.web;

  const getPercentage = (value: number) => {
    if (totalChannelBookings === 0) return 0;
    return Math.round((value / totalChannelBookings) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Period Selector - iOS Segmented Control */}
      <div className="ios-card p-1">
        <div className="flex gap-1">
          {(["daily", "weekly", "monthly"] as PeriodTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200",
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              {tab === "daily" ? "Día" : tab === "weekly" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Reservas */}
        <div className="ios-card p-4 col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Reservas {periodLabel}</p>
                <p className="text-3xl font-bold text-foreground">{currentPeriodData.total}</p>
              </div>
            </div>
            {bookingsChange !== 0 && (
              <div
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold",
                  bookingsChange > 0
                    ? "bg-[var(--gp-ok-soft)] text-[var(--gp-ok-ink)] dark:bg-green-900/30 "
                    : "bg-[var(--gp-danger-soft)] text-[var(--gp-danger-ink)] dark:bg-red-900/30 ",
                )}
              >
                {bookingsChange > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {bookingsChange > 0 ? "+" : ""}
                {bookingsChange}%
              </div>
            )}
          </div>
        </div>

        {/* Clientes Activos */}
        <div className="ios-card p-4">
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--gp-info-soft)] dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-[var(--gp-info-ink)] " />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Clientes</p>
              <p className="text-2xl font-bold text-foreground">{totalProfiles}</p>
            </div>
          </div>
        </div>

        {/* Valoración Media */}
        <div className="ios-card p-4">
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--gp-warn-soft)] dark:bg-amber-900/30 flex items-center justify-center">
              <Star className="h-5 w-5 text-[var(--gp-warn-ink)] " />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valoración</p>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold text-foreground">{stats.averageRating.toFixed(1)}</p>
                <span className="text-xs text-muted-foreground">/5</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Goal Progress */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="ios-card p-4 overflow-hidden relative"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[var(--gp-ok-soft)] dark:bg-emerald-900/30 flex items-center justify-center">
                <Target className="h-5 w-5 text-[var(--gp-ok-ink)] " />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Objetivo mensual</p>
                <p className="text-sm font-semibold text-foreground">
                  {format(new Date(), "MMMM yyyy", { locale: es })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">
                {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
                  revenueData.monthlyRevenue,
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                de{" "}
                {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(revenueData.monthlyGoal)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-3 bg-muted rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((revenueData.monthlyRevenue / revenueData.monthlyGoal) * 100, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                revenueData.monthlyRevenue >= revenueData.monthlyGoal
                  ? "bg-gradient-to-r from-[var(--gp-ok)] to-[var(--gp-ok)]"
                  : "bg-gradient-to-r from-primary to-[var(--gp-purple)]",
              )}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span
              className={cn(
                "font-medium",
                revenueData.monthlyRevenue >= revenueData.monthlyGoal
                  ? "text-[var(--gp-ok-ink)] "
                  : "text-muted-foreground",
              )}
            >
              {Math.round((revenueData.monthlyRevenue / revenueData.monthlyGoal) * 100)}% completado
            </span>

            {/* Projection */}
            {revenueData.projectedRevenue > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                <span>
                  Proyección:{" "}
                  {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
                    revenueData.projectedRevenue,
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Goal reached celebration */}
          {revenueData.monthlyRevenue >= revenueData.monthlyGoal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 p-2 rounded-lg bg-[var(--gp-ok-soft)] dark:bg-emerald-900/30 text-center"
            >
              <p className="text-sm font-medium text-[var(--gp-ok-ink)] ">🎉 ¡Objetivo alcanzado!</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Channel Breakdown */}
      <div className="ios-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">Origen de reservas</h3>

        <div className="space-y-4">
          {/* CRM Channel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--gp-info)]" />
                <span className="text-sm font-medium text-foreground">Panel Admin</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">{currentPeriodData.byChannel.crm}</span>
                <span className="text-xs text-muted-foreground">
                  ({getPercentage(currentPeriodData.byChannel.crm)}%)
                </span>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--gp-info)] rounded-full transition-all duration-500"
                style={{ width: `${getPercentage(currentPeriodData.byChannel.crm)}%` }}
              />
            </div>
          </div>

          {/* Web Channel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--gp-warn)]" />
                <span className="text-sm font-medium text-foreground">Web / App</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">{currentPeriodData.byChannel.web}</span>
                <span className="text-xs text-muted-foreground">
                  ({getPercentage(currentPeriodData.byChannel.web)}%)
                </span>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--gp-warn)] rounded-full transition-all duration-500"
                style={{ width: `${getPercentage(currentPeriodData.byChannel.web)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total bar */}
        {totalChannelBookings > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total reservas por canal</span>
              <span className="font-semibold text-foreground">{totalChannelBookings}</span>
            </div>
          </div>
        )}
      </div>

      {/* Period comparison hint */}
      <p className="text-xs text-center text-muted-foreground px-4">
        Comparado con {activeTab === "daily" ? "ayer" : activeTab === "weekly" ? "la semana pasada" : "el mes pasado"}
      </p>
    </div>
  );
}
