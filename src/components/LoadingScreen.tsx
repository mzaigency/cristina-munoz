import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import logoImage from "@/assets/logo.png";

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [fadeOutElements, setFadeOutElements] = useState(false);

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    // Fade out elements before curtain
    const fadeTimer = setTimeout(() => {
      setFadeOutElements(true);
    }, 1600);

    // Hide after animation completes
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onLoadingComplete, 800);
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(fadeTimer);
      clearTimeout(timer);
    };
  }, [onLoadingComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          exit={{ 
            y: "100%",
            transition: { 
              duration: 0.8, 
              ease: [0.6, 0.01, 0.05, 0.95]
            }
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-background via-background to-background/95 backdrop-blur-sm"
          style={{
            boxShadow: isVisible && fadeOutElements ? '0 -10px 50px rgba(0, 0, 0, 0.3)' : 'none'
          }}
        >
          {/* Vignette overlay */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/30 pointer-events-none" />
          
          {/* Logo with premium effects */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -5 }}
            animate={{ 
              opacity: fadeOutElements ? 0 : 1, 
              scale: fadeOutElements ? 0.9 : 1, 
              rotate: 0 
            }}
            transition={{ 
              duration: 0.8, 
              ease: [0.34, 1.56, 0.64, 1],
              opacity: { duration: fadeOutElements ? 0.4 : 0.8 }
            }}
            className="mb-8 relative"
          >
            {/* Shimmer effect overlay */}
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 1
                }}
              />
            </div>
            
            {/* Logo with animated glow */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 20px hsla(var(--salon-gold) / 0.3)",
                  "0 0 40px hsla(var(--salon-gold) / 0.5)",
                  "0 0 20px hsla(var(--salon-gold) / 0.3)",
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="rounded-full"
            >
              <img 
                src={logoImage} 
                alt="Cristina Muñoz" 
                className="w-32 h-32 object-contain mix-blend-normal rounded-2xl"
                style={{ 
                  filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))'
                }}
              />
            </motion.div>
          </motion.div>

          {/* Sophisticated Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: fadeOutElements ? 0 : 1, 
              y: fadeOutElements ? 10 : 0 
            }}
            transition={{ 
              delay: 0.3, 
              duration: 0.6,
              opacity: { duration: fadeOutElements ? 0.4 : 0.6 }
            }}
            className="w-64 h-0.5 bg-muted/50 rounded-full overflow-hidden relative"
          >
            <motion.div
              className="h-full rounded-full relative"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, hsl(var(--salon-gold)), hsl(var(--salon-pink)), hsl(var(--salon-gold)))",
                backgroundSize: "200% 100%",
                boxShadow: "0 0 15px hsla(var(--salon-gold) / 0.6)"
              }}
              animate={{
                backgroundPosition: ["0% 0%", "100% 0%"]
              }}
              transition={{
                backgroundPosition: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                },
                width: { duration: 0.1 }
              }}
            />
          </motion.div>

          {/* Elegant text with Playfair */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: fadeOutElements ? 0 : [0, 0.6, 0.6],
            }}
            transition={{ 
              delay: 0.5, 
              duration: 0.8,
              opacity: { duration: fadeOutElements ? 0.4 : 0.8 }
            }}
            className="mt-8 text-xs text-muted-foreground font-playfair font-light tracking-[0.3em] uppercase"
          >
            CARGANDO
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
