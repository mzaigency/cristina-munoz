import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Crown, Check, X, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";

const FEATURE_LABELS: Record<string, string> = {
  stories: "Stories",
  messages: "Mensajes directos",
  cash_register: "Caja registradora",
  advanced_analytics: "Stats avanzados",
  promotions: "Promociones",
  packages: "Paquetes de servicios",
  pdf_reports: "PDFs y reportes",
  commissions: "Comisiones estilistas",
  monthly_goals: "Metas mensuales",
  waitlist: "Lista de espera",
  products: "Productos",
};

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: string;
  targetPlan: string;
  feature?: string;
  tenantId: string;
}

export const UpgradePrompt = ({
  open,
  onOpenChange,
  currentPlan,
  targetPlan,
  feature,
  tenantId,
}: UpgradePromptProps) => {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const { plans, getPlan } = useSubscriptionPlans();

  const currentData = getPlan(currentPlan);
  const targetData = getPlan(targetPlan);

  const buildFeatures = (plan: typeof currentData) => {
    if (!plan) return [];
    const list: string[] = [];
    const ms = plan.max_stylists;
    const sv = plan.max_services;
    list.push(ms && ms >= 999 ? "Estilistas ilimitados" : `${ms || 1} estilista${(ms || 1) > 1 ? "s" : ""}`);
    list.push(sv && sv >= 999 ? "Servicios ilimitados" : `${sv || 15} servicios`);
    if (plan.features) {
      Object.entries(plan.features).forEach(([key, enabled]) => {
        if (enabled && FEATURE_LABELS[key]) list.push(FEATURE_LABELS[key]);
      });
    }
    return list;
  };

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("upgrade-subscription", {
        body: { tenantId, planSlug: targetPlan, billingCycle: "monthly" },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error upgrading:", error);
      toast.error("Error al procesar la mejora. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const currentName = currentData?.name || currentPlan;
  const targetName = targetData?.name || targetPlan;
  const currentPrice = currentData?.monthly_price || 0;
  const targetPrice = targetData?.monthly_price || 0;
  const targetFeatures = buildFeatures(targetData);

  const content = (
    <div className="flex flex-col gap-6 pb-safe">
      <div className="flex flex-col items-center text-center gap-3 pt-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-glow-warn to-glow-warn flex items-center justify-center shadow-lg"
        >
          <Crown className="w-8 h-8 text-white" />
        </motion.div>
        <div>
          <h3 className="text-xl font-semibold text-on-surface">
            {feature ? `Desbloquea ${feature}` : "Mejora tu plan"}
          </h3>
          <p className="text-sm text-outline mt-1">
            Accede a más funcionalidades para hacer crecer tu negocio
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs text-outline mb-1">Plan actual</p>
          <p className="font-semibold text-on-surface">{currentName}</p>
          <p className="text-lg font-bold text-on-surface mt-2">
            {currentPrice}€<span className="text-xs font-normal text-outline">/mes</span>
          </p>
        </div>
        <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-bl-lg font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Recomendado
          </div>
          <p className="text-xs text-outline mb-1">Mejora a</p>
          <p className="font-semibold text-primary">{targetName}</p>
          <p className="text-lg font-bold text-on-surface mt-2">
            {targetPrice}€<span className="text-xs font-normal text-outline">/mes</span>
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-on-surface">Incluido en {targetName}:</p>
        <div className="grid gap-2">
          {targetFeatures.map((feat, index) => (
            <motion.div
              key={feat}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-2 text-sm"
            >
              <div className="w-5 h-5 rounded-full bg-glow-ok/10 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-glow-ok-ink" />
              </div>
              <span className="text-on-surface">{feat}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <button className="glow-btn glow-btn--primary glow-btn--block text-base font-semibold gap-2" onClick={handleUpgrade} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<>Mejorar a {targetName}<ArrowRight className="w-4 h-4" /></>)}
        </button>
        <button className="glow-btn glow-btn--ghost text-outline" onClick={() => onOpenChange(false)}>
          Ahora no
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
          <SheetHeader className="sr-only"><SheetTitle>Mejora tu plan</SheetTitle></SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="sr-only"><DialogTitle>Mejora tu plan</DialogTitle></DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
