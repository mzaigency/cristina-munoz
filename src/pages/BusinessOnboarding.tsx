import { SEO } from "@/components/SEO";
import { useState, useEffect, useRef } from "react";
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
  Loader2, ArrowLeft, ArrowRight, Zap, Crown, Check, Sparkles, Users, Scissors, 
  Clock, Star, Shield, CalendarCheck, Gift, Phone, Globe, BarChart3, 
  MessageCircle, ChevronDown, Lock, CreditCard
} from "lucide-react";
import { AppLayout } from "@/components/navigation/AppLayout";
import { motion, AnimatePresence } from "motion/react";
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
  cta: string;
}

const PLANS: Record<PlanSlug, PlanInfo> = {
  starter: {
    name: "Starter",
    icon: <Zap className="h-5 w-5" />,
    monthlyPrice: 29,
    annualPrice: 290,
    stylists: "1 profesional",
    services: "15 servicios",
    features: ["Landing profesional", "Reservas 24/7", "Calendario inteligente", "Reseñas verificadas", "Stories"],
    color: "from-blue-500 to-cyan-500",
    cta: "Empezar gratis"
  },
  pro: {
    name: "Pro",
    icon: <Crown className="h-5 w-5" />,
    monthlyPrice: 49,
    annualPrice: 490,
    stylists: "3 profesionales",
    services: "50 servicios",
    features: ["Todo de Starter", "Caja registradora", "Analíticas avanzadas", "Promociones", "Paquetes de servicios"],
    color: "from-amber-500 to-orange-500",
    popular: true,
    cta: "Probar Pro gratis"
  },
  business: {
    name: "Business",
    icon: <Sparkles className="h-5 w-5" />,
    monthlyPrice: 89,
    annualPrice: 890,
    stylists: "Ilimitados",
    services: "Ilimitados",
    features: ["Todo de Pro", "Comisiones por estilista", "Objetivos mensuales", "Lista de espera", "Soporte prioritario"],
    color: "from-purple-500 to-pink-500",
    cta: "Probar Business"
  }
};

const BENEFITS = [
  { 
    icon: CalendarCheck, 
    title: "Reservas mientras duermes", 
    desc: "Tus clientes reservan 24/7. Sin llamadas, sin WhatsApps perdidos.",
    stat: "73%",
    statLabel: "reservan fuera de horario"
  },
  { 
    icon: Globe, 
    title: "Tu web profesional en 5 min", 
    desc: "Landing page optimizada con SEO, galería, servicios y reseñas.",
    stat: "5 min",
    statLabel: "para estar online"
  },
  { 
    icon: BarChart3, 
    title: "Controla tu negocio", 
    desc: "Caja registradora, analíticas y objetivos. Todo en un solo lugar.",
    stat: "2x",
    statLabel: "más organizado"
  },
];

const TESTIMONIALS = [
  {
    name: "María L.",
    role: "Peluquería Glamour",
    text: "Desde que uso GlowApp, las reservas por teléfono bajaron un 80%. Mis clientas reservan solas y yo tengo más tiempo.",
    rating: 5,
  },
  {
    name: "Carlos R.",
    role: "Barbería Urban",
    text: "La caja registradora y las analíticas me han cambiado el negocio. Ahora sé exactamente cuánto factura cada estilista.",
    rating: 5,
  },
  {
    name: "Ana P.",
    role: "Centro de Estética Bella",
    text: "En una semana ya tenía mi landing, servicios y calendario funcionando. Mis clientas están encantadas.",
    rating: 5,
  },
];

const OBJECTIONS = [
  { q: "¿Y si no me convence?", a: "30 días gratis sin compromiso. Sin tarjeta hasta que decidas. Cancelas con un clic." },
  { q: "¿Es difícil de configurar?", a: "Un asistente te guía paso a paso. En 5 minutos tienes tu web lista con servicios, horarios y equipo." },
  { q: "¿Mis clientes sabrán usarlo?", a: "La experiencia de reserva es tan simple como pedir un Uber. Tus clientes lo amarán." },
  { q: "¿Puedo cambiar de plan?", a: "Sí, puedes subir o bajar de plan en cualquier momento. Sin penalizaciones." },
];

export default function BusinessOnboarding() {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanSlug>("pro");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  const handlePlanSelect = (slug: PlanSlug) => {
    setSelectedPlan(slug);
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar",
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
  const savings = Math.round(currentPlan.monthlyPrice * 12 - currentPlan.annualPrice);

  return (
    <AppLayout hideNavigation>
      <SEO
        title="Digitaliza tu Salón - GlowApp | Reservas Online en 5 Minutos"
        description="Crea tu web profesional y recibe reservas 24/7. 30 días gratis. Sin tarjeta. Más de 500 salones ya confían en GlowApp."
        canonicalUrl="/onboarding"
      />

      {/* Minimal header */}
      <div 
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-white/10"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-8 w-8 rounded-full bg-white/5">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button 
            onClick={scrollToPricing}
            className="h-8 rounded-full gradient-primary text-primary-foreground text-xs px-4 shadow-lg shadow-primary/20"
          >
            Empezar gratis
          </Button>
        </div>
      </div>

      <div className="pb-24">
        {/* ===== HERO ===== */}
        <section className="px-4 pt-8 pb-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Urgency badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-500">30 días gratis · Sin tarjeta</span>
            </div>

            <h1 className="text-[28px] leading-[1.15] font-bold text-foreground mb-3 tracking-tight">
              Deja de perder clientes<br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                por no estar online
              </span>
            </h1>

            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6 leading-relaxed">
              Tu web profesional con reservas 24/7 lista en 5 minutos. Sin saber programar.
            </p>

            <Button 
              onClick={scrollToPricing}
              className="h-12 px-8 rounded-2xl gradient-primary text-primary-foreground shadow-xl shadow-primary/25 text-base font-semibold"
            >
              Crear mi salón gratis
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <p className="text-[11px] text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
              <Shield className="h-3 w-3" />
              Cancela cuando quieras · Sin compromisos
            </p>
          </motion.div>
        </section>

        {/* ===== SOCIAL PROOF BAR ===== */}
        <motion.section 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="px-4 mb-10"
        >
          <div className="flex items-center justify-center gap-4 py-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">500+</p>
              <p className="text-[10px] text-muted-foreground">Salones activos</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">50K+</p>
              <p className="text-[10px] text-muted-foreground">Reservas/mes</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center flex flex-col items-center">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">4.9 valoración</p>
            </div>
          </div>
        </motion.section>

        {/* ===== BENEFITS ===== */}
        <section className="px-4 mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl font-bold text-foreground text-center mb-6"
          >
            Todo lo que necesitas<br />para crecer
          </motion.h2>

          <div className="space-y-3">
            {BENEFITS.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <benefit.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground mb-0.5">{benefit.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{benefit.desc}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-primary">{benefit.stat}</p>
                  <p className="text-[9px] text-muted-foreground leading-tight">{benefit.statLabel}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ===== TESTIMONIALS ===== */}
        <section className="px-4 mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl font-bold text-foreground text-center mb-1"
          >
            Lo que dicen nuestros clientes
          </motion.h2>
          <p className="text-xs text-muted-foreground text-center mb-5">Historias reales de profesionales como tú</p>

          <div className="space-y-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/5"
              >
                <div className="flex gap-0.5 mb-2">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="h-3 w-3 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed mb-3 italic">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{t.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ===== PRICING ===== */}
        <section ref={pricingRef} className="px-4 mb-10 scroll-mt-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-6"
          >
            <h2 className="text-xl font-bold text-foreground mb-1">Elige tu plan</h2>
            <p className="text-xs text-muted-foreground">30 días gratis en todos los planes</p>
          </motion.div>

          {/* Billing toggle */}
          <div className="flex flex-col items-center gap-2 mb-5">
            <div className="relative inline-flex items-center gap-0.5 p-1 rounded-2xl bg-white/5 border border-white/10">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  billingCycle === "monthly"
                    ? "bg-background/80 shadow-sm text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Mensual
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  billingCycle === "annual"
                    ? "bg-primary shadow-sm text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Anual
              </button>
              <span className="absolute -top-2 -right-1 bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                -17%
              </span>
            </div>
            <AnimatePresence>
              {billingCycle === "annual" && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-[11px] text-emerald-500 font-medium flex items-center gap-1"
                >
                  <Gift className="h-3 w-3" />
                  Ahorras hasta 178€/año
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Plan cards */}
          <div className="space-y-3">
            {(Object.entries(PLANS) as [PlanSlug, PlanInfo][]).map(([slug, plan], idx) => {
              const isSelected = selectedPlan === slug && showForm;
              const monthlyEq = billingCycle === "annual" ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice;
              const planSavings = Math.round(plan.monthlyPrice * 12 - plan.annualPrice);
              
              return (
                <motion.div
                  key={slug}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06 }}
                  className={`relative rounded-2xl border transition-all ${
                    plan.popular
                      ? "border-primary/30 bg-primary/[0.03]"
                      : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-[10px] px-3 py-0.5 rounded-full font-semibold shadow-sm">
                        Más popular
                      </span>
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-xl bg-gradient-to-br ${plan.color} text-white`}>
                          {plan.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">{plan.name}</h3>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-foreground">{monthlyEq}€</span>
                            <span className="text-[11px] text-muted-foreground">/mes</span>
                            {billingCycle === "annual" && (
                              <span className="text-[10px] text-muted-foreground line-through ml-1">{plan.monthlyPrice}€</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handlePlanSelect(slug)}
                        variant={plan.popular ? "default" : "outline"}
                        className={`h-9 rounded-xl text-xs px-4 ${
                          plan.popular 
                            ? "gradient-primary text-primary-foreground shadow-md shadow-primary/20" 
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        {plan.cta}
                      </Button>
                    </div>

                    {billingCycle === "annual" && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground">
                          Facturado {plan.annualPrice}€/año
                        </span>
                        <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          Ahorras {planSavings}€
                        </span>
                      </div>
                    )}

                    {/* Features row */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 pt-3 border-t border-white/5">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> {plan.stylists}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Scissors className="h-3 w-3" /> {plan.services}
                      </span>
                      {plan.features.slice(0, 2).map((f, fi) => (
                        <span key={fi} className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Check className="h-3 w-3 text-emerald-500" /> {f}
                        </span>
                      ))}
                      {plan.features.length > 2 && (
                        <span className="text-[10px] text-primary font-medium">
                          +{plan.features.length - 2} más
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ===== FORM ===== */}
        <AnimatePresence>
          {showForm && (
            <motion.section
              ref={formRef}
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: 20, height: 0 }}
              className="px-4 mb-10 scroll-mt-20"
            >
              <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-5">
                <div className="text-center mb-5">
                  <div className="flex items-center justify-center gap-2 mb-1.5">
                    <div className={`p-1.5 rounded-xl bg-gradient-to-br ${currentPlan.color} text-white`}>
                      {currentPlan.icon}
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Plan {currentPlan.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {user ? "Solo necesitamos el nombre de tu salón" : "Crea una cuenta para continuar"}
                  </p>
                </div>

                {!user ? (
                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigate("/auth?redirect=/onboarding&mode=register")} 
                      className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground shadow-lg shadow-primary/20"
                    >
                      Crear cuenta gratis
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/auth?redirect=/onboarding")}
                      className="w-full h-11 rounded-2xl bg-white/5 border-white/10 text-sm"
                    >
                      Ya tengo cuenta
                    </Button>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
                      <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Nombre del salón</FormLabel>
                            <FormControl>
                              <Input placeholder="Mi Salón de Belleza" {...field} disabled={loading} className="h-11 rounded-xl bg-white/5 border-white/10" />
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
                                <span className="text-[11px] text-muted-foreground mr-2 shrink-0">glowapp.app/</span>
                                <Input placeholder="mi-salon" {...field} disabled={loading} className="h-11 rounded-xl flex-1 bg-white/5 border-white/10" />
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
                              <Input type="email" placeholder="contacto@misalon.com" {...field} disabled={loading} className="h-11 rounded-xl bg-white/5 border-white/10" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="pt-2">
                        <Button
                          type="submit"
                          className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground shadow-xl shadow-primary/25 text-base font-semibold"
                          disabled={loading}
                        >
                          {loading ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...</>
                          ) : (
                            <>
                              Empezar 30 días gratis
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </>
                          )}
                        </Button>

                        {/* Trust signals under CTA */}
                        <div className="flex items-center justify-center gap-3 mt-3">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Lock className="h-3 w-3" /> SSL seguro
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <CreditCard className="h-3 w-3" /> Sin tarjeta
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Shield className="h-3 w-3" /> Cancela gratis
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

        {/* ===== FAQ / OBJECTIONS ===== */}
        <section className="px-4 mb-10">
          <h2 className="text-lg font-bold text-foreground text-center mb-4">Preguntas frecuentes</h2>
          <div className="space-y-2">
            {OBJECTIONS.map((obj, i) => (
              <details
                key={i}
                className="group rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden"
              >
                <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                  <span className="text-sm font-medium text-foreground pr-4">{obj.q}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-4 pt-0">
                  <p className="text-xs text-muted-foreground leading-relaxed">{obj.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="px-4 mb-8">
          <div className="text-center p-6 rounded-2xl bg-primary/5 border border-primary/10">
            <h2 className="text-lg font-bold text-foreground mb-2">
              ¿Listo para digitalizar tu salón?
            </h2>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
              Únete a más de 500 profesionales que ya gestionan su negocio con GlowApp.
            </p>
            <Button
              onClick={scrollToPricing}
              className="h-11 px-6 rounded-2xl gradient-primary text-primary-foreground shadow-lg shadow-primary/20 font-semibold"
            >
              Crear mi salón gratis
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-[10px] text-muted-foreground mt-2">
              Sin tarjeta · Sin compromiso · Cancela cuando quieras
            </p>
          </div>
        </section>

        <SupportButton variant="floating" context="Registro de negocio" />
      </div>
    </AppLayout>
  );
}
