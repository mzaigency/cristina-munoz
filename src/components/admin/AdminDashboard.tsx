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
  ChevronDown,
  ChevronUp,
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
  nextBookingTime: string | null;
  nextBookingName: string | null;
  nextBookingService: string | null;
  nextBookingStylist: string | null;
  todayRevenue: number;
  weeklyGrowth: number;
  newClientsToday: number;
  occupancy: number;
  pendingOrders: number;
}

interface TeamMember {
  name: string;
  today: number;
  week: number;
  color: string;
}

interface ActivityItem {
  id: string;
  text: string;
  time: string;
  tone: "accent" | "ok" | "warn" | "info";
}

const TEAM_COLORS = ["#d6489b", "#7b5bf5", "#06b6d4", "#f59e0b", "#22c55e", "#ef4444"];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);

function OccRing({ pct }: { pct: number }) {
  const size = 116, stroke = 12, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gp-chip)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gp-accent)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.03em" }}>{Math.round(pct * 100)}%</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gp-muted-c)" }}>ocupación</span>
      </div>
    </div>
  );
}

export function AdminDashboard({ tenantId, onNavigate, onQuickAction }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    todayBookings: 0,
    nextBookingTime: null,
    nextBookingName: null,
    nextBookingService: null,
    nextBookingStylist: null,
    todayRevenue: 0,
    weeklyGrowth: 0,
    newClientsToday: 0,
    occupancy: 0,
    pendingOrders: 0,
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

      const { data: bookings } = await supabase
        .from("bookings")
        .select("Hora, customer_name, status, Stylist, Servicio")
        .eq("tenant_id", tenantId)
        .eq("Fecha", today)
        .neq("status", "cancelled")
        .order("Hora", { ascending: true });

      const upcomingBookings = (bookings || []).filter((b: any) => b.Hora >= now);
      const nextBooking: any = upcomingBookings[0];

      const { data: transactions } = await supabase
        .from("transactions")
        .select("id, total, created_at, customer_name")
        .eq("tenant_id", tenantId)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`)
        .eq("voided", false)
        .order("created_at", { ascending: false });

      const todayRevenue = (transactions || []).reduce((sum: number, t: any) => sum + (t.total || 0), 0);

      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const { data: thisWeekTx } = await supabase.from("transactions").select("total").eq("tenant_id", tenantId).gte("created_at", weekAgo.toISOString()).eq("voided", false);
      const { data: lastWeekTx } = await supabase.from("transactions").select("total").eq("tenant_id", tenantId).gte("created_at", twoWeeksAgo.toISOString()).lt("created_at", weekAgo.toISOString()).eq("voided", false);
      const thisWeekTotal = (thisWeekTx || []).reduce((sum: number, t: any) => sum + (t.total || 0), 0);
      const lastWeekTotal = (lastWeekTx || []).reduce((sum: number, t: any) => sum + (t.total || 0), 0);
      const weeklyGrowth = lastWeekTotal > 0 ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) : 0;

      const { data: stylistsData } = await supabase
        .from("stylists")
        .select("id, name, color")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("name");

      const weekStart = new Date();
      const dayOfWeek = weekStart.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      weekStart.setDate(weekStart.getDate() + diff);
      const weekStartStr = format(weekStart, "yyyy-MM-dd");

      const { data: weekBookings } = await supabase
        .from("bookings")
        .select("Stylist")
        .eq("tenant_id", tenantId)
        .gte("Fecha", weekStartStr)
        .neq("status", "cancelled");

      const teamList: TeamMember[] = (stylistsData || []).map((s: any, i: number) => ({
        name: s.name,
        color: s.color || TEAM_COLORS[i % TEAM_COLORS.length],
        today: (bookings || []).filter((b: any) => b.Stylist === s.name || b.Stylist === s.id).length,
        week: (weekBookings || []).filter((b: any) => b.Stylist === s.name || b.Stylist === s.id).length,
      }));

      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      const { count: newClientsToday } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("created_at", todayStart.toISOString())
        .lt("created_at", tomorrowStart.toISOString());

      const stylistCount = Math.max(1, (stylistsData || []).length);
      const occupancy = Math.min(1, (bookings || []).length / (stylistCount * 8));

      const { count: pendingOrdersCount } = await supabase
        .from("product_orders")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "pending");

      const activityItems: ActivityItem[] = (transactions || []).slice(0, 5).map((t: any, i: number) => ({
        id: `tx-${i}`,
        text: t.customer_name
          ? `Cobro de <b>${t.customer_name}</b> · ${formatCurrency(t.total)}`
          : `Cobro registrado · ${formatCurrency(t.total)}`,
        time: formatDistanceToNow(new Date(t.created_at), { locale: es, addSuffix: true }),
        tone: "accent" as const,
      }));

      setTeam(teamList);
      setActivity(activityItems);
      setStats({
        todayBookings: (bookings || []).length,
        nextBookingTime: nextBooking?.Hora || null,
        nextBookingName: nextBooking?.customer_name || null,
        nextBookingService: nextBooking?.Servicio || null,
        nextBookingStylist: nextBooking?.Stylist || null,
        todayRevenue,
        weeklyGrowth,
        newClientsToday: newClientsToday || 0,
        occupancy,
        pendingOrders: pendingOrdersCount || 0,
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

  const quickActions = [
    { label: "Cobrar", icon: <Wallet style={{ width: 18, height: 18 }} />, color: "var(--gp-accent)", onClick: () => onQuickAction("new-payment") },
    { label: "Pedidos", icon: <ShoppingCart style={{ width: 18, height: 18 }} />, color: "var(--gp-info)", onClick: navOrders },
    { label: "Mensajes", icon: <MessageCircle style={{ width: 18, height: 18 }} />, color: "var(--gp-ok)", onClick: () => onNavigate("clients") },
    { label: "Nueva cita", icon: <Plus style={{ width: 18, height: 18 }} />, color: "var(--gp-warn)", onClick: () => onQuickAction("new-booking") },
  ];

  const toneColors: Record<string, string> = {
    accent: "var(--gp-accent)",
    ok: "var(--gp-ok)",
    warn: "var(--gp-warn)",
    info: "var(--gp-info)",
  };

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

      {/* Hero: próxima cita + OccRing  |  Equipo hoy */}
      <div className="gp-grid gp-2col">
        <div className="gp-card" style={{ overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 130% at 90% -10%, color-mix(in oklab, var(--gp-accent), transparent 86%), transparent 60%)" }} />
          <div style={{ position: "relative", padding: 22, display: "flex", gap: 26, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <span className="gp-badge accent" style={{ marginBottom: 10, display: "inline-flex" }}>
                <Clock style={{ width: 12, height: 12 }} />
                Próxima cita
              </span>
              {stats.nextBookingTime ? (
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 6 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-.03em", color: "var(--gp-accent)" }}>{stats.nextBookingTime}</span>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "var(--gp-ink)" }}>{stats.nextBookingName}</div>
                    <div style={{ fontSize: 13.5, color: "var(--gp-muted-c)", fontWeight: 600 }}>
                      {stats.nextBookingService
                        ? `${stats.nextBookingService}${stats.nextBookingStylist ? ` · ${stats.nextBookingStylist}` : ""}`
                        : `${stats.todayBookings} citas hoy en total`}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--gp-muted-c)", padding: "8px 0" }}>Sin más citas hoy</div>
              )}
              <div style={{ display: "flex", gap: 9, marginTop: 16 }}>
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
            <OccRing pct={stats.occupancy} />
          </div>
        </div>

        <div className="gp-card pad">
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 14, display: "flex", alignItems: "center", gap: 8, color: "var(--gp-ink)" }}>
            <Users style={{ width: 15, height: 15 }} />
            <span>Equipo hoy</span>
          </div>
          {team.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {team.map((member) => (
                <div key={member.name} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 11, background: member.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 800, flex: "none" }}>
                    {member.name.charAt(0)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.name.split(" ")[0]}</div>
                    <div style={{ fontSize: 11.5, color: "var(--gp-muted-c)", fontWeight: 600 }}>{member.today} citas hoy</div>
                  </div>
                  <span className="gp-badge neutral">{member.week}/sem</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--gp-muted-c)", margin: 0 }}>Sin equipo configurado</p>
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
          <div className="gp-kpi-lbl">Ingresos de hoy</div>
        </div>
        <div className="gp-kpi" style={{ cursor: "pointer" }} onClick={() => onNavigate("agenda")}>
          <div className="gp-kpi-top">
            <span className="gp-kpi-ic" style={{ background: "var(--gp-info-soft)", color: "var(--gp-info)" }}><Calendar style={{ width: 16, height: 16 }} /></span>
          </div>
          <div className="gp-kpi-val">{stats.todayBookings}</div>
          <div className="gp-kpi-lbl">Citas de hoy</div>
        </div>
        <div className="gp-kpi">
          <div className="gp-kpi-top">
            <span className="gp-kpi-ic" style={{ background: "var(--gp-ok-soft)", color: "var(--gp-ok)" }}><UserPlus style={{ width: 16, height: 16 }} /></span>
          </div>
          <div className="gp-kpi-val">{stats.newClientsToday}</div>
          <div className="gp-kpi-lbl">Clientes nuevos</div>
        </div>
        <div className="gp-kpi">
          <div className="gp-kpi-top">
            <span className="gp-kpi-ic" style={{ background: "var(--gp-warn-soft)", color: "var(--gp-warn)" }}><TrendingUp style={{ width: 16, height: 16 }} /></span>
          </div>
          <div className="gp-kpi-val">{Math.round(stats.occupancy * 100)}%</div>
          <div className="gp-kpi-lbl">Ocupación</div>
        </div>
      </div>

      {/* Atajos rápidos + Actividad reciente */}
      <div className="gp-grid gp-2col">
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

        <div className="gp-card" style={{ overflow: "hidden" }}>
          <div className="gp-card-h"><h3>Actividad reciente</h3></div>
          {activity.length > 0 ? (
            <div className="gp-list">
              {activity.map((item) => (
                <div className="gp-row" key={item.id}>
                  <span style={{ width: 38, height: 38, borderRadius: 11, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: `color-mix(in oklab, ${toneColors[item.tone]}, white 88%)`, color: toneColors[item.tone] }}>
                    <Wallet style={{ width: 16, height: 16 }} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--gp-ink)" }} dangerouslySetInnerHTML={{ __html: item.text }} />
                    <div style={{ fontSize: 12, color: "var(--gp-muted-c)", fontWeight: 600, marginTop: 1 }}>{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "20px 18px", fontSize: 13, color: "var(--gp-muted-c)" }}>Sin actividad reciente</div>
          )}
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
