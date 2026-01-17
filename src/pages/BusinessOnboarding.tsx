import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ArrowLeft, Zap, Crown, Check, Sparkles, Users, Scissors, TrendingUp, MessageCircle, CalendarCheck, Gift } from "lucide-react";
import { AppLayout } from "@/components/navigation/AppLayout";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";

const businessSchema = z.object({
  businessName: z.string().trim().min(2, "Mínimo 2 caracteres").max(100, "Máximo 100 caracteres"),
  businessSlug: z
    .string()
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(50, "Máximo 50 caracteres")
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  email: z.string().trim().email("Email inválido"),
  phone: z.string().trim().min(9, "Mínimo 9 dígitos").max(15, "Máximo 15 dígitos").optional().or(z.literal("")),
});

type BusinessFormValues = z.infer<typeof businessSchema>;

type PlanSlug = "starter" | "pro" | "business";
type BillingCycle = "monthly" | "annual";

interface PlanInfo {
  name: string;
  icon: React.ReactNode;
  monthlyPrice: number;
  annualPrice: number;
  stylists: string;
  services: string;
  features: string[];
  color: string;
  popular?: boolean;
}

const PLANS: Record<PlanSlug, PlanInfo> = {
  starter: {
    name: "Starter",
    icon: <Zap className="h-5 w-5" />,
    monthlyPrice: 29,
    annualPrice: 290,
    stylists: "1 profesional",
    services: "15 servicios",
    features: ["Landing profesional", "Reservas 24/7", "Calendario", "Reseñas", "Stories"],
    color: "from-blue-500 to-cyan-500"
  },
  pro: {
    name: "Pro",
    icon: <Crown className="h-5 w-5" />,
    monthlyPrice: 49,
    annualPrice: 490,
    stylists: "3 profesionales",
    services: "50 servicios",
    features: ["Todo de Starter", "Caja registradora", "Stats avanzados", "Promociones", "Paquetes"],
    color: "from-amber-500 to-orange-500",
    popular: true
  },
  business: {
    name: "Business",
    icon: <Sparkles className="h-5 w-5" />,
    monthlyPrice: 89,
    annualPrice: 890,
    stylists: "Ilimitados",
    services: "Ilimitados",
    features: ["Todo de Pro", "Comisiones", "Objetivos", "Lista de espera", "Soporte prioritario"],
    color: "from-purple-500 to-pink-500"
  }
};

export default function BusinessOnboarding() {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanSlug>("pro");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      businessName: "",
      businessSlug: "",
      email: "",
      phone: "",
    },
  });

  // Generate slug from business name
  const watchBusinessName = form.watch("businessName");
  useEffect(() => {
    if (watchBusinessName) {
      const slug = watchBusinessName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      form.setValue("businessSlug", slug);
    }
  }, [watchBusinessName, form]);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || "" });
        form.setValue("email", session.user.email || "");
      }
      setCheckingAuth(false);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || "" });
        form.setValue("email", session.user.email || "");
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (searchParams.get("canceled") === "true") {
      toast({
        title: "Pago cancelado",
        description: "No se ha realizado ningún cargo. Puedes intentarlo de nuevo cuando quieras.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const handleSubmit = async (values: BusinessFormValues) => {
    // Normal user flow: redirect to Stripe
    if (!user) {
      navigate(`/auth?redirect=/onboarding&mode=register`);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-business-checkout", {
        body: {
          planSlug: selectedPlan,
          billingCycle: billingCycle,
          businessName: values.businessName,
          businessSlug: values.businessSlug,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al procesar la solicitud";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <AppLayout hideNavigation>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideNavigation>
      <SEO
        title="Únete a GlowApp - Crea tu Perfil Profesional"
        description="Digitaliza tu negocio con GlowApp. Perfil profesional, sistema de reservas y conexión directa con clientes."
        canonicalUrl="/onboarding"
      />

      {/* Header */}
      <div 
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-foreground">
            Unirse a GlowApp
          </h1>
        </div>
      </div>

      <div className="px-4 py-8 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">30 días gratis de prueba</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Haz crecer tu negocio con GlowApp</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Crea tu landing page profesional y empieza a recibir reservas online hoy mismo.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  billingCycle === "monthly"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mensual
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === "annual"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Anual
                <Badge className="bg-success/10 text-success text-[10px] px-1.5">-17%</Badge>
              </button>
            </div>
          </motion.div>

          {/* Plans Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid md:grid-cols-3 gap-4 mb-8"
          >
            {(Object.entries(PLANS) as [PlanSlug, PlanInfo][]).map(([slug, plan], idx) => {
              const isSelected = selectedPlan === slug;
              const price = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
              const monthlyEquivalent = billingCycle === "annual" ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice;
              
              return (
                <motion.button
                  key={slug}
                  type="button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  onClick={() => setSelectedPlan(slug)}
                  className={`relative text-left ios-card p-4 transition-all ${
                    isSelected 
                      ? "border-2 border-primary ring-2 ring-primary/20" 
                      : "hover:border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge className={`bg-gradient-to-r ${plan.color} text-white text-[10px] px-2`}>
                        Popular
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-3 mt-1">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${plan.color} text-white`}>
                      {plan.icon}
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  <h4 className="font-bold text-foreground mb-1">{plan.name}</h4>
                  
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-2xl font-bold text-foreground">{monthlyEquivalent}€</span>
                    <span className="text-xs text-muted-foreground">/mes</span>
                  </div>

                  {billingCycle === "annual" && (
                    <p className="text-[10px] text-muted-foreground mb-3">
                      Facturado {price}€/año
                    </p>
                  )}

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{plan.stylists}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Scissors className="h-3 w-3" />
                      <span>{plan.services}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border space-y-1">
                    {plan.features.slice(0, 3).map((feature, fidx) => (
                      <div key={fidx} className="flex items-center gap-1.5 text-[11px]">
                        <Check className="h-3 w-3 text-success shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 3 && (
                      <p className="text-[10px] text-primary font-medium pl-4">
                        +{plan.features.length - 3} más
                      </p>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">

            {/* Form */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.2 }}
            >
              <Card className="ios-card">
                <CardHeader>
                  <CardTitle className="text-xl">Datos de tu negocio</CardTitle>
                  <CardDescription>
                    {user 
                      ? "Completa la información de tu salón" 
                      : "Crea una cuenta para continuar"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!user ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Necesitas una cuenta para crear tu salón.</p>
                      <div className="flex flex-col gap-3">
                        <Button onClick={() => navigate("/auth?redirect=/onboarding&mode=register")} className="w-full">
                          Crear cuenta
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate("/auth?redirect=/onboarding")}
                          className="w-full"
                        >
                          Ya tengo cuenta
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre del salón</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Mi Salón de Belleza"
                                  {...field}
                                  disabled={loading}
                                  className="h-12 rounded-xl"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="businessSlug"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL de tu salón</FormLabel>
                              <FormControl>
                                <div className="flex items-center">
                                  <span className="text-sm text-muted-foreground mr-2">glowapp.app/</span>
                                  <Input
                                    placeholder="mi-salon"
                                    {...field}
                                    disabled={loading}
                                    className="h-12 rounded-xl flex-1"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email de contacto</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="contacto@misalon.com"
                                  {...field}
                                  disabled={loading}
                                  className="h-12 rounded-xl"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Teléfono (opcional)</FormLabel>
                              <FormControl>
                                <Input
                                  type="tel"
                                  placeholder="600 000 000"
                                  {...field}
                                  disabled={loading}
                                  className="h-12 rounded-xl"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="pt-4">
                          <Button
                            type="submit"
                            className="w-full h-12 rounded-xl gradient-primary text-primary-foreground"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Procesando...
                              </>
                            ) : (
                              <>
                                Continuar al pago
                                <span className="ml-2 text-xs opacity-80">(30 días gratis)</span>
                              </>
                            )}
                          </Button>
                        </div>

                        <p className="text-xs text-center text-muted-foreground">
                          No se te cobrará hasta que termine tu período de prueba. Puedes cancelar en cualquier momento.
                        </p>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
