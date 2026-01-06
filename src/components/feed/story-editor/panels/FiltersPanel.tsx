import { motion, AnimatePresence } from 'motion/react';
import { useEditorStore } from '../store/useEditorStore';
import { FILTER_PRESETS } from '../utils/constants';
import { useState, useEffect } from 'react';

interface FiltersPanelProps {
  onApplyFilter?: (filters: any) => void;
}

export function FiltersPanel({ onApplyFilter }: FiltersPanelProps) {
  const { activePanel, setActivePanel, getSelectedElement, updateElement } = useEditorStore();
  const [activePreset, setActivePreset] = useState('normal');
  const [customFilters, setCustomFilters] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0,
  });

  const isOpen = activePanel === 'filters';
  const selectedElement = getSelectedElement();
  const isEditingImage = selectedElement?.type === 'image';

  const handlePresetSelect = (presetId: string) => {
    setActivePreset(presetId);
    const preset = FILTER_PRESETS.find(p => p.id === presetId);
    if (preset && onApplyFilter) {
      onApplyFilter(preset.filters);
    }
  };

  const handleFilterChange = (filterName: string, value: number) => {
    const newFilters = { ...customFilters, [filterName]: value };
    setCustomFilters(newFilters);
    setActivePreset('custom');
    if (onApplyFilter) {
      onApplyFilter(newFilters);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="absolute bottom-24 left-0 right-0 z-40 mx-3"
        style={{
          marginBottom: 'max(env(safe-area-inset-bottom), 16px)',
        }}
      >
        <div className="bg-black/90 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10">
            <h3 className="text-white font-semibold text-center">Filtros</h3>
          </div>

          <div className="p-4 space-y-5 max-h-[50vh] overflow-y-auto">
            {/* Presets */}
            <div>
              <label className="text-white/60 text-xs font-medium mb-3 block">Presets</label>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                {FILTER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`flex-shrink-0 flex flex-col items-center gap-2 transition-all`}
                  >
                    <div
                      className={`w-16 h-16 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center transition-all ${
                        activePreset === preset.id
                          ? 'ring-2 ring-white'
                          : ''
                      }`}
                    >
                      <span className="text-white text-xs">{preset.name[0]}</span>
                    </div>
                    <span className={`text-xs font-medium ${
                      activePreset === preset.id ? 'text-white' : 'text-white/60'
                    }`}>
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Adjustments */}
            <div className="space-y-4">
              <label className="text-white/60 text-xs font-medium block">Ajustes</label>
              
              {/* Brightness */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">Brillo</span>
                  <span className="text-white/60">{Math.round(customFilters.brightness * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={customFilters.brightness}
                  onChange={(e) => handleFilterChange('brightness', parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">Contraste</span>
                  <span className="text-white/60">{Math.round(customFilters.contrast * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={customFilters.contrast}
                  onChange={(e) => handleFilterChange('contrast', parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">Saturación</span>
                  <span className="text-white/60">{Math.round(customFilters.saturation * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={customFilters.saturation}
                  onChange={(e) => handleFilterChange('saturation', parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>

              {/* Blur */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">Desenfoque</span>
                  <span className="text-white/60">{Math.round(customFilters.blur * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={customFilters.blur}
                  onChange={(e) => handleFilterChange('blur', parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
            </div>

            {/* Apply button */}
            <button
              onClick={() => setActivePanel('none')}
              className="w-full py-4 bg-white text-black font-semibold rounded-xl active:scale-98 transition-transform"
            >
              Aplicar
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
