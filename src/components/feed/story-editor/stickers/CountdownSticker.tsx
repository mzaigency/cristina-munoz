import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";

interface CountdownStickerProps {
  config: {
    title: string;
    targetDate: string; // ISO string
  };
  onUpdate: (config: any) => void;
  isEditing?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownSticker({ config, onUpdate, isEditing = false }: CountdownStickerProps) {
  const [title, setTitle] = useState(config.title || "Mi evento");
  const [targetDate, setTargetDate] = useState(config.targetDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const calculateTimeLeft = useCallback(() => {
    const difference = new Date(targetDate).getTime() - Date.now();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }, [targetDate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl overflow-hidden shadow-xl min-w-[200px] max-w-[280px] p-4"
    >
      {/* Title */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="text-2xl">🎉</span>
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              onUpdate({ ...config, title: e.target.value });
            }}
            className="flex-1 text-center font-bold text-white bg-transparent border-none outline-none placeholder:text-white/60"
            placeholder="Nombre del evento"
          />
        ) : (
          <p className="font-bold text-white text-center">{title}</p>
        )}
      </div>

      {/* Date picker for editing */}
      {isEditing && (
        <input
          type="datetime-local"
          value={targetDate.slice(0, 16)}
          onChange={(e) => {
            const newDate = new Date(e.target.value).toISOString();
            setTargetDate(newDate);
            onUpdate({ ...config, targetDate: newDate });
          }}
          className="w-full mb-3 px-3 py-2 rounded-lg bg-white/20 text-white text-sm border-none outline-none"
        />
      )}

      {/* Countdown display */}
      {isExpired ? (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-center py-2"
        >
          <p className="text-3xl">🎊</p>
          <p className="text-white font-bold">¡Es hora!</p>
        </motion.div>
      ) : (
        <div className="flex justify-center gap-3">
          {timeLeft.days > 0 && (
            <TimeUnit value={timeLeft.days} label="días" />
          )}
          <TimeUnit value={timeLeft.hours} label="hrs" />
          <TimeUnit value={timeLeft.minutes} label="min" />
          <TimeUnit value={timeLeft.seconds} label="seg" />
        </div>
      )}
    </motion.div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <motion.span
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-2xl font-bold text-white tabular-nums"
      >
        {value.toString().padStart(2, "0")}
      </motion.span>
      <span className="text-xs text-white/70">{label}</span>
    </div>
  );
}
