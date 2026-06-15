import { motion } from "framer-motion";
import { ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuroraBackground } from "./AuroraBackground";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const FinalCTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative isolate overflow-hidden py-24 text-white md:py-32">
      <AuroraBackground />

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-balance text-3xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Monta tu salón en GlowApp
            <br className="hidden sm:block" /> en lo que tardas un café.
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-base text-white/65 sm:text-lg">
            Sin tarjeta, sin permanencia y sin saber de tecnología. Si no te
            convence, lo dejas cuando quieras.
          </p>

          <div className="mt-10 flex justify-center">
            <button
              onClick={() => navigate("/onboarding")}
              className="group relative inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.7)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-[0_12px_44px_-6px_hsl(var(--accent)/0.75)] active:scale-[0.98] sm:w-auto"
              style={{ backgroundImage: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))" }}
            >
              Crea tu salón gratis
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/55">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Listo en 5 minutos
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Sin tarjeta · Cancela cuando quieras
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
