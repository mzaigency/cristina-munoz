import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock, Sparkles, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DemoLanding = lazy(() => import("./demos/DemoLanding"));

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Subtle gradient background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-radial from-primary/8 via-primary/3 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-gradient-radial from-accent/6 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 pt-28 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/15 mb-8"
          >
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-sm font-medium text-foreground/70">30 días gratis</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="text-foreground">Deja de perder clientes</span>
            <br />
            <span className="text-gradient">por WhatsApp</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            Tu salón de belleza merece más que una libreta. Reservas automáticas 24/7, cero llamadas perdidas y clientes que vuelven.
          </motion.p>

          {/* Key benefits pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            {[
              { icon: Calendar, text: "Tu propia web" },
              { icon: Clock, text: "Reservas 24/7" },
              { icon: Sparkles, text: "Listo en 10 min" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border"
              >
                <item.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground/80">{item.text}</span>
              </div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="w-full sm:w-auto text-lg px-8 py-6 rounded-full gradient-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all border-0"
              onClick={() => navigate("/onboarding")}
            >
              Empezar gratis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-lg px-8 py-6 rounded-full"
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Ver funciones
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-8 text-sm text-muted-foreground"
          >
            ✓ Configuración guiada · ✓ Sin conocimientos técnicos · ✓ Soporte incluido
          </motion.p>

          {/* iPhone mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-12 flex justify-center"
          >
            <div className="relative w-[260px] sm:w-[280px]">
              {/* iPhone frame */}
              <div className="relative rounded-[2.5rem] border-[6px] border-foreground/90 bg-background shadow-2xl shadow-primary/10 overflow-hidden" style={{ aspectRatio: '9/19.5' }}>
                {/* Dynamic Island */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[80px] h-[22px] bg-foreground/90 rounded-full z-20" />
                {/* Screen content */}
                <div className="absolute inset-0 pt-8 overflow-hidden">
                  <Suspense fallback={<div className="w-full h-full bg-muted animate-pulse" />}>
                    <DemoLanding />
                  </Suspense>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
