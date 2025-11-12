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
  return <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 transition-transform duration-700 hover:scale-105" style={{
      backgroundImage: `url(${heroImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center"
    }}>
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
      </div>

      <div className="container relative z-10 px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-8">
          <h1 className="text-5xl font-bold tracking-tight animate-fade-in font-playfair text-[#3b2b30] md:text-7xl">Cristina Muñoz</h1>

          <p className="text-xl animate-fade-in stagger-1 font-light text-[#3b2b30] md:text-2xl">
            Donde la belleza y el estilo se encuentran. Tu momento de brillar empieza aquí.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center animate-fade-in stagger-2 pt-4">
            <Button size="lg" onClick={onBookNow} className="transition-all duration-300 hover:scale-105 hover:shadow-lg bg-[#b8860b] hover:bg-[#9a7209] text-white font-semibold">
              Reservar Cita
            </Button>
            <Button size="lg" variant="outline" onClick={onViewServices} className="transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 border-white/80 text-white hover:bg-white/10">
              Ver Servicios
            </Button>
          </div>
        </div>
      </div>
    </section>;
};