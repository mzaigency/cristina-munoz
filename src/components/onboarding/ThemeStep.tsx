import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Layers, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { landingThemes, LandingTheme } from "./landing-themes";
import { StepProps } from "./types";

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
      className={`relative p-2 rounded-2xl border-2 transition-all text-left ${
        selected 
          ? "border-primary ring-2 ring-primary/20 bg-primary/5" 
          : "border-border hover:border-primary/50"
      }`}
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

      {/* Mini Preview */}
      <div className="aspect-[9/14] rounded-xl overflow-hidden mb-2 relative">
        <ThemeMiniPreview theme={theme} tenantName={tenantName} />
        
        {/* Preview button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="absolute bottom-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
        >
          <Eye className="w-3 h-3 text-foreground" />
        </button>
      </div>

      {/* Info */}
      <p className="text-sm font-semibold text-foreground">{theme.name}</p>
      <p className="text-xs text-muted-foreground line-clamp-1">{theme.description}</p>
    </motion.button>
  );
}

// Mini Preview Component
interface ThemeMiniPreviewProps {
  theme: LandingTheme;
  tenantName?: string;
}

function ThemeMiniPreview({ theme, tenantName = "Tu Negocio" }: ThemeMiniPreviewProps) {
  const { heroLayout, defaultColors } = theme;

  if (heroLayout === "fullscreen") {
    return (
      <div 
        className="w-full h-full flex flex-col items-center justify-center p-3"
        style={{ background: `linear-gradient(135deg, ${defaultColors.primary} 0%, ${defaultColors.secondary} 100%)` }}
      >
        <div className="w-6 h-6 rounded-lg bg-white/30 mb-2" />
        <div className="w-16 h-2 rounded bg-white mb-1" />
        <div className="w-12 h-1.5 rounded bg-white/60 mb-3" />
        <div className="w-14 h-4 rounded-full bg-white/90" />
      </div>
    );
  }

  if (heroLayout === "minimal") {
    return (
      <div className="w-full h-full bg-white flex flex-col items-center justify-center p-3">
        <div className="w-20 h-3 rounded bg-foreground/80 mb-1" />
        <div 
          className="w-8 h-0.5 mb-1" 
          style={{ backgroundColor: defaultColors.primary }} 
        />
        <div className="w-14 h-1.5 rounded bg-muted-foreground/40 mb-3" />
        <div 
          className="w-12 h-4 rounded border-2" 
          style={{ borderColor: defaultColors.primary }} 
        />
        <div className="flex gap-1 mt-auto">
          <div className="w-8 h-10 rounded bg-muted" />
          <div className="w-8 h-10 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (heroLayout === "split") {
    return (
      <div className="w-full h-full flex">
        <div 
          className="w-1/2 h-full"
          style={{ background: `linear-gradient(135deg, ${defaultColors.primary}80 0%, ${defaultColors.secondary}80 100%)` }}
        />
        <div className="w-1/2 h-full bg-white flex flex-col items-start justify-center p-2">
          <div className="w-4 h-4 rounded bg-muted mb-2" />
          <div className="w-10 h-2 rounded bg-foreground/80 mb-1" />
          <div className="w-8 h-1 rounded bg-muted-foreground/40 mb-2" />
          <div 
            className="w-8 h-3 rounded"
            style={{ backgroundColor: defaultColors.primary }}
          />
        </div>
      </div>
    );
  }

  // Bold
  return (
    <div className="w-full h-full bg-white flex flex-col p-2">
      <div 
        className="flex-1 rounded-xl flex flex-col items-center justify-center p-2"
        style={{ background: `linear-gradient(135deg, ${defaultColors.primary} 0%, ${defaultColors.secondary} 100%)` }}
      >
        <div className="w-5 h-5 rounded-lg bg-white/30 mb-1" />
        <div className="w-12 h-2 rounded bg-white mb-1" />
        <div className="w-8 h-1 rounded bg-white/60 mb-2" />
        <div className="w-10 h-3 rounded bg-white" />
      </div>
      <div className="h-10 mt-2 rounded-lg bg-muted" />
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-background rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
      >
        {/* Preview */}
        <div className="aspect-[9/14] relative">
          <ThemeLargePreview theme={theme} tenantName={tenantName} />
        </div>

        {/* Actions */}
        <div className="p-4 space-y-3">
          <div>
            <h4 className="font-semibold text-lg">{theme.name}</h4>
            <p className="text-sm text-muted-foreground">{theme.description}</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cerrar
            </Button>
            <Button onClick={onSelect} className="flex-1">
              Seleccionar
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Large Preview Component
function ThemeLargePreview({ theme, tenantName }: { theme: LandingTheme; tenantName: string }) {
  const { heroLayout, defaultColors, recommendedFonts } = theme;

  if (heroLayout === "fullscreen") {
    return (
      <div 
        className="w-full h-full flex flex-col items-center justify-center p-6 text-center"
        style={{ background: `linear-gradient(135deg, ${defaultColors.primary} 0%, ${defaultColors.secondary} 100%)` }}
      >
        <div className="w-14 h-14 rounded-2xl bg-white/30 mb-4" />
        <h3 
          className="text-2xl font-bold text-white mb-2"
          style={{ fontFamily: recommendedFonts.heading }}
        >
          {tenantName}
        </h3>
        <p className="text-white/80 text-sm mb-6" style={{ fontFamily: recommendedFonts.body }}>
          Tu espacio de belleza y bienestar
        </p>
        <div className="px-6 py-3 rounded-full bg-white/90 text-sm font-medium">
          Reservar cita
        </div>
      </div>
    );
  }

  if (heroLayout === "minimal") {
    return (
      <div className="w-full h-full bg-white flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h3 
            className="text-3xl font-light text-foreground mb-2"
            style={{ fontFamily: recommendedFonts.heading }}
          >
            {tenantName}
          </h3>
          <div 
            className="w-16 h-0.5 mb-3" 
            style={{ backgroundColor: defaultColors.primary }} 
          />
          <p className="text-muted-foreground text-sm mb-6" style={{ fontFamily: recommendedFonts.body }}>
            Tu espacio de belleza y bienestar
          </p>
          <div 
            className="px-6 py-2.5 rounded border-2 text-sm font-medium"
            style={{ borderColor: defaultColors.primary, color: defaultColors.primary }}
          >
            Reservar cita
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 gap-2">
          <div className="aspect-[4/5] rounded-xl bg-muted" />
          <div className="aspect-[4/5] rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (heroLayout === "split") {
    return (
      <div className="w-full h-full flex flex-col">
        <div 
          className="h-1/2"
          style={{ background: `linear-gradient(135deg, ${defaultColors.primary}90 0%, ${defaultColors.secondary}90 100%)` }}
        />
        <div className="h-1/2 bg-white flex flex-col justify-center p-6">
          <div className="w-10 h-10 rounded-xl bg-muted mb-4" />
          <h3 
            className="text-2xl font-bold text-foreground mb-2"
            style={{ fontFamily: recommendedFonts.heading }}
          >
            {tenantName}
          </h3>
          <p className="text-muted-foreground text-sm mb-4" style={{ fontFamily: recommendedFonts.body }}>
            Tu espacio de belleza y bienestar
          </p>
          <div 
            className="self-start px-5 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: defaultColors.primary }}
          >
            Reservar cita
          </div>
        </div>
      </div>
    );
  }

  // Bold
  return (
    <div className="w-full h-full bg-white flex flex-col p-4">
      <div 
        className="flex-1 rounded-3xl flex flex-col items-center justify-center p-6 text-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${defaultColors.primary} 0%, ${defaultColors.secondary} 100%)` }}
      >
        {/* Decorative circles */}
        <div className="absolute top-4 right-4 w-16 h-16 border border-white/20 rounded-full" />
        <div className="absolute top-8 right-8 w-10 h-10 border border-white/10 rounded-full" />
        
        <div className="w-12 h-12 rounded-2xl bg-white/20 mb-3" />
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
        <div className="px-6 py-2.5 rounded-xl bg-white text-sm font-bold shadow-lg">
          ¡Reservar Ahora!
        </div>
      </div>
      <div className="h-24 mt-3 rounded-2xl bg-muted" />
    </div>
  );
}
