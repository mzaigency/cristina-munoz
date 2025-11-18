import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Scissors } from "lucide-react";
import logoImage from "@/assets/logo.png";

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onLoadingComplete, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-primary/5"
        >
          {/* Particles Background */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-primary/30 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  scale: 0,
                }}
                animate={{
                  y: [null, Math.random() * window.innerHeight],
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Animated Scissors */}
          <motion.div
            className="absolute"
            initial={{ rotate: -45, x: -100, y: 100, opacity: 0 }}
            animate={{ rotate: 0, x: -80, y: -80, opacity: 0.15 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <Scissors className="w-32 h-32 text-primary" />
          </motion.div>

          <motion.div
            className="absolute"
            initial={{ rotate: 45, x: 100, y: -100, opacity: 0 }}
            animate={{ rotate: 0, x: 80, y: 80, opacity: 0.15 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <Scissors className="w-32 h-32 text-primary" />
          </motion.div>

          {/* Logo with Shimmer Effect */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                duration: 1.2, 
                ease: [0.34, 1.56, 0.64, 1],
                delay: 0.2 
              }}
              className="relative"
            >
              <img 
                src={logoImage} 
                alt="Cristina Muñoz" 
                className="w-40 h-40 object-contain"
              />
              
              {/* Shimmer Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{ 
                  clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                }}
              />

              {/* Glow Effect */}
              <motion.div
                className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>

            {/* Loading Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-col items-center gap-2"
            >
              <h2 className="text-2xl font-playfair font-bold text-foreground">
                Cristina Muñoz
              </h2>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-primary rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
