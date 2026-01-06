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
  BarChart3
} from 'lucide-react';

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

  const isOpen = activePanel === 'layers';
  
  // Sort by zIndex descending (top layers first)
  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="absolute top-20 right-3 bottom-28 z-40 w-64"
        style={{
          marginTop: 'max(env(safe-area-inset-top), 16px)',
          marginBottom: 'max(env(safe-area-inset-bottom), 16px)',
        }}
      >
        <div className="h-full bg-black/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">Capas</h3>
            <span className="text-white/40 text-xs">{elements.length} elementos</span>
          </div>

          {/* Layers List */}
          <div className="flex-1 overflow-y-auto">
            {sortedElements.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-white/40 text-sm">No hay elementos</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {sortedElements.map((element) => {
                  const Icon = TYPE_ICONS[element.type] || Square;
                  const isSelected = selectedElementId === element.id;
                  
                  return (
                    <div
                      key={element.id}
                      className={`px-3 py-2 flex items-center gap-2 transition-all ${
                        isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Type Icon */}
                      <button
                        onClick={() => selectElement(element.id)}
                        className="flex-1 flex items-center gap-2 min-w-0"
                      >
                        <Icon 
                          size={16} 
                          className={element.visible ? 'text-white/60' : 'text-white/20'} 
                        />
                        <span 
                          className={`text-sm truncate ${
                            element.visible ? 'text-white' : 'text-white/30'
                          } ${element.locked ? 'italic' : ''}`}
                        >
                          {element.name}
                        </span>
                      </button>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {/* Visibility */}
                        <button
                          onClick={() => toggleElementVisibility(element.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10"
                        >
                          {element.visible ? (
                            <Eye size={14} className="text-white/60" />
                          ) : (
                            <EyeOff size={14} className="text-white/30" />
                          )}
                        </button>

                        {/* Lock */}
                        <button
                          onClick={() => toggleElementLock(element.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10"
                        >
                          {element.locked ? (
                            <Lock size={14} className="text-yellow-500/80" />
                          ) : (
                            <Unlock size={14} className="text-white/40" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions for selected */}
          {selectedElementId && (
            <div className="p-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                {/* Move up/down */}
                <button
                  onClick={() => reorderElement(selectedElementId, 'up')}
                  className="flex-1 h-9 flex items-center justify-center gap-1 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => reorderElement(selectedElementId, 'down')}
                  className="flex-1 h-9 flex items-center justify-center gap-1 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20"
                >
                  <ChevronDown size={14} />
                </button>
                
                {/* Duplicate */}
                <button
                  onClick={() => duplicateElement(selectedElementId)}
                  className="flex-1 h-9 flex items-center justify-center rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20"
                >
                  <Copy size={14} />
                </button>
                
                {/* Delete */}
                <button
                  onClick={() => deleteElement(selectedElementId)}
                  className="flex-1 h-9 flex items-center justify-center rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
