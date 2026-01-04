import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus,
  Package,
  Trash2,
  Edit,
  Loader2,
  Percent,
  Scissors
} from "lucide-react";

interface ServicePackage {
  id: string;
  name: string;
  description: string | null;
  services: Array<{ service_id: string; name: string; original_price: number }>;
  original_total: number;
  package_price: number;
  discount_percentage: number;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
}

interface Service {
  id: string;
  name: string;
  price: number | null;
  category: string | null;
}

interface ServicePackagesManagerProps {
  tenantId: string;
}

export function ServicePackagesManager({ tenantId }: ServicePackagesManagerProps) {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    package_price: 0,
    is_active: true,
    valid_from: "",
    valid_until: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const fetchData = async () => {
    try {
      const [packagesRes, servicesRes] = await Promise.all([
        supabase
          .from("service_packages" as any)
          .select("*")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false }),
        supabase
          .from("services")
          .select("id, name, price, category")
          .eq("tenant_id", tenantId)
          .order("category")
          .order("name")
      ]);

      if (packagesRes.error) throw packagesRes.error;
      setPackages((packagesRes.data || []) as unknown as ServicePackage[]);
      setServices(servicesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const selectedServiceData = services.filter(s => selectedServices.includes(s.id));
    const originalTotal = selectedServiceData.reduce((sum, s) => sum + (s.price || 0), 0);
    const discountPercentage = originalTotal > 0 
      ? ((originalTotal - formData.package_price) / originalTotal) * 100 
      : 0;
    return { originalTotal, discountPercentage: Math.max(0, discountPercentage) };
  };

  const handleOpenCreate = () => {
    setEditingPackage(null);
    setSelectedServices([]);
    setFormData({
      name: "",
      description: "",
      package_price: 0,
      is_active: true,
      valid_from: "",
      valid_until: ""
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    setSelectedServices(pkg.services.map(s => s.service_id));
    setFormData({
      name: pkg.name,
      description: pkg.description || "",
      package_price: pkg.package_price,
      is_active: pkg.is_active,
      valid_from: pkg.valid_from ? format(new Date(pkg.valid_from), "yyyy-MM-dd") : "",
      valid_until: pkg.valid_until ? format(new Date(pkg.valid_until), "yyyy-MM-dd") : ""
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" });
      return;
    }
    if (selectedServices.length < 2) {
      toast({ title: "Error", description: "Selecciona al menos 2 servicios", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { originalTotal, discountPercentage } = calculateTotals();
      const servicesData = services
        .filter(s => selectedServices.includes(s.id))
        .map(s => ({ service_id: s.id, name: s.name, original_price: s.price || 0 }));

      const packageData = {
        tenant_id: tenantId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        services: servicesData,
        original_total: originalTotal,
        package_price: formData.package_price,
        discount_percentage: discountPercentage,
        is_active: formData.is_active,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null
      };

      if (editingPackage) {
        const { error } = await supabase
          .from("service_packages" as any)
          .update(packageData)
          .eq("id", editingPackage.id);
        if (error) throw error;
        toast({ title: "Paquete actualizado" });
      } else {
        const { error } = await supabase
          .from("service_packages" as any)
          .insert(packageData);
        if (error) throw error;
        toast({ title: "Paquete creado" });
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este paquete?")) return;
    
    try {
      const { error } = await supabase
        .from("service_packages" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Paquete eliminado" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const { originalTotal, discountPercentage } = calculateTotals();

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || "Otros";
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Paquetes de Servicios
          </h2>
          <p className="text-sm text-muted-foreground">{packages.length} paquetes</p>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nuevo
        </Button>
      </div>

      {packages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No hay paquetes todavía</p>
            <p className="text-sm text-muted-foreground">Crea combos de servicios con descuento</p>
            <Button onClick={handleOpenCreate} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Crear paquete
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {packages.map(pkg => (
            <Card key={pkg.id} className={!pkg.is_active ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{pkg.name}</h3>
                      {!pkg.is_active && (
                        <Badge variant="secondary" className="text-[10px]">Inactivo</Badge>
                      )}
                      {pkg.discount_percentage > 0 && (
                        <Badge className="bg-green-500/20 text-green-700 border-green-500/30 gap-1">
                          <Percent className="h-3 w-3" />
                          {pkg.discount_percentage.toFixed(0)}% dto
                        </Badge>
                      )}
                    </div>
                    
                    {pkg.description && (
                      <p className="text-sm text-muted-foreground mb-2">{pkg.description}</p>
                    )}

                    <div className="flex flex-wrap gap-1 mb-2">
                      {pkg.services.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          <Scissors className="h-3 w-3 mr-1" />
                          {s.name}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <span className="line-through text-muted-foreground">{pkg.original_total.toFixed(2)}€</span>
                      <span className="font-bold text-lg text-primary">{pkg.package_price.toFixed(2)}€</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(pkg)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(pkg.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPackage ? "Editar Paquete" : "Nuevo Paquete"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Pack Novia Completo"
              />
            </div>

            <div>
              <Label>Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del paquete..."
                rows={2}
              />
            </div>

            <div>
              <Label className="mb-2 block">Servicios incluidos *</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-3">
                {Object.entries(groupedServices).map(([category, categoryServices]) => (
                  <div key={category}>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{category}</p>
                    <div className="space-y-1">
                      {categoryServices.map(service => (
                        <label 
                          key={service.id} 
                          className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedServices.includes(service.id)}
                            onCheckedChange={() => toggleService(service.id)}
                          />
                          <span className="flex-1 text-sm">{service.name}</span>
                          <span className="text-sm text-muted-foreground">{service.price?.toFixed(2)}€</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{selectedServices.length} servicios seleccionados</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Precio original:</span>
                <span className="font-medium">{originalTotal.toFixed(2)}€</span>
              </div>
              <div>
                <Label>Precio del paquete (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.package_price}
                  onChange={(e) => setFormData({ ...formData, package_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              {discountPercentage > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  Ahorro: {discountPercentage.toFixed(0)}% ({(originalTotal - formData.package_price).toFixed(2)}€)
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Válido desde</Label>
                <Input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>
              <div>
                <Label>Válido hasta</Label>
                <Input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Paquete activo</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingPackage ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}