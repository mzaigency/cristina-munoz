import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Image, Palette, Type, Save, Layout, Building2, Phone, Sparkles, Pencil } from "lucide-react";
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
    <div className="space-y-5 pb-28">
      {/* Tip card - direct user to visual editor for landing visuals */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-transparent p-4 flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Editor visual rápido</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cambia temas, tipografías y colores en directo desde tu landing.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0 h-9 gap-1.5">
          <a href={`/${tenantSlug}?edit=1`} target="_blank" rel="noopener noreferrer">
            <Pencil className="h-3.5 w-3.5" />
            Abrir
          </a>
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Identidad */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              Identidad del negocio
            </CardTitle>
            <CardDescription>Nombre, eslogan y descripción que verán tus clientes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Nombre del negocio</Label>
                <Input
                  id="name"
                  value={tenant.name}
                  onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="heading_size">Tamaño en hero</Label>
                <select
                  id="heading_size"
                  value={tenant.heading_size || "xlarge"}
                  onChange={(e) => setTenant({ ...tenant, heading_size: e.target.value })}
                  className="w-full h-10 px-3 mt-1 border rounded-md bg-background text-foreground text-sm"
                >
                  <option value="medium">Mediano</option>
                  <option value="large">Grande</option>
                  <option value="xlarge">Extra grande</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="tagline">Eslogan</Label>
              <Input
                id="tagline"
                value={tenant.tagline || ""}
                onChange={(e) => setTenant({ ...tenant, tagline: e.target.value })}
                placeholder="Tu peluquería de confianza"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={tenant.description || ""}
                onChange={(e) => setTenant({ ...tenant, description: e.target.value })}
                placeholder="Describe tu negocio en pocas líneas..."
                rows={3}
                className="mt-1 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Colores */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-primary" />
              Colores de marca
            </CardTitle>
            <CardDescription>Definen el acento visual de tu landing</CardDescription>
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
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layout className="h-4 w-4 text-primary" />
              Tema de landing
            </CardTitle>
            <CardDescription>Layout y estilo visual de toda la página</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2.5">
              {landingThemes.map((theme) => {
                const isActive = tenant.theme_id === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setTenant({ ...tenant, theme_id: theme.id })}
                    className={`group relative p-3 rounded-xl border-2 text-left transition-all overflow-hidden ${
                      isActive
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-1.5"
                      style={{
                        background: `linear-gradient(90deg, ${theme.defaultColors.primary}, ${theme.defaultColors.secondary})`,
                      }}
                    />
                    <p className="font-semibold text-sm text-foreground mt-1">{theme.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{theme.description}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Imágenes (Logo + Hero combined) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Image className="h-4 w-4 text-primary" />
              Imágenes de marca
            </CardTitle>
            <CardDescription>Logo y foto principal de tu landing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 md:grid-cols-2">
              {/* Logo */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Logo</Label>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="show_logo_landing" className="text-xs text-muted-foreground cursor-pointer">
                      Mostrar en hero
                    </Label>
                    <input
                      type="checkbox"
                      id="show_logo_landing"
                      checked={tenant.show_logo_on_landing}
                      onChange={(e) => setTenant({ ...tenant, show_logo_on_landing: e.target.checked })}
                      className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                    />
                  </div>
                </div>

                <div className="aspect-square max-w-[160px] rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                  {tenant.logo_url ? (
                    <img src={tenant.logo_url} alt="Logo" className="max-h-full max-w-full object-contain p-3" />
                  ) : (
                    <Image className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>

                <Label htmlFor="logo-upload" className="cursor-pointer block">
                  <div className="flex items-center justify-center gap-2 h-10 rounded-lg bg-muted hover:bg-muted/70 transition-colors text-sm">
                    {uploading === "logo" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>{uploading === "logo" ? "Subiendo..." : "Subir logo"}</span>
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

              {/* Hero image */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Imagen principal (hero)</Label>

                <div className="aspect-video rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                  {tenant.hero_image_url ? (
                    <img src={tenant.hero_image_url} alt="Hero" className="w-full h-full object-cover" />
                  ) : (
                    <Image className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>

                <Label htmlFor="hero-upload" className="cursor-pointer block">
                  <div className="flex items-center justify-center gap-2 h-10 rounded-lg bg-muted hover:bg-muted/70 transition-colors text-sm">
                    {uploading === "hero" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>{uploading === "hero" ? "Subiendo..." : "Subir imagen hero"}</span>
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
                <p className="text-[11px] text-muted-foreground">Recomendado: 1920×1080 o mayor</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4 text-primary" />
              Información de contacto
            </CardTitle>
            <CardDescription>Aparecerá en el footer y en la sección de contacto</CardDescription>
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
        className="sticky bottom-0 left-0 right-0 z-30 -mx-4 md:-mx-6 mt-6 px-4 md:px-6 py-3 bg-background/90 backdrop-blur-xl border-t border-border flex items-center gap-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)]"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        role="status"
        aria-live="polite"
      >
        <p className="flex-1 text-xs text-muted-foreground hidden sm:block">
          Los cambios se aplican al guardar.
        </p>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-11 w-full sm:w-auto guided-halo gap-2"
          data-guided-cta="true"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
};

export default TenantSettings;
