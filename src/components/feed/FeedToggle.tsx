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
    <div className={cn("flex justify-center py-2 px-4", className)}>
      <div className="inline-flex p-1 rounded-full bg-surface border border-line shadow-xs">
        {(["discover", "following"] as const).map((tab) => {
          const isActive = mode === tab;
          return (
            <button
              key={tab}
              onClick={() => handleChange(tab)}
              className={cn(
                "relative px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 z-10 flex items-center gap-1.5",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="feed-segmented-pill"
                  className="absolute inset-0 rounded-full bg-primary/10 border border-primary/20 shadow-xs -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span>{tab === "discover" ? "Descubrir" : "Siguiendo"}</span>
              {tab === "following" && followingCount > 0 && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold leading-none",
                    isActive
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {followingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
