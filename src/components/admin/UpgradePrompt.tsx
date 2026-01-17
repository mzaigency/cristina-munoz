import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Crown, Check, X, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface PlanDetails {
  name: string;
  slug: string;
  monthlyPrice: number;
  features: string[];
}

const PLANS: Record<string, PlanDetails> = {
  starter: {
    name: "Starter",
    slug: "starter",
    monthlyPrice: 29,
    features: [
      "1 estilista",
      "15 servicios",
      "Landing completa",
      "Calendario y reservas",
      "CRM básico",
      "Stories",
      "Mensajes directos",
    ],
  },
  pro: {
    name: "Pro",
    slug: "pro",
    monthlyPrice: 49,
    features: [
      "3 estilistas",
      "50 servicios",
      "Todo de Starter +",
      "Caja registradora",
      "Stats avanzados",
      "PDFs y reportes",
      "Promociones",
      "Paquetes de servicios",
    ],
  },
  business: {
    name: "Business",
    slug: "business",
    monthlyPrice: 89,
    features: [
      "Estilistas ilimitados",
      "Servicios ilimitados",
      "Todo de Pro +",
      "Comisiones estilistas",
      "Metas mensuales",
      "Lista de espera",
    ],
  },
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
  
  const current = PLANS[currentPlan] || PLANS.starter;
  const target = PLANS[targetPlan] || PLANS.pro;

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke("upgrade-subscription", {
        body: { 
          tenantId,
          planSlug: targetPlan,
          billingCycle: "monthly"
        },
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

  const content = (
    <div className="flex flex-col gap-6 pb-safe">
      {/* Header con icono */}
      <div className="flex flex-col items-center text-center gap-3 pt-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg"
        >
          <Crown className="w-8 h-8 text-white" />
        </motion.div>
        <div>
          <h3 className="text-xl font-semibold text-foreground">
            {feature ? `Desbloquea ${feature}` : "Mejora tu plan"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Accede a más funcionalidades para hacer crecer tu negocio
          </p>
        </div>
      </div>

      {/* Comparativa de planes */}
      <div className="grid grid-cols-2 gap-3">
        {/* Plan actual */}
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground mb-1">Plan actual</p>
          <p className="font-semibold text-foreground">{current.name}</p>
          <p className="text-lg font-bold text-foreground mt-2">
            {current.monthlyPrice}€<span className="text-xs font-normal text-muted-foreground">/mes</span>
          </p>
        </div>

        {/* Plan objetivo */}
        <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-bl-lg font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Recomendado
          </div>
          <p className="text-xs text-muted-foreground mb-1">Mejora a</p>
          <p className="font-semibold text-primary">{target.name}</p>
          <p className="text-lg font-bold text-foreground mt-2">
            {target.monthlyPrice}€<span className="text-xs font-normal text-muted-foreground">/mes</span>
          </p>
        </div>
      </div>

      {/* Features del plan objetivo */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Incluido en {target.name}:</p>
        <div className="grid gap-2">
          {target.features.map((feat, index) => (
            <motion.div
              key={feat}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-2 text-sm"
            >
              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-foreground">{feat}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-2 mt-2">
        <Button 
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full h-12 text-base font-semibold gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Mejorar a {target.name}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => onOpenChange(false)}
          className="text-muted-foreground"
        >
          Ahora no
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>Mejora tu plan</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>Mejora tu plan</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
