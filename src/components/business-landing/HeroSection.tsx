import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EASE } from "./_landingShared";

/**
 * Hero editorial de Glowapp — registro bold/tipográfico (sin scrollytelling).
 * Titular geométrico grande en una sola fuente (Plus Jakarta), con la frase de
 * cierre en el gradiente de marca. Fondo blanco con washes sutiles de marca
 * (los aporta LandingBackground de fondo). Entrada premium: blur + fade + stagger
 * escalonado con la curva de easing de marca. Sin phone mockup — la tipografía
 * es el hero, como acordamos.
 */

const rise = {
  hidden: { opacity: 0, y: 26, filter: "blur(12px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export const HeroSection = () => {
  const navigate = useNavigate();

  const scrollToProduct = () =>
    document.getElementById("producto")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="relative isolate flex min-h-[92svh] items-center justify-center overflow-hidden px-4 pb-24 pt-32 md:pt-40">
      {/* Wash local extra para dar profundidad al hero sobre el fondo global */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(60% 50% at 50% 12%, hsl(var(--accent) / 0.12) 0%, hsl(var(--primary) / 0.06) 42%, transparent 78%)",
        }}
      />

      <motion.div
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } } }}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-4xl text-center"
      >
        {/* Chip de contexto (no eyebrow de sección) */}
        <motion.div
          variants={rise}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 shadow-sm backdrop-blur-sm"
        >
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-medium text-muted-foreground">
            Software para salones · España
          </span>
        </motion.div>

        {/* Titular */}
        <motion.h1
          variants={rise}
          transition={{ duration: 0.8, ease: EASE }}
          className="text-balance text-[2.75rem] font-extrabold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-6xl md:text-[4.5rem]"
        >
          El único sistema que hace
          <br className="hidden sm:block" /> crecer tu salón{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))",
            }}
          >
            de verdad.
          </span>
        </motion.h1>

        {/* Subtítulo */}
        <motion.p
          variants={rise}
          transition={{ duration: 0.7, ease: EASE }}
          className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          Más clientas nuevas, y que vuelvan cada menos tiempo. Todo bajo tu
          marca, sin comisión por reserva y desde el móvil.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={rise}
          transition={{ duration: 0.65, ease: EASE }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <button
            onClick={() => navigate("/onboarding")}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-semibold text-white shadow-[0_10px_34px_-8px_hsl(var(--primary)/0.7)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-[0_16px_44px_-8px_hsl(var(--accent)/0.7)] active:scale-[0.98] sm:w-auto"
            style={{
              backgroundImage:
                "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))",
            }}
          >
            Empieza gratis hoy
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={scrollToProduct}
            className="inline-flex w-full items-center justify-center rounded-full border border-border bg-card/70 px-6 py-4 text-base font-medium text-foreground backdrop-blur-sm transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-card active:scale-[0.98] sm:w-auto"
          >
            Ver el panel
          </button>
        </motion.div>

        {/* Microcopy */}
        <motion.p
          variants={rise}
          transition={{ duration: 0.6, ease: EASE }}
          className="mt-5 text-sm text-muted-foreground/80"
        >
          Listo en 5 minutos · 1er mes gratis · Sin permanencia
        </motion.p>
      </motion.div>
    </section>
  );
};
