import { motion } from "motion/react";
import { Type, Smile, PenLine, Music, Sparkles, ImagePlus } from "lucide-react";

interface ToolsSidebarProps {
  onOpenText: () => void;
  onOpenStickers: () => void;
  onOpenDrawing: () => void;
  onOpenEffects?: () => void;
  onOpenMusic?: () => void;
  onAddImage?: () => void;
}

export function ToolsSidebar({
  onOpenText,
  onOpenStickers,
  onOpenDrawing,
  onOpenEffects,
  onOpenMusic,
  onAddImage,
}: ToolsSidebarProps) {
  const tools = [
    { icon: Type, label: "Texto", action: onOpenText, active: true },
    { icon: Smile, label: "Stickers", action: onOpenStickers, active: true },
    { icon: PenLine, label: "Dibujar", action: onOpenDrawing, active: true },
    { icon: ImagePlus, label: "Imagen", action: onAddImage, active: !!onAddImage },
    { icon: Sparkles, label: "Efectos", action: onOpenEffects, active: !!onOpenEffects },
    { icon: Music, label: "Música", action: onOpenMusic, active: !!onOpenMusic },
  ].filter(t => t.active);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4"
    >
      {tools.map((tool, index) => (
        <motion.button
          key={tool.label}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={tool.action}
          className="
            w-12 h-12 rounded-full flex items-center justify-center
            bg-black/30 backdrop-blur-md border border-white/10
            active:scale-90 active:bg-white/20 transition-all duration-150
            shadow-lg
          "
          aria-label={tool.label}
        >
          <tool.icon size={22} strokeWidth={2} className="text-white" />
        </motion.button>
      ))}
    </motion.div>
  );
}
