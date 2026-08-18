import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";
import {
  TrendingUp,
  CreditCard,
  Banknote,
  Loader2,
  Scissors,
  Gift
} from "lucide-react";

interface AdvancedCashStatsProps {
  tenantId: string;
}

const COLORS = ["#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"];

export function AdvancedCashStats({ tenantId }: AdvancedCashStatsProps) {
  const [loading, setLoading] = useState(true);
  const [weeklyComparison, setWeeklyComparison] = useState<any[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([]);
  const [tipsData, setTipsData] = useState<any[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const fetchData = async () => {
    try {
      const thisWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const thisWeekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const lastWeekStart = format(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const lastWeekEnd = format(endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

      // Fetch all transactions for analysis
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("voided", false)
        .gte("created_at", lastWeekStart + "T00:00:00")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Weekly comparison
      const thisWeekTxs = (transactions || []).filter(t => 
        t.created_at >= thisWeekStart + "T00:00:00" && t.created_at <= thisWeekEnd + "T23:59:59"
      );
      const lastWeekTxs = (transactions || []).filter(t => 
        t.created_at >= lastWeekStart + "T00:00:00" && t.created_at <= lastWeekEnd + "T23:59:59"
      );

      const thisWeekTotal = thisWeekTxs.reduce((sum, t) => sum + Number(t.total), 0);
      const lastWeekTotal = lastWeekTxs.reduce((sum, t) => sum + Number(t.total), 0);

      setWeeklyComparison([
        { name: "Semana anterior", value: lastWeekTotal },
        { name: "Esta semana", value: thisWeekTotal }
      ]);

      // Payment methods
      const paymentMethods: Record<string, number> = { cash: 0, card: 0, mixed: 0 };
      thisWeekTxs.forEach(t => {
        paymentMethods[t.payment_method] = (paymentMethods[t.payment_method] || 0) + Number(t.total);
      });

      setPaymentMethodData([
        { name: "Efectivo", value: paymentMethods.cash, color: "#10B981" },
        { name: "Tarjeta", value: paymentMethods.card, color: "#8B5CF6" },
        { name: "Mixto", value: paymentMethods.mixed || 0, color: "#F59E0B" }
      ].filter(d => d.value > 0));

      // Tips trend (daily for this week)
      const tipsByDay: Record<string, number> = {};
      thisWeekTxs.forEach(t => {
        const day = format(new Date(t.created_at), "EEE", { locale: es });
        tipsByDay[day] = (tipsByDay[day] || 0) + (Number(t.tip_amount) || 0);
      });

      const daysOrder = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
      setTipsData(daysOrder.map(day => ({
        name: day.charAt(0).toUpperCase() + day.slice(1),
        propinas: tipsByDay[day] || 0
      })));

      // Top services this month
      const { data: monthTxs } = await supabase
        .from("transactions")
        .select("services")
        .eq("tenant_id", tenantId)
        .eq("voided", false)
        .gte("created_at", monthStart + "T00:00:00")
        .lte("created_at", monthEnd + "T23:59:59");

      const serviceCount: Record<string, number> = {};
      (monthTxs || []).forEach(t => {
        const services = Array.isArray(t.services) ? t.services : [];
        services.forEach((s: any) => {
          const name = s.name || "Sin nombre";
          serviceCount[name] = (serviceCount[name] || 0) + 1;
        });
      });

      const sortedServices = Object.entries(serviceCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count], i) => ({ name, count, color: COLORS[i] }));

      setTopServices(sortedServices);

    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        Análisis Avanzado
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Weekly Comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Comparativa Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyComparison}>
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `${v}€`} />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(2)}€`, "Ingresos"]} />
                  <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {weeklyComparison.length === 2 && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                {weeklyComparison[1].value > weeklyComparison[0].value ? (
                  <span className="text-[var(--gp-ok-ink)]">
                    ↑ +{((weeklyComparison[1].value - weeklyComparison[0].value) / Math.max(weeklyComparison[0].value, 1) * 100).toFixed(0)}% vs semana anterior
                  </span>
                ) : weeklyComparison[1].value < weeklyComparison[0].value ? (
                  <span className="text-[var(--gp-danger-ink)]">
                    ↓ {((weeklyComparison[1].value - weeklyComparison[0].value) / Math.max(weeklyComparison[0].value, 1) * 100).toFixed(0)}% vs semana anterior
                  </span>
                ) : (
                  <span>Sin cambios vs semana anterior</span>
                )}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Métodos de Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)}€`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tips Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Tendencia de Propinas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tipsData}>
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `${v}€`} />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(2)}€`, "Propinas"]} />
                  <Line 
                    type="monotone" 
                    dataKey="propinas" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: "#10B981" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              Top 5 Servicios del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topServices.map((service, i) => (
                <div key={service.name} className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: service.color }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{service.name}</p>
                    <p className="text-xs text-muted-foreground">{service.count} veces</p>
                  </div>
                </div>
              ))}
              {topServices.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin datos este mes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}