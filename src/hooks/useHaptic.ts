import { useCallback } from "react";

type HapticPattern = "light" | "medium" | "heavy" | "success" | "warning" | "error" | "selection";

interface HapticOptions {
  pattern?: HapticPattern;
  duration?: number;
}

const HAPTIC_PATTERNS: Record<HapticPattern, number[]> = {
  light: [10],
  medium: [20],
  heavy: [40],
  success: [15, 50, 30],
  warning: [20, 40, 20],
  error: [50, 30, 50],
  selection: [8],
};

export function useHaptic() {
  const vibrate = useCallback((options: HapticOptions = {}) => {
    const { pattern = "selection", duration } = options;

    // Check if vibration API is supported
    if (!navigator.vibrate) {
      return false;
    }

    // Check user preferences for reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return false;
    }

    try {
      if (duration) {
        navigator.vibrate(duration);
      } else {
        navigator.vibrate(HAPTIC_PATTERNS[pattern]);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const light = useCallback(() => vibrate({ pattern: "light" }), [vibrate]);
  const medium = useCallback(() => vibrate({ pattern: "medium" }), [vibrate]);
  const heavy = useCallback(() => vibrate({ pattern: "heavy" }), [vibrate]);
  const success = useCallback(() => vibrate({ pattern: "success" }), [vibrate]);
  const warning = useCallback(() => vibrate({ pattern: "warning" }), [vibrate]);
  const error = useCallback(() => vibrate({ pattern: "error" }), [vibrate]);
  const selection = useCallback(() => vibrate({ pattern: "selection" }), [vibrate]);

  return {
    vibrate,
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    selection,
  };
}
