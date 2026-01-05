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
  MessageSquare,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TenantOnboardingWizard } from "./TenantOnboardingWizard";

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
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    subscription_plan: "basic",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
        const [bookingsRes, reviewsRes] = await Promise.all([
          supabase.from("bookings").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
          supabase.from("reviews").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
        ]);

        statsMap[tenant.id] = {
          tenant_id: tenant.id,
          bookings_count: bookingsRes.count || 0,
          reviews_count: reviewsRes.count || 0,
          contacts_count: 0, // WhatsApp contacts table removed
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

  const openDeleteDialog = (tenant: Tenant) => {
    setTenantToDelete(tenant);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTenant = async () => {
    if (!tenantToDelete) return;

    try {
      setDeleting(true);

      // Delete related data first (in order of dependencies)
      await supabase.from("transactions").delete().eq("tenant_id", tenantToDelete.id);
      await supabase.from("cash_register").delete().eq("tenant_id", tenantToDelete.id);
      await supabase.from("reviews").delete().eq("tenant_id", tenantToDelete.id);
      await supabase.from("bookings").delete().eq("tenant_id", tenantToDelete.id);
      await supabase.from("services").delete().eq("tenant_id", tenantToDelete.id);
      await supabase.from("tenant_business_hours").delete().eq("tenant_id", tenantToDelete.id);
      await supabase.from("tenant_stylists").delete().eq("tenant_id", tenantToDelete.id);
      await supabase.from("tenant_integrations").delete().eq("tenant_id", tenantToDelete.id);
      await supabase.from("tenant_encryption_keys").delete().eq("tenant_id", tenantToDelete.id);
      await supabase.from("tenant_admins").delete().eq("tenant_id", tenantToDelete.id);

      // Finally delete the tenant
      const { error } = await supabase
        .from("tenants")
        .delete()
        .eq("id", tenantToDelete.id);

      if (error) throw error;

      toast({
        title: "Tenant eliminado",
        description: `${tenantToDelete.name} ha sido eliminado permanentemente`,
      });

      setIsDeleteDialogOpen(false);
      setTenantToDelete(null);
      fetchTenants();
    } catch (error: any) {
      console.error("Error deleting tenant:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el tenant",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const openTenantLanding = (slug: string) => {
    window.open(`/salon/${slug}`, '_blank');
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
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Gestión de Tenants</h2>
          <p className="text-sm text-muted-foreground">
            {tenants.length} tenant{tenants.length !== 1 ? "s" : ""} registrado{tenants.length !== 1 ? "s" : ""}
          </p>
        </div>

        <Button className="gap-2 w-full sm:w-auto" onClick={() => setIsWizardOpen(true)}>
          <Sparkles className="h-4 w-4" />
          Nuevo Tenant
        </Button>
      </div>

      {/* Onboarding Wizard */}
      <TenantOnboardingWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onComplete={fetchTenants}
      />

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

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {filteredTenants.map((tenant) => (
          <Card key={tenant.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{tenant.name}</p>
                  <p className="text-xs text-muted-foreground">/{tenant.slug}</p>
                </div>
              </div>
              <Switch
                checked={tenant.is_active}
                onCheckedChange={() => handleToggleActive(tenant)}
              />
            </div>
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Badge variant={tenant.subscription_plan === "premium" ? "default" : "secondary"} className="text-xs">
                  {tenant.subscription_plan}
                </Badge>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {stats[tenant.id]?.bookings_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {stats[tenant.id]?.contacts_count || 0}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openTenantLanding(tenant.slug)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEditDialog(tenant)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => openDeleteDialog(tenant)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {filteredTenants.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron tenants
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
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
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openTenantLanding(tenant.slug)}
                        title="Ver landing"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(tenant)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(tenant)}
                        title="Eliminar"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Eliminar Tenant</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar <strong>{tenantToDelete?.name}</strong>?
              <br /><br />
              Esta acción eliminará permanentemente:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Todas las reservas</li>
                <li>Todos los servicios</li>
                <li>Todas las transacciones</li>
                <li>Todos los contactos de WhatsApp</li>
                <li>Todas las reseñas</li>
                <li>Todas las integraciones</li>
              </ul>
              <br />
              <strong className="text-destructive">Esta acción no se puede deshacer.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTenant} 
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Eliminar permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
