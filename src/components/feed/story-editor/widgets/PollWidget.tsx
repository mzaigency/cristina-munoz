import { useState } from 'react';
import { motion } from 'motion/react';

interface PollWidgetProps {
  question: string;
  options: string[];
  onQuestionChange?: (question: string) => void;
  onOptionsChange?: (options: string[]) => void;
  editable?: boolean;
  style?: 'default' | 'emoji' | 'color';
}

export function PollWidget({
  question,
  options,
  onQuestionChange,
  onOptionsChange,
  editable = false,
  style = 'default',
}: PollWidgetProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Mock results for preview
  const mockResults = options.map(() => Math.floor(Math.random() * 60) + 20);
  const totalVotes = mockResults.reduce((a, b) => a + b, 0);

  const handleVote = (index: number) => {
    if (editable) return;
    setSelectedOption(index);
    setShowResults(true);
  };

  const handleQuestionEdit = (e: React.FocusEvent<HTMLHeadingElement>) => {
    if (editable && onQuestionChange) {
      onQuestionChange(e.target.textContent || question);
    }
  };

  const handleOptionEdit = (index: number, value: string) => {
    if (editable && onOptionsChange) {
      const newOptions = [...options];
      newOptions[index] = value;
      onOptionsChange(newOptions);
    }
  };

  return (
    <div className="w-full max-w-[280px] bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
      {/* Question */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h3
          contentEditable={editable}
          suppressContentEditableWarning
          onBlur={handleQuestionEdit}
          className={`text-gray-900 font-semibold text-base text-center ${
            editable ? 'outline-none focus:ring-2 focus:ring-blue-500 rounded px-1' : ''
          }`}
        >
          {question}
        </h3>
      </div>

      {/* Options */}
      <div className="p-3 space-y-2">
        {options.map((option, index) => {
          const percentage = showResults
            ? Math.round((mockResults[index] / totalVotes) * 100)
            : 0;
          const isSelected = selectedOption === index;

          return (
            <motion.button
              key={index}
              onClick={() => handleVote(index)}
              disabled={showResults && !editable}
              className={`relative w-full rounded-xl overflow-hidden transition-all ${
                editable ? 'cursor-text' : 'cursor-pointer active:scale-98'
              }`}
              whileTap={!editable && !showResults ? { scale: 0.98 } : {}}
            >
              {/* Background fill for results */}
              {showResults && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`absolute inset-0 ${
                    isSelected ? 'bg-blue-500/20' : 'bg-gray-100'
                  }`}
                />
              )}

              <div
                className={`relative flex items-center justify-between px-4 py-3 ${
                  !showResults ? 'bg-gray-50 hover:bg-gray-100' : ''
                } border ${
                  isSelected ? 'border-blue-500' : 'border-gray-200'
                } rounded-xl`}
              >
                {editable ? (
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionEdit(index, e.target.value)}
                    className="flex-1 text-gray-800 text-sm font-medium bg-transparent outline-none"
                  />
                ) : (
                  <span className="text-gray-800 text-sm font-medium">{option}</span>
                )}

                {showResults && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-600 text-sm font-semibold ml-2"
                  >
                    {percentage}%
                  </motion.span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
