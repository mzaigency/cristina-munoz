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
  emoji: string;
  targetTab?: string;
  targetSubTab?: string;
  tips?: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido al Panel!",
    description: "Recorrido por las 5 secciones y todas sus sub-pestañas. ¡Solo 2 minutos!",
    emoji: "🎉",
    tips: ["Desliza para avanzar", "Toca los puntos para saltar"],
  },

  // ── INICIO ─────────────────────────────
  {
    id: "inicio-resumen",
    title: "Inicio · Resumen",
    description: "Tu centro de control: métricas del día, próximas citas y acciones rápidas.",
    emoji: "📊",
    targetTab: "inicio",
    targetSubTab: "resumen",
    tips: ["KPIs del día", "Checklist inicial"],
  },
  {
    id: "inicio-agenda",
    title: "Inicio · Agenda",
    description: "Calendario por día/semana. Arrastra citas y confirma WhatsApp con un toque.",
    emoji: "📅",
    targetTab: "inicio",
    targetSubTab: "agenda",
    tips: ["Drag & drop", "Color por estilista"],
  },
  {
    id: "inicio-caja",
    title: "Inicio · Caja",
    description: "Cobra al finalizar la cita: efectivo, tarjeta o mixto. Exporta a Excel.",
    emoji: "💰",
    targetTab: "inicio",
    targetSubTab: "caja",
    tips: ["Plan Pro", "Cierres diarios"],
  },
  {
    id: "inicio-espera",
    title: "Inicio · Lista de espera",
    description: "Clientes sin hueco. Se avisan automáticamente si se libera una cita.",
    emoji: "⏳",
    targetTab: "inicio",
    targetSubTab: "espera",
    tips: ["Aviso automático"],
  },
  {
    id: "inicio-pedidos",
    title: "Inicio · Pedidos",
    description: "Pedidos online de tu tienda. Gestiona estado y entrega desde aquí.",
    emoji: "🛒",
    targetTab: "inicio",
    targetSubTab: "pedidos",
    tips: ["Tienda integrada"],
  },

  // ── CLIENTES ───────────────────────────
  {
    id: "clientes-directorio",
    title: "Clientes · Directorio",
    description: "Tu CRM completo: historial, notas, etiquetas VIP y métricas financieras.",
    emoji: "👥",
    targetTab: "clientes",
    targetSubTab: "directorio",
    tips: ["VIP automático", "Notas privadas"],
  },
  {
    id: "clientes-mensajes",
    title: "Clientes · Mensajes",
    description: "Chat en tiempo real con notificaciones push para no perder ningún mensaje.",
    emoji: "💬",
    targetTab: "clientes",
    targetSubTab: "mensajes",
    tips: ["Push instantáneo"],
  },
  {
    id: "clientes-resenas",
    title: "Clientes · Reseñas",
    description: "Modera las opiniones de tus clientes y decide cuáles se publican.",
    emoji: "⭐",
    targetTab: "clientes",
    targetSubTab: "resenas",
    tips: ["Aprueba o rechaza"],
  },

  // ── CATÁLOGO ───────────────────────────
  {
    id: "catalogo-services",
    title: "Catálogo · Servicios",
    description: "Define servicios con precio, duración y categoría. Visibles al reservar.",
    emoji: "✂️",
    targetTab: "catalogo",
    targetSubTab: "services",
    tips: ["Precio y duración"],
  },
  {
    id: "catalogo-products",
    title: "Catálogo · Productos",
    description: "Inventario de tu tienda online con alertas de stock bajo.",
    emoji: "📦",
    targetTab: "catalogo",
    targetSubTab: "products",
    tips: ["Stock automático"],
  },
  {
    id: "catalogo-packages",
    title: "Catálogo · Paquetes",
    description: "Combina varios servicios en un pack con descuento automático.",
    emoji: "🎁",
    targetTab: "catalogo",
    targetSubTab: "packages",
    tips: ["Plan Pro"],
  },
  {
    id: "catalogo-promos",
    title: "Catálogo · Promos",
    description: "Cupones de descuento y puntos de fidelidad para tus clientes.",
    emoji: "🎫",
    targetTab: "catalogo",
    targetSubTab: "promos",
    tips: ["Plan Pro"],
  },

  // ── MARKETING ──────────────────────────
  {
    id: "marketing-posts",
    title: "Marketing · Posts",
    description: "Publica tus trabajos. Tu portafolio visual aparece en la landing del salón.",
    emoji: "📸",
    targetTab: "marketing",
    targetSubTab: "posts",
    tips: ["Portafolio público"],
  },
  {
    id: "marketing-qr",
    title: "Marketing · Tarjetas QR",
    description: "Genera tarjetas sociales y carteles A4 listos para imprimir con tu QR.",
    emoji: "🔳",
    targetTab: "marketing",
    targetSubTab: "qr",
    tips: ["Cartel A4 print", "Tarjeta social"],
  },

  // ── NEGOCIO ────────────────────────────
  {
    id: "negocio-equipo",
    title: "Negocio · Equipo",
    description: "Staff, color por estilista, horarios y comisiones automáticas.",
    emoji: "✂️",
    targetTab: "negocio",
    targetSubTab: "equipo",
    tips: ["Comisiones Business"],
  },
  {
    id: "negocio-informes",
    title: "Negocio · Informes",
    description: "Estadísticas, objetivos mensuales y exportación de informes en PDF.",
    emoji: "📈",
    targetTab: "negocio",
    targetSubTab: "informes",
    tips: ["PDF descargable"],
  },
  {
    id: "negocio-ajustes",
    title: "Negocio · Ajustes",
    description: "Tema, logo, dirección, notificaciones y seguridad del salón.",
    emoji: "⚙️",
    targetTab: "negocio",
    targetSubTab: "ajustes",
    tips: ["Tema personalizable"],
  },

  {
    id: "complete",
    title: "¡Listo para empezar!",
    description: "Ya conoces todo. Toca ✨ arriba para repetir el tour cuando quieras.",
    emoji: "🚀",
    tips: ["Centro de ayuda siempre disponible"],
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
