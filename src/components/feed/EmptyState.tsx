import { motion } from "motion/react";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type: "no-results" | "empty";
  searchQuery?: string;
  onClearSearch?: () => void;
}

export function EmptyState({ type, searchQuery, onClearSearch }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      {/* Animated Icon Container */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: 0.2 
        }}
        className="relative mb-6"
      >
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          {type === "no-results" ? (
            <Search className="h-10 w-10 text-primary" />
          ) : (
            <Sparkles className="h-10 w-10 text-primary" />
          )}
        </div>
        
        {/* Decorative rings */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-3xl border-2 border-primary/30"
        />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl font-bold text-foreground mb-2"
      >
        {type === "no-results" 
          ? "No encontramos resultados" 
          : "Descubre salones increíbles"}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground text-sm max-w-xs mb-6"
      >
        {type === "no-results" 
          ? `No hay salones que coincidan con "${searchQuery}". Intenta con otra búsqueda.`
          : "Pronto aparecerán los mejores salones de tu zona. ¡Mantente atento!"}
      </motion.p>

      {type === "no-results" && onClearSearch && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button 
            onClick={onClearSearch}
            className="rounded-full px-6"
          >
            Limpiar búsqueda
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
