import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Send } from "lucide-react";

interface QuestionStickerProps {
  config: {
    question: string;
    placeholder?: string;
  };
  onUpdate: (config: any) => void;
  isEditing?: boolean;
  onRespond?: (response: string) => void;
}

export function QuestionSticker({ config, onUpdate, isEditing = false, onRespond }: QuestionStickerProps) {
  const [question, setQuestion] = useState(config.question || "Hazme una pregunta");
  const [response, setResponse] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!response.trim()) return;
    setIsSubmitted(true);
    onRespond?.(response);
    if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl overflow-hidden shadow-xl min-w-[220px] max-w-[280px]"
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
            className="w-full text-center font-semibold text-white bg-transparent border-none outline-none placeholder:text-white/60"
            placeholder="Tu pregunta..."
          />
        ) : (
          <p className="text-center font-semibold text-white">{question}</p>
        )}
      </div>

      {/* Response input */}
      <div className="p-3">
        {isSubmitted ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/20 backdrop-blur-sm rounded-xl py-3 px-4 text-center"
          >
            <p className="text-white font-medium">¡Gracias! 💜</p>
          </motion.div>
        ) : (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="flex-1 bg-white/90 rounded-xl py-2.5 px-4 text-black placeholder:text-gray-500 outline-none text-sm"
              placeholder={config.placeholder || "Escribe tu respuesta..."}
            />
            <button
              onClick={handleSubmit}
              disabled={!response.trim()}
              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center disabled:opacity-50"
            >
              <Send size={18} className="text-purple-600" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
