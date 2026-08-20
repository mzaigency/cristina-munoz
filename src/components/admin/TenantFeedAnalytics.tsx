import { useEffect, useMemo, useState } from "react";
import { chartColor } from "@/lib/chartColors";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, MousePointerClick, Eye, Sparkles, Trophy } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface SectionRow {
  section_id: string;
  impressions: number;
  clicks: number;
  conversions: number;
}
interface DailyRow {
  day: string;
  impressions: number;
  clicks: number;
  conversions: number;
}

const SECTION_LABEL: Record<string, string> = {
  favorites: "Tus favoritos",
  foryou: "Para ti",
  popular: "En tendencia",
  near: "Cerca de ti",
  today: "Huecos hoy",
  new: "Recién llegados",
};

const SECTION_COLOR: Record<string, string> = {
  favorites: chartColor(5),
  foryou: "var(--glow-brand)",
  popular: chartColor(3),
  near: chartColor(0),
  today: chartColor(2),
  new: "var(--glow-accent)",
};

const RANGES = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
];

const pct = (n: number, d: number) =>
  d > 0 ? `${((n / d) * 100).toFixed(1)}%` : "—";

interface Props {
  tenantId: string;
}

export const TenantFeedAnalytics = ({ tenantId }: Props) => {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [daily, setDaily] = useState<DailyRow[]>([]);

  useEffect(() => {
    if (!tenantId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [s, d] = await Promise.all([
          supabase.rpc("get_tenant_feed_section_metrics" as any, {
            p_tenant_id: tenantId,
            days,
          }),
          supabase.rpc("get_tenant_feed_daily_metrics" as any, {
            p_tenant_id: tenantId,
            days,
          }),
        ]);
        setSections((s.data as SectionRow[]) || []);
        setDaily((d.data as DailyRow[]) || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [days, tenantId]);

  const totals = useMemo(
    () =>
      sections.reduce(
        (acc, r) => ({
          impressions: acc.impressions + Number(r.impressions || 0),
          clicks: acc.clicks + Number(r.clicks || 0),
          conversions: acc.conversions + Number(r.conversions || 0),
        }),
        { impressions: 0, clicks: 0, conversions: 0 },
      ),
    [sections],
  );

  const chartData = useMemo(
    () =>
      sections.map((s) => {
        const imp = Number(s.impressions);
        const clk = Number(s.clicks);
        const cv = Number(s.conversions);
        return {
          section: SECTION_LABEL[s.section_id] || s.section_id,
          rawId: s.section_id,
          impressions: imp,
          clicks: clk,
          conversions: cv,
          ctr: imp > 0 ? +((clk / imp) * 100).toFixed(2) : 0,
          cvr: clk > 0 ? +((cv / clk) * 100).toFixed(2) : 0,
        };
      }),
    [sections],
  );

  const dailyData = useMemo(
    () =>
      daily.map((d) => ({
        day: new Date(d.day).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
        }),
        impressions: Number(d.impressions),
        clicks: Number(d.clicks),
        conversions: Number(d.conversions),
      })),
    [daily],
  );

  const KPI = ({
    title,
    value,
    icon: Icon,
    sub,
    gradient,
  }: {
    title: string;
    value: string | number;
    icon: any;
    sub?: string;
    gradient: string;
  }) => (
    <div className="glow-card">
      <div className="glow-card-h"><div>
        <h3>
          {title}
        </h3>
        <div className={`p-1.5 rounded-xl ${gradient}`}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
      </div></div>
      <div className="glow-card-b">
        <div className="text-lg font-bold tracking-tight">{value}</div>
        {sub && (
          <p className="text-[10px] text-outline mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-on-surface flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Métricas del feed
        </h2>
        <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
          {RANGES.map((r) => (
            <button className="glow-btn glow-btn--primary glow-btn--sm h-7 px-3 text-xs rounded-lg" key={r.value} onClick={() => setDays(r.value)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <KPI
          title="Impresiones"
          value={loading ? "—" : totals.impressions.toLocaleString()}
          icon={Eye}
          gradient="bg-gradient-to-br from-glow-brand to-glow-brand"
        />
        <KPI
          title="Clics"
          value={loading ? "—" : totals.clicks.toLocaleString()}
          sub={`CTR ${pct(totals.clicks, totals.impressions)}`}
          icon={MousePointerClick}
          gradient="bg-gradient-to-br from-glow-warn to-glow-warn"
        />
        <KPI
          title="Reservas"
          value={loading ? "—" : totals.conversions.toLocaleString()}
          sub={`CVR ${pct(totals.conversions, totals.clicks)}`}
          icon={Sparkles}
          gradient="bg-gradient-to-br from-glow-ok to-glow-ok"
        />
        <KPI
          title="Conv. global"
          value={
            loading ? "—" : pct(totals.conversions, totals.impressions)
          }
          sub="reservas / impresiones"
          icon={Trophy}
          gradient="bg-gradient-to-br from-glow-accent to-glow-accent"
        />
      </div>

      <div className="glow-card">
        <div className="glow-card-h"><div>
          <h3>Por sección</h3>
        </div></div>
        <div className="glow-card-b">
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : chartData.length === 0 ? (
            <div className="py-12 text-center text-sm text-outline">
              Aún no hay eventos en este periodo.
            </div>
          ) : (
            <>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="section"
                      tick={{ fontSize: 10 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis tick={{ fontSize: 10 }} width={36} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="impressions"
                      name="Impresiones"
                      radius={[6, 6, 0, 0]}
                    >
                      {chartData.map((d) => (
                        <Cell
                          key={d.rawId}
                          fill={SECTION_COLOR[d.rawId] || "var(--glow-brand)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Una matriz, no una tabla: seis columnas numéricas no caben en
                  375px y obligaban a hacer scroll lateral sin avisar. */}
              <div className="overflow-hidden rounded-[18px] border border-line">
                {chartData.map((r) => (
                  <div key={r.rawId} className="border-b border-line-soft p-3 last:border-b-0">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="h-2 w-2 flex-none rounded-full"
                        style={{ background: SECTION_COLOR[r.rawId] || "var(--glow-brand)" }}
                      />
                      <span className="truncate text-[13.5px] font-bold text-on-surface">{r.section}</span>
                    </div>
                    <div className="flex items-end justify-between gap-1">
                      {[
                        { k: "Imp.", v: r.impressions.toLocaleString() },
                        { k: "Clics", v: r.clicks.toLocaleString() },
                        { k: "CTR", v: `${r.ctr}%` },
                        { k: "Conv.", v: r.conversions.toLocaleString() },
                        { k: "CVR", v: `${r.cvr}%`, ok: true },
                      ].map((m) => (
                        <div key={m.k} className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-extrabold uppercase tracking-wider text-outline">
                            {m.k}
                          </p>
                          <p
                            className={`truncate text-[13.5px] font-bold tabular-nums ${
                              m.ok ? "text-glow-ok-ink" : "text-on-surface"
                            }`}
                          >
                            {m.v}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="glow-card">
        <div className="glow-card-h"><div>
          <h3>Evolución diaria</h3>
        </div></div>
        <div className="glow-card-b">
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : dailyData.length === 0 ? (
            <div className="py-12 text-center text-sm text-outline">
              Sin actividad en este periodo.
            </div>
          ) : (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={36} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="impressions"
                    name="Impresiones"
                    stroke="var(--glow-brand)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    name="Clics"
                    stroke={chartColor(3)}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="conversions"
                    name="Reservas"
                    stroke={chartColor(2)}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantFeedAnalytics;
