import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Building2, 
  Calendar, 
  Star, 
  MessageSquare, 
  TrendingUp,
  Users,
  CreditCard
} from "lucide-react";

interface GlobalStatsData {
  totalTenants: number;
  activeTenants: number;
  totalBookings: number;
  totalReviews: number;
  totalContacts: number;
  avgRating: number;
  totalTransactions: number;
  totalRevenue: number;
}

export const GlobalStats = () => {
  const [stats, setStats] = useState<GlobalStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const fetchGlobalStats = async () => {
    try {
      setLoading(true);

      const [
        tenantsRes,
        activeTenantsRes,
        bookingsRes,
        reviewsRes,
        transactionsRes,
      ] = await Promise.all([
        supabase.from("tenants").select("id", { count: "exact", head: true }),
        supabase.from("tenants").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("bookings").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("rating"),
        supabase.from("transactions").select("total").eq("voided", false),
      ]);

      const reviews = reviewsRes.data || [];
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;

      const transactions = transactionsRes.data || [];
      const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.total || 0), 0);

      setStats({
        totalTenants: tenantsRes.count || 0,
        activeTenants: activeTenantsRes.count || 0,
        totalBookings: bookingsRes.count || 0,
        totalReviews: reviews.length,
        totalContacts: 0, // WhatsApp contacts table removed
        avgRating: Math.round(avgRating * 10) / 10,
        totalTransactions: transactions.length,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching global stats:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total Tenants",
      value: stats.totalTenants,
      subtitle: `${stats.activeTenants} activos`,
      icon: Building2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Reservas Totales",
      value: stats.totalBookings.toLocaleString(),
      subtitle: "En toda la plataforma",
      icon: Calendar,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Reseñas",
      value: stats.totalReviews.toLocaleString(),
      subtitle: `Promedio: ${stats.avgRating} ⭐`,
      icon: Star,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Contactos WhatsApp",
      value: stats.totalContacts.toLocaleString(),
      subtitle: "Clientes únicos",
      icon: MessageSquare,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Transacciones",
      value: stats.totalTransactions.toLocaleString(),
      subtitle: "Cobros realizados",
      icon: CreditCard,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Ingresos Totales",
      value: `${stats.totalRevenue.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`,
      subtitle: "Facturación acumulada",
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Estadísticas Globales</h2>
        <p className="text-muted-foreground">
          Métricas generales de toda la plataforma
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.subtitle}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
