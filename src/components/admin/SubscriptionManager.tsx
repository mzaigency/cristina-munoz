import { useState, useEffect, useCallback } from "react";
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
  ArrowRight,
  Clock,
  RefreshCw,
  Info
} from "lucide-react";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { PlanUsageBar } from "./PlanUsageBar";
import { UpgradePrompt } from "./UpgradePrompt";
import { SupportButton } from "@/components/common/SupportButton";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";

interface StripeSubscriptionData {
  subscribed: boolean;
  has_customer?: boolean;
  has_subscription?: boolean;
  status?: string;
  plan?: "monthly" | "annual" | null;
  plan_slug?: string | null;
  price_id?: string;
  subscription_end?: string | null;
  trial_end?: string | null;
  cancel_at_period_end?: boolean;
}

interface SubscriptionManagerProps {
  tenantId: string;
}

type PlanSlug = "starter" | "pro" | "business";

const PLAN_ICONS: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  starter: { icon: <Zap className="h-5 w-5" />, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  pro: { icon: <Crown className="h-5 w-5" />, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  business: { icon: <Sparkles className="h-5 w-5" />, color: "text-purple-500", bgColor: "bg-purple-500/10" },
};

const PLAN_ORDER: PlanSlug[] = ["starter", "pro", "business"];

export function SubscriptionManager({ tenantId }: SubscriptionManagerProps) {
  const [tenantPlan, setTenantPlan] = useState<string | null>(null);
  const [tenantExpires, setTenantExpires] = useState<string | null>(null);
  const { plans: dbPlans, getPlan: getDbPlan } = useSubscriptionPlans();
  const [tenantIsActive, setTenantIsActive] = useState<boolean>(true);
  const [stripeData, setStripeData] = useState<StripeSubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState<PlanSlug>("pro");
  const { toast } = useToast();
  
  const planLimits = usePlanLimits(tenantId);

  const fetchTenantData = useCallback(async () => {
    try {
      const { data: tenant, error } = await supabase
        .from("tenants")
        .select("subscription_plan, subscription_expires_at, is_active")
        .eq("id", tenantId)
        .single();

      if (error) throw error;

      setTenantPlan(tenant?.subscription_plan || "starter");
      setTenantExpires(tenant?.subscription_expires_at || null);
      setTenantIsActive(tenant?.is_active !== false);
    } catch (error) {
      console.error("Error fetching tenant:", error);
    }
  }, [tenantId]);

  const fetchStripeData = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        body: { tenantId },
      });
      
      if (error) throw error;
      setStripeData(data);
    } catch (error) {
      console.error("Error checking Stripe subscription:", error);
      // Don't show error toast, just use tenant data as fallback
    }
  }, [tenantId]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchTenantData(), fetchStripeData()]);
    setLoading(false);
  }, [fetchTenantData, fetchStripeData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTenantData(), fetchStripeData()]);
    setRefreshing(false);
    toast({
      title: "Actualizado",
      description: "Estado de suscripción actualizado"
    });
  };

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { tenantId },
      });

      if (error) throw error;
      
      // Handle case where user has no Stripe customer record
      if (data?.error === "no_customer") {
        toast({
          title: "Sin suscripción en Stripe",
          description: "Tu suscripción fue configurada manualmente. Contacta con soporte para gestionar cambios.",
        });
        return;
      }
      
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

  const syncedPlan = stripeData?.has_subscription && stripeData?.plan_slug ? stripeData.plan_slug : tenantPlan;
  const currentPlan = (syncedPlan?.toLowerCase() || 'starter') as PlanSlug;
  const currentDbPlan = getDbPlan(currentPlan);
  const planIcons = PLAN_ICONS[currentPlan] || PLAN_ICONS.starter;
  const planInfo = {
    name: currentDbPlan?.name || currentPlan,
    icon: planIcons.icon,
    color: planIcons.color,
    bgColor: planIcons.bgColor,
    monthlyPrice: currentDbPlan?.monthly_price || 0,
    annualPrice: currentDbPlan?.annual_price || 0,
  };
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan);
  
  // Stripe tiene prioridad SOLO si existe cliente en Stripe.
  // Si no hay cliente (pilotos / configuración manual), usamos el estado del tenant.
  const stripeHasCustomer = stripeData?.has_customer === true;

  const subscriptionEnd = stripeHasCustomer ? (stripeData?.subscription_end || null) : tenantExpires;
  const isTrialing = stripeData?.status === "trialing";
  const cancelAtPeriodEnd = stripeData?.cancel_at_period_end || false;

  const isTenantDateActive = tenantExpires ? new Date(tenantExpires) > new Date() : tenantIsActive;
  const isActive = stripeHasCustomer ? (stripeData?.subscribed ?? false) : (isTenantDateActive && tenantIsActive);

  const trialEnd = stripeData?.trial_end;
  const billingCycle = stripeData?.plan;

  const daysRemaining = subscriptionEnd 
    ? Math.max(0, Math.ceil((new Date(subscriptionEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const getStatusBadge = () => {
    if (isTrialing) {
      return (
        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px]">
          <Clock className="h-2.5 w-2.5 mr-0.5" />
          Prueba
        </Badge>
      );
    }

    if (cancelAtPeriodEnd) {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">
          <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
          Se cancelará
        </Badge>
      );
    }

    if (isActive) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
          <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
          Activo
        </Badge>
      );
    }

    return (
      <Badge className="bg-red-500/10 text-red-600 border-red-500/30 text-[10px]">
        <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
        Expirado
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Tu Suscripción</h2>
            <p className="text-xs text-muted-foreground">Gestiona tu plan y límites</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-8 w-8"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Current Plan Card */}
      <Card className="relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1 h-full ${isActive ? (cancelAtPeriodEnd ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-red-500'}`} />
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${planInfo.bgColor} ${planInfo.color}`}>
                {planInfo.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-lg">{planInfo.name}</h3>
                  {getStatusBadge()}
                  {billingCycle && (
                    <Badge variant="outline" className="text-[10px]">
                      {billingCycle === "annual" ? "Anual" : "Mensual"}
                    </Badge>
                  )}
                </div>
                
                {/* Subscription dates */}
                {subscriptionEnd && isActive && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {cancelAtPeriodEnd ? "Se cancela el" : "Renovación"}:{" "}
                      {format(new Date(subscriptionEnd), "d MMM yyyy", { locale: es })}
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

          {/* Trial info */}
          {isTrialing && trialEnd && (
            <div className="mt-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs font-medium text-blue-600">Periodo de prueba activo</p>
                  <p className="text-[11px] text-muted-foreground">
                    Tu prueba termina el {format(new Date(trialEnd), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cancellation pending warning */}
          {cancelAtPeriodEnd && (
            <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-amber-600">Cancelación programada</p>
                  <p className="text-[11px] text-muted-foreground">
                    Tu suscripción se cancelará al final del periodo actual. 
                    Puedes reactivarla desde el portal de gestión.
                  </p>
                </div>
              </div>
            </div>
          )}
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
                const dbPlan = getDbPlan(slug);
                const icons = PLAN_ICONS[slug] || PLAN_ICONS.starter;
                return (
                  <button
                    key={slug}
                    onClick={() => handleUpgradeClick(slug)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-primary/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${icons.bgColor} ${icons.color}`}>
                        {icons.icon}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">{dbPlan?.name || slug}</p>
                        <p className="text-xs text-muted-foreground">
                          Desde {dbPlan?.monthly_price || 0}€/mes
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

      {/* Manage Subscription Button - Always visible */}
      <Button
        onClick={handleManageSubscription}
        disabled={portalLoading}
        variant={isActive ? "outline" : "default"}
        className="w-full h-11 gap-2"
      >
        {portalLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Settings className="h-4 w-4" />
        )}
        {isActive ? "Gestionar suscripción" : "Reactivar suscripción"}
        <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
      </Button>

      {/* Help text */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              Desde el portal de gestión puedes cambiar tu método de pago, descargar facturas, 
              modificar el tipo de renovación o cancelar tu suscripción.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Ayuda con suscripción */}
      <SupportButton variant="card" context="Suscripción y facturación" />

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
