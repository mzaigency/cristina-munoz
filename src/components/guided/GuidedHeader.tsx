import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GuidedHeaderProps {
  step: number;
  totalSteps: number;
  title: string;
  onExit: () => void;
  exitLabel?: string;
  className?: string;
}

export const GuidedHeader = ({
  step,
  totalSteps,
  title,
  onExit,
  exitLabel = "Salir",
  className,
}: GuidedHeaderProps) => {
  const progress = Math.round((step / totalSteps) * 100);

  return (
    <div
      className={cn(
        "sticky top-0 z-30 -mx-6 -mt-6 mb-6 px-6 pt-4 pb-3 bg-background/85 backdrop-blur-md border-b border-border",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onExit}
          aria-label={exitLabel}
          className="h-10 px-3 text-sm font-medium gap-1.5 hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-5 w-5" />
          <span>{exitLabel}</span>
        </Button>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            Paso {step} de {totalSteps}
          </p>
          <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
        </div>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
