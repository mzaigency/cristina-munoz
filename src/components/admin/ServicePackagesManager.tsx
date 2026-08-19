import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Loader2 className="glow-spinner" />
      </div>
    );
  }

  const totalSaving = packages.reduce(
    (a, pkg) => a + Math.max(0, pkg.original_total - pkg.package_price),
    0,
  );

  return (
    <div className="glow-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="glow-page-h">
        <div>
          <h2>Paquetes</h2>
          <p>
            {packages.length} {packages.length === 1 ? "paquete" : "paquetes"}
            {totalSaving > 0 && ` · ahorran ${totalSaving.toFixed(0)} € frente a suelto`}
          </p>
        </div>
        <div className="glow-page-actions">
          <button className="glow-btn glow-btn--primary glow-btn--sm" onClick={handleOpenCreate}>
            <Plus style={{ width: 14, height: 14 }} /> Nuevo
          </button>
        </div>
      </div>

      {packages.length === 0 ? (
        <div className="glow-card">
          <div className="glow-empty">
            <div className="glow-empty-ic"><Package style={{ width: 24, height: 24 }} /></div>
            <h4>Sin paquetes</h4>
            <p>Crea combos de servicios con descuento</p>
            <button className="glow-btn glow-btn--primary" style={{ marginTop: 12 }} onClick={handleOpenCreate}>
              <Plus style={{ width: 14, height: 14 }} /> Crear paquete
            </button>
          </div>
        </div>
      ) : (
        /* Una sola matriz, como Servicios y Productos */
        <div className="glow-card glow-card--clip">
          {packages.map((pkg) => {
            const saving = Math.max(0, pkg.original_total - pkg.package_price);
            return (
              <div
                key={pkg.id}
                className="glow-row"
                style={{ alignItems: "flex-start", ...(!pkg.is_active ? { opacity: 0.55 } : {}) }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                    <span className="glow-row-nm">{pkg.name}</span>
                    {!pkg.is_active && <span className="glow-badge">Inactivo</span>}
                    {pkg.discount_percentage > 0 && (
                      <span className="glow-badge glow-badge--ok">
                        <Percent style={{ width: 11, height: 11 }} />
                        {pkg.discount_percentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  {pkg.description && (
                    <div className="glow-row-mt" style={{ marginTop: 3 }}>{pkg.description}</div>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
                    {pkg.services.map((sv, i) => (
                      <span key={i} className="glow-badge">
                        <Scissors style={{ width: 11, height: 11 }} />{sv.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign: "right", flex: "none" }}>
                  <div className="glow-row-amt" style={{ marginLeft: 0 }}>
                    {pkg.package_price.toFixed(2)} €
                  </div>
                  {saving > 0 && (
                    <div className="glow-row-mt" style={{ textDecoration: "line-through" }}>
                      {pkg.original_total.toFixed(2)} €
                    </div>
                  )}
                </div>

                <div className="glow-row-actions">
                  <button className="glow-icon-btn" aria-label={`Editar ${pkg.name}`} onClick={() => handleOpenEdit(pkg)}>
                    <Edit style={{ width: 14, height: 14 }} />
                  </button>
                  <button
                    className="glow-icon-btn"
                    aria-label={`Eliminar ${pkg.name}`}
                    style={{ color: "var(--glow-danger-ink)" }}
                    onClick={() => handleDelete(pkg.id)}
                  >
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPackage ? "Editar Paquete" : "Nuevo Paquete"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label>Nombre *</label>
              <input className="glow-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Pack Novia Completo"
              />
            </div>

            <div>
              <label>Descripción</label>
              <textarea className="glow-input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del paquete..."
                rows={2}
              />
            </div>

            <div>
              <label className="mb-2 block">Servicios incluidos *</label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-3">
                {Object.entries(groupedServices).map(([category, categoryServices]) => (
                  <div key={category}>
                    <p className="text-xs font-medium text-outline mb-1">{category}</p>
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
                          <span className="text-sm text-outline">{service.price?.toFixed(2)}€</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-outline mt-1">{selectedServices.length} servicios seleccionados</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Precio original:</span>
                <span className="font-medium">{originalTotal.toFixed(2)}€</span>
              </div>
              <div>
                <label>Precio del paquete (€)</label>
                <input className="glow-input"
                  type="number"
                  step="0.01"
                  value={formData.package_price}
                  onChange={(e) => setFormData({ ...formData, package_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              {discountPercentage > 0 && (
                <p className="text-sm text-glow-ok-ink mt-2">
                  Ahorro: {discountPercentage.toFixed(0)}% ({(originalTotal - formData.package_price).toFixed(2)}€)
                </p>
              )}
            </div>

            <div className="glow-form-grid">
              <div>
                <label>Válido desde</label>
                <input className="glow-input"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>
              <div>
                <label>Válido hasta</label>
                <input className="glow-input"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label>Paquete activo</label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <button className="glow-btn" onClick={() => setIsDialogOpen(false)}>Cancelar</button>
            <button className="glow-btn glow-btn--primary" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="glow-spinner-sm" />}
              {editingPackage ? "Guardar" : "Crear"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}