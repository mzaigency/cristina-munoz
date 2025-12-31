import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, Sparkles, PartyPopper, Heart, Tag, Users, Coffee, Leaf, Sun, ArrowRight, Hash } from "lucide-react";
import { STICKER_CATEGORIES, StickerCategory } from "@/constants/story-assets";
import { cn } from "@/lib/utils";

interface StickerPickerProps {
  onStickerSelect: (sticker: string) => void;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, PartyPopper, Heart, Tag, Users, Coffee, Leaf, Sun, ArrowRight, Hash
};

export const StickerPicker = ({ onStickerSelect, onClose }: StickerPickerProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("beauty");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentStickers, setRecentStickers] = useState<string[]>([]);

  const handleStickerClick = (sticker: string) => {
    // Añadir a recientes
    setRecentStickers(prev => {
      const updated = [sticker, ...prev.filter(s => s !== sticker)].slice(0, 20);
      return updated;
    });
    
    onStickerSelect(sticker);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  const filteredStickers = searchQuery
    ? STICKER_CATEGORIES.flatMap(cat => cat.stickers).filter(sticker => 
        sticker.includes(searchQuery)
      )
    : STICKER_CATEGORIES.find(cat => cat.id === selectedCategory)?.stickers || [];

  const currentCategory = STICKER_CATEGORIES.find(cat => cat.id === selectedCategory);

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute inset-x-0 bottom-0 h-[70vh] bg-black/95 backdrop-blur-xl rounded-t-3xl z-50 flex flex-col"
    >
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-12 h-1 bg-white/20 rounded-full" />
      </div>

      {/* Header */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <h3 className="text-white font-semibold text-lg">Stickers</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar stickers..."
            className="w-full bg-white/10 border-0 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-white/40 focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Categories */}
      {!searchQuery && (
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {/* Recientes */}
            {recentStickers.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory("recent")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex-shrink-0",
                  selectedCategory === "recent"
                    ? "bg-primary text-white"
                    : "bg-white/10 text-white/70"
                )}
              >
                <span className="text-sm">🕐</span>
                <span className="text-xs font-medium">Recientes</span>
              </motion.button>
            )}
            
            {STICKER_CATEGORIES.map((category) => {
              const IconComponent = CATEGORY_ICONS[category.icon];
              return (
                <motion.button
                  key={category.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex-shrink-0",
                    selectedCategory === category.id
                      ? "bg-primary text-white"
                      : "bg-white/10 text-white/70"
                  )}
                >
                  {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
                  <span className="text-xs font-medium">{category.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Title */}
      {!searchQuery && currentCategory && selectedCategory !== "recent" && (
        <div className="px-4 pb-2">
          <p className="text-white/40 text-xs uppercase tracking-wider">
            {currentCategory.name} ({currentCategory.stickers.length})
          </p>
        </div>
      )}

      {/* Stickers Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-safe">
        <motion.div 
          layout
          className="grid grid-cols-6 gap-2"
        >
          <AnimatePresence mode="popLayout">
            {(selectedCategory === "recent" && !searchQuery ? recentStickers : filteredStickers).map((sticker, index) => (
              <motion.button
                key={`${sticker}-${index}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ delay: index * 0.02 }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleStickerClick(sticker)}
                className="aspect-square flex items-center justify-center text-3xl bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                {sticker}
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredStickers.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center py-12 text-white/40">
            <Search className="w-12 h-12 mb-3 opacity-50" />
            <p>No se encontraron stickers</p>
            <p className="text-sm">Prueba con otra búsqueda</p>
          </div>
        )}
      </div>

      {/* Quick Access Bar */}
      <div className="px-4 py-3 bg-black/50 border-t border-white/10">
        <div className="flex justify-around">
          {["💇‍♀️", "✨", "🔥", "❤️", "📣", "🎉", "💅", "👑"].map((sticker) => (
            <motion.button
              key={sticker}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleStickerClick(sticker)}
              className="text-2xl"
            >
              {sticker}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
