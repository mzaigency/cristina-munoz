import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  Calendar,
  Clock,
  DollarSign,
  Users,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";

interface ROICalculatorProps {
  tenantId: string;
}

interface ROIStats {
  totalRevenue: number;
  totalBookings: number;
  cancelledBookings: number;
  noShowsAvoided: number;
  avgBookingValue: number;
  daysActive: number;
  estimatedTimeSaved: number; // hours
}

export function ROICalculator({ tenantId }: ROICalculatorProps) {
  const [stats, setStats] = useState<ROIStats>({
    totalRevenue: 0,
    totalBookings: 0,
    cancelledBookings: 0,
    noShowsAvoided: 0,
    avgBookingValue: 0,
    daysActive: 0,
    estimatedTimeSaved: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchROIStats();
  }, [tenantId]);

  const fetchROIStats = async () => {
    try {
      // Get tenant creation date
      const { data: tenant } = await supabase
        .from("tenants")
        .select("created_at")
        .eq("id", tenantId)
        .single();

      const createdAt = tenant?.created_at ? new Date(tenant.created_at) : new Date();
      const daysActive = Math.max(1, Math.ceil((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));

      // Bookings stats
      const { data: bookings } = await supabase
        .from("bookings")
        .select("status, services")
        .eq("tenant_id", tenantId);

      const totalBookings = bookings?.filter((b) => b.status !== "cancelled").length || 0;
      const cancelledBookings = bookings?.filter((b) => b.status === "cancelled").length || 0;

      // Revenue from transactions
      const { data: transactions } = await supabase
        .from("transactions")
        .select("total")
        .eq("tenant_id", tenantId)
        .eq("voided", false);

      const totalRevenue = transactions?.reduce((sum, t) => sum + (t.total || 0), 0) || 0;
      const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Estimate no-shows avoided (industry avg 15-20% no-show, reminders reduce to ~5%)
      const noShowsAvoided = Math.round(totalBookings * 0.12);

      // Estimate time saved: ~3 min per booking managed manually (phone, whatsapp)
      const estimatedTimeSaved = Math.round((totalBookings * 3) / 60);

      setStats({
        totalRevenue,
        totalBookings,
        cancelledBookings,
        noShowsAvoided,
        avgBookingValue,
        daysActive,
        estimatedTimeSaved,
      });
    } catch (error) {
      console.error("Error fetching ROI stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);

  const roiCards = [
    {
      label: "Ingresos gestionados",
      value: formatCurrency(stats.totalRevenue),
      icon: <DollarSign className="h-5 w-5" />,
      color: "from-[var(--gp-ok)] to-[var(--gp-ok-ink)]",
      subtitle: `${stats.daysActive} días activo`,
    },
    {
      label: "Citas gestionadas",
      value: stats.totalBookings.toString(),
      icon: <Calendar className="h-5 w-5" />,
      color: "from-[var(--gp-purple)] to-[var(--gp-purple-ink)]",
      subtitle: `Media: ${formatCurrency(stats.avgBookingValue)}/cita`,
    },
    {
      label: "No-shows evitados",
      value: `~${stats.noShowsAvoided}`,
      icon: <ShieldCheck className="h-5 w-5" />,
      color: "from-[var(--gp-warn)] to-[var(--gp-warn-ink)]",
      subtitle: `Ahorro: ${formatCurrency(stats.noShowsAvoided * stats.avgBookingValue)}`,
    },
    {
      label: "Tiempo ahorrado",
      value: `${stats.estimatedTimeSaved}h`,
      icon: <Clock className="h-5 w-5" />,
      color: "from-[var(--gp-info)] to-[var(--gp-info-ink)]",
      subtitle: "vs gestión manual (tel/WhatsApp)",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Retorno de tu inversión</h3>
              <p className="text-xs text-muted-foreground">
                Desde que empezaste hace {stats.daysActive} días
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        {roiCards.map((card, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-0">
              <div className={cn("p-4 bg-gradient-to-br text-white", card.color)}>
                <div className="flex items-start justify-between mb-2">
                  <div className="p-1.5 rounded-lg bg-white/20">{card.icon}</div>
                </div>
                <p className="text-xl font-bold">{card.value}</p>
                <p className="text-xs font-medium opacity-90 mt-0.5">{card.label}</p>
                <p className="text-[10px] opacity-70 mt-1">{card.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Key insight */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[var(--gp-ok-soft)] dark:bg-emerald-900/30 shrink-0">
              <TrendingUp className="h-5 w-5 text-[var(--gp-ok-ink)] " />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Valor recuperado estimado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Con los recordatorios automáticos has evitado ~{stats.noShowsAvoided} citas perdidas,
                equivalente a{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(stats.noShowsAvoided * stats.avgBookingValue)}
                </span>{" "}
                en ingresos que habrías perdido.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
