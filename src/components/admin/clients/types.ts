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
  "VIP": "bg-glow-warn/20 text-glow-warn-ink border-glow-warn/30",
  "Frecuente": "bg-glow-brand/20 text-glow-brand-ink border-glow-brand/30",
  "Nuevo": "bg-glow-ok/20 text-glow-ok-ink border-glow-ok/30",
  "Preferente": "bg-glow-accent/20 text-glow-accent-ink border-glow-accent/30",
  "Corporativo": "bg-outline/20 text-on-surface border-outline/30",
};
