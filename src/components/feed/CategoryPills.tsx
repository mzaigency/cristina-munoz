import { motion } from "motion/react";
import { Scissors, Sparkles, Droplets, Hand, Brush, Clock, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryPillsProps {
  categories?: { id: string; label: string; icon: React.ElementType }[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

const DEFAULT_CATEGORIES = [
  { id: "peluqueria", label: "Peluquería", icon: Scissors },
  { id: "barberia", label: "Barbería", icon: Scissors },
  { id: "spa", label: "Spa", icon: Droplets },
  { id: "unas", label: "Uñas", icon: Hand },
  { id: "estetica", label: "Estética", icon: Brush },
  { id: "maquillaje", label: "Maquillaje", icon: Sparkles },
];

// Quick filter pills for mobile
const QUICK_FILTERS = [
  { id: "huecos", label: "Huecos hoy", icon: Clock },
  { id: "popular", label: "Popular", icon: Flame },
];

export function CategoryPills({ 
  categories = DEFAULT_CATEGORIES, 
  selected, 
  onSelect 
}: CategoryPillsProps) {
  const items = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
      {/* All button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs transition-all",
          selected === null
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-secondary/60 text-muted-foreground active:bg-secondary"
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Todos
      </motion.button>

      {/* Category pills */}
      {items.map((category) => {
        const Icon = category.icon;
        const isSelected = selected === category.id;
        
        return (
          <motion.button
            key={category.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(isSelected ? null : category.id)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs transition-all",
              isSelected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary/60 text-muted-foreground active:bg-secondary"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {category.label}
          </motion.button>
        );
      })}

      {/* Divider */}
      <div className="shrink-0 w-px h-6 my-auto bg-border/50" />

      {/* Quick filters */}
      {QUICK_FILTERS.map((filter) => {
        const Icon = filter.icon;
        const isSelected = selected === filter.id;
        
        return (
          <motion.button
            key={filter.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(isSelected ? null : filter.id)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs transition-all",
              isSelected
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 active:bg-amber-500/20"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {filter.label}
          </motion.button>
        );
      })}
    </div>
  );
}
