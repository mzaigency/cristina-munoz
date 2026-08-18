import { motion } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanUsageBarProps {
  current: number;
  max: number;
  label: string;
  showBadge?: boolean;
  className?: string;
}

export const PlanUsageBar = ({
  current,
  max,
  label,
  showBadge = true,
  className,
}: PlanUsageBarProps) => {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const isAtLimit = current >= max;
  const isNearLimit = percentage >= 80 && !isAtLimit;
  
  // Para planes ilimitados (999)
  const isUnlimited = max >= 999;

  const getBarColor = () => {
    if (isUnlimited) return "bg-primary";
    if (isAtLimit) return "bg-destructive";
    if (isNearLimit) return "bg-[var(--gp-warn)]";
    return "bg-primary";
  };

  const getTextColor = () => {
    if (isUnlimited) return "text-primary";
    if (isAtLimit) return "text-destructive";
    if (isNearLimit) return "text-[var(--gp-warn-ink)] ";
    return "text-muted-foreground";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-medium", getTextColor())}>
            {current}/{isUnlimited ? "∞" : max}
          </span>
          {showBadge && isAtLimit && !isUnlimited && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium"
            >
              <AlertTriangle className="w-3 h-3" />
              Límite
            </motion.span>
          )}
        </div>
      </div>
      
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: isUnlimited ? "30%": `${percentage}%` }} transition={{ duration: 0.5, ease:"easeOut" }}
          className={cn("h-full rounded-full", getBarColor())}
        />
      </div>
      
      {isAtLimit && !isUnlimited && (
        <p className="text-xs text-destructive">
          Has alcanzado el límite de tu plan. Mejora para añadir más.
        </p>
      )}
    </div>
  );
};
