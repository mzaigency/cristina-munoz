import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Calendar, LayoutDashboard, CreditCard, BarChart3, Check, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DemoCalendar, DemoBookingFlow, DemoCashRegister, DemoAnalytics, DemoLanding, DemoDashboard } from "./demos";

const BRAND_GRADIENT = "from-primary to-accent";

const features = [
  {
    id: "dashboard",
    icon: Sparkles,
    title: "Panel de control",
    shortTitle: "Panel",
    headline: "Abres la app y sabes cómo va el día en 3 segundos",
    description:
      "Ingresos, próxima cita, mensajes sin leer, reseñas pendientes. Todo a un golpe de vista, sin abrir 5 pantallas.",
    benefits: [
      "KPIs del día en tiempo real",
      "Acciones rápidas (cobrar, nueva cita, bloquear)",
      "Próxima cita siempre visible",
      "Comparativa vs semana anterior",
    ],
    color: BRAND_GRADIENT,
    Demo: DemoDashboard,
  },
  {
    id: "landing",
    icon: Globe,
    title: "Tu web profesional",
    shortTitle: "Web",
    headline: "Tu salón en Google, no escondido en Instagram",
    description:
      "Una web con tu nombre, tus precios y tus trabajos. Para que cuando alguien busque «peluquería cerca de mí», te encuentre a ti.",
    benefits: [
      "Dominio propio (glowapp.app/tunombre)",
      "Optimizada para móvil y SEO",
      "Galería de tus mejores trabajos",
      "Tu ubicación, horarios y reseñas",
    ],
    color: BRAND_GRADIENT,
    Demo: DemoLanding,
  },
  {
    id: "bookings",
    icon: Calendar,
    title: "Reservas 24/7",
    shortTitle: "Reservas",
    headline: "Mientras cierras caja, ya tienes 3 reservas para mañana",
    description:
      "Tus clientes reservan ellos solos. Tú no contestas WhatsApps a las 23:47. Todos felices.",
    benefits: [
      "Disponibilidad real, en tiempo real",
      "Confirmación automática por email",
      "Recordatorio automático antes de la cita",
      "Si cancelan, el hueco vuelve a estar libre solo",
    ],
    color: BRAND_GRADIENT,
    Demo: DemoBookingFlow,
  },
  {
    id: "calendar",
    icon: LayoutDashboard,
    title: "Calendario inteligente",
    shortTitle: "Agenda",
    headline: "Tu agenda, sin post-its ni dramas",
    description:
      "Vista por estilista, día o semana. Arrastra una cita, bloquea una hora, planifica vacaciones. Todo en un golpe de vista.",
    benefits: [
      "Vista multi-estilista en una pantalla",
      "Bloqueos, descansos y vacaciones",
      "Citas recurrentes con un clic",
    ],
    color: BRAND_GRADIENT,
    Demo: DemoCalendar,
  },
  {
    id: "payments",
    icon: CreditCard,
    title: "Caja registradora",
    shortTitle: "Caja",
    headline: "Cierre de caja en 30 segundos, no en 30 minutos",
    description:
      "Cobra en efectivo o tarjeta, aplica descuentos, gestiona propinas. El cierre del día se hace solo.",
    benefits: [
      "Cobro al terminar el servicio",
      "Descuentos y promociones",
      "Cierre diario automático",
      "Histórico completo de movimientos",
    ],
    color: BRAND_GRADIENT,
    Demo: DemoCashRegister,
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Analytics y objetivos",
    shortTitle: "Datos",
    headline: "Sabe qué servicio te da más margen sin abrir Excel",
    description:
      "Ingresos, reservas, servicios estrella, clientes que vuelven. Sin hojas de cálculo, sin calculadora.",
    benefits: [
      "Dashboard de ingresos en vivo",
      "Tus servicios más rentables",
      "Objetivos mensuales con progreso",
      "Comparativas mes a mes",
    ],
    color: BRAND_GRADIENT,
    Demo: DemoAnalytics,
  },
];

export const FeaturesShowcase = () => {
  const [activeFeature, setActiveFeature] = useState(features[0]);
  const navigate = useNavigate();
  const ActiveDemo = activeFeature.Demo;
  const contentRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (feature: typeof features[0]) => {
    setActiveFeature(feature);
    if (window.innerWidth < 768 && contentRef.current) {
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Todo lo que necesitas</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-4 text-foreground">Funciones que transforman tu negocio</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Desde reservas automáticas hasta analytics avanzados. Todo diseñado para profesionales de la belleza.
          </p>
        </motion.div>

        {/* Feature tabs */}
        <div className="sticky top-16 z-20 bg-background py-3 -mx-4 px-4 md:static md:py-0 md:mx-0 md:px-0 md:mb-8">
          <div className="flex overflow-x-auto gap-2 pb-2 md:pb-4 scrollbar-hide md:justify-center md:flex-wrap">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => handleTabChange(feature)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeFeature.id === feature.id
                    ? "gradient-primary text-white shadow-lg shadow-primary/20"
                    : "bg-secondary hover:bg-secondary/80 text-muted-foreground border border-border"
                }`}
              >
                <feature.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{feature.title}</span>
                <span className="sm:hidden">{feature.shortTitle}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feature content */}
        <AnimatePresence mode="wait">
          <motion.div
            ref={contentRef}
            key={activeFeature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-5xl mx-auto scroll-mt-32 pt-4 md:pt-0"
          >
            {/* Mobile layout */}
            <div className="md:hidden space-y-6">
              <div className="relative mx-auto w-[220px]" style={{ aspectRatio: "9/19.5" }}>
                <div className={`absolute -inset-1 rounded-[2.5rem] bg-gradient-to-br ${activeFeature.color} opacity-30 blur-md`} />
                <div className="relative h-full bg-foreground/5 rounded-[2.2rem] p-[6px] border border-border">
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[72px] h-[22px] bg-foreground rounded-full z-10 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-foreground/30 mr-6" />
                  </div>
                  <div className="h-full rounded-[1.8rem] overflow-hidden bg-background overflow-y-auto scrollbar-hide pt-8">
                    <ActiveDemo />
                  </div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-foreground/20 rounded-full" />
                </div>
              </div>

              <div className="text-center px-2">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${activeFeature.color} mb-4`}>
                  <activeFeature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">{activeFeature.headline}</h3>
                <p className="text-muted-foreground text-sm mb-5 leading-relaxed">{activeFeature.description}</p>
                <ul className="space-y-3 mb-6 text-left max-w-xs mx-auto">
                  {activeFeature.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Button onClick={() => navigate("/onboarding")} className="rounded-full gradient-primary border-0">
                  Probar esta función
                  <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Desktop layout */}
            <div className="hidden md:grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${activeFeature.color} mb-6`}>
                  <activeFeature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-foreground">{activeFeature.headline}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">{activeFeature.description}</p>
                <ul className="space-y-3 mb-8">
                  {activeFeature.benefits.map((benefit, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{benefit}</span>
                    </motion.li>
                  ))}
                </ul>
                <Button onClick={() => navigate("/onboarding")} className="rounded-full gradient-primary border-0">
                  Probar esta función
                  <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </div>

              <div className="relative mx-auto w-[280px]" style={{ aspectRatio: "9/19.5" }}>
                <div className={`absolute -inset-1 rounded-[2.5rem] bg-gradient-to-br ${activeFeature.color} opacity-30 blur-md`} />
                <div className="relative h-full bg-foreground/5 rounded-[2.2rem] p-[6px] border border-border">
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[90px] h-[28px] bg-foreground rounded-full z-10 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-foreground/30 mr-8" />
                  </div>
                  <div className="h-full rounded-[1.8rem] overflow-hidden bg-background overflow-y-auto scrollbar-hide pt-10">
                    <ActiveDemo />
                  </div>
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-[120px] h-[5px] bg-foreground/20 rounded-full" />
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
