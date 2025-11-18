import { Button } from "@/components/ui/button";
import heroImage from "@/assets/foto-hero.jpg";
import GlareHover from "@/components/animations/GlareHover";
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

      <div className="container relative z-10 px-4 py-24 pt-[calc(6rem+env(safe-area-inset-top))] pb-32 text-center">
        <div className="mx-auto max-w-3xl space-y-8">
          {isLoadingComplete && (
            <>
              {/* Título con animación Mask */}
              <div className="relative overflow-hidden py-4">
                <h1 
                  data-content={import.meta.env.VITE_BUSINESS_NAME}
                  className="font-bold tracking-tight font-playfair text-transparent text-5xl md:text-7xl relative after:content-[attr(data-content)] after:absolute after:top-0 after:left-0 after:w-full after:text-white after:[animation:cd-reveal-up_0.4s_0.7s_backwards]"
                >
                  {import.meta.env.VITE_BUSINESS_NAME}
                </h1>
                <div className="h-0.5 bg-white mx-auto mt-4 w-32 origin-center [animation:cd-loading-mask_1s_0.3s_both]" />
              </div>

              <p className="text-base text-white md:text-lg font-normal">
                Donde la belleza y el estilo se encuentran. Tu momento de brillar empieza aquí.
              </p>

              {/* Botones con animación Mask */}
              <div className="overflow-hidden pt-8 pb-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center [animation:cd-reveal-down_0.4s_0.7s_backwards]">
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
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
