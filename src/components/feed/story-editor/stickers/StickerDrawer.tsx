import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Smile, MessageSquare, BarChart3, HelpCircle, Clock, Hash, MapPin, Link2, Sparkles } from "lucide-react";

interface StickerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  onSelectWidget: (type: string, config?: any) => void;
}

type Category = "popular" | "emoji" | "interactive" | "info";

const EMOJI_POPULAR = ["🔥", "❤️", "😍", "😂", "🙌", "💯", "✨", "🎉", "💕", "🥰", "😊", "💪"];
const EMOJI_FACES = ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😜", "🤪", "😝"];
const EMOJI_GESTURES = ["👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "🤲", "🤝", "🙏"];
const EMOJI_SYMBOLS = ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "⭐", "🌟", "✨", "💫", "🔥", "💥", "🎉"];

const INTERACTIVE_WIDGETS = [
  { id: "poll", name: "Encuesta", icon: BarChart3, color: "bg-purple-500" },
  { id: "question", name: "Pregunta", icon: MessageSquare, color: "bg-pink-500" },
  { id: "quiz", name: "Quiz", icon: HelpCircle, color: "bg-orange-500" },
  { id: "countdown", name: "Cuenta atrás", icon: Clock, color: "bg-blue-500" },
  { id: "slider", name: "Emoji Slider", icon: Sparkles, color: "bg-yellow-500" },
];

const INFO_WIDGETS = [
  { id: "mention", name: "Mención", icon: Hash, iconText: "@", color: "bg-green-500" },
  { id: "hashtag", name: "Hashtag", icon: Hash, color: "bg-teal-500" },
  { id: "location", name: "Ubicación", icon: MapPin, color: "bg-red-500" },
  { id: "link", name: "Enlace", icon: Link2, color: "bg-indigo-500" },
];

const CATEGORIES: { id: Category; name: string; icon: React.ComponentType<any> }[] = [
  { id: "popular", name: "Popular", icon: Sparkles },
  { id: "emoji", name: "Emojis", icon: Smile },
  { id: "interactive", name: "Interactivo", icon: BarChart3 },
  { id: "info", name: "Info", icon: Hash },
];

export function StickerDrawer({ isOpen, onClose, onSelectEmoji, onSelectWidget }: StickerDrawerProps) {
  const [activeCategory, setActiveCategory] = useState<Category>("popular");
  const [emojiSubCategory, setEmojiSubCategory] = useState<"faces" | "gestures" | "symbols">("faces");

  const handleSelectEmoji = (emoji: string) => {
    onSelectEmoji(emoji);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleSelectWidget = (widgetId: string) => {
    onSelectWidget(widgetId, { type: widgetId });
    if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90]"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 400 }}
        className="fixed bottom-0 left-0 right-0 z-[100] bg-zinc-900/95 backdrop-blur-xl rounded-t-3xl overflow-hidden"
        style={{ 
          maxHeight: "70vh",
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3">
          <h3 className="text-white font-semibold text-lg">Stickers</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                if (navigator.vibrate) navigator.vibrate(5);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? "bg-white text-black"
                  : "bg-white/10 text-white"
              }`}
            >
              <cat.icon size={16} />
              <span className="text-sm font-medium">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-4 pb-4 overflow-y-auto" style={{ maxHeight: "50vh" }}>
          <AnimatePresence mode="wait">
            {activeCategory === "popular" && (
              <motion.div
                key="popular"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-6 gap-3"
              >
                {EMOJI_POPULAR.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSelectEmoji(emoji)}
                    className="aspect-square flex items-center justify-center text-3xl bg-white/5 rounded-xl active:scale-90 active:bg-white/20 transition-all"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}

            {activeCategory === "emoji" && (
              <motion.div
                key="emoji"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Subcategory tabs */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {[
                    { id: "faces" as const, name: "Caras" },
                    { id: "gestures" as const, name: "Gestos" },
                    { id: "symbols" as const, name: "Símbolos" },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setEmojiSubCategory(sub.id)}
                      className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                        emojiSubCategory === sub.id
                          ? "bg-white/20 text-white"
                          : "bg-white/5 text-white/60"
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-8 gap-2">
                  {(emojiSubCategory === "faces" ? EMOJI_FACES : 
                    emojiSubCategory === "gestures" ? EMOJI_GESTURES : EMOJI_SYMBOLS
                  ).map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSelectEmoji(emoji)}
                      className="aspect-square flex items-center justify-center text-2xl active:scale-90 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {activeCategory === "interactive" && (
              <motion.div
                key="interactive"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-2 gap-3"
              >
                {INTERACTIVE_WIDGETS.map((widget) => (
                  <button
                    key={widget.id}
                    onClick={() => handleSelectWidget(widget.id)}
                    className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl active:scale-95 active:bg-white/10 transition-all"
                  >
                    <div className={`w-10 h-10 rounded-xl ${widget.color} flex items-center justify-center`}>
                      <widget.icon size={20} className="text-white" />
                    </div>
                    <span className="text-white font-medium text-sm">{widget.name}</span>
                  </button>
                ))}
              </motion.div>
            )}

            {activeCategory === "info" && (
              <motion.div
                key="info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-2 gap-3"
              >
                {INFO_WIDGETS.map((widget) => {
                  const IconComponent = widget.icon;
                  return (
                    <button
                      key={widget.id}
                      onClick={() => handleSelectWidget(widget.id)}
                      className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl active:scale-95 active:bg-white/10 transition-all"
                    >
                      <div className={`w-10 h-10 rounded-xl ${widget.color} flex items-center justify-center`}>
                        {widget.iconText ? (
                          <span className="text-lg text-white font-bold">{widget.iconText}</span>
                        ) : (
                          <IconComponent size={20} className="text-white" />
                        )}
                      </div>
                      <span className="text-white font-medium text-sm">{widget.name}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
