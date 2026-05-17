import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingChecklist } from "@/components/admin/OnboardingChecklist";
import { TrainingChecklist } from "@/components/admin/content/TrainingChecklist";
import { ROICalculator } from "@/components/admin/content/ROICalculator";
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
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShoppingCart, 
  Package,
  Euro,
  Globe,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  pendingOrders: number;
  ordersRevenue7d: number;
  ordersCount7d: number;
  // Citas CREADAS hoy (no las del día), desglosadas por canal
  newBookingsTodayTotal: number;
  newBookingsTodayCrm: number;
  newBookingsTodayWeb: number;
  newBookingsYesterday: number;
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
    pendingOrders: 0,
    ordersRevenue7d: 0,
    ordersCount7d: 0,
    newBookingsTodayTotal: 0,
    newBookingsTodayCrm: 0,
    newBookingsTodayWeb: 0,
    newBookingsYesterday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tenantAge, setTenantAge] = useState<number>(999);
  const [trainingOpen, setTrainingOpen] = useState(true);
  const [roiOpen, setRoiOpen] = useState(false);

  const quickActions: QuickAction[] = [
    { id: "new-booking", label: "Nueva cita", icon: <Plus className="h-5 w-5" />, color: "bg-primary" },
    { id: "new-payment", label: "Cobrar", icon: <CreditCard className="h-5 w-5" />, color: "bg-emerald-500" },
    { id: "block-slot", label: "Bloquear", icon: <Ban className="h-5 w-5" />, color: "bg-amber-500" },
  ];

  useEffect(() => {
    fetchDashboardStats();
    fetchTenantAge();
  }, [tenantId]);

  const fetchTenantAge = async () => {
    const { data } = await supabase
      .from("tenants")
      .select("created_at")
      .eq("id", tenantId)
      .single();
    if (data?.created_at) {
      const days = Math.floor((Date.now() - new Date(data.created_at).getTime()) / 86400000);
      setTenantAge(days);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const now = format(new Date(), "HH:mm");

      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("Hora, customer_name, status")
        .eq("tenant_id", tenantId)
        .eq("Fecha", today)
        .neq("status", "cancelled")
        .order("Hora", { ascending: true });

      if (bookingsError) throw bookingsError;

      const upcomingBookings = bookings?.filter(b => b.Hora >= now) || [];
      const nextBooking = upcomingBookings[0];

      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("total")
        .eq("tenant_id", tenantId)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`)
        .eq("voided", false);

      if (transactionsError) throw transactionsError;

      const todayRevenue = transactions?.reduce((sum, t) => sum + (t.total || 0), 0) || 0;

      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("unread_count_salon")
        .eq("tenant_id", tenantId);

      if (convError) throw convError;

      const unreadMessages = conversations?.reduce((sum, c) => sum + (c.unread_count_salon || 0), 0) || 0;

      const { count: pendingReviews } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("approved", false);

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

      // Pedidos: pendientes y métricas de los últimos 7 días
      const { count: pendingOrdersCount } = await supabase
        .from("product_orders")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "pending");

      const { data: orders7d } = await supabase
        .from("product_orders")
        .select("total, status")
        .eq("tenant_id", tenantId)
        .gte("created_at", weekAgo.toISOString())
        .neq("status", "cancelled");

      const ordersRevenue7d = orders7d?.reduce((sum, o: any) => sum + Number(o.total || 0), 0) || 0;
      const ordersCount7d = orders7d?.length || 0;

      // Citas CREADAS hoy y ayer (no las del día), por canal — filtrado por tenant
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);

      const [{ data: createdToday }, { count: createdYesterday }] = await Promise.all([
        supabase
          .from("bookings")
          .select("canal")
          .eq("tenant_id", tenantId)
          .neq("status", "cancelled")
          .gte("created_at", todayStart.toISOString())
          .lt("created_at", tomorrowStart.toISOString()),
        supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .neq("status", "cancelled")
          .gte("created_at", yesterdayStart.toISOString())
          .lt("created_at", todayStart.toISOString()),
      ]);

      const newBookingsTodayCrm = (createdToday || []).filter((b: any) => b.canal === "crm").length;
      const newBookingsTodayWeb = (createdToday || []).filter((b: any) => b.canal !== "crm").length;
      const newBookingsTodayTotal = createdToday?.length || 0;

      setStats({
        todayBookings: bookings?.length || 0,
        nextBookingTime: nextBooking?.Hora || null,
        nextBookingName: nextBooking?.customer_name || null,
        todayRevenue,
        unreadMessages,
        pendingReviews: pendingReviews || 0,
        weeklyGrowth,
        pendingOrders: pendingOrdersCount || 0,
        ordersRevenue7d,
        ordersCount7d,
        newBookingsTodayTotal,
        newBookingsTodayCrm,
        newBookingsTodayWeb,
        newBookingsYesterday: createdYesterday || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
  };

  const handleTrainingNavigate = (tab: string, subTab?: string) => {
    // Sub-tab is already stored in sessionStorage by TrainingChecklist
    onNavigate(tab);
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
      tab: "agenda",
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
      tab: "agenda",
    },
    {
      id: "messages",
      label: "Mensajes",
      value: stats.unreadMessages.toString(),
      subtitle: stats.unreadMessages > 0 ? "sin leer" : "Todo al día",
      icon: <MessageCircle className="h-5 w-5" />,
      color: "from-blue-500 to-cyan-600",
      tab: "clients",
      badge: stats.unreadMessages > 0,
    },
    {
      id: "reviews",
      label: "Reseñas",
      value: stats.pendingReviews.toString(),
      subtitle: stats.pendingReviews > 0 ? "pendientes" : "Todas aprobadas",
      icon: <Star className="h-5 w-5" />,
      color: "from-amber-500 to-orange-600",
      tab: "clients",
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

  const navOrders = () => {
    sessionStorage.setItem("openAgendaSubTab", "orders");
    onNavigate("agenda");
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Onboarding checklist for new tenants */}
      <OnboardingChecklist tenantId={tenantId} onNavigate={onNavigate} />

      {/* HERO: saludo + ingresos del día */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-xl shadow-primary/20"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-purple-700" />
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-medium opacity-90">
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {new Date().getHours() < 14 ? "Buenos días" : new Date().getHours() < 20 ? "Buenas tardes" : "Buenas noches"}
              {" · "}
              {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider opacity-80">Ingresos hoy</p>
              <p className="text-3xl font-bold tabular-nums leading-tight">{formatCurrency(stats.todayRevenue)}</p>
              <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium bg-white/15 backdrop-blur-sm rounded-full px-2 py-0.5">
                <TrendingUp className={`h-3 w-3 ${stats.weeklyGrowth < 0 ? "rotate-180" : ""}`} />
                {stats.weeklyGrowth >= 0 ? "+" : ""}{stats.weeklyGrowth}% vs sem. pasada
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs uppercase tracking-wider opacity-80">Citas hoy</p>
              <p className="text-3xl font-bold tabular-nums leading-tight">{stats.todayBookings}</p>
              {stats.nextBookingTime && (
                <p className="text-[11px] opacity-80 truncate max-w-[140px]">
                  Próx · {stats.nextBookingTime} · {stats.nextBookingName?.split(" ")[0]}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-3 gap-2.5">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onQuickAction(action.id)}
            className="group rounded-2xl border bg-card p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform shadow-sm"
          >
            <div className={`h-10 w-10 rounded-xl ${action.color} text-white flex items-center justify-center shadow-md`}>
              {action.icon}
            </div>
            <span className="text-[11px] font-medium text-foreground">{action.label}</span>
          </motion.button>
        ))}
      </div>

      {/* KPIs grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            id: "orders",
            label: "Pedidos pendientes",
            value: stats.pendingOrders.toString(),
            subtitle: `${stats.ordersCount7d} · ${formatCurrency(stats.ordersRevenue7d)} (7d)`,
            icon: <ShoppingCart className="h-5 w-5" />,
            color: "from-rose-500 to-pink-600",
            onClick: navOrders,
            badge: stats.pendingOrders > 0,
          },
          {
            id: "messages",
            label: "Mensajes",
            value: stats.unreadMessages.toString(),
            subtitle: stats.unreadMessages > 0 ? "sin leer" : "Todo al día",
            icon: <MessageCircle className="h-5 w-5" />,
            color: "from-blue-500 to-cyan-600",
            onClick: () => onNavigate("clients"),
            badge: stats.unreadMessages > 0,
          },
          {
            id: "reviews",
            label: "Reseñas",
            value: stats.pendingReviews.toString(),
            subtitle: stats.pendingReviews > 0 ? "pendientes" : "Todas aprobadas",
            icon: <Star className="h-5 w-5" />,
            color: "from-amber-500 to-orange-600",
            onClick: () => onNavigate("clients"),
            badge: stats.pendingReviews > 0,
          },
          {
            id: "revenue7d",
            label: "Tienda 7 días",
            value: formatCurrency(stats.ordersRevenue7d),
            subtitle: `${stats.ordersCount7d} pedidos`,
            icon: <Package className="h-5 w-5" />,
            color: "from-violet-500 to-purple-600",
            onClick: navOrders,
          },
        ].map((card, index) => (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + index * 0.05 }}
            onClick={card.onClick}
            className="relative overflow-hidden rounded-2xl p-4 text-left transition-all active:scale-[0.97] shadow-md"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color}`} />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            <div className="relative z-10 text-white">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md ring-1 ring-white/20">
                  {card.icon}
                </div>
                {card.badge && (
                  <span className="flex h-2.5 w-2.5 rounded-full bg-white animate-pulse shadow-glow" />
                )}
              </div>
              <p className="text-2xl font-bold leading-none mb-1 tabular-nums">{card.value}</p>
              <p className="text-[11px] font-medium opacity-95">{card.label}</p>
              <p className="text-[10px] opacity-75 mt-0.5 line-clamp-1">{card.subtitle}</p>
            </div>
            <ArrowRight className="absolute bottom-3 right-3 h-4 w-4 text-white/60" />
          </motion.button>
        ))}
      </div>

      {/* Próxima cita destacada */}
      {stats.nextBookingTime && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => onNavigate("agenda")}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/10 border border-primary/20 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
        >
          <div className="p-3 rounded-xl bg-primary/15">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Próxima cita</p>
            <p className="text-sm font-semibold text-foreground truncate">
              {stats.nextBookingTime} · {stats.nextBookingName}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </motion.button>
      )}

      {/* Pedidos pendientes destacado */}
      {stats.pendingOrders > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={navOrders}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/20 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
        >
          <div className="p-3 rounded-xl bg-rose-500/15">
            <ShoppingCart className="h-5 w-5 text-rose-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Tienes {stats.pendingOrders} pedido{stats.pendingOrders > 1 ? "s" : ""} pendiente{stats.pendingOrders > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-muted-foreground">Revísalos y prepáralos para entrega</p>
          </div>
          <ArrowRight className="h-4 w-4 text-rose-600" />
        </motion.button>
      )}

      {/* Training — collapsible, shown for tenants < 30 days */}
      {tenantAge < 30 && (
        <Collapsible open={trainingOpen} onOpenChange={setTrainingOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between px-1 py-2">
              <h3 className="text-sm font-semibold text-foreground">📚 Formación</h3>
              {trainingOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <TrainingChecklist tenantId={tenantId} onNavigate={handleTrainingNavigate} />
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* ROI — collapsible, always available */}
      <Collapsible open={roiOpen} onOpenChange={setRoiOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-1 py-2">
            <h3 className="text-sm font-semibold text-foreground">📈 Retorno de inversión</h3>
            {roiOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ROICalculator tenantId={tenantId} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
