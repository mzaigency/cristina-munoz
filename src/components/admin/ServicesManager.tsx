import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlowModal } from "./layout/GlowModal";
import { useGlowConfirm } from "./layout/GlowConfirm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Upload, Image, X, Crown, Search, Scissors } from "lucide-react";
import { ImageCropper } from "./ImageCropper";
import { PlanUsageBar } from "./PlanUsageBar";
import { UpgradePrompt } from "./UpgradePrompt";
import { usePlanLimits } from "@/hooks/usePlanLimits";

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
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
  const { confirm, confirmDialog } = useGlowConfirm();
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

      const priceValue = formData.price === "" ? null : Number(formData.price);
      
      const serviceData = {
        name: formData.name.trim(),
        category: formData.category.trim() || "General",
        type: formData.type,
        duration_part1_active: formData.duration_part1_active,
        duration_exposure_pause: formData.type === "Compuesto" ? formData.duration_exposure_pause : 0,
        duration_part2_active: formData.type === "Compuesto" ? formData.duration_part2_active : 0,
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

  const handleDelete = async (service: Service) => {
    const ok = await confirm({
      title: "¿Eliminar servicio?",
      description: `"${service.name}" dejará de poder reservarse. Las citas ya reservadas no cambian.`,
    });
    if (!ok) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", service.id);

      if (error) throw error;

      toast({
        title: "Servicio eliminado",
        description: `${service.name} se ha eliminado correctamente`,
      });

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
          onConflict: "tenant_id,category"
        });

      if (error) throw error;

      toast({
        title: "Imagen actualizada",
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

  // Group services by category
  const allCategories = Array.from(
    new Set(services.map((sv) => sv.category || "Otros")),
  ).sort();

  const visibleServices = services.filter((sv) => {
    const cat = sv.category || "Otros";
    if (catFilter !== "all" && cat !== catFilter) return false;
    if (!search.trim()) return true;
    return sv.name.toLowerCase().includes(search.trim().toLowerCase());
  });

  const groupedServices = visibleServices.reduce((acc, service) => {
    const category = service.category || "Otros";
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const categories = Object.keys(groupedServices).sort();

  const priced = services.filter((sv) => sv.price !== null);
  const avgPrice = priced.length
    ? priced.reduce((a, sv) => a + (sv.price ?? 0), 0) / priced.length
    : 0;

  if (loading) {
    return (
      <div className="glow-loader">
        <Loader2 className="glow-spinner" />
      </div>
    );
  }

  const upgradePlan = getUpgradePlanForLimit("services");

  return (
    <>
      <div className="glow-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="glow-page-h">
          <div>
            <h2>Servicios</h2>
            <p>
              {services.length} {services.length === 1 ? "servicio" : "servicios"}
              {allCategories.length > 0 && ` · ${allCategories.length} ${allCategories.length === 1 ? "categoría" : "categorías"}`}
              {avgPrice > 0 && ` · ${avgPrice.toFixed(0)} € de media`}
            </p>
            <div style={{ marginTop: 8, maxWidth: 260 }}>
              <PlanUsageBar current={currentServices} max={maxServices} label="Servicios" />
            </div>
          </div>
          <div className="glow-page-actions">
            <button
              className={`glow-btn${canAddService() ? " glow-btn--primary" : ""}`}
              onClick={handleOpenCreate}
            >
              {canAddService() ? (
                <><Plus style={{ width: 14, height: 14 }} /> Nuevo servicio</>
              ) : (
                <><Crown style={{ width: 14, height: 14, color: "var(--glow-warn-ink)" }} /> Mejorar plan</>
              )}
            </button>
          </div>
        </div>

        {services.length > 0 && (
          <div className="glow-toolbar">
            <input
              className="glow-input"
              placeholder="Buscar servicio…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className={`glow-chip${catFilter === "all" ? " glow-chip--on" : ""}`}
              onClick={() => setCatFilter("all")}
            >
              Todas
            </button>
            {allCategories.map((c) => (
              <button
                key={c}
                className={`glow-chip${catFilter === c ? " glow-chip--on" : ""}`}
                onClick={() => setCatFilter(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {services.length === 0 ? (
          <div className="glow-card">
            <div className="glow-empty">
              <div className="glow-empty-ic"><Image style={{ width: 24, height: 24 }} /></div>
              <h4>Sin servicios</h4>
              <p>Aún no has añadido ninguno. Empieza por el que más haces.</p>
              <button className="glow-btn glow-btn--primary" onClick={handleOpenCreate}>
                <Plus style={{ width: 14, height: 14 }} /> Añadir primer servicio
              </button>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="glow-card">
            <div className="glow-empty">
              <div className="glow-empty-ic"><Search style={{ width: 24, height: 24 }} /></div>
              <h4>Sin resultados</h4>
              <p>Ningún servicio coincide con la búsqueda.</p>
              <button className="glow-btn" onClick={() => { setSearch(""); setCatFilter("all"); }}>
                Limpiar filtros
              </button>
            </div>
          </div>
        ) : (
          /* Un solo contenedor: las categorías son cabecera de grupo, no una
             tarjeta cada una. Misma pieza en móvil y en escritorio. */
          <div className="glow-card glow-card--clip">
            {categories.map((category) => (
              <div key={category}>
                <div className="glow-group">
                  {getCategoryImage(category) ? (
                    <img
                      src={getCategoryImage(category)}
                      alt=""
                      style={{ width: 20, height: 20, borderRadius: 6, objectFit: "cover", flex: "none" }}
                    />
                  ) : (
                    <span className="glow-group-dot" style={{ background: "var(--glow-line)" }} />
                  )}
                  <span>{category}</span>
                  <span className="glow-group-n">
                    {groupedServices[category].length}{" "}
                    {groupedServices[category].length === 1 ? "servicio" : "servicios"}
                  </span>
                  <button
                    className="glow-btn glow-btn--sm glow-btn--ghost"
                    style={{ marginLeft: 8, textTransform: "none", letterSpacing: 0 }}
                    onClick={() => {
                      setSelectedCategory(category);
                      setIsCategoryImageDialogOpen(true);
                    }}
                  >
                    <Upload style={{ width: 12, height: 12 }} /> Imagen
                  </button>
                </div>

                {groupedServices[category].map((service) => (
                  <div key={service.id} className="glow-row">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="glow-row-nm" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {service.name}
                      </div>
                      <div className="glow-row-mt">
                        {formatDuration(service)} · {service.type}
                      </div>
                    </div>
                    <div className="glow-row-amt">
                      {service.price !== null ? `${service.price.toFixed(2)} €` : "—"}
                    </div>
                    <div className="glow-row-actions">
                      <button
                        className="glow-icon-btn"
                        aria-label={`Editar ${service.name}`}
                        onClick={() => handleOpenEdit(service)}
                      >
                        <Pencil style={{ width: 14, height: 14 }} />
                      </button>
                      <button
                        className="glow-icon-btn"
                        aria-label={`Eliminar ${service.name}`}
                        style={{ color: "var(--glow-danger-ink)" }}
                        onClick={() => handleDelete(service)}
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service Dialog */}
      <GlowModal
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={selectedService ? "Editar servicio" : "Nuevo servicio"}
        description={selectedService ? "Modifica los datos del servicio." : "Se mostrará en tu web y en la reserva online."}
        icon={<Scissors />}
        footer={
          <>
            <button className="glow-btn" onClick={() => setIsDialogOpen(false)}>Cancelar</button>
            <button className="glow-btn glow-btn--primary" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="glow-spinner-sm" />}
              {selectedService ? "Guardar cambios" : "Crear servicio"}
            </button>
          </>
        }
      >
        <div className="glow-form">
            <div className="glow-field">
              <label htmlFor="service-name">Nombre del servicio</label>
              <input className="glow-input"
                id="service-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Corte y peinado"
              />
            </div>
            
            <div className="glow-form-grid">
              <div className="glow-field">
                <label htmlFor="service-category">Categoría</label>
                <div className="relative">
                  <input className="glow-input"
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
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        style={{
                          fontSize: 12,
                          padding: "2px 10px",
                          borderRadius: 20,
                          border: "1px solid " + (formData.category === cat ? "var(--glow-brand)" : "var(--glow-line-soft)"),
                          background: formData.category === cat ? "var(--glow-brand-soft)" : "transparent",
                          color: formData.category === cat ? "var(--glow-brand)" : "var(--glow-ink-3)",
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
              
              <div className="glow-field">
                <label htmlFor="service-type">Tipo</label>
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

            <div className="glow-field">
              <label htmlFor="duration1">
                {formData.type === "Compuesto" ? "Duración Parte 1 (min)" : "Duración (min)"}
              </label>
              <input className="glow-input"
                id="duration1"
                type="number"
                min="5"
                step="5"
                value={formData.duration_part1_active}
                onChange={(e) => setFormData({ ...formData, duration_part1_active: parseInt(e.target.value) || 0 })}
              />
            </div>

            {formData.type === "Compuesto" && (
              <>
                <div className="glow-field">
                  <label htmlFor="duration-pause">Tiempo de exposición/pausa (min)</label>
                  <input className="glow-input"
                    id="duration-pause"
                    type="number"
                    min="0"
                    step="5"
                    value={formData.duration_exposure_pause}
                    onChange={(e) => setFormData({ ...formData, duration_exposure_pause: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="glow-field">
                  <label htmlFor="duration2">Duración Parte 2 (min)</label>
                  <input className="glow-input"
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

            <div className="glow-field">
              <label htmlFor="service-price">Precio (€) - Opcional</label>
              <input className="glow-input"
                id="service-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej: 25.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
              <p className="text-xs text-outline mt-1">
                Deja vacío si no quieres mostrar precio
              </p>
            </div>
          </div>

      </GlowModal>

      {confirmDialog}

      {/* Category Image Dialog */}
      <GlowModal
        open={isCategoryImageDialogOpen}
        onOpenChange={setIsCategoryImageDialogOpen}
        title="Imagen de categoría"
        description={`Sube una imagen cuadrada (1:1) para "${selectedCategory}".`}
        icon={<Image />}
        size="sm"
        footer={
          <button className="glow-btn glow-btn--grow" onClick={() => setIsCategoryImageDialogOpen(false)}>
            Cerrar
          </button>
        }
      >
        <div className="glow-form">
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
                  className="glow-btn glow-btn--sm glow-btn--danger"
                  style={{ position: "absolute", top: 8, right: 8 }}
                  onClick={handleDeleteCategoryImage}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="glow-spinner-sm" /> : <X style={{ width: 14, height: 14 }} />}
                </button>
              </div>
            )}
            
            <div>
              <label htmlFor="category-image-upload" className="cursor-pointer">
                <div className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                  <span>{uploading ? "Subiendo..." : "Subir nueva imagen"}</span>
                </div>
              </label>
              <input
                ref={fileInputRef}
                id="category-image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelected(file);
                  // Reset input so user can select same file again
                  if (e.target) e.target.value = "";
                }}
                disabled={uploading}
              />
            </div>
          </div>

      </GlowModal>

      {/* Image Cropper */}
      <ImageCropper
        open={cropperOpen}
        onClose={() => {
          setCropperOpen(false);
          setCropImageSrc(null);
        }}
        imageSrc={cropImageSrc || ""}
        aspectRatio={1}
        outputSize={512}
        onCropComplete={handleCroppedImage}
      />

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
