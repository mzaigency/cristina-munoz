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
  Loader2, ArrowLeft, ArrowRight, Check, Plus,
  Shield, Lock, Clock, CreditCard, Ban,
} from "lucide-react";
import { AppLayout } from "@/components/navigation/AppLayout";
import { motion, AnimatePresence } from "motion/react";
import { SupportButton } from "@/components/common/SupportButton";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { gradientText, gradientBg, washBg, EASE } from "@/components/business-landing/_landingShared";

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
  { Icon: CreditCard, label: "Tarjeta solo de verificación" },
  { Icon: Ban, label: "Sin permanencia" },
];

const OBJECTIONS = [
  { q: "¿Y si no me convence?", a: "Primer mes gratis sin compromiso. Cancelas con un clic antes de que termine el periodo y no se cobra nada." },
  { q: "¿Es difícil de configurar?", a: "Un asistente te guía paso a paso. En 5 minutos tienes tu web lista con servicios, horarios y equipo." },
  { q: "¿Mis clientas sabrán usarlo?", a: "La experiencia de reserva es tan simple como pedir un taxi desde el móvil. Tus clientas reservan en un minuto." },
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
        description="Crea tu web profesional y recibe reservas 24/7. Primer mes gratis, sin permanencia. Lista en 5 minutos."
        canonicalUrl="/onboarding"
        faq={OBJECTIONS.map((o) => ({ question: o.q, answer: o.a }))}
      />

      <div className="font-poppins relative min-h-screen bg-background pb-24">
        {/* ===== Header píldora flotante ===== */}
        <div
          className="sticky top-0 z-40 flex justify-center px-3 pt-3"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <div className="flex w-full max-w-2xl items-center justify-between rounded-full border border-border bg-background/80 py-2 pl-4 pr-2 shadow-[0_8px_30px_-12px_rgba(20,22,48,0.25)] backdrop-blur-xl">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Volver
            </button>
            <button
              onClick={scrollToPricing}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-transform active:scale-[0.97]"
              style={{ backgroundImage: gradientBg }}
            >
              Empezar gratis
            </button>
          </div>
        </div>

        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden px-4 pb-16 pt-14 text-center md:pt-20" style={washBg}>
          <motion.div
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.04 } } }}
            initial="hidden"
            animate="show"
            className="relative mx-auto max-w-2xl"
          >
            <motion.span
              variants={{ hidden: { opacity: 0, y: 20, filter: "blur(10px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)" } }}
              transition={{ duration: 0.7, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-600"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              1er mes gratis · sin permanencia
            </motion.span>

            <motion.h1
              variants={{ hidden: { opacity: 0, y: 24, filter: "blur(12px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)" } }}
              transition={{ duration: 0.8, ease: EASE }}
              className="mx-auto mt-5 max-w-xl text-balance text-[2.5rem] font-extrabold leading-[1.03] tracking-[-0.03em] text-foreground sm:text-5xl md:text-6xl"
            >
              Crea tu salón online{" "}
              <span style={gradientText}>en 5 minutos.</span>
            </motion.h1>

            <motion.p
              variants={{ hidden: { opacity: 0, y: 22, filter: "blur(10px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)" } }}
              transition={{ duration: 0.7, ease: EASE }}
              className="mx-auto mt-5 max-w-md text-base text-muted-foreground sm:text-lg"
            >
              Tu web profesional con reservas 24/7, sin saber programar. Elige plan y monta tu salón hoy.
            </motion.p>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 18, filter: "blur(8px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)" } }}
              transition={{ duration: 0.65, ease: EASE }}
              className="mt-8 flex flex-col items-center gap-3"
            >
              <button
                onClick={scrollToPricing}
                className="group inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-[0_10px_34px_-8px_hsl(var(--primary)/0.7)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-[0_16px_44px_-8px_hsl(var(--accent)/0.7)] active:scale-[0.98]"
                style={{ backgroundImage: gradientBg }}
              >
                Crear mi salón gratis
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" /> Cancela cuando quieras · sin compromisos
              </p>
            </motion.div>

            {/* Chips de confianza */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.6, ease: EASE }}
              className="mt-9 flex flex-wrap items-center justify-center gap-2.5"
            >
              {TRUST_POINTS.map(({ Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-sm"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" /> {label}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ===== PRICING ===== */}
        <section ref={pricingRef} className="relative scroll-mt-20 px-4 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
              Elige tu plan.{" "}
              <span style={gradientText}>Cámbialo cuando quieras.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
              Primer mes gratis en todos. Sin comisión por reserva. Cancela con un clic.
            </p>
          </motion.div>

          {/* Toggle mensual/anual */}
          <div className="mb-10 mt-8 flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card/80 p-1 shadow-sm backdrop-blur-sm">
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
                <div key={i} className="h-[420px] animate-pulse rounded-[24px] bg-muted" />
              ))}
            </div>
          ) : (
            <div className="mx-auto grid max-w-5xl items-stretch gap-6 md:grid-cols-3">
              {plans.map((plan, index) => {
                const isPopular = index === 1;
                const annualPrice = plan.annual_price || Math.round(plan.monthly_price * 10);
                const annualMonthly = Math.round(annualPrice / 12);
                const annualSavings = plan.monthly_price * 12 - annualPrice;
                const features = buildFeatureList(plan);

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: index * 0.1, duration: 0.7, ease: EASE }}
                    className={`relative flex flex-col rounded-[24px] bg-card p-7 ${
                      isPopular
                        ? "border-2 border-primary shadow-[0_30px_60px_-30px_rgba(34,64,140,0.4)]"
                        : "border border-border"
                    }`}
                  >
                    {isPopular && (
                      <span
                        className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-bold text-white shadow-lg shadow-primary/30"
                        style={{ backgroundImage: gradientBg }}
                      >
                        Más popular
                      </span>
                    )}

                    <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{PLAN_SUBTITLES[plan.slug] || ""}</p>

                    <div className="mt-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold tracking-tight text-foreground">
                          {isAnnual ? annualMonthly : plan.monthly_price}€
                        </span>
                        <span className="text-sm text-muted-foreground">/mes</span>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {isAnnual ? (
                          <>
                            {annualPrice}€ facturados al año
                            {annualSavings > 0 && (
                              <span className="ml-1 font-semibold text-emerald-600">· ahorras {annualSavings}€</span>
                            )}
                          </>
                        ) : (
                          <>Facturación mensual · cancela cuando quieras</>
                        )}
                      </p>
                    </div>

                    <ul className="mt-6 mb-7 space-y-2.5">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary/10">
                            <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                          </span>
                          <span className="text-sm leading-snug text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto">
                      <button
                        onClick={() => handlePlanSelect(plan.slug as PlanSlug)}
                        className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-transform active:scale-[0.98] ${
                          isPopular
                            ? "text-white shadow-lg shadow-primary/25"
                            : "border border-foreground text-foreground hover:bg-foreground/[0.03]"
                        }`}
                        style={isPopular ? { backgroundImage: gradientBg } : undefined}
                      >
                        Empezar gratis
                        {isPopular && <ArrowRight className="h-4 w-4" />}
                      </button>
                      <p className="mt-2 text-center text-[11px] text-muted-foreground">
                        1er mes gratis
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Primer mes gratis</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Cancela cuando quieras</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Sin permanencia</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Soporte en español</span>
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
              className="scroll-mt-20 px-4 py-12"
              style={washBg}
            >
              <div className="mx-auto max-w-md rounded-[24px] border border-border bg-card p-6 shadow-[0_30px_60px_-30px_rgba(20,22,48,0.2)] sm:p-8">
                <div className="mb-6">
                  <p className="text-xs text-muted-foreground">Plan seleccionado</p>
                  <h3 className="mt-0.5 text-lg font-bold text-foreground">
                    Plan <span style={gradientText}>{currentPlanObj.name}</span>
                    <span className="text-muted-foreground"> · {isAnnual ? Math.round((currentPlanObj.annual_price || currentPlanObj.monthly_price * 10) / 12) : currentPlanObj.monthly_price}€/mes</span>
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {user ? "Solo necesitamos el nombre de tu salón." : "Crea una cuenta para continuar."}
                  </p>
                </div>

                {!user ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate("/auth?redirect=/onboarding&mode=register")}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-base font-semibold text-white shadow-lg shadow-primary/20"
                      style={{ backgroundImage: gradientBg }}
                    >
                      Crear cuenta gratis
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/auth?redirect=/onboarding")}
                      className="h-11 w-full rounded-full"
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
                              <Input placeholder="Mi Salón de Belleza" {...field} disabled={loading} className="h-11 rounded-xl" />
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
                            <FormLabel className="text-xs">Tu web será</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <span className="mr-2 shrink-0 text-[11px] text-muted-foreground">glowapp.app/</span>
                                <Input placeholder="mi-salon" {...field} disabled={loading} className="h-11 flex-1 rounded-xl" />
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
                              <Input type="email" placeholder="contacto@misalon.com" {...field} disabled={loading} className="h-11 rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-base font-semibold text-white shadow-xl shadow-primary/25 disabled:opacity-70"
                          style={{ backgroundImage: gradientBg }}
                        >
                          {loading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</>
                          ) : (
                            <>Continuar al pago <ArrowRight className="h-4 w-4" /></>
                          )}
                        </button>
                        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                          <Lock className="h-3 w-3" /> Pago seguro con Stripe · no se cobra el primer mes
                        </p>
                      </div>
                    </form>
                  </Form>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ===== FAQ ===== */}
        <section className="px-4 py-20 md:py-28">
          <motion.h2
            initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="mx-auto mb-12 max-w-2xl text-balance text-center text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl"
          >
            Dudas{" "}
            <span style={gradientText}>antes de empezar.</span>
          </motion.h2>
          <div className="mx-auto max-w-2xl">
            {OBJECTIONS.map((obj, i) => (
              <details key={i} className="group border-b border-border">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5">
                  <span className="text-base font-semibold text-foreground">{obj.q}</span>
                  <Plus className="h-5 w-5 flex-none text-muted-foreground transition-transform group-open:rotate-45 group-open:text-primary" />
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{obj.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="px-4 pb-10">
          <div className="mx-auto max-w-3xl rounded-[28px] border border-border p-8 text-center sm:p-12" style={washBg}>
            <h2 className="text-balance text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
              ¿Lista para{" "}
              <span style={gradientText}>digitalizar tu salón?</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
              Únete a los negocios que ya gestionan su salón con Glowapp.
            </p>
            <button
              onClick={scrollToPricing}
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-full px-7 text-base font-semibold text-white shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]"
              style={{ backgroundImage: gradientBg }}
            >
              Crear mi salón gratis
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Gratis el primer mes · sin permanencia · cancela cuando quieras
            </p>
          </div>
        </section>

        <SupportButton variant="floating" context="Registro de negocio" />
      </div>
    </AppLayout>
  );
}
