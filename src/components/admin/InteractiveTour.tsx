import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
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
}

// Simplified tour matching the new 7-tab structure
const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido al Panel!",
    description: "Te guiamos por las 6 secciones principales. Es rápido, ¡solo 2 minutos!",
    icon: <Sparkles className="h-6 w-6" />,
    tips: ["Cada sección tiene sub-opciones", "Puedes repetir el tour cuando quieras"],
  },
  {
    id: "dashboard",
    title: "📊 Inicio",
    description: "Tu centro de control. Ve citas del día, ingresos y accede rápido a las acciones más comunes.",
    icon: <LayoutDashboard className="h-6 w-6" />,
    targetTab: "dashboard",
    tips: ["Resumen visual del día", "Acciones rápidas con un toque"],
  },
  {
    id: "agenda",
    title: "📅 Agenda",
    description: "Calendario visual + Lista de espera. Gestiona todas las citas y clientes que esperan hueco.",
    icon: <Calendar className="h-6 w-6" />,
    targetTab: "agenda",
    tips: ["Arrastra citas para moverlas", "Lista de espera integrada"],
  },
  {
    id: "clients",
    title: "👥 Clientes",
    description: "CRM completo con historial, notas, etiquetas VIP y preferencias de cada cliente.",
    icon: <UserCircle className="h-6 w-6" />,
    targetTab: "clients",
    tips: ["Busca por nombre o teléfono", "Etiquetas y notas privadas"],
  },
  {
    id: "business",
    title: "💰 Negocio",
    description: "Todo lo financiero: Caja, Promociones, Paquetes, Productos, Objetivos y Estadísticas.",
    icon: <Wallet className="h-6 w-6" />,
    targetTab: "business",
    tips: ["Cobros y descuentos", "Informes PDF descargables", "Objetivos mensuales"],
  },
  {
    id: "team",
    title: "✂️ Equipo",
    description: "Gestiona estilistas, servicios, comisiones y horarios de apertura.",
    icon: <Users className="h-6 w-6" />,
    targetTab: "team",
    tips: ["Cada estilista con su color", "Comisiones automáticas", "Horarios personalizados"],
  },
  {
    id: "communication",
    title: "💬 Comunicación",
    description: "Mensajes directos con clientes, Stories del salón y gestión de reseñas.",
    icon: <MessageCircle className="h-6 w-6" />,
    targetTab: "communication",
    tips: ["Chat en tiempo real", "Stories de 24h", "Moderar reseñas"],
  },
  {
    id: "settings",
    title: "⚙️ Ajustes",
    description: "Personaliza tu salón: colores, logo, notificaciones y seguridad.",
    icon: <Settings className="h-6 w-6" />,
    targetTab: "settings",
    tips: ["Tema personalizado", "Alertas configurables"],
  },
  {
    id: "complete",
    title: "¡Listo para empezar!",
    description: "Ya conoces las secciones principales. Usa el botón ❓ para más ayuda en cualquier momento.",
    icon: <CheckCircle className="h-6 w-6" />,
    tips: ["Explora cada sección", "Cada una tiene sub-pestañas"],
  },
];

const STORAGE_KEY = "glowapp_admin_tour_v3_completed";

interface InteractiveTourProps {
  onTabChange?: (tab: string) => void;
}

export function InteractiveTour({ onTabChange }: InteractiveTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(true);
  const isMobile = useIsMobile();

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
          className={cn(
            "fixed z-50 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl p-4 shadow-2xl border border-primary-foreground/10",
            isMobile 
              ? "bottom-20 left-4 right-4 max-w-none" 
              : "bottom-24 right-4 max-w-xs"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">¿Primera vez aquí?</span>
          </div>
          <p className="text-sm opacity-90 mb-3">
            Te guiamos en 2 minutos por todas las funciones.
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

      {/* Tour Modal - Optimized for mobile */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) skipTour();
            }}
          >
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className={cn(
                "bg-background rounded-2xl shadow-2xl overflow-hidden",
                isMobile ? "w-full max-w-sm" : "w-[380px]"
              )}
            >
              {/* Progress bar */}
              <div className="h-1 bg-muted">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-primary/10 to-accent/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    {step.icon}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipTour}
                    className="h-8 w-8 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Tips */}
              {step.tips && step.tips.length > 0 && (
                <div className="px-4 sm:px-5 py-3 bg-muted/30 border-t">
                  <div className="space-y-1.5">
                    {step.tips.map((tip, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <span className="text-primary">✓</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="p-4 sm:p-5 border-t flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevStep}
                  disabled={isFirst}
                  className="gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>

                <div className="flex gap-1">
                  {TOUR_STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const targetStep = TOUR_STEPS[i];
                        if (targetStep.targetTab && onTabChange) {
                          onTabChange(targetStep.targetTab);
                        }
                        setCurrentStep(i);
                      }}
                      className={cn(
                        "h-2 rounded-full transition-all",
                        i === currentStep 
                          ? "w-6 bg-primary" 
                          : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      )}
                    />
                  ))}
                </div>

                <Button
                  size="sm"
                  onClick={isLast ? completeTour : nextStep}
                  className="gap-1"
                >
                  {isLast ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Listo</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Siguiente</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* Step counter */}
              <div className="px-4 sm:px-5 pb-3 text-center">
                <span className="text-xs text-muted-foreground">
                  {currentStep + 1} de {TOUR_STEPS.length}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
