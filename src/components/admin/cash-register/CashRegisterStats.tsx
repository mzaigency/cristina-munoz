import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, TrendingUp, Users, Scissors, Award } from "lucide-react";
import { format, subDays, startOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GP_CHART, GP_CHART_COLORS } from "@/components/admin/chartPalette";

type Period = "week" | "month" | "quarter";

interface DailyData {
  date: string;
  total: number;
  cash: number;
  card: number;
  mixed: number;
}

interface StylistStats {
  id: string;
  name: string;
  color: string;
  total: number;
  transactions: number;
  avgTicket: number;
  tips: number;
  services: number;
}

interface ServiceStats {
  name: string;
  count: number;
  revenue: number;
}

const COLORS = GP_CHART_COLORS;

export const CashRegisterStats = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("week");
  const [data, setData] = useState<DailyData[]>([]);
  const [stylistStats, setStylistStats] = useState<StylistStats[]>([]);
  const [serviceStats, setServiceStats] = useState<ServiceStats[]>([]);
  const [totals, setTotals] = useState({
    total: 0,
    cash: 0,
    card: 0,
    mixed: 0,
    avgDaily: 0,
    avgTicket: 0,
    transactionCount: 0,
    tips: 0,
    discounts: 0,
  });

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case "week": startDate = subDays(now, 7); break;
        case "month": startDate = startOfMonth(now); break;
        case "quarter": startDate = subMonths(startOfMonth(now), 2); break;
        default: startDate = subDays(now, 7);
      }

      // Get tenant stylists first
      const { data: stylists } = await supabase
        .from("tenant_stylists")
        .select("id, name, color");

      const stylistMap = new Map(stylists?.map(s => [s.id, s]) || []);

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .eq("voided", false)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group by date
      const grouped: Record<string, DailyData> = {};
      const stylistData: Record<string, StylistStats> = {};
      const serviceData: Record<string, ServiceStats> = {};
      let totalTips = 0;
      let totalDiscounts = 0;

      (transactions || []).forEach((tx: Record<string, unknown>) => {
        const dateKey = format(new Date(tx.created_at as string), "yyyy-MM-dd");
        const paymentMethod = tx.payment_method as string;
        const total = Number(tx.total) || 0;
        const tipAmount = Number(tx.tip_amount) || 0;
        const discount = Number(tx.discount) || 0;
        const stylistId = tx.stylist_id as string;

        // Daily data
        if (!grouped[dateKey]) {
          grouped[dateKey] = { date: dateKey, total: 0, cash: 0, card: 0, mixed: 0 };
        }
        grouped[dateKey].total += total;
        if (paymentMethod === "cash") grouped[dateKey].cash += total;
        else if (paymentMethod === "card") grouped[dateKey].card += total;
        else if (paymentMethod === "mixed") grouped[dateKey].mixed += total;

        // Stylist data
        if (stylistId && stylistMap.has(stylistId)) {
          const stylist = stylistMap.get(stylistId)!;
          if (!stylistData[stylistId]) {
            stylistData[stylistId] = {
              id: stylistId,
              name: stylist.name,
              color: stylist.color || GP_CHART.purple,
              total: 0,
              transactions: 0,
              avgTicket: 0,
              tips: 0,
              services: 0,
            };
          }
          stylistData[stylistId].total += total;
          stylistData[stylistId].transactions += 1;
          stylistData[stylistId].tips += tipAmount;

          // Count services
          const services = tx.services as Array<{ name: string; quantity?: number; total?: number; price?: number }> | null;
          if (Array.isArray(services)) {
            services.forEach(svc => {
              const qty = svc.quantity || 1;
              stylistData[stylistId].services += qty;

              // Service stats
              if (!serviceData[svc.name]) {
                serviceData[svc.name] = { name: svc.name, count: 0, revenue: 0 };
              }
              serviceData[svc.name].count += qty;
              serviceData[svc.name].revenue += svc.total || (svc.price || 0) * qty;
            });
          }
        }

        totalTips += tipAmount;
        totalDiscounts += discount;
      });

      // Calculate avg tickets
      Object.values(stylistData).forEach(s => {
        s.avgTicket = s.transactions > 0 ? s.total / s.transactions : 0;
      });

      const chartData = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
      const stylistArray = Object.values(stylistData).sort((a, b) => b.total - a.total);
      const serviceArray = Object.values(serviceData).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

      const totalAmount = chartData.reduce((sum, d) => sum + d.total, 0);
      const cashAmount = chartData.reduce((sum, d) => sum + d.cash, 0);
      const cardAmount = chartData.reduce((sum, d) => sum + d.card, 0);
      const mixedAmount = chartData.reduce((sum, d) => sum + d.mixed, 0);
      const txCount = transactions?.length || 0;

      setData(chartData);
      setStylistStats(stylistArray);
      setServiceStats(serviceArray);
      setTotals({
        total: totalAmount,
        cash: cashAmount,
        card: cardAmount,
        mixed: mixedAmount,
        avgDaily: chartData.length > 0 ? totalAmount / chartData.length : 0,
        avgTicket: txCount > 0 ? totalAmount / txCount : 0,
        transactionCount: txCount,
        tips: totalTips,
        discounts: totalDiscounts,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);

  const formatDateLabel = (dateStr: string) =>
    format(new Date(dateStr), "d MMM", { locale: es });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Period Selector */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1">
        {(["week", "month", "quarter"] as Period[]).map(p => (
          <Button key={p} variant={period === p ? "default" : "outline"} size="sm" onClick={() => setPeriod(p)} className="h-8 sm:h-9 text-xs sm:text-sm px-2.5 sm:px-3 shrink-0">
            {p === "week" ? "Semana" : p === "month" ? "Mes" : "Trimestre"}
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <Card>
          <CardContent className="p-2.5 sm:p-4">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
            <p className="text-base sm:text-xl font-bold text-primary truncate">{formatCurrency(totals.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 sm:p-4">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Ticket medio</p>
            <p className="text-base sm:text-xl font-bold truncate">{formatCurrency(totals.avgTicket)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 sm:p-4">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Transacciones</p>
            <p className="text-base sm:text-xl font-bold">{totals.transactionCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 sm:p-4">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Propinas</p>
            <p className="text-base sm:text-xl font-bold text-[var(--gp-purple-ink)] truncate">{formatCurrency(totals.tips)}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-2.5 sm:p-4">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Descuentos</p>
            <p className="text-base sm:text-xl font-bold text-[var(--gp-warn-ink)] truncate">-{formatCurrency(totals.discounts)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="overview" className="gap-1 py-2 text-xs sm:text-sm">
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" /><span className="hidden xs:inline sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="stylists" className="gap-1 py-2 text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" /><span className="hidden xs:inline sm:inline">Estilistas</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-1 py-2 text-xs sm:text-sm">
            <Scissors className="h-3.5 w-3.5 sm:h-4 sm:w-4" /><span className="hidden xs:inline sm:inline">Servicios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          {data.length > 0 ? (
            <>
              <Card>
                <CardHeader className="p-3 sm:p-6"><CardTitle className="text-sm sm:text-lg">Ingresos diarios</CardTitle></CardHeader>
                <CardContent className="p-2 sm:p-6 pt-0">
                  <div className="h-[200px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" tickFormatter={formatDateLabel} className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} />
                        <YAxis tickFormatter={(v) => `${v}€`} className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} width={40} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(label) => format(new Date(label), "d MMMM yyyy", { locale: es })} />
                        <Line type="monotone" dataKey="total" name="Total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3 sm:p-6"><CardTitle className="text-sm sm:text-lg">Por método de pago</CardTitle></CardHeader>
                <CardContent className="p-2 sm:p-6 pt-0">
                  <div className="h-[200px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" tickFormatter={formatDateLabel} className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} />
                        <YAxis tickFormatter={(v) => `${v}€`} className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} width={40} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(label) => format(new Date(label), "d MMMM yyyy", { locale: es })} />
                        <Bar dataKey="cash" name="Efectivo" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} stackId="a" />
                        <Bar dataKey="card" name="Tarjeta" fill="hsl(217, 91%, 60%)" radius={[0, 0, 0, 0]} stackId="a" />
                        <Bar dataKey="mixed" name="Mixto" fill="hsl(280, 65%, 60%)" radius={[4, 4, 0, 0]} stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8 sm:py-12 text-muted-foreground">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm">No hay datos para el período seleccionado</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="stylists" className="space-y-4 mt-4">
          {stylistStats.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Award className="h-5 w-5" />Ranking por ingresos</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {stylistStats.map((s, i) => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: s.color }}>{i + 1}</div>
                          <div>
                            <p className="font-medium">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.transactions} transacciones</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(s.total)}</p>
                          <p className="text-xs text-muted-foreground">Ticket: {formatCurrency(s.avgTicket)}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-lg">Distribución de ingresos</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={stylistStats} dataKey="total" nameKey="name" cx="50%" cy="50%"
                            outerRadius={100} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                            {stylistStats.map((s, i) => (
                              <Cell key={s.id} fill={s.color || COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-lg">Detalle por estilista</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Estilista</th>
                          <th className="text-right py-2">Ingresos</th>
                          <th className="text-right py-2">Transacciones</th>
                          <th className="text-right py-2">Servicios</th>
                          <th className="text-right py-2">Ticket medio</th>
                          <th className="text-right py-2">Propinas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stylistStats.map(s => (
                          <tr key={s.id} className="border-b last:border-0">
                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                                {s.name}
                              </div>
                            </td>
                            <td className="text-right font-medium">{formatCurrency(s.total)}</td>
                            <td className="text-right">{s.transactions}</td>
                            <td className="text-right">{s.services}</td>
                            <td className="text-right">{formatCurrency(s.avgTicket)}</td>
                            <td className="text-right text-[var(--gp-purple-ink)]">{formatCurrency(s.tips)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay datos de estilistas para el período seleccionado</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="services" className="space-y-4 mt-4">
          {serviceStats.length > 0 ? (
            <Card>
              <CardHeader><CardTitle className="text-lg">Top 10 servicios más vendidos</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickFormatter={(v) => `${v}€`} className="text-xs" />
                      <YAxis type="category" dataKey="name" width={150} className="text-xs" />
                      <Tooltip formatter={(value: number, name) => name === "revenue" ? formatCurrency(value) : value}
                        labelFormatter={(label) => label} />
                      <Bar dataKey="revenue" name="Ingresos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 space-y-2">
                  {serviceStats.map((s, i) => (
                    <div key={s.name} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{i + 1}</Badge>
                        <span>{s.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">{s.count}x</span>
                        <span className="font-medium">{formatCurrency(s.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Scissors className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay datos de servicios para el período seleccionado</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
