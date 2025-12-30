import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUserTenant } from "@/hooks/useCurrentUserTenant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CreditCard, Calendar, Crown, ArrowLeft, ExternalLink, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SubscriptionData {
  subscribed: boolean;
  status?: string;
  plan?: "monthly" | "annual" | null;
  subscription_end?: string | null;
  trial_end?: string | null;
  cancel_at_period_end?: boolean;
}

const PLANS = {
  monthly: {
    name: "Plan Mensual",
    price: "39,99€",
    interval: "/mes",
    features: [
      "Landing page personalizada",
      "Sistema de reservas online",
      "Gestión de servicios y estilistas",
      "Reseñas de clientes",
      "Soporte prioritario",
    ],
  },
  annual: {
    name: "Plan Anual",
    price: "399,99€",
    interval: "/año",
    savings: "Ahorra 2 meses",
    features: ["Todo lo del plan mensual", "Ahorro de 2 meses", "Soporte prioritario", "Funciones premium anticipadas"],
  },
};

export default function Subscription() {
  const navigate = useNavigate();
  const { tenant, loading: tenantLoading } = useCurrentUserTenant();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error("Error checking subscription:", error);
      toast.error("Error al verificar la suscripción");
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error("Error al abrir el portal de gestión");
    } finally {
      setPortalLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!subscription) return null;

    if (subscription.status === "trialing") {
      return (
        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          <Clock className="w-3 h-3 mr-1" />
          Periodo de prueba
        </Badge>
      );
    }

    if (subscription.cancel_at_period_end) {
      return (
        <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
          <AlertCircle className="w-3 h-3 mr-1" />
          Se cancelará
        </Badge>
      );
    }

    if (subscription.subscribed) {
      return (
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          Activa
        </Badge>
      );
    }

    return (
      <Badge variant="secondary">
        <AlertCircle className="w-3 h-3 mr-1" />
        Inactiva
      </Badge>
    );
  };

  const currentPlan = subscription?.plan ? PLANS[subscription.plan] : null;

  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Gestión de Suscripción</h1>
            {tenant && <p className="text-muted-foreground">{tenant.name}</p>}
          </div>
        </div>

        <div className="grid gap-6">
          {/* Current Plan Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Crown className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Tu Plan Actual</CardTitle>
                    <CardDescription>{currentPlan ? currentPlan.name : "Sin suscripción activa"}</CardDescription>
                  </div>
                </div>
                {getStatusBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentPlan ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{currentPlan.price}</span>
                    <span className="text-muted-foreground">{currentPlan.interval}</span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Subscription End Date */}
                    {subscription?.subscription_end && (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {subscription.cancel_at_period_end ? "Se cancela el" : "Próxima renovación"}
                          </p>
                          <p className="font-medium">
                            {format(new Date(subscription.subscription_end), "d 'de' MMMM, yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Trial End Date */}
                    {subscription?.trial_end && subscription.status === "trialing" && (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-blue-500">Prueba termina el</p>
                          <p className="font-medium">
                            {format(new Date(subscription.trial_end), "d 'de' MMMM, yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div>
                    <p className="text-sm font-medium mb-3">Incluye:</p>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {currentPlan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No tienes una suscripción activa</p>
                  <Button onClick={() => navigate("/onboarding")}>Ver planes disponibles</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manage Subscription Card */}
          {subscription?.subscribed && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle>Gestionar Suscripción</CardTitle>
                    <CardDescription>Actualiza tu método de pago, cambia de plan o cancela</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={openCustomerPortal} disabled={portalLoading} className="flex-1">
                    {portalLoading ? (
                      "Abriendo..."
                    ) : (
                      <>
                        Abrir Portal de Gestión
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={checkSubscription} className="flex-1 sm:flex-none">
                    Actualizar estado
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  El portal de gestión te permite cambiar tu método de pago, descargar facturas, cambiar de plan o
                  cancelar tu suscripción.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Help Section */}
          <Card className="border-dashed">
            <CardContent className="py-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">¿Tienes alguna pregunta sobre tu suscripción?</p>
                <Button variant="link" asChild>
                  <a href="mailto:soporte@glowapp.app">Contactar con soporte</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
