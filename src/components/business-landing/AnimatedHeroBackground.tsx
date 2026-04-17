import { motion } from "framer-motion";

/**
 * Organic animated brand-colored blobs for hero backgrounds.
 * Mobile-first, respects safe areas, no horizontal overflow.
 */
export const AnimatedHeroBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Blob 1 — primary blue */}
      <motion.div
        aria-hidden
        className="absolute -top-24 -left-20 w-[420px] h-[420px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.35), transparent 70%)",
        }}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, 30, -10, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Blob 2 — accent purple */}
      <motion.div
        aria-hidden
        className="absolute top-20 -right-16 w-[380px] h-[380px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--accent) / 0.30), transparent 70%)",
        }}
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 40, -20, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Blob 3 — soft mid */}
      <motion.div
        aria-hidden
        className="absolute bottom-0 left-1/3 w-[320px] h-[320px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--accent) / 0.18), hsl(var(--primary) / 0.10), transparent 70%)",
        }}
        animate={{
          x: [0, 20, -30, 0],
          y: [0, -20, 10, 0],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};
