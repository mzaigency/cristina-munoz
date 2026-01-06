import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface CountdownWidgetProps {
  title: string;
  targetDate: string;
  onTitleChange?: (title: string) => void;
  onDateChange?: (date: string) => void;
  editable?: boolean;
  style?: 'default' | 'minimal';
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownWidget({
  title,
  targetDate,
  onTitleChange,
  onDateChange,
  editable = false,
  style = 'default',
}: CountdownWidgetProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const handleTitleEdit = (e: React.FocusEvent<HTMLHeadingElement>) => {
    if (editable && onTitleChange) {
      onTitleChange(e.target.textContent || title);
    }
  };

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="w-full max-w-[280px] bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
      {/* Title */}
      <div className="px-4 pt-4 pb-2">
        <h3
          contentEditable={editable}
          suppressContentEditableWarning
          onBlur={handleTitleEdit}
          className={`text-white font-bold text-lg text-center ${
            editable ? 'outline-none focus:ring-2 focus:ring-white/50 rounded px-1' : ''
          }`}
        >
          🎉 {title}
        </h3>
      </div>

      {/* Countdown Display */}
      <div className="px-4 pb-4">
        <div className="flex justify-center gap-2">
          {/* Days */}
          <motion.div
            key={`days-${timeLeft.days}`}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[50px]">
              <span className="text-white text-2xl font-bold block text-center">
                {formatNumber(timeLeft.days)}
              </span>
            </div>
            <span className="text-white/70 text-[10px] mt-1 uppercase tracking-wider">Días</span>
          </motion.div>

          <span className="text-white text-2xl font-bold self-start mt-2">:</span>

          {/* Hours */}
          <motion.div
            key={`hours-${timeLeft.hours}`}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[50px]">
              <span className="text-white text-2xl font-bold block text-center">
                {formatNumber(timeLeft.hours)}
              </span>
            </div>
            <span className="text-white/70 text-[10px] mt-1 uppercase tracking-wider">Horas</span>
          </motion.div>

          <span className="text-white text-2xl font-bold self-start mt-2">:</span>

          {/* Minutes */}
          <motion.div
            key={`minutes-${timeLeft.minutes}`}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[50px]">
              <span className="text-white text-2xl font-bold block text-center">
                {formatNumber(timeLeft.minutes)}
              </span>
            </div>
            <span className="text-white/70 text-[10px] mt-1 uppercase tracking-wider">Min</span>
          </motion.div>

          {style === 'default' && (
            <>
              <span className="text-white text-2xl font-bold self-start mt-2">:</span>
              
              {/* Seconds */}
              <motion.div
                key={`seconds-${timeLeft.seconds}`}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center"
              >
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[50px]">
                  <span className="text-white text-2xl font-bold block text-center">
                    {formatNumber(timeLeft.seconds)}
                  </span>
                </div>
                <span className="text-white/70 text-[10px] mt-1 uppercase tracking-wider">Seg</span>
              </motion.div>
            </>
          )}
        </div>

        {/* Date picker for editing */}
        {editable && (
          <div className="mt-3">
            <input
              type="datetime-local"
              value={targetDate.slice(0, 16)}
              onChange={(e) => onDateChange?.(new Date(e.target.value).toISOString())}
              className="w-full bg-white/20 text-white text-sm rounded-lg px-3 py-2 outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
