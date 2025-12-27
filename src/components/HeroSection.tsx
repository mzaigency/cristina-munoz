import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";

interface HeroSectionProps {
  onBookNow: () => void;
  onViewServices: () => void;
  businessName?: string;
  tagline?: string;
}

export const HeroSection = ({ 
  onBookNow, 
  onViewServices, 
  businessName = import.meta.env.VITE_BUSINESS_NAME,
  tagline = "Tu peluquería de confianza en Santpedor. Donde la belleza y el estilo se encuentran."
}: HeroSectionProps) => {
  const scrollToServices = () => {
    const element = document.getElementById("servicios");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
      
      <div className="absolute inset-0 z-0">
        <img 
          src="/images/foto-hero.jpg" 
          alt="Interior de Cristina Muñoz Peluquería en Santpedor - Salón profesional de peluquería con ambiente elegante y moderno"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          width={1920}
          height={1080}
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/65" />
      </div>

      {/* Main content */}
      <div className="container relative z-10 px-4 text-center flex-1 flex items-center justify-center">
        <div className="mx-auto max-w-3xl space-y-8">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-bold tracking-tight font-playfair text-white text-5xl md:text-7xl"
          >
            {businessName}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="text-base text-white md:text-lg font-normal"
          >
            {tagline}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col gap-4 sm:flex-row sm:justify-center"
          >
            <Button
              size="lg"
              onClick={onBookNow}
              className="bg-primary text-primary-foreground font-semibold rounded-full hover:scale-105 transition-transform"
            >
              Reservar Cita
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onViewServices}
              className="hover:bg-white/10 hover:text-white border-2 border-primary rounded-full bg-transparent text-white font-bold hover:scale-105 transition-transform"
            >
              Ver Servicios
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <button
          onClick={scrollToServices}
          className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer group"
          aria-label="Scroll hacia abajo"
        >
          <span className="text-sm font-light tracking-widest uppercase">Descubre más</span>
          <ChevronDown className="w-6 h-6 animate-bounce" />
        </button>
      </motion.div>
    </section>
  );
};
