import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { Post } from "@/hooks/usePosts";
import { PostModal } from "./PostModal";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PostGridProps {
  posts: Post[];
  className?: string;
  isAdmin?: boolean;
  onDelete?: (postId: string) => void;
}

export function PostGrid({ posts, className, isAdmin, onDelete }: PostGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    setDeletePostId(postId);
  };

  const confirmDelete = () => {
    if (deletePostId && onDelete) {
      onDelete(deletePostId);
      setDeletePostId(null);
    }
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No hay publicaciones todavía</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn("grid grid-cols-3 gap-2", className)}>
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            data-fixed-radius
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedIndex(index)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedIndex(index);
              }
            }}
            className="relative aspect-square bg-muted overflow-hidden group cursor-pointer !rounded-lg"
            style={{ borderRadius: "0.5rem" }}
          >
            <img
              src={post.image_url}
              alt={post.caption || "Post"}
              className="w-full h-full object-cover transition-transform group-active:scale-95 !rounded-xl"
              style={{ borderRadius: "0.75rem" }}
              loading="lazy"
            />

            {/* Hover overlay */}
            <div
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white !rounded-xl"
              style={{ borderRadius: "0.75rem" }}
            >
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

            {/* Admin delete button */}
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => handleDeleteClick(e, post.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive z-10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Post Modal */}
      <PostModal
        posts={posts}
        initialIndex={selectedIndex ?? 0}
        isOpen={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
        isAdmin={isAdmin}
        onDelete={onDelete}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar publicación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La publicación será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
