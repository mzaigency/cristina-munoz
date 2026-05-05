import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Image, Palette, Type, Save, ExternalLink, Layout } from "lucide-react";
import { landingThemes } from "@/components/onboarding/landing-themes";

interface TenantSettingsProps {
  tenantId: string;
  tenantSlug: string;
}

interface TenantData {
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  show_logo_on_landing: boolean;
  heading_size: string | null;
  theme_id: string | null;
}

export const TenantSettings = ({ tenantId, tenantSlug }: TenantSettingsProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTenantData();
  }, [tenantId]);

  const fetchTenantData = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select(
          "name, tagline, description, logo_url, hero_image_url, primary_color, secondary_color, phone, email, address, city, postal_code, show_logo_on_landing, heading_size, theme_id",
        )
        .eq("id", tenantId)
        .single();

      if (error) throw error;
      setTenant({
        ...data,
        show_logo_on_landing: data.show_logo_on_landing ?? true,
        heading_size: data.heading_size ?? "xlarge",
        theme_id: data.theme_id ?? "immersive",
      });
    } catch (error) {
      console.error("Error fetching tenant:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, type: "logo" | "hero") => {
    try {
      setUploading(type);

      const fileExt = file.name.split(".").pop();
      const fileName = `${tenantId}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("tenant-assets")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("tenant-assets").getPublicUrl(fileName);

      const fieldName = type === "logo" ? "logo_url" : "hero_image_url";
      setTenant((prev) => (prev ? { ...prev, [fieldName]: publicUrl } : null));

      toast({
        title: "Imagen subida",
        description: `${type === "logo" ? "Logo" : "Imagen hero"} actualizado correctamente`,
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo subir la imagen",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    if (!tenant) return;

    try {
      setSaving(true);

      const { data, error } = await supabase
        .from("tenants")
        .update({
          name: tenant.name,
          tagline: tenant.tagline,
          description: tenant.description,
          logo_url: tenant.logo_url,
          hero_image_url: tenant.hero_image_url,
          primary_color: tenant.primary_color,
          secondary_color: tenant.secondary_color,
          phone: tenant.phone,
          email: tenant.email,
          address: tenant.address,
          city: tenant.city,
          postal_code: tenant.postal_code,
          show_logo_on_landing: tenant.show_logo_on_landing,
          heading_size: tenant.heading_size,
          theme_id: tenant.theme_id,
        })
        .eq("id", tenantId)
        .select("id");

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Sin permisos para guardar. Contacta con soporte.");
      }

      toast({
        title: "✅ Guardado",
        description: "La configuración se ha guardado correctamente",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      console.error("Error saving tenant:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant) return null;

  return (
    <div className="space-y-6 pb-24">
      {/* Header - Mobile responsive */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Personalización de Landing</h2>
          <p className="text-sm md:text-base text-muted-foreground">Configura la apariencia de tu página web</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" asChild className="h-11 md:h-10">
            <a href={`/${tenantSlug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver web
            </a>
          </Button>
          <Button onClick={handleSave} disabled={saving} className="h-11 md:h-10">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Guardar Cambios
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Información Básica
            </CardTitle>
            <CardDescription>Nombre y descripción de tu negocio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre del negocio</Label>
              <Input id="name" value={tenant.name} onChange={(e) => setTenant({ ...tenant, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="heading_size">Tamaño del nombre</Label>
              <select
                id="heading_size"
                value={tenant.heading_size || "xlarge"}
                onChange={(e) => setTenant({ ...tenant, heading_size: e.target.value })}
                className="w-full h-10 px-3 border rounded-md bg-background text-foreground"
              >
                <option value="medium">Mediano</option>
                <option value="large">Grande</option>
                <option value="xlarge">Extra grande</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">Solo cambia el tamaño del nombre en el hero</p>
            </div>
            <div>
              <Label htmlFor="tagline">Eslogan</Label>
              <Input
                id="tagline"
                value={tenant.tagline || ""}
                onChange={(e) => setTenant({ ...tenant, tagline: e.target.value })}
                placeholder="Tu peluquería de confianza"
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={tenant.description || ""}
                onChange={(e) => setTenant({ ...tenant, description: e.target.value })}
                placeholder="Descripción de tu negocio..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Colores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Colores
            </CardTitle>
            <CardDescription>Personaliza los colores de tu marca</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="primary_color">Color Principal</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  id="primary_color"
                  value={tenant.primary_color || "#8B5CF6"}
                  onChange={(e) => setTenant({ ...tenant, primary_color: e.target.value })}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={tenant.primary_color || "#8B5CF6"}
                  onChange={(e) => setTenant({ ...tenant, primary_color: e.target.value })}
                  placeholder="#8B5CF6"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="secondary_color">Color Secundario</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  id="secondary_color"
                  value={tenant.secondary_color || "#D946EF"}
                  onChange={(e) => setTenant({ ...tenant, secondary_color: e.target.value })}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={tenant.secondary_color || "#D946EF"}
                  onChange={(e) => setTenant({ ...tenant, secondary_color: e.target.value })}
                  placeholder="#D946EF"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="pt-2">
              <Label>Vista previa</Label>
              <div className="flex gap-2 mt-2">
                <div
                  className="w-12 h-12 rounded-lg shadow-sm"
                  style={{ backgroundColor: tenant.primary_color || "#8B5CF6" }}
                />
                <div
                  className="w-12 h-12 rounded-lg shadow-sm"
                  style={{ backgroundColor: tenant.secondary_color || "#D946EF" }}
                />
                <div
                  className="flex-1 h-12 rounded-lg shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${tenant.primary_color || "#8B5CF6"}, ${tenant.secondary_color || "#D946EF"})`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tema de Landing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Tema de Landing
            </CardTitle>
            <CardDescription>Elige el estilo visual de tu página web</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {landingThemes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setTenant({ ...tenant, theme_id: theme.id })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    tenant.theme_id === theme.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold text-foreground">{theme.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{theme.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Logo
            </CardTitle>
            <CardDescription>Sube el logo de tu negocio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tenant.logo_url && (
                <div className="flex justify-center p-4 bg-muted rounded-lg">
                  <img src={tenant.logo_url} alt="Logo" className="max-h-24 object-contain" />
                </div>
              )}
              <div>
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                    {uploading === "logo" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                    <span>{uploading === "logo" ? "Subiendo..." : "Subir Logo"}</span>
                  </div>
                </Label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, "logo");
                  }}
                  disabled={uploading === "logo"}
                />
              </div>
              <div>
                <Label htmlFor="logo_url">O introduce una URL</Label>
                <Input
                  id="logo_url"
                  value={tenant.logo_url || ""}
                  onChange={(e) => setTenant({ ...tenant, logo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              {/* Logo visibility toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="show_logo_landing" className="text-sm font-medium">
                    Mostrar logo en landing
                  </Label>
                  <p className="text-xs text-muted-foreground">El logo se mostrará en la sección hero de tu página</p>
                </div>
                <input
                  type="checkbox"
                  id="show_logo_landing"
                  checked={tenant.show_logo_on_landing}
                  onChange={(e) => setTenant({ ...tenant, show_logo_on_landing: e.target.checked })}
                  className="h-5 w-5 rounded border-input accent-primary"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hero Image */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Imagen Hero
            </CardTitle>
            <CardDescription>Imagen principal de tu landing page</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tenant.hero_image_url && (
                <div className="aspect-video relative overflow-hidden rounded-lg bg-muted">
                  <img src={tenant.hero_image_url} alt="Hero" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <Label htmlFor="hero-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                    {uploading === "hero" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                    <span>{uploading === "hero" ? "Subiendo..." : "Subir Imagen Hero"}</span>
                  </div>
                </Label>
                <input
                  id="hero-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, "hero");
                  }}
                  disabled={uploading === "hero"}
                />
              </div>
              <div>
                <Label htmlFor="hero_image_url">O introduce una URL</Label>
                <Input
                  id="hero_image_url"
                  value={tenant.hero_image_url || ""}
                  onChange={(e) => setTenant({ ...tenant, hero_image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
            <CardDescription>Datos de contacto que aparecerán en tu landing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={tenant.phone || ""}
                  onChange={(e) => setTenant({ ...tenant, phone: e.target.value })}
                  placeholder="+34 600 000 000"
                  className="h-11 md:h-10"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={tenant.email || ""}
                  onChange={(e) => setTenant({ ...tenant, email: e.target.value })}
                  placeholder="info@ejemplo.com"
                  className="h-11 md:h-10"
                />
              </div>
              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={tenant.city || ""}
                  onChange={(e) => setTenant({ ...tenant, city: e.target.value })}
                  placeholder="Madrid"
                  className="h-11 md:h-10"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={tenant.address || ""}
                  onChange={(e) => setTenant({ ...tenant, address: e.target.value })}
                  placeholder="Calle Principal, 123"
                  className="h-11 md:h-10"
                />
              </div>
              <div>
                <Label htmlFor="postal_code">Código Postal</Label>
                <Input
                  id="postal_code"
                  value={tenant.postal_code || ""}
                  onChange={(e) => setTenant({ ...tenant, postal_code: e.target.value })}
                  placeholder="28001"
                  className="h-11 md:h-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sticky guided save bar */}
      <div
        className="sticky bottom-0 left-0 right-0 z-30 -mx-4 md:-mx-6 mt-6 px-4 md:px-6 py-3 bg-background/95 backdrop-blur-md border-t border-border flex items-center gap-3"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        role="status"
        aria-live="polite"
      >
        <div className="flex-1 text-sm">
          <span className="text-base mr-1" aria-hidden>👉</span>
          <span className="font-medium">Cuando termines, pulsa <span className="text-primary">Guardar Cambios</span> para aplicar.</span>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-11 guided-halo"
          data-guided-cta="true"
        >
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar
        </Button>
      </div>
    </div>
  );
};

export default TenantSettings;
