import { motion } from "motion/react";

export function PremiumSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[28px] bg-card border border-border/30"
        >
          {/* Image skeleton with elegant shimmer */}
          <div className="relative h-52 bg-secondary/60 overflow-hidden">
            <motion.div
              animate={{ x: ["-100%", "100%"] }}
              transition={{ 
                duration: 1.8, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.12
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.04] to-transparent"
              style={{ width: "200%" }}
            />
            
            {/* Badge skeleton */}
            <div className="absolute top-3.5 left-3.5 flex gap-2">
              <div className="h-6 w-20 rounded-full bg-secondary/80 overflow-hidden relative">
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.04] to-transparent"
                  style={{ width: "200%" }}
                />
              </div>
            </div>
            
            {/* Favorite button skeleton */}
            <div className="absolute top-3.5 right-3.5 h-11 w-11 rounded-full bg-secondary/80 overflow-hidden relative">
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.04] to-transparent"
                style={{ width: "200%" }}
              />
            </div>
            
            {/* Rating skeleton */}
            <div className="absolute bottom-3.5 right-3.5 h-9 w-20 rounded-2xl bg-secondary/80 overflow-hidden relative">
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.04] to-transparent"
                style={{ width: "200%" }}
              />
            </div>
          </div>

          {/* Content skeleton */}
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="h-6 w-2/3 bg-secondary/60 rounded-lg overflow-hidden relative">
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.04] to-transparent"
                  style={{ width: "200%" }}
                />
              </div>
              <div className="h-6 w-16 bg-secondary/60 rounded-lg overflow-hidden relative">
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.04] to-transparent"
                  style={{ width: "200%" }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="h-4 w-full bg-secondary/60 rounded-lg overflow-hidden relative">
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.04] to-transparent"
                  style={{ width: "200%" }}
                />
              </div>
              <div className="h-4 w-3/4 bg-secondary/60 rounded-lg overflow-hidden relative">
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.04] to-transparent"
                  style={{ width: "200%" }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/40">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-secondary/60 rounded-full overflow-hidden relative">
                  <motion.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.04] to-transparent"
                    style={{ width: "200%" }}
                  />
                </div>
                <div className="h-4 w-20 bg-secondary/60 rounded-lg overflow-hidden relative">
                  <motion.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.04] to-transparent"
                    style={{ width: "200%" }}
                  />
                </div>
              </div>
              <div className="h-9 w-24 bg-secondary/60 rounded-full overflow-hidden relative">
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.04] to-transparent"
                  style={{ width: "200%" }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
