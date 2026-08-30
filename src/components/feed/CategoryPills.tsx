import { motion } from "motion/react";
import { Sparkles, Clock, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUSINESS_TYPES } from "@/constants/businessTypes";

interface CategoryPillsProps {
  categories?: { id: string; label: string; icon: React.ElementType }[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  tenantsWithAvailability?: string[];
  loadingAvailability?: boolean;
  hasCheckedAvailability?: boolean;
  onCheckAvailability?: () => void;
}

const DEFAULT_CATEGORIES = BUSINESS_TYPES.map((t) => ({
  id: t.id,
  label: t.label,
  icon: t.icon,
}));

const QUICK_FILTERS = [
  { id: "popular", label: "Popular", icon: Flame, color: "amber" },
  { id: "huecos", label: "Huecos hoy", icon: Clock, color: "emerald" },
];

export function CategoryPills({
  categories = DEFAULT_CATEGORIES,
  selected,
  onSelect,
  tenantsWithAvailability = [],
  loadingAvailability = false,
  hasCheckedAvailability = false,
  onCheckAvailability,
}: CategoryPillsProps) {
  const items = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const availableCount = tenantsWithAvailability.length;

  const handleFilterClick = (filterId: string, isSelected: boolean) => {
    if (filterId === "huecos" && !isSelected && !hasCheckedAvailability && onCheckAvailability) {
      onCheckAvailability();
    }
    onSelect(isSelected ? null : filterId);
  };

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
      {/* Quick filters */}
      {QUICK_FILTERS.map((filter) => {
        const Icon = filter.icon;
        const isSelected = selected === filter.id;
        const isHuecos = filter.id === "huecos";
        const isPopular = filter.id === "popular";

        return (
          <motion.button
            key={filter.id}
            whileTap={{ scale: 0.93 }}
            onClick={() => handleFilterClick(filter.id, isSelected)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full font-semibold text-xs border transition-all duration-200",
              isHuecos && isSelected && "bg-glow-ok text-white border-transparent shadow-md shadow-glow-ok/25",
              isHuecos && !isSelected && "bg-glow-ok-soft text-glow-ok-ink border-transparent",
              isPopular && isSelected && "bg-glow-warn text-white border-transparent shadow-md shadow-glow-warn/25",
              isPopular && !isSelected && "bg-glow-warn-soft text-glow-warn-ink border-transparent",
            )}
          >
            {loadingAvailability && isHuecos ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon className="h-3.5 w-3.5" />
            )}
            {filter.label}
            {isHuecos && hasCheckedAvailability && availableCount > 0 && !loadingAvailability && (
              <span
                className={cn(
                  "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  isSelected ? "bg-white/20" : "bg-glow-ok text-white",
                )}
              >
                {availableCount}
              </span>
            )}
          </motion.button>
        );
      })}

      {/* Divider */}
      <div className="shrink-0 w-px h-6 my-auto bg-line" />

      {/* All button */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full font-semibold text-xs border transition-all duration-200",
          selected === null
            ? "bg-glow-brand text-white border-transparent shadow-md shadow-glow-brand/20"
            : "bg-surface border-line text-ink-2 hover:bg-surface-container",
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
            whileTap={{ scale: 0.93 }}
            onClick={() => onSelect(isSelected ? null : category.id)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full font-semibold text-xs border transition-all duration-200",
              isSelected
                ? "bg-glow-brand text-white border-transparent shadow-md shadow-glow-brand/20"
                : "bg-surface border-line text-ink-2 hover:bg-surface-container",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {category.label}
          </motion.button>
        );
      })}
    </div>
  );
}
