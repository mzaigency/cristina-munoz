import { X, Undo2, Redo2, Download, Send, Layers, Grid3X3 } from 'lucide-react';
import { motion } from 'motion/react';
import { useEditorStore } from '../store/useEditorStore';
import { useHaptic } from '@/hooks/useHaptic';

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
  const haptic = useHaptic();

  const handleUndo = () => {
    if (canUndo()) {
      haptic.light();
      undo();
    }
  };

  const handleRedo = () => {
    if (canRedo()) {
      haptic.light();
      redo();
    }
  };

  const handleClose = () => {
    haptic.light();
    onClose();
  };

  const handlePublish = () => {
    haptic.medium();
    onPublish();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 12px)',
        paddingBottom: '12px',
      }}
    >
      {/* iOS blur background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-transparent pointer-events-none" />

      {/* Left side - Close */}
      <div className="relative flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleClose}
          className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center"
        >
          <X size={22} className="text-white" strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* Center - Undo/Redo (iOS style pill) */}
      <div className="relative flex items-center bg-black/50 backdrop-blur-xl rounded-full border border-white/10 p-1">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleUndo}
          disabled={!canUndo()}
          className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity"
        >
          <Undo2 size={20} className="text-white" />
        </motion.button>
        
        <div className="w-px h-5 bg-white/20" />
        
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleRedo}
          disabled={!canRedo()}
          className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity"
        >
          <Redo2 size={20} className="text-white" />
        </motion.button>
      </div>

      {/* Right side - Actions */}
      <div className="relative flex items-center gap-2">
        {/* Toggle safe zones */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            haptic.light();
            toggleSafeZones();
          }}
          className={`w-10 h-10 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all ${
            showSafeZones 
              ? 'bg-white/20 border-white/30' 
              : 'bg-black/50 border-white/10'
          }`}
        >
          <Grid3X3 size={18} className="text-white" />
        </motion.button>

        {/* Layers panel */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            haptic.light();
            setActivePanel(activePanel === 'layers' ? 'none' : 'layers');
          }}
          className={`w-10 h-10 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all ${
            activePanel === 'layers' 
              ? 'bg-white/20 border-white/30' 
              : 'bg-black/50 border-white/10'
          }`}
        >
          <Layers size={18} className="text-white" />
        </motion.button>

        {/* Download */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            haptic.light();
            onDownload();
          }}
          className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center"
        >
          <Download size={18} className="text-white" />
        </motion.button>

        {/* Publish - iOS style prominent button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handlePublish}
          disabled={isPublishing}
          className="h-11 px-5 rounded-full bg-white flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-white/20"
        >
          {isPublishing ? (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full" 
            />
          ) : (
            <>
              <Send size={18} className="text-black" />
              <span className="text-black font-semibold text-sm">Publicar</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
