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
  UserCircle,
  Gift,
  Target,
  Percent,
  UserPlus,
  BellRing,
  LayoutDashboard,
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
  tips?: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido a tu Panel de Control!",
    description: "Te guiaremos paso a paso por todas las funciones de tu CRM profesional. Cada sección está diseñada para hacer tu trabajo más fácil.",
    icon: <Sparkles className="h-6 w-6" />,
    position: "center",
    tips: ["El tour dura unos 2 minutos", "Puedes saltarlo y repetirlo cuando quieras"],
  },
  {
    id: "nav-dashboard",
    title: "Panel de Inicio",
    description: "Tu centro de control. Ve de un vistazo las citas de hoy, ingresos recientes y acciones rápidas.",
    icon: <LayoutDashboard className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-dashboard"]',
    targetTab: "dashboard",
    position: "bottom",
    tips: ["Acceso rápido a crear citas", "Resumen de métricas importantes"],
  },
  {
    id: "nav-calendar",
    title: "Agenda de Citas",
    description: "Tu calendario visual. Gestiona todas las citas organizadas por estilista y hora.",
    icon: <Calendar className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-calendar"]',
    targetTab: "calendar",
    position: "bottom",
    tips: ["Vista por día o semana", "Arrastra citas para moverlas", "Filtra por estilista"],
  },
  {
    id: "nav-clients",
    title: "CRM de Clientes",
    description: "Base de datos de clientes con historial completo, preferencias y notas privadas.",
    icon: <UserCircle className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-clients"]',
    targetTab: "clients",
    position: "bottom",
    tips: ["Etiquetas VIP y frecuente", "Historial de visitas", "Estilista favorito"],
  },
  {
    id: "nav-cash",
    title: "Caja Registradora",
    description: "Registra cobros, gestiona métodos de pago y genera reportes de ventas.",
    icon: <Wallet className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-cash"]',
    targetTab: "cash",
    position: "bottom",
    tips: ["Efectivo, tarjeta o mixto", "Descuentos y propinas", "Exportar a Excel"],
  },
  {
    id: "nav-messages",
    title: "Centro de Mensajes",
    description: "Comunicación directa con clientes. Responde consultas y confirma citas.",
    icon: <MessageCircle className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-messages"]',
    targetTab: "messages",
    position: "bottom",
    tips: ["Notificaciones en tiempo real", "Historial de conversaciones"],
  },
  {
    id: "nav-promotions",
    title: "Promociones y Descuentos",
    description: "Crea cupones, códigos promocionales y programas de fidelidad.",
    icon: <Gift className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-promotions"]',
    targetTab: "promotions",
    position: "bottom",
    tips: ["Descuentos por porcentaje o fijo", "Puntos de fidelidad", "Códigos compartibles"],
  },
  {
    id: "nav-waitlist",
    title: "Lista de Espera",
    description: "Gestiona clientes que esperan hueco. Notificación automática cuando hay disponibilidad.",
    icon: <UserPlus className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-waitlist"]',
    targetTab: "waitlist",
    position: "bottom",
    tips: ["Prioridad por cliente", "Preferencias de horario"],
  },
  {
    id: "nav-stories",
    title: "Stories del Salón",
    description: "Comparte fotos de tus trabajos. Los stories duran 24h y aparecen en el feed.",
    icon: <ImageIcon className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-stories"]',
    targetTab: "stories",
    position: "bottom",
    tips: ["Estadísticas de visualizaciones", "Encuestas interactivas"],
  },
  {
    id: "nav-goals",
    title: "Objetivos Mensuales",
    description: "Define metas de facturación, citas y nuevos clientes. Visualiza tu progreso.",
    icon: <Target className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-goals"]',
    targetTab: "goals",
    position: "bottom",
    tips: ["Predicción de cumplimiento", "Barra de progreso visual"],
  },
  {
    id: "nav-stats",
    title: "Estadísticas",
    description: "Analiza el rendimiento con métricas de ingresos, citas y tendencias.",
    icon: <BarChart3 className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-security"]',
    targetTab: "security",
    position: "bottom",
    tips: ["Comparativa mensual", "Servicios más populares"],
  },
  {
    id: "nav-services",
    title: "Gestión de Servicios",
    description: "Configura servicios con nombres, precios, duraciones y categorías.",
    icon: <Scissors className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-services"]',
    targetTab: "services",
    position: "bottom",
    tips: ["Servicios compuestos", "Ordenar por categoría"],
  },
  {
    id: "nav-packages",
    title: "Paquetes de Servicios",
    description: "Crea combos con descuento automático. Pack novia, familiar, etc.",
    icon: <Package className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-packages"]',
    targetTab: "packages",
    position: "bottom",
    tips: ["Descuento automático", "Servicios combinados"],
  },
  {
    id: "nav-team",
    title: "Gestión de Equipo",
    description: "Administra estilistas, asigna colores y gestiona permisos.",
    icon: <Users className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-stylists"]',
    targetTab: "stylists",
    position: "bottom",
    tips: ["Color por estilista", "Foto de perfil"],
  },
  {
    id: "nav-commissions",
    title: "Comisiones",
    description: "Define porcentajes de comisión por estilista. Genera informes de ganancias.",
    icon: <Percent className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-commissions"]',
    targetTab: "commissions",
    position: "bottom",
    tips: ["Fijo, porcentaje o mixto", "Cálculo automático"],
  },
  {
    id: "nav-hours",
    title: "Horarios",
    description: "Define horarios de apertura del salón y de cada estilista.",
    icon: <Clock className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-hours"]',
    targetTab: "hours",
    position: "bottom",
    tips: ["Horario por día", "Pausas de comida"],
  },
  {
    id: "nav-notifications",
    title: "Alertas y Notificaciones",
    description: "Configura qué notificaciones recibir: nuevas citas, mensajes, cancelaciones.",
    icon: <BellRing className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-notifications"]',
    targetTab: "notifications",
    position: "bottom",
    tips: ["Push y email", "Resumen diario"],
  },
  {
    id: "nav-settings",
    title: "Ajustes del Salón",
    description: "Personaliza colores, logo, información de contacto y landing page.",
    icon: <Settings className="h-6 w-6" />,
    targetSelector: '[data-tour-step="nav-settings"]',
    targetTab: "settings",
    position: "bottom",
    tips: ["Tema personalizado", "Redes sociales"],
  },
  {
    id: "complete",
    title: "¡Todo listo!",
    description: "Ya conoces todas las herramientas. Pulsa el botón de ayuda (?) en cualquier momento para más detalles.",
    icon: <CheckCircle className="h-6 w-6" />,
    position: "center",
    tips: ["Usa el botón ? para ayuda", "El tour está disponible siempre"],
  },
];

const STORAGE_KEY = "glowapp_admin_tour_v2_completed";

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

    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const tooltipWidth = 340;
    const tooltipHeight = 220;
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

    tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 16));
    tooltipTop = Math.max(16, Math.min(tooltipTop, window.innerHeight - tooltipHeight - 16));

    setTooltipPosition({ top: tooltipTop, left: tooltipLeft });
  }, [currentStep]);

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(updateSpotlight, 150);
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

  const goToStep = (idx: number) => {
    const step = TOUR_STEPS[idx];
    if (step.targetTab && onTabChange) {
      onTabChange(step.targetTab);
    }
    setCurrentStep(idx);
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
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  return (
    <>
      {/* Start Tour Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={startTour}
        className="h-8 w-8 sm:h-9 sm:w-9"
        title="Tour guiado"
      >
        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      {/* Auto-prompt for new users */}
      {!hasSeenTour && !isActive && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="fixed bottom-24 right-4 z-50 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl p-4 shadow-2xl max-w-xs border border-primary-foreground/10"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">¿Primera vez aquí?</span>
          </div>
          <p className="text-sm opacity-90 mb-3">
            Te guiamos paso a paso por todas las funciones del panel.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setHasSeenTour(true);
                localStorage.setItem(STORAGE_KEY, "true");
              }}
              className="flex-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
            >
              Omitir
            </Button>
            <Button
              size="sm"
              onClick={startTour}
              className="flex-1 bg-white text-primary hover:bg-white/90 shadow-md"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Empezar
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
            >
              <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
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
                  fill="rgba(0, 0, 0, 0.8)"
                  mask="url(#spotlight-mask)"
                />
              </svg>

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
                    boxShadow: "0 0 0 4px hsl(var(--primary)), 0 0 40px 15px hsl(var(--primary) / 0.5)",
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
                "fixed z-[101] bg-background rounded-2xl shadow-2xl border border-border/50 overflow-hidden",
                isCentered ? "max-w-md w-[90%]" : "max-w-sm w-[340px]"
              )}
              style={
                isCentered
                  ? { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
                  : { top: tooltipPosition.top, left: tooltipPosition.left }
              }
            >
              {/* Progress bar */}
              <div className="h-1 bg-muted">
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary to-primary/70"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className={cn("p-4", isCentered && "p-6")}>
                {/* Close button */}
                <button
                  onClick={skipTour}
                  className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Step counter */}
                <div className="text-[10px] text-muted-foreground mb-2">
                  Paso {currentStep + 1} de {TOUR_STEPS.length}
                </div>

                {/* Icon and Title */}
                <div className={cn("flex items-center gap-3 mb-3", isCentered && "justify-center flex-col")}>
                  <div className={cn(
                    "rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary",
                    isCentered ? "h-14 w-14" : "h-10 w-10"
                  )}>
                    {step.icon}
                  </div>
                  {!isCentered && (
                    <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                  )}
                </div>

                {isCentered && (
                  <h3 className="text-xl font-bold text-foreground text-center mb-2">{step.title}</h3>
                )}

                <p className={cn("text-muted-foreground text-sm mb-3", isCentered && "text-center")}>
                  {step.description}
                </p>

                {/* Tips */}
                {step.tips && step.tips.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-2.5 mb-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1.5">
                      <MousePointerClick className="h-3.5 w-3.5" />
                      Tips
                    </div>
                    <ul className="space-y-1">
                      {step.tips.map((tip, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-2">
                  {!isFirst && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevStep}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
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
                      Omitir tour
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={nextStep}
                    className="flex-1"
                  >
                    {isLast ? "Finalizar" : "Siguiente"}
                    {!isLast && <ArrowRight className="h-4 w-4 ml-1" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
