import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, RefreshCw, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export function AuditLogsViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
    
    // Real-time subscription
    const channel = supabase
      .channel('audit-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          setLogs(current => [payload.new as AuditLog, ...current]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs((data || []) as AuditLog[]);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los logs de auditoría",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes("delete")) {
      return <Badge variant="destructive" className="text-xs">Eliminar</Badge>;
    }
    if (actionLower.includes("update")) {
      return <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">Actualizar</Badge>;
    }
    if (actionLower.includes("insert") || actionLower.includes("create")) {
      return <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">Crear</Badge>;
    }
    if (actionLower.includes("view") || actionLower.includes("select")) {
      return <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">Ver</Badge>;
    }
    return <Badge variant="outline" className="text-xs">{action}</Badge>;
  };

  const getTableBadge = (tableName: string) => {
    const colors: Record<string, string> = {
      bookings: "bg-purple-100 text-purple-800 border-purple-300",
      profiles: "bg-pink-100 text-pink-800 border-pink-300",
      reviews: "bg-blue-100 text-blue-800 border-blue-300",
      user_roles: "bg-orange-100 text-orange-800 border-orange-300",
    };
    return (
      <Badge variant="outline" className={`text-xs ${colors[tableName] || ""}`}>
        {tableName}
      </Badge>
    );
  };

  const filteredLogs = tableFilter === "all" 
    ? logs 
    : logs.filter(log => log.table_name === tableFilter);

  const availableTables = Array.from(new Set(logs.map(log => log.table_name)));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Logs de Auditoría</CardTitle>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar tabla" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las tablas</SelectItem>
                {availableTables.map(table => (
                  <SelectItem key={table} value={table}>{table}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={fetchLogs} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay logs de auditoría disponibles</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Tabla</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {log.user_id ? log.user_id.substring(0, 8) : "Sistema"}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>{getTableBadge(log.table_name)}</TableCell>
                    <TableCell className="text-xs font-mono">
                      {log.ip_address || "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
