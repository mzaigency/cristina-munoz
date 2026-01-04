import { motion, AnimatePresence } from "framer-motion";
import { usePosts } from "@/hooks/usePosts";
import { PostCard } from "@/components/social/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function FollowingFeed() {
  const { followingPosts, isLoadingFollowingPosts, isAuthenticated, refetchFollowingPosts } = usePosts();
  const navigate = useNavigate();

  // Loading skeleton
  if (isLoadingFollowingPosts) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card border-b border-border">
            <div className="flex items-center gap-3 p-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-16 h-3" />
              </div>
            </div>
            <Skeleton className="aspect-square w-full" />
            <div className="p-3 space-y-2">
              <Skeleton className="w-32 h-4" />
              <Skeleton className="w-full h-4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-6 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <Users className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          Inicia sesión para ver tu feed
        </h3>
        <p className="text-muted-foreground mb-6 max-w-xs">
          Sigue a tus salones favoritos y verás sus publicaciones aquí
        </p>
        <Button onClick={() => navigate("/auth")} className="rounded-full">
          Iniciar sesión
        </Button>
      </motion.div>
    );
  }

  // No posts from followed salons
  if (followingPosts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-6 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <UserPlus className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          Tu feed está vacío
        </h3>
        <p className="text-muted-foreground mb-6 max-w-xs">
          Sigue a salones para ver sus publicaciones y trabajos aquí
        </p>
        <Button 
          variant="outline" 
          onClick={() => {
            const feedToggle = document.querySelector('[data-feed-discover]');
            if (feedToggle) (feedToggle as HTMLButtonElement).click();
          }}
          className="rounded-full"
        >
          Descubrir salones
        </Button>
      </motion.div>
    );
  }

  // Feed with posts
  return (
    <AnimatePresence mode="popLayout">
      <div className="divide-y divide-border">
        {followingPosts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <PostCard post={post} />
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}
