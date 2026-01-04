import { useCallback } from "react";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

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
  const isNative = Capacitor.isNativePlatform();

  const vibrate = useCallback(async (options: HapticOptions = {}) => {
    const { pattern = "selection", duration } = options;

    // Check user preferences for reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return false;
    }

    // Use native haptics on iOS/Android
    if (isNative) {
      try {
        switch (pattern) {
          case "light":
            await Haptics.impact({ style: ImpactStyle.Light });
            break;
          case "medium":
            await Haptics.impact({ style: ImpactStyle.Medium });
            break;
          case "heavy":
            await Haptics.impact({ style: ImpactStyle.Heavy });
            break;
          case "success":
            await Haptics.notification({ type: NotificationType.Success });
            break;
          case "warning":
            await Haptics.notification({ type: NotificationType.Warning });
            break;
          case "error":
            await Haptics.notification({ type: NotificationType.Error });
            break;
          case "selection":
            await Haptics.selectionStart();
            await Haptics.selectionEnd();
            break;
        }
        return true;
      } catch {
        return false;
      }
    }

    // Fallback to web vibration API
    if (!navigator.vibrate) {
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
  }, [isNative]);

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
