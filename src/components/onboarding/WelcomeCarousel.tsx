import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Calendar, Heart, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHaptic } from "@/hooks/useHaptic";

const ONBOARDING_KEY = "glowapp_onboarding_completed";

interface WelcomeSlide {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const slides: WelcomeSlide[] = [
  {
    icon: <Sparkles className="h-16 w-16" />,
    title: "Descubre salones increíbles",
    description: "Explora los mejores salones de belleza cerca de ti con fotos, reseñas y servicios detallados.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: <Calendar className="h-16 w-16" />,
    title: "Reserva en segundos",
    description: "Elige tu servicio, profesional y horario favorito. Confirma tu cita con un solo toque.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: <Heart className="h-16 w-16" />,
    title: "Guarda tus favoritos",
    description: "Añade salones a tu lista de favoritos y recibe novedades de los lugares que más te gustan.",
    color: "from-amber-500 to-orange-500",
  },
];

interface WelcomeCarouselProps {
  onComplete: () => void;
}

export function WelcomeCarousel({ onComplete }: WelcomeCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const haptic = useHaptic();

  useEffect(() => {
    // Check if onboarding was already completed
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    haptic.selection();
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    haptic.selection();
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setIsVisible(false);
    haptic.success();
    onComplete();
  };

  const handleDotClick = (index: number) => {
    haptic.light();
    setCurrentSlide(index);
  };

  if (!isVisible) return null;

  const slide = slides[currentSlide];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background flex flex-col"
      >
        {/* Skip button */}
        <div className="absolute top-4 right-4 z-10 safe-area-top">
          <button
            onClick={handleSkip}
            className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Omitir
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col items-center text-center"
            >
              {/* Icon with gradient background */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className={`mb-8 p-6 rounded-full bg-gradient-to-br ${slide.color} text-white shadow-xl`}
              >
                {slide.icon}
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-foreground mb-4"
              >
                {slide.title}
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-muted-foreground max-w-xs"
              >
                {slide.description}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom section */}
        <div className="px-8 pb-12 space-y-6 safe-area-bottom">
          {/* Dots indicator */}
          <div className="flex justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          {/* Continue button */}
          <Button
            onClick={handleNext}
            size="lg"
            className="w-full h-14 text-lg font-semibold rounded-2xl gap-2"
          >
            {currentSlide === slides.length - 1 ? (
              "Empezar"
            ) : (
              <>
                Continuar
                <ChevronRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useWelcomeOnboarding() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setShowWelcome(true);
    }
  }, []);

  const handleComplete = () => {
    setShowWelcome(false);
  };

  return { showWelcome, handleComplete };
}
