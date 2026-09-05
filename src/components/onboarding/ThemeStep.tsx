import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Layers, ChevronLeft, ChevronRight, Expand, Star, MapPin, Clock, X, Users, Scissors, ChevronDown, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { landingThemes, LandingTheme } from "./landing-themes";
import { StepProps } from "./types";
import { cn } from "@/lib/utils";

interface ThemeStepProps extends StepProps {
  tenantName?: string;
}

interface TenantData {
  name: string;
  tagline: string | null;
  city: string | null;
  hero_image_url: string | null;
  logo_url: string | null;
  address: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  font_heading?: string | null;
  font_body?: string | null;
  button_style?: string | null;
}

interface StylistData {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface ServiceData {
  id: string;
  name: string;
  price: number | null;
  duration_part1_active: number;
}

export function ThemeStep({ onNext, onPrev, tenantId, tenantName, loading, setLoading }: ThemeStepProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>("immersive");
  const [previewTheme, setPreviewTheme] = useState<LandingTheme | null>(null);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [stylists, setStylists] = useState<StylistData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);

  // Cargar datos reales del salón
  useEffect(() => {
    const loadTenantData = async () => {
      if (!tenantId) return;

      const [tenantRes, stylistsRes, servicesRes] = await Promise.all([
        supabase.from("tenants").select("name, tagline, city, hero_image_url, logo_url, address, primary_color, secondary_color, font_heading, font_body, button_style").eq("id", tenantId).single(),
        supabase.from("tenant_stylists").select("id, name, avatar_url").eq("tenant_id", tenantId).eq("is_active", true).limit(4),
        supabase.from("services").select("id, name, price, duration_part1_active").eq("tenant_id", tenantId).limit(4),
      ]);

      if (tenantRes.data) setTenantData(tenantRes.data);
      if (stylistsRes.data) setStylists(stylistsRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
    };

    loadTenantData();
  }, [tenantId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const theme = landingThemes.find(t => t.id === selectedTheme);
      if (!theme) throw new Error("Tema no encontrado");

      const updateData: Record<string, any> = {
        theme_id: theme.id,
      };
      // Solo aplicar defaults si el salón aún no tiene colores o fuentes asignadas
      if (!tenantData?.primary_color) {
        updateData.primary_color = theme.defaultColors.primary;
        updateData.secondary_color = theme.defaultColors.secondary;
      }
      if (!tenantData?.font_heading) {
        updateData.font_heading = theme.recommendedFonts.heading;
        updateData.font_body = theme.recommendedFonts.body;
      }
      if (!tenantData?.button_style) {
        updateData.button_style = theme.buttonStyle;
      }

      const { error } = await supabase
        .from("tenants")
        .update(updateData)
        .eq("id", tenantId);

      if (error) throw error;
      
      toast.success("Tema guardado");
      onNext();
    } catch (error) {
      console.error("Error saving theme:", error);
      toast.error("Error al guardar el tema");
    } finally {
      setLoading(false);
    }
  };

  const displayName = tenantData?.name || tenantName || "Tu Negocio";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4">
          <Layers className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-2xl font-heading font-bold text-foreground mb-2">
          Elige tu estilo de landing
        </h3>
        <p className="text-muted-foreground text-sm">
          Vista previa con los datos de <span className="font-medium text-foreground">{displayName}</span>
        </p>
      </div>

      {/* Theme Grid - 2 columns on mobile */}
      <div className="grid grid-cols-2 gap-3">
        {landingThemes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            selected={selectedTheme === theme.id}
            onSelect={() => setSelectedTheme(theme.id)}
            onPreview={() => setPreviewTheme(theme)}
            tenantData={tenantData}
            stylists={stylists}
            services={services}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        {onPrev && (
          <Button
            variant="outline"
            onClick={onPrev}
            disabled={loading}
            className="flex-1 h-12 rounded-xl"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 h-12 rounded-xl"
        >
          {loading ? "Guardando..." : "Continuar"}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTheme && (
          <ThemePreviewModal
            theme={previewTheme}
            tenantData={tenantData}
            stylists={stylists}
            services={services}
            onClose={() => setPreviewTheme(null)}
            onSelect={() => {
              setSelectedTheme(previewTheme.id);
              setPreviewTheme(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Theme Card Component
interface ThemeCardProps {
  theme: LandingTheme;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  tenantData: TenantData | null;
  stylists: StylistData[];
  services: ServiceData[];
}

function ThemeCard({ theme, selected, onSelect, onPreview, tenantData, stylists, services }: ThemeCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative rounded-2xl border-2 transition-all overflow-hidden",
        selected 
          ? "border-primary ring-2 ring-primary/20 bg-primary/5" 
          : "border-border hover:border-primary/50"
      )}
    >
      {/* Selected indicator */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg z-20"
        >
          <Check className="w-4 h-4 text-primary-foreground" />
        </motion.div>
      )}

      {/* Clickable area for selection */}
      <button
        onClick={onSelect}
        className="w-full text-left"
      >
        {/* Mini Preview */}
        <div className="relative aspect-[9/14] overflow-hidden">
          <ThemeMiniPreview 
            theme={theme} 
            tenantData={tenantData}
            services={services}
          />
        </div>
      </button>

      {/* Info bar with preview button */}
      <div className="p-2.5 bg-background border-t border-border/50 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{theme.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{theme.description}</p>
        </div>
        
        {/* Preview button - prominent */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
        >
          <Expand className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Ver</span>
        </button>
      </div>
    </motion.div>
  );
}

// Mini Preview Component with real data
interface ThemeMiniPreviewProps {
  theme: LandingTheme;
  tenantData: TenantData | null;
  services: ServiceData[];
}

function ThemeMiniPreview({ theme, tenantData, services }: ThemeMiniPreviewProps) {
  const { heroLayout, defaultColors } = theme;
  const name = tenantData?.name || "Tu Salón";
  const hasImage = !!tenantData?.hero_image_url;
  const hasLogo = !!tenantData?.logo_url;
  const primary = tenantData?.primary_color || defaultColors.primary;
  const secondary = tenantData?.secondary_color || defaultColors.secondary;

  const gradientBg = `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;

  // IMMERSIVE
  if (heroLayout === "fullscreen") {
    return (
      <div 
        className="w-full h-full flex flex-col justify-end relative p-3 overflow-hidden bg-neutral-900"
        style={{ 
          background: hasImage 
            ? `linear-gradient(to top, rgba(10,12,22,0.9) 0%, rgba(10,12,22,0.3) 50%, rgba(10,12,22,0.6) 100%), url(${tenantData?.hero_image_url}) center/cover` 
            : gradientBg 
        }}
      >
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-1 mb-1">
            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
            <span className="text-[9px] font-semibold text-white/90">4.9</span>
            <span className="text-white/40 text-[8px]">·</span>
            <span className="text-[8px] text-white/70">Inmersivo</span>
          </div>
          <p className="text-[12px] font-bold text-white leading-tight truncate drop-shadow-md mb-1.5">
            {name}
          </p>
          <div className="w-14 h-3.5 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-[8px] font-semibold text-neutral-900">
            Reservar
          </div>
        </div>
      </div>
    );
  }

  // MINIMAL
  if (heroLayout === "minimal") {
    return (
      <div 
        className="w-full h-full flex flex-col items-center justify-center relative p-3 text-center overflow-hidden bg-neutral-950"
        style={{
          background: hasImage
            ? `radial-gradient(ellipse at center, rgba(10,12,20,0.4) 0%, rgba(10,12,20,0.85) 75%), url(${tenantData?.hero_image_url}) center/cover`
            : "radial-gradient(ellipse at center, rgba(24,24,27,0.8) 0%, #09090b 100%)",
        }}
      >
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md mb-1.5">
            <Star className="w-2 h-2 text-amber-400 fill-amber-400" />
            <span className="text-[8px] text-white/80">Boutique</span>
          </div>
          <p className="text-[11px] font-medium text-white tracking-wide leading-tight truncate max-w-[90%]">
            {name}
          </p>
          <div className="w-6 h-px bg-white/40 my-1.5" />
          <div className="w-12 h-3 rounded-full border border-white/40 text-[7px] text-white flex items-center justify-center">
            Cita
          </div>
        </div>
      </div>
    );
  }

  // SPLIT
  if (heroLayout === "split") {
    return (
      <div className="w-full h-full flex flex-col justify-between p-2.5 relative overflow-hidden bg-neutral-950">
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        {/* Top: Framed photo block */}
        <div 
          className="h-[48%] rounded-xl overflow-hidden border border-white/15 relative shadow-md"
          style={{
            background: hasImage
              ? `url(${tenantData?.hero_image_url}) center/cover`
              : gradientBg,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
        {/* Bottom: Studio content card */}
        <div className="h-[46%] rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-2 flex flex-col justify-center">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primary }} />
            <span className="text-[7.5px] uppercase tracking-wider font-bold" style={{ color: primary }}>Studio</span>
          </div>
          <p className="text-[10.5px] font-bold text-white truncate leading-tight mb-1">
            {name}
          </p>
          <div 
            className="w-full h-3 rounded-md text-white text-[7.5px] font-semibold flex items-center justify-center shadow-sm"
            style={{ backgroundColor: primary }}
          >
            Reservar
          </div>
        </div>
      </div>
    );
  }

  // BOLD
  if (heroLayout === "bold") {
    return (
      <div 
        className="w-full h-full flex flex-col justify-end relative p-3 overflow-hidden bg-neutral-950"
        style={{
          background: hasImage
            ? `linear-gradient(135deg, ${primary}CC 0%, ${secondary}99 50%, rgba(10,12,22,0.92) 100%), url(${tenantData?.hero_image_url}) center/cover`
            : `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        }}
      >
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[7.5px] font-bold uppercase tracking-wider mb-1">
            Atelier Bold
          </div>
          <p className="text-[12px] font-black text-white uppercase tracking-tight leading-none drop-shadow mb-1 truncate">
            {name}
          </p>
          <div className="w-8 h-0.5 bg-white mb-1.5 rounded-full" />
          <div className="w-14 h-3.5 rounded-lg bg-white text-neutral-900 font-bold text-[8px] flex items-center justify-center shadow-md">
            Reservar
          </div>
        </div>
      </div>
    );
  }

  // GLASS (default)
  return (
    <div 
      className="w-full h-full flex flex-col justify-end relative p-2.5 overflow-hidden bg-neutral-950"
      style={{ 
        background: hasImage 
          ? `linear-gradient(to top, rgba(10,12,22,0.85) 0%, rgba(10,12,22,0.3) 100%), url(${tenantData?.hero_image_url}) center/cover` 
          : gradientBg 
      }}
    >
      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      {/* Ambient orb */}
      <div 
        className="absolute bottom-2 left-2 w-16 h-16 rounded-full blur-xl opacity-40 pointer-events-none"
        style={{ backgroundColor: primary }}
      />
      {/* Floating glass card */}
      <div className="relative z-10 p-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 shadow-lg">
        <div className="flex items-center gap-1 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[7.5px] font-semibold text-white/90 uppercase">Liquid Glass</span>
        </div>
        <p className="text-[11px] font-bold text-white truncate leading-tight mb-1.5">
          {name}
        </p>
        <div className="w-full h-3 rounded-lg bg-white/25 border border-white/30 text-white text-[7.5px] font-medium flex items-center justify-center">
          Reservar cita →
        </div>
      </div>
    </div>
  );
}

// Preview Modal with real data
interface ThemePreviewModalProps {
  theme: LandingTheme;
  tenantData: TenantData | null;
  stylists: StylistData[];
  services: ServiceData[];
  onClose: () => void;
  onSelect: () => void;
}

function ThemePreviewModal({ theme, tenantData, stylists, services, onClose, onSelect }: ThemePreviewModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[270px] max-h-[95vh] overflow-y-auto"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Phone Frame */}
        <div className="relative bg-[#1a1a1a] rounded-[28px] p-[4px] shadow-2xl">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#1a1a1a] rounded-b-2xl z-20" />
          
          {/* Screen */}
          <div className="relative bg-neutral-950 rounded-[24px] overflow-hidden aspect-[9/19]">
            <ThemeFullPreview 
              theme={theme} 
              tenantData={tenantData}
              stylists={stylists}
              services={services}
            />
          </div>
          
          {/* Home indicator */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/50 rounded-full" />
        </div>

        {/* Theme Info & Actions */}
        <div className="mt-3 text-center">
          <h4 className="font-semibold text-base text-white">{theme.name}</h4>
          <p className="text-xs text-white/70 mb-3">{theme.description}</p>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              size="sm"
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Cerrar
            </Button>
            <Button 
              onClick={onSelect} 
              size="sm"
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Seleccionar
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Full Preview Component - Faithful replica of real hero components
interface ThemeFullPreviewProps {
  theme: LandingTheme;
  tenantData: TenantData | null;
  stylists: StylistData[];
  services: ServiceData[];
}

function ThemeFullPreview({ theme, tenantData, stylists, services }: ThemeFullPreviewProps) {
  const { heroLayout, defaultColors, recommendedFonts } = theme;
  const name = tenantData?.name || "Tu Negocio";
  const tagline = tenantData?.tagline || "Tu espacio de belleza y bienestar";
  const city = tenantData?.city || "Centro";
  const hasImage = !!tenantData?.hero_image_url;
  const hasLogo = !!tenantData?.logo_url;
  const primary = tenantData?.primary_color || defaultColors.primary;
  const secondary = tenantData?.secondary_color || defaultColors.secondary;

  const gradientBg = `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;

  const TopScrim = () => (
    <div
      className="absolute inset-x-0 top-0 h-16 pointer-events-none z-10"
      style={{
        background: "linear-gradient(to bottom, rgba(10,12,22,0.7) 0%, transparent 100%)",
      }}
    />
  );

  // IMMERSIVE
  if (heroLayout === "fullscreen") {
    return (
      <div 
        className="w-full h-full flex flex-col justify-end p-5 relative overflow-hidden bg-neutral-900"
        style={{ 
          background: hasImage 
            ? `linear-gradient(to top, rgba(10,12,22,0.92) 0%, rgba(10,12,22,0.4) 50%, rgba(10,12,22,0.65) 100%), url(${tenantData?.hero_image_url}) center/cover` 
            : gradientBg 
        }}
      >
        <TopScrim />
        <div className="relative z-10 pb-6">
          <div className="flex items-center gap-1.5 mb-2">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-semibold text-white">4.9</span>
            <span className="text-white/40 text-[10px]">·</span>
            <span className="text-[11px] text-white/80">{city}</span>
          </div>
          <h3 
            className="text-[24px] font-bold text-white mb-2 leading-tight drop-shadow-md"
            style={{ fontFamily: recommendedFonts.heading }}
          >
            {name}
          </h3>
          <p 
            className="text-white/80 text-xs mb-4 line-clamp-2"
            style={{ fontFamily: recommendedFonts.body }}
          >
            {tagline}
          </p>
          <button 
            className="w-full py-2.5 rounded-full text-xs font-semibold shadow-lg text-white"
            style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}
          >
            Reservar cita
          </button>
        </div>
      </div>
    );
  }

  // MINIMAL (centrado)
  if (heroLayout === "minimal") {
    return (
      <div 
        className="w-full h-full flex flex-col items-center justify-center p-5 text-center relative overflow-hidden bg-neutral-950"
        style={{
          background: hasImage
            ? `radial-gradient(ellipse at center, rgba(10,12,20,0.35) 0%, rgba(10,12,20,0.85) 75%), url(${tenantData?.hero_image_url}) center/cover`
            : "radial-gradient(ellipse at center, rgba(24,24,27,0.7) 0%, #09090b 100%)",
        }}
      >
        <TopScrim />
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md mb-3 border border-white/15">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-[10px] text-white/90 font-medium">Boutique Atelier</span>
          </div>
          <h3 
            className="text-[22px] font-light text-white mb-2 tracking-wide leading-tight"
            style={{ fontFamily: recommendedFonts.heading }}
          >
            {name}
          </h3>
          <div className="w-10 h-px bg-white/40 my-2" />
          <p 
            className="text-white/70 text-xs font-light mb-4 line-clamp-2 max-w-[90%]"
            style={{ fontFamily: recommendedFonts.body }}
          >
            {tagline}
          </p>
          <button className="px-6 py-2 rounded-full border border-white/50 text-white text-xs font-medium bg-white/5 hover:bg-white/10">
            Reservar cita
          </button>
        </div>
      </div>
    );
  }

  // SPLIT (editorial spread sobre la foto)
  if (heroLayout === "split") {
    return (
      <div 
        className="w-full h-full flex flex-col justify-end p-4 relative overflow-hidden bg-neutral-950"
        style={{
          background: hasImage
            ? `linear-gradient(to top, rgba(10,12,22,0.92) 0%, rgba(10,12,22,0.45) 50%, rgba(10,12,22,0.7) 100%), url(${tenantData?.hero_image_url}) center/cover`
            : gradientBg,
        }}
      >
        <TopScrim />
        <div className="relative z-10 pb-5">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primary }} />
              <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: primary }}>Studio Editorial</span>
            </div>
            <h3 
              className="text-[20px] font-bold text-white leading-tight mb-1.5"
              style={{ fontFamily: recommendedFonts.heading }}
            >
              {name}
            </h3>
            <p 
              className="text-xs text-white/75 mb-3 line-clamp-2"
              style={{ fontFamily: recommendedFonts.body }}
            >
              {tagline}
            </p>
            <button 
              className="w-full py-2.5 rounded-xl text-white text-xs font-semibold shadow-md"
              style={{ backgroundColor: primary }}
            >
              Reservar cita
            </button>
          </div>
        </div>
      </div>
    );
  }

  // BOLD (alta definición pura sin filtros turbios)
  if (heroLayout === "bold") {
    return (
      <div 
        className="w-full h-full flex flex-col justify-end p-5 relative overflow-hidden bg-neutral-950"
        style={{
          background: hasImage
            ? `linear-gradient(to top, rgba(10,12,22,0.94) 0%, rgba(10,12,22,0.4) 50%, rgba(10,12,22,0.7) 100%), url(${tenantData?.hero_image_url}) center/cover`
            : `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        }}
      >
        <TopScrim />
        <div className="relative z-10 pb-6">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider mb-2">
            ✦ Salón de Autor
          </div>
          <h3 
            className="text-[26px] font-black text-white uppercase tracking-tight leading-[0.95] drop-shadow-lg mb-2"
            style={{ fontFamily: recommendedFonts.heading }}
          >
            {name}
          </h3>
          <div className="w-12 h-1 bg-white mb-2 rounded-full" />
          <p 
            className="text-white/90 text-xs font-medium mb-4 line-clamp-2"
            style={{ fontFamily: recommendedFonts.body }}
          >
            {tagline}
          </p>
          <button 
            className="w-full py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-xl"
            style={{ backgroundColor: primary }}
          >
            Reservar cita
          </button>
        </div>
      </div>
    );
  }

  // GLASS (panorámica Liquid Glass)
  return (
    <div 
      className="w-full h-full flex flex-col justify-end p-4 relative overflow-hidden bg-neutral-950"
      style={{ 
        background: hasImage 
          ? `linear-gradient(to top, rgba(10,12,22,0.85) 0%, rgba(10,12,22,0.2) 100%), url(${tenantData?.hero_image_url}) center/cover` 
          : gradientBg 
      }}
    >
      <TopScrim />
      <div 
        className="absolute bottom-6 left-4 w-28 h-28 rounded-full blur-2xl opacity-40 pointer-events-none"
        style={{ backgroundColor: primary }}
      />
      <div className="relative z-10 pb-5 p-4 rounded-2xl bg-white/12 backdrop-blur-2xl border border-white/25 shadow-2xl">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider">Citas abiertas hoy</span>
        </div>
        <h3 
          className="text-[20px] font-bold text-white mb-1.5 leading-tight"
          style={{ fontFamily: recommendedFonts.heading }}
        >
          {name}
        </h3>
        <p 
          className="text-xs text-white/80 mb-3 line-clamp-2"
          style={{ fontFamily: recommendedFonts.body }}
        >
          {tagline}
        </p>
        <button className="w-full py-2.5 rounded-xl bg-white/25 backdrop-blur-md border border-white/35 text-white text-xs font-semibold shadow-lg">
          Reservar cita →
        </button>
      </div>
    </div>
  );
}
