import { SEO } from "@/components/SEO";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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

const CRISTINA_LOGO =
  "https://lyeyzdbplrgqsvyxpfek.supabase.co/storage/v1/object/public/tenant-assets/a1b2c3d4-e5f6-7890-abcd-ef1234567890/logo-1766948799579.png";

const TESTIMONIALS = [
  {
    initials: "CM",
    name: "Cristina Muñoz",
    sector: "Peluquería · Santpedor",
    Icon: Scissors,
    logo: CRISTINA_LOGO as string | null,
    quote:
      "Antes vivía pegada al teléfono. Ahora las clientas reservan solas, hasta de madrugada, y yo abro la app y veo el día ya montado.",
    metric: "Reservas mientras duermo",
    metricLabel: "la agenda se llena sin coger el teléfono",
  },
  {
    initials: "MF",
    name: "Montserrat Faig",
    sector: "Fisioterapia · Manresa",
    Icon: HeartPulse,
    logo: null as string | null,
    quote:
      "Los pacientes que faltaban sin avisar eran mi pesadilla. Con los recordatorios automáticos los plantones casi han desaparecido.",
    metric: "Plantones bajo control",
    metricLabel: "los recordatorios hacen el trabajo",
  },
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
        description="Crea tu web profesional y recibe reservas 24/7. 30 días gratis. Más de 500 salones ya confían en Glowapp."
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

            {/* Social proof strip */}
            <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-6 rounded-2xl border border-border/60 bg-card/60 px-6 py-4 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">500+</p>
                <p className="text-[10px] text-muted-foreground">Salones</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">50K+</p>
                <p className="text-[10px] text-muted-foreground">Reservas/mes</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex flex-col items-center">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">4.9</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ===== TESTIMONIALS (real salones) ===== */}
        <section className="container mx-auto px-4 py-14 md:py-20">
          <SectionHeader
            eyebrow="Salones reales"
            title={
              <>
                No te lo decimos nosotros.{" "}
                <span className="font-serif italic" style={gradientText}>
                  Te lo dicen ellas.
                </span>
              </>
            }
            subtitle="Negocios que cambiaron la libreta por Glowapp y no han vuelto atrás."
            className="mb-10"
          />

          <motion.div
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.16 } } }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2"
          >
            {TESTIMONIALS.map((t) => (
              <motion.figure
                key={t.name}
                variants={{
                  hidden: { opacity: 0, y: 30, scale: 0.96 },
                  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", duration: 0.8, bounce: 0.2 } },
                }}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_24px_50px_-16px_rgba(20,22,48,0.16)] sm:p-8"
              >
                <Quote className="absolute right-6 top-6 h-10 w-10 text-primary/10" />

                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <blockquote className="font-serif text-lg italic leading-relaxed text-foreground sm:text-xl">
                  «{t.quote}»
                </blockquote>

                <div className="mt-5 inline-flex w-fit flex-col rounded-2xl bg-primary/[0.06] px-4 py-3">
                  <span className="text-base font-bold tracking-tight sm:text-lg" style={gradientText}>
                    {t.metric}
                  </span>
                  <span className="text-xs text-muted-foreground">{t.metricLabel}</span>
                </div>

                <figcaption className="mt-6 flex items-center gap-3 border-t border-border/60 pt-5">
                  {t.logo ? (
                    <img
                      src={t.logo}
                      alt={`Logo de ${t.name}`}
                      loading="lazy"
                      className="h-11 w-11 flex-none rounded-2xl border border-border/60 object-cover shadow-md"
                    />
                  ) : (
                    <span
                      className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl text-sm font-bold text-white shadow-md"
                      style={{ backgroundImage: gradientBg }}
                    >
                      {t.initials}
                    </span>
                  )}
                  <div>
                    <p className="font-semibold text-foreground">{t.name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <t.Icon className="h-3 w-3" /> {t.sector}
                    </p>
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </motion.div>
        </section>

        {/* ===== PRICING ===== */}
        <section ref={pricingRef} className="scroll-mt-20 bg-secondary/50 py-14 md:py-20">
          <div className="container mx-auto px-4">
            <SectionHeader
              eyebrow="Precios transparentes"
              title="Elige tu plan"
              subtitle="Todos los planes incluyen 30 días de prueba gratis. Cancela cuando quieras."
              className="mb-8"
            />

            <div className="mb-10 flex justify-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-border bg-background p-1">
                <span
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    !isAnnual ? "bg-primary/10 font-medium text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Mensual
                </span>
                <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
                <span
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    isAnnual ? "bg-primary/10 font-medium text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Anual
                  <span className="ml-1 text-xs font-medium text-emerald-600">−20%</span>
                </span>
              </div>
            </div>

            {plansLoading ? (
              <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-96 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : (
              <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
                {plans.map((plan, index) => {
                  const meta = PLAN_ICONS[plan.slug] || PLAN_ICONS.starter;
                  const Icon = meta.Icon;
                  const isPopular = index === 1;
                  const annualPrice = plan.annual_price || Math.round(plan.monthly_price * 10);
                  const annualMonthly = Math.round(annualPrice / 12);
                  const annualSavings = plan.monthly_price * 12 - annualPrice;
                  const features = buildFeatureList(plan);
                  const isSelected = selectedPlan === plan.slug && showForm;

                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative rounded-2xl p-6 transition-all ${
                        isPopular
                          ? "border-2 border-primary bg-background shadow-xl shadow-primary/10"
                          : isSelected
                          ? "border-2 border-primary/60 bg-background"
                          : "border border-border bg-background"
                      }`}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-lg">
                            Más popular
                          </span>
                        </div>
                      )}

                      <div className="mb-6">
                        <div
                          className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/20 ${meta.opacity}`}
                        >
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{PLAN_SUBTITLES[plan.slug] || ""}</p>
                      </div>

                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-foreground">
                            {isAnnual ? annualMonthly : plan.monthly_price}€
                          </span>
                          <span className="text-sm text-muted-foreground">/mes</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {annualPrice}€/año {annualSavings > 0 && <>(ahorras {annualSavings}€)</>}
                        </p>
                      </div>

                      <ul className="mb-6 space-y-3">
                        {features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div
                              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                                isPopular ? "bg-primary/15" : "bg-secondary"
                              }`}
                            >
                              <Check className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handlePlanSelect(plan.slug as PlanSlug)}
                        className={`h-12 w-full rounded-xl font-medium ${
                          isPopular
                            ? "gradient-primary border-0 text-white"
                            : "border border-border bg-secondary text-foreground hover:bg-secondary/80"
                        }`}
                      >
                        Empezar gratis
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> 30 días gratis
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> Cancela cuando quieras
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> Sin permanencia
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
