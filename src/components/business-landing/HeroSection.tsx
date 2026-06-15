import { motion } from "framer-motion";
import { ArrowRight, Calendar, Globe, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuroraBackground } from "./AuroraBackground";
import { DemoLanding } from "./demos";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const HeroSection = () => {
  const navigate = useNavigate();

  const scrollToProduct = () =>
    document.getElementById("producto")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="relative isolate overflow-hidden text-white">
      <AuroraBackground />

      <div className="container relative z-10 mx-auto px-4 pb-24 pt-28 md:pb-32 md:pt-36">
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5 text-white/80" />
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/75 sm:text-xs">
              Para peluquerías, barberías y estética
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: EASE_OUT }}
            className="text-balance text-[2.5rem] font-bold leading-[1.04] tracking-tight sm:text-6xl md:text-[4.5rem] md:leading-[1.01]"
          >
            El sistema operativo
            <br className="hidden sm:block" /> de{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(100deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 60%, #c084fc 100%)",
              }}
            >
              tu salón
            </span>
            .
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease: EASE_OUT }}
            className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/70 sm:text-lg"
          >
            Reservas 24/7, agenda, caja y tu propia web. Todo en una sola app,
            pensada para que gestiones tu salón sin papeles ni complicaciones.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24, ease: EASE_OUT }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <button
              onClick={() => navigate("/onboarding")}
              className="group relative inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-semibold text-white shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.7)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-[0_12px_40px_-6px_hsl(var(--accent)/0.7)] active:scale-[0.98] sm:w-auto"
              style={{
                backgroundImage:
                  "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))",
              }}
            >
              Crea tu salón gratis
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={scrollToProduct}
              className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-6 py-4 text-base font-medium text-white backdrop-blur-md transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white/[0.12] active:scale-[0.98] sm:w-auto"
            >
              Ver el producto
            </button>
          </motion.div>

          {/* Microcopy */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-4 text-sm text-white/50"
          >
            Listo en 5 minutos · Sin tarjeta · Sin permanencia
          </motion.p>
        </div>

        {/* Product mockup — producto REAL */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: EASE_OUT }}
          className="relative mx-auto mt-16 w-[260px] sm:w-[290px]"
          style={{ aspectRatio: "9/19.5" }}
        >
          {/* Halo */}
          <div
            className="absolute -inset-10 rounded-[3rem] blur-3xl"
            style={{
              background:
                "radial-gradient(circle, hsl(var(--accent) / 0.4), hsl(var(--primary) / 0.25), transparent 70%)",
            }}
          />

          {/* Phone */}
          <div className="relative h-full rounded-[2.6rem] border border-white/15 bg-black p-[6px] shadow-2xl">
            <div className="absolute left-1/2 top-3 z-10 flex h-[26px] w-[90px] -translate-x-1/2 items-center justify-center rounded-full bg-black">
              <div className="mr-7 h-2 w-2 rounded-full bg-white/20" />
            </div>
            <div className="scrollbar-hide h-full overflow-hidden overflow-y-auto rounded-[2.2rem] bg-background pt-9">
              <DemoLanding />
            </div>
            <div className="absolute bottom-2.5 left-1/2 h-[4px] w-[110px] -translate-x-1/2 rounded-full bg-white/25" />
          </div>

          {/* Chips de feature factuales (no métricas inventadas) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.9, type: "spring", duration: 0.6, bounce: 0.3 }}
            className="absolute -left-6 top-24 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-3 py-2 backdrop-blur-xl sm:-left-12"
          >
            <Calendar className="h-4 w-4 text-white/90" />
            <span className="text-xs font-medium text-white/90">Reservas 24/7</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.85, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 1.05, type: "spring", duration: 0.6, bounce: 0.3 }}
            className="absolute -right-4 bottom-28 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-3 py-2 backdrop-blur-xl sm:-right-10"
          >
            <Globe className="h-4 w-4 text-white/90" />
            <span className="text-xs font-medium text-white/90">Tu propia web</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
