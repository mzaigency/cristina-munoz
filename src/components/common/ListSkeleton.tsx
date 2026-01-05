import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ListSkeletonProps {
  count?: number;
  variant?: "card" | "list" | "compact";
  className?: string;
}

const ListSkeleton = ({ count = 3, variant = "card", className }: ListSkeletonProps) => {
  const skeletonItems = Array.from({ length: count }, (_, i) => i);

  if (variant === "compact") {
    return (
      <div className={cn("space-y-2", className)}>
        {skeletonItems.map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-card"
          >
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded-md w-3/4 animate-pulse" />
              <div className="h-3 bg-muted rounded-md w-1/2 animate-pulse" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={cn("space-y-3", className)}>
        {skeletonItems.map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50"
          >
            <div className="w-14 h-14 rounded-xl bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded-md w-2/3 animate-pulse" />
              <div className="h-3 bg-muted rounded-md w-1/2 animate-pulse" />
              <div className="h-3 bg-muted rounded-md w-1/3 animate-pulse" />
            </div>
            <div className="w-20 h-8 bg-muted rounded-lg animate-pulse" />
          </motion.div>
        ))}
      </div>
    );
  }

  // Card variant (default)
  return (
    <div className={cn("grid gap-4", className)}>
      {skeletonItems.map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="rounded-2xl bg-card border border-border/50 overflow-hidden"
        >
          {/* Imagen skeleton */}
          <div className="aspect-[4/3] bg-muted animate-pulse relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
          </div>
          
          {/* Contenido skeleton */}
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-muted rounded-md w-3/4 animate-pulse" />
                <div className="h-4 bg-muted rounded-md w-1/2 animate-pulse" />
              </div>
              <div className="w-12 h-6 bg-muted rounded-full animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 bg-muted rounded-full w-16 animate-pulse" />
              <div className="h-6 bg-muted rounded-full w-20 animate-pulse" />
              <div className="h-6 bg-muted rounded-full w-14 animate-pulse" />
            </div>
            <div className="h-10 bg-muted rounded-xl animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ListSkeleton;
