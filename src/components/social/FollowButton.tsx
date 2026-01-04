import { motion } from "framer-motion";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFollows } from "@/hooks/useFollows";
import { useHaptic } from "@/hooks/useHaptic";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  tenantId: string;
  variant?: "default" | "compact" | "icon";
  className?: string;
}

export function FollowButton({ tenantId, variant = "default", className }: FollowButtonProps) {
  const { isFollowing, toggleFollow, isLoading } = useFollows();
  const haptic = useHaptic();
  
  const following = isFollowing(tenantId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    haptic.medium();
    toggleFollow(tenantId);
  };

  if (variant === "icon") {
    return (
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          "p-2 rounded-full transition-colors",
          following 
            ? "bg-primary/10 text-primary" 
            : "bg-muted text-muted-foreground hover:bg-muted/80",
          className
        )}
      >
        {following ? (
          <UserCheck className="w-5 h-5" />
        ) : (
          <UserPlus className="w-5 h-5" />
        )}
      </motion.button>
    );
  }

  if (variant === "compact") {
    return (
      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          size="sm"
          variant={following ? "outline" : "default"}
          onClick={handleClick}
          disabled={isLoading}
          className={cn(
            "h-8 px-4 text-xs font-semibold rounded-full",
            following && "border-primary/30",
            className
          )}
        >
          {following ? "Siguiendo" : "Seguir"}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div whileTap={{ scale: 0.95 }}>
      <Button
        variant={following ? "outline" : "default"}
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          "gap-2 font-semibold rounded-xl",
          following && "border-primary/30",
          className
        )}
      >
        {following ? (
          <>
            <UserCheck className="w-4 h-4" />
            Siguiendo
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            Seguir
          </>
        )}
      </Button>
    </motion.div>
  );
}
