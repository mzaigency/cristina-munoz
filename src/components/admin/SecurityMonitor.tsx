import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, TrendingUp, TrendingDown, Users, Star, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

interface SecurityMonitorProps {
  tenantId?: string;
}

type PeriodTab = "daily" | "weekly" | "monthly";

export function SecurityMonitor({ tenantId }: SecurityMonitorProps) {
  const { toast } = useToast();
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PeriodTab>("daily");
  const [totalProfiles, setTotalProfiles] = useState(0);

  useEffect(() => {
    fetchBookingStats();
    fetchTotalProfiles();

    const interval = setInterval(
      () => {
        fetchBookingStats();
        fetchTotalProfiles();
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
    try {
      const { count, error } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      if (error) throw error;
      setTotalProfiles(count || 0);
    } catch (error) {
      console.error("Error fetching profiles count:", error);
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
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}
              >
                {bookingsChange > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {bookingsChange > 0 ? "+" : ""}
                {bookingsChange}%
              </div>
            )}
          </div>
        </div>

        {/* Clientes Activos */}
        <div className="ios-card p-4">
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
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

      {/* Channel Breakdown */}
      <div className="ios-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">Origen de reservas</h3>
        
        <div className="space-y-4">
          {/* CRM Channel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                <span className="text-sm font-medium text-foreground">Panel Admin</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">{currentPeriodData.byChannel.crm}</span>
                <span className="text-xs text-muted-foreground">({getPercentage(currentPeriodData.byChannel.crm)}%)</span>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${getPercentage(currentPeriodData.byChannel.crm)}%` }}
              />
            </div>
          </div>

          {/* Web Channel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-sm font-medium text-foreground">Web / App</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">{currentPeriodData.byChannel.web}</span>
                <span className="text-xs text-muted-foreground">({getPercentage(currentPeriodData.byChannel.web)}%)</span>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
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
