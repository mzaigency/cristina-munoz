import { motion, AnimatePresence } from 'motion/react';
import { useEditorStore } from '../store/useEditorStore';
import { BarChart3, MessageCircleQuestion, Clock, SmilePlus } from 'lucide-react';
import type { WidgetType } from '../store/types';

interface WidgetsPanelProps {
  onAddWidget: (widgetType: WidgetType, config: any) => void;
}

const WIDGETS: { id: WidgetType; icon: React.ElementType; label: string; description: string }[] = [
  { id: 'poll', icon: BarChart3, label: 'Encuesta', description: 'Pregunta con opciones' },
  { id: 'question', icon: MessageCircleQuestion, label: 'Pregunta', description: 'Hazme una pregunta' },
  { id: 'countdown', icon: Clock, label: 'Cuenta Atrás', description: 'Contador de tiempo' },
  { id: 'emoji-slider', icon: SmilePlus, label: 'Slider Emoji', description: 'Valoración con emoji' },
];

export function WidgetsPanel({ onAddWidget }: WidgetsPanelProps) {
  const { activePanel, setActivePanel } = useEditorStore();

  const isOpen = activePanel === 'widgets';

  const handleAddWidget = (widgetType: WidgetType) => {
    let config = {};
    
    switch (widgetType) {
      case 'poll':
        config = {
          question: '¿Cuál prefieres?',
          options: ['Opción A', 'Opción B'],
        };
        break;
      case 'question':
        config = {
          question: 'Hazme una pregunta',
          placeholder: 'Escribe tu pregunta...',
        };
        break;
      case 'countdown':
        config = {
          title: 'Evento especial',
          targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        break;
      case 'emoji-slider':
        config = {
          question: '¿Cuánto te gusta?',
          emoji: '😍',
        };
        break;
    }
    
    onAddWidget(widgetType, config);
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
            <h3 className="text-white font-semibold text-center">Widgets Interactivos</h3>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {WIDGETS.map((widget) => {
                const Icon = widget.icon;
                return (
                  <button
                    key={widget.id}
                    onClick={() => handleAddWidget(widget.id)}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Icon size={24} className="text-white" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-medium text-sm">{widget.label}</p>
                      <p className="text-white/50 text-xs mt-0.5">{widget.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
