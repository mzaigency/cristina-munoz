import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  CreditCard,
  MessageCircle,
  Camera,
  BarChart3,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "motion/react";

interface TrainingChecklistProps {
  tenantId: string;
  onNavigate?: (tab: string) => void;
}

interface TrainingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  navigateTo?: string;
}

const TRAINING_STEPS: TrainingStep[] = [
  {
    id: "services",
    title: "Configura tus servicios",
    description: "Añade los servicios que ofreces con precios y duraciones",
    icon: <Calendar className="h-5 w-5" />,
    navigateTo: "team",
  },
  {
    id: "first_booking",
    title: "Crea tu primera cita",
    description: "Prueba a crear una cita desde la agenda",
    icon: <Calendar className="h-5 w-5" />,
    navigateTo: "agenda",
  },
  {
    id: "cash_register",
    title: "Realiza tu primer cobro",
    description: "Aprende a usar la caja registradora",
    icon: <CreditCard className="h-5 w-5" />,
    navigateTo: "business",
  },
  {
    id: "first_message",
    title: "Envía tu primer mensaje",
    description: "Descubre el chat directo con clientes",
    icon: <MessageCircle className="h-5 w-5" />,
    navigateTo: "communication",
  },
  {
    id: "first_story",
    title: "Publica tu primer Story",
    description: "Muestra tus trabajos y atrae nuevos clientes",
    icon: <Camera className="h-5 w-5" />,
    navigateTo: "communication",
  },
  {
    id: "review_analytics",
    title: "Revisa tus estadísticas",
    description: "Consulta el rendimiento de tu primera semana",
    icon: <BarChart3 className="h-5 w-5" />,
    navigateTo: "business",
  },
];

export function TrainingChecklist({ tenantId, onNavigate }: TrainingChecklistProps) {
  const [stepsCompleted, setStepsCompleted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProgress();
  }, [tenantId]);

  const fetchProgress = async () => {
    try {
      const { data } = await supabase
        .from("tenant_onboarding_progress")
        .select("steps_completed")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (data?.steps_completed) {
        setStepsCompleted(data.steps_completed as Record<string, boolean>);
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = async (stepId: string) => {
    const newSteps = { ...stepsCompleted, [stepId]: !stepsCompleted[stepId] };
    setStepsCompleted(newSteps);

    try {
      const { data: existing } = await supabase
        .from("tenant_onboarding_progress")
        .select("id")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("tenant_onboarding_progress")
          .update({ steps_completed: newSteps })
          .eq("tenant_id", tenantId);
      } else {
        await supabase
          .from("tenant_onboarding_progress")
          .insert({ tenant_id: tenantId, steps_completed: newSteps });
      }
    } catch (error) {
      console.error("Error saving progress:", error);
    }

    const completedCount = Object.values(newSteps).filter(Boolean).length;
    if (completedCount === TRAINING_STEPS.length) {
      toast({
        title: "🎉 ¡Formación completada!",
        description: "Ya dominas todas las herramientas principales",
      });
    }
  };

  const completedCount = Object.values(stepsCompleted).filter(Boolean).length;
  const progress = (completedCount / TRAINING_STEPS.length) * 100;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">Tu progreso</h3>
              <p className="text-xs text-muted-foreground">
                {completedCount}/{TRAINING_STEPS.length} pasos completados
              </p>
            </div>
            <span className="text-2xl font-bold text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-2">
        {TRAINING_STEPS.map((step, index) => {
          const isCompleted = stepsCompleted[step.id];
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={cn(
                  "transition-all",
                  isCompleted && "bg-primary/5 border-primary/20"
                )}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleStep(step.id)}
                      className="shrink-0 transition-transform active:scale-90"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground/40" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isCompleted && "line-through text-muted-foreground"
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                    </div>
                    {step.navigateTo && !isCompleted && onNavigate && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onNavigate(step.navigateTo!)}
                        className="shrink-0 h-8 w-8 p-0"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
