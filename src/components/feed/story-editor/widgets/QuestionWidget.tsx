import { useState } from 'react';
import { motion } from 'motion/react';
import { Send } from 'lucide-react';

interface QuestionWidgetProps {
  question: string;
  placeholder?: string;
  onQuestionChange?: (question: string) => void;
  editable?: boolean;
  style?: 'default' | 'gradient';
}

export function QuestionWidget({
  question,
  placeholder = 'Escribe tu respuesta...',
  onQuestionChange,
  editable = false,
  style = 'default',
}: QuestionWidgetProps) {
  const [response, setResponse] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (response.trim() && !editable) {
      setSubmitted(true);
    }
  };

  const handleQuestionEdit = (e: React.FocusEvent<HTMLHeadingElement>) => {
    if (editable && onQuestionChange) {
      onQuestionChange(e.target.textContent || question);
    }
  };

  const gradientStyle = style === 'gradient' 
    ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400' 
    : 'bg-white/95';

  const textColor = style === 'gradient' ? 'text-white' : 'text-gray-900';

  return (
    <div className={`w-full max-w-[280px] ${gradientStyle} backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl`}>
      {/* Question Header */}
      <div className={`px-4 py-3 ${style === 'gradient' ? '' : 'border-b border-gray-100'}`}>
        <h3
          contentEditable={editable}
          suppressContentEditableWarning
          onBlur={handleQuestionEdit}
          className={`${textColor} font-semibold text-base text-center ${
            editable ? 'outline-none focus:ring-2 focus:ring-white/50 rounded px-1' : ''
          }`}
        >
          {question}
        </h3>
      </div>

      {/* Response Area */}
      <div className="p-3">
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-center py-4 ${textColor}`}
          >
            <p className="text-sm font-medium">¡Respuesta enviada!</p>
            <p className={`text-xs mt-1 ${style === 'gradient' ? 'text-white/70' : 'text-gray-500'}`}>
              Gracias por participar
            </p>
          </motion.div>
        ) : (
          <div className={`flex items-center gap-2 ${style === 'gradient' ? 'bg-white/20' : 'bg-gray-50'} rounded-xl px-3 py-2`}>
            <input
              type="text"
              value={response}
              onChange={(e) => !editable && setResponse(e.target.value)}
              placeholder={placeholder}
              disabled={editable}
              className={`flex-1 bg-transparent text-sm outline-none ${
                style === 'gradient' ? 'text-white placeholder:text-white/60' : 'text-gray-800 placeholder:text-gray-400'
              }`}
            />
            <button
              onClick={handleSubmit}
              disabled={!response.trim() || editable}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                response.trim() && !editable
                  ? style === 'gradient' 
                    ? 'bg-white text-purple-600' 
                    : 'bg-blue-500 text-white'
                  : style === 'gradient'
                    ? 'bg-white/20 text-white/40'
                    : 'bg-gray-200 text-gray-400'
              }`}
            >
              <Send size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
