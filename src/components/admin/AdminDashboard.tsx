import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingChecklist } from "@/components/admin/OnboardingChecklist";
import { TrainingChecklist } from "@/components/admin/content/TrainingChecklist";
import { ROICalculator } from "@/components/admin/content/ROICalculator";
import {
  Calendar,
  Wallet,
  MessageCircle,
  Star,
  TrendingUp,
  Clock,
  Plus,
  ShoppingCart,
  Package,
  Briefcase,
  Globe,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
  newBookingsTodayTotal: number;
  newBookingsTodayCrm: number;
  newBookingsTodayWeb: number;
  newBookingsYesterday: number;
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
    onNavigate(tab);
  };

  const navOrders = () => {
    sessionStorage.setItem("openAgendaSubTab", "orders");
    onNavigate("agenda");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid var(--gp-accent-soft)", borderTopColor: "var(--gp-accent)", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const total = stats.newBookingsTodayTotal;
  const crm = stats.newBookingsTodayCrm;
  const web = stats.newBookingsTodayWeb;
  const yest = stats.newBookingsYesterday;
  const crmPct = total > 0 ? Math.round((crm / total) * 100) : 0;
  const webPct = total > 0 ? 100 - crmPct : 0;
  const diff = total - yest;

  const quickActions = [
    { label: "Cobrar", icon: <Wallet style={{ width: 18, height: 18 }} />, color: "var(--gp-accent)", onClick: () => onQuickAction("new-payment") },
    { label: "Pedidos", icon: <ShoppingCart style={{ width: 18, height: 18 }} />, color: "var(--gp-info)", onClick: navOrders },
    { label: "Mensajes", icon: <MessageCircle style={{ width: 18, height: 18 }} />, color: "var(--gp-ok)", onClick: () => onNavigate("clients") },
    { label: "Nueva cita", icon: <Plus style={{ width: 18, height: 18 }} />, color: "var(--gp-warn)", onClick: () => onQuickAction("new-booking") },
  ];

  return (
    <div className="gp-fade" style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 24 }}>
      <OnboardingChecklist tenantId={tenantId} onNavigate={onNavigate} />

      {/* Page header */}
      <div className="gp-page-h">
        <div>
          <h2>Resumen del día</h2>
          <p>{format(new Date(), "EEEE d 'de' MMMM · yyyy", { locale: es })}</p>
        </div>
        <div className="gp-page-actions">
          <button className="gp-btn gp-hide-sm" onClick={() => onNavigate("negocio")}>
            <TrendingUp style={{ width: 14, height: 14 }} />
            Informes
          </button>
          <button className="gp-btn primary" onClick={() => onQuickAction("new-booking")}>
            <Plus style={{ width: 14, height: 14 }} />
            Nueva cita
          </button>
        </div>
      </div>

      {/* Hero row: próxima cita + citas nuevas hoy */}
      <div className="gp-grid gp-2col">
        {/* Próxima cita hero */}
        <div className="gp-card" style={{ overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 130% at 90% -10%, color-mix(in oklab, var(--gp-accent), transparent 86%), transparent 60%)" }} />
          <div style={{ position: "relative", padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
            <span className="gp-badge accent" style={{ alignSelf: "flex-start" }}>
              <Clock style={{ width: 12, height: 12 }} />
              Próxima cita
            </span>
            {stats.nextBookingTime ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-.03em", color: "var(--gp-accent)" }}>{stats.nextBookingTime}</span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "var(--gp-ink)" }}>{stats.nextBookingName}</div>
                  <div style={{ fontSize: 13, color: "var(--gp-muted-c)", fontWeight: 600 }}>{stats.todayBookings} citas hoy en total</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--gp-muted-c)", padding: "8px 0" }}>Sin más citas hoy</div>
            )}
            <div style={{ display: "flex", gap: 9 }}>
              <button className="gp-btn primary sm" onClick={() => onQuickAction("new-booking")}>
                <Sparkles style={{ width: 13, height: 13 }} />
                Nueva cita
              </button>
              <button className="gp-btn sm" onClick={() => onNavigate("agenda")}>
                <Calendar style={{ width: 13, height: 13 }} />
                Ver agenda
              </button>
            </div>
          </div>
        </div>

        {/* Citas nuevas hoy */}
        <div className="gp-card pad">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="gp-kpi-ic" style={{ background: "var(--gp-accent-soft)", color: "var(--gp-accent)" }}>
                <Sparkles style={{ width: 16, height: 16 }} />
              </span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--gp-muted-c)", textTransform: "uppercase", letterSpacing: ".06em" }}>Citas nuevas hoy</div>
                <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: "var(--gp-ink)" }}>{total}</div>
              </div>
            </div>
            <span className={`gp-badge ${diff >= 0 ? "ok" : "danger"}`}>
              {diff >= 0 ? "+" : ""}{diff} vs ayer
            </span>
          </div>
          {total > 0 ? (
            <>
              <div style={{ height: 6, borderRadius: 99, overflow: "hidden", background: "var(--gp-chip)", marginBottom: 12 }}>
                <div style={{ height: "100%", width: `${crmPct}%`, background: "var(--gp-accent)", borderRadius: 99, display: "inline-block" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--gp-accent-soft)", color: "var(--gp-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Briefcase style={{ width: 14, height: 14 }} />
                  </span>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--gp-muted-c)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Admin</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{crm} <span style={{ fontSize: 11, color: "var(--gp-muted-c)", fontWeight: 600 }}>({crmPct}%)</span></div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--gp-info-soft)", color: "var(--gp-info)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Globe style={{ width: 14, height: 14 }} />
                  </span>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--gp-muted-c)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Web</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{web} <span style={{ fontSize: 11, color: "var(--gp-muted-c)", fontWeight: 600 }}>({webPct}%)</span></div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: "var(--gp-muted-c)", margin: 0 }}>Aún no se han creado citas hoy</p>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="gp-kpis">
        <div className="gp-kpi">
          <div className="gp-kpi-top">
            <span className="gp-kpi-ic" style={{ background: "var(--gp-accent-soft)", color: "var(--gp-accent)" }}><Wallet style={{ width: 16, height: 16 }} /></span>
            {stats.weeklyGrowth !== 0 && (
              <span className={`gp-kpi-delta ${stats.weeklyGrowth >= 0 ? "up" : "down"}`}>
                <TrendingUp style={{ width: 11, height: 11 }} />
                {stats.weeklyGrowth >= 0 ? "+" : ""}{stats.weeklyGrowth}%
              </span>
            )}
          </div>
          <div className="gp-kpi-val">{formatCurrency(stats.todayRevenue)}</div>
          <div className="gp-kpi-lbl">Ingresos hoy</div>
        </div>
        <div className="gp-kpi" style={{ cursor: "pointer" }} onClick={() => onNavigate("agenda")}>
          <div className="gp-kpi-top">
            <span className="gp-kpi-ic" style={{ background: "var(--gp-info-soft)", color: "var(--gp-info)" }}><Calendar style={{ width: 16, height: 16 }} /></span>
          </div>
          <div className="gp-kpi-val">{stats.todayBookings}</div>
          <div className="gp-kpi-lbl">Citas hoy</div>
        </div>
        <div className="gp-kpi" style={{ cursor: "pointer" }} onClick={() => onNavigate("clients")}>
          <div className="gp-kpi-top">
            <span className="gp-kpi-ic" style={{ background: "var(--gp-ok-soft)", color: "var(--gp-ok)" }}><MessageCircle style={{ width: 16, height: 16 }} /></span>
            {stats.unreadMessages > 0 && <span className="gp-badge danger" style={{ fontSize: 10, padding: "2px 7px" }}>{stats.unreadMessages}</span>}
          </div>
          <div className="gp-kpi-val">{stats.unreadMessages}</div>
          <div className="gp-kpi-lbl">Mensajes sin leer</div>
        </div>
        <div className="gp-kpi" style={{ cursor: "pointer" }} onClick={() => onNavigate("clients")}>
          <div className="gp-kpi-top">
            <span className="gp-kpi-ic" style={{ background: "var(--gp-warn-soft)", color: "var(--gp-warn)" }}><Star style={{ width: 16, height: 16 }} /></span>
            {stats.pendingReviews > 0 && <span className="gp-badge warn" style={{ fontSize: 10, padding: "2px 7px" }}>{stats.pendingReviews}</span>}
          </div>
          <div className="gp-kpi-val">{stats.pendingReviews}</div>
          <div className="gp-kpi-lbl">Reseñas pendientes</div>
        </div>
      </div>

      {/* Atajos + pedidos */}
      <div className="gp-grid gp-2col">
        {/* Atajos rápidos */}
        <div className="gp-card" style={{ overflow: "hidden" }}>
          <div className="gp-card-h"><h3>Atajos rápidos</h3></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 1, background: "var(--gp-line2)" }}>
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                style={{ border: "none", background: "var(--gp-surface)", padding: "18px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: ".15s", fontFamily: "inherit" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gp-surface-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gp-surface)")}
              >
                <span style={{ width: 40, height: 40, borderRadius: 12, background: `color-mix(in oklab, ${a.color}, white 88%)`, color: a.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{a.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: "var(--gp-ink)" }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pedidos */}
        <div className="gp-card" style={{ overflow: "hidden" }}>
          <div className="gp-card-h">
            <h3>Tienda</h3>
            {stats.pendingOrders > 0 && <span className="gp-badge danger sub"><span className="pip" style={{ background: "currentColor" }} />{stats.pendingOrders} nuevos</span>}
          </div>
          <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 44, height: 44, borderRadius: 13, background: "var(--gp-accent-soft)", color: "var(--gp-accent)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <ShoppingCart style={{ width: 18, height: 18 }} />
              </span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", color: "var(--gp-ink)" }}>{stats.pendingOrders}</div>
                <div style={{ fontSize: 12.5, color: "var(--gp-muted-c)", fontWeight: 600 }}>pedidos pendientes</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 44, height: 44, borderRadius: 13, background: "var(--gp-info-soft)", color: "var(--gp-info)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <Package style={{ width: 18, height: 18 }} />
              </span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", color: "var(--gp-ink)" }}>{formatCurrency(stats.ordersRevenue7d)}</div>
                <div style={{ fontSize: 12.5, color: "var(--gp-muted-c)", fontWeight: 600 }}>{stats.ordersCount7d} pedidos · últimos 7 días</div>
              </div>
            </div>
            <button className="gp-btn primary sm block" style={{ marginTop: 0 }} onClick={navOrders}>
              <ShoppingCart style={{ width: 13, height: 13 }} />
              Ver pedidos
            </button>
          </div>
        </div>
      </div>

      {/* Training — collapsible, shown for tenants < 30 days */}
      {tenantAge < 30 && (
        <Collapsible open={trainingOpen} onOpenChange={setTrainingOpen}>
          <CollapsibleTrigger asChild>
            <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--gp-ink)" }}>📚 Formación</span>
              {trainingOpen ? <ChevronUp style={{ width: 16, height: 16, color: "var(--gp-muted-c)" }} /> : <ChevronDown style={{ width: 16, height: 16, color: "var(--gp-muted-c)" }} />}
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
          <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--gp-ink)" }}>📈 Retorno de inversión</span>
            {roiOpen ? <ChevronUp style={{ width: 16, height: 16, color: "var(--gp-muted-c)" }} /> : <ChevronDown style={{ width: 16, height: 16, color: "var(--gp-muted-c)" }} />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ROICalculator tenantId={tenantId} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
