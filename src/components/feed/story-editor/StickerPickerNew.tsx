import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search } from "lucide-react";

interface StickerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (sticker: string) => void;
}

const EMOJI_CATEGORIES = {
  "Populares": ["😊", "❤️", "🔥", "✨", "💯", "👏", "🎉", "💪", "😍", "🙌"],
  "Caras": ["😀", "😂", "🥰", "😎", "🤩", "😇", "🥳", "😋", "🤔", "😴"],
  "Gestos": ["👍", "👎", "✌️", "🤞", "👌", "🤙", "💅", "🙏", "👋", "🤝"],
  "Corazones": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💕", "💖"],
  "Naturaleza": ["🌸", "🌺", "🌻", "🌹", "🌈", "☀️", "⭐", "🌙", "💫", "🍀"],
  "Comida": ["☕", "🍕", "🍔", "🍩", "🍰", "🍷", "🍾", "🥂", "🧁", "🍦"],
  "Objetos": ["💄", "💋", "👑", "💎", "💍", "🎀", "🎁", "📷", "🎵", "💐"],
};

export function StickerPicker({ isOpen, onClose, onSelect }: StickerPickerProps) {
  const [activeCategory, setActiveCategory] = useState("Populares");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelect = (sticker: string) => {
    onSelect(sticker);
    if (navigator.vibrate) navigator.vibrate(10);
    // Don't close - let user add multiple
  };

  if (!isOpen) return null;

  const emojis = EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES] || [];

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-[100] bg-zinc-900 rounded-t-3xl max-h-[60vh] flex flex-col"
    >
      {/* Handle */}
      <div className="flex justify-center py-3">
        <div className="w-10 h-1 bg-white/20 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-3">
        <h3 className="text-lg font-semibold text-white">Stickers</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X size={18} className="text-white" />
        </button>
      </div>

      {/* Category tabs */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`
                flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                ${activeCategory === category 
                  ? "bg-white text-black" 
                  : "bg-white/10 text-white/70"
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Emoji grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="grid grid-cols-5 gap-3">
          {emojis.map((emoji, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(emoji)}
              className="aspect-square flex items-center justify-center text-4xl rounded-2xl bg-white/5 active:bg-white/20 active:scale-90 transition-all"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
