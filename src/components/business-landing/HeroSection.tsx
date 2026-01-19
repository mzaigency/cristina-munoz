import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, Calendar, Clock, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import glowAppLogo from "@/assets/glowapp-logo.png";

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      {/* Gradient background - GlowApp identity */}
      <div className="absolute inset-0 bg-[hsl(230,20%,6%)]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-radial from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-gradient-radial from-accent/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="absolute top-1/4 left-[10%] w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 blur-sm opacity-60"
        />
        <motion.div
          animate={{ y: [10, -10, 10], rotate: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
          className="absolute top-1/3 right-[15%] w-16 h-16 rounded-full bg-gradient-to-br from-accent/30 to-primary/20 blur-sm opacity-50"
        />
        <motion.div
          animate={{ y: [-5, 15, -5] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          className="absolute bottom-1/3 left-[20%] w-12 h-12 rounded-xl bg-primary/20 blur-sm opacity-40"
        />
      </div>

      <div className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <img src={glowAppLogo} alt="GlowApp" className="h-10 sm:h-12 mx-auto" />
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 mb-8"
          >
            <div className="flex items-center">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <span className="text-sm font-medium text-white/90">· 30 días gratis ·</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="text-white">Deja de perder clientes</span>
            <br />
            <span className="text-gradient">por WhatsApp</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-8"
          >
            Tu salón de belleza merece más que una libreta. Reservas automáticas 24/7, cero llamadas perdidas y clientes
            que vuelven.
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
              { icon: Sparkles, text: "Listo en 5 min" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <item.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-white/80">{item.text}</span>
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
              className="w-full sm:w-auto text-lg px-8 py-6 rounded-full gradient-primary shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all border-0"
              onClick={() => navigate("/onboarding")}
            >
              Empezar gratis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-lg px-8 py-6 rounded-full bg-white/5 border-white/20 text-white hover:bg-white/10"
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Play className="mr-2 w-5 h-5" />
              Ver funciones
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-8 text-sm text-white/40"
          >
            ✓ Configuración guiada · ✓ Sin conocimientos técnicos · ✓ Soporte incluido
          </motion.p>
        </div>

        {/* Hero mockup - Phone frame for mobile identity */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 max-w-md mx-auto"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-primary/10 to-transparent rounded-[3rem] blur-2xl transform scale-95" />

            {/* Phone frame */}
            <div className="relative bg-gradient-to-b from-[hsl(230,15%,18%)] to-[hsl(230,15%,12%)] rounded-[3rem] p-3 shadow-2xl border border-white/10">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[hsl(230,20%,6%)] rounded-b-2xl z-10" />

              {/* Screen */}
              <div className="aspect-[9/19] bg-gradient-to-br from-[hsl(230,20%,10%)] to-[hsl(230,20%,6%)] rounded-[2.5rem] overflow-hidden">
                <div className="w-full h-full flex flex-col items-center justify-center p-6">
                  {/* App header simulation */}
                  <div className="w-full flex items-center justify-between mb-6 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="h-3 w-20 bg-white/20 rounded" />
                        <div className="h-2 w-14 bg-white/10 rounded mt-1" />
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10" />
                  </div>

                  {/* Calendar preview */}
                  <div className="w-full bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white/60 text-sm font-medium">Hoy</span>
                      <span className="text-primary text-xs">Ver todo</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { time: "10:00", name: "María G.", service: "Corte + Color" },
                        { time: "11:30", name: "Laura P.", service: "Mechas" },
                        { time: "14:00", name: "Carmen R.", service: "Peinado" },
                      ].map((booking, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                          <div className="w-1 h-10 rounded-full bg-gradient-to-b from-primary to-accent" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-white/80 text-sm font-medium">{booking.name}</span>
                              <span className="text-white/40 text-xs">{booking.time}</span>
                            </div>
                            <span className="text-white/40 text-xs">{booking.service}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats preview */}
                  <div className="w-full grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
                      <span className="text-2xl font-bold text-primary">12</span>
                      <p className="text-white/40 text-xs">Citas hoy</p>
                    </div>
                    <div className="bg-accent/10 rounded-xl p-3 border border-accent/20">
                      <span className="text-2xl font-bold text-accent">€580</span>
                      <p className="text-white/40 text-xs">Estimado</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2"
        >
          <div className="w-1.5 h-3 rounded-full bg-white/40" />
        </motion.div>
      </motion.div>
    </section>
  );
};
