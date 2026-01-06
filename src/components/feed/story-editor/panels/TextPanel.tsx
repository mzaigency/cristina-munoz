import { motion, AnimatePresence } from 'motion/react';
import { useEditorStore } from '../store/useEditorStore';
import { FONTS, FONT_WEIGHTS, TEXT_COLORS } from '../utils/constants';
import { loadFont } from '../utils/fontLoader';
import { Check, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TextPanelProps {
  onAddText: (text: string, options: any) => void;
}

export function TextPanel({ onAddText }: TextPanelProps) {
  const { activePanel, setActivePanel, getSelectedElement, updateElement } = useEditorStore();
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [selectedWeight, setSelectedWeight] = useState(600);
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [backgroundColor, setBackgroundColor] = useState<'none' | 'solid' | 'translucent'>('none');
  const [showFontPicker, setShowFontPicker] = useState(false);

  const isOpen = activePanel === 'text';
  const selectedElement = getSelectedElement();
  const isEditingText = selectedElement?.type === 'text';

  // Load selected font
  useEffect(() => {
    loadFont(selectedFont);
  }, [selectedFont]);

  // Sync with selected element
  useEffect(() => {
    if (isEditingText && selectedElement?.properties) {
      setSelectedFont(selectedElement.properties.fontFamily || 'Inter');
      setSelectedWeight(selectedElement.properties.fontWeight || 600);
      setSelectedColor(selectedElement.properties.fill || '#FFFFFF');
      setBackgroundColor(selectedElement.properties.backgroundColor || 'none');
    }
  }, [isEditingText, selectedElement]);

  const handleAddText = () => {
    onAddText('Escribe aquí', {
      fontFamily: selectedFont,
      fontWeight: selectedWeight,
      fill: selectedColor,
      backgroundColor,
    });
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
            <h3 className="text-white font-semibold text-center">
              {isEditingText ? 'Editar Texto' : 'Añadir Texto'}
            </h3>
          </div>

          <div className="p-5 space-y-5 max-h-[50vh] overflow-y-auto">
            {/* Font Selector */}
            <div>
              <label className="text-white/60 text-xs font-medium mb-2 block">Fuente</label>
              <button
                onClick={() => setShowFontPicker(!showFontPicker)}
                className="w-full flex items-center justify-between bg-white/10 rounded-xl px-4 py-3"
              >
                <span 
                  className="text-white font-medium"
                  style={{ fontFamily: selectedFont }}
                >
                  {selectedFont}
                </span>
                <ChevronDown size={18} className={`text-white/60 transition-transform ${showFontPicker ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showFontPicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 200, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 bg-white/5 rounded-xl max-h-[200px] overflow-y-auto">
                      {FONTS.map((font) => (
                        <button
                          key={font.name}
                          onClick={() => {
                            setSelectedFont(font.name);
                            if (isEditingText) updateTextProperty('fontFamily', font.name);
                            setShowFontPicker(false);
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5"
                        >
                          <span 
                            className="text-white"
                            style={{ fontFamily: font.name }}
                          >
                            {font.name}
                          </span>
                          {selectedFont === font.name && (
                            <Check size={16} className="text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Font Weight */}
            <div>
              <label className="text-white/60 text-xs font-medium mb-2 block">Peso</label>
              <div className="flex gap-2 flex-wrap">
                {[400, 500, 600, 700, 800].map((weight) => (
                  <button
                    key={weight}
                    onClick={() => {
                      setSelectedWeight(weight);
                      if (isEditingText) updateTextProperty('fontWeight', weight);
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedWeight === weight
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white'
                    }`}
                    style={{ fontWeight: weight }}
                  >
                    {FONT_WEIGHTS.find(w => w.value === weight)?.label || weight}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="text-white/60 text-xs font-medium mb-2 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      setSelectedColor(color.value);
                      if (isEditingText) updateTextProperty('fill', color.value);
                    }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      selectedColor === color.value ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                  >
                    {selectedColor === color.value && (
                      <Check size={16} className={color.value === '#FFFFFF' ? 'text-black' : 'text-white'} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Style */}
            <div>
              <label className="text-white/60 text-xs font-medium mb-2 block">Fondo</label>
              <div className="flex gap-2">
                {[
                  { id: 'none', label: 'Sin fondo' },
                  { id: 'solid', label: 'Sólido' },
                  { id: 'translucent', label: 'Translúcido' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => {
                      setBackgroundColor(bg.id as any);
                      if (isEditingText) updateTextProperty('backgroundColor', bg.id);
                    }}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      backgroundColor === bg.id
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Add button (only when not editing) */}
            {!isEditingText && (
              <button
                onClick={handleAddText}
                className="w-full py-4 bg-white text-black font-semibold rounded-xl active:scale-98 transition-transform"
              >
                Añadir Texto
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
