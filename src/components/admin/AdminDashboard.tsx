import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Wallet, 
  MessageCircle, 
  Star, 
  TrendingUp,
  Clock,
  Plus,
  CreditCard,
  Ban,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface AdminDashboardProps {
  tenantId: string;
  onNavigate: (tab: string) => void;
  onQuickAction: (action: string) => void;
}

interface DashboardStats {
  todayBookings: number;
  nextBookingTime: string | null;
  nextBookingName: string | null;
  todayRevenue: number;
  unreadMessages: number;
  pendingReviews: number;
  weeklyGrowth: number;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export function AdminDashboard({ tenantId, onNavigate, onQuickAction }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    todayBookings: 0,
    nextBookingTime: null,
    nextBookingName: null,
    todayRevenue: 0,
    unreadMessages: 0,
    pendingReviews: 0,
    weeklyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);

  const quickActions: QuickAction[] = [
    { id: "new-booking", label: "Nueva cita", icon: <Plus className="h-5 w-5" />, color: "bg-primary" },
    { id: "new-payment", label: "Cobrar", icon: <CreditCard className="h-5 w-5" />, color: "bg-emerald-500" },
    { id: "block-slot", label: "Bloquear", icon: <Ban className="h-5 w-5" />, color: "bg-amber-500" },
  ];

  useEffect(() => {
    fetchDashboardStats();
  }, [tenantId]);

  const fetchDashboardStats = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const now = format(new Date(), "HH:mm");

      // Fetch today's bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("Hora, customer_name, status")
        .eq("tenant_id", tenantId)
        .eq("Fecha", today)
        .neq("status", "cancelled")
        .order("Hora", { ascending: true });

      if (bookingsError) throw bookingsError;

      // Find next booking
      const upcomingBookings = bookings?.filter(b => b.Hora >= now) || [];
      const nextBooking = upcomingBookings[0];

      // Fetch today's revenue
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("total")
        .eq("tenant_id", tenantId)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`)
        .eq("voided", false);

      if (transactionsError) throw transactionsError;

      const todayRevenue = transactions?.reduce((sum, t) => sum + (t.total || 0), 0) || 0;

      // Fetch unread messages
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("unread_count_salon")
        .eq("tenant_id", tenantId);

      if (convError) throw convError;

      const unreadMessages = conversations?.reduce((sum, c) => sum + (c.unread_count_salon || 0), 0) || 0;

      // Fetch pending reviews
      const { count: pendingReviews } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("approved", false);

      // Calculate weekly growth (compare last 7 days vs previous 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const { data: thisWeekTx } = await supabase
        .from("transactions")
        .select("total")
        .eq("tenant_id", tenantId)
        .gte("created_at", weekAgo.toISOString())
        .eq("voided", false);

      const { data: lastWeekTx } = await supabase
        .from("transactions")
        .select("total")
        .eq("tenant_id", tenantId)
        .gte("created_at", twoWeeksAgo.toISOString())
        .lt("created_at", weekAgo.toISOString())
        .eq("voided", false);

      const thisWeekTotal = thisWeekTx?.reduce((sum, t) => sum + (t.total || 0), 0) || 0;
      const lastWeekTotal = lastWeekTx?.reduce((sum, t) => sum + (t.total || 0), 0) || 0;
      const weeklyGrowth = lastWeekTotal > 0 
        ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) 
        : 0;

      setStats({
        todayBookings: bookings?.length || 0,
        nextBookingTime: nextBooking?.Hora || null,
        nextBookingName: nextBooking?.customer_name || null,
        todayRevenue,
        unreadMessages,
        pendingReviews: pendingReviews || 0,
        weeklyGrowth,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const statCards = [
    {
      id: "bookings",
      label: "Citas hoy",
      value: stats.todayBookings.toString(),
      subtitle: stats.nextBookingTime 
        ? `Próxima: ${stats.nextBookingTime} - ${stats.nextBookingName?.split(" ")[0]}`
        : "Sin más citas hoy",
      icon: <Calendar className="h-5 w-5" />,
      color: "from-violet-500 to-purple-600",
      tab: "calendar",
    },
    {
      id: "revenue",
      label: "Ingresos hoy",
      value: formatCurrency(stats.todayRevenue),
      subtitle: stats.weeklyGrowth >= 0 
        ? `+${stats.weeklyGrowth}% vs semana pasada`
        : `${stats.weeklyGrowth}% vs semana pasada`,
      icon: <Wallet className="h-5 w-5" />,
      color: "from-emerald-500 to-green-600",
      tab: "cash",
    },
    {
      id: "messages",
      label: "Mensajes",
      value: stats.unreadMessages.toString(),
      subtitle: stats.unreadMessages > 0 ? "sin leer" : "Todo al día",
      icon: <MessageCircle className="h-5 w-5" />,
      color: "from-blue-500 to-cyan-600",
      tab: "messages",
      badge: stats.unreadMessages > 0,
    },
    {
      id: "reviews",
      label: "Reseñas",
      value: stats.pendingReviews.toString(),
      subtitle: stats.pendingReviews > 0 ? "pendientes" : "Todas aprobadas",
      icon: <Star className="h-5 w-5" />,
      color: "from-amber-500 to-orange-600",
      tab: "reviews",
      badge: stats.pendingReviews > 0,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Welcome message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-1"
      >
        <div className="p-2 rounded-xl bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Buenos {new Date().getHours() < 14 ? "días" : new Date().getHours() < 20 ? "tardes" : "noches"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((card, index) => (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onNavigate(card.tab)}
            className="relative overflow-hidden rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
          >
            {/* Gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-90`} />
            
            {/* Content */}
            <div className="relative z-10 text-white">
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  {card.icon}
                </div>
                {card.badge && (
                  <span className="flex h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                )}
              </div>
              <p className="text-2xl font-bold mb-0.5">{card.value}</p>
              <p className="text-xs font-medium opacity-90">{card.label}</p>
              <p className="text-[10px] opacity-70 mt-1 line-clamp-1">{card.subtitle}</p>
            </div>

            {/* Arrow indicator */}
            <ArrowRight className="absolute bottom-3 right-3 h-4 w-4 text-white/50" />
          </motion.button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground px-1">Acciones rápidas</h3>
        <div className="flex gap-3">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="flex-1"
            >
              <Button
                variant="outline"
                onClick={() => onQuickAction(action.id)}
                className="w-full h-auto py-4 flex-col gap-2 rounded-xl border-2 hover:border-primary/50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${action.color} text-white`}>
                  {action.icon}
                </div>
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Next booking highlight */}
      {stats.nextBookingTime && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Próxima cita</p>
              <p className="text-xs text-muted-foreground truncate">
                {stats.nextBookingTime} - {stats.nextBookingName}
              </p>
            </div>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => onNavigate("calendar")}
              className="shrink-0"
            >
              Ver
            </Button>
          </div>
        </motion.div>
      )}

      {/* Weekly trend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="p-4 rounded-2xl bg-muted/50 border"
      >
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${stats.weeklyGrowth >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
            <TrendingUp className={`h-5 w-5 ${stats.weeklyGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400 rotate-180'}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Tendencia semanal</p>
            <p className={`text-xs ${stats.weeklyGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {stats.weeklyGrowth >= 0 ? '+' : ''}{stats.weeklyGrowth}% respecto a la semana anterior
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
