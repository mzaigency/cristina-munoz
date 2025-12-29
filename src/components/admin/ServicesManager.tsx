import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Upload, Image, X } from "lucide-react";
import { ImageCropper } from "./ImageCropper";

interface Service {
  id: string;
  name: string;
  category: string | null;
  type: string;
  duration_part1_active: number;
  duration_exposure_pause: number;
  duration_part2_active: number;
  price: number | null;
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
    category: "Corte",
    type: "Simple",
    duration_part1_active: 30,
    duration_exposure_pause: 0,
    duration_part2_active: 0,
    price: "" as string | number,
  });
  const { toast } = useToast();
  
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
          .order("category", { ascending: true })
          .order("name", { ascending: true }),
        supabase
          .from("tenant_category_images")
          .select("*")
          .eq("tenant_id", tenantId)
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
    setSelectedService(null);
    setFormData({
      name: "",
      category: "Corte",
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
        category: formData.category,
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
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || "Otros";
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const categories = Object.keys(groupedServices);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Servicios</h2>
          <p className="text-muted-foreground">Añade, edita o elimina los servicios de tu negocio</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Servicio
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No hay servicios todavía</p>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir primer servicio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getCategoryImage(category) ? (
                      <img 
                        src={getCategoryImage(category)} 
                        alt={category}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        <Image className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <CardTitle>{category}</CardTitle>
                      <CardDescription>{groupedServices[category].length} servicios</CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(category);
                      setIsCategoryImageDialogOpen(true);
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Imagen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedServices[category].map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>
                          <Badge variant={service.type === "Compuesto" ? "secondary" : "outline"}>
                            {service.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDuration(service)}</TableCell>
                        <TableCell>
                          {service.price !== null ? (
                            <span className="font-medium text-primary">{service.price.toFixed(2)} €</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(service)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedService(service);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Service Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedService ? "Editar Servicio" : "Nuevo Servicio"}
            </DialogTitle>
            <DialogDescription>
              {selectedService ? "Modifica los datos del servicio" : "Añade un nuevo servicio a tu catálogo"}
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
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                {formData.type === "Compuesto" ? "Duración Parte 1 (min)" : "Duración (min)"}
              </Label>
              <Input
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedService ? "Guardar Cambios" : "Crear Servicio"}
            </Button>
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
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Image Dialog */}
      <Dialog open={isCategoryImageDialogOpen} onOpenChange={setIsCategoryImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Imagen de Categoría</DialogTitle>
            <DialogDescription>
              Sube una imagen cuadrada (1:1) para la categoría "{selectedCategory}"
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
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleDeleteCategoryImage}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                </Button>
              </div>
            )}
            
            <div>
              <Label htmlFor="category-image-upload" className="cursor-pointer">
                <div className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                  <span>{uploading ? "Subiendo..." : "Subir nueva imagen"}</span>
                </div>
              </Label>
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryImageDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
};

export default ServicesManager;
