import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  Shield,
  Building2,
  Scissors,
  Download,
  Loader2,
  Mail,
  KeyRound,
  Copy,
  Check,
  Calendar,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { logSuperAdminAction } from "@/services/adminAudit";

interface UserWithRoles {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
  tenant_name: string | null;
}

interface UsersSectionProps {
  onNavigateTab: (tab: string, subtab: string) => void;
}

export const UsersSection: React.FC<UsersSectionProps> = ({ onNavigateTab }) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // God Mode / User Detail Modal
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const [rolesRes, profilesRes, tenantAdminsRes, tenantStylistsRes] = await Promise.all([
        supabase
          .from("user_roles")
          .select(`
            user_id,
            role,
            tenant_id,
            tenants:tenant_id (name)
          `),
        supabase
          .from("profiles")
          .select("id, email, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("tenant_admins").select("user_id, tenants:tenant_id (name)"),
        supabase
          .from("tenant_stylists")
          .select("user_id, tenants:tenant_id (name)")
          .not("user_id", "is", null),
      ]);

      const usersMap = new Map<string, UserWithRoles>();

      for (const profile of profilesRes.data || []) {
        usersMap.set(profile.id, {
          id: profile.id,
          email: profile.email || "Sin email",
          created_at: profile.created_at,
          roles: [],
          tenant_name: null,
        });
      }

      for (const role of rolesRes.data || []) {
        const user = usersMap.get(role.user_id);
        if (user) {
          if (!user.roles.includes(role.role)) {
            user.roles.push(role.role);
          }
          if (role.tenants && !user.tenant_name) {
            user.tenant_name = (role.tenants as any).name;
          }
        }
      }

      for (const admin of tenantAdminsRes.data || []) {
        const user = usersMap.get(admin.user_id);
        if (user && admin.tenants && !user.tenant_name) {
          user.tenant_name = (admin.tenants as any).name;
        }
      }

      for (const stylist of tenantStylistsRes.data || []) {
        if (!stylist.user_id) continue;
        const user = usersMap.get(stylist.user_id);
        if (user && stylist.tenants && !user.tenant_name) {
          user.tenant_name = (stylist.tenants as any).name;
        }
      }

      setUsers(Array.from(usersMap.values()));
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error al cargar usuarios",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    if (!email || email === "Sin email") {
      toast({ title: "Error", description: "El usuario no tiene un correo válido.", variant: "destructive" });
      return;
    }

    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
        redirectTo: `${window.location.origin}/nueva-contrasena`,
      });

      if (error) throw error;

      await logSuperAdminAction({
        action: "SEND_PASSWORD_RESET",
        target_type: "user",
        target_name: email,
        details: { method: "superadmin_direct_trigger" },
      });

      toast({
        title: "✉️ Enlace de Recuperación Enviado",
        description: `Se ha enviado el correo para establecer contraseña a ${email}.`,
      });
    } catch (err: any) {
      toast({
        title: "Error al enviar enlace",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSendingReset(false);
    }
  };

  const handleCopyResetUrl = () => {
    const resetUrl = `${window.location.origin}/nueva-contrasena`;
    navigator.clipboard.writeText(resetUrl);
    toast({
      title: "Enlace Copiado",
      description: "Enlace a la página de restablecimiento copiado al portapapeles.",
    });
  };

  const handleCopyUserId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    toast({ title: "ID Copiado", description: id });
  };

  const handleToggleSuperadminRole = async (targetUserId: string, currentHasSuperadmin: boolean, email: string) => {
    setUpdatingRole(true);
    try {
      if (currentHasSuperadmin) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", targetUserId)
          .eq("role", "superadmin");
        if (error) throw error;

        await logSuperAdminAction({
          action: "UPDATE_USER_ROLE",
          target_type: "user",
          target_id: targetUserId,
          target_name: email,
          details: { role: "superadmin", action: "revoked" },
        });

        toast({ title: "Rol modificado", description: "Se ha revocado el rol de SuperAdmin." });
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: targetUserId, role: "superadmin" });
        if (error) throw error;

        await logSuperAdminAction({
          action: "UPDATE_USER_ROLE",
          target_type: "user",
          target_id: targetUserId,
          target_name: email,
          details: { role: "superadmin", action: "granted" },
        });

        toast({ title: "Rol asignado", description: "Se ha concedido acceso de SuperAdmin." });
      }
      setIsDetailModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Email", "Roles", "Salón Vinculado", "Fecha Registro"];
    const rows = users.map((u) => [
      u.id,
      `"${u.email.replace(/"/g, '""')}"`,
      `"${u.roles.join(", ")}"`,
      `"${(u.tenant_name || "").replace(/"/g, '""')}"`,
      u.created_at,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `glowapp-usuarios-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.tenant_name && user.tenant_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === "all" ||
      user.roles.includes(roleFilter) ||
      (roleFilter === "client" && user.roles.length === 0);

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Directorio Global de Usuarios</span>
            <Badge variant="outline" className="text-[10px] text-muted-foreground font-normal">
              {users.length} registrados
            </Badge>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Supervisa cuentas, envía enlaces de recuperación de contraseña y gestiona permisos de acceso (Modo Dios).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 gap-1.5 rounded-xl text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar CSV</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por email, salón asociado o ID de usuario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 px-3 text-xs rounded-xl border border-[var(--glow-line)] bg-card text-foreground outline-none cursor-pointer shrink-0"
        >
          <option value="all">Todos los roles ({users.length})</option>
          <option value="superadmin">SuperAdmin</option>
          <option value="admin">Administrador de Salón</option>
          <option value="stylist">Estilista</option>
          <option value="client">Cliente (Sin rol de gestión)</option>
        </select>
      </div>

      {/* Table */}
      <Card className="rounded-2xl border-[var(--glow-line)] bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--glow-line)] bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Roles Activos</th>
                <th className="py-3 px-4">Salón Asociado</th>
                <th className="py-3 px-4">Fecha de Registro</th>
                <th className="py-3 px-4 text-right">Acciones Rápidas (Modo Dios)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glow-line)]/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[var(--glow-brand)]" />
                    Cargando directorio de usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted-foreground">
                    No se encontraron usuarios coincidentes.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                          {user.email.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-foreground truncate">
                            {user.email}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">
                            {user.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.includes("superadmin") && (
                          <Badge
                            variant="outline"
                            className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] font-bold gap-1"
                          >
                            <Shield className="h-2.5 w-2.5" />
                            <span>SuperAdmin</span>
                          </Badge>
                        )}
                        {user.roles.includes("admin") && (
                          <Badge
                            variant="outline"
                            className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px] font-bold gap-1"
                          >
                            <Building2 className="h-2.5 w-2.5" />
                            <span>Admin</span>
                          </Badge>
                        )}
                        {user.roles.includes("stylist") && (
                          <Badge
                            variant="outline"
                            className="bg-purple-500/10 text-purple-600 border-purple-500/30 text-[10px] font-bold gap-1"
                          >
                            <Scissors className="h-2.5 w-2.5" />
                            <span>Estilista</span>
                          </Badge>
                        )}
                        {user.roles.length === 0 && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Cliente
                          </Badge>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-muted-foreground">
                      {user.tenant_name || "—"}
                    </td>

                    <td className="py-3 px-4 text-muted-foreground text-[11px]">
                      {user.created_at
                        ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: es })
                        : "—"}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón Reset Password */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendPasswordReset(user.email)}
                          className="h-7 px-2 text-[11px] font-bold rounded-lg text-amber-600 hover:bg-amber-500/10 gap-1"
                          title="Enviar correo de recuperación de contraseña"
                        >
                          <KeyRound className="h-3 w-3" />
                          <span>Reset Contraseña</span>
                        </Button>

                        {/* Botón Modo Dios / Ficha */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDetailModalOpen(true);
                          }}
                          className="h-7 px-2 text-[11px] font-bold rounded-lg text-[var(--glow-brand)] hover:bg-[var(--glow-brand-soft)]"
                        >
                          Ficha & Roles
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Modo Dios / Ficha de Usuario */}
      {selectedUser && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--glow-brand)]" />
                <span>Ficha de Usuario (Modo Dios)</span>
              </DialogTitle>
              <DialogDescription className="text-xs truncate">
                {selectedUser.email}
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-3.5 text-xs">
              {/* Bloque Datos Básicos */}
              <div className="p-3 rounded-xl bg-muted/40 border border-[var(--glow-line)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] text-muted-foreground">ID de Usuario</span>
                  <button
                    type="button"
                    onClick={() => handleCopyUserId(selectedUser.id)}
                    className="flex items-center gap-1 text-[10px] font-mono text-[var(--glow-brand)] hover:underline"
                  >
                    {copiedId ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedId ? "Copiado" : "Copiar ID"}</span>
                  </button>
                </div>
                <div className="font-mono text-[11px] text-foreground bg-background p-1.5 rounded-lg border border-[var(--glow-line)] select-all truncate">
                  {selectedUser.id}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Salón Vinculado</span>
                    <span className="font-bold text-foreground">{selectedUser.tenant_name || "Ninguno"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Fecha Registro</span>
                    <span className="font-bold text-foreground">
                      {selectedUser.created_at ? format(new Date(selectedUser.created_at), "dd/MM/yyyy HH:mm", { locale: es }) : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acciones de Soporte y Contraseñas */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-foreground block">
                  Acciones de Recuperación de Acceso
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendPasswordReset(selectedUser.email)}
                    disabled={sendingReset}
                    className="h-9 text-xs rounded-xl gap-1.5 font-bold border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                  >
                    {sendingReset ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                    <span>Enviar Email Reset</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyResetUrl}
                    className="h-9 text-xs rounded-xl gap-1.5 font-bold"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar Enlace Reset</span>
                  </Button>
                </div>
              </div>

              {/* Gestión de Roles */}
              <div className="p-3 rounded-xl border border-[var(--glow-line)] bg-muted/20 flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground block">Permiso SuperAdmin</span>
                  <span className="text-[10px] text-muted-foreground">
                    Acceso total a la configuración y base de datos
                  </span>
                </div>
                <Button
                  size="sm"
                  variant={selectedUser.roles.includes("superadmin") ? "destructive" : "default"}
                  onClick={() =>
                    handleToggleSuperadminRole(
                      selectedUser.id,
                      selectedUser.roles.includes("superadmin"),
                      selectedUser.email,
                    )
                  }
                  disabled={updatingRole}
                  className="rounded-xl text-xs h-8 font-bold"
                >
                  {updatingRole && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                  {selectedUser.roles.includes("superadmin") ? "Revocar" : "Conceder"}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
                className="rounded-xl text-xs w-full"
              >
                Cerrar Ficha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
