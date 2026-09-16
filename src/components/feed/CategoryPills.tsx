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
  { id: "huecos", label: "Huecos hoy", icon: Clock },
  { id: "popular", label: "Popular", icon: Flame },
];

/** Una sola fila, nunca apilada: en móvil y escritorio se desliza en horizontal. */
const ROW =
  "flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-hide -mx-4 px-4 py-1 md:mx-0 md:px-0";

const PILL =
  "relative shrink-0 flex items-center gap-1.5 h-9 px-3.5 rounded-full font-semibold text-[13px] border transition-colors duration-200";

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
    <div className={ROW} style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
      {/* Filtros rápidos — color propio para que se distingan de las categorías */}
      {QUICK_FILTERS.map((filter) => {
        const Icon = filter.icon;
        const isSelected = selected === filter.id;
        const isHuecos = filter.id === "huecos";

        return (
          <motion.button
            key={filter.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleFilterClick(filter.id, isSelected)}
            className={cn(
              PILL,
              isHuecos && isSelected && "bg-emerald-600 text-white border-emerald-600 shadow-[0_6px_16px_-8px_rgba(5,150,105,0.7)]",
              isHuecos && !isSelected && "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100",
              !isHuecos && isSelected && "bg-amber-500 text-white border-amber-500 shadow-[0_6px_16px_-8px_rgba(217,119,6,0.7)]",
              !isHuecos && !isSelected && "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100",
            )}
          >
            {loadingAvailability && isHuecos ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon className="h-4 w-4" strokeWidth={2.3} />
            )}
            <span>{filter.label}</span>
            {isHuecos && hasCheckedAvailability && availableCount > 0 && !loadingAvailability && (
              <span
                className={cn(
                  "ml-0.5 px-1.5 rounded-full text-[10px] font-extrabold leading-[16px]",
                  isSelected ? "bg-white/25 text-white" : "bg-emerald-600 text-white",
                )}
              >
                {availableCount}
              </span>
            )}
          </motion.button>
        );
      })}

      {/* Separador */}
      <div className="shrink-0 w-px h-5 bg-line my-auto rounded-full" />

      <LayoutGroup id="category-subtabs">
        {/* Todos */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onSelect(null)}
          className={cn(
            PILL,
            selected === null
              ? "text-white border-transparent"
              : "bg-white border-[var(--glow-line)] text-foreground hover:border-[var(--glow-brand)]/40 hover:bg-[var(--glow-brand-soft)]",
          )}
        >
          {selected === null && (
            <motion.div
              layoutId="active-category-pill"
              className="absolute inset-0 rounded-full bg-[linear-gradient(100deg,var(--glow-brand),#98329A)] shadow-[0_6px_18px_-8px_rgba(34,64,140,0.65)]"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <LayoutGrid
              className={cn("h-4 w-4", selected !== null && "text-[var(--glow-brand)]")}
              strokeWidth={2.3}
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
              className={cn(
                PILL,
                isSelected
                  ? "text-white border-transparent"
                  : "bg-white border-[var(--glow-line)] text-foreground hover:border-[var(--glow-brand)]/40 hover:bg-[var(--glow-brand-soft)]",
              )}
            >
              {isSelected && (
                <motion.div
                  layoutId="active-category-pill"
                  className="absolute inset-0 rounded-full bg-[linear-gradient(100deg,var(--glow-brand),#98329A)] shadow-[0_6px_18px_-8px_rgba(34,64,140,0.65)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon
                  className={cn("h-4 w-4", !isSelected && "text-[var(--glow-brand)]")}
                  strokeWidth={2.3}
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
