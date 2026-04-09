import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Sparkles, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface OnboardingChecklistProps {
  tenantId: string;
  onNavigate: (tab: string) => void;
}

const QUICK_STEPS = [
  { id: "services", label: "Configura servicios", tab: "catalog" },
  { id: "first_booking", label: "Crea una cita", tab: "agenda" },
  { id: "cash_register", label: "Primer cobro", tab: "agenda" },
  { id: "first_message", label: "Envía un mensaje", tab: "clients" },
  { id: "first_story", label: "Publica un Post", tab: "marketing" },
  { id: "review_analytics", label: "Revisa estadísticas", tab: "reports" },
];

export function OnboardingChecklist({ tenantId, onNavigate }: OnboardingChecklistProps) {
  const [stepsCompleted, setStepsCompleted] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState(false);
  const [isNewTenant, setIsNewTenant] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkEligibility();
  }, [tenantId]);

  const checkEligibility = async () => {
    try {
      // Check if tenant is less than 30 days old
      const { data: tenant } = await supabase
        .from("tenants")
        .select("created_at")
        .eq("id", tenantId)
        .single();

      if (!tenant) { setLoading(false); return; }

      const daysSinceCreation = Math.ceil(
        (Date.now() - new Date(tenant.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceCreation > 30) {
        setIsNewTenant(false);
        setLoading(false);
        return;
      }

      setIsNewTenant(true);

      // Fetch progress
      const { data: progress } = await supabase
        .from("tenant_onboarding_progress")
        .select("steps_completed, dismissed")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (progress) {
        setStepsCompleted((progress.steps_completed as Record<string, boolean>) || {});
        setDismissed(progress.dismissed || false);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    setDismissed(true);
    try {
      const { data: existing } = await supabase
        .from("tenant_onboarding_progress")
        .select("id")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("tenant_onboarding_progress")
          .update({ dismissed: true })
          .eq("tenant_id", tenantId);
      } else {
        await supabase
          .from("tenant_onboarding_progress")
          .insert({ tenant_id: tenantId, dismissed: true });
      }
    } catch (error) {
      console.error("Error dismissing:", error);
    }
  };

  if (loading || !isNewTenant || dismissed) return null;

  const completedCount = Object.values(stepsCompleted).filter(Boolean).length;
  const progress = (completedCount / QUICK_STEPS.length) * 100;

  if (completedCount === QUICK_STEPS.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Primeros pasos</h3>
                <p className="text-[11px] text-muted-foreground">
                  {completedCount}/{QUICK_STEPS.length} completados
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Progress value={progress} className="h-1.5 mb-3" />

          {/* Show first 3 incomplete steps */}
          <div className="space-y-1.5">
            {QUICK_STEPS.filter((s) => !stepsCompleted[s.id])
              .slice(0, 3)
              .map((step) => (
                <button
                  key={step.id}
                  onClick={() => onNavigate(step.tab)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  <span className="text-xs font-medium text-foreground flex-1">{step.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
          </div>

          <Button
            variant="link"
            size="sm"
            className="mt-2 h-auto p-0 text-xs"
            onClick={() => onNavigate("dashboard")}
          >
            Ver toda la formación →
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
