import { motion, AnimatePresence } from 'motion/react';
import { useEditorStore } from '../store/useEditorStore';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown,
  Type,
  Image,
  Square,
  Smile,
  Pencil,
  BarChart3,
  X,
  GripVertical
} from 'lucide-react';
import { useHaptic } from '@/hooks/useHaptic';

const TYPE_ICONS: Record<string, React.ElementType> = {
  text: Type,
  image: Image,
  shape: Square,
  sticker: Smile,
  drawing: Pencil,
  widget: BarChart3,
};

export function LayersPanel() {
  const { 
    activePanel, 
    setActivePanel,
    elements,
    selectedElementId,
    selectElement,
    toggleElementVisibility,
    toggleElementLock,
    deleteElement,
    duplicateElement,
    reorderElement,
  } = useEditorStore();
  const haptic = useHaptic();

  const isOpen = activePanel === 'layers';
  
  // Sort by zIndex descending (top layers first)
  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);

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
          className="absolute inset-0"
          onClick={handleClose}
        />
        
        {/* Panel - Slide from right */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="absolute top-0 right-0 bottom-0 w-72"
          style={{
            paddingTop: 'max(env(safe-area-inset-top), 60px)',
            paddingBottom: 'max(env(safe-area-inset-bottom), 100px)',
            paddingRight: 'env(safe-area-inset-right)',
          }}
        >
          <div className="h-full bg-[#1c1c1e]/95 backdrop-blur-2xl rounded-l-3xl overflow-hidden flex flex-col border-l border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <h3 className="text-white font-semibold">Capas</h3>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X size={16} className="text-white" />
              </motion.button>
            </div>

            {/* Layers List */}
            <div className="flex-1 overflow-y-auto">
              {sortedElements.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-white/40 text-sm">No hay elementos</p>
                  <p className="text-white/30 text-xs mt-1">Añade texto, formas o stickers</p>
                </div>
              ) : (
                <div className="py-2">
                  {sortedElements.map((element, index) => {
                    const Icon = TYPE_ICONS[element.type] || Square;
                    const isSelected = selectedElementId === element.id;
                    
                    return (
                      <motion.div
                        key={element.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`mx-2 mb-1 rounded-xl transition-all ${
                          isSelected 
                            ? 'bg-[#007AFF]/20 border border-[#007AFF]/40' 
                            : 'bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center px-3 py-3">
                          {/* Drag handle */}
                          <GripVertical size={14} className="text-white/30 mr-2 flex-shrink-0" />
                          
                          {/* Type Icon + Name */}
                          <button
                            onClick={() => {
                              haptic.selection();
                              selectElement(element.id);
                            }}
                            className="flex-1 flex items-center gap-2 min-w-0"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isSelected ? 'bg-[#007AFF]' : 'bg-white/10'
                            }`}>
                              <Icon size={16} className="text-white" />
                            </div>
                            <span 
                              className={`text-sm truncate ${
                                element.visible ? 'text-white' : 'text-white/30'
                              } ${element.locked ? 'italic' : ''}`}
                            >
                              {element.name}
                            </span>
                          </button>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1 ml-2">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                haptic.light();
                                toggleElementVisibility(element.id);
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg"
                            >
                              {element.visible ? (
                                <Eye size={14} className="text-white/50" />
                              ) : (
                                <EyeOff size={14} className="text-white/30" />
                              )}
                            </motion.button>

                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                haptic.light();
                                toggleElementLock(element.id);
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg"
                            >
                              {element.locked ? (
                                <Lock size={14} className="text-[#FF9F0A]" />
                              ) : (
                                <Unlock size={14} className="text-white/30" />
                              )}
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions for selected */}
            {selectedElementId && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="p-4 border-t border-white/10 bg-black/30"
              >
                <div className="grid grid-cols-4 gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      haptic.light();
                      reorderElement(selectedElementId, 'up');
                    }}
                    className="h-11 flex flex-col items-center justify-center gap-1 rounded-xl bg-white/10 text-white"
                  >
                    <ChevronUp size={16} />
                    <span className="text-[9px]">Arriba</span>
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      haptic.light();
                      reorderElement(selectedElementId, 'down');
                    }}
                    className="h-11 flex flex-col items-center justify-center gap-1 rounded-xl bg-white/10 text-white"
                  >
                    <ChevronDown size={16} />
                    <span className="text-[9px]">Abajo</span>
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      haptic.medium();
                      duplicateElement(selectedElementId);
                    }}
                    className="h-11 flex flex-col items-center justify-center gap-1 rounded-xl bg-white/10 text-white"
                  >
                    <Copy size={16} />
                    <span className="text-[9px]">Duplicar</span>
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      haptic.warning();
                      deleteElement(selectedElementId);
                    }}
                    className="h-11 flex flex-col items-center justify-center gap-1 rounded-xl bg-red-500/20 text-red-400"
                  >
                    <Trash2 size={16} />
                    <span className="text-[9px]">Eliminar</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
