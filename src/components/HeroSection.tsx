import { Button } from "@/components/ui/button";
import heroImage from "@/assets/foto-hero.webp";
import GlareHover from "@/components/animations/GlareHover";
import AnimatedContent from "@/components/animations/AnimatedContent";
interface HeroSectionProps {
  onBookNow: () => void;
  onViewServices: () => void;
  isLoadingComplete?: boolean;
}
export const HeroSection = ({ onBookNow, onViewServices, isLoadingComplete = false }: HeroSectionProps) => {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Interior de Cristina Muñoz Peluquería en Santpedor - Salón profesional de peluquería con ambiente elegante y moderno" 
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-black/65" />
      </div>

      <div className="container relative z-10 px-4 py-20 pt-[calc(5rem+env(safe-area-inset-top))] text-center perspective-3d">
        <div className="mx-auto max-w-3xl space-y-8">
          {isLoadingComplete && (
            <>
              <AnimatedContent
                distance={60}
                direction="vertical"
                duration={1}
                ease="power3.out"
                scale={0.95}
                delay={0.2}
              >
                <h1 className="font-bold tracking-tight font-playfair text-white text-5xl md:text-7xl">
                  {import.meta.env.VITE_BUSINESS_NAME}
                </h1>
              </AnimatedContent>

              <AnimatedContent
                distance={40}
                direction="vertical"
                duration={0.9}
                ease="power3.out"
                scale={0.97}
                delay={0.4}
              >
                <p className="text-base text-white md:text-lg font-normal">
                  Tu peluquería de confianza en Santpedor. Donde la belleza y el estilo se encuentran.
                </p>
              </AnimatedContent>

              <AnimatedContent
                distance={50}
                direction="vertical"
                duration={1}
                ease="power3.out"
                scale={0.96}
                delay={0.6}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
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
                </div>
              </AnimatedContent>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
