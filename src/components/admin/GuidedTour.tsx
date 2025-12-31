import { useState, useEffect } from "react";
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
  Sparkles,
  CheckCircle,
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  targetTab?: string;
  highlight?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido a tu Panel!",
    description: "Te guiaremos por las funciones principales para que saques el máximo partido a tu CRM.",
    icon: <Sparkles className="h-8 w-8" />,
  },
  {
    id: "calendar",
    title: "Agenda",
    description: "Aquí gestionas todas tus citas. Puedes ver la agenda por día, semana o mes. Haz clic en un hueco vacío para crear una nueva cita.",
    icon: <Calendar className="h-8 w-8" />,
    targetTab: "agenda",
  },
  {
    id: "cash",
    title: "Caja Registradora",
    description: "Registra los cobros de tus servicios. Puedes añadir productos, aplicar descuentos y gestionar diferentes métodos de pago.",
    icon: <Wallet className="h-8 w-8" />,
    targetTab: "caja",
  },
  {
    id: "reviews",
    title: "Reseñas",
    description: "Gestiona las opiniones de tus clientes. Puedes moderar las reseñas antes de que se publiquen en tu perfil.",
    icon: <Star className="h-8 w-8" />,
    targetTab: "reseñas",
  },
  {
    id: "messages",
    title: "Mensajes",
    description: "Mantén el contacto directo con tus clientes. Responde consultas y confirma citas desde aquí.",
    icon: <MessageCircle className="h-8 w-8" />,
    targetTab: "mensajes",
  },
  {
    id: "stories",
    title: "Stories",
    description: "Comparte fotos de tus trabajos. Los stories duran 24h y aparecen en el feed de GlowApp.",
    icon: <ImageIcon className="h-8 w-8" />,
    targetTab: "stories",
  },
  {
    id: "stats",
    title: "Estadísticas",
    description: "Analiza el rendimiento de tu negocio con métricas de ingresos, citas y clientes.",
    icon: <BarChart3 className="h-8 w-8" />,
    targetTab: "estadísticas",
  },
  {
    id: "settings",
    title: "Ajustes",
    description: "Personaliza tu perfil, horarios, servicios y equipo desde esta sección.",
    icon: <Settings className="h-8 w-8" />,
    targetTab: "ajustes",
  },
  {
    id: "complete",
    title: "¡Listo para empezar!",
    description: "Ya conoces las funciones principales. Si tienes dudas, pulsa el botón de ayuda en cualquier momento.",
    icon: <CheckCircle className="h-8 w-8" />,
  },
];

const STORAGE_KEY = "glowapp_admin_tour_completed";

interface GuidedTourProps {
  onTabChange?: (tab: string) => void;
}

export function GuidedTour({ onTabChange }: GuidedTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setHasSeenTour(false);
      // Auto-start tour for new users after a delay
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const nextStep = () => {
    const nextIdx = currentStep + 1;
    if (nextIdx < TOUR_STEPS.length) {
      setCurrentStep(nextIdx);
      const step = TOUR_STEPS[nextIdx];
      if (step.targetTab && onTabChange) {
        onTabChange(step.targetTab);
      }
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevIdx = currentStep - 1;
      setCurrentStep(prevIdx);
      const step = TOUR_STEPS[prevIdx];
      if (step.targetTab && onTabChange) {
        onTabChange(step.targetTab);
      }
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

  return (
    <>
      {/* Start Tour Button - only show if tour was completed but user wants to restart */}
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
            ¿Primera vez aquí? Te mostramos cómo funciona todo.
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

      {/* Tour Modal */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-background rounded-3xl p-6 max-w-md w-full shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={skipTour}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary">
                  {step.icon}
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 mb-6">
                {TOUR_STEPS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentStep 
                        ? "w-6 bg-primary" 
                        : idx < currentStep 
                          ? "w-1.5 bg-primary/50" 
                          : "w-1.5 bg-secondary"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                {!isFirst && (
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1"
                  >
                    Anterior
                  </Button>
                )}
                {isFirst && (
                  <Button
                    variant="ghost"
                    onClick={skipTour}
                    className="flex-1 text-muted-foreground"
                  >
                    Omitir
                  </Button>
                )}
                <Button
                  onClick={nextStep}
                  className="flex-1 gap-2"
                >
                  {isLast ? "Finalizar" : "Siguiente"}
                  {!isLast && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
