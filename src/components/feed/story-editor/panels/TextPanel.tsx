import { motion, AnimatePresence } from 'motion/react';
import { useEditorStore } from '../store/useEditorStore';
import { FONTS, FONT_WEIGHTS, TEXT_COLORS } from '../utils/constants';
import { loadFont } from '../utils/fontLoader';
import { Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useHaptic } from '@/hooks/useHaptic';

interface TextPanelProps {
  onAddText: (text: string, options: any) => void;
}

export function TextPanel({ onAddText }: TextPanelProps) {
  const { activePanel, setActivePanel, getSelectedElement, updateElement } = useEditorStore();
  const haptic = useHaptic();
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [selectedWeight, setSelectedWeight] = useState(600);
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [backgroundColor, setBackgroundColor] = useState<'none' | 'solid' | 'translucent'>('none');
  const [showFontPicker, setShowFontPicker] = useState(false);

  const isOpen = activePanel === 'text';
  const selectedElement = getSelectedElement();
  const isEditingText = selectedElement?.type === 'text';

  useEffect(() => {
    loadFont(selectedFont);
  }, [selectedFont]);

  useEffect(() => {
    if (isEditingText && selectedElement?.properties) {
      setSelectedFont(selectedElement.properties.fontFamily || 'Inter');
      setSelectedWeight(selectedElement.properties.fontWeight || 600);
      setSelectedColor(selectedElement.properties.fill || '#FFFFFF');
      setBackgroundColor(selectedElement.properties.backgroundColor || 'none');
    }
  }, [isEditingText, selectedElement]);

  const handleAddText = () => {
    haptic.success();
    onAddText('Escribe aquí', {
      fontFamily: selectedFont,
      fontWeight: selectedWeight,
      fill: selectedColor,
      backgroundColor,
    });
    setActivePanel('none');
  };

  const handleClose = () => {
    haptic.light();
    setActivePanel('none');
  };

  const updateTextProperty = (property: string, value: any) => {
    if (selectedElement) {
      updateElement(selectedElement.id, {
        properties: {
          ...selectedElement.properties,
          [property]: value,
        },
      });
    }
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
              
              <h3 className="text-white font-semibold text-lg">
                {isEditingText ? 'Editar Texto' : 'Añadir Texto'}
              </h3>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddText}
                className="w-10 h-10 rounded-full bg-[#007AFF] flex items-center justify-center"
              >
                <Check size={20} className="text-white" />
              </motion.button>
            </div>

            <div className="px-5 pb-6 space-y-6 max-h-[55vh] overflow-y-auto">
              {/* Font Selector */}
              <div>
                <label className="text-white/50 text-xs font-medium mb-3 block uppercase tracking-wide">Fuente</label>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
                  {FONTS.slice(0, 10).map((font) => (
                    <motion.button
                      key={font.name}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        haptic.light();
                        setSelectedFont(font.name);
                        if (isEditingText) updateTextProperty('fontFamily', font.name);
                      }}
                      className={`flex-shrink-0 px-4 py-3 rounded-xl transition-all ${
                        selectedFont === font.name
                          ? 'bg-white text-black'
                          : 'bg-white/10 text-white'
                      }`}
                      style={{ fontFamily: font.name }}
                    >
                      <span className="text-sm font-medium">{font.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Font Weight */}
              <div>
                <label className="text-white/50 text-xs font-medium mb-3 block uppercase tracking-wide">Peso</label>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
                  {FONT_WEIGHTS.map((weight) => (
                    <motion.button
                      key={weight.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        haptic.selection();
                        setSelectedWeight(weight.value);
                        if (isEditingText) updateTextProperty('fontWeight', weight.value);
                      }}
                      className={`flex-shrink-0 px-5 py-3 rounded-xl text-sm transition-all ${
                        selectedWeight === weight.value
                          ? 'bg-white text-black'
                          : 'bg-white/10 text-white'
                      }`}
                      style={{ fontWeight: weight.value }}
                    >
                      {weight.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="text-white/50 text-xs font-medium mb-3 block uppercase tracking-wide">Color</label>
                <div className="flex gap-3 flex-wrap">
                  {TEXT_COLORS.map((color) => (
                    <motion.button
                      key={color.value}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        haptic.light();
                        setSelectedColor(color.value);
                        if (isEditingText) updateTextProperty('fill', color.value);
                      }}
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                        selectedColor === color.value 
                          ? 'ring-2 ring-[#007AFF] ring-offset-2 ring-offset-[#1c1c1e]' 
                          : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                    >
                      {selectedColor === color.value && (
                        <Check size={18} className={color.value === '#FFFFFF' ? 'text-black' : 'text-white'} />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Background Style */}
              <div>
                <label className="text-white/50 text-xs font-medium mb-3 block uppercase tracking-wide">Fondo</label>
                <div className="flex bg-white/5 rounded-xl p-1">
                  {[
                    { id: 'none', label: 'Sin fondo' },
                    { id: 'solid', label: 'Sólido' },
                    { id: 'translucent', label: 'Translúcido' },
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => {
                        haptic.light();
                        setBackgroundColor(bg.id as any);
                        if (isEditingText) updateTextProperty('backgroundColor', bg.id);
                      }}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        backgroundColor === bg.id
                          ? 'bg-white/10 text-white'
                          : 'text-white/50'
                      }`}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
