import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { TOUR_STEPS, TOUR_STORAGE_KEY, type TourStep } from "./tourSteps";
import type { PlanFeature } from "@/hooks/usePlanLimits";

interface SpotlightTourProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Navigates to (section, subTab) before showing step target. */
  onNavigate?: (section: string, subTab?: string) => void;
  hasFeature?: (feature: PlanFeature) => boolean;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 10;
const CALLOUT_W_DESKTOP = 360;
const CALLOUT_GAP = 16;
const SWIPE_THRESHOLD = 60;

/** Resolve a CSS selector to a stable bounding rect (returns null if not found). */
function measureTarget(selector: string): TargetRect | null {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return {
    top: r.top - PAD,
    left: r.left - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
  };
}

function ConfettiBurst({ trigger }: { trigger: number }) {
  // 8 lightweight motion particles. No external dep.
  const particles = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 220,
        y: -120 - Math.random() * 80,
        rot: (Math.random() - 0.5) * 360,
        color: ["#22408b", "#99329a", "#f59e0b", "#10b981", "#3b82f6"][i % 5],
        size: 6 + Math.random() * 4,
        delay: i * 0.02,
      })),
    [trigger],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2"
    >
      {particles.map((p) => (
        <motion.span
          key={`${trigger}-${p.id}`}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rot, scale: 1 }}
          transition={{
            duration: 1.1,
            ease: [0.2, 0.7, 0.3, 1],
            delay: p.delay,
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: 2,
            top: 0,
            left: 0,
          }}
        />
      ))}
    </div>
  );
}

export function SpotlightTour({
  open,
  onOpenChange,
  onNavigate,
  hasFeature,
}: SpotlightTourProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [rect, setRect] = useState<TargetRect | null>(null);
  const [viewport, setViewport] = useState({
    w: typeof window !== "undefined" ? window.innerWidth : 1024,
    h: typeof window !== "undefined" ? window.innerHeight : 768,
  });
  const [confettiTick, setConfettiTick] = useState(0);
  const isMobile = useIsMobile();
  const retryRef = useRef<number | null>(null);

  const step: TourStep = TOUR_STEPS[stepIdx];
  const isLast = stepIdx === TOUR_STEPS.length - 1;
  const locked = !!(
    step.requiredFeature &&
    hasFeature &&
    !hasFeature(step.requiredFeature)
  );

  // Navigate first, then poll for target rect (waits for tab content render)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    if (step.goto && onNavigate) {
      onNavigate(step.goto.section, step.goto.subTab);
    }

    if (!step.target) {
      setRect(null);
      return;
    }

    const tryMeasure = (attempt: number) => {
      if (cancelled) return;
      const r = measureTarget(step.target!);
      if (r) {
        // Scroll into view if off-screen
        const el = document.querySelector(step.target!) as HTMLElement | null;
        const inView =
          r.top > 60 &&
          r.top + r.height < viewport.h - 60 &&
          r.left > 0 &&
          r.left + r.width < viewport.w;
        if (el && !inView) {
          el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
          retryRef.current = window.setTimeout(() => tryMeasure(attempt + 1), 320);
          return;
        }
        setRect(r);
      } else if (attempt < 12) {
        retryRef.current = window.setTimeout(() => tryMeasure(attempt + 1), 120);
      } else {
        // Target not found — show as centered callout
        setRect(null);
      }
    };
    tryMeasure(0);

    return () => {
      cancelled = true;
      if (retryRef.current) {
        clearTimeout(retryRef.current);
        retryRef.current = null;
      }
    };
  }, [open, stepIdx, step.target, step.goto?.section, step.goto?.subTab, onNavigate, viewport.h, viewport.w]);

  // Listen to resize + reposition on every animation frame for short window
  useEffect(() => {
    if (!open) return;
    const handle = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      if (step.target) {
        const r = measureTarget(step.target);
        if (r) setRect(r);
      }
    };
    window.addEventListener("resize", handle);
    window.addEventListener("orientationchange", handle);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("orientationchange", handle);
    };
  }, [open, step.target]);

  // Celebrate trigger
  useEffect(() => {
    if (!open) return;
    if (step.celebrate) {
      setConfettiTick((t) => t + 1);
      // Light haptic on mobile
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate(15); } catch {}
      }
    }
  }, [open, stepIdx, step.celebrate]);

  // Reset to start when reopened
  useEffect(() => {
    if (open) {
      setStepIdx(0);
      setDirection(1);
    }
  }, [open]);

  const goTo = useCallback((idx: number) => {
    if (idx < 0 || idx >= TOUR_STEPS.length) return;
    setDirection(idx > stepIdx ? 1 : -1);
    setStepIdx(idx);
  }, [stepIdx]);

  const complete = useCallback(() => {
    try { localStorage.setItem(TOUR_STORAGE_KEY, "true"); } catch {}
    onOpenChange(false);
  }, [onOpenChange]);

  const next = useCallback(() => {
    if (isLast) complete();
    else goTo(stepIdx + 1);
  }, [isLast, stepIdx, goTo, complete]);

  const prev = useCallback(() => {
    if (stepIdx > 0) goTo(stepIdx - 1);
  }, [stepIdx, goTo]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") complete();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, prev, complete]);

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.y > 120) {
      complete();
      return;
    }
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
      if (info.offset.x < 0) next();
      else prev();
    }
  }, [next, prev, complete]);

  // Compute callout placement
  const callout = useMemo(() => {
    // No target → centered
    if (!rect || isMobile) {
      return { mode: "centered" as const };
    }
    const calloutH = 260;
    const calloutW = CALLOUT_W_DESKTOP;
    const spaceRight = viewport.w - (rect.left + rect.width) - CALLOUT_GAP;
    const spaceLeft = rect.left - CALLOUT_GAP;
    const spaceBottom = viewport.h - (rect.top + rect.height) - CALLOUT_GAP;
    const spaceTop = rect.top - CALLOUT_GAP;

    let top: number;
    let left: number;
    let arrow: "left" | "right" | "top" | "bottom";

    if (spaceRight >= calloutW) {
      arrow = "left";
      left = rect.left + rect.width + CALLOUT_GAP;
      top = Math.max(16, Math.min(rect.top + rect.height / 2 - calloutH / 2, viewport.h - calloutH - 16));
    } else if (spaceLeft >= calloutW) {
      arrow = "right";
      left = rect.left - calloutW - CALLOUT_GAP;
      top = Math.max(16, Math.min(rect.top + rect.height / 2 - calloutH / 2, viewport.h - calloutH - 16));
    } else if (spaceBottom >= 200) {
      arrow = "top";
      top = rect.top + rect.height + CALLOUT_GAP;
      left = Math.max(16, Math.min(rect.left + rect.width / 2 - calloutW / 2, viewport.w - calloutW - 16));
    } else if (spaceTop >= 200) {
      arrow = "bottom";
      top = rect.top - calloutH - CALLOUT_GAP;
      left = Math.max(16, Math.min(rect.left + rect.width / 2 - calloutW / 2, viewport.w - calloutW - 16));
    } else {
      return { mode: "centered" as const };
    }

    return { mode: "anchored" as const, top, left, arrow, calloutW };
  }, [rect, viewport.w, viewport.h, isMobile]);

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
  };

  if (typeof document === "undefined") return null;

  const tour = (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop with spotlight cutout ── */}
          {rect ? (
            <motion.div
              key="spot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[9998] pointer-events-auto"
              onClick={complete}
              style={{ background: "transparent" }}
            >
              <motion.div
                key={`spot-rect-${stepIdx}`}
                initial={{
                  top: rect.top + rect.height / 2,
                  left: rect.left + rect.width / 2,
                  width: 0,
                  height: 0,
                  opacity: 0,
                }}
                animate={{
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                  opacity: 1,
                }}
                transition={{ type: "spring", damping: 26, stiffness: 260 }}
                style={{
                  position: "absolute",
                  borderRadius: 14,
                  boxShadow:
                    "0 0 0 9999px rgba(15, 23, 42, 0.62), 0 0 0 3px rgba(153, 50, 154, 0.85)",
                  pointerEvents: "none",
                }}
              />
              {/* Pulsing ring */}
              <motion.div
                key={`spot-pulse-${stepIdx}`}
                animate={{ scale: [1, 1.04, 1], opacity: [0.7, 0.2, 0.7] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  top: rect.top - 4,
                  left: rect.left - 4,
                  width: rect.width + 8,
                  height: rect.height + 8,
                  borderRadius: 16,
                  border: "2px solid rgba(153, 50, 154, 0.55)",
                  pointerEvents: "none",
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9998] bg-slate-900/60 backdrop-blur-sm"
              onClick={complete}
            />
          )}

          {/* ── Callout card ── */}
          <motion.div
            key={`card-${callout.mode}`}
            initial={
              callout.mode === "anchored"
                ? { opacity: 0, scale: 0.95 }
                : isMobile
                  ? { y: "100%", opacity: 1 }
                  : { opacity: 0, scale: 0.9 }
            }
            animate={
              callout.mode === "anchored"
                ? { opacity: 1, scale: 1 }
                : isMobile
                  ? { y: 0, opacity: 1 }
                  : { opacity: 1, scale: 1 }
            }
            exit={
              callout.mode === "anchored"
                ? { opacity: 0, scale: 0.95 }
                : isMobile
                  ? { y: "100%", opacity: 1 }
                  : { opacity: 0, scale: 0.9 }
            }
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={cn(
              "fixed z-[9999] bg-background rounded-2xl shadow-2xl border border-border/60 overflow-hidden",
              callout.mode === "centered" && !isMobile && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(420px,calc(100vw-32px))]",
              isMobile && "inset-x-0 bottom-0 rounded-b-none pb-[max(env(safe-area-inset-bottom),12px)]",
            )}
            style={
              callout.mode === "anchored" && !isMobile
                ? { top: callout.top, left: callout.left, width: callout.calloutW }
                : undefined
            }
          >
            {isMobile && (
              <div className="flex justify-center pt-2.5 pb-1">
                <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
              </div>
            )}

            {/* Progress bar (segmented) */}
            <div className="flex gap-1 px-4 pt-3">
              {TOUR_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="flex-1 h-1 rounded-full overflow-hidden bg-muted relative"
                  aria-label={`Ir al paso ${i + 1}`}
                >
                  <motion.div
                    initial={false}
                    animate={{ width: i <= stepIdx ? "100%" : "0%" }}
                    transition={{ duration: 0.35, ease: [0.2, 0.7, 0.3, 1] }}
                    className="absolute inset-y-0 left-0 gp-grad-bar"
                  />
                </button>
              ))}
            </div>

            <div className="relative px-5 pt-4 pb-3 min-h-[180px]">
              <ConfettiBurst trigger={confettiTick} />

              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={stepIdx}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: [0.2, 0.7, 0.3, 1] }}
                  className="relative z-[2]"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <motion.div
                      key={`emoji-${stepIdx}`}
                      initial={{ scale: 0, rotate: -25 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", damping: 12, stiffness: 240, delay: 0.05 }}
                      className="h-12 w-12 rounded-xl gp-grad-brand-soft flex items-center justify-center shrink-0 text-2xl"
                    >
                      <span>{step.emoji}</span>
                    </motion.div>
                    <div className="min-w-0 pt-0.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold leading-tight text-foreground">
                          {step.title}
                        </h3>
                        {locked && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 uppercase tracking-wider">
                            <Lock className="h-2.5 w-2.5" />
                            {step.requiredPlan === "business" ? "Business" : "Pro"}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {step.body}
                      </p>
                    </div>
                  </div>

                  {locked && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="mt-2 mb-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 px-3 py-2 text-[12px] text-amber-900 dark:text-amber-200"
                    >
                      Disponible al subir a plan {step.requiredPlan === "business" ? "Business" : "Pro"}.
                    </motion.div>
                  )}

                  {step.tips && step.tips.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.18 }}
                      className="flex flex-wrap gap-1.5 mt-2"
                    >
                      {step.tips.map((tip, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-[11px] font-medium text-primary"
                        >
                          <span className="opacity-70">✓</span>
                          {tip}
                        </span>
                      ))}
                    </motion.div>
                  )}

                  {step.cheer && (
                    <motion.div
                      key={`cheer-${stepIdx}`}
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.28, type: "spring", damping: 16, stiffness: 280 }}
                      className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold gp-text-brand"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {step.cheer}
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer controls */}
            <div className="border-t border-border/40 px-4 py-3 flex items-center justify-between gap-2 bg-muted/20">
              <Button
                variant="ghost"
                size="sm"
                onClick={prev}
                disabled={stepIdx === 0}
                className="gap-1 h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="text-xs">Anterior</span>
              </Button>

              <span className="text-[11px] text-muted-foreground tabular-nums">
                {stepIdx + 1} / {TOUR_STEPS.length}
              </span>

              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  onClick={next}
                  className="gap-1 h-8 px-3 gp-grad-brand"
                >
                  {isLast ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold">¡Empezar!</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-semibold">Siguiente</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </motion.div>
            </div>

            {/* Close X (desktop only — mobile uses swipe down) */}
            {!isMobile && (
              <button
                onClick={complete}
                aria-label="Cerrar tour"
                className="absolute top-2 right-2 h-7 w-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(tour, document.body);
}

/** Auto-launch helper: returns true if tour has been seen before. */
export function tourHasBeenSeen(): boolean {
  try { return localStorage.getItem(TOUR_STORAGE_KEY) === "true"; }
  catch { return false; }
}
