import { motion, AnimatePresence } from "motion/react";
import { Trash2 } from "lucide-react";

interface TrashZoneProps {
  visible: boolean;
  intensity: number; // 0-1
}

export function TrashZone({ visible, intensity }: TrashZoneProps) {
  const scale = 1 + intensity * 0.4;
  const isActive = intensity > 0.6;
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 400,
            mass: 0.8
          }}
          className="absolute left-1/2 z-40 flex flex-col items-center pointer-events-none"
          style={{ 
            bottom: 'calc(max(env(safe-area-inset-bottom), 16px) + 24px)',
            transform: 'translateX(-50%)'
          }}
        >
          <motion.div
            animate={{ 
              scale: isActive ? [scale, scale * 1.08, scale] : scale,
            }}
            transition={{
              scale: { 
                duration: 0.4, 
                repeat: isActive ? Infinity : 0,
                ease: "easeInOut"
              }
            }}
            className="relative"
          >
            {/* Outer glow ring */}
            <motion.div
              animate={{
                opacity: intensity > 0.3 ? 0.6 + intensity * 0.4 : 0,
                scale: 1 + intensity * 0.3,
              }}
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, rgba(239, 68, 68, ${intensity * 0.5}) 0%, transparent 70%)`,
                filter: 'blur(8px)',
                transform: 'scale(1.5)',
              }}
            />
            
            {/* Main circle */}
            <motion.div
              animate={{ 
                scale,
                backgroundColor: isActive 
                  ? 'rgba(239, 68, 68, 0.9)' 
                  : `rgba(255, 255, 255, ${0.15 + intensity * 0.3})`,
                borderColor: isActive
                  ? 'rgba(255, 100, 100, 0.6)'
                  : 'rgba(255, 255, 255, 0.2)',
              }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 300,
              }}
              className="w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-xl border-2 relative"
              style={{
                boxShadow: isActive 
                  ? '0 0 40px rgba(239, 68, 68, 0.6), 0 8px 32px rgba(0,0,0,0.4)' 
                  : '0 4px 24px rgba(0,0,0,0.3)',
              }}
            >
              <motion.div 
                animate={{ 
                  scale: isActive ? [1, 1.15, 1] : 1,
                  rotate: isActive ? [0, -10, 10, 0] : 0,
                }}
                transition={{
                  duration: 0.4,
                  repeat: isActive ? Infinity : 0,
                  ease: "easeInOut"
                }}
              >
                <Trash2 
                  size={26} 
                  className={isActive ? "text-white" : "text-white/80"}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </motion.div>
            </motion.div>
          </motion.div>
          
          {/* Label */}
          <motion.span
            initial={{ opacity: 0, y: -5 }}
            animate={{ 
              opacity: intensity > 0.2 ? 1 : 0,
              y: intensity > 0.2 ? 0 : -5,
            }}
            transition={{ duration: 0.2 }}
            className={`mt-3 text-xs font-semibold tracking-wide ${
              isActive ? 'text-red-400' : 'text-white/70'
            }`}
          >
            {isActive ? 'Suelta para eliminar' : 'Arrastra aquí'}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
