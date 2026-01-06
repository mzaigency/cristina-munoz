import { motion, AnimatePresence } from 'motion/react';
import { useEditorStore } from '../store/useEditorStore';
import { FILTER_PRESETS } from '../utils/constants';
import { useState, useRef } from 'react';
import { X, Check, Sun, Contrast, Droplets, Aperture } from 'lucide-react';
import { useHaptic } from '@/hooks/useHaptic';

interface FiltersPanelProps {
  onApplyFilter?: (filters: any) => void;
}

// iOS style filter thumbnails
const FILTER_THUMBNAILS = [
  { id: 'normal', name: 'Original', gradient: 'from-gray-600 to-gray-700' },
  { id: 'vivid', name: 'Vívido', gradient: 'from-rose-500 to-orange-500' },
  { id: 'dramatic', name: 'Dramático', gradient: 'from-gray-900 to-gray-700' },
  { id: 'mono', name: 'Mono', gradient: 'from-gray-400 to-gray-600' },
  { id: 'silvertone', name: 'Plateado', gradient: 'from-slate-400 to-slate-600' },
  { id: 'noir', name: 'Noir', gradient: 'from-black to-gray-800' },
  { id: 'warm', name: 'Cálido', gradient: 'from-amber-500 to-orange-600' },
  { id: 'cool', name: 'Frío', gradient: 'from-blue-400 to-cyan-500' },
];

// Slider component with iOS haptics
function IOSSlider({ 
  label, 
  value, 
  onChange, 
  min = -100, 
  max = 100, 
  icon: Icon 
}: { 
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  icon: React.ElementType;
}) {
  const haptic = useHaptic();
  const lastSnapRef = useRef(value);

  const handleChange = (newValue: number) => {
    // Haptic on 0 crossing
    if ((lastSnapRef.current < 0 && newValue >= 0) || (lastSnapRef.current > 0 && newValue <= 0)) {
      haptic.light();
    }
    // Haptic on 25% increments
    const step = (max - min) / 4;
    const currentStep = Math.round(newValue / step);
    const lastStep = Math.round(lastSnapRef.current / step);
    if (currentStep !== lastStep) {
      haptic.selection();
    }
    lastSnapRef.current = newValue;
    onChange(newValue);
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-white/60" />
          <span className="text-white/80 text-sm font-medium">{label}</span>
        </div>
        <span className="text-white/50 text-sm tabular-nums w-12 text-right">
          {value > 0 ? `+${value}` : value}
        </span>
      </div>
      
      <div className="relative h-8 flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-1 bg-white/10 rounded-full overflow-hidden">
          {/* Active track */}
          <motion.div 
            className="absolute top-0 bottom-0 bg-white rounded-full"
            style={{
              left: percentage < 50 ? `${percentage}%` : '50%',
              right: percentage > 50 ? `${100 - percentage}%` : '50%',
            }}
            layout
          />
        </div>
        
        {/* Center marker */}
        <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-3 bg-white/30 rounded-full" />
        
        {/* Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => handleChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
        
        {/* Thumb */}
        <motion.div 
          className="absolute w-7 h-7 bg-white rounded-full shadow-lg shadow-black/50 pointer-events-none"
          style={{ left: `calc(${percentage}% - 14px)` }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 1.1 }}
        />
      </div>
    </div>
  );
}

export function FiltersPanel({ onApplyFilter }: FiltersPanelProps) {
  const { activePanel, setActivePanel } = useEditorStore();
  const haptic = useHaptic();
  const [activePreset, setActivePreset] = useState('normal');
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [filters, setFilters] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
  });

  const isOpen = activePanel === 'filters';

  const handlePresetSelect = (presetId: string) => {
    haptic.light();
    setActivePreset(presetId);
    const preset = FILTER_PRESETS.find(p => p.id === presetId);
    if (preset && onApplyFilter) {
      onApplyFilter(preset.filters);
    }
  };

  const handleFilterChange = (key: string, value: number) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onApplyFilter) {
      onApplyFilter(newFilters);
    }
  };

  const handleClose = () => {
    haptic.light();
    setActivePanel('none');
  };

  const handleApply = () => {
    haptic.success();
    setActivePanel('none');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-40"
      >
        {/* Backdrop */}
        <motion.div 
          className="absolute inset-0 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        />
        
        {/* Panel */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="absolute bottom-0 left-0 right-0"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
          }}
        >
          <div className="bg-[#1c1c1e] rounded-t-[32px] overflow-hidden">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-1 bg-white/30 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X size={20} className="text-white" />
              </motion.button>
              
              <h3 className="text-white font-semibold text-lg">Filtros</h3>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleApply}
                className="w-10 h-10 rounded-full bg-[#007AFF] flex items-center justify-center"
              >
                <Check size={20} className="text-white" />
              </motion.button>
            </div>

            {/* Segmented Control */}
            <div className="px-5 pb-4">
              <div className="flex bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => {
                    haptic.light();
                    setShowAdjustments(false);
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    !showAdjustments 
                      ? 'bg-white/10 text-white' 
                      : 'text-white/50'
                  }`}
                >
                  Filtros
                </button>
                <button
                  onClick={() => {
                    haptic.light();
                    setShowAdjustments(true);
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    showAdjustments 
                      ? 'bg-white/10 text-white' 
                      : 'text-white/50'
                  }`}
                >
                  Ajustes
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!showAdjustments ? (
                <motion.div
                  key="filters"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="pb-4"
                >
                  {/* Filter presets carousel */}
                  <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
                    {FILTER_THUMBNAILS.map((filter) => (
                      <motion.button
                        key={filter.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePresetSelect(filter.id)}
                        className="flex-shrink-0 flex flex-col items-center gap-2"
                      >
                        <div
                          className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${filter.gradient} overflow-hidden ${
                            activePreset === filter.id
                              ? 'ring-2 ring-[#007AFF] ring-offset-2 ring-offset-[#1c1c1e]'
                              : ''
                          }`}
                        >
                          {activePreset === filter.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute inset-0 flex items-center justify-center bg-black/30"
                            >
                              <div className="w-6 h-6 rounded-full bg-[#007AFF] flex items-center justify-center">
                                <Check size={14} className="text-white" />
                              </div>
                            </motion.div>
                          )}
                        </div>
                        <span className={`text-xs font-medium ${
                          activePreset === filter.id ? 'text-white' : 'text-white/50'
                        }`}>
                          {filter.name}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="adjustments"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="px-5 pb-4 space-y-6"
                >
                  <IOSSlider
                    label="Brillo"
                    value={filters.brightness}
                    onChange={(v) => handleFilterChange('brightness', v)}
                    icon={Sun}
                  />
                  <IOSSlider
                    label="Contraste"
                    value={filters.contrast}
                    onChange={(v) => handleFilterChange('contrast', v)}
                    icon={Contrast}
                  />
                  <IOSSlider
                    label="Saturación"
                    value={filters.saturation}
                    onChange={(v) => handleFilterChange('saturation', v)}
                    icon={Droplets}
                  />
                  <IOSSlider
                    label="Calidez"
                    value={filters.warmth}
                    onChange={(v) => handleFilterChange('warmth', v)}
                    icon={Aperture}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
