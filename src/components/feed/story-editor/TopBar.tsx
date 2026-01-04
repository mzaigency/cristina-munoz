import { motion } from "motion/react";
import { X, Settings, Download, Smile, PenLine, Type, ImagePlus } from "lucide-react";

interface TopBarProps {
  onClose: () => void;
  onDownload: () => void;
  onOpenStickers: () => void;
  onOpenDrawing: () => void;
  onOpenText: () => void;
  onOpenSettings?: () => void;
  onAddImage?: () => void;
}

export function TopBar({
  onClose,
  onDownload,
  onOpenStickers,
  onOpenDrawing,
  onOpenText,
  onOpenSettings,
  onAddImage,
}: TopBarProps) {
  const buttonClass = `
    w-11 h-11 rounded-full flex items-center justify-center
    bg-black/30 backdrop-blur-md border border-white/10
    active:scale-90 active:bg-white/20 transition-all duration-150
  `;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),16px)] pb-3"
    >
      {/* Left: Close */}
      <button
        onClick={onClose}
        className={buttonClass}
        aria-label="Cerrar"
      >
        <X size={22} strokeWidth={2.5} className="text-white" />
      </button>

      {/* Right: Tools */}
      <div className="flex items-center gap-2">
        {onOpenSettings && (
          <button onClick={onOpenSettings} className={buttonClass} aria-label="Ajustes">
            <Settings size={20} className="text-white" />
          </button>
        )}
        
        <button onClick={onDownload} className={buttonClass} aria-label="Descargar">
          <Download size={20} className="text-white" />
        </button>

        {onAddImage && (
          <button onClick={onAddImage} className={buttonClass} aria-label="Añadir imagen">
            <ImagePlus size={20} className="text-white" />
          </button>
        )}
        
        <button onClick={onOpenStickers} className={buttonClass} aria-label="Stickers">
          <Smile size={20} className="text-white" />
        </button>
        
        <button onClick={onOpenDrawing} className={buttonClass} aria-label="Dibujar">
          <PenLine size={20} className="text-white" />
        </button>
        
        <button onClick={onOpenText} className={buttonClass} aria-label="Texto">
          <Type size={20} strokeWidth={2.5} className="text-white" />
        </button>
      </div>
    </motion.div>
  );
}
