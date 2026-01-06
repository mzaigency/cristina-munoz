import { useState } from 'react';
import { motion } from 'motion/react';

interface EmojiSliderWidgetProps {
  question: string;
  emoji: string;
  onQuestionChange?: (question: string) => void;
  onEmojiChange?: (emoji: string) => void;
  editable?: boolean;
}

const AVAILABLE_EMOJIS = ['😍', '🔥', '❤️', '😂', '😭', '🙌', '💪', '✨'];

export function EmojiSliderWidget({
  question,
  emoji,
  onQuestionChange,
  onEmojiChange,
  editable = false,
}: EmojiSliderWidgetProps) {
  const [sliderValue, setSliderValue] = useState(50);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleQuestionEdit = (e: React.FocusEvent<HTMLHeadingElement>) => {
    if (editable && onQuestionChange) {
      onQuestionChange(e.target.textContent || question);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editable) {
      setSliderValue(Number(e.target.value));
    }
  };

  // Calculate emoji scale based on slider value (0.5 to 2)
  const emojiScale = 0.5 + (sliderValue / 100) * 1.5;

  return (
    <div className="w-full max-w-[280px] bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
      {/* Question */}
      <div className="px-4 pt-4 pb-2">
        <h3
          contentEditable={editable}
          suppressContentEditableWarning
          onBlur={handleQuestionEdit}
          className={`text-white font-semibold text-base text-center ${
            editable ? 'outline-none focus:ring-2 focus:ring-white/50 rounded px-1' : ''
          }`}
        >
          {question}
        </h3>
      </div>

      {/* Slider Area */}
      <div className="px-4 pb-4">
        <div className="relative pt-8 pb-2">
          {/* Animated Emoji */}
          <motion.div
            className="absolute top-0 pointer-events-none"
            style={{
              left: `calc(${sliderValue}% - 16px)`,
            }}
            animate={{
              scale: emojiScale,
              rotate: sliderValue > 70 ? [0, -5, 5, -5, 0] : 0,
            }}
            transition={{
              scale: { type: 'spring', stiffness: 300, damping: 20 },
              rotate: { repeat: sliderValue > 70 ? Infinity : 0, duration: 0.5 },
            }}
          >
            <button
              onClick={() => editable && setShowEmojiPicker(!showEmojiPicker)}
              className={`text-3xl ${editable ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {emoji}
            </button>
          </motion.div>

          {/* Slider Track */}
          <div className="relative h-2 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-white/60 rounded-full"
              initial={{ width: '50%' }}
              animate={{ width: `${sliderValue}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>

          {/* Slider Input */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={handleSliderChange}
            disabled={editable}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-default"
          />
        </div>

        {/* Emoji Picker (for editing) */}
        {editable && showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center gap-2 mt-2 p-2 bg-white/20 rounded-xl"
          >
            {AVAILABLE_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => {
                  onEmojiChange?.(e);
                  setShowEmojiPicker(false);
                }}
                className={`text-2xl p-1 rounded-lg transition-all ${
                  emoji === e ? 'bg-white/30 scale-110' : 'hover:bg-white/20'
                }`}
              >
                {e}
              </button>
            ))}
          </motion.div>
        )}

        {/* Value indicator */}
        <div className="text-center mt-2">
          <span className="text-white/70 text-xs">
            {sliderValue < 30 ? 'Un poco' : sliderValue < 70 ? 'Bastante' : '¡Mucho!'}
          </span>
        </div>
      </div>
    </div>
  );
}
