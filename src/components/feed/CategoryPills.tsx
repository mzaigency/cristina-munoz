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

  const PILL_BASE =
    "relative shrink-0 flex items-center gap-1.5 h-9 px-3.5 rounded-full font-semibold text-[13px] border transition-colors duration-200";
  const PILL_OFF =
    "bg-white dark:bg-surface border-line text-foreground/75 hover:text-foreground hover:border-[var(--glow-brand)]/30 hover:bg-[var(--glow-brand-soft)]";
  const PILL_ON = "text-white border-transparent";

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-hide -mx-4 px-4 py-1 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible md:gap-2.5"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <LayoutGroup id="category-subtabs">
        {/* Filtros rápidos */}
        {QUICK_FILTERS.map((filter) => {
          const Icon = filter.icon;
          const isSelected = selected === filter.id;
          const isHuecos = filter.id === "huecos";

          return (
            <motion.button
              key={filter.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleFilterClick(filter.id, isSelected)}
              className={cn(PILL_BASE, isSelected ? PILL_ON : PILL_OFF)}
            >
              {isSelected && (
                <motion.div
                  layoutId="active-category-pill"
                  className="absolute inset-0 rounded-full bg-[linear-gradient(100deg,var(--glow-brand),#98329A)] shadow-[0_6px_18px_-8px_rgba(34,64,140,0.6)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {loadingAvailability && isHuecos ? (
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icon
                    className={cn("h-3.5 w-3.5", !isSelected && "text-[var(--glow-brand)]")}
                    strokeWidth={2.2}
                  />
                )}
                <span>{filter.label}</span>
                {isHuecos && hasCheckedAvailability && availableCount > 0 && !loadingAvailability && (
                  <span
                    className={cn(
                      "ml-0.5 px-1.5 rounded-full text-[10px] font-bold leading-[16px]",
                      isSelected
                        ? "bg-white/25 text-white"
                        : "bg-[var(--glow-brand-soft)] text-[var(--glow-brand-ink)]",
                    )}
                  >
                    {availableCount}
                  </span>
                )}
              </span>
            </motion.button>
          );
        })}

        {/* Separador */}
        <div className="shrink-0 w-px h-5 bg-line my-auto rounded-full" />

        {/* Todos */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onSelect(null)}
          className={cn(PILL_BASE, selected === null ? PILL_ON : PILL_OFF)}
        >
          {selected === null && (
            <motion.div
              layoutId="active-category-pill"
              className="absolute inset-0 rounded-full bg-[linear-gradient(100deg,var(--glow-brand),#98329A)] shadow-[0_6px_18px_-8px_rgba(34,64,140,0.6)]"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <LayoutGrid
              className={cn("h-3.5 w-3.5", selected !== null && "text-[var(--glow-brand)]")}
              strokeWidth={2.2}
            />
            <span>Todos</span>
          </span>
        </motion.button>

        {/* Categorías */}
        {items.map((category) => {
          const Icon = category.icon;
          const isSelected = selected === category.id;

          return (
            <motion.button
              key={category.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelect(isSelected ? null : category.id)}
              className={cn(PILL_BASE, isSelected ? PILL_ON : PILL_OFF)}
            >
              {isSelected && (
                <motion.div
                  layoutId="active-category-pill"
                  className="absolute inset-0 rounded-full bg-[linear-gradient(100deg,var(--glow-brand),#98329A)] shadow-[0_6px_18px_-8px_rgba(34,64,140,0.6)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon
                  className={cn("h-3.5 w-3.5", !isSelected && "text-[var(--glow-brand)]")}
                  strokeWidth={2.2}
                />
                <span>{category.label}</span>
              </span>
            </motion.button>
          );
        })}
      </LayoutGroup>
    </div>
  );
}
