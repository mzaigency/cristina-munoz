import { SEO } from "@/components/SEO";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Loader2, ArrowLeft, ArrowRight, Zap, Crown, Check, Building2,
  Shield, ChevronDown, Lock, Sparkles, Clock, CreditCard, Wallet,
} from "lucide-react";
import { AppLayout } from "@/components/navigation/AppLayout";
import { motion, AnimatePresence } from "motion/react";
import { SupportButton } from "@/components/common/SupportButton";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { SectionHeader, gradientText, gradientBg, brandCard, EASE } from "@/components/business-landing/_landingShared";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";

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

const PLAN_ICONS: Record<string, { Icon: typeof Zap; opacity: string }> = {
  starter: { Icon: Zap, opacity: "opacity-70" },
  pro: { Icon: Crown, opacity: "opacity-100" },
  business: { Icon: Building2, opacity: "opacity-100" },
};

const PLAN_SUBTITLES: Record<string, string> = {
  starter: "Para empezar",
  pro: "Para crecer",
  business: "Sin límites",
};

const FEATURE_LABELS: Record<string, string> = {
  stories: "Stories",
  messages: "Mensajes directos",
  cash_register: "Caja registradora",
  advanced_analytics: "Analytics avanzados",
  promotions: "Promociones y paquetes",
  packages: "Paquetes de servicios",
  pdf_reports: "Informes PDF",
  commissions: "Comisiones por estilista",
  monthly_goals: "Objetivos mensuales",
  waitlist: "Lista de espera",
  products: "Productos",
  whatsapp_reminders: "Recordatorios por WhatsApp",
};


// Beneficios concretos y verificables (sin métricas inventadas).
const TRUST_POINTS = [
  { Icon: Clock, label: "Listo en 5 min" },
  { Icon: CreditCard, label: "Sin tarjeta" },
  { Icon: Wallet, label: "Sin permanencia" },
];

const OBJECTIONS = [
  { q: "¿Y si no me convence?", a: "30 días gratis sin compromiso. Cancelas con un clic antes de que termine el periodo y no se cobra nada." },
  { q: "¿Es difícil de configurar?", a: "Un asistente te guía paso a paso. En 5 minutos tienes tu web lista con servicios, horarios y equipo." },
  { q: "¿Mis clientes sabrán usarlo?", a: "La experiencia de reserva es tan simple como pedir un Uber. Tus clientes lo amarán." },
  { q: "¿Puedo cambiar de plan?", a: "Sí, puedes subir o bajar de plan en cualquier momento. Sin penalizaciones." },
];

export default function BusinessOnboarding() {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanSlug>("pro");
  const [isAnnual, setIsAnnual] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const { plans, loading: plansLoading } = useSubscriptionPlans();

  const handlePlanSelect = (slug: PlanSlug) => {
    setSelectedPlan(slug);
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: { businessName: "", businessSlug: "", email: "", phone: "" },
  });

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
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || "" });
        form.setValue("email", session.user.email || "");
      }
      setCheckingAuth(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
    if (!user) {
      navigate(`/auth?redirect=/onboarding&mode=register`);
      return;
    }
    setLoading(true);
    try {
      localStorage.setItem("onboarding_plan_slug", selectedPlan);
      localStorage.setItem("onboarding_billing_cycle", isAnnual ? "annual" : "monthly");
      localStorage.setItem("onboarding_business_name", values.businessName);
      localStorage.setItem("onboarding_business_slug", values.businessSlug);

      const { data, error } = await supabase.functions.invoke("create-business-checkout", {
        body: {
          planSlug: selectedPlan,
          billingCycle: isAnnual ? "annual" : "monthly",
          businessName: values.businessName,
          businessSlug: values.businessSlug,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.location.href = data.url;
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const buildFeatureList = (plan: typeof plans[0]) => {
    const list: string[] = [];
    const ms = plan.max_stylists;
    const sv = plan.max_services;
    list.push(ms && ms >= 999 ? "Profesionales ilimitados" : `${ms || 1} profesional${(ms || 1) > 1 ? "es" : ""}`);
    list.push(sv && sv >= 999 ? "Servicios ilimitados" : `Hasta ${sv || 15} servicios`);
    const idx = plans.indexOf(plan);
    if (idx === 1) list.push("Todo de Starter +");
    if (idx === 2) list.push("Todo de Pro +");
    if (plan.features) {
      const prevFeatures = idx > 0 ? plans[idx - 1]?.features || {} : {};
      Object.entries(plan.features).forEach(([key, enabled]) => {
        if (enabled && !prevFeatures[key] && FEATURE_LABELS[key]) {
          list.push(FEATURE_LABELS[key]);
        }
      });
    }
    return list;
  };

  const currentPlanObj = useMemo(
    () => plans.find((p) => p.slug === selectedPlan) || plans[1] || plans[0],
    [plans, selectedPlan]
  );

  if (checkingAuth) {
    return (
      <AppLayout hideNavigation>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideNavigation>
      <SEO
        title="Digitaliza tu Salón - Glowapp | Reservas Online en 5 Minutos"
        description="Crea tu web profesional y recibe reservas 24/7. 30 días gratis, sin tarjeta. Lista en 5 minutos."
        canonicalUrl="/onboarding"
        faq={OBJECTIONS.map((o) => ({ question: o.q, answer: o.a }))}
      />

      {/* Sticky header */}
      <div
        className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="h-9 w-9 rounded-full"
            aria-label="Volver"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            onClick={scrollToPricing}
            className="h-9 rounded-full gradient-primary px-4 text-xs text-white shadow-md"
          >
            Empezar gratis
          </Button>
        </div>
      </div>

      <div className="pb-24">
        {/* ===== HERO ===== */}
        <section className="container mx-auto px-4 pt-10 pb-12 text-center md:pt-20 md:pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              30 días gratis
            </span>

            <h1 className="mx-auto max-w-2xl text-balance text-[34px] font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Deja de perder clientes{" "}
              <span className="font-serif italic" style={gradientText}>
                por no estar online
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
              Tu web profesional con reservas 24/7 lista en 5 minutos. Sin saber programar.
            </p>

            <div className="mt-7 flex flex-col items-center gap-3">
              <Button
                onClick={scrollToPricing}
                className="h-12 rounded-2xl gradient-primary px-8 text-base font-semibold text-white shadow-xl shadow-primary/25"
              >
                Crear mi salón gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                Cancela cuando quieras · Sin compromisos
              </p>
            </div>

            {/* Trust points (honestos, sin métricas inventadas) */}
            <div className="mx-auto mt-10 flex max-w-md flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-2xl border border-border/60 bg-card/60 px-6 py-4 backdrop-blur-sm">
              {TRUST_POINTS.map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-white shadow-sm"
                    style={{ backgroundImage: gradientBg }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-medium text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>


        {/* ===== PRICING ===== */}
        <section
          ref={pricingRef}
          className="relative scroll-mt-20 overflow-hidden py-16 md:py-24"
        >
          {/* Fondo aurora suave de marca */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, hsl(var(--primary) / 0.10), transparent 70%), radial-gradient(50% 40% at 80% 100%, hsl(var(--accent) / 0.10), transparent 70%)",
            }}
          />

          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: EASE }}
              className="mx-auto max-w-2xl text-center"
            >
              <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                Precios transparentes
              </span>
              <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
                <VerticalCutReveal
                  splitBy="words"
                  staggerDuration={0.08}
                  staggerFrom="first"
                  transition={{ type: "spring", stiffness: 220, damping: 26, delay: 0.05 }}
                  containerClassName="justify-center"
                >
                  Empieza gratis 30 días
                </VerticalCutReveal>
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
                Sin tarjeta. Sin permanencia. Cancela con un clic antes de que termine.
              </p>
            </motion.div>

            {/* Toggle mensual/anual */}
            <div className="mb-10 mt-8 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 p-1 shadow-sm backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setIsAnnual(false)}
                  className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                    !isAnnual ? "bg-primary/10 font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Mensual
                </button>
                <button
                  type="button"
                  onClick={() => setIsAnnual(true)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition-colors ${
                    isAnnual ? "bg-primary/10 font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Anual
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                    −20%
                  </span>
                </button>
              </div>
            </div>

            {plansLoading ? (
              <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[460px] animate-pulse rounded-3xl bg-muted" />
                ))}
              </div>
            ) : (
              <div className="mx-auto grid max-w-5xl items-stretch gap-6 md:grid-cols-3">
                {plans.map((plan, index) => {
                  const meta = PLAN_ICONS[plan.slug] || PLAN_ICONS.starter;
                  const Icon = meta.Icon;
                  const isPopular = index === 1;
                  const annualPrice = plan.annual_price || Math.round(plan.monthly_price * 10);
                  const annualMonthly = Math.round(annualPrice / 12);
                  const annualSavings = plan.monthly_price * 12 - annualPrice;
                  const features = buildFeatureList(plan);

                  // Diferenciación visual: el popular usa la tarjeta navy de marca.
                  const cardStyle: React.CSSProperties = isPopular
                    ? brandCard
                    : {
                        background:
                          "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card)) 100%)",
                      };

                  const titleClass = isPopular ? "text-white" : "text-foreground";
                  const subtitleClass = isPopular ? "text-white/70" : "text-muted-foreground";
                  const priceClass = isPopular ? "text-white" : "text-foreground";
                  const featureClass = isPopular ? "text-white/85" : "text-muted-foreground";
                  const checkBg = isPopular ? "bg-white/10" : "bg-secondary";
                  const checkColor = isPopular ? "text-white" : "text-primary";

                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ delay: index * 0.08, duration: 0.6, ease: EASE }}
                      className={`relative ${
                        isPopular ? "md:-mt-4 md:mb-0 md:scale-[1.03]" : ""
                      }`}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold text-white shadow-lg shadow-primary/30"
                            style={{ backgroundImage: gradientBg }}
                          >
                            <Sparkles className="h-3 w-3" /> El más elegido
                          </span>
                        </div>
                      )}
                      <div
                        className={`relative flex h-full flex-col overflow-hidden rounded-3xl p-7 ${
                          isPopular ? "" : "border border-border/70"
                        }`}
                        style={cardStyle}
                      >
                        {isPopular && (
                          <div
                            aria-hidden
                            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-50 blur-3xl"
                            style={{ background: gradientBg }}
                          />
                        )}

                      <div className="relative mb-6">
                        <div
                          className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg ${meta.opacity}`}
                          style={{
                            backgroundImage: isPopular
                              ? "linear-gradient(135deg, rgba(255,255,255,.18), rgba(255,255,255,.05))"
                              : gradientBg,
                            boxShadow: isPopular
                              ? "inset 0 1px 0 rgba(255,255,255,.18)"
                              : "0 10px 24px -10px hsl(var(--primary) / 0.45)",
                          }}
                        >
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <h3 className={`text-xl font-bold ${titleClass}`}>{plan.name}</h3>
                        <p className={`mt-1 text-sm ${subtitleClass}`}>
                          {PLAN_SUBTITLES[plan.slug] || ""}
                        </p>
                      </div>

                      <div className="relative mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-5xl font-bold tracking-tight ${priceClass}`}>
                            {isAnnual ? annualMonthly : plan.monthly_price}€
                          </span>
                          <span className={`text-sm ${subtitleClass}`}>/mes</span>
                        </div>
                        <p className={`mt-1.5 text-xs ${subtitleClass}`}>
                          {isAnnual ? (
                            <>
                              {annualPrice}€ facturados al año
                              {annualSavings > 0 && (
                                <span className="ml-1 font-semibold text-emerald-400">
                                  · ahorras {annualSavings}€
                                </span>
                              )}
                            </>
                          ) : (
                            <>Facturación mensual · cancela cuando quieras</>
                          )}
                        </p>
                      </div>

                      <ul className="relative mb-7 space-y-3">
                        {features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${checkBg}`}
                            >
                              <Check className={`h-3 w-3 ${checkColor}`} />
                            </span>
                            <span className={`text-sm leading-snug ${featureClass}`}>
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <div className="relative mt-auto">
                        <Button
                          onClick={() => handlePlanSelect(plan.slug as PlanSlug)}
                          className={`h-12 w-full rounded-2xl font-semibold ${
                            isPopular
                              ? "bg-white text-[hsl(223_55%_17%)] hover:bg-white/90"
                              : "gradient-primary border-0 text-white shadow-lg shadow-primary/25"
                          }`}
                        >
                          Empezar gratis
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <p className={`mt-2 text-center text-[11px] ${subtitleClass}`}>
                          30 días · sin tarjeta
                        </p>
                      </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> 30 días gratis
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> Cancela cuando quieras
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> Sin permanencia
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> Soporte humano en español
              </span>
            </div>
          </div>
        </section>


        {/* ===== FORM ===== */}
        <AnimatePresence>
          {showForm && currentPlanObj && (
            <motion.section
              ref={formRef}
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: 20, height: 0 }}
              className="container mx-auto scroll-mt-20 px-4 py-12"
            >
              <div className="mx-auto max-w-xl rounded-3xl border-2 border-primary/30 bg-background p-6 shadow-xl shadow-primary/10 sm:p-8">
                <div className="mb-6 text-center">
                  <div className="mb-2 inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="text-lg font-bold text-foreground">
                      Plan <span style={gradientText}>{currentPlanObj.name}</span>
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {user ? "Solo necesitamos el nombre de tu salón" : "Crea una cuenta para continuar"}
                  </p>
                </div>

                {!user ? (
                  <div className="space-y-3">
                    <Button
                      onClick={() => navigate("/auth?redirect=/onboarding&mode=register")}
                      className="h-12 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-lg shadow-primary/20"
                    >
                      Crear cuenta gratis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/auth?redirect=/onboarding")}
                      className="h-11 w-full rounded-2xl"
                    >
                      Ya tengo cuenta
                    </Button>
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
                                className="h-11 rounded-xl"
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
                                <span className="mr-2 shrink-0 text-[11px] text-muted-foreground">
                                  glowapp.app/
                                </span>
                                <Input
                                  placeholder="mi-salon"
                                  {...field}
                                  disabled={loading}
                                  className="h-11 flex-1 rounded-xl"
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
                            <FormLabel className="text-xs">Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="contacto@misalon.com"
                                {...field}
                                disabled={loading}
                                className="h-11 rounded-xl"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="pt-2">
                        <Button
                          type="submit"
                          className="h-12 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-xl shadow-primary/25"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...
                            </>
                          ) : (
                            <>
                              Empezar 30 días gratis
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>

                        <div className="mt-3 flex items-center justify-center gap-3">
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Lock className="h-3 w-3" /> Pago seguro
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Shield className="h-3 w-3" /> Cancela cuando quieras
                          </span>
                        </div>
                      </div>
                    </form>
                  </Form>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ===== FAQ ===== */}
        <section className="container mx-auto px-4 py-14 md:py-20">
          <SectionHeader
            eyebrow="Dudas frecuentes"
            title="Resolvemos lo importante"
            className="mb-10"
          />
          <div className="mx-auto max-w-2xl space-y-3">
            {OBJECTIONS.map((obj, i) => (
              <details
                key={i}
                className="group overflow-hidden rounded-2xl border border-border/60 bg-card/85 backdrop-blur-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between p-5">
                  <span className="pr-4 text-sm font-medium text-foreground sm:text-base">{obj.q}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-5 pt-0">
                  <p className="text-sm leading-relaxed text-muted-foreground">{obj.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="container mx-auto px-4 pb-10">
          <div className="mx-auto max-w-3xl rounded-3xl border border-primary/15 bg-primary/[0.04] p-8 text-center sm:p-12">
            <h2 className="text-balance text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
              ¿Listo para{" "}
              <span className="font-serif italic" style={gradientText}>
                digitalizar tu salón?
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
              Únete a los profesionales que ya gestionan su negocio con Glowapp.
            </p>
            <Button
              onClick={scrollToPricing}
              className="mt-6 h-12 rounded-2xl gradient-primary px-6 text-base font-semibold text-white shadow-lg shadow-primary/20"
            >
              Crear mi salón gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Gratis el primer mes · Sin permanencia · Cancela cuando quieras
            </p>
          </div>
        </section>

        <SupportButton variant="floating" context="Registro de negocio" />
      </div>
    </AppLayout>
  );
}
