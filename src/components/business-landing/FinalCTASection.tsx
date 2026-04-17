import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const FinalCTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Brand gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent" />

      {/* Animated blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
          animate={{ x: [-200, -150, -200], y: [-200, -150, -200] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"
          animate={{ x: [200, 150, 200], y: [200, 150, 200] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/25 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-medium text-white tracking-wide uppercase">
              Tu salón, en su mejor versión
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-5 leading-[1.05]">
            Deja que GlowApp se encargue.
            <br />
            <span className="italic font-serif font-normal text-white/85">
              Tú dedícate a brillar.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-white/80 mb-9 max-w-xl mx-auto">
            30 días gratis. Sin tarjeta. Sin permanencia. Si no te enamora, te vas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-white text-primary hover:bg-white/95 text-base font-semibold px-8 py-6 rounded-full shadow-2xl group"
              onClick={() => navigate("/onboarding")}
            >
              Empezar gratis ahora
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-white/75 text-sm">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Listo en 10 minutos
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Cancela cuando quieras
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
