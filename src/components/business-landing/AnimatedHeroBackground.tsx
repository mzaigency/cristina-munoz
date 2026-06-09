import { motion } from "framer-motion";

/**
 * Vivid animated brand blobs for hero background.
 * Blobs are large, high-opacity, and layered for visual depth.
 */
export const AnimatedHeroBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient base tint */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% -10%, hsl(var(--primary) / 0.12) 0%, transparent 65%), radial-gradient(ellipse 60% 50% at 90% 10%, hsl(var(--accent) / 0.10) 0%, transparent 60%)",
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Blob 1 — primary, top-left, large */}
      <motion.div
        aria-hidden
        className="absolute -top-40 -left-32 w-[680px] h-[680px] rounded-full blur-[80px]"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.58), transparent 68%)",
        }}
        animate={{
          x: [0, 55, -28, 0],
          y: [0, 38, -18, 0],
          scale: [1, 1.13, 0.93, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Blob 2 — accent, top-right */}
      <motion.div
        aria-hidden
        className="absolute -top-20 -right-28 w-[600px] h-[600px] rounded-full blur-[80px]"
        style={{
          background: "radial-gradient(circle, hsl(var(--accent) / 0.52), transparent 68%)",
        }}
        animate={{
          x: [0, -48, 26, 0],
          y: [0, 48, -24, 0],
          scale: [1, 0.88, 1.12, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Blob 3 — primary mix, bottom-center */}
      <motion.div
        aria-hidden
        className="absolute bottom-0 left-1/3 w-[520px] h-[520px] rounded-full blur-[80px]"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.40), hsl(var(--accent) / 0.24), transparent 68%)",
        }}
        animate={{
          x: [0, 35, -45, 0],
          y: [0, -28, 18, 0],
          scale: [1, 1.07, 0.94, 1],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Blob 4 — white refraction highlight, center */}
      <motion.div
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[240px] rounded-full blur-[60px]"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)",
        }}
        animate={{
          scaleX: [1, 1.2, 0.9, 1],
          opacity: [0.7, 1, 0.55, 0.7],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Blob 5 — accent accent bottom-right corner */}
      <motion.div
        aria-hidden
        className="absolute -bottom-32 -right-20 w-[440px] h-[440px] rounded-full blur-[80px]"
        style={{
          background: "radial-gradient(circle, hsl(var(--accent) / 0.35), transparent 68%)",
        }}
        animate={{
          x: [0, -30, 18, 0],
          y: [0, -20, 12, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
    </div>
  );
};
