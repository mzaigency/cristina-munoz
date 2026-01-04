import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Type, Zap, Square, Box, Activity, Star, Layers, Flame, Palette, Sparkles,
  Play, Pause, RotateCcw
} from "lucide-react";
import { TEXT_STYLES, TEXT_GRADIENTS, TEXT_ANIMATIONS } from "@/constants/story-assets";
import { cn } from "@/lib/utils";

interface TextStylePickerProps {
  selectedStyle: string;
  selectedGradient: string | null;
  selectedAnimation: string;
  currentColor: string;
  fontSize: number;
  onStyleChange: (styleId: string) => void;
  onGradientChange: (gradientId: string | null) => void;
  onAnimationChange: (animationId: string) => void;
  onFontSizeChange: (size: number) => void;
  onClose: () => void;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Type, Zap, Square, Box, Activity, Star, Layers, Flame
};

// Animation previews
const ANIMATION_KEYFRAMES: Record<string, any> = {
  none: {},
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 1.5, repeat: Infinity }
  },
  bounce: {
    y: [0, -10, 0],
    transition: { duration: 0.6, repeat: Infinity }
  },
  shake: {
    x: [0, -5, 5, -5, 5, 0],
    transition: { duration: 0.5, repeat: Infinity }
  },
  glow: {
    textShadow: [
      "0 0 5px currentColor, 0 0 10px currentColor",
      "0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor",
      "0 0 5px currentColor, 0 0 10px currentColor"
    ],
    transition: { duration: 2, repeat: Infinity }
  },
  typing: {
    width: ["0%", "100%"],
    transition: { duration: 2, ease: "steps(20)" }
  },
  slide: {
    x: [-100, 0],
    opacity: [0, 1],
    transition: { duration: 0.5 }
  },
  fadeIn: {
    opacity: [0, 1],
    y: [20, 0],
    transition: { duration: 0.8 }
  },
  pop: {
    scale: [0, 1.2, 1],
    transition: { duration: 0.5 }
  }
};

const EXTENDED_ANIMATIONS = [
  { id: "none", name: "Sin anim.", icon: "⏹️" },
  { id: "pulse", name: "Pulso", icon: "💓" },
  { id: "bounce", name: "Rebote", icon: "⬆️" },
  { id: "shake", name: "Vibrar", icon: "📳" },
  { id: "glow", name: "Brillo", icon: "✨" },
  { id: "slide", name: "Deslizar", icon: "➡️" },
  { id: "fadeIn", name: "Aparecer", icon: "👻" },
  { id: "pop", name: "Pop", icon: "💥" },
];

export const TextStylePicker = ({
  selectedStyle,
  selectedGradient,
  selectedAnimation,
  currentColor,
  fontSize,
  onStyleChange,
  onGradientChange,
  onAnimationChange,
  onFontSizeChange,
  onClose,
}: TextStylePickerProps) => {
  const [activeTab, setActiveTab] = useState<"styles" | "animations" | "size">("styles");
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);

  const replayAnimation = () => {
    setPreviewKey(prev => prev + 1);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-20 left-4 right-4 bg-black/95 backdrop-blur-xl rounded-3xl p-4 z-50 border border-white/10 max-h-[70vh] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Estilos de Texto
        </h3>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors text-sm px-3 py-1 rounded-full bg-white/10"
        >
          Listo
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white/5 p-1 rounded-xl shrink-0">
        {[
          { id: "styles", label: "Efectos" },
          { id: "animations", label: "Animación" },
          { id: "size", label: "Tamaño" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-primary text-white"
                : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="wait">
          {activeTab === "styles" && (
            <motion.div
              key="styles"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Estilos de Texto */}
              <div className="mb-4">
                <p className="text-white/60 text-xs mb-2 uppercase tracking-wider">Efectos</p>
                <div className="grid grid-cols-4 gap-2">
                  {TEXT_STYLES.map((style) => {
                    const IconComponent = ICONS[style.icon];
                    return (
                      <motion.button
                        key={style.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          onStyleChange(style.id);
                          if (style.id !== "normal") {
                            onGradientChange(null);
                          }
                          if (navigator.vibrate) navigator.vibrate(8);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
                          selectedStyle === style.id
                            ? "bg-primary text-white"
                            : "bg-white/10 text-white/80 active:bg-white/20"
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
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      onGradientChange(null);
                      if (navigator.vibrate) navigator.vibrate(8);
                    }}
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

                  {TEXT_GRADIENTS.map((gradient) => (
                    <motion.button
                      key={gradient.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onGradientChange(gradient.id);
                        onStyleChange("normal");
                        if (navigator.vibrate) navigator.vibrate(8);
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
            </motion.div>
          )}

          {activeTab === "animations" && (
            <motion.div
              key="animations"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <p className="text-white/60 text-xs mb-3 uppercase tracking-wider flex items-center gap-2">
                <Play className="w-3 h-3" />
                Animación de entrada
              </p>
              <div className="grid grid-cols-4 gap-2">
                {EXTENDED_ANIMATIONS.map((anim) => (
                  <motion.button
                    key={anim.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      onAnimationChange(anim.id);
                      replayAnimation();
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
                      selectedAnimation === anim.id
                        ? "bg-primary text-white"
                        : "bg-white/10 text-white/80 active:bg-white/20"
                    )}
                  >
                    <span className="text-xl">{anim.icon}</span>
                    <span className="text-[10px] font-medium">{anim.name}</span>
                  </motion.button>
                ))}
              </div>

              {/* Animation Preview */}
              <div className="mt-4 p-4 bg-white/5 rounded-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white/40 text-xs">Vista previa:</p>
                  <button
                    onClick={replayAnimation}
                    className="p-1.5 rounded-full bg-white/10 active:bg-white/20"
                  >
                    <RotateCcw className="w-4 h-4 text-white/60" />
                  </button>
                </div>
                <motion.div
                  key={previewKey}
                  className="text-2xl font-bold text-center py-4"
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
                  animate={isPreviewPlaying ? ANIMATION_KEYFRAMES[selectedAnimation] : undefined}
                >
                  ¡Hola Mundo!
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === "size" && (
            <motion.div
              key="size"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div>
                <p className="text-white/60 text-xs mb-4 uppercase tracking-wider">Tamaño de fuente</p>
                
                {/* Size Display */}
                <div className="text-center mb-6">
                  <span className="text-5xl font-bold text-white">{fontSize}</span>
                  <span className="text-white/40 text-lg ml-1">px</span>
                </div>

                {/* Slider */}
                <div className="relative px-4">
                  <input
                    type="range"
                    min="16"
                    max="120"
                    step="2"
                    value={fontSize}
                    onChange={(e) => {
                      onFontSizeChange(Number(e.target.value));
                      if (navigator.vibrate && Number(e.target.value) % 10 === 0) {
                        navigator.vibrate(5);
                      }
                    }}
                    className="w-full h-3 bg-white/20 rounded-full appearance-none cursor-pointer accent-primary
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-7
                      [&::-webkit-slider-thumb]:h-7
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-white
                      [&::-webkit-slider-thumb]:shadow-lg
                      [&::-webkit-slider-thumb]:cursor-grab
                      [&::-webkit-slider-thumb]:active:cursor-grabbing
                    "
                  />
                  <div className="flex justify-between mt-2 text-xs text-white/40">
                    <span>A</span>
                    <span className="text-2xl font-bold">A</span>
                  </div>
                </div>

                {/* Quick presets */}
                <div className="flex gap-2 mt-6 justify-center">
                  {[24, 36, 48, 64, 80].map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        onFontSizeChange(size);
                        if (navigator.vibrate) navigator.vibrate(10);
                      }}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                        fontSize === size
                          ? "bg-primary text-white"
                          : "bg-white/10 text-white/70 active:bg-white/20"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-white/40 text-xs mb-2">Vista previa:</p>
                <div
                  className="font-bold text-center py-4 overflow-hidden"
                  style={{
                    fontSize: `${Math.min(fontSize, 60)}px`,
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
                  Texto
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
