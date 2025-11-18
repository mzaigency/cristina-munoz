import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import logoImage from "@/assets/logo.png";

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

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

    // Hide after animation completes
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onLoadingComplete, 600);
    }, 1800);

    return () => {
      clearInterval(progressInterval);
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
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-background via-background to-background/95"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <img 
              src={logoImage} 
              alt="Cristina Muñoz" 
              className="w-32 h-32 object-contain mix-blend-normal"
              style={{ 
                filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))'
              }}
            />
          </motion.div>

          {/* Progress Bar Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="w-48 h-1 bg-muted rounded-full overflow-hidden"
          >
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full"
              style={{
                width: `${progress}%`,
              }}
              transition={{ duration: 0.1 }}
            />
          </motion.div>

          {/* Optional elegant text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-6 text-sm text-muted-foreground font-light tracking-wider"
          >
            Cargando...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
