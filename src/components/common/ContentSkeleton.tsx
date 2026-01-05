import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ContentSkeletonProps {
  variant?: "profile" | "detail" | "form" | "stats";
  className?: string;
}

const ContentSkeleton = ({ variant = "detail", className }: ContentSkeletonProps) => {
  if (variant === "profile") {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Avatar y nombre */}
        <div className="flex flex-col items-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-24 h-24 rounded-full bg-muted animate-pulse"
          />
          <div className="space-y-2 text-center">
            <div className="h-6 bg-muted rounded-md w-32 mx-auto animate-pulse" />
            <div className="h-4 bg-muted rounded-md w-24 mx-auto animate-pulse" />
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex justify-center gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-1">
              <div className="h-6 bg-muted rounded-md w-12 mx-auto animate-pulse" />
              <div className="h-4 bg-muted rounded-md w-16 mx-auto animate-pulse" />
            </div>
          ))}
        </div>

        {/* Botones */}
        <div className="flex gap-3 justify-center">
          <div className="h-10 bg-muted rounded-xl w-28 animate-pulse" />
          <div className="h-10 bg-muted rounded-xl w-28 animate-pulse" />
        </div>
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className={cn("space-y-4", className)}>
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="space-y-2"
          >
            <div className="h-4 bg-muted rounded-md w-24 animate-pulse" />
            <div className="h-12 bg-muted rounded-xl animate-pulse" />
          </motion.div>
        ))}
        <div className="h-12 bg-muted rounded-xl animate-pulse mt-6" />
      </div>
    );
  }

  if (variant === "stats") {
    return (
      <div className={cn("grid grid-cols-2 gap-4", className)}>
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-xl bg-card border border-border/50 space-y-2"
          >
            <div className="h-4 bg-muted rounded-md w-16 animate-pulse" />
            <div className="h-8 bg-muted rounded-md w-20 animate-pulse" />
            <div className="h-3 bg-muted rounded-md w-12 animate-pulse" />
          </motion.div>
        ))}
      </div>
    );
  }

  // Detail variant (default)
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="aspect-video rounded-2xl bg-muted animate-pulse"
      />
      
      {/* Title section */}
      <div className="space-y-3">
        <div className="h-8 bg-muted rounded-md w-3/4 animate-pulse" />
        <div className="h-4 bg-muted rounded-md w-1/2 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-6 bg-muted rounded-full w-20 animate-pulse" />
          <div className="h-6 bg-muted rounded-full w-16 animate-pulse" />
        </div>
      </div>

      {/* Content blocks */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="space-y-2"
          >
            <div className="h-4 bg-muted rounded-md w-full animate-pulse" />
            <div className="h-4 bg-muted rounded-md w-5/6 animate-pulse" />
            <div className="h-4 bg-muted rounded-md w-4/6 animate-pulse" />
          </motion.div>
        ))}
      </div>

      {/* Action button */}
      <div className="h-14 bg-muted rounded-2xl animate-pulse" />
    </div>
  );
};

export default ContentSkeleton;
