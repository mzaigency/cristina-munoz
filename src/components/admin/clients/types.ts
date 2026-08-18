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
  "VIP": "bg-amber-500/20 text-amber-700 border-amber-500/30",
  "Frecuente": "bg-blue-500/20 text-blue-700 border-blue-500/30",
  "Nuevo": "bg-green-500/20 text-green-700 border-green-500/30",
  "Preferente": "bg-purple-500/20 text-purple-700 border-purple-500/30",
  "Corporativo": "bg-slate-500/20 text-slate-700 border-slate-500/30",
};
