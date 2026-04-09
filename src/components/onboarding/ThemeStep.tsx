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
        supabase.from("tenants").select("name, tagline, city, hero_image_url, logo_url, address").eq("id", tenantId).single(),
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

      const { error } = await supabase
        .from("tenants")
        .update({
          theme_id: theme.id,
          primary_color: theme.defaultColors.primary,
          secondary_color: theme.defaultColors.secondary,
          font_heading: theme.recommendedFonts.heading,
          font_body: theme.recommendedFonts.body,
          button_style: theme.buttonStyle,
        })
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

  // Base gradient style
  const gradientBg = `linear-gradient(135deg, ${defaultColors.primary} 0%, ${defaultColors.secondary} 100%)`;

  if (heroLayout === "fullscreen") {
    return (
      <div 
        className="w-full h-full flex flex-col items-center justify-center relative p-3"
        style={{ 
          background: hasImage 
            ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${tenantData?.hero_image_url}) center/cover` 
            : gradientBg 
        }}
      >
        {/* Logo or placeholder */}
        {hasLogo ? (
          <img src={tenantData?.logo_url!} alt="" className="w-8 h-8 rounded-lg object-cover mb-2" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-white/20 mb-2" />
        )}
        
        <div className="w-full max-w-[90%] h-2 rounded bg-white/90 mb-1" />
        <div className="w-2/3 h-1.5 rounded bg-white/60 mb-2" />
        
        {/* Stars */}
        <div className="flex gap-0.5 mb-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-yellow-400" />
          ))}
        </div>
        
        <div className="w-16 h-4 rounded-full bg-white/90" />
        
        {/* Service pills */}
        {services.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 flex gap-1">
            {services.slice(0, 2).map((s, i) => (
              <div key={i} className="flex-1 h-3 rounded bg-white/20 backdrop-blur-sm" />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (heroLayout === "minimal") {
    return (
      <div className="w-full h-full bg-white flex flex-col p-3">
        {/* Header */}
        <div className="flex flex-col items-center pt-4 pb-3">
          <div className="w-full max-w-[85%] h-2.5 rounded bg-foreground/80 mb-1" />
          <div className="w-12 h-0.5 mb-1" style={{ backgroundColor: defaultColors.primary }} />
          <div className="w-2/3 h-1.5 rounded bg-muted-foreground/40 mb-3" />
          
          <div 
            className="px-4 py-1.5 rounded border-[1.5px] text-[8px] font-medium"
            style={{ borderColor: defaultColors.primary, color: defaultColors.primary }}
          >
            Reservar
          </div>
        </div>
        
        {/* Gallery grid */}
        <div className="flex-1 grid grid-cols-2 gap-1.5 mt-2">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="rounded-md overflow-hidden"
              style={{ 
                background: hasImage && i === 0 
                  ? `url(${tenantData?.hero_image_url}) center/cover` 
                  : 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted)/0.5) 100%)' 
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (heroLayout === "split") {
    return (
      <div className="w-full h-full flex flex-col">
        {/* Top image */}
        <div 
          className="h-[40%]"
          style={{ 
            background: hasImage 
              ? `url(${tenantData?.hero_image_url}) center/cover` 
              : gradientBg 
          }}
        />
        
        {/* Content */}
        <div className="flex-1 bg-white p-3 flex flex-col justify-center">
          {hasLogo && (
            <img src={tenantData?.logo_url!} alt="" className="w-6 h-6 rounded object-cover mb-1.5" />
          )}
          <div className="w-full h-2 rounded bg-foreground/80 mb-1" />
          <div className="flex gap-0.5 mb-1.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            ))}
          </div>
          <div 
            className="w-full h-4 rounded-lg"
            style={{ backgroundColor: defaultColors.primary }}
          />
        </div>
      </div>
    );
  }

  if (heroLayout === "bold") {
    return (
      <div className="w-full h-full bg-muted/30 p-2 flex flex-col">
        {/* Hero card */}
        <div 
          className="flex-1 rounded-xl flex flex-col items-center justify-center p-2 relative overflow-hidden"
          style={{ 
            background: hasImage 
              ? `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5)), url(${tenantData?.hero_image_url}) center/cover` 
              : gradientBg 
          }}
        >
          {/* Decorative */}
          <div className="absolute top-2 right-2 w-8 h-8 border border-white/20 rounded-full" />
          
          {hasLogo ? (
            <img src={tenantData?.logo_url!} alt="" className="w-6 h-6 rounded object-cover mb-1" />
          ) : (
            <div className="w-6 h-6 rounded bg-white/20 mb-1" />
          )}
          <div className="w-14 h-1.5 rounded bg-white mb-0.5" />
          <div className="w-8 h-1 rounded bg-white/60 mb-2" />
          <div className="w-12 h-3.5 rounded-lg bg-white" />
        </div>
        
        {/* Info card */}
        <div className="mt-1.5 p-2 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-primary/10" />
            <div className="flex-1">
              <div className="w-full h-1 rounded bg-muted-foreground/30" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Glass (default)
  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-center relative p-3"
      style={{ 
        background: hasImage 
          ? `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url(${tenantData?.hero_image_url}) center/cover` 
          : gradientBg 
      }}
    >
      {/* Glass card */}
      <div className="w-[90%] p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex flex-col items-center">
        {hasLogo ? (
          <img src={tenantData?.logo_url!} alt="" className="w-6 h-6 rounded-lg object-cover mb-1.5" />
        ) : (
          <div className="w-6 h-6 rounded-lg bg-white/30 mb-1.5" />
        )}
        <div className="w-full h-1.5 rounded bg-white/90 mb-0.5" />
        <div className="w-2/3 h-1 rounded bg-white/60 mb-2" />
        <div className="w-10 h-3 rounded-full bg-white/90" />
      </div>
      
      {/* Bottom services */}
      {services.length > 0 && (
        <div className="absolute bottom-2 left-2 right-2 flex gap-1">
          {services.slice(0, 2).map((s, i) => (
            <div key={i} className="flex-1 h-3 rounded bg-white/20 backdrop-blur-sm" />
          ))}
        </div>
      )}
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
  const displayName = tenantData?.name || "Tu Negocio";
  
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
        className="relative w-full max-w-[260px] max-h-[95vh] overflow-y-auto"
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
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1a1a1a] rounded-b-2xl z-10" />
          
          {/* Screen */}
          <div className="relative bg-white rounded-[24px] overflow-hidden aspect-[9/19]">
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
  const address = tenantData?.address || "Calle Principal, 123";
  const hasImage = !!tenantData?.hero_image_url;
  const hasLogo = !!tenantData?.logo_url;

  const gradientBg = `linear-gradient(135deg, ${defaultColors.primary} 0%, ${defaultColors.secondary} 100%)`;

  // Shared status bar
  const StatusBar = ({ light = true }: { light?: boolean }) => (
    <div className={cn(
      "absolute top-0 left-0 right-0 h-7 flex items-center justify-between px-5 z-20",
      light ? "text-white" : "text-foreground"
    )}>
      <span className="text-[11px] font-semibold">9:41</span>
      <div className="flex items-center gap-1.5">
        <div className={cn("w-4 h-2.5 rounded-sm", light ? "bg-white/80" : "bg-foreground/80")} />
      </div>
    </div>
  );

  // Stats pills - mirrors real hero components
  const StatsPills = ({ className = "" }: { className?: string }) => (
    <div className={cn("flex flex-wrap items-center justify-center gap-1.5", className)}>
      <div className="flex items-center gap-1 bg-white/15 backdrop-blur-md rounded-full px-2.5 py-1">
        <Users className="w-3 h-3 text-white/80" />
        <span className="text-white font-medium text-[10px]">0</span>
        <span className="text-white/70 text-[9px]">seguidores</span>
      </div>
      <div className="flex items-center gap-1 bg-white/15 backdrop-blur-md rounded-full px-2.5 py-1">
        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
        <span className="text-white font-medium text-[10px]">5.0</span>
      </div>
    </div>
  );

  // ====== IMMERSIVE (fullscreen) ======
  if (heroLayout === "fullscreen") {
    return (
      <div className="w-full h-full overflow-y-auto relative">
        <div 
          className="min-h-full flex flex-col items-center justify-center px-5 py-12 text-center relative"
          style={{ 
            background: hasImage 
              ? `linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.8) 100%), url(${tenantData?.hero_image_url}) center/cover` 
              : gradientBg 
          }}
        >
          <StatusBar light />
          
          {/* Decorative circle */}
          <div className="absolute top-16 right-5 w-16 h-16 border border-white/10 rounded-full" />
          
          {/* Logo */}
          {hasLogo ? (
            <img src={tenantData?.logo_url!} alt="" className="w-14 h-14 rounded-2xl object-cover mb-4 shadow-2xl" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm mb-4 flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
          )}
          
          {/* Name */}
          <h3 className="text-[22px] font-bold text-white mb-2 tracking-tight" style={{ fontFamily: recommendedFonts.heading, textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}>
            {name}
          </h3>
          
          {/* Tagline */}
          <p className="text-white/90 text-xs mb-3 max-w-[85%]" style={{ fontFamily: recommendedFonts.body }}>
            {tagline}
          </p>
          
          {/* Stars */}
          <div className="flex items-center gap-0.5 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-white/80 text-[10px] ml-1">(127)</span>
          </div>
          
          {/* Stats pills */}
          <StatsPills className="mb-5" />
          
          {/* CTA */}
          <button 
            className="px-6 py-2.5 rounded-full text-xs font-semibold shadow-2xl transition-transform"
            style={{ 
              background: `linear-gradient(135deg, ${defaultColors.primary} 0%, ${defaultColors.secondary} 100%)`,
              color: "white"
            }}
          >
            Reservar cita
          </button>
          
          {/* Location info */}
          <div className="flex items-center gap-3 mt-5 text-white/70 text-[10px]">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{city}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Abierto</span>
            </div>
          </div>
          
          {/* Scroll indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
            <span className="text-white/50 text-[8px] uppercase tracking-widest">Descubre más</span>
            <ChevronDown className="w-3.5 h-3.5 text-white/50" />
          </div>
        </div>
      </div>
    );
  }

  // ====== MINIMAL ======
  if (heroLayout === "minimal") {
    return (
      <div className="w-full h-full overflow-y-auto relative">
        {/* Background */}
        {hasImage ? (
          <div className="absolute inset-0">
            <img src={tenantData?.hero_image_url!} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/85" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gray-950" />
        )}
        
        <StatusBar light />
        
        <div className="relative z-10 flex flex-col justify-center items-center min-h-full px-5 py-16 text-center">
          {/* Logo */}
          {hasLogo && (
            <img src={tenantData?.logo_url!} alt="" className="w-12 h-12 rounded-xl object-contain mx-auto mb-8" />
          )}
          
          {/* Name - Elegant light */}
          <h3 className="text-2xl font-light text-white mb-4 tracking-tight" style={{ fontFamily: recommendedFonts.heading }}>
            {name}
          </h3>
          
          {/* Stats */}
          <div className="flex items-center gap-4 mb-4 text-white/50 text-[10px]">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>0</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              <span>5.0</span>
            </div>
          </div>
          
          {/* Minimal line */}
          <div className="w-10 h-px bg-white/30 mx-auto mb-4" />
          
          {/* Tagline */}
          <p className="text-sm text-white/60 font-light mb-8 max-w-[80%]" style={{ fontFamily: recommendedFonts.body }}>
            {tagline}
          </p>
          
          {/* CTA - Sharp edges, minimal style */}
          <div className="flex flex-col items-center gap-3 w-full max-w-[200px]">
            <button 
              className="w-full py-2.5 text-[10px] font-medium tracking-wide uppercase border border-white/30 text-white hover:bg-white/10 transition-all"
            >
              Seguir
            </button>
            <button 
              className="w-full py-2.5 text-[10px] font-medium tracking-wide uppercase border border-white/40 text-white transition-all"
            >
              Reservar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ====== SPLIT ======
  if (heroLayout === "split") {
    return (
      <div className="w-full h-full overflow-y-auto relative">
        {/* Background Image */}
        {hasImage ? (
          <div className="absolute inset-0">
            <img src={tenantData?.hero_image_url!} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
          </div>
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${defaultColors.primary} 0%, ${defaultColors.secondary} 100%)` }} />
        )}
        
        <StatusBar light />
        
        <div className="relative z-10 min-h-full flex flex-col justify-end px-5 pb-8 pt-16">
          {/* Logo */}
          {hasLogo && (
            <img src={tenantData?.logo_url!} alt="" className="w-11 h-11 object-contain mb-4 rounded-xl shadow-lg" />
          )}
          
          {/* Name */}
          <h3 className="text-2xl font-bold text-white mb-2 leading-tight" style={{ fontFamily: recommendedFonts.heading }}>
            {name}
          </h3>
          
          {/* Tagline */}
          <p className="text-xs text-white/80 mb-3 max-w-[85%]" style={{ fontFamily: recommendedFonts.body }}>
            {tagline}
          </p>
          
          {/* Location */}
          <div className="flex items-center gap-1.5 text-white/70 mb-4">
            <MapPin className="w-3 h-3" />
            <span className="text-[10px]">{city} · {address}</span>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap items-center gap-1.5 mb-5">
            <div className="flex items-center gap-1 bg-white/15 backdrop-blur-md rounded-full px-2.5 py-1">
              <Users className="w-3 h-3 text-white/80" />
              <span className="text-white text-[10px] font-medium">0</span>
            </div>
            <div className="flex items-center gap-1 bg-white/15 backdrop-blur-md rounded-full px-2.5 py-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-white text-[10px] font-medium">5.0</span>
            </div>
          </div>
          
          {/* CTA */}
          <div className="flex flex-col gap-2">
            <button 
              className="w-full py-2.5 text-[10px] font-semibold rounded-xl shadow-xl text-white"
              style={{ backgroundColor: defaultColors.primary }}
            >
              📅 Reservar cita
            </button>
            <button className="w-full py-2.5 text-[10px] bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl">
              Seguir
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ====== BOLD ======
  if (heroLayout === "bold") {
    return (
      <div className="w-full h-full overflow-y-auto relative">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0">
          {hasImage ? (
            <>
              <img src={tenantData?.hero_image_url!} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${defaultColors.primary}CC 0%, ${defaultColors.secondary}99 50%, ${defaultColors.primary}EE 100%)` }} />
            </>
          ) : (
            <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${defaultColors.primary} 0%, ${defaultColors.secondary} 50%, ${defaultColors.primary} 100%)` }} />
          )}
        </div>
        
        {/* Animated shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-32 h-32 border-2 border-white/20 rounded-full" />
          <div className="absolute top-1/3 -left-8 w-24 h-24 border border-white/10 rounded-full" />
          <div className="absolute bottom-1/4 right-4 w-10 h-10 bg-white/10 rounded-full blur-xl" />
        </div>
        
        <StatusBar light />
        
        <div className="relative z-10 min-h-full flex flex-col items-center justify-center px-5 py-10 text-center">
          {/* Logo with glow */}
          {hasLogo ? (
            <div className="relative mb-4">
              <div className="absolute inset-0 blur-2xl opacity-50 rounded-3xl bg-white" />
              <img src={tenantData?.logo_url!} alt="" className="relative w-14 h-14 object-contain rounded-2xl bg-white/20 backdrop-blur-sm p-1.5 shadow-2xl" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm mb-4 flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
          )}
          
          {/* Name - Extra bold uppercase */}
          <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wider drop-shadow-2xl" style={{ fontFamily: recommendedFonts.heading }}>
            {name}
          </h3>
          
          {/* Underline */}
          <div className="w-16 h-1 bg-white/60 rounded-full mb-3" />
          
          {/* Tagline */}
          <p className="text-sm text-white/95 font-medium mb-4 max-w-[85%]" style={{ fontFamily: recommendedFonts.body }}>
            {tagline}
          </p>
          
          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-5">
            <div className="flex items-center gap-1 bg-white/25 backdrop-blur-md rounded-full px-2.5 py-1 shadow-lg">
              <Users className="w-3 h-3 text-white/80" />
              <span className="text-white font-bold text-[10px]">0</span>
            </div>
            <div className="flex items-center gap-1 bg-white/25 backdrop-blur-md rounded-full px-2.5 py-1 shadow-lg">
              <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
              <span className="text-white font-bold text-[10px]">5.0</span>
            </div>
          </div>
          
          {/* CTA */}
          <div className="flex flex-col items-center gap-2 w-full max-w-[200px]">
            <button className="w-full py-2.5 text-[10px] bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl font-medium">
              Seguir
            </button>
            <button className="w-full py-2.5 text-xs font-bold bg-white text-gray-900 shadow-2xl rounded-xl uppercase tracking-wide">
              ✨ Reservar
            </button>
          </div>
          
          {/* Scroll indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <ChevronDown className="w-4 h-4 text-white/60" />
          </div>
        </div>
      </div>
    );
  }

  // ====== GLASS (default) ======
  return (
    <div className="w-full h-full overflow-y-auto relative">
      {/* Background */}
      {hasImage && (
        <div className="absolute inset-0">
          <img src={tenantData?.hero_image_url!} alt="" className="w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}
      
      {/* Gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-[60%] h-[60%] rounded-full blur-3xl opacity-30" style={{ backgroundColor: defaultColors.primary }} />
        <div className="absolute -bottom-1/4 -right-1/4 w-[50%] h-[50%] rounded-full blur-3xl opacity-25" style={{ backgroundColor: defaultColors.primary }} />
      </div>
      
      <StatusBar light />
      
      <div className="relative z-10 min-h-full flex flex-col items-center justify-center px-5 py-12">
        {/* Glass Card */}
        <div className="relative w-full p-6 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/30 shadow-2xl">
          {/* Sparkle decoration */}
          <div className="absolute -top-2.5 -right-2.5 p-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          
          {/* Logo */}
          {hasLogo && (
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 p-2 shadow-lg">
                <img src={tenantData?.logo_url!} alt="" className="w-full h-full object-contain" />
              </div>
            </div>
          )}
          {!hasLogo && (
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 mb-0 flex items-center justify-center">
                <span className="text-xl">✨</span>
              </div>
            </div>
          )}
          
          {/* Name */}
          <h3 className="text-xl font-bold text-white text-center mb-2 drop-shadow-lg" style={{ fontFamily: recommendedFonts.heading }}>
            {name}
          </h3>
          
          {/* Tagline */}
          <p className="text-xs text-white/80 text-center mb-4 leading-relaxed" style={{ fontFamily: recommendedFonts.body }}>
            {tagline}
          </p>
          
          {/* Stats in glass pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-5">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
              <Users className="w-3 h-3 text-white/80" />
              <span className="text-[10px] font-medium text-white">0</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] font-medium text-white">5.0</span>
            </div>
          </div>
          
          {/* CTA */}
          <button className="w-full py-2.5 text-xs font-semibold rounded-2xl bg-white text-gray-900 shadow-xl">
            Reservar cita →
          </button>
          <button className="w-full py-2.5 text-xs mt-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl">
            Seguir
          </button>
        </div>
        
        {/* Bottom dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-white/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
