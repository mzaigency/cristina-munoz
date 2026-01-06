import { useState, useCallback } from "react";
import { motion } from "motion/react";

interface PollStickerProps {
  config: {
    question: string;
    options: string[];
  };
  onUpdate: (config: any) => void;
  isEditing?: boolean;
}

export function PollSticker({ config, onUpdate, isEditing = false }: PollStickerProps) {
  const [question, setQuestion] = useState(config.question || "¿Cuál prefieres?");
  const [options, setOptions] = useState(config.options || ["Sí 👍", "No 👎"]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Simulated results
  const results = [65, 35];

  const handleVote = useCallback((index: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    setShowResults(true);
    if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
  }, [selectedOption]);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl min-w-[200px] max-w-[280px]"
    >
      {/* Question */}
      <div className="px-4 pt-4 pb-2">
        {isEditing ? (
          <input
            type="text"
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              onUpdate({ ...config, question: e.target.value });
            }}
            className="w-full text-center font-semibold text-black bg-transparent border-none outline-none"
            placeholder="Tu pregunta..."
          />
        ) : (
          <p className="text-center font-semibold text-black">{question}</p>
        )}
      </div>

      {/* Options */}
      <div className="p-2 space-y-2">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleVote(index)}
            disabled={selectedOption !== null && !isEditing}
            className={`
              relative w-full py-3 px-4 rounded-xl text-center font-medium
              transition-all duration-300 overflow-hidden
              ${showResults && selectedOption === index 
                ? "bg-gradient-to-r from-primary to-accent text-white" 
                : "bg-gray-100 text-black hover:bg-gray-200 active:scale-[0.98]"
              }
            `}
          >
            {/* Progress bar for results */}
            {showResults && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${results[index]}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`absolute inset-y-0 left-0 ${
                  selectedOption === index 
                    ? "bg-white/20" 
                    : "bg-gray-200"
                }`}
              />
            )}
            
            <span className="relative z-10 flex items-center justify-between">
              <span>{option}</span>
              {showResults && (
                <span className="text-sm opacity-80">{results[index]}%</span>
              )}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
