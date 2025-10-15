import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import heroImage from "@/assets/salon-hero.jpg";

interface HeroSectionProps {
  onBookNow: () => void;
}

export const HeroSection = ({ onBookNow }: HeroSectionProps) => {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0 transition-transform duration-700 hover:scale-105" 
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
      </div>

      <div className="container relative z-10 px-4 py-20 text-center md:text-left">
        <div className="mx-auto max-w-2xl space-y-6">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl animate-fade-in">
            Bienvenida a<br />
            <span className="text-salon-pink-dark bg-gradient-to-r from-salon-primary to-salon-accent bg-clip-text text-transparent">
              Cristina Muñoz
            </span>
          </h1>

          <p className="mb-8 text-lg text-muted-foreground md:text-xl animate-fade-in stagger-1">
            Experimenta el cuidado profesional del cabello en un ambiente elegante y relajante.
            Reserva tu cita online y déjanos realzar tu belleza natural.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center md:justify-start animate-fade-in stagger-2">
            <Button 
              size="lg" 
              onClick={onBookNow} 
              className="bg-salon-pink-dark text-white hover:bg-salon-pink-dark/90 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Reservar Cita
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-salon-primary"
            >
              Ver Servicios
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};