import { 
  MousePointer2, 
  Type, 
  Shapes, 
  Smile, 
  Sparkles, 
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEditorStore } from '../store/useEditorStore';
import { useHaptic } from '@/hooks/useHaptic';
import type { ToolType } from '../store/types';

const TOOLS: { id: ToolType; icon: React.ElementType; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Seleccionar' },
  { id: 'text', icon: Type, label: 'Texto' },
  { id: 'shapes', icon: Shapes, label: 'Formas' },
  { id: 'stickers', icon: Smile, label: 'Stickers' },
  { id: 'filters', icon: Sparkles, label: 'Filtros' },
];

export function BottomToolbar() {
  const { activeTool, setActiveTool, activePanel } = useEditorStore();
  const haptic = useHaptic();
  
  // Hide toolbar when a panel is open
  const isHidden = activePanel !== 'none';

  const handleToolPress = (toolId: ToolType) => {
    haptic.light();
    setActiveTool(toolId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isHidden ? 0 : 1, 
        y: isHidden ? 20 : 0,
        pointerEvents: isHidden ? 'none' : 'auto',
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="absolute bottom-0 left-0 right-0 z-50"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
        paddingTop: '16px',
        paddingLeft: 'max(env(safe-area-inset-left), 12px)',
        paddingRight: 'max(env(safe-area-inset-right), 12px)',
      }}
    >
      {/* iOS-style blur background */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />
      
      <div className="relative flex items-center justify-around max-w-sm mx-auto">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          
          return (
            <motion.button
              key={tool.id}
              onTouchStart={() => handleToolPress(tool.id)}
              onClick={() => handleToolPress(tool.id)}
              whileTap={{ scale: 0.9 }}
              className="relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors"
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeToolIndicator"
                  className="absolute inset-0 bg-white/15 rounded-2xl"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              
              <motion.div
                animate={{ 
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isActive 
                    ? 'bg-white text-black shadow-lg shadow-white/20' 
                    : 'text-white/80'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              
              <span 
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-white/50'
                }`}
              >
                {tool.label}
              </span>
            </motion.button>
          );
        })}
      </div>
      
      {/* Home indicator placeholder for iOS */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-32 h-1 bg-white/20 rounded-full" />
      </div>
    </motion.div>
  );
}
