import { motion } from "motion/react";
import glowappLogo from "@/assets/glowapp-logo.png";

export function PremiumSkeleton() {
  return (
    <div className="space-y-6">
      {/* Branded Loading Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center py-4 mb-2"
      >
        <div className="relative flex items-center justify-center">
          {/* Ambient plum glow */}
          <motion.div
            animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.25, 0.55, 0.25] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-3 rounded-full bg-[var(--glow-brand)]/20 blur-xl pointer-events-none"
          />

          {/* Breathing Logo Card */}
          <motion.div
            animate={{ scale: [0.97, 1.03, 0.97] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="relative h-13 w-13 rounded-2xl bg-white dark:bg-[#1A1A24] shadow-md shadow-[var(--glow-brand)]/15 border border-line/70 dark:border-white/10 flex items-center justify-center p-2.5"
          >
            <img
              src={glowappLogo}
              alt="GlowApp"
              className="h-full w-full object-contain"
            />
          </motion.div>
        </div>
        <motion.p
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-xs font-semibold text-muted-foreground mt-2.5 tracking-wide"
        >
          Cargando salones...
        </motion.p>
      </motion.div>

      {/* Grid of Skeleton Cards matching PremiumSalonCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[20px] bg-white dark:bg-[#1A1A24] border border-line/80 dark:border-white/10 shadow-[0_2px_10px_-2px_rgba(19,21,32,0.06),0_12px_24px_-10px_rgba(19,21,32,0.08)] flex flex-col justify-between"
          >
            {/* Image placeholder with logo watermark and shimmer */}
            <div className="relative h-44 bg-muted/40 dark:bg-muted/20 overflow-hidden flex items-center justify-center">
              {/* Centered subtle logo watermark */}
              <img
                src={glowappLogo}
                alt=""
                className="h-10 w-10 object-contain opacity-20 filter grayscale"
              />

              {/* Shimmer overlay */}
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1,
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent"
                style={{ width: "200%" }}
              />

              {/* Top-left badge placeholder */}
              <div className="absolute top-2.5 left-2.5 h-5.5 w-18 rounded-full bg-muted/70 dark:bg-muted/40" />

              {/* Top-right heart placeholder */}
              <div className="absolute top-2.5 right-2.5 h-8.5 w-8.5 rounded-full bg-muted/70 dark:bg-muted/40" />

              {/* Bottom-right rating placeholder */}
              <div className="absolute bottom-2.5 right-2.5 h-6 w-16 rounded-xl bg-white/80 dark:bg-black/60 backdrop-blur-xs" />
            </div>

            {/* Content matching PremiumSalonCard slots */}
            <div className="p-3.5 flex flex-col justify-between flex-1">
              <div>
                {/* 1. Title & Price row */}
                <div className="flex items-center justify-between gap-2 h-6">
                  <div className="h-4.5 w-3/5 bg-muted/60 dark:bg-muted/30 rounded-md" />
                  <div className="h-4 w-16 bg-muted/40 dark:bg-muted/20 rounded-md" />
                </div>

                {/* 2. Tagline (32px slot) */}
                <div className="h-8 mt-1.5 space-y-1.5">
                  <div className="h-3 w-full bg-muted/50 dark:bg-muted/20 rounded" />
                  <div className="h-3 w-4/5 bg-muted/40 dark:bg-muted/15 rounded" />
                </div>

                {/* 3. Tags slot (22px slot) */}
                <div className="h-5.5 mt-2 flex items-center gap-1.5">
                  <div className="h-4.5 w-16 bg-[var(--glow-brand-soft)]/50 rounded-full" />
                  <div className="h-4.5 w-20 bg-[var(--glow-brand-soft)]/30 rounded-full" />
                </div>
              </div>

              {/* 4. Bottom divider & location row */}
              <div className="pt-2.5 mt-2.5 border-t border-line/60 flex items-center gap-3">
                <div className="h-3.5 w-14 bg-muted/50 dark:bg-muted/20 rounded" />
                <div className="h-3.5 w-20 bg-muted/40 dark:bg-muted/15 rounded" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
