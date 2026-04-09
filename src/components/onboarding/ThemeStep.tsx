import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Layers, ChevronLeft, ChevronRight, Expand, Star, MapPin, Clock, X, Users, Scissors } from "lucide-react";
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
        <div className="mt-6 text-center">
          <h4 className="font-semibold text-lg text-white">{theme.name}</h4>
          <p className="text-sm text-white/70 mb-4">{theme.description}</p>
          
          {/* Stats from real data */}
          <div className="flex justify-center gap-4 mb-4 text-white/60 text-xs">
            {services.length > 0 && (
              <div className="flex items-center gap-1">
                <Scissors className="w-3 h-3" />
                <span>{services.length} servicios</span>
              </div>
            )}
            {stylists.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{stylists.length} profesionales</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Cerrar
            </Button>
            <Button 
              onClick={onSelect} 
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

// Full Preview Component with real data
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

  // Status bar
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

  // Service card with real data
  const ServiceCard = ({ service }: { service: ServiceData }) => (
    <div className="flex items-center justify-between p-3 bg-white/90 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm">
      <div>
        <p className="text-sm font-medium text-foreground">{service.name}</p>
        <p className="text-xs text-muted-foreground">{service.duration_part1_active} min</p>
      </div>
      {service.price && (
        <span className="text-sm font-semibold" style={{ color: defaultColors.primary }}>
          {service.price}€
        </span>
      )}
    </div>
  );

  if (heroLayout === "fullscreen") {
    return (
      <div className="w-full h-full overflow-y-auto">
        <div 
          className="min-h-[85%] flex flex-col items-center justify-center p-6 text-center relative"
          style={{ 
            background: hasImage 
              ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${tenantData?.hero_image_url}) center/cover` 
              : gradientBg 
          }}
        >
          <StatusBar light />
          
          {/* Decorative elements */}
          <div className="absolute top-20 right-6 w-20 h-20 border border-white/10 rounded-full" />
          
          {hasLogo ? (
            <img src={tenantData?.logo_url!} alt="" className="w-16 h-16 rounded-2xl object-cover mb-4 shadow-lg" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-4 flex items-center justify-center">
              <span className="text-2xl">✨</span>
            </div>
          )}
          
          <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: recommendedFonts.heading }}>
            {name}
          </h3>
          <p className="text-white/80 text-sm mb-4" style={{ fontFamily: recommendedFonts.body }}>
            {tagline}
          </p>
          
          <div className="flex items-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-white/80 text-xs ml-1">(127)</span>
          </div>
          
          <button 
            className="px-8 py-3 rounded-full bg-white text-sm font-semibold shadow-lg"
            style={{ color: defaultColors.primary }}
          >
            Reservar cita
          </button>
          
          <div className="flex items-center gap-4 mt-8 text-white/70 text-xs">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{city}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Abierto</span>
            </div>
          </div>
        </div>
        
        {services.length > 0 && (
          <div className="p-4 bg-background space-y-2">
            <h4 className="text-sm font-semibold text-foreground mb-2">Servicios populares</h4>
            {services.slice(0, 2).map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (heroLayout === "minimal") {
    return (
      <div className="w-full h-full bg-white overflow-y-auto">
        <StatusBar light={false} />
        
        <div className="flex flex-col items-center justify-center pt-16 pb-8 px-6 text-center">
          <h3 className="text-2xl font-light text-foreground mb-2 tracking-tight" style={{ fontFamily: recommendedFonts.heading }}>
            {name}
          </h3>
          <div className="w-16 h-[2px] mb-3" style={{ backgroundColor: defaultColors.primary }} />
          <p className="text-muted-foreground text-sm mb-6" style={{ fontFamily: recommendedFonts.body }}>
            {tagline}
          </p>
          
          <div className="flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-muted-foreground text-xs ml-1">4.9</span>
          </div>
          
          <button 
            className="px-8 py-2.5 rounded border-2 text-sm font-medium"
            style={{ borderColor: defaultColors.primary, color: defaultColors.primary }}
          >
            Reservar cita
          </button>
        </div>
        
        {/* Gallery */}
        <div className="px-4 grid grid-cols-2 gap-2">
          <div 
            className="aspect-[4/5] rounded-xl"
            style={{ 
              background: hasImage 
                ? `url(${tenantData?.hero_image_url}) center/cover` 
                : 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted)/0.5) 100%)' 
            }}
          />
          <div className="aspect-[4/5] rounded-xl bg-gradient-to-br from-muted to-muted/50" />
        </div>
        
        {services.length > 0 && (
          <div className="p-4 space-y-2 mt-4">
            <h4 className="text-sm font-medium text-foreground">Nuestros servicios</h4>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {services.map((s, i) => (
                <div 
                  key={s.id}
                  className={cn(
                    "flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium",
                    i === 0 ? "border" : "bg-muted text-muted-foreground"
                  )}
                  style={i === 0 ? { borderColor: defaultColors.primary, color: defaultColors.primary } : {}}
                >
                  {s.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (heroLayout === "split") {
    return (
      <div className="w-full h-full flex flex-col overflow-y-auto">
        <StatusBar light />
        
        <div 
          className="h-[40%] relative"
          style={{ 
            background: hasImage 
              ? `url(${tenantData?.hero_image_url}) center/cover` 
              : gradientBg 
          }}
        />
        
        <div className="flex-1 bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            {hasLogo ? (
              <img src={tenantData?.logo_url!} alt="" className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <span className="text-lg">💇</span>
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: recommendedFonts.heading }}>
                {name}
              </h3>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-muted-foreground text-xs ml-1">4.9 (89)</span>
              </div>
            </div>
          </div>
          
          <p className="text-muted-foreground text-sm mb-5" style={{ fontFamily: recommendedFonts.body }}>
            {tagline}
          </p>
          
          <button 
            className="w-full py-3 rounded-xl text-white text-sm font-semibold shadow-md"
            style={{ backgroundColor: defaultColors.primary }}
          >
            Reservar cita
          </button>
          
          <div className="flex items-center gap-2 mt-6 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-xs">{address} • {city}</span>
          </div>
        </div>
      </div>
    );
  }

  if (heroLayout === "bold") {
    return (
      <div className="w-full h-full bg-background flex flex-col p-3 overflow-y-auto">
        <div 
          className="flex-shrink-0 rounded-3xl flex flex-col items-center justify-center p-6 text-center relative overflow-hidden"
          style={{ 
            background: hasImage 
              ? `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5)), url(${tenantData?.hero_image_url}) center/cover` 
              : gradientBg,
            minHeight: '55%'
          }}
        >
          <StatusBar light />
          
          <div className="absolute top-4 right-4 w-24 h-24 border-2 border-white/15 rounded-full" />
          
          {hasLogo ? (
            <img src={tenantData?.logo_url!} alt="" className="w-14 h-14 rounded-2xl object-cover mb-3 shadow-lg" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm mb-3 flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
          )}
          
          <h3 className="text-xl font-black text-white uppercase tracking-wide mb-1" style={{ fontFamily: recommendedFonts.heading }}>
            {name}
          </h3>
          <div className="w-12 h-0.5 bg-white/40 mb-2 rounded-full" />
          <p className="text-white/80 text-sm mb-4" style={{ fontFamily: recommendedFonts.body }}>
            {tagline}
          </p>
          
          <div className="flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
            ))}
          </div>
          
          <button className="px-8 py-2.5 rounded-xl bg-white text-sm font-bold shadow-lg">
            ¡Reservar Ahora!
          </button>
        </div>
        
        <div className="mt-3 p-4 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-4 h-4" style={{ color: defaultColors.primary }} />
              </div>
              <div>
                <p className="text-xs font-medium">Hoy</p>
                <p className="text-[10px] text-muted-foreground">10:00 - 20:00</p>
              </div>
            </div>
            <span className="text-xs text-green-500 font-medium bg-green-500/10 px-2 py-1 rounded-full">Abierto</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin className="w-4 h-4" style={{ color: defaultColors.primary }} />
            </div>
            <p className="text-xs text-muted-foreground">{address}</p>
          </div>
        </div>
      </div>
    );
  }

  // Glass (default)
  return (
    <div 
      className="w-full h-full overflow-y-auto"
      style={{ 
        background: hasImage 
          ? `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5)), url(${tenantData?.hero_image_url}) center/cover` 
          : gradientBg 
      }}
    >
      <StatusBar light />
      
      <div className="min-h-[85%] flex flex-col items-center justify-center p-6">
        {/* Glass card */}
        <div className="w-full p-6 rounded-3xl bg-white/15 backdrop-blur-lg border border-white/20 flex flex-col items-center text-center">
          {hasLogo ? (
            <img src={tenantData?.logo_url!} alt="" className="w-16 h-16 rounded-2xl object-cover mb-4 shadow-lg" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/20 mb-4 flex items-center justify-center">
              <span className="text-2xl">✨</span>
            </div>
          )}
          
          <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: recommendedFonts.heading }}>
            {name}
          </h3>
          <p className="text-white/80 text-sm mb-4" style={{ fontFamily: recommendedFonts.body }}>
            {tagline}
          </p>
          
          <div className="flex items-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          
          <button className="w-full py-3 rounded-2xl bg-white/90 text-sm font-semibold shadow-lg" style={{ color: defaultColors.primary }}>
            Reservar cita
          </button>
        </div>
        
        {/* Quick info */}
        <div className="flex items-center gap-4 mt-6 text-white/70 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
            <MapPin className="w-3 h-3" />
            <span>{city}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
            <Clock className="w-3 h-3" />
            <span>Abierto</span>
          </div>
        </div>
      </div>
      
      {services.length > 0 && (
        <div className="p-4 bg-background/95 backdrop-blur-sm space-y-2">
          <h4 className="text-sm font-semibold text-foreground mb-2">Servicios</h4>
          {services.slice(0, 2).map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}
