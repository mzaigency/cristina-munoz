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
  { value: "inactive", label: "Inactivos +30 d" },
  { value: "top_spenders", label: "Top gastadores" },
];

/** Chips del sistema, no una píldora propia. Ordenación con el select de glow. */
export function ClientFilters({ activeFilter, onFilterChange, sortBy, onSortChange }: ClientFiltersProps) {
  return (
    <div className="glow-toolbar">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          className={`glow-chip${activeFilter === f.value ? " glow-chip--on" : ""}`}
          onClick={() => onFilterChange(f.value === activeFilter ? "all" : f.value)}
        >
          {f.label}
        </button>
      ))}
      <select
        className="glow-input"
        style={{ width: 160, marginLeft: "auto" }}
        aria-label="Ordenar clientes"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
      >
        <option value="last_visit">Última visita</option>
        <option value="name_asc">Nombre A-Z</option>
        <option value="most_spent">Mayor gasto</option>
        <option value="most_visits">Más visitas</option>
      </select>
    </div>
  );
}
