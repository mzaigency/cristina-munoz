import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Scissors, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatedHeroBackground } from "./AnimatedHeroBackground";
import { DemoLanding } from "./demos";
import { LiveSalonsRow } from "./LiveSalonsRow";

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-background">
      <AnimatedHeroBackground />

      <div className="container mx-auto px-4 pt-24 pb-12 md:pt-28 md:pb-20 relative z-10">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-12 items-center max-w-6xl mx-auto">
          {/* LEFT — Copy */}
          <div className="text-center lg:text-left">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/70 backdrop-blur border border-border shadow-sm mb-6"
            >
              <Scissors className="w-3.5 h-3.5 text-accent" />
              <span className="text-[11px] sm:text-xs font-medium text-foreground/80 tracking-wide uppercase">
                Hecho en España · Para peluquerías, barberías y estética
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-[2.25rem] leading-[1.05] sm:text-5xl md:text-6xl lg:text-[4.25rem] lg:leading-[1.02] font-bold tracking-tight mb-5"
            >
              <span className="text-foreground">Tu libreta no debería</span>
              <br />
              <span className="text-foreground">decidir cuánto facturas</span>
              <br />
              <span className="italic font-serif font-normal text-gradient">este mes.</span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-7 leading-relaxed"
            >
              GlowApp gestiona tus reservas, tu caja y tus clientes mientras tú haces lo que mejor sabes hacer:{" "}
              <span className="text-foreground font-medium">que la gente salga guapa por la puerta.</span>
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 mb-6"
            >
              <Button
                size="lg"
                className="text-base px-7 py-6 rounded-full gradient-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all border-0 group"
                onClick={() => navigate("/onboarding")}
              >
                Probar 30 días gratis
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-base px-5 py-6 rounded-full hover:bg-secondary"
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Ver cómo funciona
              </Button>
            </motion.div>

            {/* Live status / proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center gap-2 justify-center lg:justify-start text-xs sm:text-sm text-muted-foreground"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              <span>
                <span className="font-semibold text-foreground">Reservas online</span> activas ahora mismo
              </span>
            </motion.div>

            {/* Salon names row — dynamic from DB */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <LiveSalonsRow />
            </motion.div>
          </div>

          {/* RIGHT — Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="relative mx-auto"
          >
            <div
              className="relative mx-auto w-[260px] sm:w-[280px] lg:w-[300px]"
              style={{ aspectRatio: "9/19.5" }}
            >
              {/* Glow halo */}
              <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-primary/30 via-accent/20 to-transparent blur-3xl" />

              {/* Phone */}
              <div className="relative h-full bg-foreground rounded-[2.4rem] p-[6px] border border-border shadow-2xl">
                {/* Dynamic island */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[90px] h-[26px] bg-foreground rounded-full z-10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-foreground/40 mr-7" />
                </div>
                <div className="h-full rounded-[2rem] overflow-hidden bg-background overflow-y-auto scrollbar-hide pt-9">
                  <DemoLanding />
                </div>
                {/* Bottom bar */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-[110px] h-[4px] bg-foreground/30 rounded-full" />
              </div>

              {/* Floating sticker — proof */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, type: "spring" }}
                className="absolute -left-4 top-20 sm:-left-8 bg-background rounded-2xl border border-border shadow-xl px-3 py-2 flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-muted-foreground leading-tight">Ahorro semanal</p>
                  <p className="text-sm font-bold text-foreground leading-tight">+8 horas</p>
                </div>
              </motion.div>

              {/* Floating sticker — booking */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, type: "spring" }}
                className="absolute -right-3 bottom-28 sm:-right-6 bg-background rounded-2xl border border-border shadow-xl px-3 py-2"
              >
                <p className="text-[10px] text-muted-foreground leading-tight">Nueva reserva</p>
                <p className="text-sm font-bold text-foreground leading-tight">María · 17:30</p>
                <p className="text-[10px] text-success leading-tight font-medium">Confirmada ✓</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
