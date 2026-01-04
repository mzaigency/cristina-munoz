import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Post } from "@/hooks/usePosts";
import { PostCard } from "./PostCard";
import { useHaptic } from "@/hooks/useHaptic";
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

interface PostModalProps {
  posts: Post[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onDelete?: (postId: string) => void;
}

export function PostModal({ posts, initialIndex, isOpen, onClose, isAdmin, onDelete }: PostModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const haptic = useHaptic();

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < posts.length - 1) {
      haptic.selection();
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, posts.length, haptic]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      haptic.selection();
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex, haptic]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goPrev, goNext, onClose]);

  // Handle swipe gestures
  const handleDragEnd = (event: any, info: { offset: { x: number } }) => {
    const threshold = 50;
    if (info.offset.x < -threshold) {
      goNext();
    } else if (info.offset.x > threshold) {
      goPrev();
    }
  };

  const handleDelete = () => {
    if (onDelete && posts[currentIndex]) {
      onDelete(posts[currentIndex].id);
      setShowDeleteDialog(false);
      if (posts.length === 1) {
        onClose();
      } else if (currentIndex >= posts.length - 1) {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      }
    }
  };

  if (!isOpen || posts.length === 0) return null;

  const currentPost = posts[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-background to-transparent">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {posts.length}
          </span>
          {isAdmin ? (
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="p-2 -mr-2 rounded-full text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* Content */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="h-full pt-16 pb-safe overflow-y-auto"
        >
          <PostCard post={currentPost} showHeader={true} />
        </motion.div>

        {/* Navigation buttons (desktop) */}
        <div className="hidden md:flex absolute inset-y-0 left-0 items-center p-4">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-full bg-muted/80 hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
        <div className="hidden md:flex absolute inset-y-0 right-0 items-center p-4">
          <button
            onClick={goNext}
            disabled={currentIndex === posts.length - 1}
            className="p-2 rounded-full bg-muted/80 hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Dots indicator */}
        {posts.length <= 10 && (
          <div className="absolute bottom-safe left-0 right-0 flex justify-center gap-1.5 pb-4">
            {posts.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  haptic.selection();
                  setCurrentIndex(index);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentIndex 
                    ? "bg-primary w-4" 
                    : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar publicación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La publicación será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatePresence>
  );
}
