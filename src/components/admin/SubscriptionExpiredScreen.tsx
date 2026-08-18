import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  CreditCard, 
  Loader2, 
  LogOut,
  Sparkles,
  Crown,
  Zap,
  ArrowRight,
  Mail
} from "lucide-react";
import { UpgradePrompt } from "./UpgradePrompt";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";

interface SubscriptionExpiredScreenProps {
  tenantId: string;
  tenantName: string;
  currentPlan?: string;
}

type PlanSlug = "starter" | "pro" | "business";

const PLAN_ICONS: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  starter: { icon: <Zap className="h-6 w-6" />, color: "text-[var(--gp-info)]", bgColor: "bg-blue-500/10" },
  pro: { icon: <Crown className="h-6 w-6" />, color: "text-[var(--gp-warn)]", bgColor: "bg-amber-500/10" },
  business: { icon: <Sparkles className="h-6 w-6" />, color: "text-[var(--gp-purple)]", bgColor: "bg-purple-500/10" },
};

export function SubscriptionExpiredScreen({ 
  tenantId, 
  tenantName,
  currentPlan = "starter" 
}: SubscriptionExpiredScreenProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanSlug>("starter");
  const { plans } = useSubscriptionPlans();

  const handleSignOut = async () => {
    await supabase.auth.signOut({ scope: "local" });
    navigate("/auth", { replace: true });
  };

  const handleUpgrade = (plan: PlanSlug) => {
    setSelectedPlan(plan);
    setUpgradeOpen(true);
  };

  const planSlug = (currentPlan?.toLowerCase() || "starter") as PlanSlug;

  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col"
      style={{ 
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)" 
      }}
    >
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b">
        <h1 className="font-bold text-lg truncate">{tenantName}</h1>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Salir
        </Button>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Warning Icon */}
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-amber-500/10">
              <AlertTriangle className="h-12 w-12 text-[var(--gp-warn)]" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Suscripción Expirada</h2>
            <p className="text-muted-foreground">
              Tu suscripción ha expirado. Renueva para seguir gestionando tu negocio.
            </p>
          </div>

          {/* What's affected */}
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <h3 className="font-medium text-sm mb-2">Sin suscripción activa:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Tu página web no es visible para clientes</li>
                <li>• No puedes recibir nuevas reservas</li>
                <li>• No tienes acceso al panel de gestión</li>
                <li>• Tus datos están seguros y no se eliminan</li>
              </ul>
            </CardContent>
          </Card>

          {/* Plan options */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-center">Elige un plan para reactivar</h3>
            {plans.map((plan) => {
              const icons = PLAN_ICONS[plan.slug] || PLAN_ICONS.starter;
              return (
                <button
                  key={plan.id}
                  onClick={() => handleUpgrade(plan.slug as PlanSlug)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${icons.bgColor} ${icons.color}`}>
                      {icons.icon}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">{plan.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Desde {plan.monthly_price}€/mes
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              );
            })}
          </div>

          {/* Contact support */}
          <div className="text-center pt-4">
            <p className="text-xs text-muted-foreground mb-2">
              ¿Necesitas ayuda o tienes preguntas?
            </p>
            <Button variant="link" size="sm" asChild className="gap-1">
              <a href="mailto:gglowapp@gmail.com">
                <Mail className="h-3 w-3" />
                Contactar soporte
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradePrompt
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        currentPlan={planSlug}
        targetPlan={selectedPlan}
        tenantId={tenantId}
      />
    </div>
  );
}
