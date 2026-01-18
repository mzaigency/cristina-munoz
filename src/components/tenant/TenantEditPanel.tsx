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
  tiktok_url: string | null;
  whatsapp_number: string | null;
  google_maps_url: string | null;
  font_heading?: string | null;
  font_body?: string | null;
  heading_size?: string | null;
  button_style?: string | null;
}

// Helper para extraer username de URL
const extractUsername = (url: string | null, platform: 'instagram' | 'facebook' | 'tiktok'): string => {
  if (!url) return '';
  
  // Si ya es solo un username
  if (!url.includes('/') && !url.includes('.')) {
    return url.replace('@', '');
  }
  
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.replace(/^\/+|\/+$/g, '');
    return path.replace('@', '');
  } catch {
    // Si no es una URL válida, devolver como está
    return url.replace('@', '');
  }
};

// Helper para construir URL completa
const buildSocialUrl = (username: string, platform: 'instagram' | 'facebook' | 'tiktok'): string | null => {
  if (!username.trim()) return null;
  const cleanUsername = username.replace('@', '').trim();
  
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${cleanUsername}`;
    case 'facebook':
      return `https://facebook.com/${cleanUsername}`;
    case 'tiktok':
      return `https://tiktok.com/@${cleanUsername}`;
    default:
      return null;
  }
};

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

const NAME_SIZES = [
  { value: "medium", label: "Mediano" },
  { value: "large", label: "Grande" },
  { value: "xlarge", label: "Extra grande" },
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
    heading_size: tenant.heading_size || "xlarge",
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

            {/* Name Size */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Tamaño del nombre</h3>
              <div className="grid grid-cols-3 gap-2">
                {NAME_SIZES.map((size) => (
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
                        size.value === "medium" ? "text-base" :
                        size.value === "large" ? "text-lg" :
                        "text-2xl"
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
                    formData.heading_size === "medium" ? "text-3xl" :
                    formData.heading_size === "large" ? "text-4xl" :
                    "text-5xl"
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
                <CardTitle className="text-sm flex items-center gap-2">
                  Redes sociales
                </CardTitle>
                <p className="text-xs text-muted-foreground">Solo escribe tu nombre de usuario</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Instagram */}
                <div>
                  <Label className="text-xs flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </div>
                    Instagram
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                    <Input
                      value={extractUsername(formData.instagram_url, 'instagram')}
                      onChange={(e) => handleChange("instagram_url", buildSocialUrl(e.target.value, 'instagram'))}
                      placeholder="tusalon"
                      className="pl-7"
                    />
                  </div>
                </div>

                {/* TikTok */}
                <div>
                  <Label className="text-xs flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-black flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                    </div>
                    TikTok
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                    <Input
                      value={extractUsername(formData.tiktok_url, 'tiktok')}
                      onChange={(e) => handleChange("tiktok_url", buildSocialUrl(e.target.value, 'tiktok'))}
                      placeholder="tusalon"
                      className="pl-7"
                    />
                  </div>
                </div>

                {/* Facebook */}
                <div>
                  <Label className="text-xs flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    Facebook
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">/</span>
                    <Input
                      value={extractUsername(formData.facebook_url, 'facebook')}
                      onChange={(e) => handleChange("facebook_url", buildSocialUrl(e.target.value, 'facebook'))}
                      placeholder="tusalon"
                      className="pl-7"
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <Label className="text-xs flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    WhatsApp
                  </Label>
                  <Input
                    value={formData.whatsapp_number || ""}
                    onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                    placeholder="+34 612 345 678"
                    className="mt-1"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Número con código de país</p>
                </div>

                {/* Google Maps */}
                <div>
                  <Label className="text-xs flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-red-500 flex items-center justify-center">
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                    Google Maps
                  </Label>
                  <Input
                    value={formData.google_maps_url || ""}
                    onChange={(e) => handleChange("google_maps_url", e.target.value)}
                    placeholder="https://goo.gl/maps/..."
                    className="mt-1"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Pega el enlace de compartir de Google Maps</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
