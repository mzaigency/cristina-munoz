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
import glowappLogo from "@/assets/glowapp-logo.png";
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
  {
    value: "500+",
    label: "Negocios activos",
    icon: Building2,
  },
  {
    value: "50K+",
    label: "Reservas mensuales",
    icon: Calendar,
  },
  {
    value: "98%",
    label: "Satisfacción",
    icon: Star,
  },
  {
    value: "24/7",
    label: "Soporte",
    icon: Clock,
  },
];
export default function ForBusiness() {
  const currentYear = new Date().getFullYear();
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Software para Salones de Belleza | GlowApp para Negocios"
        description="Gestiona tu peluquería, barbería o spa con GlowApp. Reservas online 24/7, calendario inteligente, reseñas y tu propia landing page. Prueba 1 mes gratis."
        keywords="software peluquería, app reservas salón, gestión barbería online, plataforma spa, agenda digital estética, sistema citas belleza"
        canonicalUrl="/para-negocios"
        breadcrumbs={[
          {
            name: "Inicio",
            url: "/",
          },
          {
            name: "Para Negocios",
            url: "/para-negocios",
          },
        ]}
        faq={[
          {
            question: "¿Cuánto cuesta GlowApp para negocios?",
            answer:
              "GlowApp ofrece 3 planes: Starter desde 29€/mes, Pro desde 49€/mes y Business desde 89€/mes. Todos incluyen 30 días de prueba gratis.",
          },
          {
            question: "¿Qué incluye la plataforma para negocios?",
            answer:
              "Incluye landing page profesional, sistema de reservas 24/7, gestión de calendario, stories y promociones, y un panel de administración completo. Las funcionalidades varían según el plan.",
          },
          {
            question: "¿Puedo gestionar varios estilistas?",
            answer:
              "Sí, dependiendo de tu plan: Starter incluye 1 profesional, Pro hasta 3 y Business profesionales ilimitados.",
          },
          {
            question: "¿Cómo empiezo a usar GlowApp?",
            answer:
              "Regístrate gratis y configura tu negocio en minutos. No necesitas conocimientos técnicos y tendrás 30 días de prueba sin compromiso.",
          },
        ]}
      />

      {/* Header - Mobile optimized with iPhone safe area */}
      <div className="sticky top-0 z-50">
        <div
          className="relative bg-gradient-to-b from-background via-background/98 to-background/90 backdrop-blur-3xl"
          style={{
            paddingTop: "env(safe-area-inset-top)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <div className="px-4 pt-3 pb-4">
            <motion.div
              initial={{
                opacity: 0,
                y: -12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-center justify-between"
            >
              <Link to="/">
                <motion.img
                  src={glowappLogo}
                  alt="GlowApp"
                  className="h-8 object-contain rounded-xl"
                  initial={{
                    scale: 0.9,
                    opacity: 0,
                  }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                  }}
                  transition={{
                    delay: 0.1,
                    type: "spring",
                    stiffness: 200,
                  }}
                />
              </Link>

              <motion.div
                whileHover={{
                  scale: 1.02,
                }}
                whileTap={{
                  scale: 0.98,
                }}
              >
                <Button
                  asChild
                  size="default"
                  className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 rounded-xl shadow-lg shadow-primary/25 text-sm"
                >
                  <Link to="/onboarding" className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">Prueba gratis</span>
                    <span className="sm:hidden">Gratis</span>
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>

          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        </div>
      </div>

      {/* Hero Section - Mobile optimized */}
      <section className="py-10 md:py-20 px-4 relative overflow-hidden">
        {/* Background decorations - smaller on mobile */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-10 left-0 w-48 md:w-72 h-48 md:h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-5 right-0 w-56 md:w-96 h-56 md:h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary mb-4 md:mb-6 border border-primary/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-xs md:text-sm font-bold">1 mes gratis · Sin compromiso</span>
          </motion.div>

          <motion.h1
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.1,
              duration: 0.6,
            }}
            className="text-3xl md:text-5xl lg:text-6xl font-black text-foreground mb-4 md:mb-6 leading-[1.1] tracking-tight"
          >
            Haz crecer tu negocio
            <br />
            <span className="text-primary">con GlowApp</span>
          </motion.h1>

          <motion.p
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.2,
            }}
            className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-6 md:mb-8 px-2"
          >
            La plataforma todo en uno para peluquerías, barberías, spas y centros de estética.
          </motion.p>

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.3,
            }}
            className="flex flex-col sm:flex-row gap-3 justify-center px-2"
          >
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl shadow-xl shadow-primary/30"
            >
              <Link to="/onboarding">
                Empezar gratis
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats Section - Mobile optimized */}
      <section className="py-8 md:py-12 px-4 border-y border-border/50 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    delay: index * 0.1,
                  }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 mb-2 md:mb-3">
                    <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-foreground">{stat.value}</div>
                  <div className="text-xs md:text-sm text-muted-foreground font-medium">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid - Mobile optimized */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            className="text-center mb-8 md:mb-14"
          >
            <h2 className="text-2xl md:text-4xl font-black text-foreground mb-2 md:mb-4">Todo lo que necesitas</h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto px-2">
              Herramientas profesionales para hacer crecer tu negocio.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    delay: index * 0.05,
                  }}
                  className="group p-4 md:p-6 rounded-2xl md:rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300"
                >
                  <div className="h-11 w-11 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center mb-3 md:mb-5 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 md:h-7 md:w-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-base md:text-lg mb-1 md:mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>


      {/* Pricing Section - Mobile optimized */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            className="text-center mb-8 md:mb-14"
          >
            <h2 className="text-2xl md:text-4xl font-black text-foreground mb-2 md:mb-4">Planes simples</h2>
            <p className="text-muted-foreground text-sm md:text-base">Sin costes ocultos. Cancela cuando quieras.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              className="p-5 md:p-6 rounded-2xl md:rounded-3xl bg-card border border-border/50"
            >
              <div className="flex items-center gap-3 mb-4 md:mb-5">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Starter</h3>
                  <p className="text-xs text-muted-foreground">Para empezar</p>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl md:text-4xl font-black text-foreground">29€</span>
                  <span className="text-muted-foreground text-sm">/mes</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">o 290€/año (ahorra 58€)</p>
              </div>

              <ul className="space-y-2 mb-5">
                <li className="flex items-start gap-2 text-xs">
                  <Check className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">1 profesional</span>
                </li>
                <li className="flex items-start gap-2 text-xs">
                  <Check className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">Hasta 15 servicios</span>
                </li>
                <li className="flex items-start gap-2 text-xs">
                  <Check className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">Página web personalizable</span>
                </li>
                <li className="flex items-start gap-2 text-xs">
                  <Check className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">Reservas online 24/7</span>
                </li>
                <li className="flex items-start gap-2 text-xs">
                  <Check className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">Stories y mensajes</span>
                </li>
              </ul>

              <Button asChild variant="outline" className="w-full h-10 rounded-xl font-bold text-sm border-2">
                <Link to="/onboarding">Empezar gratis</Link>
              </Button>
            </motion.div>

            {/* Pro Plan - Featured */}
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                delay: 0.1,
              }}
              className="p-5 md:p-6 rounded-2xl md:rounded-3xl bg-card border-2 border-primary/30 relative overflow-hidden"
            >
              {/* Popular badge */}
              <div className="absolute -top-px left-1/2 -translate-x-1/2">
                <div className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-b-lg flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Más popular
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4 md:mb-5 mt-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Pro</h3>
                  <p className="text-xs text-muted-foreground">Para crecer</p>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl md:text-4xl font-black text-foreground">49€</span>
                  <span className="text-muted-foreground text-sm">/mes</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">o 490€/año (ahorra 98€)</p>
              </div>

              <ul className="space-y-2 mb-5">
                <li className="flex items-start gap-2 text-xs">
                  <Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">Hasta 3 profesionales</span>
                </li>
                <li className="flex items-start gap-2 text-xs">
                  <Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">Hasta 50 servicios</span>
                </li>
                <li className="flex items-start gap-2 text-xs">
                  <Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">Todo de Starter +</span>
                </li>
                <li className="flex items-start gap-2 text-xs">
                  <Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">Caja registradora</span>
                </li>
                <li className="flex items-start gap-2 text-xs">
                  <Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">Analytics avanzados</span>
                </li>
                <li className="flex items-start gap-2 text-xs">
                  <Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">Promociones y paquetes</span>
                </li>
              </ul>

              <Button
                asChild
                className="w-full h-10 rounded-xl font-bold text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
              >
                <Link to="/onboarding">Empezar gratis</Link>
              </Button>
            </motion.div>

            {/* Business Plan */}
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                delay: 0.2,
              }}
              className="p-5 md:p-6 rounded-2xl md:rounded-3xl bg-card border border-border/50"
            >
              <div className="flex items-center gap-3 mb-4 md:mb-5">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Business</h3>
                  <p className="text-xs text-muted-foreground">Sin límites</p>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl md:text-4xl font-black text-foreground">89€</span>
                  <span className="text-muted-foreground text-sm">/mes</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">o 890€/año (ahorra 178€)</p>
              </div>

              <ul className="space-y-2 mb-5">
                <li className="flex items-start gap-2 text-xs">
                  <Check className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">Profesionales ilimitados</span>
                </li>
                <li className="flex items-start gap-2 text-xs">
                  <Check className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">Servicios ilimitados</span>
                </li>
                <li className="flex items-start gap-2 text-xs">
                  <Check className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">Todo de Pro +</span>
                </li>
                <li className="flex items-start gap-2 text-xs">
                  <Check className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">Comisiones por estilista</span>
                </li>
                <li className="flex items-start gap-2 text-xs">
                  <Check className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">Objetivos mensuales</span>
                </li>
                <li className="flex items-start gap-2 text-xs">
                  <Check className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">Lista de espera</span>
                </li>
              </ul>

              <Button asChild variant="outline" className="w-full h-10 rounded-xl font-bold text-sm border-2">
                <Link to="/onboarding">Empezar gratis</Link>
              </Button>
            </motion.div>
          </div>

          <motion.p
            initial={{
              opacity: 0,
            }}
            whileInView={{
              opacity: 1,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              delay: 0.3,
            }}
            className="text-center text-xs md:text-sm text-muted-foreground mt-6 md:mt-8 flex flex-wrap items-center justify-center gap-1.5 md:gap-2"
          >
            <Shield className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Sin compromiso · Cancela cuando quieras
          </motion.p>
        </div>
      </section>

      {/* Final CTA - Mobile optimized */}
      <section className="py-12 md:py-20 px-4 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.1),transparent_50%)]" />

        <div className="max-w-3xl mx-auto text-center relative">
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            whileInView={{
              opacity: 1,
              scale: 1,
            }}
            viewport={{
              once: true,
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary mb-4 md:mb-6"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-xs md:text-sm font-bold">Únete a +500 negocios</span>
          </motion.div>

          <motion.h2
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            className="text-2xl md:text-4xl font-black text-foreground mb-2 md:mb-4"
          >
            ¿Listo para crecer?
          </motion.h2>
          <motion.p
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              delay: 0.1,
            }}
            className="text-sm md:text-lg text-muted-foreground mb-6 md:mb-10"
          >
            Empieza hoy con 1 mes gratis. Sin tarjeta.
          </motion.p>
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              delay: 0.2,
            }}
          >
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base md:text-lg h-12 md:h-14 px-8 md:px-10 rounded-xl md:rounded-2xl shadow-xl shadow-primary/30"
            >
              <Link to="/onboarding">
                Empezar ahora
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-5 border-t border-border safe-area-bottom">
        <div className="container mx-auto max-w-6xl flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2 rounded-none">
            <img src="/favicon.png" alt="GlowApp" className="h-6 w-6 rounded-xl" />
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
