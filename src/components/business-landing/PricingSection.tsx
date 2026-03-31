import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Crown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    subtitle: "Para empezar",
    icon: Zap,
    iconGradient: "from-blue-400 to-blue-600",
    monthlyPrice: 29,
    annualPrice: 290,
    annualSavings: 58,
    popular: false,
    features: ["1 profesional", "Hasta 15 servicios", "Página web personalizable", "Reservas online 24/7", "Mensajes directos"],
  },
  {
    name: "Pro",
    subtitle: "Para crecer",
    icon: Crown,
    iconGradient: "from-amber-400 to-orange-500",
    monthlyPrice: 49,
    annualPrice: 490,
    annualSavings: 98,
    popular: true,
    features: ["Hasta 3 profesionales", "Hasta 50 servicios", "Todo de Starter +", "Caja registradora", "Analytics avanzados", "Promociones y paquetes"],
  },
  {
    name: "Business",
    subtitle: "Sin límites",
    icon: Building2,
    iconGradient: "from-purple-400 to-pink-500",
    monthlyPrice: 89,
    annualPrice: 890,
    annualSavings: 178,
    popular: false,
    features: ["Profesionales ilimitados", "Servicios ilimitados", "Todo de Pro +", "Comisiones por estilista", "Objetivos mensuales", "Lista de espera"],
  },
];

export const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Precios transparentes</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-4 text-foreground">Elige tu plan</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Todos los planes incluyen 30 días de prueba gratis. Cancela cuando quieras.
          </p>

          {/* Billing toggle */}
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
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl p-6 ${
                plan.popular
                  ? "bg-background border-2 border-primary shadow-xl shadow-primary/10"
                  : "bg-background border border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-lg">
                    Más popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.iconGradient} flex items-center justify-center mb-4`}>
                  <plan.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.subtitle}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    {isAnnual ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice}€
                  </span>
                  <span className="text-sm text-muted-foreground">/mes</span>
                </div>
                <p className="text-xs mt-1 text-muted-foreground">
                  {isAnnual ? `o ${plan.annualPrice}€/año (ahorra ${plan.annualSavings}€)` : `o ${plan.annualPrice}€/año (ahorra ${plan.annualSavings}€)`}
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.popular ? "bg-primary/15" : "bg-secondary"}`}>
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full rounded-xl h-12 font-medium ${
                  plan.popular
                    ? "gradient-primary border-0 text-white"
                    : "bg-secondary hover:bg-secondary/80 text-foreground border border-border"
                }`}
                onClick={() => navigate("/onboarding")}
              >
                Empezar gratis
              </Button>
            </motion.div>
          ))}
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
