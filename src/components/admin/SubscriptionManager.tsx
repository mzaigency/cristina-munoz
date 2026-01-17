import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CreditCard,
  Calendar,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  Sparkles,
  Crown,
  Zap,
  Settings,
  Users,
  Scissors,
  ArrowRight
} from "lucide-react";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { PlanUsageBar } from "./PlanUsageBar";
import { UpgradePrompt } from "./UpgradePrompt";

interface SubscriptionInfo {
  plan: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

interface SubscriptionManagerProps {
  tenantId: string;
}

type PlanSlug = "starter" | "pro" | "business";

interface PlanDetails {
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  monthlyPrice: number;
  annualPrice: number;
}

const PLAN_DETAILS: Record<PlanSlug, PlanDetails> = {
  starter: {
    name: "Starter",
    icon: <Zap className="h-5 w-5" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    monthlyPrice: 29,
    annualPrice: 290
  },
  pro: {
    name: "Pro",
    icon: <Crown className="h-5 w-5" />,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    monthlyPrice: 49,
    annualPrice: 490
  },
  business: {
    name: "Business",
    icon: <Sparkles className="h-5 w-5" />,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    monthlyPrice: 89,
    annualPrice: 890
  }
};

const PLAN_ORDER: PlanSlug[] = ["starter", "pro", "business"];

export function SubscriptionManager({ tenantId }: SubscriptionManagerProps) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState<PlanSlug>("pro");
  const { toast } = useToast();
  
  const planLimits = usePlanLimits(tenantId);

  useEffect(() => {
    fetchSubscription();
  }, [tenantId]);

  const fetchSubscription = async () => {
    try {
      const { data: tenant, error } = await supabase
        .from("tenants")
        .select("subscription_plan, subscription_expires_at")
        .eq("id", tenantId)
        .single();

      if (error) throw error;

      const expiresAt = tenant?.subscription_expires_at;
      const isActive = expiresAt ? new Date(expiresAt) > new Date() : false;

      setSubscription({
        plan: tenant?.subscription_plan || null,
        expiresAt: expiresAt,
        isActive
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Error",
        description: "No se pudo abrir el portal de gestión. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpgradeClick = (plan: PlanSlug) => {
    setTargetPlan(plan);
    setUpgradeOpen(true);
  };

  if (loading || planLimits.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlan = (subscription?.plan?.toLowerCase() || 'starter') as PlanSlug;
  const planInfo = PLAN_DETAILS[currentPlan] || PLAN_DETAILS.starter;
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan);
  const daysRemaining = subscription?.expiresAt 
    ? Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Tu Suscripción</h2>
          <p className="text-xs text-muted-foreground">Gestiona tu plan y límites</p>
        </div>
      </div>

      {/* Current Plan Card */}
      <Card className="relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1 h-full ${subscription?.isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${planInfo.bgColor} ${planInfo.color}`}>
                {planInfo.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{planInfo.name}</h3>
                  {subscription?.isActive ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                      <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                      Activo
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">
                      <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                      Expirado
                    </Badge>
                  )}
                </div>
                
                {subscription?.expiresAt && subscription.isActive && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Renovación: {format(new Date(subscription.expiresAt), "d MMM yyyy", { locale: es })}
                    </span>
                    {daysRemaining !== null && daysRemaining <= 7 && (
                      <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 text-amber-600">
                        {daysRemaining} días
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Uso del Plan
          </h4>
          
          <PlanUsageBar
            current={planLimits.currentStylists}
            max={planLimits.maxStylists}
            label="Profesionales"
          />
          
          <PlanUsageBar
            current={planLimits.currentServices}
            max={planLimits.maxServices}
            label="Servicios"
          />
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {currentPlanIndex < PLAN_ORDER.length - 1 && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-3">Mejora tu plan</h4>
            <div className="space-y-2">
              {PLAN_ORDER.slice(currentPlanIndex + 1).map((slug) => {
                const plan = PLAN_DETAILS[slug];
                return (
                  <button
                    key={slug}
                    onClick={() => handleUpgradeClick(slug)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-primary/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${plan.bgColor} ${plan.color}`}>
                        {plan.icon}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Desde {plan.monthlyPrice}€/mes
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {subscription?.isActive && (
          <Button
            onClick={handleManageSubscription}
            disabled={portalLoading}
            variant="outline"
            className="w-full h-11 gap-2"
          >
            {portalLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
            Gestionar suscripción
            <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
          </Button>
        )}
      </div>

      {/* Help text */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground">
            Desde el portal de gestión puedes cambiar tu método de pago o cancelar tu suscripción.
          </p>
        </CardContent>
      </Card>

      {/* Upgrade Modal */}
      <UpgradePrompt
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        currentPlan={currentPlan}
        targetPlan={targetPlan}
        tenantId={tenantId}
      />
    </div>
  );
}
