import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { FilterOption, SortOption } from "./types";

interface ClientFiltersProps {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const FILTERS: { value: FilterOption; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "VIP", label: "VIP" },
  { value: "Frecuente", label: "Frecuente" },
  { value: "Nuevo", label: "Nuevo" },
  { value: "inactive", label: "Inactivos +30d" },
  { value: "top_spenders", label: "Top gastadores" },
];

export function ClientFilters({ activeFilter, onFilterChange, sortBy, onSortChange }: ClientFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <ScrollArea className="flex-1 whitespace-nowrap">
        <div className="flex gap-1.5 pb-1">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => onFilterChange(f.value === activeFilter ? "all" : f.value)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                activeFilter === f.value
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>

      <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
        <SelectTrigger className="w-[130px] h-8 text-xs shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="last_visit">Última visita</SelectItem>
          <SelectItem value="name_asc">Nombre A-Z</SelectItem>
          <SelectItem value="most_spent">Mayor gasto</SelectItem>
          <SelectItem value="most_visits">Más visitas</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
