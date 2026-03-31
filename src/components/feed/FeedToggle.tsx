import { motion } from "framer-motion";
import { useHaptic } from "@/hooks/useHaptic";
import { cn } from "@/lib/utils";

export type FeedMode = "discover" | "following";

interface FeedToggleProps {
  mode: FeedMode;
  onChange: (mode: FeedMode) => void;
  followingCount?: number;
  className?: string;
}

export function FeedToggle({ mode, onChange, followingCount = 0, className }: FeedToggleProps) {
  const haptic = useHaptic();

  const handleChange = (newMode: FeedMode) => {
    if (newMode !== mode) {
      haptic.selection();
      onChange(newMode);
    }
  };

  return (
    <div className={cn("flex justify-center gap-2 px-4 py-2", className)}>
      {(["discover", "following"] as const).map((tab) => {
        const isActive = mode === tab;
        return (
          <button
            key={tab}
            onClick={() => handleChange(tab)}
            className={cn(
              "relative px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
              isActive
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="feed-pill"
                className="absolute inset-0 rounded-full bg-foreground"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">
              {tab === "discover" ? "Para ti" : "Siguiendo"}
              {tab === "following" && followingCount > 0 && (
                <span className={cn(
                  "ml-1 text-xs",
                  isActive ? "opacity-70" : "text-muted-foreground"
                )}>
                  {followingCount}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
