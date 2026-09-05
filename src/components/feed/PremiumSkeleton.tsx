import { motion } from "motion/react";

export function PremiumSkeleton() {
  return (
    <div className="space-y-5">
      {/* Minimal loading indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-center gap-2 py-2"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/60" />
        </span>
        <span className="text-xs text-muted-foreground tracking-wide">
          Cargando salones…
        </span>
      </motion.div>

      {/* Skeleton cards matching PremiumSalonCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: i * 0.05,
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative overflow-hidden rounded-[20px] bg-surface border border-line/80 shadow-sm flex flex-col justify-between"
          >
            {/* Image placeholder */}
            <div className="relative h-44 bg-muted/30 overflow-hidden">
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1,
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                style={{ width: "200%" }}
              />
              {/* Top-left badge placeholder */}
              <div className="absolute top-2.5 left-2.5 h-5.5 w-18 rounded-full bg-muted/60" />
              {/* Top-right heart placeholder */}
              <div className="absolute top-2.5 right-2.5 h-8.5 w-8.5 rounded-full bg-muted/60" />
              {/* Bottom-right rating placeholder */}
              <div className="absolute bottom-2.5 right-2.5 h-6 w-16 rounded-xl bg-white/80 backdrop-blur-xs" />
            </div>

            {/* Content placeholder */}
            <div className="p-3.5 flex flex-col justify-between flex-1">
              <div>
                {/* Title & Price row */}
                <div className="flex items-center justify-between gap-2 h-6">
                  <div className="h-4.5 w-3/5 bg-muted/50 rounded-md" />
                  <div className="h-4 w-16 bg-muted/30 rounded-md" />
                </div>

                {/* Tagline */}
                <div className="h-8 mt-1.5 space-y-1.5">
                  <div className="h-3 w-full bg-muted/40 rounded" />
                  <div className="h-3 w-4/5 bg-muted/30 rounded" />
                </div>

                {/* Tags */}
                <div className="h-5.5 mt-2 flex items-center gap-1.5">
                  <div className="h-4.5 w-16 bg-muted/30 rounded-full" />
                  <div className="h-4.5 w-20 bg-muted/20 rounded-full" />
                </div>
              </div>

              {/* Bottom divider & location row */}
              <div className="pt-2.5 mt-2.5 border-t border-line/60 flex items-center gap-3">
                <div className="h-3.5 w-14 bg-muted/40 rounded" />
                <div className="h-3.5 w-20 bg-muted/30 rounded" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
