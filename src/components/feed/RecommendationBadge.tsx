import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

interface RecommendationBadgeProps {
  score: number;
  reasons?: string[];
  compact?: boolean;
}

export function RecommendationBadge({ score, reasons, compact = false }: RecommendationBadgeProps) {
  // Only show badge for high scores
  if (score < 40) return null;

  const isHighMatch = score >= 70;
  
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`
          inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
          ${isHighMatch 
            ? 'bg-primary/20 text-primary' 
            : 'bg-muted text-muted-foreground'
          }
        `}
      >
        <Sparkles className="w-3 h-3" />
        <span>Para ti</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-1"
    >
      <div className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        ${isHighMatch 
          ? 'bg-primary/20 text-primary' 
          : 'bg-muted text-muted-foreground'
        }
      `}>
        <Sparkles className="w-3.5 h-3.5" />
        <span>Para ti</span>
        {isHighMatch && (
          <span className="text-[10px] opacity-70">({Math.round(score)}%)</span>
        )}
      </div>
      
      {reasons && reasons.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {reasons.map((reason, i) => (
            <span 
              key={i}
              className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded"
            >
              {reason}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
