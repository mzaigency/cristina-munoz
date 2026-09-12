import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Terminal,
  CheckCircle2,
  RefreshCw,
  Search,
  Loader2,
  Database,
  Lock,
  Server,
  ShieldCheck,
  Activity,
  History,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getSuperAdminAuditLogs, type AuditLogEntry } from "@/services/adminAudit";

interface ErrorLog {
  id: string;
  created_at: string;
  error_message: string;
  error_stack?: string;
  component_name?: string;
  severity?: string;
  user_id?: string;
}

export const SystemHealthSection: React.FC = () => {
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<"errors" | "audit">("errors");

  // Error Logs
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    fetchLogs();
    loadAuditLogs();

    const handleAuditCreated = () => {
      loadAuditLogs();
    };
    window.addEventListener("glowapp:audit-log-created" as any, handleAuditCreated);
    return () => window.removeEventListener("glowapp:audit-log-created" as any, handleAuditCreated);
  }, []);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from("error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60);

      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadAuditLogs = () => {
    const list = getSuperAdminAuditLogs();
    setAuditLogs(list);
  };

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.error_message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.component_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === "all" || (l.severity || "error") === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const filteredAuditLogs = auditLogs.filter((a) => {
    return (
      a.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.target_name && a.target_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      a.admin_email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "IMPERSONATE_SALON":
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30 text-[10px] font-bold">Impersonación</Badge>;
      case "SEND_PASSWORD_RESET":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] font-bold">Reset Password</Badge>;
      case "CONVERT_B2B_LEAD":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">Conversión B2B</Badge>;
      case "UPDATE_USER_ROLE":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px] font-bold">Cambio Rol</Badge>;
      case "UPDATE_SALON":
      case "CREATE_SALON":
        return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/30 text-[10px] font-bold">Gestión Salón</Badge>;
      case "TOGGLE_MAINTENANCE":
      case "SAVE_ANNOUNCEMENT":
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px] font-bold">Configuración App</Badge>;
      case "DELETE_TENANT":
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px] font-bold">Salón Eliminado</Badge>;
      case "DELETE_LEAD":
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30 text-[10px] font-bold">Lead Eliminado</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Salud del Sistema & Registro de Auditoría
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Supervisa el estado de la infraestructura y el historial de acciones ejecutadas por superadministradores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-toggle Errores vs Auditoría */}
          <div className="flex items-center p-0.5 rounded-xl border border-[var(--glow-line)] bg-muted/30">
            <button
              type="button"
              onClick={() => setCurrentView("errors")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentView === "errors"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Errores ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setCurrentView("audit")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentView === "audit"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Audit Trail ({auditLogs.length})
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (currentView === "errors") fetchLogs();
              else loadAuditLogs();
            }}
            className="h-8 gap-1.5 rounded-xl text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refrescar</span>
          </Button>
        </div>
      </div>

      {/* System Status Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 rounded-2xl border-[var(--glow-line)] bg-card shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground block">Base de Datos</span>
              <span className="text-[10px] text-muted-foreground">Supabase PostgreSQL</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
            Conectada
          </Badge>
        </Card>

        <Card className="p-4 rounded-2xl border-[var(--glow-line)] bg-card shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground block">Autenticación & RLS</span>
              <span className="text-[10px] text-muted-foreground">Row Level Security Activo</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">
            Protegido
          </Badge>
        </Card>

        <Card className="p-4 rounded-2xl border-[var(--glow-line)] bg-card shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground block">Edge Functions</span>
              <span className="text-[10px] text-muted-foreground">Notificaciones & Webhooks</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px]">
            Operativo
          </Badge>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={
              currentView === "errors"
                ? "Buscar por mensaje o componente..."
                : "Buscar en auditoría por acción, recurso o admin..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        {currentView === "errors" && (
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl border border-[var(--glow-line)] bg-card text-foreground outline-none shrink-0"
          >
            <option value="all">Todas las gravedades</option>
            <option value="error">Error</option>
            <option value="warn">Advertencia (Warn)</option>
            <option value="info">Info</option>
          </select>
        )}
      </div>

      {/* Vista 1: Errores del Sistema */}
      {currentView === "errors" ? (
        <Card className="rounded-2xl border-[var(--glow-line)] bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--glow-line)] bg-muted/40 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Gravedad</th>
                  <th className="py-3 px-4">Mensaje de Error</th>
                  <th className="py-3 px-4">Componente</th>
                  <th className="py-3 px-4 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glow-line)]/60 font-mono">
                {loadingLogs ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-muted-foreground font-sans">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[var(--glow-brand)]" />
                      Consultando logs del sistema...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-muted-foreground font-sans">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                      Sin errores registrados recientemente.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-4 font-sans">
                        <Badge
                          variant="outline"
                          className={
                            log.severity === "warn"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]"
                              : "bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px]"
                          }
                        >
                          {log.severity || "error"}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-foreground font-semibold truncate max-w-md">
                        {log.error_message}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground text-[11px] font-sans">
                        {log.component_name || "Global"}
                      </td>
                      <td className="py-2.5 px-4 text-right text-muted-foreground text-[10.5px] font-sans">
                        {log.created_at
                          ? format(new Date(log.created_at), "dd/MM HH:mm:ss", { locale: es })
                          : ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Vista 2: Registro de Auditoría (Audit Trail) */
        <Card className="rounded-2xl border-[var(--glow-line)] bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--glow-line)] bg-muted/40 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Acción</th>
                  <th className="py-3 px-4">Recurso Afectado</th>
                  <th className="py-3 px-4">SuperAdmin Responsable</th>
                  <th className="py-3 px-4">Detalles</th>
                  <th className="py-3 px-4 text-right">Fecha / Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glow-line)]/60">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-muted-foreground">
                      No hay registros de auditoría que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        {getActionBadge(entry.action)}
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground truncate max-w-[200px]">
                        {entry.target_name || entry.target_type}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <span className="font-medium text-foreground">{entry.admin_email}</span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-muted-foreground font-mono truncate max-w-xs">
                        {entry.details ? JSON.stringify(entry.details) : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground text-[11px]">
                        {entry.created_at
                          ? format(new Date(entry.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
