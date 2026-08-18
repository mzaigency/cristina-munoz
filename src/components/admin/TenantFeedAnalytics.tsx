import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
  favorites: "#f43f5e",
  foryou: "#22408b",
  popular: "#f59e0b",
  near: "#3b82f6",
  today: "#10b981",
  new: "#99329a",
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-1 p-3">
        <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className={`p-1.5 rounded-xl ${gradient}`}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="text-lg font-bold tracking-tight">{value}</div>
        {sub && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Métricas del feed
        </h2>
        <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              size="sm"
              variant={days === r.value ? "default" : "ghost"}
              onClick={() => setDays(r.value)}
              className="h-7 px-3 text-xs rounded-lg"
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <KPI
          title="Impresiones"
          value={loading ? "—" : totals.impressions.toLocaleString()}
          icon={Eye}
          gradient="bg-gradient-to-br from-[var(--gp-info)] to-[var(--gp-info-ink)]"
        />
        <KPI
          title="Clics"
          value={loading ? "—" : totals.clicks.toLocaleString()}
          sub={`CTR ${pct(totals.clicks, totals.impressions)}`}
          icon={MousePointerClick}
          gradient="bg-gradient-to-br from-[var(--gp-warn)] to-[var(--gp-warn-ink)]"
        />
        <KPI
          title="Reservas"
          value={loading ? "—" : totals.conversions.toLocaleString()}
          sub={`CVR ${pct(totals.conversions, totals.clicks)}`}
          icon={Sparkles}
          gradient="bg-gradient-to-br from-[var(--gp-ok)] to-[var(--gp-ok-ink)]"
        />
        <KPI
          title="Conv. global"
          value={
            loading ? "—" : pct(totals.conversions, totals.impressions)
          }
          sub="reservas / impresiones"
          icon={Trophy}
          gradient="bg-gradient-to-br from-[var(--gp-purple)] to-[var(--gp-purple-ink)]"
        />
      </div>

      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm">Por sección</CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0 space-y-3">
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : chartData.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
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
                          fill={SECTION_COLOR[d.rawId] || "#22408b"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-xs">
                  <thead className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/30">
                    <tr>
                      <th className="text-left p-2.5">Sección</th>
                      <th className="text-right p-2.5">Imp.</th>
                      <th className="text-right p-2.5">Clics</th>
                      <th className="text-right p-2.5">CTR</th>
                      <th className="text-right p-2.5">Conv.</th>
                      <th className="text-right p-2.5">CVR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((r) => (
                      <tr
                        key={r.rawId}
                        className="border-t hover:bg-muted/20"
                      >
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{
                                background:
                                  SECTION_COLOR[r.rawId] || "#22408b",
                              }}
                            />
                            <span className="font-medium">{r.section}</span>
                          </div>
                        </td>
                        <td className="p-2.5 text-right tabular-nums">
                          {r.impressions.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right tabular-nums">
                          {r.clicks.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right tabular-nums">
                          {r.ctr}%
                        </td>
                        <td className="p-2.5 text-right tabular-nums">
                          {r.conversions.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right tabular-nums font-semibold text-[var(--gp-ok-ink)]">
                          {r.cvr}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm">Evolución diaria</CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : dailyData.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
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
                    stroke="#22408b"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    name="Clics"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="conversions"
                    name="Reservas"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantFeedAnalytics;
