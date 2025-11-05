import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import heroImage from "@/assets/salon-hero.jpg";
interface HeroSectionProps {
  onBookNow: () => void;
  onViewServices: () => void;
}
export const HeroSection = ({
  onBookNow,
  onViewServices
}: HeroSectionProps) => {
  return <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0" style={{
      backgroundImage: `url(${heroImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center"
    }}>
        <div className="absolute inset-0 bg-gradient-to-r from-background/98 via-background/85 to-background/40" />
      </div>

      <div className="container relative z-10 px-4 py-32">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-6 animate-fade-in">
            <div className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Profesionales del Cabello
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-foreground md:text-7xl leading-tight">
              Cristina Muñoz
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Experimenta el arte del cuidado capilar en un espacio de elegancia y sofisticación. 
              Cada servicio es una transformación única.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row animate-fade-in stagger-1 pt-4">
            <Button 
              size="lg" 
              onClick={onBookNow} 
              className="text-base px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Reservar Cita
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={onViewServices} 
              className="text-base px-8 py-6 bg-background/50 backdrop-blur-sm hover:bg-background transition-all duration-300"
            >
              Ver Servicios
            </Button>
          </div>
        </div>
      </div>
    </section>;
};