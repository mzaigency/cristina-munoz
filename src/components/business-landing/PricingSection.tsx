import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Crown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";

// Todos los planes usan el gradiente de marca (primary → accent).
// La diferenciación entre tiers se hace con el icono y la opacidad.
const PLAN_ICONS: Record<string, { icon: typeof Zap; opacity: string }> = {
  starter: { icon: Zap, opacity: "opacity-70" },
  pro: { icon: Crown, opacity: "opacity-100" },
  business: { icon: Building2, opacity: "opacity-100" },
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

export const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const navigate = useNavigate();
  const { plans, loading } = useSubscriptionPlans();

  const buildFeatureList = (plan: typeof plans[0]) => {
    const list: string[] = [];
    const ms = plan.max_stylists;
    const sv = plan.max_services;
    list.push(ms && ms >= 999 ? "Profesionales ilimitados" : `${ms || 1} profesional${(ms || 1) > 1 ? "es" : ""}`);
    list.push(sv && sv >= 999 ? "Servicios ilimitados" : `Hasta ${sv || 15} servicios`);

    // Add inherited label for non-starter
    const idx = plans.indexOf(plan);
    if (idx === 1) list.push("Todo de Starter +");
    if (idx === 2) list.push("Todo de Pro +");

    if (plan.features) {
      // Only show features unique to this tier (not in the previous tier)
      const prevFeatures = idx > 0 ? plans[idx - 1]?.features || {} : {};
      Object.entries(plan.features).forEach(([key, enabled]) => {
        if (enabled && !prevFeatures[key] && FEATURE_LABELS[key]) {
          list.push(FEATURE_LABELS[key]);
        }
      });
    }
    return list;
  };

  if (loading) {
    return (
      <section id="precio" className="scroll-mt-20 py-24 md:py-32 bg-secondary/40">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="precio" className="scroll-mt-20 py-24 md:py-32 bg-secondary/40">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            Precio plano.{" "}
            <span
              style={{
                background: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Sin sorpresas.
            </span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mt-4 mb-8 sm:text-lg">
            Primer mes gratis en todos los planes. Sin comisión por reserva. Cancela cuando quieras.
          </p>

          <div className="inline-flex items-center gap-3 p-1 rounded-full bg-background border border-border">
            <span className={`text-sm px-3 py-1.5 rounded-full transition-colors ${!isAnnual ? "bg-primary/10 text-foreground font-medium" : "text-muted-foreground"}`}>
              Mensual
            </span>
            <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
            <span className={`text-sm px-3 py-1.5 rounded-full transition-colors ${isAnnual ? "bg-primary/10 text-foreground font-medium" : "text-muted-foreground"}`}>
              Anual
              <span className="ml-1 text-xs text-emerald-600 font-medium">Ahorra 20%</span>
            </span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const meta = PLAN_ICONS[plan.slug] || PLAN_ICONS.starter;
            const Icon = meta.icon;
            const isPopular = index === 1;
            const annualPrice = plan.annual_price || Math.round(plan.monthly_price * 10);
            const annualMonthly = Math.round(annualPrice / 12);
            const annualSavings = plan.monthly_price * 12 - annualPrice;
            const features = buildFeatureList(plan);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl p-6 ${
                  isPopular
                    ? "bg-background border-2 border-primary shadow-xl shadow-primary/10"
                    : "bg-background border border-border"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-lg">
                      Más popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div className={`w-11 h-11 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20 ${meta.opacity}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{PLAN_SUBTITLES[plan.slug] || ""}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {isAnnual ? annualMonthly : plan.monthly_price}€
                    </span>
                    <span className="text-sm text-muted-foreground">/mes</span>
                  </div>
                  <p className="text-xs mt-1 text-muted-foreground">
                    {isAnnual
                      ? `o ${annualPrice}€/año (ahorra ${annualSavings}€)`
                      : `o ${annualPrice}€/año (ahorra ${annualSavings}€)`}
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isPopular ? "bg-primary/15" : "bg-secondary"}`}>
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full rounded-xl h-12 font-medium ${
                    isPopular
                      ? "gradient-primary border-0 text-white"
                      : "bg-secondary hover:bg-secondary/80 text-foreground border border-border"
                  }`}
                  onClick={() => navigate("/onboarding")}
                >
                  Empezar gratis
                </Button>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-muted-foreground"
        >
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            30 días gratis
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            Cancela cuando quieras
          </span>
        </motion.div>
      </div>
    </section>
  );
};
