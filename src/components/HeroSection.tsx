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
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
      </div>

      <div className="container relative z-10 px-4 py-20 text-center md:text-left">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-salon-pink-light px-4 py-2">
            <Sparkles className="h-4 w-4 text-salon-pink-dark" />
            <span className="text-sm font-medium text-salon-pink-dark">Tu belleza, nuestra pasión</span>
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Bienvenida a<br />
            <span className="text-salon-pink-dark">Cristina Muñoz</span>
          </h1>

          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            Experimenta el cuidado profesional del cabello en un ambiente elegante y relajante.
            Reserva tu cita online y déjanos realzar tu belleza natural.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center md:justify-start">
            <Button
              size="lg"
              onClick={onBookNow}
              className="bg-salon-pink-dark text-white hover:bg-salon-pink-dark/90"
            >
              Reservar Cita
            </Button>
            <Button size="lg" variant="outline">
              Ver Servicios
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
