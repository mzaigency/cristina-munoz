import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Palette, 
  Type, 
  Image as ImageIcon, 
  Save, 
  X,
  Upload,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  tagline: string | null;
  description: string | null;
  hero_image_url: string | null;
  is_active: boolean | null;
  instagram_url: string | null;
  facebook_url: string | null;
  whatsapp_number: string | null;
  google_maps_url: string | null;
}

interface TenantEditPanelProps {
  tenant: Tenant;
  onClose: () => void;
  onSave: (updatedTenant: Tenant) => void;
}

export const TenantEditPanel = ({ tenant, onClose, onSave }: TenantEditPanelProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Tenant>({ ...tenant });

  const handleChange = (field: keyof Tenant, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value || null }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          name: formData.name,
          tagline: formData.tagline,
          description: formData.description,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          logo_url: formData.logo_url,
          hero_image_url: formData.hero_image_url,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          instagram_url: formData.instagram_url,
          facebook_url: formData.facebook_url,
          whatsapp_number: formData.whatsapp_number,
          google_maps_url: formData.google_maps_url,
        })
        .eq("id", tenant.id);

      if (error) throw error;

      toast({
        title: "Cambios guardados",
        description: "Tu página ha sido actualizada correctamente",
      });

      onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving tenant:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const colorPresets = [
    { name: "Violeta", primary: "#8B5CF6", secondary: "#D946EF" },
    { name: "Rosa", primary: "#EC4899", secondary: "#F472B6" },
    { name: "Azul", primary: "#3B82F6", secondary: "#60A5FA" },
    { name: "Verde", primary: "#10B981", secondary: "#34D399" },
    { name: "Naranja", primary: "#F97316", secondary: "#FB923C" },
    { name: "Rojo", primary: "#EF4444", secondary: "#F87171" },
    { name: "Dorado", primary: "#D4AF37", secondary: "#FFD700" },
    { name: "Negro", primary: "#1F2937", secondary: "#4B5563" },
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-background border-l shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Personalizar página</h2>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            size="sm"
          >
            {saving ? (
              <>Guardando...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Tabs defaultValue="brand" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="brand" className="text-xs">
              <Palette className="h-4 w-4 mr-1" />
              Marca
            </TabsTrigger>
            <TabsTrigger value="content" className="text-xs">
              <Type className="h-4 w-4 mr-1" />
              Textos
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-xs">
              <ImageIcon className="h-4 w-4 mr-1" />
              Contacto
            </TabsTrigger>
          </TabsList>

          {/* Brand Tab */}
          <TabsContent value="brand" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Colores del tema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Color Presets */}
                <div className="grid grid-cols-4 gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        handleChange("primary_color", preset.primary);
                        handleChange("secondary_color", preset.secondary);
                      }}
                      className={`p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                        formData.primary_color === preset.primary 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "border-transparent"
                      }`}
                    >
                      <div 
                        className="h-8 rounded-md mb-1"
                        style={{ 
                          background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`
                        }}
                      />
                      <span className="text-xs text-muted-foreground">{preset.name}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Colors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Color primario</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        value={formData.primary_color || "#8B5CF6"}
                        onChange={(e) => handleChange("primary_color", e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                      />
                      <Input
                        value={formData.primary_color || ""}
                        onChange={(e) => handleChange("primary_color", e.target.value)}
                        placeholder="#8B5CF6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Color secundario</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        value={formData.secondary_color || "#D946EF"}
                        onChange={(e) => handleChange("secondary_color", e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                      />
                      <Input
                        value={formData.secondary_color || ""}
                        onChange={(e) => handleChange("secondary_color", e.target.value)}
                        placeholder="#D946EF"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Imágenes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">URL del logo</Label>
                  <Input
                    value={formData.logo_url || ""}
                    onChange={(e) => handleChange("logo_url", e.target.value)}
                    placeholder="https://ejemplo.com/logo.png"
                    className="mt-1"
                  />
                  {formData.logo_url && (
                    <div className="mt-2 p-2 bg-muted rounded-lg">
                      <img 
                        src={formData.logo_url} 
                        alt="Logo preview" 
                        className="h-12 w-auto mx-auto"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs">URL imagen hero</Label>
                  <Input
                    value={formData.hero_image_url || ""}
                    onChange={(e) => handleChange("hero_image_url", e.target.value)}
                    placeholder="https://ejemplo.com/hero.jpg"
                    className="mt-1"
                  />
                  {formData.hero_image_url && (
                    <div className="mt-2 p-2 bg-muted rounded-lg">
                      <img 
                        src={formData.hero_image_url} 
                        alt="Hero preview" 
                        className="h-24 w-full object-cover rounded"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Información del salón</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Nombre del salón</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Eslogan</Label>
                  <Input
                    value={formData.tagline || ""}
                    onChange={(e) => handleChange("tagline", e.target.value)}
                    placeholder="Tu mejor versión comienza aquí"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Descripción</Label>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Describe tu salón..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Datos de contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Teléfono</Label>
                    <Input
                      value={formData.phone || ""}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="612 345 678"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">WhatsApp</Label>
                    <Input
                      value={formData.whatsapp_number || ""}
                      onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                      placeholder="34612345678"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Email</Label>
                  <Input
                    value={formData.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="info@salon.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Dirección</Label>
                  <Input
                    value={formData.address || ""}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Calle Principal 123"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Ciudad</Label>
                    <Input
                      value={formData.city || ""}
                      onChange={(e) => handleChange("city", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Código postal</Label>
                    <Input
                      value={formData.postal_code || ""}
                      onChange={(e) => handleChange("postal_code", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Redes sociales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Instagram</Label>
                  <Input
                    value={formData.instagram_url || ""}
                    onChange={(e) => handleChange("instagram_url", e.target.value)}
                    placeholder="https://instagram.com/tusalon"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Facebook</Label>
                  <Input
                    value={formData.facebook_url || ""}
                    onChange={(e) => handleChange("facebook_url", e.target.value)}
                    placeholder="https://facebook.com/tusalon"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Google Maps</Label>
                  <Input
                    value={formData.google_maps_url || ""}
                    onChange={(e) => handleChange("google_maps_url", e.target.value)}
                    placeholder="https://goo.gl/maps/..."
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
