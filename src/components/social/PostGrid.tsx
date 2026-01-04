import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Play } from "lucide-react";
import { Post } from "@/hooks/usePosts";
import { PostModal } from "./PostModal";
import { cn } from "@/lib/utils";

interface PostGridProps {
  posts: Post[];
  className?: string;
}

export function PostGrid({ posts, className }: PostGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No hay publicaciones todavía</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn("grid grid-cols-3 gap-0.5", className)}>
        {posts.map((post, index) => (
          <motion.button
            key={post.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelectedIndex(index)}
            className="relative aspect-square bg-muted overflow-hidden group"
          >
            <img
              src={post.image_url}
              alt={post.caption || "Post"}
              className="w-full h-full object-cover transition-transform group-active:scale-95"
              loading="lazy"
            />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
              <div className="flex items-center gap-1.5">
                <Heart className="w-5 h-5 fill-white" />
                <span className="font-semibold">{post.likes_count}</span>
              </div>
              {post.comments_count > 0 && (
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-5 h-5 fill-white" />
                  <span className="font-semibold">{post.comments_count}</span>
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Post Modal */}
      <PostModal
        posts={posts}
        initialIndex={selectedIndex ?? 0}
        isOpen={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
      />
    </>
  );
}
