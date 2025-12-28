import { motion } from "motion/react";
import { Scissors, Sparkles, Droplets, Hand, Brush } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryPillsProps {
  categories: { id: string; label: string; icon: React.ElementType }[];
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

export function CategoryPills({ 
  categories = DEFAULT_CATEGORIES, 
  selected, 
  onSelect 
}: Partial<CategoryPillsProps> & { selected: string | null; onSelect: (id: string | null) => void }) {
  const items = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {/* All button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(null)}
          className={cn(
            "shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all duration-300",
            selected === null
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              : "bg-secondary/80 text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Todos
        </motion.button>

        {items.map((category, index) => {
          const Icon = category.icon;
          const isSelected = selected === category.id;
          
          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(isSelected ? null : category.id)}
              className={cn(
                "shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all duration-300",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-secondary/80 text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </motion.button>
          );
        })}
      </div>
      
      {/* Fade edges */}
      <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
}
