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
  UserPlus,
  MessageCircle,
  ShoppingCart,
  Star,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Loader2,
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

const initialsOf = (name?: string | null): string => {
  if (!name) return "·";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

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
  const [upNext, setUpNext] = useState<{ time: string; name: string }[]>([]);
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
      const upNextList = upcoming.slice(1, 4).map((b: any) => ({
        time: String(b.Hora).slice(0, 5),
        name: (b.customer_name || "").trim().split(/\s+/)[0] || "Cita",
      }));
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
      setUpNext(upNextList);
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



  return (
    <div className="gp-fade" data-tour-target="inicio-stats" style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 24 }}>
      <OnboardingChecklist tenantId={tenantId} onNavigate={onNavigate} />

      {/* ── Dashboard rediseñado (import Stitch tal cual, datos reales) ── */}
      <div className="flex flex-col gap-6 font-body text-on-background">

        {/* Título */}
        <div className="flex flex-col gap-1 pt-1">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-on-background">
            Resumen <span className="text-gradient">del día</span>
          </h2>
          <p className="text-sm sm:text-base text-outline font-medium">
            {format(new Date(), "EEEE d 'de' MMMM · yyyy", { locale: es })}
          </p>
        </div>

        {/* PRÓXIMA CITA — tarjeta limpia, color solo como acento */}
        <div
          onClick={() => onNavigate("agenda")}
          className="relative bg-surface-container-lowest rounded-[1.25rem] shadow-ambient overflow-hidden cursor-pointer active:scale-[.99] transition-transform duration-200"
        >
          <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-gradient" />
          <div className="p-4 pl-5">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-primary min-w-0">
                <span
                  className="w-2 h-2 rounded-full flex-none bg-[#16A249]"
                  style={{ boxShadow: "0 0 0 3px rgba(22,162,73,.18)" }}
                />
                {(() => {
                  if (!stats.nextBookingTime) return "Próxima cita";
                  const [h, m] = stats.nextBookingTime.split(":").map(Number);
                  const mins = h * 60 + m - (new Date().getHours() * 60 + new Date().getMinutes());
                  if (mins <= 0) return "Próxima cita · ahora";
                  if (mins < 60) return `Próxima cita · en ${mins} min`;
                  const hh = Math.floor(mins / 60);
                  return `Próxima cita · en ${hh} h ${mins % 60 > 0 ? `${mins % 60} min` : ""}`.trim();
                })()}
              </span>
              <ChevronRight className="w-[18px] h-[18px] text-outline flex-none" />
            </div>
            {stats.nextBookingTime ? (
              <>
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-full flex items-center justify-center flex-none font-display text-base font-bold text-white bg-brand-gradient">
                    {initialsOf(stats.nextBookingName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2.5 min-w-0">
                      <span className="font-display text-3xl font-extrabold tracking-tight text-on-background leading-none flex-none">
                        {stats.nextBookingTime}
                      </span>
                      <span className="font-display text-lg font-bold text-on-background truncate">
                        {stats.nextBookingName}
                      </span>
                    </div>
                    <p className="text-sm text-outline font-medium mt-0.5 truncate">
                      {stats.nextBookingService
                        ? `${stats.nextBookingService}${
                            stats.nextBookingStylist ? ` · con ${stats.nextBookingStylist}` : ""
                          }`
                        : `${stats.todayBookings} citas hoy`}
                    </p>
                  </div>
                </div>
                {upNext.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-outline-variant/40 flex items-center gap-2 flex-wrap text-xs text-outline">
                    <span className="font-bold text-on-surface-variant">Luego</span>
                    {upNext.map((u, i) => (
                      <span key={i} className="inline-flex items-center gap-2 whitespace-nowrap">
                        {i > 0 && <span className="opacity-40">·</span>}
                        {u.time} {u.name}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm font-semibold text-outline py-1">Sin más citas hoy</div>
            )}
          </div>
        </div>

        {/* KPIs 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          {/* Ingresos */}
          <div className="bg-surface-container-lowest rounded-[1rem] p-4 shadow-ambient flex flex-col justify-between">
            <div className="flex justify-between items-start mb-3">
              <span className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <Wallet className="w-[18px] h-[18px]" />
              </span>
              {stats.revenueGrowth !== 0 && (
                <span className="bg-[#E7F6EC] text-[#16A249] text-xs font-bold px-2 py-1 rounded-full inline-flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" style={{ transform: stats.revenueGrowth >= 0 ? undefined : "scaleY(-1)" }} />
                  {stats.revenueGrowth >= 0 ? "+" : ""}{stats.revenueGrowth}%
                </span>
              )}
            </div>
            <div>
              <p className="text-sm text-outline mb-0.5">Ingresos hoy</p>
              <p className="font-display text-2xl font-extrabold text-on-background">{formatCurrency(stats.todayRevenue)}</p>
            </div>
          </div>
          {/* Citas */}
          <div
            onClick={() => onNavigate("agenda")}
            className="bg-surface-container-lowest rounded-[1rem] p-4 shadow-ambient flex flex-col justify-between cursor-pointer"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Calendar className="w-[18px] h-[18px]" />
              </span>
              <div className="flex flex-col gap-1 items-end">
                <span className="bg-surface-container-high text-on-surface-variant text-xs font-semibold px-2 py-0.5 rounded-full">{stats.todayBookingsWeb} web</span>
                <span className="bg-surface-container-high text-on-surface-variant text-xs font-semibold px-2 py-0.5 rounded-full">{stats.todayBookingsCrm} CRM</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-outline mb-0.5">Citas hoy</p>
              <p className="font-display text-2xl font-extrabold text-on-background">{stats.todayBookings}</p>
            </div>
          </div>
          {/* Clientes nuevos */}
          <div className="bg-surface-container-lowest rounded-[1rem] p-4 shadow-ambient flex flex-col justify-between">
            <div className="flex justify-between items-start mb-3">
              <span className="w-10 h-10 rounded-full bg-[#E7F6EC] flex items-center justify-center text-[#16A249]">
                <UserPlus className="w-[18px] h-[18px]" />
              </span>
              {stats.newClientsGrowth !== 0 && (
                <span className="bg-[#E7F6EC] text-[#16A249] text-xs font-bold px-2 py-1 rounded-full inline-flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" style={{ transform: stats.newClientsGrowth >= 0 ? undefined : "scaleY(-1)" }} />
                  {stats.newClientsGrowth >= 0 ? "+" : ""}{stats.newClientsGrowth}%
                </span>
              )}
            </div>
            <div>
              <p className="text-sm text-outline mb-0.5">Clientes nuevos</p>
              <p className="font-display text-2xl font-extrabold text-on-background">{stats.newClientsToday}</p>
            </div>
          </div>
          {/* Ocupación */}
          <div className="bg-surface-container-lowest rounded-[1rem] p-4 shadow-ambient flex flex-col justify-between">
            <div className="flex justify-between items-start mb-3">
              <span className="w-10 h-10 rounded-full bg-[#FEF3E0] flex items-center justify-center text-[#F59E0B]">
                <TrendingUp className="w-[18px] h-[18px]" />
              </span>
              {stats.occupancyDelta !== 0 && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full inline-flex items-center gap-1 ${stats.occupancyDelta >= 0 ? "bg-[#E7F6EC] text-[#16A249]" : "bg-[#FDEAEA] text-[#EF4343]"}`}>
                  <TrendingUp className="w-3 h-3" style={{ transform: stats.occupancyDelta >= 0 ? undefined : "scaleY(-1)" }} />
                  {stats.occupancyDelta >= 0 ? "+" : ""}{stats.occupancyDelta}pp
                </span>
              )}
            </div>
            <div>
              <p className="text-sm text-outline mb-0.5">Ocupación</p>
              <p className="font-display text-2xl font-extrabold text-on-background">{Math.round(stats.occupancy * 100)}%</p>
            </div>
          </div>
        </div>

        {/* ATAJOS RÁPIDOS */}
        <div>
          <h3 className="font-headline text-lg font-bold text-on-background mb-3">Atajos rápidos</h3>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((a) => (
              <button key={a.label} onClick={a.onClick} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
                <span className="w-full aspect-square rounded-[1.25rem] bg-surface-container-lowest shadow-ambient flex items-center justify-center">
                  <span
                    className="w-11 h-11 rounded-full flex items-center justify-center"
                    style={{ background: `color-mix(in oklab, ${a.color}, white 86%)`, color: a.color }}
                  >
                    {a.icon}
                  </span>
                </span>
                <span className="text-xs font-semibold text-on-surface-variant text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ACTIVIDAD + EQUIPO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actividad reciente */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-[1.25rem] p-5 shadow-ambient">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-headline text-lg font-bold text-on-background">Actividad reciente</h3>
              <button onClick={navActivity} className="text-primary font-semibold text-sm hover:underline">Ver todo</button>
            </div>
            {activity.length > 0 ? (
              <ul className="flex flex-col gap-5">
                {activity.slice(0, 6).map((item) => {
                  const tone = ACTIVITY_TONE[item.kind];
                  return (
                    <li key={item.id} className="flex items-start gap-4">
                      <span
                        className="w-10 h-10 rounded-full flex-none flex items-center justify-center mt-0.5"
                        style={{ background: `color-mix(in oklab, ${tone.color}, white 88%)`, color: tone.color }}
                      >
                        {tone.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-background" dangerouslySetInnerHTML={{ __html: item.text }} />
                        <p className="text-xs text-outline mt-0.5">{item.meta}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-outline py-2">Sin actividad reciente</p>
            )}
          </div>
          {/* Equipo hoy */}
          <div className="bg-surface-container-lowest rounded-[1.25rem] p-5 shadow-ambient">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-headline text-lg font-bold text-on-background">Equipo hoy</h3>
              {team.length > 0 && (
                <span className="bg-surface-container-low text-primary text-xs font-bold px-2.5 py-1 rounded-full">{team.length} activos</span>
              )}
            </div>
            {team.length > 0 ? (
              <>
                <ul className="flex flex-col gap-5">
                  {team.map((member) => (
                    <li key={member.id} className="flex items-center gap-3">
                      <span
                        className="w-11 h-11 rounded-full flex items-center justify-center font-display font-bold text-base flex-none text-white"
                        style={{ background: member.color }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-on-background truncate">{member.name.split(" ")[0]}</p>
                        <p className="text-sm text-outline truncate">{member.today} citas hoy</p>
                      </div>
                      <span className="bg-surface-container-high text-on-surface-variant text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">{member.week}/sem</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => onNavigate("negocio")}
                  className="w-full mt-5 py-3 border border-outline-variant/50 rounded-full text-primary font-semibold hover:bg-surface-container-low transition-colors"
                >
                  Gestionar turnos
                </button>
              </>
            ) : (
              <p className="text-sm text-outline py-2">Sin equipo configurado</p>
            )}
          </div>
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
