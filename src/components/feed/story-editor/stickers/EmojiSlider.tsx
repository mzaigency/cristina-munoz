import { useState, useCallback } from "react";
import { motion } from "motion/react";

interface EmojiSliderProps {
  config: {
    question: string;
    emoji: string;
  };
  onUpdate: (config: any) => void;
  isEditing?: boolean;
  onRespond?: (value: number) => void;
}

const EMOJI_OPTIONS = ["😍", "🔥", "😂", "❤️", "🥺", "😭", "🤩", "💀", "👀", "✨"];

export function EmojiSlider({ config, onUpdate, isEditing = false, onRespond }: EmojiSliderProps) {
  const [question, setQuestion] = useState(config.question || "¿Cuánto te gusta?");
  const [emoji, setEmoji] = useState(config.emoji || "😍");
  const [value, setValue] = useState(50);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = useCallback(() => {
    if (isSubmitted) return;
    setIsSubmitted(true);
    onRespond?.(value);
    if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
  }, [isSubmitted, value, onRespond]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setValue(newValue);
    if (navigator.vibrate && newValue % 10 === 0) navigator.vibrate(5);
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl overflow-hidden shadow-xl min-w-[240px] max-w-[300px] p-4"
    >
      {/* Question */}
      <div className="mb-4">
        {isEditing ? (
          <input
            type="text"
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              onUpdate({ ...config, question: e.target.value });
            }}
            className="w-full text-center font-semibold text-white bg-transparent border-none outline-none placeholder:text-white/60"
            placeholder="Tu pregunta..."
          />
        ) : (
          <p className="text-center font-semibold text-white">{question}</p>
        )}
      </div>

      {/* Emoji picker for editing */}
      {isEditing && showEmojiPicker && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap justify-center gap-2 mb-3 bg-white/20 rounded-xl p-2"
        >
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              onClick={() => {
                setEmoji(e);
                onUpdate({ ...config, emoji: e });
                setShowEmojiPicker(false);
              }}
              className={`text-2xl p-1 rounded-lg transition-all ${emoji === e ? "bg-white/30 scale-110" : "hover:bg-white/10"}`}
            >
              {e}
            </button>
          ))}
        </motion.div>
      )}

      {/* Slider track */}
      <div className="relative h-12 bg-white/20 rounded-full overflow-hidden">
        {/* Fill */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-white/30"
          animate={{ width: `${value}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        
        {/* Emoji indicator */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center"
          animate={{ left: `calc(${value}% - 20px)` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <button
            onClick={isEditing ? () => setShowEmojiPicker(!showEmojiPicker) : undefined}
            className="text-4xl select-none"
            style={{ 
              filter: `grayscale(${100 - value}%)`,
              transform: `scale(${0.8 + (value / 250)})`
            }}
          >
            {emoji}
          </button>
        </motion.div>
        
        {/* Hidden range input for interaction */}
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={handleSliderChange}
          onMouseUp={handleSubmit}
          onTouchEnd={handleSubmit}
          disabled={isSubmitted && !isEditing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {/* Result indicator */}
      {isSubmitted && !isEditing && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-white/80 text-sm mt-2"
        >
          ¡Enviado! {Math.round(value)}%
        </motion.p>
      )}
    </motion.div>
  );
}
