import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Layers, ChevronLeft, ChevronRight, Eye, Star, MapPin, Clock, Calendar, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { landingThemes, LandingTheme } from "./landing-themes";
import { StepProps } from "./types";
import { cn } from "@/lib/utils";

interface ThemeStepProps extends StepProps {
  tenantName?: string;
}

export function ThemeStep({ onNext, onPrev, tenantId, tenantName, loading, setLoading }: ThemeStepProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>("immersive");
  const [previewTheme, setPreviewTheme] = useState<LandingTheme | null>(null);

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
          Cada tema tiene una composición visual única
        </p>
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-2 gap-3">
        {landingThemes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            selected={selectedTheme === theme.id}
            onSelect={() => setSelectedTheme(theme.id)}
            onPreview={() => setPreviewTheme(theme)}
            tenantName={tenantName}
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
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={loading}
          className="flex-1"
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
            tenantName={tenantName || "Tu Negocio"}
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
  tenantName?: string;
}

function ThemeCard({ theme, selected, onSelect, onPreview, tenantName }: ThemeCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative p-2 rounded-2xl border-2 transition-all text-left",
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
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg z-10"
        >
          <Check className="w-4 h-4 text-primary-foreground" />
        </motion.div>
      )}

      {/* iPhone Frame Mini Preview */}
      <div className="relative mx-auto w-full max-w-[120px]">
        <PhoneFrame size="mini">
          <ThemeMiniPreview theme={theme} tenantName={tenantName} />
        </PhoneFrame>
        
        {/* Preview button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="absolute bottom-3 right-0 p-1.5 rounded-full bg-white/95 backdrop-blur-sm shadow-md hover:bg-white transition-colors border border-border/50"
        >
          <Eye className="w-3.5 h-3.5 text-foreground" />
        </button>
      </div>

      {/* Info */}
      <div className="mt-2 text-center">
        <p className="text-sm font-semibold text-foreground">{theme.name}</p>
        <p className="text-[10px] text-muted-foreground line-clamp-1">{theme.description}</p>
      </div>
    </motion.button>
  );
}

// Phone Frame Component
function PhoneFrame({ children, size = "normal" }: { children: React.ReactNode; size?: "mini" | "normal" }) {
  const isMini = size === "mini";
  
  return (
    <div className={cn(
      "relative bg-[#1a1a1a] rounded-[24px] p-[3px] shadow-xl",
      isMini ? "rounded-[16px] p-[2px]" : ""
    )}>
      {/* Notch */}
      <div className={cn(
        "absolute top-0 left-1/2 -translate-x-1/2 bg-[#1a1a1a] rounded-b-xl z-10",
        isMini ? "w-12 h-3" : "w-20 h-5"
      )} />
      
      {/* Screen */}
      <div className={cn(
        "relative bg-white overflow-hidden",
        isMini ? "rounded-[14px] aspect-[9/17]" : "rounded-[22px] aspect-[9/19]"
      )}>
        {children}
      </div>
      
      {/* Home indicator */}
      <div className={cn(
        "absolute bottom-1 left-1/2 -translate-x-1/2 bg-white/50 rounded-full",
        isMini ? "w-8 h-0.5" : "w-20 h-1"
      )} />
    </div>
  );
}

// Mini Preview Component
interface ThemeMiniPreviewProps {
  theme: LandingTheme;
  tenantName?: string;
}

function ThemeMiniPreview({ theme, tenantName = "Tu Salón" }: ThemeMiniPreviewProps) {
  const { heroLayout, defaultColors } = theme;

  // Status bar
  const StatusBar = () => (
    <div className="absolute top-0 left-0 right-0 h-4 flex items-center justify-between px-2 z-20">
      <span className="text-[6px] font-medium text-white/90">9:41</span>
      <div className="flex items-center gap-0.5">
        <div className="w-2 h-1.5 bg-white/90 rounded-sm" />
      </div>
    </div>
  );

  if (heroLayout === "fullscreen") {
    return (
      <div 
        className="w-full h-full flex flex-col items-center justify-center relative"
        style={{ background: `linear-gradient(135deg, ${defaultColors.primary} 0%, ${defaultColors.secondary} 100%)` }}
      >
        <StatusBar />
        <div className="w-5 h-5 rounded-lg bg-white/30 mb-1.5" />
        <div className="w-14 h-1.5 rounded bg-white/95 mb-0.5" />
        <div className="w-10 h-1 rounded bg-white/60 mb-2" />
        <div className="flex items-center gap-0.5 mb-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-yellow-300" />
          ))}
        </div>
        <div className="w-12 h-3 rounded-full bg-white/90" />
      </div>
    );
  }

  if (heroLayout === "minimal") {
    return (
      <div className="w-full h-full bg-white flex flex-col relative">
        <div className="absolute top-0 left-0 right-0 h-4 flex items-center justify-between px-2 z-20">
          <span className="text-[6px] font-medium text-foreground/70">9:41</span>
          <div className="flex items-center gap-0.5">
            <div className="w-2 h-1.5 bg-foreground/70 rounded-sm" />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center pt-4">
          <div className="w-16 h-2 rounded bg-foreground/85 mb-1" />
          <div 
            className="w-6 h-0.5 mb-1" 
            style={{ backgroundColor: defaultColors.primary }} 
          />
          <div className="w-12 h-1 rounded bg-muted-foreground/40 mb-2" />
          <div 
            className="w-10 h-2.5 rounded border-[1.5px]" 
            style={{ borderColor: defaultColors.primary }} 
          />
        </div>
        <div className="p-1.5 flex gap-1">
          <div className="flex-1 aspect-square rounded-md bg-muted" />
          <div className="flex-1 aspect-square rounded-md bg-muted" />
        </div>
      </div>
    );
  }

  if (heroLayout === "split") {
    return (
      <div className="w-full h-full flex flex-col relative">
        <StatusBar />
        <div 
          className="h-[45%]"
          style={{ background: `linear-gradient(135deg, ${defaultColors.primary}90 0%, ${defaultColors.secondary}90 100%)` }}
        />
        <div className="flex-1 bg-white flex flex-col items-start justify-center px-2">
          <div className="w-4 h-4 rounded bg-muted mb-1" />
          <div className="w-12 h-1.5 rounded bg-foreground/80 mb-0.5" />
          <div className="w-8 h-1 rounded bg-muted-foreground/40 mb-1.5" />
          <div 
            className="w-8 h-2.5 rounded"
            style={{ backgroundColor: defaultColors.primary }}
          />
        </div>
      </div>
    );
  }

  // Bold
  return (
    <div className="w-full h-full bg-white flex flex-col p-1.5 relative">
      <div className="absolute top-0 left-0 right-0 h-4 flex items-center justify-between px-2 z-20">
        <span className="text-[6px] font-medium text-white/90">9:41</span>
        <div className="flex items-center gap-0.5">
          <div className="w-2 h-1.5 bg-white/90 rounded-sm" />
        </div>
      </div>
      <div 
        className="flex-1 rounded-lg flex flex-col items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${defaultColors.primary} 0%, ${defaultColors.secondary} 100%)` }}
      >
        <div className="w-4 h-4 rounded-md bg-white/30 mb-1" />
        <div className="w-10 h-1.5 rounded bg-white mb-0.5" />
        <div className="w-6 h-1 rounded bg-white/60 mb-1.5" />
        <div className="w-8 h-2.5 rounded bg-white" />
      </div>
      <div className="h-6 mt-1 rounded-md bg-muted" />
    </div>
  );
}

// Preview Modal
interface ThemePreviewModalProps {
  theme: LandingTheme;
  tenantName: string;
  onClose: () => void;
  onSelect: () => void;
}

function ThemePreviewModal({ theme, tenantName, onClose, onSelect }: ThemePreviewModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[280px]"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Phone Frame */}
        <PhoneFrame size="normal">
          <ThemeLargePreview theme={theme} tenantName={tenantName} />
        </PhoneFrame>

        {/* Theme Info & Actions */}
        <div className="mt-6 text-center">
          <h4 className="font-semibold text-lg text-white">{theme.name}</h4>
          <p className="text-sm text-white/70 mb-4">{theme.description}</p>
          
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

// Large Preview Component with realistic UI elements
function ThemeLargePreview({ theme, tenantName }: { theme: LandingTheme; tenantName: string }) {
  const { heroLayout, defaultColors, recommendedFonts } = theme;

  // Realistic status bar
  const StatusBar = ({ light = true }: { light?: boolean }) => (
    <div className={cn(
      "absolute top-0 left-0 right-0 h-7 flex items-center justify-between px-5 z-20",
      light ? "text-white" : "text-foreground"
    )}>
      <span className="text-[11px] font-semibold">9:41</span>
      <div className="flex items-center gap-1">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor" className="opacity-90">
          <path d="M1.5 4.5h1v4h-1zm2.5-1h1v5H4zm2.5-1h1v6H6.5zm2.5-1h1v7H9z"/>
        </svg>
        <svg width="14" height="11" viewBox="0 0 14 11" fill="currentColor" className="opacity-90">
          <path d="M7 0C4.24 0 1.81 1.24.12 3.2l1.06 1.06C2.52 2.72 4.6 1.8 7 1.8s4.48.92 5.82 2.46l1.06-1.06C12.19 1.24 9.76 0 7 0zm0 3.6c-1.6 0-3.04.64-4.1 1.68l1.06 1.06C4.76 5.56 5.8 5.1 7 5.1s2.24.46 3.04 1.24l1.06-1.06C10.04 4.24 8.6 3.6 7 3.6zM7 7a2.25 2.25 0 100 4.5A2.25 2.25 0 007 7z"/>
        </svg>
        <div className="flex items-center">
          <div className="w-5 h-2.5 bg-current opacity-90 rounded-sm relative">
            <div className="absolute right-0.5 top-0.5 bottom-0.5 left-0.5 bg-current rounded-[1px]" style={{ width: '80%' }} />
          </div>
          <div className="w-[1.5px] h-1 bg-current opacity-90 rounded-r-sm ml-[1px]" />
        </div>
      </div>
    </div>
  );

  // Service card component
  const ServiceCard = ({ name, price }: { name: string; price: string }) => (
    <div className="flex items-center justify-between p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm">
      <div>
        <p className="text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">45 min</p>
      </div>
      <span className="text-sm font-semibold" style={{ color: defaultColors.primary }}>{price}</span>
    </div>
  );

  if (heroLayout === "fullscreen") {
    return (
      <div className="w-full h-full overflow-y-auto">
        {/* Hero Section */}
        <div 
          className="min-h-[85%] flex flex-col items-center justify-center p-6 text-center relative"
          style={{ background: `linear-gradient(135deg, ${defaultColors.primary} 0%, ${defaultColors.secondary} 100%)` }}
        >
          <StatusBar light />
          
          {/* Decorative elements */}
          <div className="absolute top-20 right-6 w-20 h-20 border border-white/10 rounded-full" />
          <div className="absolute bottom-20 left-6 w-14 h-14 border border-white/10 rounded-full" />
          
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-4 flex items-center justify-center">
            <span className="text-2xl">✨</span>
          </div>
          
          <h3 
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: recommendedFonts.heading }}
          >
            {tenantName}
          </h3>
          <p className="text-white/80 text-sm mb-4" style={{ fontFamily: recommendedFonts.body }}>
            Tu espacio de belleza y bienestar
          </p>
          
          {/* Rating */}
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
          
          {/* Quick info */}
          <div className="flex items-center gap-4 mt-8 text-white/70 text-xs">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>Centro</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Abierto</span>
            </div>
          </div>
        </div>
        
        {/* Services preview */}
        <div className="p-4 bg-background space-y-2">
          <h4 className="text-sm font-semibold text-foreground mb-2">Servicios populares</h4>
          <ServiceCard name="Corte de cabello" price="25€" />
          <ServiceCard name="Tinte completo" price="65€" />
        </div>
      </div>
    );
  }

  if (heroLayout === "minimal") {
    return (
      <div className="w-full h-full bg-white overflow-y-auto">
        <StatusBar light={false} />
        
        {/* Hero */}
        <div className="flex flex-col items-center justify-center pt-16 pb-8 px-6 text-center">
          <h3 
            className="text-3xl font-light text-foreground mb-2 tracking-tight"
            style={{ fontFamily: recommendedFonts.heading }}
          >
            {tenantName}
          </h3>
          <div 
            className="w-16 h-[2px] mb-3" 
            style={{ backgroundColor: defaultColors.primary }} 
          />
          <p className="text-muted-foreground text-sm mb-6" style={{ fontFamily: recommendedFonts.body }}>
            Tu espacio de belleza y bienestar
          </p>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-muted-foreground text-xs ml-1">4.9</span>
          </div>
          
          <button 
            className="px-8 py-2.5 rounded border-2 text-sm font-medium transition-colors"
            style={{ borderColor: defaultColors.primary, color: defaultColors.primary }}
          >
            Reservar cita
          </button>
        </div>
        
        {/* Gallery */}
        <div className="px-4 grid grid-cols-2 gap-2">
          <div className="aspect-[4/5] rounded-xl bg-gradient-to-br from-muted to-muted/50" />
          <div className="aspect-[4/5] rounded-xl bg-gradient-to-br from-muted to-muted/50" />
        </div>
        
        {/* Services */}
        <div className="p-4 space-y-2 mt-4">
          <h4 className="text-sm font-medium text-foreground">Nuestros servicios</h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <div className="flex-shrink-0 px-4 py-2 rounded-full border" style={{ borderColor: defaultColors.primary, color: defaultColors.primary }}>
              <span className="text-xs font-medium">Corte</span>
            </div>
            <div className="flex-shrink-0 px-4 py-2 rounded-full bg-muted">
              <span className="text-xs text-muted-foreground">Color</span>
            </div>
            <div className="flex-shrink-0 px-4 py-2 rounded-full bg-muted">
              <span className="text-xs text-muted-foreground">Peinado</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (heroLayout === "split") {
    return (
      <div className="w-full h-full flex flex-col overflow-y-auto">
        <StatusBar light />
        
        {/* Hero image */}
        <div 
          className="h-[40%] relative"
          style={{ background: `linear-gradient(135deg, ${defaultColors.primary}95 0%, ${defaultColors.secondary}95 100%)` }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Calendar className="w-8 h-8 text-white/80" />
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <span className="text-lg">💇</span>
            </div>
            <div>
              <h3 
                className="text-xl font-bold text-foreground"
                style={{ fontFamily: recommendedFonts.heading }}
              >
                {tenantName}
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
            Tu espacio de belleza y bienestar personal
          </p>
          
          <button 
            className="w-full py-3 rounded-xl text-white text-sm font-semibold shadow-md"
            style={{ backgroundColor: defaultColors.primary }}
          >
            Reservar cita
          </button>
          
          {/* Location */}
          <div className="flex items-center gap-2 mt-6 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-xs">Calle Principal, 123 • Centro</span>
          </div>
        </div>
      </div>
    );
  }

  // Bold
  return (
    <div className="w-full h-full bg-background flex flex-col p-3 overflow-y-auto">
      <div className="absolute top-0 left-0 right-0 h-7 flex items-center justify-between px-5 z-20 text-white">
        <span className="text-[11px] font-semibold">9:41</span>
      </div>
      
      {/* Hero Card */}
      <div 
        className="flex-shrink-0 rounded-3xl flex flex-col items-center justify-center p-6 text-center relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${defaultColors.primary} 0%, ${defaultColors.secondary} 100%)`,
          minHeight: '55%'
        }}
      >
        {/* Decorative circles */}
        <div className="absolute top-4 right-4 w-24 h-24 border-2 border-white/15 rounded-full" />
        <div className="absolute top-8 right-8 w-16 h-16 border border-white/10 rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full" />
        
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm mb-3 flex items-center justify-center">
          <span className="text-xl">✨</span>
        </div>
        
        <h3 
          className="text-xl font-black text-white uppercase tracking-wide mb-1"
          style={{ fontFamily: recommendedFonts.heading }}
        >
          {tenantName}
        </h3>
        <div className="w-12 h-0.5 bg-white/40 mb-2 rounded-full" />
        <p className="text-white/80 text-sm mb-4" style={{ fontFamily: recommendedFonts.body }}>
          Tu espacio de belleza
        </p>
        
        {/* Rating */}
        <div className="flex items-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
          ))}
        </div>
        
        <button className="px-8 py-2.5 rounded-xl bg-white text-sm font-bold shadow-lg">
          ¡Reservar Ahora!
        </button>
      </div>
      
      {/* Info Card */}
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
          <p className="text-xs text-muted-foreground">Calle Principal, 123</p>
        </div>
      </div>
    </div>
  );
}
