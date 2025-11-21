import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, TrendingUp, Shield, Users, AlertTriangle } from "lucide-react";
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
  whatsapp: 'hsl(145, 63%, 42%)', // verde vivo
  crm: 'hsl(186, 94%, 45%)', // cyan vivo
  web: 'hsl(25, 95%, 53%)', // naranja vivo
};

export function SecurityMonitor() {
  const { toast } = useToast();
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

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

  const currentPeriodData = stats[activeTab];
  const periodLabel = activeTab === 'daily' ? 'Hoy' : activeTab === 'weekly' ? 'Esta Semana' : 'Este Mes';

  return (
    <div className="space-y-6">
      {/* Métricas de Seguridad */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Shield}
          label="Sistema Seguro"
          value="Activo"
          color="text-green-600"
        />
        <StatCard
          icon={Users}
          label="Clientes Activos"
          value={currentPeriodData.total}
          color="text-blue-600"
        />
        <StatCard
          icon={AlertTriangle}
          label="Actividad Sospechosa"
          value="0"
          color="text-orange-600"
        />
      </div>

      {/* Gráfico Principal con Pestañas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Estadísticas de Reservas</span>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-auto">
              <TabsList>
                <TabsTrigger value="daily">Día</TabsTrigger>
                <TabsTrigger value="weekly">Semana</TabsTrigger>
                <TabsTrigger value="monthly">Mes</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Gráfico */}
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={getChartData(currentPeriodData.byChannel)}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={130}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {getChartData(currentPeriodData.byChannel).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend 
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Estadísticas por Canal */}
            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-4xl font-bold">{currentPeriodData.total}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Citas {periodLabel}</p>
              </div>
              
              <div className="space-y-3">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(145, 63%, 95%)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.whatsapp }}></div>
                      <p className="font-medium" style={{ color: COLORS.whatsapp }}>WhatsApp</p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: COLORS.whatsapp }}>
                      {currentPeriodData.byChannel.whatsapp}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(186, 94%, 95%)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.crm }}></div>
                      <p className="font-medium" style={{ color: COLORS.crm }}>CRM</p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: COLORS.crm }}>
                      {currentPeriodData.byChannel.crm}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(25, 95%, 95%)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.web }}></div>
                      <p className="font-medium" style={{ color: COLORS.web }}>Web</p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: COLORS.web }}>
                      {currentPeriodData.byChannel.web}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
