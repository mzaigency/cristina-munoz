import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield, Activity, Users, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface SecurityStats {
  recentPasswordResets: number;
  failedLogins: number;
  activeUsers: number;
  suspiciousActivity: number;
}

interface SuspiciousActivity {
  type: string;
  description: string;
  severity: "low" | "medium" | "high";
  timestamp: string;
}

export function SecurityMonitor() {
  const { toast } = useToast();
  const [stats, setStats] = useState<SecurityStats>({
    recentPasswordResets: 0,
    failedLogins: 0,
    activeUsers: 0,
    suspiciousActivity: 0,
  });
  const [activities, setActivities] = useState<SuspiciousActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityStats();
    
    // Configurar suscripciones en tiempo real
    const passwordResetChannel = supabase
      .channel('password-reset-monitoring')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'password_reset_tokens'
        },
        async (payload) => {
          console.log('Nuevo token de reset detectado:', payload);
          
          // Verificar si hay actividad sospechosa
          const oneDayAgo = new Date();
          oneDayAgo.setHours(oneDayAgo.getHours() - 24);
          const { count } = await supabase
            .from("password_reset_tokens")
            .select("*", { count: "exact", head: true })
            .gte("created_at", oneDayAgo.toISOString());

          if (count && count > 5) {
            toast({
              variant: "destructive",
              title: "⚠️ Actividad Sospechosa Detectada",
              description: `Se han detectado ${count} solicitudes de cambio de contraseña en las últimas 24 horas`,
            });
            fetchSecurityStats(); // Actualizar estadísticas
          }
        }
      )
      .subscribe();

    const auditLogChannel = supabase
      .channel('audit-log-monitoring')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          console.log('Nueva entrada de auditoría:', payload);
          // Verificar si es una acción crítica
          const action = payload.new.action;
          if (action === 'DELETE' && payload.new.table_name === 'user_roles') {
            toast({
              variant: "destructive",
              title: "🔒 Cambio Crítico Detectado",
              description: `Se ha eliminado un rol de usuario`,
            });
            fetchSecurityStats();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(passwordResetChannel);
      supabase.removeChannel(auditLogChannel);
    };
  }, [toast]);

  const fetchSecurityStats = async () => {
    try {
      // Contar password resets recientes (últimas 24h)
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);
      const { count: passwordResetsCount } = await supabase
        .from("password_reset_tokens")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneDayAgo.toISOString());

      // Contar usuarios activos (con sesiones recientes)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*");

      // Detectar actividad sospechosa
      const suspicious: SuspiciousActivity[] = [];

      // Múltiples intentos de reset de password
      if (passwordResetsCount && passwordResetsCount > 5) {
        suspicious.push({
          type: "password_reset_spike",
          description: `${passwordResetsCount} solicitudes de cambio de contraseña en 24h`,
          severity: "high",
          timestamp: new Date().toISOString(),
        });
      }

      setStats({
        recentPasswordResets: passwordResetsCount || 0,
        failedLogins: 0, // Esto requeriría logs adicionales
        activeUsers: profiles?.length || 0,
        suspiciousActivity: suspicious.length,
      });

      setActivities(suspicious);
    } catch (error) {
      console.error("Error fetching security stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: "low" | "medium" | "high") => {
    const colors = {
      low: "bg-blue-100 text-blue-800 border-blue-300",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
      high: "bg-red-100 text-red-800 border-red-300",
    };
    return (
      <Badge variant="outline" className={`text-xs ${colors[severity]}`}>
        {severity === "high" ? "Alta" : severity === "medium" ? "Media" : "Baja"}
      </Badge>
    );
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Lock}
          label="Password Resets (24h)"
          value={stats.recentPasswordResets}
          color="text-blue-600"
        />
        <StatCard
          icon={Users}
          label="Usuarios Activos"
          value={stats.activeUsers}
          color="text-green-600"
        />
        <StatCard
          icon={Shield}
          label="Alertas de Seguridad"
          value={stats.suspiciousActivity}
          color="text-red-600"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Actividad Sospechosa</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4 text-muted-foreground">Cargando...</p>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-green-500 mb-2" />
              <p className="text-lg font-medium text-green-700">Todo está seguro</p>
              <p className="text-sm text-muted-foreground mt-1">No se detectó actividad sospechosa</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-4 border rounded-lg bg-muted/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-sm">{activity.type}</span>
                      {getSeverityBadge(activity.severity)}
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
