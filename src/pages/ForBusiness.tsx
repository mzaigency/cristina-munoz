import { SEO } from "@/components/SEO";
import { motion } from "motion/react";
import {
  Building2,
  Check,
  Sparkles,
  Crown,
  Zap,
  Calendar,
  Star,
  MessageSquare,
  BarChart3,
  Palette,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Palette,
    title: "Landing page profesional",
    description: "Tu propia página web personalizada con tu marca, colores y estilo único.",
  },
  {
    icon: Calendar,
    title: "Sistema de reservas 24/7",
    description: "Tus clientes pueden reservar cita online en cualquier momento del día.",
  },
  {
    icon: BarChart3,
    title: "Gestión de calendario",
    description: "Calendario inteligente con vista de estilistas, bloqueos y recurrencias.",
  },
  {
    icon: Star,
    title: "Reseñas verificadas",
    description: "Sistema de valoraciones que genera confianza en nuevos clientes.",
  },
  {
    icon: MessageSquare,
    title: "Stories y promociones",
    description: "Comparte tu trabajo y ofertas especiales con toda la comunidad.",
  },
  {
    icon: Sparkles,
    title: "Panel de administración",
    description: "Gestiona servicios, precios, horarios y equipo desde un solo lugar.",
  },
];

const allBenefits = [
  "Landing page profesional personalizable",
  "Sistema de reservas online 24/7",
  "Gestión de calendario inteligente",
  "Reseñas y valoraciones de clientes",
  "Stories para promocionar tu trabajo",
  "Panel de administración completo",
  "Múltiples estilistas/profesionales",
  "Recordatorios automáticos a clientes",
  "Estadísticas y métricas del negocio",
  "Soporte técnico prioritario",
];

export default function ForBusiness() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="GlowApp para Negocios | Tu Salón en la Plataforma Líder de Belleza"
        description="Únete a GlowApp y haz crecer tu negocio de belleza. Landing page profesional, sistema de reservas 24/7, gestión de equipo y más. 1 mes gratis."
        keywords="software peluquería, reservas salón belleza, gestión barbería, plataforma spa, agenda online estética"
        canonicalUrl="/para-negocios"
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.png" alt="GlowApp" className="h-8 w-8" />
            <span className="text-2xl font-extrabold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              GlowApp
            </span>
          </Link>
          <Button asChild>
            <Link to="/onboarding">Empezar gratis</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6"
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">1 mes gratis de prueba</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
          >
            Haz crecer tu negocio con <span className="text-gradient">GlowApp</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            La plataforma todo en uno para peluquerías, barberías, spas y centros de estética. Conecta con nuevos
            clientes y gestiona tu negocio desde un solo lugar.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button asChild size="lg" className="gradient-primary text-primary-foreground">
              <Link to="/onboarding">
                Empezar prueba gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Todo lo que necesitas para tu negocio
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Herramientas profesionales diseñadas para negocios de belleza como el tuyo.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="ios-card p-6"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Planes simples y transparentes</h2>
            <p className="text-muted-foreground text-lg">Sin costes ocultos. Cancela cuando quieras.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="ios-card p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">Plan Mensual</h3>
                  <p className="text-sm text-muted-foreground">Flexibilidad total</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-foreground">39,99€</span>
                  <span className="text-muted-foreground text-lg">/mes</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Después del mes de prueba gratuito</p>
              </div>

              <ul className="space-y-3 mb-8">
                {allBenefits.slice(0, 6).map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button asChild variant="outline" className="w-full" size="lg">
                <Link to="/onboarding">Empezar prueba gratis</Link>
              </Button>
            </motion.div>

            {/* Annual Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="ios-card p-8 relative border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-semibold">
                  <Crown className="h-3 w-3" />
                  Más popular
                </span>
              </div>

              <div className="flex items-center gap-3 mb-6 mt-2">
                <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">Plan Anual</h3>
                  <p className="text-sm text-muted-foreground">Ahorra 2 meses</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-foreground">399,99€</span>
                  <span className="text-muted-foreground text-lg">/año</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Equivale a 33,33€/mes · <span className="text-success font-medium">Ahorras 79,89€</span>
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {allBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button asChild className="w-full gradient-primary text-primary-foreground" size="lg">
                <Link to="/onboarding">Empezar prueba gratis</Link>
              </Button>
            </motion.div>
          </div>

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

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
          >
            ¿Listo para empezar?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground mb-8"
          >
            Únete a cientos de negocios que ya confían en GlowApp para crecer.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Button asChild size="lg" className="gradient-primary text-primary-foreground">
              <Link to="/onboarding">
                Empezar prueba gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="GlowApp" className="h-6 w-6" />
            <p className="text-sm text-muted-foreground">© {currentYear} GlowApp. Todos los derechos reservados.</p>
          </div>
          <div className="flex gap-4">
            <Link to="/terminos" className="text-sm text-muted-foreground hover:text-foreground">
              Términos de uso
            </Link>
            <Link to="/privacidad" className="text-sm text-muted-foreground hover:text-foreground">
              Política de privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
