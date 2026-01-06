import { motion, AnimatePresence } from 'motion/react';
import { useEditorStore } from '../store/useEditorStore';
import { SHAPE_COLORS } from '../utils/constants';
import { Check, X, Square, Circle, Triangle, Minus } from 'lucide-react';
import { useState } from 'react';
import { useHaptic } from '@/hooks/useHaptic';
import type { ShapeType } from '../store/types';

interface ShapesPanelProps {
  onAddShape: (shapeType: ShapeType, options: any) => void;
}

const SHAPES: { id: ShapeType; icon: React.ElementType; label: string }[] = [
  { id: 'rect', icon: Square, label: 'Rectángulo' },
  { id: 'circle', icon: Circle, label: 'Círculo' },
  { id: 'triangle', icon: Triangle, label: 'Triángulo' },
  { id: 'line', icon: Minus, label: 'Línea' },
];

export function ShapesPanel({ onAddShape }: ShapesPanelProps) {
  const { activePanel, setActivePanel } = useEditorStore();
  const haptic = useHaptic();
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rect');
  const [fillColor, setFillColor] = useState('#FFFFFF');
  const [strokeColor, setStrokeColor] = useState('transparent');
  const [hasStroke, setHasStroke] = useState(false);

  const isOpen = activePanel === 'shapes';

  const handleAddShape = () => {
    haptic.success();
    onAddShape(selectedShape, {
      fillColor,
      strokeColor: hasStroke ? strokeColor : 'transparent',
      strokeWidth: hasStroke ? 3 : 0,
    });
    setActivePanel('none');
  };

  const handleClose = () => {
    haptic.light();
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
              
              <h3 className="text-white font-semibold text-lg">Formas</h3>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddShape}
                className="w-10 h-10 rounded-full bg-[#007AFF] flex items-center justify-center"
              >
                <Check size={20} className="text-white" />
              </motion.button>
            </div>

            <div className="px-5 pb-6 space-y-6">
              {/* Shape Type */}
              <div>
                <label className="text-white/50 text-xs font-medium mb-3 block uppercase tracking-wide">Tipo</label>
                <div className="grid grid-cols-4 gap-3">
                  {SHAPES.map((shape) => {
                    const Icon = shape.icon;
                    return (
                      <motion.button
                        key={shape.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          haptic.light();
                          setSelectedShape(shape.id);
                        }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${
                          selectedShape === shape.id
                            ? 'bg-white text-black'
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        <Icon size={24} />
                        <span className="text-[10px] font-medium">{shape.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Fill Color */}
              <div>
                <label className="text-white/50 text-xs font-medium mb-3 block uppercase tracking-wide">Color</label>
                <div className="flex gap-3 flex-wrap">
                  {SHAPE_COLORS.slice(0, 10).map((color) => (
                    <motion.button
                      key={color}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        haptic.light();
                        setFillColor(color);
                      }}
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                        fillColor === color 
                          ? 'ring-2 ring-[#007AFF] ring-offset-2 ring-offset-[#1c1c1e]' 
                          : ''
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {fillColor === color && (
                        <Check size={18} className={color === '#FFFFFF' ? 'text-black' : 'text-white'} />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Stroke Toggle - iOS style */}
              <div className="flex items-center justify-between py-2">
                <span className="text-white/80 text-sm font-medium">Borde</span>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    haptic.light();
                    setHasStroke(!hasStroke);
                  }}
                  className={`w-14 h-8 rounded-full transition-colors duration-200 ${
                    hasStroke ? 'bg-[#34C759]' : 'bg-white/20'
                  }`}
                >
                  <motion.div
                    animate={{ x: hasStroke ? 26 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-6 h-6 rounded-full bg-white shadow-sm"
                  />
                </motion.button>
              </div>

              {/* Stroke Color */}
              <AnimatePresence>
                {hasStroke && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <label className="text-white/50 text-xs font-medium mb-3 block uppercase tracking-wide">Color del Borde</label>
                    <div className="flex gap-3 flex-wrap">
                      {SHAPE_COLORS.slice(0, 8).map((color) => (
                        <motion.button
                          key={color}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            haptic.light();
                            setStrokeColor(color);
                          }}
                          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                            strokeColor === color 
                              ? 'ring-2 ring-[#007AFF] ring-offset-2 ring-offset-[#1c1c1e]' 
                              : ''
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          {strokeColor === color && (
                            <Check size={18} className={color === '#FFFFFF' ? 'text-black' : 'text-white'} />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
