import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Settings
} from "lucide-react";

interface SubscriptionInfo {
  plan: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

interface SubscriptionManagerProps {
  tenantId: string;
}

const PLAN_FEATURES: Record<string, { name: string; icon: React.ReactNode; color: string; features: string[] }> = {
  'starter': {
    name: 'Starter',
    icon: <Zap className="h-5 w-5" />,
    color: 'text-blue-500',
    features: ['1 profesional', 'Reservas ilimitadas', 'Calendario básico']
  },
  'pro': {
    name: 'Profesional',
    icon: <Crown className="h-5 w-5" />,
    color: 'text-amber-500',
    features: ['3 profesionales', 'CRM de clientes', 'Estadísticas', 'Mensajes directos']
  },
  'business': {
    name: 'Business',
    icon: <Sparkles className="h-5 w-5" />,
    color: 'text-purple-500',
    features: ['Profesionales ilimitados', 'Caja registradora', 'Comisiones', 'Soporte prioritario']
  }
};

export function SubscriptionManager({ tenantId }: SubscriptionManagerProps) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const { toast } = useToast();

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

  const handleUpgrade = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-business-checkout');

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Error",
        description: "No se pudo iniciar el proceso. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlan = subscription?.plan?.toLowerCase() || 'starter';
  const planInfo = PLAN_FEATURES[currentPlan] || PLAN_FEATURES['starter'];
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
          <p className="text-xs text-muted-foreground">Gestiona tu plan</p>
        </div>
      </div>

      {/* Current Plan Card */}
      <Card className="relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1 h-full ${subscription?.isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-muted ${planInfo.color}`}>
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

          {/* Features */}
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Incluye:</p>
            <div className="flex flex-wrap gap-1.5">
              {planInfo.features.map((feature, idx) => (
                <Badge key={idx} variant="secondary" className="text-[10px] font-normal">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-2">
        {subscription?.isActive ? (
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
        ) : (
          <Button
            onClick={handleUpgrade}
            disabled={portalLoading}
            className="w-full h-11 gap-2"
          >
            {portalLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Renovar suscripción
          </Button>
        )}

        {subscription?.isActive && currentPlan !== 'business' && (
          <Button
            onClick={handleUpgrade}
            disabled={portalLoading}
            className="w-full h-11 gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Crown className="h-4 w-4" />
            Mejorar plan
          </Button>
        )}
      </div>

      {/* Help text */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground">
            Desde el portal de gestión puedes cambiar tu plan, actualizar el método de pago o cancelar tu suscripción.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
