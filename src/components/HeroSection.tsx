import { Button } from "@/components/ui/button";
import heroImage from "@/assets/foto-hero.jpg";
import GlareHover from "@/components/animations/GlareHover";
import AnimatedContent from "@/components/animations/AnimatedContent";
import { ChevronDown } from "lucide-react";

interface HeroSectionProps {
  onBookNow: () => void;
  onViewServices: () => void;
  isLoadingComplete?: boolean;
}

export const HeroSection = ({ onBookNow, onViewServices, isLoadingComplete = false }: HeroSectionProps) => {
  const scrollToServices = () => {
    const element = document.getElementById("servicios");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Animated background gradient overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
      
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Interior de Cristina Muñoz Peluquería en Santpedor - Salón profesional de peluquería con ambiente elegante y moderno" 
          className="w-full h-full object-cover animate-scale-in"
          loading="eager"
          fetchPriority="high"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-black/65" />
      </div>

      {/* Main content - truly centered */}
      <div className="container relative z-10 px-4 text-center flex-1 flex items-center justify-center">
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

      {/* Scroll indicator - positioned at bottom */}
      {isLoadingComplete && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <AnimatedContent
            distance={30}
            direction="vertical"
            duration={0.8}
            ease="power3.out"
            delay={1}
          >
            <button
              onClick={scrollToServices}
              className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer group"
              aria-label="Scroll hacia abajo"
            >
              <span className="text-sm font-light tracking-widest uppercase">Descubre más</span>
              <ChevronDown className="w-6 h-6 animate-bounce" />
            </button>
          </AnimatedContent>
        </div>
      )}
    </section>
  );
};
