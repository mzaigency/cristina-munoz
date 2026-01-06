import { motion, AnimatePresence } from 'motion/react';
import { useEditorStore } from '../store/useEditorStore';
import { POPULAR_EMOJIS } from '../utils/constants';
import { X } from 'lucide-react';
import { useHaptic } from '@/hooks/useHaptic';

interface StickersPanelProps {
  onAddSticker: (emoji: string) => void;
}

const EMOJI_CATEGORIES = [
  { id: 'faces', label: '😊', emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😋', '😛', '😜', '🤪'] },
  { id: 'gestures', label: '👋', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎'] },
  { id: 'hearts', label: '❤️', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'] },
  { id: 'fire', label: '🔥', emojis: ['🔥', '⭐', '✨', '💫', '🌟', '⚡', '💥', '💢', '💦', '💨', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '🎯', '🎪'] },
  { id: 'nature', label: '🌸', emojis: ['🌸', '💐', '🌷', '🌹', '🥀', '🌺', '🌻', '🌼', '🌱', '🌲', '🌳', '🌴', '🌵', '🍀', '☀️', '🌙', '⭐', '🌈', '☁️', '❄️'] },
];

export function StickersPanel({ onAddSticker }: StickersPanelProps) {
  const { activePanel, setActivePanel } = useEditorStore();
  const haptic = useHaptic();

  const isOpen = activePanel === 'stickers';

  const handleAddSticker = (emoji: string) => {
    haptic.medium();
    onAddSticker(emoji);
    setActivePanel('none');
  };

  const handleClose = () => {
    haptic.light();
    setActivePanel('none');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-40"
      >
        {/* Backdrop */}
        <motion.div 
          className="absolute inset-0 bg-black/40"
          onClick={handleClose}
        />
        
        {/* Panel */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="absolute bottom-0 left-0 right-0"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
          }}
        >
          <div className="bg-[#1c1c1e] rounded-t-[32px] overflow-hidden">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-1 bg-white/30 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X size={20} className="text-white" />
              </motion.button>
              
              <h3 className="text-white font-semibold text-lg">Stickers</h3>
              
              <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 px-5 pb-4 overflow-x-auto scrollbar-hide">
              {EMOJI_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl"
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Emojis Grid */}
            <div className="px-5 pb-6 max-h-[40vh] overflow-y-auto">
              <div className="grid grid-cols-7 gap-2">
                {POPULAR_EMOJIS.map((emoji, index) => (
                  <motion.button
                    key={index}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleAddSticker(emoji)}
                    className="aspect-square flex items-center justify-center text-3xl rounded-xl bg-white/5 active:bg-white/15 transition-colors"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
