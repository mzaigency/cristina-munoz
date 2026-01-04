import { motion, AnimatePresence } from "motion/react";

interface GuideLinesProps {
  showHorizontal: boolean;
  showVertical: boolean;
}

export function GuideLines({ showHorizontal, showVertical }: GuideLinesProps) {
  return (
    <>
      <AnimatePresence>
        {showHorizontal && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 pointer-events-none z-30"
            style={{
              background: "linear-gradient(to bottom, transparent, #3B82F6 20%, #3B82F6 80%, transparent)",
              boxShadow: "0 0 8px 2px rgba(59, 130, 246, 0.5)",
            }}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showVertical && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0 }}
            className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 pointer-events-none z-30"
            style={{
              background: "linear-gradient(to right, transparent, #3B82F6 20%, #3B82F6 80%, transparent)",
              boxShadow: "0 0 8px 2px rgba(59, 130, 246, 0.5)",
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
