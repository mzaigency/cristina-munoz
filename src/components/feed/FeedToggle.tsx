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
    <div className={cn("flex justify-center gap-6 py-2", className)}>
      {(["discover", "following"] as const).map((tab) => {
        const isActive = mode === tab;
        return (
          <button
            key={tab}
            onClick={() => handleChange(tab)}
            className={cn(
              "relative pb-1.5 text-sm transition-colors duration-200",
              isActive
                ? "text-foreground font-semibold"
                : "text-muted-foreground font-medium hover:text-foreground/70"
            )}
          >
            {tab === "discover" ? "Descubrir" : "Siguiendo"}
            {tab === "following" && followingCount > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                {followingCount}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="feed-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full gradient-primary"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
