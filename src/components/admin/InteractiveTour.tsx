import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Settings,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle,
  Users,
  UserCircle,
  LayoutDashboard,
  ShoppingBag,
  Megaphone,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  targetTab?: string;
  tips?: string[];
  emoji: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido al Panel!",
    description: "Te guiamos por las 5 secciones principales. ¡Solo 1 minuto!",
    icon: <Sparkles className="h-7 w-7" />,
    tips: ["Cada sección tiene sub-pestañas", "Desliza para avanzar"],
    emoji: "🎉",
  },
  {
    id: "inicio",
    title: "Inicio",
    description: "Tu día a día: Resumen, Agenda, Caja, Lista de espera y Pedidos de tienda.",
    icon: <LayoutDashboard className="h-7 w-7" />,
    targetTab: "inicio",
    tips: ["Citas y cobros", "Lista de espera", "Pedidos online"],
    emoji: "🏠",
  },
  {
    id: "clientes",
    title: "Clientes",
    description: "Directorio completo con mensajería en tiempo real y gestión de reseñas.",
    icon: <UserCircle className="h-7 w-7" />,
    targetTab: "clientes",
    tips: ["Historial y notas", "Chat directo", "Reseñas verificadas"],
    emoji: "👥",
  },
  {
    id: "catalogo",
    title: "Catálogo",
    description: "Servicios, productos de tienda, paquetes combinados y promociones.",
    icon: <ShoppingBag className="h-7 w-7" />,
    targetTab: "catalogo",
    tips: ["Precios y duración", "Paquetes y promos"],
    emoji: "🛍️",
  },
  {
    id: "marketing",
    title: "Marketing",
    description: "Publica Posts de tus trabajos y genera tarjetas QR (sociales y A4 imprimibles).",
    icon: <Megaphone className="h-7 w-7" />,
    targetTab: "marketing",
    tips: ["Posts de tu portafolio", "QR A4 para imprimir"],
    emoji: "📣",
  },
  {
    id: "negocio",
    title: "Negocio",
    description: "Equipo y comisiones, Informes con estadísticas y Ajustes del salón.",
    icon: <Settings className="h-7 w-7" />,
    targetTab: "negocio",
    tips: ["Staff y horarios", "Informes PDF", "Tema y notificaciones"],
    emoji: "⚙️",
  },
  {
    id: "complete",
    title: "¡Listo para empezar!",
    description: "Ya lo conoces todo. Toca ✨ arriba para repetir el tour cuando quieras.",
    icon: <CheckCircle className="h-7 w-7" />,
    tips: ["Explora cada sub-pestaña", "Ayuda siempre disponible"],
    emoji: "🚀",
  },
];

const STORAGE_KEY = "glowapp_admin_tour_v5_completed";
const SWIPE_THRESHOLD = 60;

interface InteractiveTourProps {
  onTabChange?: (tab: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function InteractiveTour({ onTabChange, open: openProp, onOpenChange, hideTrigger }: InteractiveTourProps) {
  const [isActiveInternal, setIsActiveInternal] = useState(false);
  const isActive = openProp ?? isActiveInternal;
  const setIsActive = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    else setIsActiveInternal(v);
  };
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(true);
  const [direction, setDirection] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setHasSeenTour(false);
      const timer = setTimeout(() => setIsActive(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const goToStep = useCallback((idx: number) => {
    if (idx < 0 || idx >= TOUR_STEPS.length) return;
    setDirection(idx > currentStep ? 1 : -1);
    const step = TOUR_STEPS[idx];
    if (step.targetTab && onTabChange) onTabChange(step.targetTab);
    setCurrentStep(idx);
  }, [currentStep, onTabChange]);

  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) goToStep(currentStep + 1);
    else completeTour();
  }, [currentStep, goToStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setHasSeenTour(true);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (Math.abs(info.offset.y) > 100 && info.offset.y > 0) {
      completeTour();
      return;
    }
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
      if (info.offset.x < 0) nextStep();
      else prevStep();
    }
  }, [nextStep, prevStep, completeTour]);

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
  };

  const tourOverlay = (
    <AnimatePresence>
      {isActive && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={completeTour}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-[101] bg-background rounded-t-3xl shadow-2xl",
              "pb-[calc(env(safe-area-inset-bottom)+8px)]"
            )}
            style={{ maxHeight: "70vh" }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex gap-1 px-4 pb-3">
              {TOUR_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToStep(i)}
                  className="flex-1 h-1 rounded-full transition-all duration-300"
                  style={{
                    background: i <= currentStep
                      ? "hsl(var(--primary))"
                      : "hsl(var(--muted))",
                  }}
                />
              ))}
            </div>

            <div className="overflow-hidden px-5 min-h-[200px]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", damping: 25, stiffness: 250, duration: 0.3 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.15}
                  onDragEnd={handleDragEnd}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-start gap-4 mb-3">
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                      className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary shrink-0"
                    >
                      <span className="text-2xl">{step.emoji}</span>
                    </motion.div>
                    <div className="min-w-0">
                      <motion.h3
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="text-lg font-bold text-foreground leading-tight"
                      >
                        {step.title}
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm text-muted-foreground mt-1 leading-relaxed"
                      >
                        {step.description}
                      </motion.p>
                    </div>
                  </div>

                  {step.tips && step.tips.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="flex flex-wrap gap-2 mt-2"
                    >
                      {step.tips.map((tip, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-primary"
                        >
                          <span className="text-primary/70">✓</span>
                          {tip}
                        </span>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="px-5 pt-3 pb-2 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="gap-1 text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Anterior</span>
              </Button>

              <span className="text-xs text-muted-foreground tabular-nums">
                {currentStep + 1}/{TOUR_STEPS.length}
              </span>

              <Button
                size="sm"
                onClick={isLast ? completeTour : nextStep}
                className="gap-1"
              >
                {isLast ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Empezar
                  </>
                ) : (
                  <>
                    <span className="sr-only sm:not-sr-only">Siguiente</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            <div className="text-center pb-2">
              <button
                onClick={completeTour}
                className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                Omitir tour
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {!hideTrigger && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { setCurrentStep(0); setDirection(0); setIsActive(true); }}
          className="h-8 w-8 sm:h-9 sm:w-9"
          title="Tour guiado"
        >
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      )}

      {typeof document !== "undefined" ? createPortal(tourOverlay, document.body) : null}
    </>
  );
}
