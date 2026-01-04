import { Button } from "@/components/ui/button";
import { BarChart3, MessageCircle, Smile, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type WidgetType = "poll" | "question" | "emoji_slider";

interface WidgetPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWidget: (type: WidgetType) => void;
}

const widgets = [
  {
    type: "poll" as WidgetType,
    icon: BarChart3,
    label: "Encuesta",
    description: "Crea una votación con opciones",
    color: "from-violet-500 to-purple-600",
  },
  {
    type: "question" as WidgetType,
    icon: MessageCircle,
    label: "Preguntas",
    description: "Recibe respuestas de texto",
    color: "from-pink-500 to-rose-600",
  },
  {
    type: "emoji_slider" as WidgetType,
    icon: Smile,
    label: "Slider Emoji",
    description: "Mide reacciones con emojis",
    color: "from-amber-500 to-orange-600",
  },
];

export function WidgetPicker({ isOpen, onClose, onSelectWidget }: WidgetPickerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="bg-background rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Añadir Widget</h3>
              <Button size="icon" variant="ghost" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {widgets.map((widget) => {
                const Icon = widget.icon;
                return (
                  <motion.button
                    key={widget.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSelectWidget(widget.type);
                      onClose();
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors text-left"
                  >
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${widget.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{widget.label}</p>
                      <p className="text-sm text-muted-foreground">{widget.description}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
