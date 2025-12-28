import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Palette, 
  Type, 
  MapPin, 
  Image as ImageIcon, 
  Save, 
  X,
  Eye,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { TenantImageUploader } from "./TenantImageUploader";

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
  instagram_url: string | null;
  facebook_url: string | null;
  whatsapp_number: string | null;
  google_maps_url: string | null;
  font_heading?: string | null;
  font_body?: string | null;
  heading_size?: string | null;
  button_style?: string | null;
}

interface TenantEditPanelProps {
  tenant: Tenant;
  onClose: () => void;
  onSave: (updatedTenant: Tenant) => void;
}

const FONT_OPTIONS = [
  { value: "Playfair Display", label: "Playfair Display", style: "serif" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond", style: "serif" },
  { value: "Libre Baskerville", label: "Libre Baskerville", style: "serif" },
  { value: "Lora", label: "Lora", style: "serif" },
  { value: "Merriweather", label: "Merriweather", style: "serif" },
  { value: "Inter", label: "Inter", style: "sans-serif" },
  { value: "Poppins", label: "Poppins", style: "sans-serif" },
  { value: "Montserrat", label: "Montserrat", style: "sans-serif" },
  { value: "Raleway", label: "Raleway", style: "sans-serif" },
  { value: "Open Sans", label: "Open Sans", style: "sans-serif" },
  { value: "Nunito", label: "Nunito", style: "sans-serif" },
  { value: "Quicksand", label: "Quicksand", style: "sans-serif" },
];

const HEADING_SIZES = [
  { value: "small", label: "Pequeño" },
  { value: "normal", label: "Normal" },
  { value: "large", label: "Grande" },
  { value: "xlarge", label: "Muy grande" },
];

const BUTTON_STYLES = [
  { value: "rounded", label: "Redondeado" },
  { value: "pill", label: "Píldora" },
  { value: "square", label: "Cuadrado" },
  { value: "sharp", label: "Bordes vivos" },
];

const COLOR_PRESETS = [
  { name: "Violeta Elegante", primary: "#8B5CF6", secondary: "#D946EF" },
  { name: "Rosa Romántico", primary: "#EC4899", secondary: "#F472B6" },
  { name: "Azul Profesional", primary: "#3B82F6", secondary: "#60A5FA" },
  { name: "Verde Natural", primary: "#10B981", secondary: "#34D399" },
  { name: "Naranja Cálido", primary: "#F97316", secondary: "#FB923C" },
  { name: "Rojo Pasión", primary: "#EF4444", secondary: "#F87171" },
  { name: "Dorado Lujoso", primary: "#D4AF37", secondary: "#FFD700" },
  { name: "Negro Minimalista", primary: "#1F2937", secondary: "#4B5563" },
  { name: "Terracota", primary: "#C2410C", secondary: "#EA580C" },
  { name: "Lavanda", primary: "#7C3AED", secondary: "#A78BFA" },
  { name: "Turquesa", primary: "#0D9488", secondary: "#14B8A6" },
  { name: "Coral", primary: "#F43F5E", secondary: "#FB7185" },
];

export const TenantEditPanel = ({ tenant, onClose, onSave }: TenantEditPanelProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Tenant>({ 
    ...tenant,
    font_heading: tenant.font_heading || "Playfair Display",
    font_body: tenant.font_body || "Inter",
    heading_size: tenant.heading_size || "normal",
    button_style: tenant.button_style || "rounded",
  });
  const [activeTab, setActiveTab] = useState("design");

  const handleChange = (field: keyof Tenant, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          font_heading: formData.font_heading,
          font_body: formData.font_body,
          heading_size: formData.heading_size,
          button_style: formData.button_style,
        })
        .eq("id", tenant.id);

      if (error) throw error;

      toast({
        title: "¡Cambios guardados!",
        description: "Tu página ha sido actualizada",
      });

      onSave(formData);
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

  return (
    <div className="fixed inset-y-0 right-0 z-[70] w-full max-w-lg bg-background border-l shadow-2xl flex flex-col">
      {/* Header */}
      <div className="shrink-0 bg-background/95 backdrop-blur-sm border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Editor Visual</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <>Guardando...</>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar
              </>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="shrink-0 border-b px-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-12 bg-transparent gap-1">
            <TabsTrigger 
              value="design" 
              className="flex-1 gap-2 data-[state=active]:bg-primary/10"
            >
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Diseño</span>
            </TabsTrigger>
            <TabsTrigger 
              value="typography" 
              className="flex-1 gap-2 data-[state=active]:bg-primary/10"
            >
              <Type className="h-4 w-4" />
              <span className="hidden sm:inline">Tipografía</span>
            </TabsTrigger>
            <TabsTrigger 
              value="images" 
              className="flex-1 gap-2 data-[state=active]:bg-primary/10"
            >
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Imágenes</span>
            </TabsTrigger>
            <TabsTrigger 
              value="content" 
              className="flex-1 gap-2 data-[state=active]:bg-primary/10"
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Info</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <Tabs value={activeTab} className="w-full">
          {/* Design Tab */}
          <TabsContent value="design" className="mt-0 space-y-6">
            {/* Color Palette */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                Paleta de colores
              </h3>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      handleChange("primary_color", preset.primary);
                      handleChange("secondary_color", preset.secondary);
                    }}
                    className={`group relative p-2 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                      formData.primary_color === preset.primary 
                        ? "border-primary ring-2 ring-primary/20" 
                        : "border-transparent hover:border-muted-foreground/20"
                    }`}
                  >
                    <div 
                      className="h-12 rounded-lg mb-1.5 shadow-sm"
                      style={{ 
                        background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground leading-tight block">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Colors */}
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg shrink-0 shadow-inner"
                      style={{ backgroundColor: formData.primary_color || "#8B5CF6" }}
                    />
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Color primario</Label>
                      <div className="flex gap-2 mt-1">
                        <input
                          type="color"
                          value={formData.primary_color || "#8B5CF6"}
                          onChange={(e) => handleChange("primary_color", e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                        />
                        <Input
                          value={formData.primary_color || ""}
                          onChange={(e) => handleChange("primary_color", e.target.value)}
                          placeholder="#8B5CF6"
                          className="flex-1 h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg shrink-0 shadow-inner"
                      style={{ backgroundColor: formData.secondary_color || "#D946EF" }}
                    />
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Color secundario</Label>
                      <div className="flex gap-2 mt-1">
                        <input
                          type="color"
                          value={formData.secondary_color || "#D946EF"}
                          onChange={(e) => handleChange("secondary_color", e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                        />
                        <Input
                          value={formData.secondary_color || ""}
                          onChange={(e) => handleChange("secondary_color", e.target.value)}
                          placeholder="#D946EF"
                          className="flex-1 h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Button Style */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Estilo de botones</h3>
              <div className="grid grid-cols-4 gap-2">
                {BUTTON_STYLES.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => handleChange("button_style", style.value)}
                    className={`p-3 border-2 transition-all ${
                      formData.button_style === style.value 
                        ? "border-primary bg-primary/5" 
                        : "border-muted hover:border-muted-foreground/30"
                    } ${
                      style.value === "rounded" ? "rounded-lg" :
                      style.value === "pill" ? "rounded-full" :
                      style.value === "square" ? "rounded-sm" :
                      "rounded-none"
                    }`}
                  >
                    <div 
                      className={`h-6 bg-primary/80 ${
                        style.value === "rounded" ? "rounded-md" :
                        style.value === "pill" ? "rounded-full" :
                        style.value === "square" ? "rounded-sm" :
                        "rounded-none"
                      }`}
                    />
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      {style.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="mt-0 space-y-6">
            {/* Heading Font */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Type className="h-4 w-4 text-primary" />
                Fuente de títulos
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {FONT_OPTIONS.filter(f => f.style === "serif").map((font) => (
                  <button
                    key={font.value}
                    onClick={() => handleChange("font_heading", font.value)}
                    className={`p-3 border-2 rounded-lg text-left transition-all ${
                      formData.font_heading === font.value 
                        ? "border-primary bg-primary/5" 
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <span 
                      className="text-lg block truncate"
                      style={{ fontFamily: font.value }}
                    >
                      {font.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Serif elegante</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Body Font */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Fuente de textos</h3>
              <div className="grid grid-cols-2 gap-2">
                {FONT_OPTIONS.filter(f => f.style === "sans-serif").map((font) => (
                  <button
                    key={font.value}
                    onClick={() => handleChange("font_body", font.value)}
                    className={`p-3 border-2 rounded-lg text-left transition-all ${
                      formData.font_body === font.value 
                        ? "border-primary bg-primary/5" 
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <span 
                      className="text-base block truncate"
                      style={{ fontFamily: font.value }}
                    >
                      {font.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Sans-serif moderno</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Heading Size */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Tamaño de títulos</h3>
              <div className="grid grid-cols-4 gap-2">
                {HEADING_SIZES.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => handleChange("heading_size", size.value)}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      formData.heading_size === size.value 
                        ? "border-primary bg-primary/5" 
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <span 
                      className={`block font-bold ${
                        size.value === "small" ? "text-sm" :
                        size.value === "normal" ? "text-base" :
                        size.value === "large" ? "text-lg" :
                        "text-xl"
                      }`}
                    >
                      Aa
                    </span>
                    <span className="text-[10px] text-muted-foreground">{size.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Vista previa</CardTitle>
              </CardHeader>
              <CardContent>
                <h2 
                  className={`font-bold mb-2 ${
                    formData.heading_size === "small" ? "text-xl" :
                    formData.heading_size === "normal" ? "text-2xl" :
                    formData.heading_size === "large" ? "text-3xl" :
                    "text-4xl"
                  }`}
                  style={{ 
                    fontFamily: formData.font_heading || "Playfair Display",
                    color: formData.primary_color || "#8B5CF6"
                  }}
                >
                  {formData.name || "Tu Salón"}
                </h2>
                <p 
                  className="text-muted-foreground"
                  style={{ fontFamily: formData.font_body || "Inter" }}
                >
                  {formData.tagline || "Tu mejor versión comienza aquí"}
                </p>
                <Button 
                  className={`mt-3 ${
                    formData.button_style === "rounded" ? "rounded-lg" :
                    formData.button_style === "pill" ? "rounded-full" :
                    formData.button_style === "square" ? "rounded-sm" :
                    "rounded-none"
                  }`}
                  style={{ 
                    backgroundColor: formData.primary_color || "#8B5CF6",
                    fontFamily: formData.font_body || "Inter"
                  }}
                >
                  Reservar cita
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="mt-0 space-y-6">
            {/* Logo */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                Logo del salón
              </h3>
              <TenantImageUploader
                tenantId={tenant.id}
                currentUrl={formData.logo_url}
                onUpload={(url) => handleChange("logo_url", url)}
                onRemove={() => handleChange("logo_url", null)}
                type="logo"
                aspectRatio="1/1"
                className="max-w-[200px]"
              />
            </div>

            {/* Hero Image */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Imagen principal (Hero)</h3>
              <TenantImageUploader
                tenantId={tenant.id}
                currentUrl={formData.hero_image_url}
                onUpload={(url) => handleChange("hero_image_url", url)}
                onRemove={() => handleChange("hero_image_url", null)}
                type="hero"
                aspectRatio="16/9"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Recomendado: 1920x1080px o mayor
              </p>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="mt-0 space-y-6">
            {/* Salon Info */}
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

            {/* Contact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Contacto</CardTitle>
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

            {/* Social */}
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
