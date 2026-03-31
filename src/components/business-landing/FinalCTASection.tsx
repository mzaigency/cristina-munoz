import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const FinalCTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-gradient-to-br from-primary via-primary to-accent relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >


          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">Tu negocio merece crecer</h2>

          <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
            Empieza hoy con 30 días gratis y descubre por qué los profesionales de la belleza eligen GlowApp.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 rounded-full shadow-xl"
              onClick={() => navigate("/onboarding")}
            >
              Empezar gratis ahora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-white/70 text-sm">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Configura en 15 min
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Cancela cuando quieras
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
