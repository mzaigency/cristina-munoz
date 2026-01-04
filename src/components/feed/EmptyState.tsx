import { motion } from "motion/react";
import { Search, Sparkles, Clock, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type: "no-results" | "empty" | "no-availability";
  searchQuery?: string;
  onClearSearch?: () => void;
  onClearFilter?: () => void;
}

export function EmptyState({ type, searchQuery, onClearSearch, onClearFilter }: EmptyStateProps) {
  const getIcon = () => {
    switch (type) {
      case "no-results":
        return <Search className="h-10 w-10 text-primary" />;
      case "no-availability":
        return <Clock className="h-10 w-10 text-emerald-500" />;
      default:
        return <Sparkles className="h-10 w-10 text-primary" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "no-results":
        return "No encontramos resultados";
      case "no-availability":
        return "Sin huecos disponibles hoy";
      default:
        return "Descubre salones increíbles";
    }
  };

  const getMessage = () => {
    switch (type) {
      case "no-results":
        return `No hay salones que coincidan con "${searchQuery}". Intenta con otra búsqueda.`;
      case "no-availability":
        return "Parece que todos los salones están ocupados hoy. ¡Prueba a reservar para otro día!";
      default:
        return "Pronto aparecerán los mejores salones de tu zona. ¡Mantente atento!";
    }
  };

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
        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center ${
          type === "no-availability" 
            ? "bg-gradient-to-br from-emerald-500/20 to-emerald-600/20" 
            : "bg-gradient-to-br from-primary/20 to-accent/20"
        }`}>
          {getIcon()}
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
          className={`absolute inset-0 rounded-3xl border-2 ${
            type === "no-availability" ? "border-emerald-500/30" : "border-primary/30"
          }`}
        />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl font-bold text-foreground mb-2"
      >
        {getTitle()}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground text-sm max-w-xs mb-6"
      >
        {getMessage()}
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

      {type === "no-availability" && onClearFilter && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-3"
        >
          <Button 
            onClick={onClearFilter}
            variant="outline"
            className="rounded-full px-6 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Ver todos los salones
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
