import { SEO } from "@/components/SEO";
import { useState, useEffect, useRef } from "react";
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
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { SupportButton } from "@/components/common/SupportButton";

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
  const formRef = useRef<HTMLDivElement>(null);

  const handlePlanSelect = (slug: PlanSlug) => {
    setSelectedPlan(slug);
    // Scroll al formulario después de seleccionar
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

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
          <div className="w-14 h-14 rounded-2xl liquid-glass-card flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </div>
      </AppLayout>
    );
  }

  const currentPlan = PLANS[selectedPlan];
  const monthlyEquiv = billingCycle === "annual" ? Math.round(currentPlan.annualPrice / 12) : currentPlan.monthlyPrice;
  const savings = Math.round(currentPlan.monthlyPrice * 12 - currentPlan.annualPrice);

  return (
    <AppLayout hideNavigation>
      <SEO
        title="Únete a GlowApp - Crea tu Perfil Profesional"
        description="Digitaliza tu negocio con GlowApp. Perfil profesional, sistema de reservas y conexión directa con clientes."
        canonicalUrl="/onboarding"
      />

      {/* Header - liquid glass */}
      <div 
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-white/10"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-semibold text-sm text-foreground">
            Unirse a GlowApp
          </h1>
        </div>
      </div>

      <div className="px-4 py-6 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/10 text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">30 días gratis de prueba</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 leading-tight">
              Haz crecer tu negocio<br className="sm:hidden" /> con GlowApp
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Crea tu landing page profesional y empieza a recibir reservas online hoy mismo.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center gap-2.5 mb-7"
          >
            <div className="relative inline-flex items-center gap-0.5 p-1 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`relative px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  billingCycle === "monthly"
                    ? "bg-background/80 shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mensual
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`relative px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  billingCycle === "annual"
                    ? "bg-primary shadow-sm text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Anual
              </button>
              
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2.5 -right-1.5 z-10"
              >
                <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold shadow-sm">
                  -17%
                </span>
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              {billingCycle === "annual" && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="text-xs text-emerald-500 font-medium flex items-center gap-1.5"
                >
                  <Gift className="h-3.5 w-3.5" />
                  Ahorras {savings}€/año con el plan {currentPlan.name}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Plans Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid md:grid-cols-3 gap-3 mb-8"
          >
            {(Object.entries(PLANS) as [PlanSlug, PlanInfo][]).map(([slug, plan], idx) => {
              const isSelected = selectedPlan === slug;
              const price = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
              const monthlyEq = billingCycle === "annual" ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice;
              const planSavings = Math.round(plan.monthlyPrice * 12 - plan.annualPrice);
              
              return (
                <motion.button
                  key={slug}
                  type="button"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  onClick={() => handlePlanSelect(slug)}
                  className={`relative text-left rounded-2xl p-4 transition-all border ${
                    isSelected 
                      ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/10" 
                      : "border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-white/15"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <span className={`bg-gradient-to-r ${plan.color} text-white text-[10px] px-2.5 py-0.5 rounded-full font-semibold shadow-sm`}>
                        Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-3 mt-1">
                    <div className={`p-1.5 rounded-xl bg-gradient-to-br ${plan.color} text-white`}>
                      {plan.icon}
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  <h4 className="font-bold text-foreground mb-1">{plan.name}</h4>
                  
                  <div className="flex items-baseline gap-0.5 mb-1">
                    <span className="text-2xl font-bold text-foreground">{monthlyEq}€</span>
                    <span className="text-[11px] text-muted-foreground">/mes</span>
                  </div>

                  {billingCycle === "annual" && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[11px] text-muted-foreground line-through">
                        {plan.monthlyPrice}€/mes
                      </span>
                      <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        Ahorras {planSavings}€
                      </span>
                    </div>
                  )}

                  {billingCycle === "annual" && (
                    <p className="text-[10px] text-muted-foreground mb-3">
                      Facturado {price}€/año
                    </p>
                  )}
                  
                  {billingCycle === "monthly" && <div className="mb-3" />}

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3 w-3 shrink-0" />
                      <span>{plan.stylists}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Scissors className="h-3 w-3 shrink-0" />
                      <span>{plan.services}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                    {plan.features.slice(0, 3).map((feature, fidx) => (
                      <div key={fidx} className="flex items-center gap-1.5 text-[11px]">
                        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 3 && (
                      <p className="text-[10px] text-primary font-medium pl-[18px]">
                        +{plan.features.length - 3} más
                      </p>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Form */}
          <motion.div 
            ref={formRef}
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.25 }}
            className="max-w-md mx-auto scroll-mt-4"
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-5">
              <div className="text-center mb-5">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-xl bg-gradient-to-br ${currentPlan.color} text-white`}>
                    {currentPlan.icon}
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Plan {currentPlan.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {user ? "Completa la información de tu salón" : "Crea una cuenta para continuar"}
                </p>
              </div>

              {!user ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">Necesitas una cuenta para crear tu salón.</p>
                  <div className="flex flex-col gap-3">
                    <Button onClick={() => navigate("/auth?redirect=/onboarding&mode=register")} className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground shadow-lg shadow-primary/20">
                      Crear cuenta
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/auth?redirect=/onboarding")}
                      className="w-full h-12 rounded-2xl bg-white/5 border-white/10"
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
                          <FormLabel className="text-xs">Nombre del salón</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Mi Salón de Belleza"
                              {...field}
                              disabled={loading}
                              className="h-11 rounded-xl bg-white/5 border-white/10"
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
                          <FormLabel className="text-xs">URL de tu salón</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <span className="text-xs text-muted-foreground mr-2">glowapp.app/</span>
                              <Input
                                placeholder="mi-salon"
                                {...field}
                                disabled={loading}
                                className="h-11 rounded-xl flex-1 bg-white/5 border-white/10"
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
                          <FormLabel className="text-xs">Email de contacto</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="contacto@misalon.com"
                              {...field}
                              disabled={loading}
                              className="h-11 rounded-xl bg-white/5 border-white/10"
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
                          <FormLabel className="text-xs">Teléfono (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="600 000 000"
                              {...field}
                              disabled={loading}
                              className="h-11 rounded-xl bg-white/5 border-white/10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-3 space-y-3">
                      {/* Price summary */}
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Plan seleccionado</span>
                          <span className="text-sm font-semibold">{currentPlan.name} ({billingCycle === "annual" ? "Anual" : "Mensual"})</span>
                        </div>
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-xs text-muted-foreground">Precio</span>
                          <div className="text-right">
                            <span className="font-bold text-base">
                              {billingCycle === "annual" 
                                ? `${currentPlan.annualPrice}€/año`
                                : `${currentPlan.monthlyPrice}€/mes`
                              }
                            </span>
                            {billingCycle === "annual" && (
                              <p className="text-[11px] text-emerald-500 font-medium">
                                Ahorras {savings}€
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground shadow-lg shadow-primary/20"
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
                            <span className="ml-2 text-[11px] opacity-70">(30 días gratis)</span>
                          </>
                        )}
                      </Button>
                    </div>

                    <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                      No se te cobrará hasta que termine tu período de prueba. Puedes cancelar en cualquier momento.
                    </p>

                    <div className="pt-1">
                      <SupportButton variant="inline" context="Registro de negocio" />
                    </div>
                  </form>
                </Form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
