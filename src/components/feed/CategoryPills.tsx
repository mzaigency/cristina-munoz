import { motion, LayoutGroup } from "motion/react";
import { LayoutGrid, Clock, Flame } from "lucide-react";
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

  const isQuickFilter = selected === "popular" || selected === "huecos";

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-hide -mx-4 px-4 py-1"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {/* Quick filters */}
      {QUICK_FILTERS.map((filter) => {
        const Icon = filter.icon;
        const isSelected = selected === filter.id;
        const isHuecos = filter.id === "huecos";
        const isPopular = filter.id === "popular";

        return (
          <motion.button
            key={filter.id}
            whileTap={{ scale: 0.94 }}
            onClick={() => handleFilterClick(filter.id, isSelected)}
            className={cn(
              "relative shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs border transition-all duration-200",
              isHuecos && isSelected && "bg-emerald-600 text-white border-transparent shadow-md shadow-emerald-600/25",
              isHuecos && !isSelected && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
              isPopular && isSelected && "bg-amber-500 text-white border-transparent shadow-md shadow-amber-500/25",
              isPopular && !isSelected && "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20",
            )}
          >
            {loadingAvailability && isHuecos ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon className="h-3.5 w-3.5" />
            )}
            <span>{filter.label}</span>
            {isHuecos && hasCheckedAvailability && availableCount > 0 && !loadingAvailability && (
              <span
                className={cn(
                  "ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold leading-tight",
                  isSelected ? "bg-white/25 text-white" : "bg-emerald-600 text-white",
                )}
              >
                {availableCount}
              </span>
            )}
          </motion.button>
        );
      })}

      {/* Divider */}
      <div className="shrink-0 w-[1px] h-4.5 bg-line/80 my-auto rounded-full" />

      {/* Categories group with smooth sliding indicator */}
      <LayoutGroup id="category-subtabs">
        {/* All button */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => onSelect(null)}
          className={cn(
            "relative shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs border transition-colors duration-200",
            selected === null
              ? "text-white border-transparent"
              : "bg-surface border-line text-foreground/80 hover:bg-surface-container",
          )}
        >
          {selected === null && (
            <motion.div
              layoutId="active-category-pill"
              className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--glow-brand)] to-[#98329A] shadow-md shadow-[var(--glow-brand)]/20"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Todos</span>
          </span>
        </motion.button>

        {/* Category pills */}
        {items.map((category) => {
          const Icon = category.icon;
          const isSelected = selected === category.id;

          return (
            <motion.button
              key={category.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => onSelect(isSelected ? null : category.id)}
              className={cn(
                "relative shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs border transition-colors duration-200",
                isSelected
                  ? "text-white border-transparent"
                  : "bg-surface border-line text-foreground/80 hover:bg-surface-container",
              )}
            >
              {isSelected && (
                <motion.div
                  layoutId="active-category-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--glow-brand)] to-[#98329A] shadow-md shadow-[var(--glow-brand)]/20"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                <span>{category.label}</span>
              </span>
            </motion.button>
          );
        })}
      </LayoutGroup>
    </div>
  );
}
