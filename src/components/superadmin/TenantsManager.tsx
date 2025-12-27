import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Loader2, 
  Building2, 
  Search, 
  Edit, 
  Trash2,
  ExternalLink,
  Users,
  Calendar,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  subscription_plan: string;
  created_at: string;
  features: {
    whatsapp?: boolean;
    google_calendar?: boolean;
    cash_register?: boolean;
    reviews?: boolean;
  };
}

interface TenantStats {
  tenant_id: string;
  bookings_count: number;
  reviews_count: number;
  contacts_count: number;
}

export const TenantsManager = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<Record<string, TenantStats>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    subscription_plan: "basic",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const tenantsData = (data || []) as Tenant[];
      setTenants(tenantsData);

      // Fetch stats for each tenant
      const statsMap: Record<string, TenantStats> = {};
      for (const tenant of tenantsData) {
        const [bookingsRes, reviewsRes, contactsRes] = await Promise.all([
          supabase.from("bookings").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
          supabase.from("reviews").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
          supabase.from("whatsapp_contacts").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
        ]);

        statsMap[tenant.id] = {
          tenant_id: tenant.id,
          bookings_count: bookingsRes.count || 0,
          reviews_count: reviewsRes.count || 0,
          contacts_count: contactsRes.count || 0,
        };
      }
      setStats(statsMap);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los tenants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!formData.name || !formData.slug) {
      toast({
        title: "Error",
        description: "Nombre y slug son obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const { data, error } = await supabase
        .from("tenants")
        .insert({
          name: formData.name,
          slug: formData.slug.toLowerCase().replace(/\s+/g, "-"),
          email: formData.email || null,
          phone: formData.phone || null,
          subscription_plan: formData.subscription_plan,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Tenant creado",
        description: `${formData.name} ha sido creado correctamente`,
      });

      setIsCreateDialogOpen(false);
      setFormData({ name: "", slug: "", email: "", phone: "", subscription_plan: "basic" });
      fetchTenants();
    } catch (error: any) {
      console.error("Error creating tenant:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el tenant",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTenant = async () => {
    if (!selectedTenant) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("tenants")
        .update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          subscription_plan: formData.subscription_plan,
        })
        .eq("id", selectedTenant.id);

      if (error) throw error;

      toast({
        title: "Tenant actualizado",
        description: `${formData.name} ha sido actualizado correctamente`,
      });

      setIsEditDialogOpen(false);
      setSelectedTenant(null);
      fetchTenants();
    } catch (error: any) {
      console.error("Error updating tenant:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el tenant",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (tenant: Tenant) => {
    try {
      const { error } = await supabase
        .from("tenants")
        .update({ is_active: !tenant.is_active })
        .eq("id", tenant.id);

      if (error) throw error;

      toast({
        title: tenant.is_active ? "Tenant desactivado" : "Tenant activado",
        description: `${tenant.name} ha sido ${tenant.is_active ? "desactivado" : "activado"}`,
      });

      fetchTenants();
    } catch (error) {
      console.error("Error toggling tenant:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del tenant",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      email: tenant.email || "",
      phone: tenant.phone || "",
      subscription_plan: tenant.subscription_plan,
    });
    setIsEditDialogOpen(true);
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.email && t.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Tenants</h2>
          <p className="text-muted-foreground">
            {tenants.length} tenant{tenants.length !== 1 ? "s" : ""} registrado{tenants.length !== 1 ? "s" : ""}
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Tenant</DialogTitle>
              <DialogDescription>
                Añade una nueva peluquería a la plataforma
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  placeholder="Peluquería Ejemplo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  placeholder="peluqueria-ejemplo"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contacto@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  placeholder="612 345 678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTenant} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Crear Tenant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, slug o email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tenants Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-center">Reservas</TableHead>
                <TableHead className="text-center">Contactos</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-sm text-muted-foreground">/{tenant.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tenant.subscription_plan === "premium" ? "default" : "secondary"}>
                      {tenant.subscription_plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {stats[tenant.id]?.bookings_count || 0}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      {stats[tenant.id]?.contacts_count || 0}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={tenant.is_active}
                      onCheckedChange={() => handleToggleActive(tenant)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(tenant)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTenants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron tenants
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tenant</DialogTitle>
            <DialogDescription>
              Modifica los datos de {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug (no editable)</Label>
              <Input id="edit-slug" value={formData.slug} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateTenant} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
