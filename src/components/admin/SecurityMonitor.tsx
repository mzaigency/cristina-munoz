import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface BookingStats {
  daily: {
    total: number;
    byChannel: {
      whatsapp: number;
      crm: number;
      web: number;
    };
  };
  weekly: {
    total: number;
    byChannel: {
      whatsapp: number;
      crm: number;
      web: number;
    };
  };
  monthly: {
    total: number;
    byChannel: {
      whatsapp: number;
      crm: number;
      web: number;
    };
  };
}

const COLORS = {
  whatsapp: 'hsl(142, 76%, 36%)', // verde
  crm: 'hsl(221, 83%, 53%)', // azul
  web: 'hsl(25, 75%, 47%)', // marrón
};

export function SecurityMonitor() {
  const { toast } = useToast();
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingStats();
    
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchBookingStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchBookingStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-bookings-stats');
      
      if (error) throw error;
      
      setStats(data);
    } catch (error) {
      console.error("Error fetching booking stats:", error);
      toast({
        variant: "destructive",
        title: "Error al cargar estadísticas",
        description: "No se pudieron cargar las estadísticas de citas",
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  const getChartData = (byChannel: { whatsapp: number; crm: number; web: number }) => [
    { name: 'WhatsApp', value: byChannel.whatsapp, color: COLORS.whatsapp },
    { name: 'CRM', value: byChannel.crm, color: COLORS.crm },
    { name: 'Web', value: byChannel.web, color: COLORS.web },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se pudieron cargar las estadísticas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Calendar}
          label="Citas Hoy"
          value={stats.daily.total}
          color="text-primary"
        />
        <StatCard
          icon={TrendingUp}
          label="Citas Esta Semana"
          value={stats.weekly.total}
          color="text-blue-600"
        />
        <StatCard
          icon={PieChartIcon}
          label="Citas Este Mes"
          value={stats.monthly.total}
          color="text-purple-600"
        />
      </div>

      {/* Gráficos circulares */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Diario */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Citas Hoy por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={getChartData(stats.daily.byChannel)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {getChartData(stats.daily.byChannel).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Semanal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Citas Semanales por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={getChartData(stats.weekly.byChannel)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {getChartData(stats.weekly.byChannel).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Mensual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Citas Mensuales por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={getChartData(stats.monthly.byChannel)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {getChartData(stats.monthly.byChannel).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detalle por canal */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen Detallado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(142, 76%, 96%)' }}>
                <p className="text-sm font-medium" style={{ color: COLORS.whatsapp }}>WhatsApp</p>
                <div className="mt-2 space-y-1">
                  <p className="text-2xl font-bold" style={{ color: COLORS.whatsapp }}>{stats.daily.byChannel.whatsapp}</p>
                  <p className="text-xs text-muted-foreground">Hoy</p>
                </div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(221, 83%, 96%)' }}>
                <p className="text-sm font-medium" style={{ color: COLORS.crm }}>CRM</p>
                <div className="mt-2 space-y-1">
                  <p className="text-2xl font-bold" style={{ color: COLORS.crm }}>{stats.daily.byChannel.crm}</p>
                  <p className="text-xs text-muted-foreground">Hoy</p>
                </div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(25, 75%, 96%)' }}>
                <p className="text-sm font-medium" style={{ color: COLORS.web }}>Web</p>
                <div className="mt-2 space-y-1">
                  <p className="text-2xl font-bold" style={{ color: COLORS.web }}>{stats.daily.byChannel.web}</p>
                  <p className="text-xs text-muted-foreground">Hoy</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
