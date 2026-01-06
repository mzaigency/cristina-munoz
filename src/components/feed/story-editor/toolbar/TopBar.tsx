import { X, Undo2, Redo2, Download, Send, Layers, Grid3X3 } from 'lucide-react';
import { motion } from 'motion/react';
import { useEditorStore } from '../store/useEditorStore';

interface TopBarProps {
  onClose: () => void;
  onSave: () => void;
  onDownload: () => void;
  onPublish: () => void;
  isPublishing?: boolean;
}

export function TopBar({ 
  onClose, 
  onSave, 
  onDownload, 
  onPublish,
  isPublishing = false 
}: TopBarProps) {
  const { 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    activePanel,
    setActivePanel,
    showSafeZones,
    toggleSafeZones,
  } = useEditorStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-3 bg-gradient-to-b from-black/60 via-black/30 to-transparent"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 12px)',
        paddingBottom: '16px',
      }}
    >
      {/* Left side - Close */}
      <div className="flex items-center gap-2">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
        >
          <X size={22} className="text-white" />
        </button>
      </div>

      {/* Center - Undo/Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
        >
          <Undo2 size={20} className="text-white" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
        >
          <Redo2 size={20} className="text-white" />
        </button>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Toggle safe zones */}
        <button
          onClick={toggleSafeZones}
          className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center active:scale-90 transition-all ${
            showSafeZones ? 'bg-white/20' : 'bg-black/40'
          }`}
        >
          <Grid3X3 size={18} className="text-white" />
        </button>

        {/* Layers panel */}
        <button
          onClick={() => setActivePanel(activePanel === 'layers' ? 'none' : 'layers')}
          className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center active:scale-90 transition-all ${
            activePanel === 'layers' ? 'bg-white/20' : 'bg-black/40'
          }`}
        >
          <Layers size={18} className="text-white" />
        </button>

        {/* Download */}
        <button
          onClick={onDownload}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
        >
          <Download size={18} className="text-white" />
        </button>

        {/* Publish */}
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="h-10 px-5 rounded-full bg-white flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
        >
          {isPublishing ? (
            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <Send size={18} className="text-black" />
              <span className="text-black font-semibold text-sm">Publicar</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
