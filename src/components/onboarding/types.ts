export interface StepProps {
  onNext: () => void;
  onPrev?: () => void;
  tenantId: string;
  tenantName?: string;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  maxStylists?: number;
  maxServices?: number;
  planSlug?: string;
}

export interface BrandingData {
  tagline: string;
  description: string;
  faqs: Array<{ question: string; answer: string }>;
}

export interface ServiceForm {
  name: string;
  price: string;
  type: "simple" | "compound";
  duration: number;
  duration_part1_active: number;
  duration_exposure_pause: number;
  duration_part2_active: number;
  category: string;
}

export interface StylistForm {
  name: string;
  color: string;
}

export const colorPresets = [
  { primary: "#8B5CF6", secondary: "#D946EF", name: "Violeta", gradient: "from-violet-500 to-fuchsia-500" },
  { primary: "#3B82F6", secondary: "#06B6D4", name: "Océano", gradient: "from-blue-500 to-cyan-500" },
  { primary: "#10B981", secondary: "#34D399", name: "Esmeralda", gradient: "from-emerald-500 to-green-400" },
  { primary: "#F59E0B", secondary: "#FBBF24", name: "Ámbar", gradient: "from-amber-500 to-yellow-400" },
  { primary: "#EF4444", secondary: "#F87171", name: "Coral", gradient: "from-red-500 to-rose-400" },
  { primary: "#EC4899", secondary: "#F472B6", name: "Rosa", gradient: "from-pink-500 to-rose-400" },
  { primary: "#1F2937", secondary: "#6B7280", name: "Elegante", gradient: "from-gray-800 to-gray-500" },
  { primary: "#7C3AED", secondary: "#A78BFA", name: "Púrpura", gradient: "from-purple-600 to-violet-400" },
  { primary: "#0EA5E9", secondary: "#38BDF8", name: "Cielo", gradient: "from-sky-500 to-sky-400" },
  { primary: "#14B8A6", secondary: "#5EEAD4", name: "Turquesa", gradient: "from-teal-500 to-teal-300" },
  { primary: "#F97316", secondary: "#FB923C", name: "Naranja", gradient: "from-orange-500 to-orange-400" },
  { primary: "#8B5CF6", secondary: "#EC4899", name: "Aurora", gradient: "from-violet-500 to-pink-500" },
];

export {
  fontOptions,
  bodyFontOptions,
  HEADING_FONT_OPTIONS,
  BODY_FONT_OPTIONS,
} from "@/constants/tenantFonts";

export const buttonStyles = [
  { value: "rounded", label: "Redondeado", preview: "rounded-xl" },
  { value: "pill", label: "Píldora", preview: "rounded-full" },
  { value: "square", label: "Cuadrado", preview: "rounded-md" },
  { value: "sharp", label: "Recto", preview: "rounded-none" },
];

export const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export const stylistColors = [
  "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", 
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
];
