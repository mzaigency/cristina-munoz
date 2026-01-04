import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const EMOJI_OPTIONS = ["😍", "🔥", "💯", "❤️", "😂", "🎉", "✨", "👏", "🙌", "💪"];

interface EmojiSliderWidgetProps {
  config: {
    question: string;
    emoji: string;
  };
  onConfigChange: (config: { question: string; emoji: string }) => void;
  isEditing: boolean;
  onSlide?: (value: number) => void;
  averageValue?: number;
  responseCount?: number;
  userValue?: number | null;
}

export function EmojiSliderWidget({
  config,
  onConfigChange,
  isEditing,
  onSlide,
  averageValue = 50,
  responseCount = 0,
  userValue = null,
}: EmojiSliderWidgetProps) {
  const [localValue, setLocalValue] = useState(userValue ?? 50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const hasVoted = userValue !== null;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (hasVoted || isEditing) return;
    setIsDragging(true);
    updateValue(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateValue(e);
  };

  const handlePointerUp = () => {
    if (isDragging && !hasVoted) {
      onSlide?.(localValue);
    }
    setIsDragging(false);
  };

  const updateValue = (e: React.PointerEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setLocalValue(Math.round(percentage));
  };

  const displayValue = hasVoted ? averageValue : localValue;

  if (isEditing) {
    return (
      <div className="bg-background/95 backdrop-blur-sm rounded-2xl p-4 w-72 shadow-xl border border-border/50">
        <Input
          value={config.question}
          onChange={(e) => onConfigChange({ ...config, question: e.target.value })}
          placeholder="¿Cuánto te gusta...?"
          className="text-center font-semibold mb-4 border-none bg-muted/50"
        />
        
        <div className="flex flex-wrap gap-2 justify-center">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onConfigChange({ ...config, emoji })}
              className={cn(
                "text-2xl p-2 rounded-lg transition-all",
                config.emoji === emoji 
                  ? "bg-primary/20 scale-110" 
                  : "hover:bg-muted/50"
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className="bg-background/95 backdrop-blur-sm rounded-2xl p-4 w-72 shadow-xl border border-border/50">
      <p className="text-center font-semibold mb-4 text-foreground">
        {config.question || "¿Cuánto te gusta?"}
      </p>
      
      <div className="relative">
        {/* Track */}
        <div
          ref={sliderRef}
          className={cn(
            "h-10 rounded-full relative overflow-hidden cursor-pointer",
            hasVoted ? "cursor-default" : "active:cursor-grabbing"
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-muted via-primary/30 to-primary rounded-full" />
          
          {/* Fill */}
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/50 to-primary rounded-full transition-all duration-75"
            style={{ width: `${displayValue}%` }}
          />
          
          {/* Emoji indicator */}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-3xl transition-all select-none",
              isDragging && "scale-125"
            )}
            style={{ left: `${displayValue}%` }}
          >
            <span className="drop-shadow-lg">{config.emoji || "❤️"}</span>
          </div>
        </div>
        
        {/* Labels */}
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
      
      {hasVoted && (
        <div className="text-center mt-3">
          <p className="text-sm text-muted-foreground">
            Promedio: <span className="font-bold text-foreground">{Math.round(averageValue)}%</span>
          </p>
          {responseCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {responseCount} {responseCount === 1 ? "respuesta" : "respuestas"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
