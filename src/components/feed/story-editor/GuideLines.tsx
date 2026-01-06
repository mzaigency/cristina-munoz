import { motion, AnimatePresence } from "motion/react";

interface GuideLinesProps {
  showHorizontal: boolean;
  showVertical: boolean;
  showLeftGuide?: boolean;
  showRightGuide?: boolean;
  showTopGuide?: boolean;
  showBottomGuide?: boolean;
}

const EDGE_MARGIN = 8; // % from edge

export function GuideLines({ 
  showHorizontal, 
  showVertical,
  showLeftGuide = false,
  showRightGuide = false,
  showTopGuide = false,
  showBottomGuide = false,
}: GuideLinesProps) {
  return (
    <>
      {/* Center vertical guide */}
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
      
      {/* Center horizontal guide */}
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

      {/* Left edge guide */}
      <AnimatePresence>
        {showLeftGuide && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            className="absolute top-0 bottom-0 w-[2px] pointer-events-none z-30"
            style={{
              left: `${EDGE_MARGIN}%`,
              background: "linear-gradient(to bottom, transparent, #F97316 20%, #F97316 80%, transparent)",
              boxShadow: "0 0 6px 1px rgba(249, 115, 22, 0.4)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Right edge guide */}
      <AnimatePresence>
        {showRightGuide && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            className="absolute top-0 bottom-0 w-[2px] pointer-events-none z-30"
            style={{
              right: `${EDGE_MARGIN}%`,
              background: "linear-gradient(to bottom, transparent, #F97316 20%, #F97316 80%, transparent)",
              boxShadow: "0 0 6px 1px rgba(249, 115, 22, 0.4)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Top edge guide */}
      <AnimatePresence>
        {showTopGuide && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0 }}
            className="absolute left-0 right-0 h-[2px] pointer-events-none z-30"
            style={{
              top: `${EDGE_MARGIN}%`,
              background: "linear-gradient(to right, transparent, #F97316 20%, #F97316 80%, transparent)",
              boxShadow: "0 0 6px 1px rgba(249, 115, 22, 0.4)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Bottom edge guide */}
      <AnimatePresence>
        {showBottomGuide && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0 }}
            className="absolute left-0 right-0 h-[2px] pointer-events-none z-30"
            style={{
              bottom: `${20}%`, // Above trash zone
              background: "linear-gradient(to right, transparent, #F97316 20%, #F97316 80%, transparent)",
              boxShadow: "0 0 6px 1px rgba(249, 115, 22, 0.4)",
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
