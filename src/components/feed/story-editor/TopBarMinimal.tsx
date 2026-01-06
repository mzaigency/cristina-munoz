import { motion } from "motion/react";
import { X, Download, MoreVertical } from "lucide-react";

interface TopBarMinimalProps {
  onClose: () => void;
  onDownload?: () => void;
  onMore?: () => void;
  isDownloading?: boolean;
}

export function TopBarMinimal({
  onClose,
  onDownload,
  onMore,
  isDownloading = false,
}: TopBarMinimalProps) {
  const buttonClass = `
    w-11 h-11 rounded-full flex items-center justify-center
    bg-black/30 backdrop-blur-md border border-white/10
    active:scale-90 active:bg-white/20 transition-all duration-150
  `;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
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

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {onDownload && (
          <button 
            onClick={onDownload} 
            className={buttonClass} 
            aria-label="Descargar"
            disabled={isDownloading}
          >
            <Download size={20} className={isDownloading ? "text-white/50" : "text-white"} />
          </button>
        )}
        
        {onMore && (
          <button onClick={onMore} className={buttonClass} aria-label="Más opciones">
            <MoreVertical size={20} className="text-white" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
