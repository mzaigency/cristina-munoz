import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import heroImage from "@/assets/foto-hero.jpg";
import BlurText from "@/components/animations/BlurText";
import AnimatedContent from "@/components/animations/AnimatedContent";
import GlareHover from "@/components/animations/GlareHover";
interface HeroSectionProps {
  onBookNow: () => void;
  onViewServices: () => void;
}
export const HeroSection = ({ onBookNow, onViewServices }: HeroSectionProps) => {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={heroImage} alt="Salón de belleza elegante" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/65" />
      </div>

      <div className="container relative z-10 px-4 py-20 pt-[calc(5rem+env(safe-area-inset-top))] text-center">
        <div className="mx-auto max-w-3xl space-y-8">
          <BlurText
            text={import.meta.env.VITE_BUSINESS_NAME}
            className="font-bold tracking-tight font-playfair text-white text-5xl md:text-7xl"
            delay={150}
            animateBy="words"
            direction="top"
          />

          <p className="text-base text-white md:text-lg font-normal">
            Donde la belleza y el estilo se encuentran. Tu momento de brillar empieza aquí.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center pt-4">
            <AnimatedContent delay={0.3} distance={50} duration={0.6}>
              <GlareHover
                width="auto"
                height="auto"
                background="transparent"
                borderRadius="9999px"
                borderColor="transparent"
                glareColor="#ffffff"
                glareOpacity={0.5}
                glareSize={200}
                transitionDuration={500}
                className="inline-block transition-all duration-500 ease-out hover:scale-105"
              >
                <Button
                  size="lg"
                  onClick={onBookNow}
                  className="bg-primary text-primary-foreground font-semibold rounded-full"
                >
                  Reservar Cita
                </Button>
              </GlareHover>
            </AnimatedContent>
            <AnimatedContent delay={0.5} distance={50} duration={0.6}>
              <GlareHover
                width="auto"
                height="auto"
                background="transparent"
                borderRadius="9999px"
                borderColor="transparent"
                glareColor="#815331"
                glareOpacity={0.3}
                glareSize={150}
                transitionDuration={500}
                className="inline-block transition-all duration-500 ease-out hover:scale-105"
              >
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onViewServices}
                  className="hover:bg-transparent hover:text-white border-2 border-primary rounded-full bg-transparent text-white font-bold"
                >
                  Ver Servicios
                </Button>
              </GlareHover>
            </AnimatedContent>
          </div>
        </div>
      </div>
    </section>
  );
};
