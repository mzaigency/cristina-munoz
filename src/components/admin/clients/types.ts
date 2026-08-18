export interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  tags: string[];
  notes: string | null;
  total_visits: number;
  total_spent: number;
  last_visit_at: string | null;
  favorite_stylist_id: string | null;
  created_at: string;
  is_blocked: boolean;
  birthday: string | null;
  user_id: string | null;
}

export interface Booking {
  id: string;
  Fecha: string;
  Hora: string;
  services: unknown;
  stylist: string;
  status: string;
}

export type SortOption = "last_visit" | "name_asc" | "most_spent" | "most_visits";
export type FilterOption = "all" | "VIP" | "Frecuente" | "Nuevo" | "inactive" | "top_spenders";

export const TAG_OPTIONS = ["VIP", "Frecuente", "Nuevo", "Preferente", "Corporativo"];
export const TAG_COLORS: Record<string, string> = {
  "VIP": "bg-[var(--gp-warn-soft)] text-[var(--gp-warn-ink)] border-[var(--gp-warn-soft)]",
  "Frecuente": "bg-[var(--gp-info-soft)] text-[var(--gp-info-ink)] border-[var(--gp-info-soft)]",
  "Nuevo": "bg-[var(--gp-ok-soft)] text-[var(--gp-ok-ink)] border-[var(--gp-ok-soft)]",
  "Preferente": "bg-[var(--gp-purple-soft)] text-[var(--gp-purple-ink)] border-[var(--gp-purple-soft)]",
  "Corporativo": "bg-[var(--gp-chip)] text-[var(--gp-ink2)] border-[var(--gp-line)]",
};

