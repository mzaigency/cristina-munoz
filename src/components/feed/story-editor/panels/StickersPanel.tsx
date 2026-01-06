import { motion, AnimatePresence } from 'motion/react';
import { useEditorStore } from '../store/useEditorStore';
import { POPULAR_EMOJIS } from '../utils/constants';

interface StickersPanelProps {
  onAddSticker: (emoji: string) => void;
}

export function StickersPanel({ onAddSticker }: StickersPanelProps) {
  const { activePanel, setActivePanel } = useEditorStore();

  const isOpen = activePanel === 'stickers';

  const handleAddSticker = (emoji: string) => {
    onAddSticker(emoji);
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
            <h3 className="text-white font-semibold text-center">Stickers & Emojis</h3>
          </div>

          <div className="p-4 max-h-[40vh] overflow-y-auto">
            {/* Emojis Grid */}
            <div className="grid grid-cols-8 gap-2">
              {POPULAR_EMOJIS.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleAddSticker(emoji)}
                  className="w-12 h-12 flex items-center justify-center text-2xl rounded-xl bg-white/5 hover:bg-white/10 active:scale-90 transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
