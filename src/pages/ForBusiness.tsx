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

      {/* Header - with safe area for iPhone */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 safe-area-top">
        <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.png" alt="GlowApp" className="h-7 w-7 md:h-8 md:w-8" />
            <span className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              GlowApp
            </span>
          </Link>
          <Button asChild size="sm" className="text-sm md:text-base md:px-4">
            <Link to="/onboarding">Empezar gratis</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section - Mobile optimized */}
      <section className="py-12 md:py-20 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary/10 text-primary mb-4 md:mb-6"
          >
            <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="text-xs md:text-sm font-medium">1 mes gratis de prueba</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6 leading-tight"
          >
            Haz crecer tu negocio con <span className="text-gradient">GlowApp</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 md:mb-8 px-2"
          >
            La plataforma todo en uno para peluquerías, barberías, spas y centros de estética.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button asChild size="lg" className="gradient-primary text-primary-foreground w-full sm:w-auto">
              <Link to="/onboarding">
                Empezar prueba gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid - Mobile optimized */}
      <section className="py-12 md:py-20 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
              Todo lo que necesitas
            </h2>
            <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto px-2">
              Herramientas profesionales para tu negocio de belleza.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="ios-card p-4 md:p-6"
                >
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 md:mb-4">
                    <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm md:text-base mb-1 md:mb-2">{feature.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 md:line-clamp-none">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section - Mobile optimized */}
      <section className="py-12 md:py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">Planes simples</h2>
            <p className="text-muted-foreground text-sm md:text-lg">Sin costes ocultos. Cancela cuando quieras.</p>
          </motion.div>

          <div className="grid gap-4 md:gap-8 max-w-4xl mx-auto">
            {/* Annual Plan - First on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="ios-card p-5 md:p-8 relative border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 order-1 md:order-2"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 px-3 md:px-4 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-semibold">
                  <Crown className="h-3 w-3" />
                  Más popular
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4 md:mb-6 mt-2">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Building2 className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base md:text-lg">Plan Anual</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Ahorra 2 meses</p>
                </div>
              </div>

              <div className="mb-5 md:mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-bold text-foreground">399,99€</span>
                  <span className="text-muted-foreground text-base md:text-lg">/año</span>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">
                  33,33€/mes · <span className="text-success font-medium">Ahorras 79,89€</span>
                </p>
              </div>

              <ul className="space-y-2 md:space-y-3 mb-5 md:mb-8">
                {allBenefits.slice(0, 6).map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                    <Check className="h-3.5 w-3.5 md:h-4 md:w-4 text-success shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button asChild className="w-full gradient-primary text-primary-foreground" size="lg">
                <Link to="/onboarding">Empezar prueba gratis</Link>
              </Button>
            </motion.div>

            {/* Monthly Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="ios-card p-5 md:p-8 order-2 md:order-1"
            >
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-secondary flex items-center justify-center">
                  <Zap className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base md:text-lg">Plan Mensual</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Flexibilidad total</p>
                </div>
              </div>

              <div className="mb-5 md:mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-bold text-foreground">39,99€</span>
                  <span className="text-muted-foreground text-base md:text-lg">/mes</span>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">Después del mes de prueba</p>
              </div>

              <ul className="space-y-2 md:space-y-3 mb-5 md:mb-8">
                {allBenefits.slice(0, 4).map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                    <Check className="h-3.5 w-3.5 md:h-4 md:w-4 text-success shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button asChild variant="outline" className="w-full" size="lg">
                <Link to="/onboarding">Empezar prueba gratis</Link>
              </Button>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center text-xs md:text-sm text-muted-foreground mt-6 md:mt-8"
          >
            Sin compromiso · Cancela cuando quieras
          </motion.p>
        </div>
      </section>

      {/* CTA Section - Mobile optimized */}
      <section className="py-12 md:py-20 px-4 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-4xl font-bold text-foreground mb-3 md:mb-4"
          >
            ¿Listo para empezar?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm md:text-lg text-muted-foreground mb-6 md:mb-8 px-2"
          >
            Únete a cientos de negocios que ya confían en GlowApp.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Button asChild size="lg" className="gradient-primary text-primary-foreground w-full sm:w-auto">
              <Link to="/onboarding">
                Empezar prueba gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer - Mobile optimized */}
      <footer className="py-6 md:py-8 px-4 border-t border-border safe-area-bottom">
        <div className="container mx-auto max-w-6xl flex flex-col items-center gap-3 md:flex-row md:justify-between md:gap-4">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="GlowApp" className="h-5 w-5 md:h-6 md:w-6" />
            <p className="text-xs md:text-sm text-muted-foreground">© {currentYear} GlowApp</p>
          </div>
          <div className="flex gap-4">
            <Link to="/terminos" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">
              Términos
            </Link>
            <Link to="/privacidad" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">
              Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
