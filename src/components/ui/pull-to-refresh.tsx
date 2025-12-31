import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { Loader2 } from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({
  onRefresh,
  children,
  className = "",
  disabled = false,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const haptic = useHaptic();
  const hasTriggeredHaptic = useRef(false);

  const pullDistance = useMotionValue(0);
  const indicatorOpacity = useTransform(pullDistance, [0, PULL_THRESHOLD / 2], [0, 1]);
  const indicatorScale = useTransform(pullDistance, [0, PULL_THRESHOLD], [0.5, 1]);
  const indicatorRotation = useTransform(pullDistance, [0, PULL_THRESHOLD], [0, 180]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    setIsPulling(true);
    hasTriggeredHaptic.current = false;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      pullDistance.set(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = Math.max(0, currentY - startY.current);
    const dampedDiff = Math.min(MAX_PULL, diff * 0.5);
    
    pullDistance.set(dampedDiff);

    // Trigger haptic when reaching threshold
    if (dampedDiff >= PULL_THRESHOLD && !hasTriggeredHaptic.current) {
      haptic.medium();
      hasTriggeredHaptic.current = true;
    } else if (dampedDiff < PULL_THRESHOLD && hasTriggeredHaptic.current) {
      hasTriggeredHaptic.current = false;
    }

    // Prevent scroll when pulling
    if (dampedDiff > 0) {
      e.preventDefault();
    }
  }, [isPulling, disabled, isRefreshing, pullDistance, haptic]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    const currentPull = pullDistance.get();

    if (currentPull >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      haptic.success();
      
      // Keep indicator visible during refresh
      animate(pullDistance, PULL_THRESHOLD * 0.7, { duration: 0.2 });
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        animate(pullDistance, 0, { duration: 0.3, ease: "easeOut" });
      }
    } else {
      animate(pullDistance, 0, { duration: 0.3, ease: "easeOut" });
    }
  }, [isPulling, pullDistance, isRefreshing, onRefresh, haptic]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div ref={containerRef} className={`relative overflow-auto ${className}`}>
      {/* Pull indicator */}
      <motion.div
        style={{ 
          opacity: indicatorOpacity,
          y: useTransform(pullDistance, [0, MAX_PULL], [-40, 20]),
        }}
        className="absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      >
        <motion.div
          style={{ 
            scale: indicatorScale,
            rotate: isRefreshing ? 0 : indicatorRotation,
          }}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border shadow-lg"
        >
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          ) : (
            <motion.div
              style={{ rotate: indicatorRotation }}
              className="text-primary"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12l7-7 7 7" />
              </svg>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Content with pull effect */}
      <motion.div
        style={{ 
          y: useTransform(pullDistance, [0, MAX_PULL], [0, MAX_PULL * 0.3]),
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
