import { useState } from "react";
import { motion } from "motion/react";
import { Sun, Circle, Droplet, Thermometer, Eye, Aperture, RotateCcw, X, Check } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { IMAGE_ADJUSTMENTS, generateFilterCSS, generateVignetteCSS } from "@/constants/story-assets";
import { cn } from "@/lib/utils";

interface ImageAdjustmentsProps {
  adjustments: Record<string, number>;
  onAdjustmentsChange: (adjustments: Record<string, number>) => void;
  onClose: () => void;
  onApply: () => void;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sun, Circle, Droplet, Thermometer, Eye, Aperture
};

export const ImageAdjustments = ({
  adjustments,
  onAdjustmentsChange,
  onClose,
  onApply,
}: ImageAdjustmentsProps) => {
  const [selectedAdjustment, setSelectedAdjustment] = useState<string | null>(null);

  const handleSliderChange = (id: string, value: number[]) => {
    onAdjustmentsChange({
      ...adjustments,
      [id]: value[0],
    });
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(5);
    }
  };

  const handleReset = () => {
    const defaults: Record<string, number> = {};
    IMAGE_ADJUSTMENTS.forEach(adj => {
      defaults[adj.id] = adj.default;
    });
    onAdjustmentsChange(defaults);
    
    if (navigator.vibrate) {
      navigator.vibrate([10, 50, 10]);
    }
  };

  const hasChanges = IMAGE_ADJUSTMENTS.some(
    adj => adjustments[adj.id] !== adj.default
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-20 left-4 right-4 bg-black/95 backdrop-blur-xl rounded-2xl p-4 z-50 border border-white/10"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Sun className="w-4 h-4 text-primary" />
          Ajustes de Imagen
        </h3>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={handleReset}
              className="text-white/60 hover:text-white transition-colors text-xs flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </motion.button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Quick Adjustment Buttons */}
      <div className="grid grid-cols-6 gap-2 mb-4">
        {IMAGE_ADJUSTMENTS.map((adj) => {
          const IconComponent = ICONS[adj.icon];
          const isActive = selectedAdjustment === adj.id;
          const isModified = adjustments[adj.id] !== adj.default;
          
          return (
            <motion.button
              key={adj.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedAdjustment(isActive ? null : adj.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all relative",
                isActive
                  ? "bg-primary text-white"
                  : isModified
                    ? "bg-primary/20 text-primary"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
              )}
            >
              {IconComponent && <IconComponent className="w-5 h-5" />}
              <span className="text-[9px] font-medium truncate w-full text-center">
                {adj.name}
              </span>
              {isModified && !isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Active Adjustment Slider */}
      {selectedAdjustment && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4"
        >
          {(() => {
            const adj = IMAGE_ADJUSTMENTS.find(a => a.id === selectedAdjustment);
            if (!adj) return null;
            const IconComponent = ICONS[adj.icon];
            
            return (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {IconComponent && <IconComponent className="w-4 h-4 text-primary" />}
                    <span className="text-white font-medium">{adj.name}</span>
                  </div>
                  <span className="text-primary font-mono text-sm">
                    {adjustments[adj.id]}{adj.unit}
                  </span>
                </div>
                
                <Slider
                  value={[adjustments[adj.id]]}
                  min={adj.min}
                  max={adj.max}
                  step={adj.step}
                  onValueChange={(value) => handleSliderChange(adj.id, value)}
                  className="w-full"
                />
                
                <div className="flex justify-between mt-2 text-white/40 text-xs">
                  <span>{adj.min}{adj.unit}</span>
                  <button
                    onClick={() => handleSliderChange(adj.id, [adj.default])}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    Default: {adj.default}{adj.unit}
                  </button>
                  <span>{adj.max}{adj.unit}</span>
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* All Sliders View */}
      {!selectedAdjustment && (
        <div className="space-y-3 max-h-[200px] overflow-y-auto">
          {IMAGE_ADJUSTMENTS.map((adj) => {
            const IconComponent = ICONS[adj.icon];
            const isModified = adjustments[adj.id] !== adj.default;
            
            return (
              <div key={adj.id} className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  isModified ? "bg-primary/20 text-primary" : "bg-white/10 text-white/60"
                )}>
                  {IconComponent && <IconComponent className="w-4 h-4" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/70 text-xs">{adj.name}</span>
                    <span className={cn(
                      "text-xs font-mono",
                      isModified ? "text-primary" : "text-white/40"
                    )}>
                      {adjustments[adj.id]}{adj.unit}
                    </span>
                  </div>
                  <Slider
                    value={[adjustments[adj.id]]}
                    min={adj.min}
                    max={adj.max}
                    step={adj.step}
                    onValueChange={(value) => handleSliderChange(adj.id, value)}
                    className="w-full"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Apply Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onApply}
        className="w-full mt-4 py-3 rounded-xl bg-primary text-white font-semibold flex items-center justify-center gap-2"
      >
        <Check className="w-4 h-4" />
        Aplicar Ajustes
      </motion.button>
    </motion.div>
  );
};

// Export helper functions
export { generateFilterCSS, generateVignetteCSS };
