import { motion } from "motion/react";
import { Building2, Check, Sparkles, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  "Landing page profesional personalizable",
  "Sistema de reservas online 24/7",
  "Gestión de calendario inteligente",
  "Reseñas y valoraciones de clientes",
  "Stories para promocionar tu trabajo",
  "Panel de administración completo",
];

export const JoinNetworkSection = () => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">1 mes gratis de prueba</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Únete a nuestra red de{" "}
            <span className="text-gradient">profesionales</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Digitaliza tu negocio con nuestra plataforma todo-en-uno. 
            Crea tu landing page profesional y empieza a recibir reservas online.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="ios-card p-6 relative"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Plan Mensual</h3>
                <p className="text-sm text-muted-foreground">Flexibilidad total</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">39,99€</span>
                <span className="text-muted-foreground">/mes</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Después del mes de prueba gratuito
              </p>
            </div>

            <ul className="space-y-3 mb-6">
              {features.slice(0, 4).map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button asChild variant="outline" className="w-full">
              <Link to="/onboarding">
                Empezar prueba gratis
              </Link>
            </Button>
          </motion.div>

          {/* Annual Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="ios-card p-6 relative border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5"
          >
            {/* Popular badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-semibold">
                <Crown className="h-3 w-3" />
                Más popular
              </span>
            </div>

            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Plan Anual</h3>
                <p className="text-sm text-muted-foreground">Ahorra 2 meses</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">399,99€</span>
                <span className="text-muted-foreground">/año</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Equivale a 33,33€/mes · <span className="text-success font-medium">Ahorras 79,89€</span>
              </p>
            </div>

            <ul className="space-y-3 mb-6">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button asChild className="w-full gradient-primary text-primary-foreground">
              <Link to="/onboarding">
                Empezar prueba gratis
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Trust badge */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          Sin compromiso · Cancela cuando quieras · Soporte incluido
        </motion.p>
      </div>
    </section>
  );
};
