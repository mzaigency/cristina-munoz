import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import heroImage from "@/assets/salon-hero.jpg";
import BlurText from "@/components/animations/BlurText";
import AnimatedContent from "@/components/animations/AnimatedContent";
import GlareHover from "@/components/animations/GlareHover";
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
          <BlurText 
            text="Cristina Muñoz" 
            className="font-bold tracking-tight font-playfair text-[#3b2b30] text-5xl md:text-7xl"
            delay={150}
            animateBy="words"
            direction="top"
          />

          <p className="text-base animate-fade-in stagger-1 font-light text-[#737d8c] md:text-xl">
            Donde la belleza y el estilo se encuentran. Tu momento de brillar empieza aquí.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center animate-fade-in stagger-2 pt-4">
            <AnimatedContent delay={0.3} distance={50} duration={0.6}>
              <GlareHover 
                width="auto" 
                height="auto" 
                background="transparent" 
                borderRadius="9999px"
                borderColor="transparent"
                glareColor="#ffffff"
                glareOpacity={0.3}
                glareSize={150}
                transitionDuration={500}
                className="inline-block"
              >
                <Button size="lg" onClick={onBookNow} className="transition-all duration-500 ease-out hover:scale-110 hover:shadow-2xl hover:shadow-[#815331]/50 hover:-translate-y-1 border-1 border-stone-950 text-white font-semibold rounded-full bg-[#815331]">
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
                className="inline-block"
              >
                <Button size="lg" variant="outline" onClick={onViewServices} className="transition-all duration-500 ease-out hover:scale-110 hover:shadow-2xl hover:shadow-[#815331]/30 hover:-translate-y-1 hover:bg-[#815331] hover:text-white border-2 border-[#815331] rounded-full bg-[#000a0e]/0 text-[#815331] font-bold">
                  Ver Servicios
                </Button>
              </GlareHover>
            </AnimatedContent>
          </div>
        </div>
      </div>
    </section>;
};