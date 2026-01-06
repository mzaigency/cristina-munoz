import { 
  MousePointer2, 
  Type, 
  Shapes, 
  Smile, 
  Pencil, 
  Sparkles, 
  Image, 
  BarChart3 
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEditorStore } from '../store/useEditorStore';
import type { ToolType } from '../store/types';

const TOOLS: { id: ToolType; icon: React.ElementType; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Seleccionar' },
  { id: 'text', icon: Type, label: 'Texto' },
  { id: 'shapes', icon: Shapes, label: 'Formas' },
  { id: 'stickers', icon: Smile, label: 'Stickers' },
  { id: 'draw', icon: Pencil, label: 'Dibujar' },
  { id: 'filters', icon: Sparkles, label: 'Filtros' },
  { id: 'media', icon: Image, label: 'Media' },
  { id: 'widgets', icon: BarChart3, label: 'Widgets' },
];

export function BottomToolbar() {
  const { activeTool, setActiveTool } = useEditorStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
        paddingTop: '20px',
        paddingLeft: 'max(env(safe-area-inset-left), 8px)',
        paddingRight: 'max(env(safe-area-inset-right), 8px)',
      }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-90"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  isActive 
                    ? 'bg-white text-black' 
                    : 'bg-white/10 text-white'
                }`}
              >
                <Icon size={22} />
              </div>
              <span 
                className={`text-[10px] font-medium ${
                  isActive ? 'text-white' : 'text-white/60'
                }`}
              >
                {tool.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
