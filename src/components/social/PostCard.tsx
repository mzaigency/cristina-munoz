import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useHaptic } from "@/hooks/useHaptic";
import { usePosts, Post } from "@/hooks/usePosts";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CommentsSection } from "./CommentsSection";

interface PostCardProps {
  post: Post;
  showHeader?: boolean;
}

export function PostCard({ post, showHeader = true }: PostCardProps) {
  const [showHeart, setShowHeart] = useState(false);
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const haptic = useHaptic();
  const { toggleLike, isAuthenticated } = usePosts();
  const navigate = useNavigate();

  const handleDoubleTap = useCallback(() => {
    if (!isLiked) {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
      toggleLike(post.id, false);
    }
    haptic.success();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  }, [isLiked, post.id, toggleLike, haptic]);

  const handleLikeClick = useCallback(() => {
    haptic.light();
    if (isLiked) {
      setIsLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
      toggleLike(post.id, true);
    } else {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
      toggleLike(post.id, false);
    }
  }, [isLiked, post.id, toggleLike, haptic]);

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { 
    addSuffix: false, 
    locale: es 
  });

  const goToSalon = () => {
    if (post.tenant_slug) {
      navigate(`/${post.tenant_slug}`);
    }
  };

  return (
    <div className="bg-card border-b border-border">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between p-3">
          <button 
            onClick={goToSalon}
            className="flex items-center gap-3 active:opacity-70 transition-opacity"
          >
            <Avatar className="w-8 h-8 ring-2 ring-primary/20">
              <AvatarImage src={post.tenant_logo || ""} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {post.tenant_name?.charAt(0) || "S"}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-semibold leading-tight">{post.tenant_name}</p>
              {post.category && (
                <p className="text-xs text-muted-foreground">{post.category}</p>
              )}
            </div>
          </button>
          <button className="p-2 -mr-2 text-muted-foreground">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Image */}
      <div 
        className="relative aspect-square bg-muted"
        onDoubleClick={handleDoubleTap}
      >
        <img
          src={post.image_url}
          alt={post.caption || "Post"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Double tap heart animation */}
        <AnimatePresence>
          {showHeart && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart className="w-24 h-24 text-white fill-white drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleLikeClick}
              className="active:opacity-70"
            >
              <Heart 
                className={cn(
                  "w-6 h-6 transition-colors",
                  isLiked ? "fill-red-500 text-red-500" : "text-foreground"
                )} 
              />
            </motion.button>
            <button 
              className="active:opacity-70"
              onClick={() => {
                haptic.light();
                setShowComments(true);
              }}
            >
              <MessageCircle className="w-6 h-6" />
            </button>
            <button className="active:opacity-70">
              <Send className="w-6 h-6" />
            </button>
          </div>
          <button className="active:opacity-70">
            <Bookmark className="w-6 h-6" />
          </button>
        </div>

        {/* Likes count */}
        <p className="text-sm font-semibold mb-1">
          {likesCount.toLocaleString()} Me gusta
        </p>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm">
            <span className="font-semibold mr-1.5">{post.tenant_name}</span>
            {post.caption}
          </p>
        )}

        {/* View comments */}
        {(post.comments_count || 0) > 0 && (
          <button 
            onClick={() => setShowComments(true)}
            className="text-sm text-muted-foreground mt-1"
          >
            Ver los {post.comments_count} comentarios
          </button>
        )}

        {/* Time */}
        <p className="text-xs text-muted-foreground mt-1.5">
          hace {timeAgo}
        </p>
      </div>

      {/* Comments modal */}
      <CommentsSection
        postId={post.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </div>
  );
}
