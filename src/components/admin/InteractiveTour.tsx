import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Wallet,
  MessageCircle,
  Settings,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle,
  Users,
  UserCircle,
  LayoutDashboard,
  ChevronDown,
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
    description: "Te guiamos por las secciones principales. ¡Solo 2 minutos!",
    icon: <Sparkles className="h-7 w-7" />,
    tips: ["Sub-opciones en cada sección", "Repite el tour cuando quieras"],
    emoji: "🎉",
  },
  {
    id: "dashboard",
    title: "Inicio",
    description: "Tu centro de control con citas del día, ingresos y acciones rápidas.",
    icon: <LayoutDashboard className="h-7 w-7" />,
    targetTab: "dashboard",
    tips: ["Resumen visual del día", "Acciones con un toque"],
    emoji: "📊",
  },
  {
    id: "agenda",
    title: "Agenda",
    description: "Calendario visual y lista de espera para gestionar todas las citas.",
    icon: <Calendar className="h-7 w-7" />,
    targetTab: "agenda",
    tips: ["Arrastra citas", "Lista de espera integrada"],
    emoji: "📅",
  },
  {
    id: "clients",
    title: "Clientes",
    description: "CRM completo con historial, notas y etiquetas VIP.",
    icon: <UserCircle className="h-7 w-7" />,
    targetTab: "clients",
    tips: ["Busca por nombre o teléfono", "Notas privadas"],
    emoji: "👥",
  },
  {
    id: "business",
    title: "Negocio",
    description: "Caja, promociones, paquetes, productos, objetivos y estadísticas.",
    icon: <Wallet className="h-7 w-7" />,
    targetTab: "business",
    tips: ["Cobros y descuentos", "Informes PDF"],
    emoji: "💰",
  },
  {
    id: "content",
    title: "Contenido",
    description: "Marketing con tarjetas QR personalizadas para tu salón.",
    icon: <Sparkles className="h-7 w-7" />,
    targetTab: "content",
    tips: ["Tarjetas QR con tu marca", "Descarga e imprime"],
    emoji: "🎨",
  },
  {
    id: "team",
    title: "Equipo",
    description: "Gestiona estilistas, servicios, comisiones y horarios.",
    icon: <Users className="h-7 w-7" />,
    targetTab: "team",
    tips: ["Color por estilista", "Comisiones automáticas"],
    emoji: "✂️",
  },
  {
    id: "communication",
    title: "Comunicación",
    description: "Mensajes directos, publicaciones del salón y reseñas.",
    icon: <MessageCircle className="h-7 w-7" />,
    targetTab: "communication",
    tips: ["Chat en tiempo real", "Moderar reseñas"],
    emoji: "💬",
  },
  {
    id: "settings",
    title: "Ajustes",
    description: "Personaliza colores, logo, notificaciones y seguridad.",
    icon: <Settings className="h-7 w-7" />,
    targetTab: "settings",
    tips: ["Tema personalizado", "Alertas configurables"],
    emoji: "⚙️",
  },
  {
    id: "complete",
    title: "¡Listo para empezar!",
    description: "Ya conoces todo. Usa el botón ✨ para repetir el tour.",
    icon: <CheckCircle className="h-7 w-7" />,
    tips: ["Explora cada sección", "Cada una tiene sub-pestañas"],
    emoji: "🚀",
  },
];

const STORAGE_KEY = "glowapp_admin_tour_v3_completed";
const SWIPE_THRESHOLD = 60;

interface InteractiveTourProps {
  onTabChange?: (tab: string) => void;
}

export function InteractiveTour({ onTabChange }: InteractiveTourProps) {
  const [isActive, setIsActive] = useState(false);
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
      <Button
        variant="ghost"
        size="icon"
        onClick={() => { setCurrentStep(0); setDirection(0); setIsActive(true); }}
        className="h-8 w-8 sm:h-9 sm:w-9"
        title="Tour guiado"
      >
        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      {typeof document !== "undefined" ? createPortal(tourOverlay, document.body) : null}
    </>
  );
}
