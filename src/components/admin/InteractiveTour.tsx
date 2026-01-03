import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Wallet,
  Star,
  MessageCircle,
  ImageIcon,
  BarChart3,
  Settings,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle,
  Scissors,
  Users,
  Clock,
  Package,
  Plus,
  MousePointerClick,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  targetSelector?: string;
  targetTab?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  action?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido a tu Panel!",
    description: "Te guiaremos de forma interactiva por todas las funciones de tu CRM. Sigue el spotlight para descubrir cada sección.",
    icon: <Sparkles className="h-6 w-6" />,
    position: "center",
  },
  {
    id: "nav-agenda",
    title: "Agenda",
    description: "Tu calendario de citas. Aquí verás todas las reservas organizadas por día y estilista.",
    icon: <Calendar className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-calendar"]',
    targetTab: "calendar",
    position: "bottom",
  },
  {
    id: "new-appointment",
    title: "Nueva Cita",
    description: "Pulsa aquí para crear una nueva cita. Puedes seleccionar cliente, servicios, fecha y estilista.",
    icon: <Plus className="h-6 w-6" />,
    targetSelector: '[data-tour-step="new-appointment"]',
    position: "bottom",
    action: "Pulsa para crear citas",
  },
  {
    id: "nav-cash",
    title: "Caja Registradora",
    description: "Registra los cobros de tus servicios. Gestiona pagos en efectivo, tarjeta y aplica descuentos.",
    icon: <Wallet className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-cash"]',
    targetTab: "cash",
    position: "bottom",
  },
  {
    id: "nav-reviews",
    title: "Reseñas",
    description: "Gestiona las opiniones de tus clientes. Modera y aprueba reseñas antes de publicarlas.",
    icon: <Star className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-reviews"]',
    targetTab: "reviews",
    position: "bottom",
  },
  {
    id: "nav-messages",
    title: "Mensajes",
    description: "Comunicación directa con clientes. Responde consultas y confirma citas desde aquí.",
    icon: <MessageCircle className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-messages"]',
    targetTab: "messages",
    position: "bottom",
  },
  {
    id: "nav-stories",
    title: "Stories",
    description: "Comparte fotos de tus trabajos. Los stories duran 24h y aparecen en el feed de GlowApp.",
    icon: <ImageIcon className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-stories"]',
    targetTab: "stories",
    position: "bottom",
  },
  {
    id: "nav-stats",
    title: "Estadísticas",
    description: "Analiza el rendimiento de tu negocio con métricas de ingresos, citas y tendencias.",
    icon: <BarChart3 className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-security"]',
    targetTab: "security",
    position: "bottom",
  },
  {
    id: "nav-products",
    title: "Productos",
    description: "Gestiona tu inventario de productos para venta. Controla stock y precios.",
    icon: <Package className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-products"]',
    targetTab: "products",
    position: "bottom",
  },
  {
    id: "nav-services",
    title: "Servicios",
    description: "Configura los servicios que ofreces. Define nombres, precios y duraciones.",
    icon: <Scissors className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-services"]',
    targetTab: "services",
    position: "bottom",
  },
  {
    id: "nav-team",
    title: "Equipo",
    description: "Administra tu equipo de estilistas. Añade miembros, fotos y asigna colores.",
    icon: <Users className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-stylists"]',
    targetTab: "stylists",
    position: "bottom",
  },
  {
    id: "nav-hours",
    title: "Horarios",
    description: "Define los horarios de apertura de tu negocio y de cada estilista.",
    icon: <Clock className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-hours"]',
    targetTab: "hours",
    position: "bottom",
  },
  {
    id: "nav-settings",
    title: "Ajustes",
    description: "Personaliza tu perfil, colores, logo y toda la información de tu negocio.",
    icon: <Settings className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-settings"]',
    targetTab: "settings",
    position: "bottom",
  },
  {
    id: "complete",
    title: "¡Listo para empezar!",
    description: "Ya conoces todas las funciones. Pulsa el botón de Tour guiado en cualquier momento para repetirlo.",
    icon: <CheckCircle className="h-6 w-6" />,
    position: "center",
  },
];

const STORAGE_KEY = "glowapp_admin_tour_completed";

interface InteractiveTourProps {
  onTabChange?: (tab: string) => void;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function InteractiveTour({ onTabChange }: InteractiveTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(true);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setHasSeenTour(false);
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const updateSpotlight = useCallback(() => {
    const step = TOUR_STEPS[currentStep];
    
    if (!step.targetSelector || step.position === "center") {
      setSpotlightRect(null);
      setTooltipPosition({ top: window.innerHeight / 2, left: window.innerWidth / 2 });
      return;
    }

    const element = document.querySelector(step.targetSelector);
    if (!element) {
      setSpotlightRect(null);
      setTooltipPosition({ top: window.innerHeight / 2, left: window.innerWidth / 2 });
      return;
    }

    const rect = element.getBoundingClientRect();
    const padding = 8;

    setSpotlightRect({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Scroll element into view if needed
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // Calculate tooltip position
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    let tooltipTop = 0;
    let tooltipLeft = 0;

    switch (step.position) {
      case "bottom":
        tooltipTop = rect.bottom + padding + 16;
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "top":
        tooltipTop = rect.top - padding - tooltipHeight - 16;
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
        tooltipLeft = rect.left - padding - tooltipWidth - 16;
        break;
      case "right":
        tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
        tooltipLeft = rect.right + padding + 16;
        break;
      default:
        tooltipTop = rect.bottom + padding + 16;
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
    }

    // Clamp within viewport
    tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 16));
    tooltipTop = Math.max(16, Math.min(tooltipTop, window.innerHeight - tooltipHeight - 16));

    setTooltipPosition({ top: tooltipTop, left: tooltipLeft });
  }, [currentStep]);

  useEffect(() => {
    if (isActive) {
      // Small delay to ensure tab content has rendered
      const timer = setTimeout(updateSpotlight, 100);
      
      // Also update on resize
      window.addEventListener("resize", updateSpotlight);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", updateSpotlight);
      };
    }
  }, [isActive, currentStep, updateSpotlight]);

  const startTour = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const nextStep = () => {
    const nextIdx = currentStep + 1;
    if (nextIdx < TOUR_STEPS.length) {
      const step = TOUR_STEPS[nextIdx];
      if (step.targetTab && onTabChange) {
        onTabChange(step.targetTab);
      }
      setCurrentStep(nextIdx);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevIdx = currentStep - 1;
      const step = TOUR_STEPS[prevIdx];
      if (step.targetTab && onTabChange) {
        onTabChange(step.targetTab);
      }
      setCurrentStep(prevIdx);
    }
  };

  const completeTour = () => {
    setIsActive(false);
    setHasSeenTour(true);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const skipTour = () => {
    completeTour();
  };

  const step = TOUR_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isCentered = step.position === "center";

  return (
    <>
      {/* Start Tour Button */}
      {hasSeenTour && !isActive && (
        <Button
          variant="outline"
          size="sm"
          onClick={startTour}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Tour guiado
        </Button>
      )}

      {/* Auto-prompt for new users */}
      {!hasSeenTour && !isActive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 right-4 z-50 bg-primary text-primary-foreground rounded-2xl p-4 shadow-lg max-w-xs"
        >
          <p className="text-sm font-medium mb-3">
            ¿Primera vez aquí? Te guiamos paso a paso por todas las funciones.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setHasSeenTour(true);
                localStorage.setItem(STORAGE_KEY, "true");
              }}
              className="flex-1"
            >
              Omitir
            </Button>
            <Button
              size="sm"
              onClick={startTour}
              className="flex-1 bg-white text-primary hover:bg-white/90"
            >
              Empezar tour
            </Button>
          </div>
        </motion.div>
      )}

      {/* Interactive Tour Overlay */}
      <AnimatePresence>
        {isActive && (
          <>
            {/* Dark overlay with spotlight cutout */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] pointer-events-auto"
              onClick={(e) => {
                // Only close if clicking outside spotlight
                if (!spotlightRect) return;
                const rect = spotlightRect;
                const x = e.clientX;
                const y = e.clientY;
                const isInSpotlight = 
                  x >= rect.left && 
                  x <= rect.left + rect.width && 
                  y >= rect.top && 
                  y <= rect.top + rect.height;
                if (!isInSpotlight) {
                  // Don't close, just prevent propagation
                  e.stopPropagation();
                }
              }}
            >
              {/* SVG overlay with hole */}
              <svg
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: "none" }}
              >
                <defs>
                  <mask id="spotlight-mask">
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    {spotlightRect && (
                      <rect
                        x={spotlightRect.left}
                        y={spotlightRect.top}
                        width={spotlightRect.width}
                        height={spotlightRect.height}
                        rx="12"
                        fill="black"
                      />
                    )}
                  </mask>
                </defs>
                <rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill="rgba(0, 0, 0, 0.75)"
                  mask="url(#spotlight-mask)"
                />
              </svg>

              {/* Spotlight glow effect */}
              {spotlightRect && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="absolute rounded-xl"
                  style={{
                    top: spotlightRect.top,
                    left: spotlightRect.left,
                    width: spotlightRect.width,
                    height: spotlightRect.height,
                    boxShadow: "0 0 0 4px hsl(var(--primary)), 0 0 30px 10px hsl(var(--primary) / 0.4)",
                    pointerEvents: "none",
                  }}
                />
              )}
            </motion.div>

            {/* Tooltip */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: isCentered ? 0 : 20, scale: isCentered ? 0.9 : 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "fixed z-[101] bg-background rounded-2xl shadow-2xl border border-border/50",
                isCentered ? "max-w-md w-[90%] p-6" : "max-w-xs w-80 p-4"
              )}
              style={
                isCentered
                  ? {
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                    }
                  : {
                      top: tooltipPosition.top,
                      left: tooltipPosition.left,
                    }
              }
            >
              {/* Close button */}
              <button
                onClick={skipTour}
                className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Icon */}
              <div className={cn(
                "flex items-center gap-3 mb-3",
                isCentered && "justify-center flex-col"
              )}>
                <div className={cn(
                  "rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary",
                  isCentered ? "h-16 w-16" : "h-10 w-10"
                )}>
                  {step.icon}
                </div>
                {!isCentered && (
                  <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                )}
              </div>

              {isCentered && (
                <h3 className="text-xl font-bold text-foreground text-center mb-2">{step.title}</h3>
              )}

              <p className={cn(
                "text-muted-foreground text-sm",
                isCentered && "text-center"
              )}>
                {step.description}
              </p>

              {step.action && (
                <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                  <MousePointerClick className="h-3 w-3" />
                  <span>{step.action}</span>
                </div>
              )}

              {/* Progress */}
              <div className="flex justify-center gap-1 mt-4 mb-3">
                {TOUR_STEPS.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      idx === currentStep
                        ? "w-5 bg-primary"
                        : idx < currentStep
                          ? "w-1.5 bg-primary/50"
                          : "w-1.5 bg-muted"
                    )}
                  />
                ))}
              </div>

              {/* Step counter */}
              <p className="text-center text-xs text-muted-foreground mb-3">
                {currentStep + 1} de {TOUR_STEPS.length}
              </p>

              {/* Navigation */}
              <div className="flex gap-2">
                {!isFirst && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    className="flex-1 gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Anterior
                  </Button>
                )}
                {isFirst && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipTour}
                    className="flex-1 text-muted-foreground"
                  >
                    Omitir
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={nextStep}
                  className="flex-1 gap-1"
                >
                  {isLast ? "Finalizar" : "Siguiente"}
                  {!isLast && <ArrowRight className="h-3 w-3" />}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
