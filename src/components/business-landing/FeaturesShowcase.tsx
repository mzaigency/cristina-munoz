import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Calendar, LayoutDashboard, CreditCard, BarChart3, Camera, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const features = [
  {
    id: "landing",
    icon: Globe,
    title: "Tu web profesional",
    shortTitle: "Web",
    headline: "Tu salón en internet en 5 minutos",
    description:
      "Una página web profesional con tu marca, servicios y precios. Tus clientes te encontrarán en Google y podrán ver todo sobre tu negocio.",
    benefits: [
      "Dominio personalizado (glowapp.app/salon/tunombre)",
      "Optimizada para móviles y SEO",
      "Galería de trabajos y reseñas",
      "Información de contacto y ubicación",
    ],
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "bookings",
    icon: Calendar,
    title: "Reservas 24/7",
    shortTitle: "Reservas",
    headline: "Tus clientes reservan mientras duermes",
    description:
      "Sistema de reservas automático que funciona las 24 horas. Sin llamadas, sin WhatsApp, sin errores. El cliente elige fecha, hora y servicio.",
    benefits: [
      "Disponibilidad en tiempo real",
      "Confirmación automática por email",
      "Recordatorios antes de la cita",
      "Cancelaciones fáciles sin llamadas",
    ],
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "calendar",
    icon: LayoutDashboard,
    title: "Calendario inteligente",
    shortTitle: "Agenda",
    headline: "Control total de tu agenda",
    description:
      "Vista por estilista, por día o por semana. Arrastra citas, bloquea horas, gestiona vacaciones. Todo desde tu móvil o tablet.",
    benefits: ["Vista multi-estilista", "Bloqueos y descansos", "Citas recurrentes"],
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "payments",
    icon: CreditCard,
    title: "Caja registradora",
    shortTitle: "Caja",
    headline: "Cobros rápidos, cuentas claras",
    description:
      "Cobra en efectivo o tarjeta, aplica descuentos, gestiona propinas. Historial completo de todas las transacciones.",
    benefits: [
      "Cobro rápido al finalizar",
      "Descuentos y promociones",
      "Cierre de caja diario",
      "Historial de transacciones",
    ],
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Analytics y objetivos",
    shortTitle: "Datos",
    headline: "Métricas que importan",
    description:
      "Visualiza ingresos, reservas, servicios más populares. Establece objetivos mensuales y sigue tu progreso.",
    benefits: ["Dashboard de ingresos", "Servicios más vendidos", "Objetivos mensuales", "Comparativas temporales"],
    color: "from-indigo-500 to-violet-500",
  },
  {
    id: "stories",
    icon: Camera,
    title: "Stories y comunidad",
    shortTitle: "Social",
    headline: "Muestra tu trabajo al mundo",
    description:
      "Publica fotos de tus trabajos como stories. Tus seguidores las verán y podrán reservar directamente desde ahí.",
    benefits: [
      "Editor de stories integrado",
      "Visible para toda la comunidad",
      "Enlace directo a reservas",
      "Estadísticas de visualizaciones",
    ],
    color: "from-rose-500 to-pink-500",
  },
];

export const FeaturesShowcase = () => {
  const [activeFeature, setActiveFeature] = useState(features[0]);
  const navigate = useNavigate();

  return (
    <section id="features" className="py-20 bg-[hsl(230,20%,6%)]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Todo lo que necesitas</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-4 text-white">Funciones que transforman tu negocio</h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            Desde reservas automáticas hasta analytics avanzados. Todo diseñado específicamente para profesionales de la
            belleza.
          </p>
        </motion.div>

        {/* Feature tabs - horizontal scroll on mobile */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-8 scrollbar-hide -mx-4 px-4 md:justify-center md:flex-wrap">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => setActiveFeature(feature)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeFeature.id === feature.id
                  ? "gradient-primary text-white shadow-lg shadow-primary/30"
                  : "bg-white/5 hover:bg-white/10 text-white/60 border border-white/10"
              }`}
            >
              <feature.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{feature.title}</span>
              <span className="sm:hidden">{feature.shortTitle}</span>
            </button>
          ))}
        </div>

        {/* Feature content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFeature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-5xl mx-auto"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Content */}
              <div className="order-2 md:order-1">
                <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${activeFeature.color} mb-6`}>
                  <activeFeature.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-white">{activeFeature.headline}</h3>

                <p className="text-white/50 mb-6 leading-relaxed">{activeFeature.description}</p>

                <ul className="space-y-3 mb-8">
                  {activeFeature.benefits.map((benefit, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-white/70">{benefit}</span>
                    </motion.li>
                  ))}
                </ul>

                <Button
                  onClick={() => navigate("/auth?mode=register&business=true")}
                  className="rounded-full gradient-primary border-0"
                >
                  Probar esta función
                  <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </div>

              {/* Preview mockup */}
              <div className="order-1 md:order-2">
                <div className={`relative p-1 rounded-3xl bg-gradient-to-br ${activeFeature.color}`}>
                  <div className="bg-[hsl(230,20%,10%)] rounded-[22px] p-6 aspect-[4/3] flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div
                        className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${activeFeature.color} flex items-center justify-center`}
                      >
                        <activeFeature.icon className="w-10 h-10 text-white" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-40 mx-auto bg-white/10 rounded animate-pulse" />
                        <div className="h-3 w-28 mx-auto bg-white/5 rounded animate-pulse" />
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-6 max-w-xs mx-auto">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="aspect-video rounded-lg bg-white/5 animate-pulse" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
