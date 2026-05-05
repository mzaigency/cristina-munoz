import { ReactNode } from "react";
import { ChevronRight, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuidedHelperBarProps {
  helperText: ReactNode;
  className?: string;
  /** Optional secondary CTA shown to the right (e.g., "Continuar"). */
  action?: ReactNode;
}

/**
 * Sticky helper bar at the bottom of a flow that always tells the user
 * what to do next. Sits above iOS safe-area.
 */
export const GuidedHelperBar = ({ helperText, action, className }: GuidedHelperBarProps) => {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-30 -mx-6 mt-6 px-6 py-3 bg-background/95 backdrop-blur-md border-t border-border",
        "flex items-center gap-3",
        className
      )}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      role="status"
      aria-live="polite"
    >
      <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <HelpCircle className="h-5 w-5" />
      </div>
      <div className="flex-1 text-sm text-foreground leading-snug">
        <span className="font-medium">{helperText}</span>
      </div>
      {action && (
        <div className="shrink-0 flex items-center gap-1 text-primary">
          {action}
          <ChevronRight className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};
