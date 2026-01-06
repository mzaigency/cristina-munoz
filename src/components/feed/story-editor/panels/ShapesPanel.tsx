import { motion, AnimatePresence } from 'motion/react';
import { useEditorStore } from '../store/useEditorStore';
import { SHAPE_COLORS } from '../utils/constants';
import { Check, Square, Circle, Triangle, Minus } from 'lucide-react';
import { useState } from 'react';
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
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rect');
  const [fillColor, setFillColor] = useState('#FFFFFF');
  const [strokeColor, setStrokeColor] = useState('transparent');
  const [hasStroke, setHasStroke] = useState(false);

  const isOpen = activePanel === 'shapes';

  const handleAddShape = () => {
    onAddShape(selectedShape, {
      fillColor,
      strokeColor: hasStroke ? strokeColor : 'transparent',
      strokeWidth: hasStroke ? 3 : 0,
    });
    setActivePanel('none');
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
            <h3 className="text-white font-semibold text-center">Añadir Forma</h3>
          </div>

          <div className="p-5 space-y-5">
            {/* Shape Type */}
            <div>
              <label className="text-white/60 text-xs font-medium mb-3 block">Tipo</label>
              <div className="grid grid-cols-4 gap-3">
                {SHAPES.map((shape) => {
                  const Icon = shape.icon;
                  return (
                    <button
                      key={shape.id}
                      onClick={() => setSelectedShape(shape.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                        selectedShape === shape.id
                          ? 'bg-white text-black'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      <Icon size={24} />
                      <span className="text-xs font-medium">{shape.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fill Color */}
            <div>
              <label className="text-white/60 text-xs font-medium mb-2 block">Color de Relleno</label>
              <div className="flex gap-2 flex-wrap">
                {SHAPE_COLORS.slice(0, 10).map((color) => (
                  <button
                    key={color}
                    onClick={() => setFillColor(color)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      fillColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {fillColor === color && (
                      <Check size={16} className={color === '#FFFFFF' ? 'text-black' : 'text-white'} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Stroke Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-white/60 text-xs font-medium">Borde</label>
              <button
                onClick={() => setHasStroke(!hasStroke)}
                className={`w-12 h-7 rounded-full transition-all ${
                  hasStroke ? 'bg-white' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black transition-transform ${
                    hasStroke ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Stroke Color (if enabled) */}
            {hasStroke && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
              >
                <label className="text-white/60 text-xs font-medium mb-2 block">Color del Borde</label>
                <div className="flex gap-2 flex-wrap">
                  {SHAPE_COLORS.slice(0, 8).map((color) => (
                    <button
                      key={color}
                      onClick={() => setStrokeColor(color)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        strokeColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {strokeColor === color && (
                        <Check size={16} className={color === '#FFFFFF' ? 'text-black' : 'text-white'} />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Add Button */}
            <button
              onClick={handleAddShape}
              className="w-full py-4 bg-white text-black font-semibold rounded-xl active:scale-98 transition-transform"
            >
              Añadir Forma
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
