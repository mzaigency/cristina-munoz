import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Palette,
  Type,
  MapPin,
  Image as ImageIcon,
  Save,
  X,
  Sparkles,
  Phone,
  Mail,
  Instagram,
  Facebook,
  MessageCircle,
  Loader2,
  Check,
  ArrowUpRight,
} from "lucide-react";
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

const extractUsername = (url: string | null, platform: "instagram" | "facebook" | "tiktok"): string => {
  if (!url) return "";
  if (!url.includes("/") && !url.includes(".")) return url.replace("@", "");
  try {
    const path = new URL(url).pathname.replace(/^\/+|\/+$/g, "");
    return path.replace("@", "");
  } catch {
    return url.replace("@", "");
  }
};

const buildSocialUrl = (username: string, platform: "instagram" | "facebook" | "tiktok"): string | null => {
  const clean = username.replace("@", "").trim();
  if (!clean) return null;
  switch (platform) {
    case "instagram": return `https://instagram.com/${clean}`;
    case "facebook": return `https://facebook.com/${clean}`;
    case "tiktok": return `https://tiktok.com/@${clean}`;
  }
};

interface TenantEditPanelProps {
  tenant: Tenant;
  onClose: () => void;
  onSave: (updatedTenant: Tenant) => void;
}

const FONT_OPTIONS = [
  { value: "Playfair Display", label: "Playfair Display", style: "serif" as const, sample: "Aa" },
  { value: "Cormorant Garamond", label: "Cormorant", style: "serif" as const, sample: "Aa" },
  { value: "Libre Baskerville", label: "Baskerville", style: "serif" as const, sample: "Aa" },
  { value: "Lora", label: "Lora", style: "serif" as const, sample: "Aa" },
  { value: "Inter", label: "Inter", style: "sans-serif" as const, sample: "Aa" },
  { value: "Poppins", label: "Poppins", style: "sans-serif" as const, sample: "Aa" },
  { value: "Montserrat", label: "Montserrat", style: "sans-serif" as const, sample: "Aa" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta", style: "sans-serif" as const, sample: "Aa" },
];

const NAME_SIZES = [
  { value: "medium", label: "M", caption: "Medio" },
  { value: "large", label: "L", caption: "Grande" },
  { value: "xlarge", label: "XL", caption: "Extra" },
];

const BUTTON_STYLES = [
  { value: "rounded", label: "Soft", radius: "8px" },
  { value: "pill", label: "Pill", radius: "999px" },
  { value: "square", label: "Edge", radius: "4px" },
  { value: "sharp", label: "Sharp", radius: "0" },
];

const COLOR_PRESETS = [
  { name: "Violeta", primary: "#8B5CF6", secondary: "#D946EF" },
  { name: "Rosa", primary: "#EC4899", secondary: "#F472B6" },
  { name: "Azul", primary: "#3B82F6", secondary: "#60A5FA" },
  { name: "Verde", primary: "#10B981", secondary: "#34D399" },
  { name: "Naranja", primary: "#F97316", secondary: "#FB923C" },
  { name: "Rojo", primary: "#EF4444", secondary: "#F87171" },
  { name: "Dorado", primary: "#D4AF37", secondary: "#FFD700" },
  { name: "Negro", primary: "#1F2937", secondary: "#4B5563" },
  { name: "Terracota", primary: "#C2410C", secondary: "#EA580C" },
  { name: "Lavanda", primary: "#7C3AED", secondary: "#A78BFA" },
  { name: "Turquesa", primary: "#0D9488", secondary: "#14B8A6" },
  { name: "Coral", primary: "#F43F5E", secondary: "#FB7185" },
];

type TabKey = "design" | "typography" | "images" | "content";

const TABS: { key: TabKey; label: string; icon: typeof Palette }[] = [
  { key: "design", label: "Diseño", icon: Palette },
  { key: "typography", label: "Tipografía", icon: Type },
  { key: "images", label: "Imágenes", icon: ImageIcon },
  { key: "content", label: "Contenido", icon: MapPin },
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
  const [activeTab, setActiveTab] = useState<TabKey>("design");

  // Track dirty state
  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify({
      ...tenant,
      font_heading: tenant.font_heading || "Playfair Display",
      font_body: tenant.font_body || "Inter",
      heading_size: tenant.heading_size || "xlarge",
      button_style: tenant.button_style || "rounded",
    });
  }, [formData, tenant]);

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
          tiktok_url: formData.tiktok_url,
          whatsapp_number: formData.whatsapp_number,
          google_maps_url: formData.google_maps_url,
          font_heading: formData.font_heading,
          font_body: formData.font_body,
          heading_size: formData.heading_size,
          button_style: formData.button_style,
        })
        .eq("id", tenant.id);

      if (error) throw error;
      toast({ title: "Guardado", description: "Cambios aplicados" });
      onSave(formData);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron guardar los cambios", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setFormData({
      ...tenant,
      font_heading: tenant.font_heading || "Playfair Display",
      font_body: tenant.font_body || "Inter",
      heading_size: tenant.heading_size || "xlarge",
      button_style: tenant.button_style || "rounded",
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[69] bg-black/35 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
      />

      <aside
        className="fixed inset-y-0 right-0 z-[70] w-full max-w-md sm:max-w-lg bg-white flex flex-col shadow-[0_0_60px_-20px_rgba(0,0,0,0.4)] animate-in slide-in-from-right duration-300"
        style={{ fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif" }}
      >
        {/* ─── Header ─── */}
        <header className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-md">
                <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <div className="leading-tight">
                <h2 className="text-[15px] font-bold text-neutral-900 tracking-tight">Editor visual</h2>
                <p className="text-[11px] text-neutral-500 font-medium">{tenant.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Segmented tabs */}
          <nav className="flex gap-1 p-1 bg-neutral-100 rounded-xl">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[12px] font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-white text-neutral-900 shadow-[0_2px_8px_-2px_rgba(20,22,40,0.12)]"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </header>

        {/* ─── Body ─── */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {/* DESIGN */}
          {activeTab === "design" && (
            <div className="space-y-7">
              {/* Color presets */}
              <Section title="Paleta" caption="Pulsa para aplicar">
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_PRESETS.map((preset) => {
                    const isOn = formData.primary_color === preset.primary;
                    return (
                      <button
                        key={preset.name}
                        onClick={() => {
                          handleChange("primary_color", preset.primary);
                          handleChange("secondary_color", preset.secondary);
                        }}
                        className={`group relative rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                          isOn ? "border-neutral-900 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.2)]" : "border-transparent hover:border-neutral-200"
                        }`}
                      >
                        <div
                          className="h-14 w-full"
                          style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }}
                        />
                        <div className="px-1.5 py-1 bg-white">
                          <span className="text-[10px] font-medium text-neutral-600 truncate block">{preset.name}</span>
                        </div>
                        {isOn && (
                          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center">
                            <Check className="w-3 h-3 text-neutral-900" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* Custom colors */}
              <Section title="Personalizado">
                <div className="space-y-3">
                  <ColorRow
                    label="Primario"
                    value={formData.primary_color || "#8B5CF6"}
                    onChange={(v) => handleChange("primary_color", v)}
                  />
                  <ColorRow
                    label="Secundario"
                    value={formData.secondary_color || "#D946EF"}
                    onChange={(v) => handleChange("secondary_color", v)}
                  />
                </div>
              </Section>

              {/* Button style */}
              <Section title="Estilo de botones">
                <div className="grid grid-cols-4 gap-2">
                  {BUTTON_STYLES.map((style) => {
                    const isOn = formData.button_style === style.value;
                    return (
                      <button
                        key={style.value}
                        onClick={() => handleChange("button_style", style.value)}
                        className={`flex flex-col items-center gap-2 p-3 border-2 rounded-xl transition-all duration-200 ${
                          isOn ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <div
                          className="w-full h-7 bg-gradient-to-r from-neutral-700 to-neutral-900"
                          style={{ borderRadius: style.radius }}
                        />
                        <span className="text-[10.5px] font-semibold text-neutral-600">{style.label}</span>
                      </button>
                    );
                  })}
                </div>
              </Section>
            </div>
          )}

          {/* TYPOGRAPHY */}
          {activeTab === "typography" && (
            <div className="space-y-7">
              <Section title="Títulos" caption="Fuente principal">
                <div className="grid grid-cols-2 gap-2">
                  {FONT_OPTIONS.filter((f) => f.style === "serif").map((font) => {
                    const isOn = formData.font_heading === font.value;
                    return (
                      <button
                        key={font.value}
                        onClick={() => handleChange("font_heading", font.value)}
                        className={`flex items-center gap-3 p-3 border-2 rounded-xl text-left transition-all duration-200 ${
                          isOn ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <span
                          className="text-2xl text-neutral-900 leading-none flex-shrink-0"
                          style={{ fontFamily: font.value }}
                        >
                          {font.sample}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-neutral-900 truncate" style={{ fontFamily: font.value }}>
                            {font.label}
                          </p>
                          <p className="text-[10px] text-neutral-500">Serif</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Section>

              <Section title="Cuerpo" caption="Fuente de párrafos">
                <div className="grid grid-cols-2 gap-2">
                  {FONT_OPTIONS.filter((f) => f.style === "sans-serif").map((font) => {
                    const isOn = formData.font_body === font.value;
                    return (
                      <button
                        key={font.value}
                        onClick={() => handleChange("font_body", font.value)}
                        className={`flex items-center gap-3 p-3 border-2 rounded-xl text-left transition-all duration-200 ${
                          isOn ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <span
                          className="text-xl text-neutral-900 leading-none flex-shrink-0 font-semibold"
                          style={{ fontFamily: font.value }}
                        >
                          {font.sample}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-neutral-900 truncate" style={{ fontFamily: font.value }}>
                            {font.label}
                          </p>
                          <p className="text-[10px] text-neutral-500">Sans</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Section>

              <Section title="Tamaño del nombre">
                <div className="grid grid-cols-3 gap-2">
                  {NAME_SIZES.map((size) => {
                    const isOn = formData.heading_size === size.value;
                    return (
                      <button
                        key={size.value}
                        onClick={() => handleChange("heading_size", size.value)}
                        className={`flex flex-col items-center gap-1 py-3 border-2 rounded-xl transition-all duration-200 ${
                          isOn ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <span className="text-lg font-bold text-neutral-900 leading-none">{size.label}</span>
                        <span className="text-[10px] text-neutral-500">{size.caption}</span>
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* Live preview */}
              <Section title="Vista previa">
                <div
                  className="p-5 rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white"
                  style={{ fontFamily: formData.font_body || "Inter" }}
                >
                  <h3
                    className={
                      formData.heading_size === "medium"
                        ? "text-2xl"
                        : formData.heading_size === "large"
                          ? "text-3xl"
                          : "text-4xl"
                    }
                    style={{
                      fontFamily: formData.font_heading || "Playfair Display",
                      color: formData.primary_color || "#8B5CF6",
                      fontWeight: 600,
                      lineHeight: 1.1,
                    }}
                  >
                    {formData.name || "Tu Salón"}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    {formData.tagline || "Tu mejor versión comienza aquí"}
                  </p>
                  <button
                    className="mt-4 px-4 py-2 text-white text-sm font-semibold"
                    style={{
                      backgroundColor: formData.primary_color || "#8B5CF6",
                      borderRadius:
                        formData.button_style === "pill"
                          ? "9999px"
                          : formData.button_style === "square"
                            ? "4px"
                            : formData.button_style === "sharp"
                              ? "0"
                              : "8px",
                    }}
                  >
                    Reservar cita
                  </button>
                </div>
              </Section>
            </div>
          )}

          {/* IMAGES */}
          {activeTab === "images" && (
            <div className="space-y-7">
              <Section title="Logo" caption="Cuadrado · PNG con fondo transparente">
                <TenantImageUploader
                  tenantId={tenant.id}
                  currentUrl={formData.logo_url}
                  onUpload={(url) => handleChange("logo_url", url)}
                  onRemove={() => handleChange("logo_url", null)}
                  type="logo"
                  aspectRatio="1/1"
                  className="max-w-[200px]"
                />
              </Section>

              <Section title="Imagen principal" caption="Hero · 16:9 · 1920×1080 recomendado">
                <TenantImageUploader
                  tenantId={tenant.id}
                  currentUrl={formData.hero_image_url}
                  onUpload={(url) => handleChange("hero_image_url", url)}
                  onRemove={() => handleChange("hero_image_url", null)}
                  type="hero"
                  aspectRatio="16/9"
                />
              </Section>
            </div>
          )}

          {/* CONTENT */}
          {activeTab === "content" && (
            <div className="space-y-7">
              <Section title="Información">
                <div className="space-y-3">
                  <Field label="Nombre">
                    <TextInput
                      value={formData.name}
                      onChange={(v) => handleChange("name", v)}
                      placeholder="Tu salón"
                    />
                  </Field>
                  <Field label="Eslogan">
                    <TextInput
                      value={formData.tagline || ""}
                      onChange={(v) => handleChange("tagline", v)}
                      placeholder="Tu mejor versión comienza aquí"
                    />
                  </Field>
                  <Field label="Descripción">
                    <textarea
                      value={formData.description || ""}
                      onChange={(e) => handleChange("description", e.target.value)}
                      placeholder="Describe tu salón..."
                      rows={3}
                      className="w-full px-3 py-2.5 text-[14px] bg-white border border-neutral-200 rounded-xl outline-none focus:border-neutral-900 transition-colors resize-none font-body"
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Contacto">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Teléfono" icon={Phone}>
                      <TextInput
                        value={formData.phone || ""}
                        onChange={(v) => handleChange("phone", v)}
                        placeholder="612 345 678"
                      />
                    </Field>
                    <Field label="Email" icon={Mail}>
                      <TextInput
                        value={formData.email || ""}
                        onChange={(v) => handleChange("email", v)}
                        placeholder="hola@salon.com"
                      />
                    </Field>
                  </div>
                  <Field label="Dirección">
                    <TextInput
                      value={formData.address || ""}
                      onChange={(v) => handleChange("address", v)}
                      placeholder="Calle Principal 123"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Ciudad">
                      <TextInput
                        value={formData.city || ""}
                        onChange={(v) => handleChange("city", v)}
                        placeholder="Madrid"
                      />
                    </Field>
                    <Field label="Código postal">
                      <TextInput
                        value={formData.postal_code || ""}
                        onChange={(v) => handleChange("postal_code", v)}
                        placeholder="28001"
                      />
                    </Field>
                  </div>
                </div>
              </Section>

              <Section title="Redes sociales">
                <div className="space-y-3">
                  <SocialField
                    icon={
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
                        <Instagram className="w-3.5 h-3.5 text-white" />
                      </div>
                    }
                    label="Instagram"
                    prefix="@"
                    value={extractUsername(formData.instagram_url, "instagram")}
                    onChange={(v) => handleChange("instagram_url", buildSocialUrl(v, "instagram"))}
                    placeholder="tusalon"
                  />
                  <SocialField
                    icon={
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-black">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-white">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                        </svg>
                      </div>
                    }
                    label="TikTok"
                    prefix="@"
                    value={extractUsername(formData.tiktok_url, "tiktok")}
                    onChange={(v) => handleChange("tiktok_url", buildSocialUrl(v, "tiktok"))}
                    placeholder="tusalon"
                  />
                  <SocialField
                    icon={
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-600">
                        <Facebook className="w-3.5 h-3.5 text-white" />
                      </div>
                    }
                    label="Facebook"
                    prefix="/"
                    value={extractUsername(formData.facebook_url, "facebook")}
                    onChange={(v) => handleChange("facebook_url", buildSocialUrl(v, "facebook"))}
                    placeholder="tusalon"
                  />
                  <SocialField
                    icon={
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-500">
                        <MessageCircle className="w-3.5 h-3.5 text-white" />
                      </div>
                    }
                    label="WhatsApp"
                    value={formData.whatsapp_number || ""}
                    onChange={(v) => handleChange("whatsapp_number", v)}
                    placeholder="+34 612 345 678"
                    hint="Con código de país"
                  />
                  <SocialField
                    icon={
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-500">
                        <MapPin className="w-3.5 h-3.5 text-white" />
                      </div>
                    }
                    label="Google Maps"
                    value={formData.google_maps_url || ""}
                    onChange={(v) => handleChange("google_maps_url", v)}
                    placeholder="https://goo.gl/maps/..."
                    hint="Enlace de compartir"
                  />
                </div>
              </Section>
            </div>
          )}
        </div>

        {/* ─── Sticky save bar ─── */}
        <footer
          className={`flex-shrink-0 px-5 py-4 border-t border-neutral-200 bg-white/95 backdrop-blur-sm transition-all duration-200 ${
            isDirty ? "shadow-[0_-8px_24px_-12px_rgba(20,22,40,0.12)]" : ""
          }`}
        >
          {isDirty ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDiscard}
                disabled={saving}
                className="px-4 py-2.5 text-[13.5px] font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors"
              >
                Descartar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[13.5px] font-semibold text-white rounded-xl transition-all hover:brightness-110 active:scale-[.98] bg-gradient-to-r from-neutral-900 to-neutral-700 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.3)] disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar cambios
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 text-[12.5px] text-neutral-500">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Todo guardado
              </span>
              <a
                href={`/${tenant.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-neutral-700 hover:text-neutral-900"
              >
                Ver web
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </footer>
      </aside>
    </>
  );
};

// ─── Helpers ───
function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-[10.5px] font-bold tracking-[0.18em] uppercase text-neutral-500">{title}</h3>
        {caption && <span className="text-[10.5px] text-neutral-400 font-medium">{caption}</span>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: typeof Phone;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11.5px] font-semibold text-neutral-700 mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-neutral-400" strokeWidth={2.2} />}
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 text-[14px] bg-white border border-neutral-200 rounded-xl outline-none focus:border-neutral-900 transition-colors font-body"
    />
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-2 border border-neutral-200 rounded-xl bg-white">
      <label className="relative w-10 h-10 rounded-lg cursor-pointer flex-shrink-0 overflow-hidden ring-1 ring-black/5 shadow-inner">
        <span className="absolute inset-0" style={{ background: value }} />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
      <div className="flex-1 min-w-0">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-neutral-500 mb-0.5">{label}</p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-[13px] font-mono tabular-nums text-neutral-900 bg-transparent border-0 outline-none p-0"
        />
      </div>
    </div>
  );
}

function SocialField({
  icon,
  label,
  prefix,
  value,
  onChange,
  placeholder,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  prefix?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-[11.5px] font-semibold text-neutral-700 mb-1.5">
        {icon}
        <span>{label}</span>
        {hint && <span className="text-[10px] text-neutral-400 font-normal ml-auto">{hint}</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-neutral-400 font-medium pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full py-2.5 text-[14px] bg-white border border-neutral-200 rounded-xl outline-none focus:border-neutral-900 transition-colors font-body ${
            prefix ? "pl-7 pr-3" : "px-3"
          }`}
        />
      </div>
    </div>
  );
}
