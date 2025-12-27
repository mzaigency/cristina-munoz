import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, User, Shield, Scissors, Building2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface UserWithRoles {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
  tenant_name: string | null;
}

export const UsersManager = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          role
        `);

      if (rolesError) throw rolesError;

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, created_at");

      if (profilesError) throw profilesError;

      // Fetch tenant admins to get tenant associations
      const { data: tenantAdminsData } = await supabase
        .from("tenant_admins")
        .select(`
          user_id,
          tenants:tenant_id (name)
        `);

      // Combine data
      const usersMap = new Map<string, UserWithRoles>();

      for (const profile of profilesData || []) {
        usersMap.set(profile.id, {
          id: profile.id,
          email: profile.email,
          created_at: profile.created_at,
          roles: [],
          tenant_name: null,
        });
      }

      for (const role of rolesData || []) {
        const user = usersMap.get(role.user_id);
        if (user) {
          user.roles.push(role.role);
        }
      }

      for (const admin of tenantAdminsData || []) {
        const user = usersMap.get(admin.user_id);
        if (user && admin.tenants) {
          user.tenant_name = (admin.tenants as any).name;
        }
      }

      setUsers(Array.from(usersMap.values()));
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "superadmin":
        return (
          <Badge variant="destructive" className="gap-1">
            <Shield className="h-3 w-3" />
            SuperAdmin
          </Badge>
        );
      case "admin":
        return (
          <Badge variant="default" className="gap-1">
            <Building2 className="h-3 w-3" />
            Admin
          </Badge>
        );
      case "stylist":
        return (
          <Badge variant="secondary" className="gap-1">
            <Scissors className="h-3 w-3" />
            Estilista
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.tenant_name && user.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole =
      roleFilter === "all" ||
      user.roles.includes(roleFilter) ||
      (roleFilter === "none" && user.roles.length === 0);

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
        <p className="text-muted-foreground">
          {users.length} usuario{users.length !== 1 ? "s" : ""} registrado{users.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por email o tenant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="superadmin">SuperAdmin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="stylist">Estilista</SelectItem>
            <SelectItem value="none">Sin rol</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Registrado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <span key={role}>{getRoleBadge(role)}</span>
                        ))
                      ) : (
                        <Badge variant="outline">Usuario</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.tenant_name ? (
                      <span className="text-sm">{user.tenant_name}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(user.created_at), "dd MMM yyyy", { locale: es })}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
