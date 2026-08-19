import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  language: string | null;
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
      const BASE_FIELDS =
        "name, tagline, description, logo_url, hero_image_url, primary_color, secondary_color, phone, email, address, city, postal_code, show_logo_on_landing, heading_size, theme_id";

      let { data, error } = await supabase
        .from("tenants")
        .select(`${BASE_FIELDS}, language`)
        .eq("id", tenantId)
        .single();

      // Fallback: la columna language aún no existe en la BD (migración pendiente)
      if (error) {
        const retry = await supabase.from("tenants").select(BASE_FIELDS).eq("id", tenantId).single();
        data = retry.data as typeof data;
        error = retry.error;
      }

      if (error) throw error;
      if (!data) throw new Error("Tenant no encontrado");
      setTenant({
        ...data,
        show_logo_on_landing: data.show_logo_on_landing ?? true,
        heading_size: data.heading_size ?? "xlarge",
        theme_id: data.theme_id ?? "immersive",
        language: (data as { language?: string }).language ?? "es",
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

      const basePayload = {
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
      };

      let { data, error } = await supabase
        .from("tenants")
        .update({ ...basePayload, language: tenant.language || "es" })
        .eq("id", tenantId)
        .select("id");

      // Fallback: la columna language aún no existe en la BD (migración pendiente)
      if (error) {
        const retry = await supabase.from("tenants").update(basePayload).eq("id", tenantId).select("id");
        data = retry.data;
        error = retry.error;
      }

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
    <div className="glow-fade" style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 96 }}>
      <div className="glow-page-h" style={{ marginBottom: 0 }}>
        <div>
          <h2>Ajustes</h2>
          <p>Cómo se ve tu salón en su web pública</p>
        </div>
      </div>

      {/* Atajo al editor visual */}
      <div
        className="glow-card"
        style={{
          display: "flex", alignItems: "center", gap: 12, padding: 14,
          background: "var(--glow-brand-softer)", borderColor: "var(--glow-brand-soft)",
        }}
      >
        <span className="glow-kpi-ic glow-kpi-ic--brand" style={{ marginBottom: 0 }}>
          <Sparkles style={{ width: 16, height: 16 }} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="glow-row-nm">Editor visual rápido</div>
          <div className="glow-row-mt">Cambia temas, tipografías y colores en directo desde tu web.</div>
        </div>
        <a
          className="glow-btn glow-btn--sm"
          href={`/${tenantSlug}?edit=1`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Pencil style={{ width: 13, height: 13 }} /> Abrir
        </a>
      </div>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        {/* Identidad */}
        <div className="glow-card" style={{ gridColumn: "1 / -1" }}>
          <div className="glow-card-h"><div>
            <h3>
              <Building2 style={{ width: 15, height: 15, color: "var(--glow-brand)" }} />
              Identidad del negocio
            </h3>
            <div className="glow-card-h-sub">Nombre, eslogan y descripción que verán tus clientes</div>
          </div></div>
          <div className="glow-card-b glow-form">
            <div className="glow-form-grid">
              <div className="glow-field">
                <label htmlFor="name">Nombre del negocio</label>
                <input className="glow-input mt-1"
                  id="name"
                  value={tenant.name}
                  onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="heading_size">Tamaño en hero</label>
                <select
                  id="heading_size"
                  value={tenant.heading_size || "xlarge"}
                  onChange={(e) => setTenant({ ...tenant, heading_size: e.target.value })}
                  className="w-full h-10 px-3 mt-1 border rounded-md bg-background text-on-surface text-sm"
                >
                  <option value="medium">Mediano</option>
                  <option value="large">Grande</option>
                  <option value="xlarge">Extra grande</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="tagline">Eslogan</label>
              <input className="glow-input mt-1"
                id="tagline"
                value={tenant.tagline || ""}
                onChange={(e) => setTenant({ ...tenant, tagline: e.target.value })}
                placeholder="Tu peluquería de confianza"
              />
            </div>
            <div>
              <label htmlFor="description">Descripción</label>
              <textarea className="glow-input mt-1 resize-none"
                id="description"
                value={tenant.description || ""}
                onChange={(e) => setTenant({ ...tenant, description: e.target.value })}
                placeholder="Describe tu negocio en pocas líneas..."
                rows={3}
              />
            </div>
            <div>
              <label htmlFor="language">Idioma de tu web pública</label>
              <select
                id="language"
                value={tenant.language || "es"}
                onChange={(e) => setTenant({ ...tenant, language: e.target.value })}
                className="w-full h-10 px-3 mt-1 border rounded-md bg-background text-on-surface text-sm sm:max-w-xs"
              >
                <option value="es">Español</option>
                <option value="ca">Català</option>
              </select>
              <p className="text-xs text-outline mt-1">
                Traduce los textos de la web que ven tus clientes (botones, secciones, reserva). Tus servicios y descripciones se muestran tal como los escribas.
              </p>
            </div>
          </div>
        </div>

        {/* Colores */}
        <div className="glow-card">
          <div className="glow-card-h"><div>
            <h3>
              <Palette style={{ width: 15, height: 15, color: "var(--glow-brand)" }} />
              Colores de marca
            </h3>
            <div className="glow-card-h-sub">Definen el acento visual de tu landing</div>
          </div></div>
          <div className="glow-card-b glow-form">
            <div>
              <label htmlFor="primary_color">Color Principal</label>
              <div className="flex gap-2">
                <input className="glow-input w-16 h-10 p-1 cursor-pointer"
                  type="color"
                  id="primary_color"
                  value={tenant.primary_color || "#22408C"}
                  onChange={(e) => setTenant({ ...tenant, primary_color: e.target.value })}
                />
                <input className="glow-input flex-1"
                  value={tenant.primary_color || "#22408C"}
                  onChange={(e) => setTenant({ ...tenant, primary_color: e.target.value })}
                  placeholder="#22408C"
                />
              </div>
            </div>
            <div>
              <label htmlFor="secondary_color">Color Secundario</label>
              <div className="flex gap-2">
                <input className="glow-input w-16 h-10 p-1 cursor-pointer"
                  type="color"
                  id="secondary_color"
                  value={tenant.secondary_color || "#98329A"}
                  onChange={(e) => setTenant({ ...tenant, secondary_color: e.target.value })}
                />
                <input className="glow-input flex-1"
                  value={tenant.secondary_color || "#98329A"}
                  onChange={(e) => setTenant({ ...tenant, secondary_color: e.target.value })}
                  placeholder="#98329A"
                />
              </div>
            </div>
            <div className="pt-2">
              <label>Vista previa</label>
              <div className="flex gap-2 mt-2">
                <div
                  className="w-12 h-12 rounded-lg shadow-sm"
                  style={{ backgroundColor: tenant.primary_color || "#22408C" }}
                />
                <div
                  className="w-12 h-12 rounded-lg shadow-sm"
                  style={{ backgroundColor: tenant.secondary_color || "#98329A" }}
                />
                <div
                  className="flex-1 h-12 rounded-lg shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${tenant.primary_color || "#22408C"}, ${tenant.secondary_color || "#98329A"})`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tema de Landing */}
        <div className="glow-card">
          <div className="glow-card-h"><div>
            <h3>
              <Layout style={{ width: 15, height: 15, color: "var(--glow-brand)" }} />
              Tema de landing
            </h3>
            <div className="glow-card-h-sub">Layout y estilo visual de toda la página</div>
          </div></div>
          <div className="glow-card-b">
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
                    <p className="font-semibold text-sm text-on-surface mt-1">{theme.name}</p>
                    <p className="text-[11px] text-outline mt-0.5 line-clamp-2">{theme.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Imágenes (Logo + Hero combined) */}
        <div className="glow-card" style={{ gridColumn: "1 / -1" }}>
          <div className="glow-card-h"><div>
            <h3>
              <Image style={{ width: 15, height: 15, color: "var(--glow-brand)" }} />
              Imágenes de marca
            </h3>
            <div className="glow-card-h-sub">Logo y foto principal de tu landing</div>
          </div></div>
          <div className="glow-card-b">
            <div className="grid gap-5 md:grid-cols-2">
              {/* Logo */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Logo</label>
                  <div className="flex items-center gap-2">
                    <label htmlFor="show_logo_landing" className="text-xs text-outline cursor-pointer">
                      Mostrar en hero
                    </label>
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
                    <Image className="h-8 w-8 text-outline/40" />
                  )}
                </div>

                <label htmlFor="logo-upload" className="cursor-pointer block">
                  <div className="flex items-center justify-center gap-2 h-10 rounded-lg bg-muted hover:bg-muted/70 transition-colors text-sm">
                    {uploading === "logo" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>{uploading === "logo" ? "Subiendo..." : "Subir logo"}</span>
                  </div>
                </label>
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
                <label className="text-sm font-medium">Imagen principal (hero)</label>

                <div className="aspect-video rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                  {tenant.hero_image_url ? (
                    <img src={tenant.hero_image_url} alt="Hero" className="w-full h-full object-cover" />
                  ) : (
                    <Image className="h-8 w-8 text-outline/40" />
                  )}
                </div>

                <label htmlFor="hero-upload" className="cursor-pointer block">
                  <div className="flex items-center justify-center gap-2 h-10 rounded-lg bg-muted hover:bg-muted/70 transition-colors text-sm">
                    {uploading === "hero" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>{uploading === "hero" ? "Subiendo..." : "Subir imagen hero"}</span>
                  </div>
                </label>
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
                <p className="text-[11px] text-outline">Recomendado: 1920×1080 o mayor</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="glow-card" style={{ gridColumn: "1 / -1" }}>
          <div className="glow-card-h"><div>
            <h3>
              <Phone style={{ width: 15, height: 15, color: "var(--glow-brand)" }} />
              Información de contacto
            </h3>
            <div className="glow-card-h-sub">Aparecerá en el footer y en la sección de contacto</div>
          </div></div>
          <div className="glow-card-b">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label htmlFor="phone">Teléfono</label>
                <input className="glow-input h-11 md:h-10"
                  id="phone"
                  value={tenant.phone || ""}
                  onChange={(e) => setTenant({ ...tenant, phone: e.target.value })}
                  placeholder="+34 600 000 000"
                />
              </div>
              <div>
                <label htmlFor="email">Email</label>
                <input className="glow-input h-11 md:h-10"
                  id="email"
                  type="email"
                  value={tenant.email || ""}
                  onChange={(e) => setTenant({ ...tenant, email: e.target.value })}
                  placeholder="info@ejemplo.com"
                />
              </div>
              <div>
                <label htmlFor="city">Ciudad</label>
                <input className="glow-input h-11 md:h-10"
                  id="city"
                  value={tenant.city || ""}
                  onChange={(e) => setTenant({ ...tenant, city: e.target.value })}
                  placeholder="Madrid"
                />
              </div>
              <div className="glow-field">
                <label htmlFor="address">Dirección</label>
                <input className="glow-input h-11 md:h-10"
                  id="address"
                  value={tenant.address || ""}
                  onChange={(e) => setTenant({ ...tenant, address: e.target.value })}
                  placeholder="Calle Principal, 123"
                />
              </div>
              <div>
                <label htmlFor="postal_code">Código Postal</label>
                <input className="glow-input h-11 md:h-10"
                  id="postal_code"
                  value={tenant.postal_code || ""}
                  onChange={(e) => setTenant({ ...tenant, postal_code: e.target.value })}
                  placeholder="28001"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky guided save bar */}
      <div
        className="glow-save-bar"
        role="status"
        aria-live="polite"
      >
        <p className="glow-hide-sm" style={{ flex: 1, margin: 0, fontSize: "var(--glow-t-xs)", color: "var(--glow-ink-3)", fontWeight: 600 }}>
          Los cambios se aplican al guardar.
        </p>
        <button
          className="glow-btn glow-btn--primary guided-halo"
          onClick={handleSave}
          disabled={saving}
          data-guided-cta="true"
        >
          {saving ? <Loader2 className="glow-spinner-sm" /> : <Save style={{ width: 14, height: 14 }} />}
          Guardar cambios
        </button>
      </div>
    </div>
  );
};

export default TenantSettings;
