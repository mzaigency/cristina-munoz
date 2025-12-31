import { motion } from "motion/react";
import { Type, Zap, Square, Box, Activity, Star, Layers, Flame, Palette, Sparkles } from "lucide-react";
import { TEXT_STYLES, TEXT_GRADIENTS } from "@/constants/story-assets";
import { cn } from "@/lib/utils";

interface TextStylePickerProps {
  selectedStyle: string;
  selectedGradient: string | null;
  currentColor: string;
  onStyleChange: (styleId: string) => void;
  onGradientChange: (gradientId: string | null) => void;
  onClose: () => void;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Type, Zap, Square, Box, Activity, Star, Layers, Flame
};

export const TextStylePicker = ({
  selectedStyle,
  selectedGradient,
  currentColor,
  onStyleChange,
  onGradientChange,
  onClose,
}: TextStylePickerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-20 left-4 right-4 bg-black/90 backdrop-blur-xl rounded-2xl p-4 z-50 border border-white/10"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Estilos de Texto
        </h3>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors text-sm"
        >
          Cerrar
        </button>
      </div>

      {/* Estilos de Texto */}
      <div className="mb-4">
        <p className="text-white/60 text-xs mb-2 uppercase tracking-wider">Efectos</p>
        <div className="grid grid-cols-4 gap-2">
          {TEXT_STYLES.map((style) => {
            const IconComponent = ICONS[style.icon];
            return (
              <motion.button
                key={style.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onStyleChange(style.id);
                  if (style.id !== "normal") {
                    onGradientChange(null);
                  }
                }}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
                  selectedStyle === style.id
                    ? "bg-primary text-white"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                )}
              >
                {IconComponent && <IconComponent className="w-5 h-5" />}
                <span className="text-[10px] font-medium">{style.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Degradados */}
      <div>
        <p className="text-white/60 text-xs mb-2 uppercase tracking-wider flex items-center gap-2">
          <Palette className="w-3 h-3" />
          Degradados
        </p>
        <div className="grid grid-cols-4 gap-2">
          {/* Sin degradado */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onGradientChange(null)}
            className={cn(
              "h-12 rounded-xl transition-all border-2 flex items-center justify-center",
              selectedGradient === null
                ? "border-primary"
                : "border-transparent"
            )}
            style={{ backgroundColor: currentColor }}
          >
            <span className="text-xs font-medium text-white drop-shadow-md">Color</span>
          </motion.button>

          {/* Gradientes */}
          {TEXT_GRADIENTS.map((gradient) => (
            <motion.button
              key={gradient.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onGradientChange(gradient.id);
                onStyleChange("normal");
              }}
              className={cn(
                "h-12 rounded-xl transition-all border-2 flex items-center justify-center overflow-hidden",
                selectedGradient === gradient.id
                  ? "border-primary"
                  : "border-transparent"
              )}
              style={{
                background: `linear-gradient(135deg, ${gradient.colors.join(", ")})`,
              }}
            >
              <span className="text-[10px] font-bold text-white drop-shadow-md">{gradient.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="mt-4 p-4 bg-white/5 rounded-xl">
        <p className="text-white/40 text-xs mb-2">Vista previa:</p>
        <div
          className="text-2xl font-bold text-center py-2"
          style={{
            fontFamily: "Montserrat, sans-serif",
            color: selectedGradient ? "transparent" : currentColor,
            background: selectedGradient 
              ? `linear-gradient(135deg, ${TEXT_GRADIENTS.find(g => g.id === selectedGradient)?.colors.join(", ") || currentColor})`
              : "transparent",
            backgroundClip: selectedGradient ? "text" : "unset",
            WebkitBackgroundClip: selectedGradient ? "text" : "unset",
            ...TEXT_STYLES.find(s => s.id === selectedStyle)?.css,
          }}
        >
          Tu Texto Aquí
        </div>
      </div>
    </motion.div>
  );
};
