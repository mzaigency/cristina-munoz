import { motion, AnimatePresence } from "motion/react";
import { Trash2 } from "lucide-react";

interface TrashZoneProps {
  visible: boolean;
  intensity: number; // 0-1
}

export function TrashZone({ visible, intensity }: TrashZoneProps) {
  const scale = 1 + intensity * 0.3;
  const bgOpacity = 0.3 + intensity * 0.5;
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center"
        >
          <motion.div
            animate={{ 
              scale, 
              backgroundColor: intensity > 0.7 
                ? `rgba(239, 68, 68, ${bgOpacity})` 
                : `rgba(255, 255, 255, ${bgOpacity * 0.5})` 
            }}
            className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20"
          >
            <motion.div animate={{ scale: intensity > 0.7 ? 1.1 : 1 }}>
              <Trash2 
                size={24} 
                className={intensity > 0.7 ? "text-white" : "text-white/70"}
              />
            </motion.div>
          </motion.div>
          
          {intensity > 0.3 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-xs text-white/70 font-medium"
            >
              Suelta para eliminar
            </motion.span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
