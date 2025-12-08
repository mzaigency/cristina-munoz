import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
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
  Legend,
} from "recharts";

type Period = "week" | "month" | "quarter";

interface DailyData {
  date: string;
  total: number;
  cash: number;
  card: number;
  cris: number;
  desi: number;
}

export const CashRegisterStats = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("week");
  const [data, setData] = useState<DailyData[]>([]);
  const [totals, setTotals] = useState({
    total: 0,
    cash: 0,
    card: 0,
    cris: 0,
    desi: 0,
    avgDaily: 0,
    transactionCount: 0,
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
        case "week":
          startDate = subDays(now, 7);
          break;
        case "month":
          startDate = startOfMonth(now);
          break;
        case "quarter":
          startDate = subMonths(startOfMonth(now), 2);
          break;
        default:
          startDate = subDays(now, 7);
      }

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .eq("voided", false)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group by date
      const grouped: Record<string, DailyData> = {};
      
      (transactions || []).forEach((tx: any) => {
        const dateKey = format(new Date(tx.created_at), "yyyy-MM-dd");
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            date: dateKey,
            total: 0,
            cash: 0,
            card: 0,
            cris: 0,
            desi: 0,
          };
        }

        grouped[dateKey].total += Number(tx.total);
        grouped[dateKey][tx.payment_method as "cash" | "card"] += Number(tx.total);
        grouped[dateKey][tx.stylist.toLowerCase() as "cris" | "desi"] += Number(tx.total);
      });

      const chartData = Object.values(grouped).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      // Calculate totals
      const totalAmount = chartData.reduce((sum, d) => sum + d.total, 0);
      const cashAmount = chartData.reduce((sum, d) => sum + d.cash, 0);
      const cardAmount = chartData.reduce((sum, d) => sum + d.card, 0);
      const crisAmount = chartData.reduce((sum, d) => sum + d.cris, 0);
      const desiAmount = chartData.reduce((sum, d) => sum + d.desi, 0);

      setData(chartData);
      setTotals({
        total: totalAmount,
        cash: cashAmount,
        card: cardAmount,
        cris: crisAmount,
        desi: desiAmount,
        avgDaily: chartData.length > 0 ? totalAmount / chartData.length : 0,
        transactionCount: transactions?.length || 0,
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDateLabel = (dateStr: string) => {
    return format(new Date(dateStr), "d MMM", { locale: es });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        <Button
          variant={period === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => setPeriod("week")}
        >
          Última semana
        </Button>
        <Button
          variant={period === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => setPeriod("month")}
        >
          Este mes
        </Button>
        <Button
          variant={period === "quarter" ? "default" : "outline"}
          size="sm"
          onClick={() => setPeriod("quarter")}
        >
          Trimestre
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total ingresos</p>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(totals.total)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Media diaria</p>
            <p className="text-xl font-bold">
              {formatCurrency(totals.avgDaily)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Transacciones</p>
            <p className="text-xl font-bold">{totals.transactionCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Efectivo / Tarjeta</p>
            <p className="text-sm font-semibold">
              {formatCurrency(totals.cash)} / {formatCurrency(totals.card)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      {data.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ingresos diarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateLabel}
                      className="text-xs"
                    />
                    <YAxis
                      tickFormatter={(v) => `${v}€`}
                      className="text-xs"
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) =>
                        format(new Date(label), "d MMMM yyyy", { locale: es })
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Total"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* By Stylist Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Por estilista</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateLabel}
                      className="text-xs"
                    />
                    <YAxis tickFormatter={(v) => `${v}€`} className="text-xs" />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) =>
                        format(new Date(label), "d MMMM yyyy", { locale: es })
                      }
                    />
                    <Legend />
                    <Bar
                      dataKey="cris"
                      name="Cris"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="desi"
                      name="Desi"
                      fill="hsl(var(--accent))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cris</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(totals.cris)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {((totals.cris / totals.total) * 100 || 0).toFixed(1)}% del total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Desi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-accent">
                  {formatCurrency(totals.desi)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {((totals.desi / totals.total) * 100 || 0).toFixed(1)}% del total
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay datos para el período seleccionado</p>
        </div>
      )}
    </div>
  );
};
