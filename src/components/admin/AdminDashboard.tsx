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
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted/50 animate-pulse rounded-[14px]" />
          ))}
        </div>
      </div>
    );
  }

  const navOrders = () => onNavigate("pedidos");

  const greeting =
    new Date().getHours() < 14 ? "Buenos días" : new Date().getHours() < 20 ? "Buenas tardes" : "Buenas noches";

  const kpis = [
    {
      id: "revenue",
      label: "Ingresos hoy",
      value: formatCurrency(stats.todayRevenue),
      delta: `${stats.weeklyGrowth >= 0 ? "+" : ""}${stats.weeklyGrowth}% vs sem. pasada`,
      deltaPos: stats.weeklyGrowth >= 0,
      icon: <Euro className="h-4 w-4" />,
      onClick: () => onNavigate("caja"),
    },
    {
      id: "bookings",
      label: "Citas hoy",
      value: stats.todayBookings.toString(),
      delta: stats.nextBookingTime
        ? `Próx · ${stats.nextBookingTime} ${stats.nextBookingName?.split(" ")[0] || ""}`
        : "Sin más citas",
      icon: <Calendar className="h-4 w-4" />,
      onClick: () => onNavigate("agenda"),
    },
    {
      id: "messages",
      label: "Mensajes",
      value: stats.unreadMessages.toString(),
      delta: stats.unreadMessages > 0 ? "sin leer" : "Todo al día",
      icon: <MessageCircle className="h-4 w-4" />,
      onClick: () => onNavigate("messages"),
      badge: stats.unreadMessages > 0,
    },
    {
      id: "reviews",
      label: "Reseñas",
      value: stats.pendingReviews.toString(),
      delta: stats.pendingReviews > 0 ? "pendientes" : "Todas aprobadas",
      icon: <Star className="h-4 w-4" />,
      onClick: () => onNavigate("resenas"),
      badge: stats.pendingReviews > 0,
    },
  ];

  return (
    <div className="space-y-5 pb-6">
      <OnboardingChecklist tenantId={tenantId} onNavigate={onNavigate} />

      <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--gp-muted-c)" }}>
            {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          </p>
          <h2 className="text-[20px] font-extrabold tracking-tight" style={{ color: "var(--gp-ink)" }}>
            {greeting}
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => onQuickAction(action.id)}
              className="gp-chip h-9 px-3 hover:bg-[var(--gp-accent-soft)] hover:text-[var(--gp-accent-ink)] transition"
              title={action.label}
            >
              {action.icon}
              <span className="hidden sm:inline">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <motion.button
            key={k.id}
            initial={{ y: 8 }}
            animate={{ y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
            onClick={k.onClick}
            className="gp-kpi text-left relative"
          >
            <div className="flex items-center justify-between">
              <span className="gp-kpi-ic">{k.icon}</span>
              {k.badge && <span className="h-2 w-2 rounded-full bg-[var(--gp-accent)] animate-pulse" />}
            </div>
            <p className="gp-kpi-value">{k.value}</p>
            <p className="gp-kpi-label">{k.label}</p>
            <p className={`gp-kpi-delta ${k.deltaPos === true ? "pos" : k.deltaPos === false ? "neg" : ""}`}>
              {k.delta}
            </p>
          </motion.button>
        ))}
      </div>

      {(() => {
        const total = stats.newBookingsTodayTotal;
        const crm = stats.newBookingsTodayCrm;
        const web = stats.newBookingsTodayWeb;
        const yest = stats.newBookingsYesterday;
        const crmPct = total > 0 ? Math.round((crm / total) * 100) : 0;
        const webPct = total > 0 ? 100 - crmPct : 0;
        const diff = total - yest;
        return (
          <div className="gp-card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="gp-card-title mb-1">Citas nuevas hoy</p>
                <p className="text-[26px] font-extrabold leading-none tabular-nums" style={{ color: "var(--gp-ink)" }}>
                  {total}
                </p>
              </div>
              <span className={diff >= 0 ? "gp-badge-ok" : "gp-badge-danger"}>
                {diff >= 0 ? "+" : ""}{diff} vs ayer
              </span>
            </div>

            {total > 0 ? (
              <>
                <div className="flex h-1.5 rounded-full overflow-hidden" style={{ background: "var(--gp-line)" }}>
                  <div style={{ width: `${crmPct}%`, background: "var(--gp-accent)" }} />
                  <div style={{ width: `${webPct}%`, background: "var(--gp-purple)" }} />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-lg flex items-center justify-center"
                      style={{ background: "var(--gp-accent-soft)", color: "var(--gp-accent-ink)" }}>
                      <Briefcase className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--gp-muted-c)" }}>Admin</p>
                      <p className="text-sm font-bold tabular-nums" style={{ color: "var(--gp-ink)" }}>
                        {crm} <span className="text-[10px] font-medium" style={{ color: "var(--gp-muted-c)" }}>({crmPct}%)</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-lg flex items-center justify-center"
                      style={{ background: "color-mix(in oklab, var(--gp-purple), white 88%)", color: "var(--gp-purple)" }}>
                      <Globe className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--gp-muted-c)" }}>Web</p>
                      <p className="text-sm font-bold tabular-nums" style={{ color: "var(--gp-ink)" }}>
                        {web} <span className="text-[10px] font-medium" style={{ color: "var(--gp-muted-c)" }}>({webPct}%)</span>
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs" style={{ color: "var(--gp-muted-c)" }}>Aún no se han creado citas hoy</p>
            )}
          </div>
        );
      })()}

      <div className="grid grid-cols-2 gap-3">
        <button onClick={navOrders} className="gp-kpi text-left">
          <div className="flex items-center justify-between">
            <span className="gp-kpi-ic" style={{ background: "color-mix(in oklab, var(--gp-purple), white 88%)", color: "var(--gp-purple)" }}>
              <ShoppingCart className="h-4 w-4" />
            </span>
            {stats.pendingOrders > 0 && <span className="gp-badge-warn">{stats.pendingOrders}</span>}
          </div>
          <p className="gp-kpi-value">{stats.pendingOrders}</p>
          <p className="gp-kpi-label">Pedidos pendientes</p>
          <p className="gp-kpi-delta">{stats.ordersCount7d} · {formatCurrency(stats.ordersRevenue7d)} (7d)</p>
        </button>
        <button onClick={navOrders} className="gp-kpi text-left">
          <div className="flex items-center justify-between">
            <span className="gp-kpi-ic"><Package className="h-4 w-4" /></span>
          </div>
          <p className="gp-kpi-value">{formatCurrency(stats.ordersRevenue7d)}</p>
          <p className="gp-kpi-label">Tienda 7 días</p>
          <p className="gp-kpi-delta">{stats.ordersCount7d} pedidos</p>
        </button>
      </div>

      {stats.nextBookingTime && (
        <button onClick={() => onNavigate("agenda")} className="gp-row w-full text-left">
          <span className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--gp-accent-soft)", color: "var(--gp-accent-ink)" }}>
            <Clock className="h-4 w-4" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--gp-muted-c)" }}>Próxima cita</p>
            <p className="text-sm font-bold truncate" style={{ color: "var(--gp-ink)" }}>
              {stats.nextBookingTime} · {stats.nextBookingName}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0" style={{ color: "var(--gp-muted-c)" }} />
        </button>
      )}

      {stats.pendingOrders > 0 && (
        <button onClick={navOrders} className="gp-row w-full text-left">
          <span className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "color-mix(in oklab, var(--gp-purple), white 88%)", color: "var(--gp-purple)" }}>
            <ShoppingCart className="h-4 w-4" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: "var(--gp-ink)" }}>
              Tienes {stats.pendingOrders} pedido{stats.pendingOrders > 1 ? "s" : ""} pendiente{stats.pendingOrders > 1 ? "s" : ""}
            </p>
            <p className="text-xs" style={{ color: "var(--gp-muted-c)" }}>Revísalos y prepáralos para entrega</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0" style={{ color: "var(--gp-muted-c)" }} />
        </button>
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
