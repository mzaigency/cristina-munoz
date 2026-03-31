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
    <div className={cn("flex border-b border-border", className)}>
      <button
        onClick={() => handleChange("discover")}
        className={cn(
          "flex-1 py-3 text-sm font-medium transition-colors relative",
          mode === "discover" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Para ti
        {mode === "discover" && (
          <motion.div
            layoutId="feed-indicator"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
          />
        )}
      </button>
      <button
        onClick={() => handleChange("following")}
        className={cn(
          "flex-1 py-3 text-sm font-medium transition-colors relative",
          mode === "following" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Siguiendo
        {followingCount > 0 && (
          <span className="ml-1.5 text-xs text-muted-foreground">
            ({followingCount})
          </span>
        )}
        {mode === "following" && (
          <motion.div
            layoutId="feed-indicator"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
          />
        )}
      </button>
    </div>
  );
}
