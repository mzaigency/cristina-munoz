import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "recharts";

type SectionId = "favorites" | "foryou" | "popular" | "near" | "today" | "new";

interface SectionRow {
  section_id: string;
  impressions: number;
  clicks: number;
  conversions: number;
}
interface TenantRow {
  tenant_id: string;
  tenant_name: string | null;
  section_id: string;
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
  foryou: "#22408C",
  popular: "#f59e0b",
  near: "#3b82f6",
  today: "#10b981",
  new: "#98329A",
};

const RANGES = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
];

const pct = (n: number, d: number) =>
  d > 0 ? `${((n / d) * 100).toFixed(1)}%` : "—";

export const FeedAnalytics = () => {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | "all">("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, t] = await Promise.all([
          supabase.rpc("get_feed_section_metrics" as any, { days }),
          supabase.rpc("get_feed_tenant_metrics" as any, { days, limit_count: 100 }),
        ]);
        setSections((s.data as SectionRow[]) || []);
        setTenants((t.data as TenantRow[]) || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [days]);

  const totals = useMemo(() => {
    return sections.reduce(
      (acc, r) => ({
        impressions: acc.impressions + Number(r.impressions || 0),
        clicks: acc.clicks + Number(r.clicks || 0),
        conversions: acc.conversions + Number(r.conversions || 0),
      }),
      { impressions: 0, clicks: 0, conversions: 0 },
    );
  }, [sections]);

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
          ctr: imp > 0 ? +(clk / imp * 100).toFixed(2) : 0,
          cvr: clk > 0 ? +(cv / clk * 100).toFixed(2) : 0,
        };
      }),
    [sections],
  );

  const tenantsFiltered = useMemo(() => {
    const list =
      selectedSection === "all"
        ? tenants
        : tenants.filter((t) => t.section_id === selectedSection);
    // Aggregate per tenant if "all"
    if (selectedSection === "all") {
      const agg = new Map<string, TenantRow>();
      for (const r of list) {
        const cur = agg.get(r.tenant_id) || {
          tenant_id: r.tenant_id,
          tenant_name: r.tenant_name,
          section_id: "all",
          impressions: 0,
          clicks: 0,
          conversions: 0,
        };
        cur.impressions = Number(cur.impressions) + Number(r.impressions);
        cur.clicks = Number(cur.clicks) + Number(r.clicks);
        cur.conversions = Number(cur.conversions) + Number(r.conversions);
        agg.set(r.tenant_id, cur);
      }
      return [...agg.values()].sort(
        (a, b) => Number(b.impressions) - Number(a.impressions),
      );
    }
    return [...list].sort(
      (a, b) => Number(b.impressions) - Number(a.impressions),
    );
  }, [tenants, selectedSection]);

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
    <Card className="bg-card/40 backdrop-blur-xl border-white/[0.08]">
      <CardHeader className="flex flex-row items-center justify-between pb-1 p-3.5">
        <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className={`p-1.5 rounded-xl ${gradient}`}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="p-3.5 pt-0">
        <div className="text-xl font-bold tracking-tight">{value}</div>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Range selector */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Métricas del feed
        </h2>
        <div className="flex items-center gap-1 bg-card/40 backdrop-blur-xl border border-white/[0.08] rounded-xl p-1">
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

      {/* KPIs globales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI
          title="Impresiones"
          value={loading ? "—" : totals.impressions.toLocaleString()}
          icon={Eye}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
        <KPI
          title="Clics"
          value={loading ? "—" : totals.clicks.toLocaleString()}
          sub={`CTR ${pct(totals.clicks, totals.impressions)}`}
          icon={MousePointerClick}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <KPI
          title="Conversiones"
          value={loading ? "—" : totals.conversions.toLocaleString()}
          sub={`CVR ${pct(totals.conversions, totals.clicks)}`}
          icon={Sparkles}
          gradient="bg-gradient-to-br from-emerald-500 to-green-600"
        />
        <KPI
          title="Conv. global"
          value={loading ? "—" : pct(totals.conversions, totals.impressions)}
          sub="conversiones / impresiones"
          icon={Trophy}
          gradient="bg-gradient-to-br from-purple-500 to-pink-600"
        />
      </div>

      {/* Tabla por sección */}
      <Card className="bg-card/40 backdrop-blur-xl border-white/[0.08]">
        <CardHeader className="p-3.5 pb-2">
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
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="section" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} width={36} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="impressions" name="Impresiones" radius={[6, 6, 0, 0]}>
                      {chartData.map((d) => (
                        <Cell key={d.rawId} fill={SECTION_COLOR[d.rawId] || "#22408C"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                <table className="w-full text-xs">
                  <thead className="text-[10px] uppercase tracking-wider text-muted-foreground bg-white/[0.03]">
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
                        className="border-t border-white/[0.04] hover:bg-white/[0.02] cursor-pointer"
                        onClick={() => setSelectedSection(r.rawId)}
                      >
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: SECTION_COLOR[r.rawId] || "#22408C" }}
                            />
                            <span className="font-medium">{r.section}</span>
                          </div>
                        </td>
                        <td className="p-2.5 text-right tabular-nums">{r.impressions.toLocaleString()}</td>
                        <td className="p-2.5 text-right tabular-nums">{r.clicks.toLocaleString()}</td>
                        <td className="p-2.5 text-right tabular-nums">{r.ctr}%</td>
                        <td className="p-2.5 text-right tabular-nums">{r.conversions.toLocaleString()}</td>
                        <td className="p-2.5 text-right tabular-nums font-semibold text-emerald-600">{r.cvr}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Por peluquería */}
      <Card className="bg-card/40 backdrop-blur-xl border-white/[0.08]">
        <CardHeader className="p-3.5 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Por peluquería</CardTitle>
          <div className="flex items-center gap-1 flex-wrap">
            <Badge
              onClick={() => setSelectedSection("all")}
              variant={selectedSection === "all" ? "default" : "secondary"}
              className="cursor-pointer text-[10px] h-6"
            >
              Todas
            </Badge>
            {(Object.keys(SECTION_LABEL) as SectionId[]).map((id) => (
              <Badge
                key={id}
                onClick={() => setSelectedSection(id)}
                variant={selectedSection === id ? "default" : "secondary"}
                className="cursor-pointer text-[10px] h-6"
              >
                {SECTION_LABEL[id]}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : tenantsFiltered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Sin datos para esta sección.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase tracking-wider text-muted-foreground bg-white/[0.03]">
                  <tr>
                    <th className="text-left p-2.5">Peluquería</th>
                    {selectedSection === "all" && <th className="text-left p-2.5 hidden md:table-cell">—</th>}
                    {selectedSection !== "all" && <th className="text-left p-2.5 hidden md:table-cell">Sección</th>}
                    <th className="text-right p-2.5">Imp.</th>
                    <th className="text-right p-2.5">Clics</th>
                    <th className="text-right p-2.5">CTR</th>
                    <th className="text-right p-2.5">Conv.</th>
                    <th className="text-right p-2.5">CVR</th>
                  </tr>
                </thead>
                <tbody>
                  {tenantsFiltered.slice(0, 50).map((r) => {
                    const imp = Number(r.impressions);
                    const clk = Number(r.clicks);
                    const cv = Number(r.conversions);
                    return (
                      <tr key={`${r.tenant_id}-${r.section_id}`} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="p-2.5 font-medium truncate max-w-[180px]">
                          {r.tenant_name || r.tenant_id.slice(0, 8)}
                        </td>
                        <td className="p-2.5 hidden md:table-cell text-muted-foreground">
                          {selectedSection === "all" ? "—" : SECTION_LABEL[r.section_id] || r.section_id}
                        </td>
                        <td className="p-2.5 text-right tabular-nums">{imp.toLocaleString()}</td>
                        <td className="p-2.5 text-right tabular-nums">{clk.toLocaleString()}</td>
                        <td className="p-2.5 text-right tabular-nums">{pct(clk, imp)}</td>
                        <td className="p-2.5 text-right tabular-nums">{cv.toLocaleString()}</td>
                        <td className="p-2.5 text-right tabular-nums font-semibold text-emerald-600">{pct(cv, clk)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedAnalytics;
