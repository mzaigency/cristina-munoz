import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Upload, Image, X, GripVertical, Crown } from "lucide-react";
import { ImageCropper } from "./ImageCropper";
import { PlanUsageBar } from "./PlanUsageBar";
import { UpgradePrompt } from "./UpgradePrompt";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Service {
  id: string;
  name: string;
  category: string | null;
  type: string;
  duration_part1_active: number;
  duration_exposure_pause: number;
  duration_part2_active: number;
  price: number | null;
  sort_order?: number;
}

interface CategoryImage {
  id: string;
  category: string;
  image_url: string;
}

interface ServicesManagerProps {
  tenantId: string;
}

const DEFAULT_CATEGORIES = [
  "Corte",
  "Coloración",
  "Peinados y Tratamientos",
  "Depilación y Maquillaje",
  "Otros",
];

const storageSafeSlug = (value: string) => {
  // Supabase Storage keys must be URL-safe; remove accents and special chars.
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export const ServicesManager = ({ tenantId }: ServicesManagerProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [categoryImages, setCategoryImages] = useState<CategoryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCategoryImageDialogOpen, setIsCategoryImageDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    type: "Simple",
    duration_part1_active: 30,
    duration_exposure_pause: 0,
    duration_part2_active: 0,
    price: "" as string | number,
  });
  const { toast } = useToast();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  // Plan limits
  const { 
    canAddService, 
    maxServices, 
    currentServices, 
    planSlug, 
    getUpgradePlanForLimit,
    refetch: refetchPlanLimits 
  } = usePlanLimits(tenantId);
  
  // Cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [servicesRes, imagesRes] = await Promise.all([
        supabase
          .from("services")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("sort_order", { ascending: true })
          .order("category", { ascending: true })
          .order("name", { ascending: true }),
        supabase
          .from("tenant_category_images")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("sort_order", { ascending: true })
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (imagesRes.error) throw imagesRes.error;

      setServices(servicesRes.data || []);
      setCategoryImages(imagesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    // Check if can add more services
    if (!canAddService()) {
      setShowUpgradePrompt(true);
      return;
    }
    
    setSelectedService(null);
    setFormData({
      name: "",
      category: "",
      type: "Simple",
      duration_part1_active: 30,
      duration_exposure_pause: 0,
      duration_part2_active: 0,
      price: "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      category: service.category || "Otros",
      type: service.type,
      duration_part1_active: service.duration_part1_active,
      duration_exposure_pause: service.duration_exposure_pause,
      duration_part2_active: service.duration_part2_active,
      price: service.price ?? "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del servicio es obligatorio",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const priceValue = formData.price === ""? null : Number(formData.price); const serviceData = { name: formData.name.trim(), category: formData.category.trim() ||"General",
        type: formData.type,
        duration_part1_active: formData.duration_part1_active,
        duration_exposure_pause: formData.type === "Compuesto"? formData.duration_exposure_pause : 0, duration_part2_active: formData.type ==="Compuesto" ? formData.duration_part2_active : 0,
        price: priceValue,
        tenant_id: tenantId,
      };

      if (selectedService) {
        // Update
        const { error } = await supabase
          .from("services")
          .update(serviceData)
          .eq("id", selectedService.id);

        if (error) throw error;

        toast({
          title: "Servicio actualizado",
          description: `${formData.name} se ha actualizado correctamente`,
        });
      } else {
        // Create
        const { error } = await supabase
          .from("services")
          .insert(serviceData);

        if (error) throw error;

        toast({
          title: "Servicio creado",
          description: `${formData.name} se ha añadido correctamente`,
        });
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error saving service:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el servicio",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedService) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", selectedService.id);

      if (error) throw error;

      toast({
        title: "Servicio eliminado",
        description: `${selectedService.name} se ha eliminado correctamente`,
      });

      setIsDeleteDialogOpen(false);
      setSelectedService(null);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting service:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el servicio",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Called when user picks a file – open cropper instead of uploading directly
  const handleFileSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropImageSrc(e.target?.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Called after cropping is done – upload the cropped blob
  const handleCroppedImage = async (blob: Blob) => {
    if (!selectedCategory) return;

    try {
      setUploading(true);

      const categorySlug = storageSafeSlug(selectedCategory);
      const fileName = `${tenantId}/category-${categorySlug}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("tenant-assets")
        .upload(fileName, blob, { upsert: true, contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("tenant-assets")
        .getPublicUrl(fileName);

      // Upsert category image
      const { error } = await supabase
        .from("tenant_category_images")
        .upsert({
          tenant_id: tenantId,
          category: selectedCategory,
          image_url: publicUrl,
        }, {
          onConflict: "tenant_id,category"}); if (error) throw error; toast({ title:"Imagen actualizada",
        description: `Imagen de la categoría ${selectedCategory} actualizada`,
      });

      setIsCategoryImageDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error uploading category image:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo subir la imagen",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Delete category image
  const handleDeleteCategoryImage = async () => {
    if (!selectedCategory) return;

    const existingImage = categoryImages.find(ci => ci.category === selectedCategory);
    if (!existingImage) return;

    try {
      setUploading(true);

      // Delete from database
      const { error } = await supabase
        .from("tenant_category_images")
        .delete()
        .eq("id", existingImage.id);

      if (error) throw error;

      // Try to delete from storage (extract path from URL)
      try {
        const url = new URL(existingImage.image_url);
        const pathParts = url.pathname.split("/tenant-assets/");
        if (pathParts[1]) {
          await supabase.storage.from("tenant-assets").remove([decodeURIComponent(pathParts[1])]);
        }
      } catch {
        // Ignore storage deletion errors
      }

      toast({
        title: "Imagen eliminada",
        description: `La imagen de ${selectedCategory} ha sido eliminada`,
      });

      setIsCategoryImageDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting category image:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la imagen",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getCategoryImage = (category: string) => {
    return categoryImages.find(ci => ci.category === category)?.image_url;
  };

  const formatDuration = (service: Service) => {
    const total = service.duration_part1_active + service.duration_exposure_pause + service.duration_part2_active;
    if (total < 60) return `${total} min`;
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Drag & drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Handle service reorder within category
  const handleDragEnd = async (event: DragEndEvent, category: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const categoryServices = groupedServices[category];
    const oldIndex = categoryServices.findIndex(s => s.id === active.id);
    const newIndex = categoryServices.findIndex(s => s.id === over.id);

    const reordered = arrayMove(categoryServices, oldIndex, newIndex);
    
    // Update local state immediately
    setServices(prev => {
      const others = prev.filter(s => s.category !== category);
      return [...others, ...reordered];
    });

    // Save to database
    const updates = reordered.map((s, idx) => ({ id: s.id, sort_order: idx }));
    for (const upd of updates) {
      await supabase.from("services").update({ sort_order: upd.sort_order }).eq("id", upd.id);
    }
  };

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || "Otros";
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const categories = Object.keys(groupedServices);

  if (loading) {
    return (
      <div className="gp-loader">
        <Loader2 className="gp-spinner" />
      </div>
    );
  }

  const upgradePlan = getUpgradePlanForLimit("services");

  return (
    <>
      <div className="gp-fade"style={{ display:"flex", flexDirection: "column", gap: 20 }}>
        <div className="gp-page-h">
          <div>
            <h2>Gestión de Servicios</h2>
            <p>Añade, edita o elimina los servicios de tu negocio</p>
            <div style={{ marginTop: 8, maxWidth: 260 }}>
              <PlanUsageBar current={currentServices} max={maxServices} label="Servicios" />
            </div>
          </div>
          <div className="gp-page-actions">
            <button
              className={`gp-btn${canAddService() ? " primary":""}`}
              onClick={handleOpenCreate}
            >
              {canAddService() ? (
                <><Plus style={{ width: 14, height: 14 }} /> Nuevo Servicio</>
              ) : (
                <><Crown style={{ width: 14, height: 14, color: "var(--gp-warn)" }} /> Mejorar plan</>
              )}
            </button>
          </div>
        </div>

      {categories.length === 0 ? (
        <div className="gp-card">
          <div className="gp-empty">
            <div className="gp-empty-ic"><Image style={{ width: 24, height: 24 }} /></div>
            <h4>Sin servicios</h4>
            <p>No hay servicios todavía</p>
            <button className="gp-btn primary"style={{ marginTop: 12 }} onClick={handleOpenCreate}> <Plus style={{ width: 14, height: 14 }} /> Añadir primer servicio </button> </div> </div> ) : ( <div style={{ display:"flex", flexDirection: "column", gap: 16 }}>
          {categories.map((category) => (
            <div key={category} className="gp-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--gp-line2)", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {getCategoryImage(category) ? (
                    <img
                      src={getCategoryImage(category)}
                      alt={category}
                      style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--gp-chip)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Image style={{ width: 20, height: 20, color: "var(--gp-muted-c)"}} /> </div> )} <div> <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{category}</p> <p style={{ fontSize: 12.5, color:"var(--gp-muted-c)", margin: 0 }}>{groupedServices[category].length} servicios</p>
                  </div>
                </div>
                <button
                  className="gp-btn sm"onClick={() => { setSelectedCategory(category); setIsCategoryImageDialogOpen(true); }} > <Upload style={{ width: 13, height: 13 }} /> Imagen </button> </div> <div style={{ padding:"12px 18px" }}>
                {/* Mobile card list */}
                <div className="flex flex-col gap-2 md:hidden">
                  {groupedServices[category].map((service) => (
                    <div key={service.id} style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid var(--gp-line2)", background: "var(--gp-surface-2)"}}> <div style={{ display:"flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{service.name}</p> <div style={{ display:"flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <span className="gp-badge neutral">{service.type}</span>
                            <span style={{ fontSize: 12.5, color: "var(--gp-muted-c)" }}>{formatDuration(service)}</span>
                          </div>
                        </div>
                        {service.price !== null ? (
                          <span className="gp-mono"style={{ fontWeight: 700, color:"var(--gp-accent)", flexShrink: 0, marginLeft: 8 }}>{service.price.toFixed(2)} €</span>
                        ) : (
                          <span style={{ color: "var(--gp-muted-c)", flexShrink: 0, marginLeft: 8 }}>-</span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="gp-btn sm" style={{ flex: 1 }} onClick={() => handleOpenEdit(service)}>
                          <Pencil style={{ width: 13, height: 13 }} /> Editar
                        </button>
                        <button
                          className="gp-btn sm danger"
                          onClick={() => {
                            setSelectedService(service);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 style={{ width: 13, height: 13 }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop list */}
                <div className="hidden md:block">
                  <table style={{ width: "100%", borderCollapse: "collapse"}}> <thead> <tr style={{ borderBottom:"1px solid var(--gp-line2)" }}>
                        {["Nombre", "Tipo", "Duración", "Precio", "Acciones"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 12.5, fontWeight: 700, color: "var(--gp-muted-c)", letterSpacing: "0.02em"}}>{h}</th> ))} </tr> </thead> <tbody> {groupedServices[category].map((service) => ( <tr key={service.id} style={{ borderBottom:"1px solid var(--gp-line2)"}}> <td style={{ padding:"10px 12px", fontWeight: 600, fontSize: 14 }}>{service.name}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span className="gp-badge neutral">{service.type}</span>
                          </td>
                          <td style={{ padding: "10px 12px", fontSize: 13.5, color: "var(--gp-ink2)"}}>{formatDuration(service)}</td> <td style={{ padding:"10px 12px" }}>
                            {service.price !== null ? (
                              <span className="gp-mono"style={{ fontWeight: 700, color:"var(--gp-accent)"}}>{service.price.toFixed(2)} €</span> ) : ( <span style={{ color:"var(--gp-muted-c)"}}>-</span> )} </td> <td style={{ padding:"10px 12px"}}> <div style={{ display:"flex", gap: 4 }}>
                              <button className="gp-icon-btn" onClick={() => handleOpenEdit(service)}>
                                <Pencil style={{ width: 14, height: 14 }} />
                              </button>
                              <button
                                className="gp-icon-btn"style={{ color:"var(--gp-danger)"}} onClick={() => { setSelectedService(service); setIsDeleteDialogOpen(true); }} > <Trash2 style={{ width: 14, height: 14 }} /> </button> </div> </td> </tr> ))} </tbody> </table> </div> </div> </div> ))} </div> )} {/* Service Dialog */} <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}> <DialogContent> <DialogHeader> <DialogTitle> {selectedService ?"Editar Servicio":"Nuevo Servicio"}
            </DialogTitle>
            <DialogDescription>
              {selectedService ? "Modifica los datos del servicio":"Añade un nuevo servicio a tu catálogo"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="service-name">Nombre del servicio</Label>
              <Input
                id="service-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Corte y peinado"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service-category">Categoría</Label>
                <div className="relative">
                  <Input
                    id="service-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Escribe o selecciona..."
                    list="category-options"
                  />
                  <datalist id="category-options">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                {categories.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {categories.slice(0, 4).map((cat) => (
                      <button
                        key={cat}
                        type="button"onClick={() => setFormData({ ...formData, category: cat })} style={{ fontSize: 12, padding:"2px 10px",
                          borderRadius: 20,
                          border: "1px solid "+ (formData.category === cat ?"var(--gp-accent)":"var(--gp-line2)"),
                          background: formData.category === cat ? "var(--gp-accent-soft)":"transparent",
                          color: formData.category === cat ? "var(--gp-accent)":"var(--gp-muted-c)",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="service-type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Simple">Simple</SelectItem>
                    <SelectItem value="Compuesto">Compuesto (con pausa)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="duration1">
                {formData.type === "Compuesto"?"Duración Parte 1 (min)":"Duración (min)"}
              </Label>
              <Input
                id="duration1"
                type="number"
                min="5"
                step="5"value={formData.duration_part1_active} onChange={(e) => setFormData({ ...formData, duration_part1_active: parseInt(e.target.value) || 0 })} /> </div> {formData.type ==="Compuesto" && (
              <>
                <div>
                  <Label htmlFor="duration-pause">Tiempo de exposición/pausa (min)</Label>
                  <Input
                    id="duration-pause"
                    type="number"
                    min="0"
                    step="5"
                    value={formData.duration_exposure_pause}
                    onChange={(e) => setFormData({ ...formData, duration_exposure_pause: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="duration2">Duración Parte 2 (min)</Label>
                  <Input
                    id="duration2"
                    type="number"
                    min="0"
                    step="5"
                    value={formData.duration_part2_active}
                    onChange={(e) => setFormData({ ...formData, duration_part2_active: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="service-price">Precio (€) - Opcional</Label>
              <Input
                id="service-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej: 25.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Deja vacío si no quieres mostrar precio
              </p>
            </div>
          </div>

          <DialogFooter>
            <button className="gp-btn" onClick={() => setIsDialogOpen(false)}>Cancelar</button>
            <button className="gp-btn primary" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="gp-spinner-sm"/>} {selectedService ?"Guardar Cambios":"Crear Servicio"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar "{selectedService?.name}"? 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : null} Eliminar </AlertDialogAction> </AlertDialogFooter> </AlertDialogContent> </AlertDialog> {/* Category Image Dialog */} <Dialog open={isCategoryImageDialogOpen} onOpenChange={setIsCategoryImageDialogOpen}> <DialogContent> <DialogHeader> <DialogTitle>Imagen de Categoría</DialogTitle> <DialogDescription> Sube una imagen cuadrada (1:1) para la categoría"{selectedCategory}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedCategory && getCategoryImage(selectedCategory) && (
              <div className="relative">
                <div className="aspect-square w-48 mx-auto overflow-hidden rounded-lg bg-muted">
                  <img 
                    src={getCategoryImage(selectedCategory)} 
                    alt={selectedCategory}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Delete button */}
                <button
                  className="gp-btn sm danger"style={{ position:"absolute", top: 8, right: 8 }}
                  onClick={handleDeleteCategoryImage}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="gp-spinner-sm" /> : <X style={{ width: 14, height: 14 }} />}
                </button>
              </div>
            )}
            
            <div>
              <Label htmlFor="category-image-upload" className="cursor-pointer">
                <div className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5"/> )} <span>{uploading ?"Subiendo...":"Subir nueva imagen"}</span>
                </div>
              </Label>
              <input
                ref={fileInputRef}
                id="category-image-upload"
                type="file"
                accept="image/*"
                className="hidden"onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelected(file); // Reset input so user can select same file again if (e.target) e.target.value ="";
                }}
                disabled={uploading}
              />
            </div>
          </div>

          <DialogFooter>
            <button className="gp-btn"onClick={() => setIsCategoryImageDialogOpen(false)}>Cerrar</button> </DialogFooter> </DialogContent> </Dialog> {/* Image Cropper */} <ImageCropper open={cropperOpen} onClose={() => { setCropperOpen(false); setCropImageSrc(null); }} imageSrc={cropImageSrc ||""}
        aspectRatio={1}
        outputSize={512}
        onCropComplete={handleCroppedImage}
      />
      </div>

      <UpgradePrompt
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        currentPlan={planSlug}
        targetPlan={upgradePlan || "pro"}
        feature="más servicios"
        tenantId={tenantId}
      />
    </>
  );
};
export default ServicesManager;
