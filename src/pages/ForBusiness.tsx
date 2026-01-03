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
  Users,
  Clock,
  Shield,
  TrendingUp,
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

const stats = [
  { value: "500+", label: "Negocios activos", icon: Building2 },
  { value: "50K+", label: "Reservas mensuales", icon: Calendar },
  { value: "98%", label: "Satisfacción", icon: Star },
  { value: "24/7", label: "Soporte", icon: Clock },
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

const testimonials = [
  {
    name: "María García",
    business: "Salón Elegance",
    text: "Desde que usamos GlowApp, nuestras reservas han aumentado un 40%. ¡Increíble!",
    rating: 5,
  },
  {
    name: "Carlos Ruiz",
    business: "Barbería Vintage",
    text: "La mejor inversión para mi negocio. Mis clientes adoran poder reservar online.",
    rating: 5,
  },
  {
    name: "Laura Martínez",
    business: "Centro Bienestar Zen",
    text: "El panel de administración es súper intuitivo. Ahorro horas cada semana.",
    rating: 5,
  },
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

      {/* Header - Identical to Index */}
      <div className="sticky top-0 z-50">
        <div className="relative bg-gradient-to-b from-background via-background/98 to-background/90 backdrop-blur-3xl">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          
          <div className="px-5 pt-4 pb-5 safe-area-top">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-between"
            >
              <Link to="/" className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                >
                  <img src="/favicon.png" alt="GlowApp" className="h-10 w-10 drop-shadow-lg" />
                </motion.div>
                <div>
                  <h1 className="text-[28px] font-black tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent leading-none">
                    GlowApp
                  </h1>
                  <p className="text-[11px] text-muted-foreground/70 font-medium tracking-wide mt-0.5">
                    Tu belleza, conectada
                  </p>
                </div>
              </Link>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 rounded-xl shadow-lg shadow-primary/25"
                >
                  <Link to="/onboarding" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Prueba gratis
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
          
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        </div>
      </div>

      {/* Hero Section - Enhanced */}
      <section className="py-16 md:py-28 px-5 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto max-w-5xl text-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 text-primary mb-6 border border-primary/20"
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-bold">1 mes gratis · Sin compromiso</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black text-foreground mb-6 leading-[1.1] tracking-tight"
          >
            Haz crecer tu negocio
            <br />
            <span className="text-primary">con GlowApp</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            La plataforma todo en uno para peluquerías, barberías, spas y centros de estética. 
            Más clientes, menos trabajo administrativo.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button 
              asChild 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg h-14 px-8 rounded-2xl shadow-xl shadow-primary/30"
            >
              <Link to="/onboarding">
                Empezar prueba gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg" 
              className="font-bold text-lg h-14 px-8 rounded-2xl border-2"
            >
              <Link to="/">Ver demo</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-5 border-y border-border/50 bg-secondary/30">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 mb-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-black text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid - Enhanced */}
      <section className="py-20 px-5">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">
              Todo lo que necesitas
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Herramientas profesionales diseñadas para hacer crecer tu negocio de belleza.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="group p-6 rounded-3xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-5 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">
              Lo que dicen nuestros clientes
            </h2>
            <p className="text-muted-foreground text-lg">
              Negocios reales, resultados reales.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-3xl bg-card border border-border/50"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-foreground mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <div className="font-bold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.business}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Enhanced */}
      <section className="py-20 px-5">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">Planes simples</h2>
            <p className="text-muted-foreground text-lg">Sin costes ocultos. Cancela cuando quieras.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-card border border-border/50"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-xl">Plan Mensual</h3>
                  <p className="text-sm text-muted-foreground">Flexibilidad total</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-foreground">39,99€</span>
                  <span className="text-muted-foreground text-lg">/mes</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Después del mes de prueba</p>
              </div>

              <ul className="space-y-3 mb-8">
                {allBenefits.slice(0, 5).map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button asChild variant="outline" className="w-full h-12 rounded-xl font-bold text-base border-2">
                <Link to="/onboarding">Empezar prueba gratis</Link>
              </Button>
            </motion.div>

            {/* Annual Plan - Featured */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-card border-2 border-primary/30 relative overflow-hidden"
            >
              {/* Popular badge */}
              <div className="absolute -top-px left-1/2 -translate-x-1/2">
                <div className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-b-xl flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5" />
                  Más popular
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6 mt-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-xl">Plan Anual</h3>
                  <p className="text-sm text-muted-foreground">Ahorra 2 meses</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-foreground">399,99€</span>
                  <span className="text-muted-foreground text-lg">/año</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  33,33€/mes · <span className="text-primary font-bold">Ahorras 79,89€</span>
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {allBenefits.slice(0, 7).map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button 
                asChild 
                className="w-full h-12 rounded-xl font-bold text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
              >
                <Link to="/onboarding">Empezar prueba gratis</Link>
              </Button>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center text-sm text-muted-foreground mt-8 flex items-center justify-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Sin compromiso · Cancela cuando quieras · 30 días de garantía
          </motion.p>
        </div>
      </section>

      {/* Final CTA - Enhanced */}
      <section className="py-20 px-5 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(var(--accent)/0.1),transparent_50%)]" />
        
        <div className="container mx-auto max-w-3xl text-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-bold">Únete a +500 negocios</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-foreground mb-4"
          >
            ¿Listo para crecer?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground mb-10"
          >
            Empieza hoy con 1 mes gratis. Sin tarjeta de crédito.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Button 
              asChild 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg h-14 px-10 rounded-2xl shadow-xl shadow-primary/30"
            >
              <Link to="/onboarding">
                Empezar ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-5 border-t border-border safe-area-bottom">
        <div className="container mx-auto max-w-6xl flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="GlowApp" className="h-6 w-6" />
            <p className="text-sm text-muted-foreground">© {currentYear} GlowApp. Todos los derechos reservados.</p>
          </div>
          <div className="flex gap-6">
            <Link to="/terminos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Términos
            </Link>
            <Link to="/privacidad" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacidad
            </Link>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Volver al inicio
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
