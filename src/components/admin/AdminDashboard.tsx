import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingChecklist } from "@/components/admin/OnboardingChecklist";
import { TrainingChecklist } from "@/components/admin/content/TrainingChecklist";
import { ROICalculator } from "@/components/admin/content/ROICalculator";
import {
  Calendar,
  Wallet,
  TrendingUp,
  Clock,
  Plus,
  Users,
  UserPlus,
  MessageCircle,
  ShoppingCart,
  Sparkles,
  Star,
  ChevronDown,
  ChevronUp,
  Loader2,
  Globe,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AdminDashboardProps {
  tenantId: string;
  onNavigate: (tab: string) => void;
  onQuickAction: (action: string) => void;
}

interface DashboardStats {
  todayBookings: number;
  todayBookingsWeb: number;
  todayBookingsCrm: number;
  nextBookingTime: string | null;
  nextBookingName: string | null;
  nextBookingService: string | null;
  nextBookingStylist: string | null;
  nextBookingId: string | null;
  todayRevenue: number;
  revenueGrowth: number;
  bookingsGrowth: number;
  newClientsToday: number;
  newClientsGrowth: number;
  occupancy: number;
  occupancyDelta: number;
}

interface TeamMember {
  id: string;
  name: string;
  today: number;
  week: number;
  color: string;
}

type ActivityKind = "booking" | "payment" | "review" | "client";

interface ActivityItem {
  id: string;
  kind: ActivityKind;
  text: string;
  meta: string;
  createdAt: string;
}

const TEAM_COLORS = ["#d6489b", "#7b5bf5", "#06b6d4", "#f59e0b", "#22c55e", "#ef4444"];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);

const firstServiceName = (services: unknown): string | null => {
  if (!Array.isArray(services) || services.length === 0) return null;
  const s = services[0] as { name?: string } | string;
  if (typeof s === "string") return s;
  return s?.name ?? null;
};

const computeDelta = (current: number, previous: number): number => {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

function OccRing({ pct }: { pct: number }) {
  const size = 116,
    stroke = 12,
    r = (size - stroke) / 2,
    c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gp-chip)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--gp-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.03em" }}>{Math.round(pct * 100)}%</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gp-muted-c)" }}>ocupación</span>
      </div>
    </div>
  );
}

const ACTIVITY_TONE: Record<ActivityKind, { color: string; icon: JSX.Element }> = {
  booking: { color: "var(--gp-info)", icon: <Calendar style={{ width: 16, height: 16 }} /> },
  payment: { color: "var(--gp-accent)", icon: <Wallet style={{ width: 16, height: 16 }} /> },
  review: { color: "var(--gp-warn)", icon: <Star style={{ width: 16, height: 16 }} /> },
  client: { color: "var(--gp-ok)", icon: <UserPlus style={{ width: 16, height: 16 }} /> },
};

export function AdminDashboard({ tenantId, onNavigate, onQuickAction }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    todayBookings: 0,
    todayBookingsWeb: 0,
    todayBookingsCrm: 0,
    nextBookingTime: null,
    nextBookingName: null,
    nextBookingService: null,
    nextBookingStylist: null,
    nextBookingId: null,
    todayRevenue: 0,
    revenueGrowth: 0,
    bookingsGrowth: 0,
    newClientsToday: 0,
    newClientsGrowth: 0,
    occupancy: 0,
    occupancyDelta: 0,
  });
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantAge, setTenantAge] = useState<number>(999);
  const [trainingOpen, setTrainingOpen] = useState(true);
  const [roiOpen, setRoiOpen] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
    fetchTenantAge();
  }, [tenantId]);

  const fetchTenantAge = async () => {
    const { data } = await supabase.from("tenants").select("created_at").eq("id", tenantId).single();
    if (data?.created_at) {
      const days = Math.floor((Date.now() - new Date(data.created_at).getTime()) / 86400000);
      setTenantAge(days);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
      const now = format(new Date(), "HH:mm");

      const todayStartIso = `${today}T00:00:00.000Z`;
      const tomorrowStartIso = `${format(new Date(Date.now() + 86400000), "yyyy-MM-dd")}T00:00:00.000Z`;
      const yesterdayStartIso = `${yesterday}T00:00:00.000Z`;

      // Today bookings (full row, ordered by Hora asc)
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, Hora, customer_name, status, stylist, services, canal, created_at")
        .eq("tenant_id", tenantId)
        .eq("Fecha", today)
        .neq("status", "cancelled")
        .order("Hora", { ascending: true });

      const yesterdayBookingsRes = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("Fecha", yesterday)
        .neq("status", "cancelled");

      const todayBookingsList = bookings || [];
      const upcoming = todayBookingsList.filter((b: any) => b.Hora >= now);
      const nextBooking: any = upcoming[0];
      const todayBookingsWeb = todayBookingsList.filter((b: any) => b.canal !== "crm").length;
      const todayBookingsCrm = todayBookingsList.filter((b: any) => b.canal === "crm").length;

      // Transactions today + yesterday for delta
      const { data: transactions } = await supabase
        .from("transactions")
        .select("id, total, created_at, customer_name, stylist")
        .eq("tenant_id", tenantId)
        .gte("created_at", todayStartIso)
        .lt("created_at", tomorrowStartIso)
        .eq("voided", false)
        .order("created_at", { ascending: false });

      const { data: ytx } = await supabase
        .from("transactions")
        .select("total")
        .eq("tenant_id", tenantId)
        .gte("created_at", yesterdayStartIso)
        .lt("created_at", todayStartIso)
        .eq("voided", false);

      const todayRevenue = (transactions || []).reduce((sum: number, t: any) => sum + (t.total || 0), 0);
      const yRevenue = (ytx || []).reduce((sum: number, t: any) => sum + (t.total || 0), 0);
      const revenueGrowth = computeDelta(todayRevenue, yRevenue);

      // Stylists
      const { data: stylistsData } = await supabase
        .from("tenant_stylists")
        .select("id, name, color")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("name");

      const weekStart = new Date();
      const dayOfWeek = weekStart.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      weekStart.setDate(weekStart.getDate() + diff);
      weekStart.setHours(0, 0, 0, 0);
      const weekStartStr = format(weekStart, "yyyy-MM-dd");

      const { data: weekBookings } = await supabase
        .from("bookings")
        .select("stylist")
        .eq("tenant_id", tenantId)
        .gte("Fecha", weekStartStr)
        .neq("status", "cancelled");

      const teamList: TeamMember[] = (stylistsData || []).map((s: any, i: number) => ({
        id: s.id,
        name: s.name,
        color: s.color || TEAM_COLORS[i % TEAM_COLORS.length],
        today: todayBookingsList.filter((b: any) => b.stylist === s.name || b.stylist === s.id).length,
        week: (weekBookings || []).filter((b: any) => b.stylist === s.name || b.stylist === s.id).length,
      }));

      // New clients today + yesterday
      const { data: newClientsTodayRows } = await supabase
        .from("clients")
        .select("id, name, created_at")
        .eq("tenant_id", tenantId)
        .gte("created_at", todayStartIso)
        .lt("created_at", tomorrowStartIso)
        .order("created_at", { ascending: false });
      const newClientsToday = newClientsTodayRows?.length || 0;

      const { count: newClientsYesterday } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("created_at", yesterdayStartIso)
        .lt("created_at", todayStartIso);

      const newClientsGrowth = computeDelta(newClientsToday, newClientsYesterday || 0);

      // Occupancy
      const stylistCount = Math.max(1, (stylistsData || []).length);
      const occupancy = Math.min(1, todayBookingsList.length / (stylistCount * 8));
      const yOccupancy = Math.min(1, (yesterdayBookingsRes.count || 0) / (stylistCount * 8));
      const occupancyDelta = Math.round((occupancy - yOccupancy) * 100);

      const bookingsGrowth = computeDelta(todayBookingsList.length, yesterdayBookingsRes.count || 0);

      // Reviews (last 7 days, via RPC for names)
      const { data: reviewRows } = await supabase.rpc("get_tenant_reviews", { p_tenant_id: tenantId, p_limit: 10 });
      const recentReviews = (reviewRows || []).filter((r: any) => {
        return Date.now() - new Date(r.created_at).getTime() < 7 * 86400000;
      });

      // Recent bookings created (last 24h, by created_at)
      const { data: recentCreatedBookings } = await supabase
        .from("bookings")
        .select("id, customer_name, canal, services, created_at")
        .eq("tenant_id", tenantId)
        .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(15);

      const activityItems: ActivityItem[] = [];

      (recentCreatedBookings || []).forEach((b: any) => {
        const svc = firstServiceName(b.services);
        const channel = b.canal === "crm" ? "manual" : "web";
        activityItems.push({
          id: `booking-${b.id}`,
          kind: "booking",
          text: `Nueva reserva de <b>${b.customer_name}</b>${svc ? ` · ${svc}` : ""}`,
          meta: `vía ${channel} · ${formatDistanceToNow(new Date(b.created_at), { locale: es, addSuffix: true })}`,
          createdAt: b.created_at,
        });
      });

      (transactions || []).forEach((t: any) => {
        activityItems.push({
          id: `tx-${t.id}`,
          kind: "payment",
          text: `Cobro de <b>${t.customer_name || "cliente"}</b> · ${formatCurrency(t.total)}`,
          meta: formatDistanceToNow(new Date(t.created_at), { locale: es, addSuffix: true }),
          createdAt: t.created_at,
        });
      });

      recentReviews.forEach((r: any) => {
        activityItems.push({
          id: `rev-${r.id}`,
          kind: "review",
          text: `<b>${r.reviewer_name || "Cliente"}</b> dejó una reseña de ${r.rating}★`,
          meta: formatDistanceToNow(new Date(r.created_at), { locale: es, addSuffix: true }),
          createdAt: r.created_at,
        });
      });

      (newClientsTodayRows || []).forEach((c: any) => {
        activityItems.push({
          id: `cli-${c.id}`,
          kind: "client",
          text: `Nueva clienta registrada: <b>${c.name}</b>`,
          meta: formatDistanceToNow(new Date(c.created_at), { locale: es, addSuffix: true }),
          createdAt: c.created_at,
        });
      });

      activityItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setTeam(teamList);
      setActivity(activityItems.slice(0, 12));
      setStats({
        todayBookings: todayBookingsList.length,
        todayBookingsWeb,
        todayBookingsCrm,
        nextBookingTime: nextBooking?.Hora ? String(nextBooking.Hora).slice(0, 5) : null,
        nextBookingName: nextBooking?.customer_name || null,
        nextBookingService: firstServiceName(nextBooking?.services),
        nextBookingStylist: nextBooking?.stylist || null,
        nextBookingId: nextBooking?.id || null,
        todayRevenue,
        revenueGrowth,
        bookingsGrowth,
        newClientsToday,
        newClientsGrowth,
        occupancy,
        occupancyDelta,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrainingNavigate = (tab: string) => {
    onNavigate(tab);
  };

  const navOrders = () => onNavigate("pedidos");
  const navWaitlist = () => onNavigate("espera");
  const navMessages = () => onNavigate("mensajes");
  const navActivity = () => onNavigate("actividad");

  if (loading) {
    return (
      <div className="gp-loader">
        <Loader2 className="gp-spinner" />
      </div>
    );
  }

  const quickActions = [
    {
      label: "Cobrar",
      icon: <Wallet style={{ width: 18, height: 18 }} />,
      color: "#7b5bf5",
      onClick: () => onQuickAction("new-payment"),
    },
    {
      label: "Pedidos",
      icon: <ShoppingCart style={{ width: 18, height: 18 }} />,
      color: "#06b6d4",
      onClick: navOrders,
    },
    {
      label: "Lista de espera",
      icon: <Clock style={{ width: 18, height: 18 }} />,
      color: "#f59e0b",
      onClick: navWaitlist,
    },
    {
      label: "Mensajes",
      icon: <MessageCircle style={{ width: 18, height: 18 }} />,
      color: "#22c55e",
      onClick: navMessages,
    },
  ];

  const renderDelta = (value: number) => {
    if (value === 0) return null;
    return (
      <span className={`gp-kpi-delta ${value >= 0 ? "up" : "down"}`}>
        <TrendingUp style={{ width: 11, height: 11, transform: value >= 0 ? undefined : "scaleY(-1)" }} />
        {value >= 0 ? "+" : ""}
        {value}%
      </span>
    );
  };

  const handleRegisterArrival = async () => {
    if (!stats.nextBookingId) return;
    await supabase.from("bookings").update({ status: "arrived" }).eq("id", stats.nextBookingId);
    fetchDashboardStats();
  };

  return (
    <div className="gp-fade" data-tour-target="inicio-stats" style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 24 }}>
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

      {/* Dashboard grid — mobile-first, reorganized per breakpoint */}
      <div className="gp-dash">
        {/* PRÓXIMA CITA */}
        <div className="gp-dash-next gp-card" style={{ overflow: "hidden", position: "relative" }}>
          <div className="gp-next-bg" />
          <div className="gp-next-inner">
            <div className="gp-next-text">
              <span className="gp-badge accent" style={{ marginBottom: 8, display: "inline-flex" }}>
                <Clock style={{ width: 12, height: 12 }} />
                Próxima cita
              </span>
              {stats.nextBookingTime ? (
                <div className="gp-next-row">
                  <span className="gp-next-time">{stats.nextBookingTime}</span>
                  <div className="gp-next-meta">
                    <div className="gp-next-name">{stats.nextBookingName}</div>
                    <div className="gp-next-sub">
                      {stats.nextBookingService
                        ? `${stats.nextBookingService}${
                            stats.nextBookingStylist ? ` · ${stats.nextBookingStylist}` : ""
                          }`
                        : `${stats.todayBookings} citas hoy`}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="gp-next-empty">Sin más citas hoy</div>
              )}
              <div className="gp-next-actions">
                {stats.nextBookingId ? (
                  <button className="gp-btn primary sm" onClick={handleRegisterArrival}>
                    <CheckCircle2 style={{ width: 13, height: 13 }} />
                    <span className="gp-hide-xs">Registrar llegada</span>
                    <span className="gp-show-xs">Llegada</span>
                  </button>
                ) : (
                  <button className="gp-btn primary sm" onClick={() => onQuickAction("new-booking")}>
                    <Sparkles style={{ width: 13, height: 13 }} />
                    Nueva cita
                  </button>
                )}
                <button className="gp-btn sm" onClick={() => onNavigate("agenda")}>
                  <Calendar style={{ width: 13, height: 13 }} />
                  <span className="gp-hide-xs">Ver agenda</span>
                </button>
              </div>
            </div>
            <div className="gp-next-ring">
              <OccRing pct={stats.occupancy} />
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="gp-dash-kpis">
          <div className="gp-kpi">
            <div className="gp-kpi-top">
              <span className="gp-kpi-ic" style={{ background: "var(--gp-accent-soft)", color: "var(--gp-accent)" }}>
                <Wallet style={{ width: 16, height: 16 }} />
              </span>
              {renderDelta(stats.revenueGrowth)}
            </div>
            <div className="gp-kpi-val">{formatCurrency(stats.todayRevenue)}</div>
            <div className="gp-kpi-lbl">Ingresos de hoy</div>
          </div>
          <div className="gp-kpi" style={{ cursor: "pointer" }} onClick={() => onNavigate("agenda")}>
            <div className="gp-kpi-top">
              <span className="gp-kpi-ic" style={{ background: "var(--gp-info-soft)", color: "var(--gp-info)" }}>
                <Calendar style={{ width: 16, height: 16 }} />
              </span>
              {renderDelta(stats.bookingsGrowth)}
            </div>
            <div className="gp-kpi-val">{stats.todayBookings}</div>
            <div className="gp-kpi-lbl">Citas de hoy</div>
            <div className="gp-kpi-tags">
              <span
                className="gp-badge"
                style={{ background: "color-mix(in oklab, var(--gp-info), white 88%)", color: "var(--gp-info)" }}
              >
                <Globe style={{ width: 10, height: 10 }} />
                {stats.todayBookingsWeb} web
              </span>
              <span
                className="gp-badge"
                style={{ background: "color-mix(in oklab, var(--gp-accent), white 88%)", color: "var(--gp-accent)" }}
              >
                <Building2 style={{ width: 10, height: 10 }} />
                {stats.todayBookingsCrm} CRM
              </span>
            </div>
          </div>
          <div className="gp-kpi">
            <div className="gp-kpi-top">
              <span className="gp-kpi-ic" style={{ background: "var(--gp-ok-soft)", color: "var(--gp-ok)" }}>
                <UserPlus style={{ width: 16, height: 16 }} />
              </span>
              {renderDelta(stats.newClientsGrowth)}
            </div>
            <div className="gp-kpi-val">{stats.newClientsToday}</div>
            <div className="gp-kpi-lbl">Clientes nuevos</div>
          </div>
          <div className="gp-kpi">
            <div className="gp-kpi-top">
              <span className="gp-kpi-ic" style={{ background: "var(--gp-warn-soft)", color: "var(--gp-warn)" }}>
                <TrendingUp style={{ width: 16, height: 16 }} />
              </span>
              {stats.occupancyDelta !== 0 && (
                <span className={`gp-kpi-delta ${stats.occupancyDelta >= 0 ? "up" : "down"}`}>
                  <TrendingUp
                    style={{
                      width: 11,
                      height: 11,
                      transform: stats.occupancyDelta >= 0 ? undefined : "scaleY(-1)",
                    }}
                  />
                  {stats.occupancyDelta >= 0 ? "+" : ""}
                  {stats.occupancyDelta}pp
                </span>
              )}
            </div>
            <div className="gp-kpi-val">{Math.round(stats.occupancy * 100)}%</div>
            <div className="gp-kpi-lbl">Ocupación</div>
          </div>
        </div>

        {/* ATAJOS RÁPIDOS */}
        <div className="gp-dash-shortcuts gp-card" style={{ overflow: "hidden" }}>
          <div className="gp-card-h">
            <h3>Atajos rápidos</h3>
          </div>
          <div className="gp-quick-grid">
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                className="gp-quick-btn"
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gp-surface-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gp-surface)")}
              >
                <span
                  className="gp-quick-ic"
                  style={{ background: `color-mix(in oklab, ${a.color}, white 86%)`, color: a.color }}
                >
                  {a.icon}
                </span>
                <span className="gp-quick-lbl">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ACTIVIDAD RECIENTE */}
        <div className="gp-dash-activity gp-card" style={{ overflow: "hidden" }}>
          <div className="gp-card-h" style={{ justifyContent: "space-between" }}>
            <h3>Actividad reciente</h3>
            <button className="gp-btn ghost sm" onClick={navActivity} style={{ fontSize: 12 }}>
              Ver todo
            </button>
          </div>
          {activity.length > 0 ? (
            <div className="gp-list">
              {activity.slice(0, 6).map((item) => {
                const tone = ACTIVITY_TONE[item.kind];
                return (
                  <div className="gp-row" key={item.id}>
                    <span
                      className="gp-act-ic"
                      style={{
                        background: `color-mix(in oklab, ${tone.color}, white 88%)`,
                        color: tone.color,
                      }}
                    >
                      {tone.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="gp-act-text"
                        dangerouslySetInnerHTML={{ __html: item.text }}
                      />
                      <div className="gp-act-meta">{item.meta}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: "20px 18px", fontSize: 13, color: "var(--gp-muted-c)" }}>
              Sin actividad reciente
            </div>
          )}
        </div>

        {/* EQUIPO HOY */}
        <div className="gp-dash-team gp-card">
          <div className="gp-card-h">
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Users style={{ width: 15, height: 15 }} />
              Equipo hoy
            </h3>
          </div>
          {team.length > 0 ? (
            <div className="gp-team-list">
              {team.map((member) => (
                <div key={member.id} className="gp-team-row">
                  <span className="gp-team-avatar" style={{ background: member.color }}>
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="gp-team-info">
                    <div className="gp-team-name">{member.name.split(" ")[0]}</div>
                    <div className="gp-team-sub">{member.today} citas hoy</div>
                  </div>
                  <span className="gp-badge neutral">{member.week}/sem</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "16px 18px", fontSize: 13, color: "var(--gp-muted-c)" }}>
              Sin equipo configurado
            </div>
          )}
        </div>
      </div>

      {/* Training — collapsible, shown for tenants < 30 days */}
      {tenantAge < 30 && (
        <Collapsible open={trainingOpen} onOpenChange={setTrainingOpen}>
          <CollapsibleTrigger asChild>
            <button
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 4px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--gp-ink)" }}>📚 Formación</span>
              {trainingOpen ? (
                <ChevronUp style={{ width: 16, height: 16, color: "var(--gp-muted-c)" }} />
              ) : (
                <ChevronDown style={{ width: 16, height: 16, color: "var(--gp-muted-c)" }} />
              )}
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
          <button
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 4px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--gp-ink)" }}>📈 Retorno de inversión</span>
            {roiOpen ? (
              <ChevronUp style={{ width: 16, height: 16, color: "var(--gp-muted-c)" }} />
            ) : (
              <ChevronDown style={{ width: 16, height: 16, color: "var(--gp-muted-c)" }} />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ROICalculator tenantId={tenantId} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
