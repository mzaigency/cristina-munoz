import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Euro, Calendar, ArrowUpRight, Sparkles } from "lucide-react";
import { DemoShell } from "./_shared/DemoShell";
import { demoStats, demoWeeklyData, demoPopularServices } from "./demoData";

// Paleta exacta de BusinessStats
const COLORS = ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#6366F1"];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

/**
 * Clon visual de BusinessStats real:
 * - Selector de periodo (Semana/Mes/Trimestre)
 * - Tarjetas KPI con flechas de tendencia
 * - AreaChart de ingresos con gradiente violeta
 * - PieChart de servicios populares con paleta exacta
 */
const DemoAnalytics = () => {
  return (
    <DemoShell>
      <div className="bg-background min-h-full p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              Analytics
            </h2>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </div>
          <div className="flex gap-1 p-0.5 bg-muted rounded-md">
            <div className="px-2 py-0.5 rounded text-[10px] text-muted-foreground">7d</div>
            <div className="px-2 py-0.5 rounded text-[10px] bg-background font-medium shadow-sm">
              30d
            </div>
            <div className="px-2 py-0.5 rounded text-[10px] text-muted-foreground">90d</div>
          </div>
        </div>

        {/* KPIs con comparativas (estilo BusinessStats) */}
        <div className="grid grid-cols-2 gap-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border p-3 bg-card"
          >
            <div className="flex items-center justify-between mb-1">
              <Euro className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex items-center gap-0.5 text-[9px] font-medium text-emerald-600">
                <ArrowUpRight className="h-2.5 w-2.5" />
                +{demoStats.weeklyGrowth}%
              </div>
            </div>
            <p className="text-base font-bold">{formatCurrency(demoStats.monthRevenue)}</p>
            <p className="text-[10px] text-muted-foreground">Ingresos</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border border-border p-3 bg-card"
          >
            <div className="flex items-center justify-between mb-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex items-center gap-0.5 text-[9px] font-medium text-emerald-600">
                <ArrowUpRight className="h-2.5 w-2.5" />
                +12%
              </div>
            </div>
            <p className="text-base font-bold">{demoStats.bookingsMonth}</p>
            <p className="text-[10px] text-muted-foreground">Reservas</p>
          </motion.div>
        </div>

        {/* AreaChart de ingresos con gradiente */}
        <div className="rounded-xl border border-border p-3 bg-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold">Evolución ingresos</p>
            <p className="text-[10px] text-muted-foreground">
              {formatCurrency(demoStats.weekRevenue)} esta semana
            </p>
          </div>
          <div style={{ width: "100%", height: 110 }}>
            <ResponsiveContainer>
              <AreaChart data={demoWeeklyData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="demoRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  fill="url(#demoRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PieChart servicios populares */}
        <div className="rounded-xl border border-border p-3 bg-card">
          <p className="text-xs font-semibold mb-2">Top servicios</p>
          <div className="flex items-center gap-3">
            <div style={{ width: 90, height: 90 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={demoPopularServices}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={20}
                    outerRadius={42}
                    paddingAngle={2}
                  >
                    {demoPopularServices.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1">
              {demoPopularServices.slice(0, 4).map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5 text-[10px]">
                  <div
                    className="w-2 h-2 rounded-sm shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="flex-1 truncate text-foreground">{s.name}</span>
                  <span className="text-muted-foreground font-mono">{s.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DemoShell>
  );
};

export default DemoAnalytics;
