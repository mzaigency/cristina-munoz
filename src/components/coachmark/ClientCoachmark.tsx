import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientCoachmarkProps {
  /** Unique key per coachmark — stored in localStorage so each user sees it once. */
  storageKey: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  /** Delay in ms before showing. Default 900ms. */
  delay?: number;
  /** Optional CTA label. Default "Entendido". */
  ctaLabel?: string;
  /** If false, the coachmark won't trigger (use to gate by auth/route state). */
  enabled?: boolean;
}

const STORAGE_PREFIX = "glow_coach_v1_";

/**
 * Mobile-first floating coachmark for client-facing surfaces.
 * Shows once per storageKey, dismissible, respects safe-area-bottom + bottom nav.
 */
export function ClientCoachmark({
  storageKey,
  title,
  description,
  icon: Icon = Sparkles,
  delay = 900,
  ctaLabel = "Entendido",
  enabled = true,
}: ClientCoachmarkProps) {
  const [open, setOpen] = useState(false);
  const key = STORAGE_PREFIX + storageKey;

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(key)) return;
    const t = setTimeout(() => setOpen(true), delay);
    return () => clearTimeout(t);
  }, [enabled, key, delay]);

  const dismiss = () => {
    localStorage.setItem(key, "1");
    setOpen(false);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: "spring", damping: 22, stiffness: 280 }}
          className={cn(
            "fixed left-4 right-4 z-[90] mx-auto max-w-md",
            // Sits above the bottom navigation (≈72px) with safe-area
            "bottom-[calc(env(safe-area-inset-bottom)+88px)]",
          )}
          role="dialog"
          aria-live="polite"
        >
          <div className="relative rounded-2xl bg-background/95 backdrop-blur-xl border border-border/60 shadow-2xl p-4 pr-10">
            <button
              onClick={dismiss}
              aria-label="Cerrar"
              className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-primary shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-foreground leading-tight">{title}</h4>
                <p className="text-[13px] text-muted-foreground mt-1 leading-snug">{description}</p>
                <button
                  onClick={dismiss}
                  className="mt-3 inline-flex items-center px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-sm hover:opacity-90 transition"
                >
                  {ctaLabel}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
