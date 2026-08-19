import { useState, useEffect, useCallback, useMemo, useRef, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type PanInfo } from "motion/react";
import { ArrowRight, ArrowLeft, Lock, Sparkles, X, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { PlanFeature } from "@/hooks/usePlanLimits";
import { VignettePanel, VignetteAgenda, VignetteCaja, VignetteClientes, VignetteWeb } from "./TourVignettes";

export const TOUR_STORAGE_KEY = "glowapp_admin_tour_v8_completed";

/**
 * Tour guiado sobre el panel real, en dos fases por paso:
 *
 *  Fase MENÚ: antes de cambiar de sección, el foco viaja al ítem del menú
 *  (sidebar en desktop, bottom bar o botón "Más" en móvil) y el puntero
 *  hace tap ahí. El usuario VE desde dónde se llega a cada sección.
 *
 *  Fase CONTENIDO: se navega de verdad, el motor espera a que el objetivo
 *  exista y sea estable, lo centra en la zona visible (descontando la
 *  tarjeta y la bottom bar) y el foco viaja hasta él.
 *
 *  La tarjeta nunca tapa lo que se enseña: en desktop se coloca en el
 *  lado con hueco; en móvil es una tarjeta flotante que salta arriba o
 *  abajo según dónde esté el objetivo, siempre por encima de la bottom bar.
 *  Si un objetivo no aparece, el paso degrada a tarjeta centrada con su
 *  viñeta animada. El tour no se rompe.
 */

interface TourStep {
  id: string;
  emoji: string;
  title: string;
  body: string;
  /** Valor de data-tour-target del elemento real a destacar. */
  target?: string;
  /** Navegación previa (sección, subTab); activa la fase MENÚ. */
  goto?: { section: string; subTab?: string };
  /** Viñeta animada: visual de pasos centrados y fallback si falta el target. */
  vignette?: ComponentType;
  /** Muestra el puntero haciendo tap en el objetivo (fase contenido). */
  tap?: boolean;
  tips?: string[];
  requiredFeature?: PlanFeature;
  requiredPlan?: "pro" | "business";
  celebrate?: boolean;
}

const SECTION_LABELS: Record<string, string> = {
  inicio: "Inicio",
  agenda: "Agenda",
  caja: "Caja",
  clientes: "Clientes",
  catalogo: "Catálogo",
  marketing: "Marketing",
  negocio: "Negocio",
  ajustes: "Ajustes",
};

const STEPS: TourStep[] = [
  {
    id: "welcome",
    emoji: "👋",
    title: "Te enseño tu panel",
    body: "Un minuto. Iré iluminando cada zona y verás desde dónde se abre cada cosa. Toca en cualquier sitio para avanzar.",
    vignette: VignettePanel,
  },
  {
    id: "sidebar",
    emoji: "🧭",
    target: "sidebar-nav",
    title: "Tu menú",
    body: "Desde aquí llegas a todo: agenda, caja, clientes, catálogo y tu web.",
  },
  {
    id: "inicio",
    emoji: "📊",
    target: "inicio-stats",
    goto: { section: "inicio", subTab: "resumen" },
    title: "El pulso del día",
    body: "Ingresos, próximas citas y avisos. Tu primera mirada cada mañana.",
    tips: ["KPIs en vivo"],
  },
  {
    id: "agenda",
    emoji: "📅",
    target: "agenda-calendar",
    goto: { section: "agenda", subTab: "dia" },
    title: "La agenda es el centro",
    body: "Toca un hueco para crear una cita. Arrastra para cambiarla de hora.",
    tips: ["Drag & drop", "Color por estilista"],
    vignette: VignetteAgenda,
    tap: true,
    celebrate: true,
  },
  {
    id: "caja",
    emoji: "💰",
    target: "caja-cobros",
    goto: { section: "caja", subTab: "cobros" },
    title: "Cobra en dos toques",
    body: "Efectivo, tarjeta o mixto al cerrar la cita. El día se cuadra solo.",
    tips: ["Cierre diario"],
    vignette: VignetteCaja,
    tap: true,
    requiredFeature: "cash_register",
    requiredPlan: "pro",
  },
  {
    id: "clientes",
    emoji: "👥",
    target: "clientes-directorio",
    goto: { section: "clientes", subTab: "directorio" },
    title: "Conoce a tus clientes",
    body: "Historial, notas privadas y VIPs automáticos en cada ficha.",
    tips: ["VIP automático", "Vas por la mitad 🔥"],
    vignette: VignetteClientes,
    celebrate: true,
  },
  {
    id: "catalogo",
    emoji: "✂️",
    target: "catalogo-services",
    goto: { section: "catalogo", subTab: "services" },
    title: "Tus servicios",
    body: "Precio, duración y categoría. Se publican solos en tu web de reservas.",
  },
  {
    id: "marketing",
    emoji: "🔳",
    target: "marketing-qr",
    goto: { section: "marketing", subTab: "qr" },
    title: "Tráete clientes",
    body: "Tarjetas y carteles con tu QR de reserva, listos para imprimir o compartir.",
    tips: ["Ya casi está ✨"],
  },
  {
    id: "negocio",
    emoji: "💼",
    target: "negocio-equipo",
    goto: { section: "negocio", subTab: "equipo" },
    title: "Equipo y horarios",
    body: "Estilistas, horarios, comisiones y objetivos. El back-office completo.",
  },
  {
    id: "done",
    emoji: "🎉",
    title: "Ya conoces tu panel",
    body: "Las reservas online entran solas en tu agenda. Repite el tour desde el botón ? cuando quieras.",
    vignette: VignetteWeb,
    celebrate: true,
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 10;
const NAV_PAD = 6;
const CALLOUT_W = 360;
const GAP = 18;
const NAV_PHASE_MS = 1400;
const SWIPE_THRESHOLD = 56;
const SPRING = { type: "spring" as const, damping: 28, stiffness: 230, mass: 0.9 };

function toRect(el: HTMLElement, pad: number): Rect | null {
  const r = el.getBoundingClientRect();
  if (r.width < 2 && r.height < 2) return null;
  return { top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
}

function measureTarget(target: string): Rect | null {
  const el = document.querySelector(`[data-tour-target="${target}"]`) as HTMLElement | null;
  return el ? toRect(el, PAD) : null;
}

/** Ítem de menú VISIBLE para una sección: sidebar (desktop), bottom bar o "Más" (móvil). */
function measureNav(section: string): Rect | null {
  const candidates = [
    ...document.querySelectorAll(`[data-tour-nav="${section}"]`),
    ...document.querySelectorAll(`[data-tour-nav="more"]`),
  ] as HTMLElement[];
  for (const el of candidates) {
    const r = toRect(el, NAV_PAD);
    if (r) return r;
  }
  return null;
}

function rectsClose(a: Rect, b: Rect) {
  return (
    Math.abs(a.top - b.top) < 2 &&
    Math.abs(a.left - b.left) < 2 &&
    Math.abs(a.width - b.width) < 2 &&
    Math.abs(a.height - b.height) < 2
  );
}

function ConfettiBurst({ trigger }: { trigger: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 240,
        y: -110 - Math.random() * 90,
        rot: (Math.random() - 0.5) * 360,
        color: ["var(--glow-brand)", "var(--glow-accent)", "var(--glow-warn)", "var(--glow-ok)", "var(--glow-brand-ink)"][i % 5],
        size: 5 + Math.random() * 5,
        delay: i * 0.02,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trigger],
  );
  if (trigger === 0) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-8 z-10">
      {particles.map((p) => (
        <motion.span
          key={`${trigger}-${p.id}`}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rot, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.2, 0.7, 0.3, 1], delay: p.delay }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

interface AdminTourProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Navega a (section, subTab) en la fase de menú de cada paso. */
  onNavigate?: (section: string, subTab?: string) => void;
  hasFeature?: (feature: PlanFeature) => boolean;
}

export function AdminTour({ open, onOpenChange, onNavigate, hasFeature }: AdminTourProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [phase, setPhase] = useState<"nav" | "content">("content");
  const [rect, setRect] = useState<Rect | null>(null);
  /** false mientras se busca el objetivo del paso actual. */
  const [settled, setSettled] = useState(false);
  const [confettiTick, setConfettiTick] = useState(0);
  const [cardH, setCardH] = useState(200);
  const [viewport, setViewport] = useState({
    w: typeof window !== "undefined" ? window.innerWidth : 1024,
    h: typeof window !== "undefined" ? window.innerHeight : 768,
  });
  const isMobile = useIsMobile();
  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;
  const cardRef = useRef<HTMLDivElement | null>(null);

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;
  const locked = !!(step.requiredFeature && hasFeature && !hasFeature(step.requiredFeature));
  const Vignette = step.vignette;
  const navLabel = step.goto ? (SECTION_LABELS[step.goto.section] ?? step.goto.section) : "";
  /** Tarjeta centrada: pasos sin target o cuyo target no se encontró. */
  const centered = phase === "content" && (!step.target || (settled && !rect));

  useEffect(() => {
    if (open) {
      setStepIdx(0);
      setDirection(1);
      setRect(null);
      setSettled(false);
      setPhase("content");
      setConfettiTick(0);
    }
  }, [open]);

  /* ── Altura real de la tarjeta (colocación precisa) ── */
  useEffect(() => {
    if (!open) return;
    const el = cardRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setCardH(el.offsetHeight || 200));
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  /** Altura de la bottom bar móvil (para no taparla nunca). */
  const bottomBarH = useMemo(() => {
    if (!isMobile || typeof document === "undefined") return 0;
    const el = document.querySelector('[data-tour-target="mobile-bottom-nav"]') as HTMLElement | null;
    return el?.offsetHeight || 76;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, open, stepIdx]);

  /* ── Motor por paso: fase menú → navegar → fase contenido ── */
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      const t = window.setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timers.push(t);
    };

    setSettled(false);

    const pollContent = () => {
      setPhase("content");
      if (!step.target) {
        setRect(null);
        setSettled(true);
        return;
      }
      let last: Rect | null = null;
      let scrolled = false;

      const tick = (attempt: number) => {
        if (cancelled) return;
        const r = measureTarget(step.target!);

        if (!r) {
          if (attempt < 16) later(() => tick(attempt + 1), 120);
          else {
            setRect(null);
            setSettled(true); // degrada a tarjeta centrada con viñeta
          }
          return;
        }

        // Zona visible: descuenta bottom bar y tarjeta (móvil)
        const reserve = isMobileRef.current ? bottomBarH + cardH + 24 : 0;
        const visibleH = window.innerHeight - reserve;
        const fits = r.height <= visibleH - 32;
        const offTop = r.top < 16;
        const offBottom = r.top + r.height > visibleH - 16;
        if (!scrolled && fits && (offTop || offBottom)) {
          scrolled = true;
          const el = document.querySelector(`[data-tour-target="${step.target}"]`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          later(() => tick(attempt + 1), 360);
          return;
        }

        // Dos medidas idénticas seguidas = layout estable
        if (last && rectsClose(last, r)) {
          setRect(r);
          setSettled(true);
          return;
        }
        last = r;
        later(() => tick(attempt + 1), 90);
      };
      tick(0);
    };

    if (step.goto) {
      // Fase MENÚ: ilumina el ítem del menú antes de navegar
      const navRect = measureNav(step.goto.section);
      if (navRect) {
        setPhase("nav");
        setRect(navRect);
        setSettled(true);
        later(() => {
          onNavigate?.(step.goto!.section, step.goto!.subTab);
          setSettled(false);
          // pequeño respiro para que la sección monte antes de medir
          later(pollContent, 120);
        }, NAV_PHASE_MS);
      } else {
        onNavigate?.(step.goto.section, step.goto.subTab);
        later(pollContent, 120);
      }
    } else {
      pollContent();
    }

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stepIdx]);

  /* ── Seguimiento en vivo: scroll y resize re-miden el objetivo ── */
  useEffect(() => {
    if (!open || !settled || phase !== "content" || !step.target) return;
    let raf = 0;
    const sync = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setViewport({ w: window.innerWidth, h: window.innerHeight });
        const r = measureTarget(step.target!);
        if (r) setRect(r);
      });
    };
    window.addEventListener("scroll", sync, { capture: true, passive: true });
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", sync, { capture: true });
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, [open, step.target, settled, phase]);

  /* ── Celebración ── */
  useEffect(() => {
    if (!open || !step.celebrate) return;
    setConfettiTick((t) => t + 1);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // sin haptics
      }
    }
  }, [open, stepIdx, step.celebrate]);

  const complete = useCallback(() => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    } catch {
      // localStorage no disponible
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
      if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
        if (info.offset.x < 0) next();
        else prev();
      }
    },
    [next, prev],
  );

  /* ── Geometría del spotlight ── */
  const spot = useMemo(() => {
    if (centered || !rect) {
      return { top: viewport.h / 2, left: viewport.w / 2, width: 0, height: 0, r: 24 };
    }
    return { top: rect.top, left: rect.left, width: rect.width, height: rect.height, r: phase === "nav" ? 12 : 16 };
  }, [centered, rect, viewport.w, viewport.h, phase]);

  /* ── Posición de la tarjeta ── */
  const calloutPos = useMemo(() => {
    if (isMobile) {
      // Móvil: tarjeta flotante arriba o abajo, nunca sobre la bottom bar
      const topPos = 12;
      const bottomPos = viewport.h - bottomBarH - cardH - 10;
      if (centered || !rect) {
        return { top: Math.max(12, (viewport.h - bottomBarH - cardH) / 2), left: 12, width: viewport.w - 24 };
      }
      const rectCenter = rect.top + rect.height / 2;
      // Objetivo en la mitad superior → tarjeta abajo; y al revés
      const top = rectCenter < viewport.h / 2 ? bottomPos : topPos;
      return { top: Math.max(12, top), left: 12, width: viewport.w - 24 };
    }

    if (centered || !rect) {
      return { top: viewport.h / 2 - cardH / 2 - 20, left: viewport.w / 2 - CALLOUT_W / 2, width: CALLOUT_W };
    }
    const spaceRight = viewport.w - (rect.left + rect.width) - GAP;
    const spaceLeft = rect.left - GAP;
    const spaceBottom = viewport.h - (rect.top + rect.height) - GAP;

    const clampTop = (t: number) => Math.max(16, Math.min(t, viewport.h - cardH - 16));
    const clampLeft = (l: number) => Math.max(16, Math.min(l, viewport.w - CALLOUT_W - 16));

    if (spaceRight >= CALLOUT_W) {
      return {
        top: clampTop(rect.top + rect.height / 2 - cardH / 2),
        left: rect.left + rect.width + GAP,
        width: CALLOUT_W,
      };
    }
    if (spaceLeft >= CALLOUT_W) {
      return {
        top: clampTop(rect.top + rect.height / 2 - cardH / 2),
        left: rect.left - CALLOUT_W - GAP,
        width: CALLOUT_W,
      };
    }
    if (spaceBottom >= cardH * 0.8) {
      return {
        top: clampTop(rect.top + rect.height + GAP),
        left: clampLeft(rect.left + rect.width / 2 - CALLOUT_W / 2),
        width: CALLOUT_W,
      };
    }
    return {
      top: clampTop(rect.top - cardH - GAP),
      left: clampLeft(rect.left + rect.width / 2 - CALLOUT_W / 2),
      width: CALLOUT_W,
    };
  }, [isMobile, centered, rect, viewport.w, viewport.h, cardH, bottomBarH]);

  const slideVariants = useMemo(
    () => ({
      enter: (d: number) => ({ x: d > 0 ? 44 : -44, opacity: 0 }),
      center: { x: 0, opacity: 1 },
      exit: (d: number) => ({ x: d > 0 ? -44 : 44, opacity: 0 }),
    }),
    [],
  );

  if (typeof document === "undefined") return null;

  const showVignette = !!Vignette && centered;
  const showPointer = rect && !centered && (phase === "nav" || step.tap);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Capa de interacción: tocar en cualquier sitio avanza */}
          <motion.div
            key="tour-hit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9997]"
            onClick={next}
          />

          {/* Spotlight persistente: viaja entre objetivos con spring */}
          <motion.div
            key="tour-spot"
            initial={{
              top: viewport.h / 2,
              left: viewport.w / 2,
              width: 0,
              height: 0,
              opacity: 0,
            }}
            animate={{ ...spot, borderRadius: spot.r, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SPRING}
            className="pointer-events-none fixed z-[9998]"
            style={{ boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.62)" }}
          />

          {/* Beacon: anillo que acompaña al foco y respira */}
          {!centered && rect && (
            <motion.div
              key="tour-beacon"
              initial={false}
              animate={{
                top: spot.top - 5,
                left: spot.left - 5,
                width: spot.width + 10,
                height: spot.height + 10,
              }}
              transition={SPRING}
              className="pointer-events-none fixed z-[9998]"
            >
              <motion.div
                className="h-full w-full rounded-[18px] border-2"
                style={{ borderColor: "hsl(var(--primary) / 0.65)" }}
                animate={{ scale: [1, 1.025, 1], opacity: [0.85, 0.3, 0.85] }}
                transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          )}

          {/* Puntero que hace tap (fase menú y pasos de acción) */}
          {showPointer && (
            <motion.div
              key="tour-pointer"
              initial={false}
              animate={{
                top: spot.top + spot.height * (phase === "nav" ? 0.5 : 0.55),
                left: spot.left + spot.width * 0.5,
              }}
              transition={{ ...SPRING, damping: 32 }}
              className="pointer-events-none fixed z-[9999]"
            >
              <motion.div
                className="relative -translate-x-1/2 -translate-y-1/2"
                animate={{ scale: [1, 0.82, 1, 1] }}
                transition={{ duration: 1.6, times: [0, 0.14, 0.3, 1], repeat: Infinity }}
              >
                <div className="h-5 w-5 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.45)] ring-2 ring-primary/70" />
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full ring-2 ring-white/80"
                  animate={{ scale: [1, 2.4], opacity: [0.8, 0] }}
                  transition={{ duration: 1.6, times: [0.14, 0.62], repeat: Infinity }}
                />
              </motion.div>
            </motion.div>
          )}

          {/* ── Tarjeta del paso ── */}
          <motion.div
            key="tour-card"
            ref={cardRef}
            initial={{ opacity: 0, scale: 0.94, top: calloutPos.top, left: calloutPos.left }}
            animate={{ opacity: 1, scale: 1, top: calloutPos.top, left: calloutPos.left }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={SPRING}
            drag={isMobile ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={isMobile ? handleDragEnd : undefined}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-[9999] overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl"
            style={{ width: calloutPos.width }}
          >
            <ConfettiBurst trigger={confettiTick} />

            {/* Progreso segmentado */}
            <div className="flex gap-1 pl-4 pr-11 pt-3">
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
                    className="absolute inset-y-0 left-0 glow-grad-bar"
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
                className="px-4 pt-3"
              >
                {showVignette && (
                  <div className={cn("mb-3 select-none", isMobile ? "h-32" : "h-40")} aria-hidden>
                    <Vignette />
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <motion.div
                    key={`emoji-${step.id}`}
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 13, stiffness: 260, delay: 0.05 }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl glow-grad-brand-soft"
                  >
                    <span>{step.emoji}</span>
                  </motion.div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15px] font-semibold leading-tight text-on-surface">{step.title}</h3>
                      {locked && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-glow-warn/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-glow-warn-ink">
                          <Lock className="h-2.5 w-2.5" />
                          {step.requiredPlan === "business" ? "Business" : "Pro"}
                        </span>
                      )}
                    </div>

                    {/* Fase menú: señala desde dónde se abre la sección */}
                    <AnimatePresence mode="wait">
                      {phase === "nav" && step.goto ? (
                        <motion.p
                          key="nav-hint"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="mt-1 flex items-center gap-1.5 text-[13px] font-medium glow-text-brand"
                        >
                          <MousePointerClick className="h-3.5 w-3.5 shrink-0" />
                          Abrimos <b>{navLabel}</b> desde aquí…
                        </motion.p>
                      ) : (
                        <motion.div
                          key="body"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                        >
                          <p className="mt-1 text-[13px] leading-relaxed text-outline">{step.body}</p>
                          {step.tips && step.tips.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {step.tips.map((tip) => (
                                <span
                                  key={tip}
                                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                                >
                                  <Sparkles className="h-2.5 w-2.5 opacity-70" />
                                  {tip}
                                </span>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Controles */}
            <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-2.5">
              {stepIdx === 0 ? (
                <button className="glow-btn glow-btn--ghost glow-btn--sm px-2 text-xs font-medium text-outline hover:text-on-surface"
                  onClick={complete}>
                  Saltar
                </button>
              ) : (
                <button className="glow-btn glow-btn--ghost glow-btn--sm gap-1 px-2 text-outline hover:text-on-surface"
                  onClick={prev}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Anterior</span>
                </button>
              )}

              <span className="text-[11px] tabular-nums text-outline">
                {stepIdx + 1} / {STEPS.length}
              </span>

              <motion.div whileTap={{ scale: 0.95 }}>
                <button className="glow-btn glow-btn--primary glow-btn--sm gap-1 px-4 glow-grad-brand text-white" onClick={next}>
                  <span className="text-xs font-semibold">{isLast ? "¡A trabajar!" : "Siguiente"}</span>
                  {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
                </button>
              </motion.div>
            </div>

            <button
              onClick={complete}
              aria-label="Cerrar tour"
              className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-outline transition-colors hover:bg-muted hover:text-on-surface"
            >
              <X className="h-3.5 w-3.5" />
            </button>
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
