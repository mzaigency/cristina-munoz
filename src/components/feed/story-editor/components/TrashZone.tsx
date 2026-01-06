import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { useHaptic } from '@/hooks/useHaptic';

interface TrashZoneProps {
  isVisible: boolean;
  isHovering: boolean;
  onDrop: () => void;
}

export function TrashZone({ isVisible, isHovering, onDrop }: TrashZoneProps) {
  const haptic = useHaptic();

  useEffect(() => {
    if (isHovering) {
      haptic.light();
    }
  }, [isHovering, haptic]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: isHovering ? 1.2 : 1,
          }}
          exit={{ opacity: 0, y: 50, scale: 0.8 }}
          transition={{ 
            type: 'spring', 
            stiffness: 400, 
            damping: 25 
          }}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[100]"
          style={{
            marginBottom: 'max(env(safe-area-inset-bottom), 16px)',
          }}
        >
          <motion.div
            animate={{
              scale: isHovering ? [1, 1.1, 1] : 1,
              backgroundColor: isHovering 
                ? 'rgba(239, 68, 68, 0.9)' 
                : 'rgba(0, 0, 0, 0.6)',
            }}
            transition={{ 
              scale: { repeat: isHovering ? Infinity : 0, duration: 0.5 },
              backgroundColor: { duration: 0.2 }
            }}
            className={`
              w-16 h-16 rounded-full backdrop-blur-xl
              flex items-center justify-center
              border-2 transition-colors duration-200
              ${isHovering 
                ? 'border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.5)]' 
                : 'border-white/20 shadow-lg'
              }
            `}
          >
            <motion.div
              animate={{ 
                rotate: isHovering ? [0, -15, 15, -15, 0] : 0 
              }}
              transition={{ 
                repeat: isHovering ? Infinity : 0, 
                duration: 0.4 
              }}
            >
              <Trash2 
                size={28} 
                className={`transition-colors duration-200 ${
                  isHovering ? 'text-white' : 'text-white/80'
                }`} 
              />
            </motion.div>
          </motion.div>
          
          {/* Glow effect when hovering */}
          {isHovering && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 -z-10 rounded-full bg-red-500/30 blur-xl"
              style={{ transform: 'scale(2)' }}
            />
          )}
          
          {/* Label */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white/70 text-xs font-medium text-center mt-2"
          >
            {isHovering ? 'Suelta para eliminar' : 'Arrastra aquí'}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
