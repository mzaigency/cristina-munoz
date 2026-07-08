import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Euro,
  Calendar,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Crown,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Clock,
} from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";

interface NegocioOverviewProps {
  tenantId: string;
  onNavigate: (subTab: string) => void;
}

interface StylistLeader {
  id: string;
  name: string;
  avatar_url: string | null;
  color: string | null;
  revenue: number;
  bookings: number;
  rating: number;
}

interface OverviewData {
  activeStylists: number;
  totalStylists: number;
  monthRevenue: number;
  revenueGoal: number;
  monthBookings: number;
  avgRating: number;
  reviewsCount: number;
  occupancy: number;
  leaders: StylistLeader[];
  bestDay: string | null;
  bestHour: string | null;
  alerts: Array<{ type: string; text: string }>;
}

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function NegocioOverview({ tenantId, onNavigate }: NegocioOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OverviewData>({
    activeStylists: 0,
    totalStylists: 0,
    monthRevenue: 0,
    revenueGoal: 0,
    monthBookings: 0,
    avgRating: 0,
    reviewsCount: 0,
    occupancy: 0,
    leaders: [],
    bestDay: null,
    bestHour: null,
    alerts: [],
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const monthStartISO = monthStart.toISOString();
      const monthEndISO = monthEnd.toISOString();
      const monthStartDate = format(monthStart, "yyyy-MM-dd");
      const monthEndDate = format(monthEnd, "yyyy-MM-dd");

      const [stylistsRes, txRes, goalRes, bookingsRes, reviewsRes, businessHoursRes] = await Promise.all([
        supabase
          .from("tenant_stylists")
          .select("id, name, avatar_url, color, is_active")
          .eq("tenant_id", tenantId),
        supabase
          .from("transactions")
          .select("total, stylist_id, created_at")
          .eq("tenant_id", tenantId)
          .eq("voided", false)
          .gte("created_at", monthStartISO)
          .lte("created_at", monthEndISO),
        supabase
          .from("monthly_goals")
          .select("revenue_goal")
          .eq("tenant_id", tenantId)
          .eq("month", now.getMonth() + 1)
          .eq("year", now.getFullYear())
          .maybeSingle(),
        supabase
          .from("bookings")
          .select("Fecha, Hora, stylist", { count: "exact" })
          .eq("tenant_id", tenantId)
          .gte("Fecha", monthStartDate)
          .lte("Fecha", monthEndDate),
        supabase
          .from("reviews")
          .select("rating")
          .eq("tenant_id", tenantId)
          .eq("approved", true),
        supabase
          .from("tenant_business_hours")
          .select("day_of_week, is_open")
          .eq("tenant_id", tenantId),
      ]);

      if (cancelled) return;

      const stylists = (stylistsRes.data ?? []) as Array<{
        id: string;
        name: string;
        avatar_url: string | null;
        color: string | null;
        is_active: boolean | null;
      }>;
      const activeStylists = stylists.filter((s) => s.is_active !== false).length;

      const txs = (txRes.data ?? []) as Array<{
        total: number;
        stylist_id: string | null;
        created_at: string;
      }>;
      const monthRevenue = txs.reduce((acc, t) => acc + Number(t.total ?? 0), 0);
      const revenueGoal = Number((goalRes.data as { revenue_goal: number | null } | null)?.revenue_goal ?? 0);

      const bookings = (bookingsRes.data ?? []) as Array<{
        Fecha: string;
        Hora: string;
        stylist: string | null;
      }>;
      const monthBookings = bookingsRes.count ?? bookings.length;

      const reviews = (reviewsRes.data ?? []) as Array<{ rating: number; stylist_id: string | null }>;
      const avgRating =
        reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

      // Leaderboard
      const byStylist = new Map<string, { revenue: number; bookings: number; ratingSum: number; ratingCount: number }>();
      stylists.forEach((s) => {
        byStylist.set(s.id, { revenue: 0, bookings: 0, ratingSum: 0, ratingCount: 0 });
      });
      txs.forEach((t) => {
        if (!t.stylist_id) return;
        const entry = byStylist.get(t.stylist_id);
        if (entry) entry.revenue += Number(t.total ?? 0);
      });
      // bookings.stylist is text (name) — match by name
      const nameToId = new Map(stylists.map((s) => [s.name, s.id]));
      bookings.forEach((b) => {
        if (!b.stylist) return;
        const id = nameToId.get(b.stylist);
        if (!id) return;
        const entry = byStylist.get(id);
        if (entry) entry.bookings += 1;
      });
      reviews.forEach((r) => {
        if (!r.stylist_id) return;
        const entry = byStylist.get(r.stylist_id);
        if (entry) {
          entry.ratingSum += r.rating;
          entry.ratingCount += 1;
        }
      });
      const leaders: StylistLeader[] = stylists
        .map((s) => {
          const entry = byStylist.get(s.id);
          return {
            id: s.id,
            name: s.name,
            avatar_url: s.avatar_url,
            color: s.color,
            revenue: entry?.revenue ?? 0,
            bookings: entry?.bookings ?? 0,
            rating: entry && entry.ratingCount > 0 ? entry.ratingSum / entry.ratingCount : 0,
          };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);

      // Best day + hour
      const dayCount = [0, 0, 0, 0, 0, 0, 0];
      const hourCount = new Array(24).fill(0) as number[];
      bookings.forEach((b) => {
        if (!b.Fecha) return;
        const d = new Date(b.Fecha + "T00:00:00");
        dayCount[d.getDay()] += 1;
        if (b.Hora) {
          const h = parseInt(b.Hora.split(":")[0] || "0", 10);
          if (!Number.isNaN(h) && h >= 0 && h < 24) hourCount[h] += 1;
        }
      });
      let bestDayIdx = -1;
      let bestDayVal = 0;
      dayCount.forEach((v, i) => {
        if (v > bestDayVal) {
          bestDayVal = v;
          bestDayIdx = i;
        }
      });
      let bestHourIdx = -1;
      let bestHourVal = 0;
      hourCount.forEach((v, i) => {
        if (v > bestHourVal) {
          bestHourVal = v;
          bestHourIdx = i;
        }
      });

      // Naive occupancy: bookings / (active stylists * open days * 8 slots)
      const businessHours = (businessHoursRes.data ?? []) as Array<{ day_of_week: number; is_open: boolean | null }>;
      const openDays = businessHours.filter((d) => d.is_open !== false).length || 6;
      const monthDays = Math.round((monthEnd.getTime() - monthStart.getTime()) / 86400000) + 1;
      const capacityRough = Math.max(1, activeStylists * Math.round((openDays / 7) * monthDays) * 8);
      const occupancy = Math.min(100, Math.round((monthBookings / capacityRough) * 100));

      // Alerts
      const alerts: Array<{ type: string; text: string }> = [];
      if (revenueGoal > 0) {
        const dayOfMonth = now.getDate();
        const projection = (monthRevenue / dayOfMonth) * monthDays;
        if (projection < revenueGoal * 0.85 && dayOfMonth > 7) {
          const gap = Math.round(((revenueGoal - projection) / revenueGoal) * 100);
          alerts.push({
            type: "goal",
            text: `Objetivo del mes en riesgo. Vas ${gap}% por debajo de la proyección.`,
          });
        }
      } else if (now.getDate() > 5) {
        alerts.push({ type: "goal", text: "Sin objetivo definido este mes." });
      }
      if (activeStylists === 0) {
        alerts.push({ type: "stylist", text: "No hay estilistas activos. Activa al menos uno." });
      }

      setData({
        activeStylists,
        totalStylists: stylists.length,
        monthRevenue,
        revenueGoal,
        monthBookings,
        avgRating,
        reviewsCount: reviews.length,
        occupancy,
        leaders,
        bestDay: bestDayIdx >= 0 ? DAY_NAMES[bestDayIdx] : null,
        bestHour: bestHourIdx >= 0 ? `${bestHourIdx.toString().padStart(2, "0")}:00` : null,
        alerts,
      });
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const goalPct = useMemo(() => {
    if (data.revenueGoal <= 0) return 0;
    return Math.min(100, Math.round((data.monthRevenue / data.revenueGoal) * 100));
  }, [data.monthRevenue, data.revenueGoal]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Loader2 className="gp-spinner" />
      </div>
    );
  }

  const monthLabel = format(new Date(), "MMMM yyyy", { locale: es });

  return (
    <div className="gp-fade gp-neg-overview">
      {/* Hero KPIs */}
      <div className="gp-mkt-kpis">
        <NegKpi
          label="Equipo activo"
          value={data.activeStylists}
          sub={`de ${data.totalStylists}`}
          icon={<Users />}
          tone="brand"
          onClick={() => onNavigate("equipo")}
        />
        <NegKpi
          label="Citas este mes"
          value={data.monthBookings}
          sub={`${data.occupancy}% ocupación`}
          icon={<Calendar />}
          tone="accent"
          onClick={() => onNavigate("estadisticas")}
        />
        <NegKpi
          label="Ingresos mes"
          value={`${Math.round(data.monthRevenue).toLocaleString("es-ES")}€`}
          sub={data.revenueGoal > 0 ? `de ${data.revenueGoal}€` : "Sin objetivo"}
          icon={<Euro />}
          tone="ok"
          onClick={() => onNavigate("estadisticas")}
        />
        <NegKpi
          label="Valoración"
          value={data.avgRating ? data.avgRating.toFixed(1) : "—"}
          sub={`${data.reviewsCount} reseñas`}
          icon={<Star />}
          tone="warn"
          onClick={() => onNavigate("estadisticas")}
        />
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="gp-neg-alerts">
          {data.alerts.map((a, i) => (
            <div key={i} className="gp-mkt-alert">
              <AlertTriangle style={{ width: 16, height: 16 }} />
              <div>
                <strong>{a.text}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Goal ring + leaderboard */}
      <div className="gp-mkt-grid-2">
        <section className="gp-card pad gp-mkt-card gp-neg-goal">
          <div className="gp-mkt-card-h">
            <div>
              <h3>Objetivo de {monthLabel}</h3>
              <p>
                {data.revenueGoal > 0
                  ? `${Math.round(data.monthRevenue)}€ / ${data.revenueGoal}€`
                  : "Define tu meta este mes"}
              </p>
            </div>
            <button className="gp-btn sm" onClick={() => onNavigate("objetivos")}>
              <Target style={{ width: 13, height: 13 }} /> Ajustar
            </button>
          </div>
          <div className="gp-neg-ring-wrap">
            <GoalRing pct={goalPct} hasGoal={data.revenueGoal > 0} />
            <div className="gp-neg-ring-meta">
              <span className="gp-neg-ring-pct">{goalPct}%</span>
              <span className="gp-neg-ring-sub">
                {data.revenueGoal > 0
                  ? goalPct >= 100
                    ? "Objetivo superado 🎉"
                    : `Faltan ${Math.max(0, data.revenueGoal - Math.round(data.monthRevenue))}€`
                  : "Sin meta"}
              </span>
            </div>
          </div>
        </section>

        <section className="gp-card pad gp-mkt-card">
          <div className="gp-mkt-card-h">
            <div>
              <h3>Top equipo</h3>
              <p>Por ingresos este mes</p>
            </div>
            <button className="gp-btn sm" onClick={() => onNavigate("equipo")}>
              Ver equipo <ArrowRight style={{ width: 13, height: 13 }} />
            </button>
          </div>
          {data.leaders.length === 0 ? (
            <div className="gp-mkt-empty">
              <Users />
              <p>Sin datos de equipo</p>
            </div>
          ) : (
            <div className="gp-neg-leaders">
              {data.leaders.map((l, i) => (
                <div key={l.id} className="gp-neg-leader">
                  <div className="gp-neg-leader-rank tone-rank">
                    {i === 0 ? <Crown style={{ width: 13, height: 13 }} /> : `#${i + 1}`}
                  </div>
                  <div
                    className="gp-neg-leader-avatar"
                    style={{ background: l.color || "var(--gp-accent)" }}
                  >
                    {l.avatar_url ? (
                      <img src={l.avatar_url} alt={l.name} />
                    ) : (
                      <span>{l.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="gp-neg-leader-info">
                    <strong>{l.name}</strong>
                    <span>
                      {l.bookings} citas
                      {l.rating > 0 && (
                        <>
                          {" · "}
                          {l.rating.toFixed(1)}★
                        </>
                      )}
                    </span>
                  </div>
                  <div className="gp-neg-leader-revenue">
                    {Math.round(l.revenue).toLocaleString("es-ES")}€
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Insights */}
      <section className="gp-card pad gp-mkt-card">
        <div className="gp-mkt-card-h">
          <div>
            <h3>Insights del mes</h3>
            <p>Patrones detectados en {monthLabel}</p>
          </div>
        </div>
        <div className="gp-neg-insights">
          <div className="gp-neg-insight">
            <div className="gp-mkt-quick-ic" style={{ background: "var(--gp-accent-soft)", color: "var(--gp-accent)" }}>
              <Calendar />
            </div>
            <div>
              <span>Mejor día</span>
              <strong>{data.bestDay ?? "—"}</strong>
            </div>
          </div>
          <div className="gp-neg-insight">
            <div className="gp-mkt-quick-ic" style={{ background: "var(--gp-warn-soft)", color: "var(--gp-warn)" }}>
              <Clock />
            </div>
            <div>
              <span>Hora pico</span>
              <strong>{data.bestHour ?? "—"}</strong>
            </div>
          </div>
          <div className="gp-neg-insight">
            <div className="gp-mkt-quick-ic" style={{ background: "var(--gp-ok-soft)", color: "var(--gp-ok)" }}>
              <TrendingUp />
            </div>
            <div>
              <span>Ticket medio</span>
              <strong>
                {data.monthBookings > 0
                  ? `${Math.round(data.monthRevenue / data.monthBookings)}€`
                  : "—"}
              </strong>
            </div>
          </div>
          <div className="gp-neg-insight">
            <div className="gp-mkt-quick-ic" style={{ background: "color-mix(in oklab, var(--gp-mkt-rose), white 80%)", color: "var(--gp-mkt-rose)" }}>
              <Trophy />
            </div>
            <div>
              <span>Top earner</span>
              <strong>{data.leaders[0]?.name ?? "—"}</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function NegKpi({
  label,
  value,
  sub,
  icon,
  tone,
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  tone: "brand" | "accent" | "warn" | "ok";
  onClick: () => void;
}) {
  return (
    <button className={`gp-mkt-kpi tone-${tone}`} onClick={onClick} type="button">
      <span className="gp-mkt-kpi-ic">{icon}</span>
      <span className="gp-mkt-kpi-value">{value}</span>
      <span className="gp-mkt-kpi-label">{label}</span>
      {sub && <span className="gp-mkt-kpi-sub">{sub}</span>}
    </button>
  );
}

function GoalRing({ pct, hasGoal }: { pct: number; hasGoal: boolean }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const safePct = Math.max(0, Math.min(100, pct));
  const offset = c - (safePct / 100) * c;
  return (
    <svg viewBox="0 0 140 140" className="gp-neg-ring-svg" aria-hidden>
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--gp-line)" strokeWidth="12" />
      {hasGoal && (
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="url(#gp-ring-grad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
        />
      )}
      <defs>
        <linearGradient id="gp-ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--gp-ok)" />
          <stop offset="100%" stopColor="var(--gp-accent)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default NegocioOverview;
