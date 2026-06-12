import { useState, useEffect, useCallback, useMemo, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type PanInfo } from "motion/react";
import { ArrowRight, ArrowLeft, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { PlanFeature } from "@/hooks/usePlanLimits";
import {
  VignettePanel,
  VignetteAgenda,
  VignetteCaja,
  VignetteClientes,
  VignetteWeb,
} from "./TourVignettes";

export const TOUR_STORAGE_KEY = "glowapp_admin_tour_v7_completed";

interface TourStep {
  id: string;
  title: string;
  body: string;
  vignette: ComponentType;
  /** Deep-link "Probar ahora": cierra el tour y navega a la sección. */
  goto?: { section: string; subTab?: string };
  /** Feature de plan; si falta, se muestra chip de candado. */
  requiredFeature?: PlanFeature;
  requiredPlan?: "pro" | "business";
}

const STEPS: TourStep[] = [
  {
    id: "panel",
    title: "Tu panel, en 40 segundos",
    body: "Cinco vistazos a lo que usarás cada día. Desliza o pulsa siguiente.",
    vignette: VignettePanel,
  },
  {
    id: "agenda",
    title: "La agenda es el centro",
    body: "Toca un hueco para crear una cita y arrástrala para moverla de hora.",
    vignette: VignetteAgenda,
    goto: { section: "agenda", subTab: "dia" },
  },
  {
    id: "caja",
    title: "Cobra en dos toques",
    body: "Efectivo, tarjeta o mixto al cerrar cada cita. El día se cuadra solo.",
    vignette: VignetteCaja,
    goto: { section: "caja", subTab: "cobros" },
    requiredFeature: "cash_register",
    requiredPlan: "pro",
  },
  {
    id: "clientes",
    title: "Conoce a tus clientes",
    body: "Historial, notas privadas y VIPs automáticos en cada ficha.",
    vignette: VignetteClientes,
    goto: { section: "clientes", subTab: "directorio" },
  },
  {
    id: "web",
    title: "Tu web trabaja por ti",
    body: "Las reservas online de tus clientes entran solas en la agenda.",
    vignette: VignetteWeb,
  },
];

const SWIPE_THRESHOLD = 56;

interface AdminTourProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Navega a (section, subTab) al pulsar "Probar ahora". */
  onNavigate?: (section: string, subTab?: string) => void;
  hasFeature?: (feature: PlanFeature) => boolean;
}

export function AdminTour({ open, onOpenChange, onNavigate, hasFeature }: AdminTourProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const isMobile = useIsMobile();

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;
  const locked = !!(step.requiredFeature && hasFeature && !hasFeature(step.requiredFeature));
  const Vignette = step.vignette;

  useEffect(() => {
    if (open) {
      setStepIdx(0);
      setDirection(1);
    }
  }, [open]);

  const complete = useCallback(() => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    } catch {
      // localStorage puede no estar disponible (modo privado)
    }
    onOpenChange(false);
  }, [onOpenChange]);

  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= STEPS.length) return;
      setDirection(idx > stepIdx ? 1 : -1);
      setStepIdx(idx);
    },
    [stepIdx],
  );

  const next = useCallback(() => {
    if (isLast) complete();
    else goTo(stepIdx + 1);
  }, [isLast, complete, goTo, stepIdx]);

  const prev = useCallback(() => goTo(stepIdx - 1), [goTo, stepIdx]);

  const tryIt = useCallback(() => {
    if (!step.goto) return;
    complete();
    onNavigate?.(step.goto.section, step.goto.subTab);
  }, [step.goto, complete, onNavigate]);

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

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (isMobile && info.offset.y > 110) {
        complete();
        return;
      }
      if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
        if (info.offset.x < 0) next();
        else prev();
      }
    },
    [isMobile, next, prev, complete],
  );

  const slideVariants = useMemo(
    () => ({
      enter: (d: number) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
      center: { x: 0, opacity: 1 },
      exit: (d: number) => ({ x: d > 0 ? -48 : 48, opacity: 0 }),
    }),
    [],
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="tour-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-slate-950/55 backdrop-blur-sm"
            onClick={complete}
          />

          <motion.div
            key="tour-card"
            initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.92, y: 12 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
            drag={isMobile ? true : "x"}
            dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={handleDragEnd}
            className={cn(
              "fixed z-[9999] overflow-hidden bg-background shadow-2xl border border-border/60",
              isMobile
                ? "inset-x-0 bottom-0 rounded-t-3xl pb-[max(env(safe-area-inset-bottom),12px)]"
                : "left-1/2 top-1/2 w-[min(460px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-3xl",
            )}
          >
            {isMobile && (
              <div className="flex justify-center pt-2.5 pb-0.5">
                <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
              </div>
            )}

            {/* Progreso segmentado */}
            <div className="flex gap-1 px-5 pt-3">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => goTo(i)}
                  className="relative h-1 flex-1 overflow-hidden rounded-full bg-muted"
                  aria-label={`Ir al paso ${i + 1}`}
                >
                  <motion.div
                    initial={false}
                    animate={{ width: i <= stepIdx ? "100%" : "0%" }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-y-0 left-0 gp-grad-bar"
                  />
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="px-5 pt-4"
              >
                {/* Mini-tutorial visual */}
                <div className="h-44 sm:h-48 select-none" aria-hidden>
                  <Vignette />
                </div>

                <div className="pt-4 pb-1 min-h-[96px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold leading-tight text-foreground">{step.title}</h3>
                    {locked && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                        <Lock className="h-2.5 w-2.5" />
                        {step.requiredPlan === "business" ? "Business" : "Pro"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

                  {step.goto && !locked && (
                    <button
                      onClick={tryIt}
                      className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold gp-text-brand hover:opacity-80 transition-opacity"
                    >
                      Probar ahora
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Controles */}
            <div className="flex items-center justify-between gap-2 px-5 pb-4 pt-2">
              {stepIdx === 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={complete}
                  className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Saltar
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prev}
                  className="h-9 gap-1 px-2 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="text-xs">Anterior</span>
                </Button>
              )}

              <span className="text-[11px] tabular-nums text-muted-foreground">
                {stepIdx + 1} / {STEPS.length}
              </span>

              <motion.div whileTap={{ scale: 0.95 }}>
                <Button size="sm" onClick={next} className="h-9 gap-1 px-4 gp-grad-brand">
                  <span className="text-xs font-semibold">{isLast ? "¡A trabajar!" : "Siguiente"}</span>
                  {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
                </Button>
              </motion.div>
            </div>

            {!isMobile && (
              <button
                onClick={complete}
                aria-label="Cerrar tour"
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** True si el tour ya se completó en este dispositivo. */
export function tourHasBeenSeen(): boolean {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}
