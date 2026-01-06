// Types for the mobile story editor

export interface OverlayItem {
  id: string;
  type: "text" | "sticker" | "image" | "widget";
  content: string;
  x: number; // 0-1 relative position
  y: number;
  scale: number;
  rotation: number; // degrees
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: "none" | "solid" | "translucent";
  textAlign?: "left" | "center" | "right";
  fontStyle?: string;
  clipShape?: "rect" | "circle" | "rounded";
  // Widget-specific config
  widgetType?: string;
  widgetConfig?: Record<string, any>;
}

export interface GestureState {
  isDragging: boolean;
  isMultiTouch: boolean;
  activeItemId: string | null;
  showCenterGuideH: boolean;
  showCenterGuideV: boolean;
  isInTrashZone: boolean;
  trashIntensity: number;
}

export interface DrawingPath {
  points: { x: number; y: number }[];
  color: string;
  size: number;
  type: "pen" | "neon" | "eraser";
  opacity: number;
}

export interface FontOption {
  id: string;
  name: string;
  family: string;
  preview: string;
}

export interface ColorOption {
  id: string;
  color: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { id: "classic", name: "Clásica", family: "'Inter', sans-serif", preview: "Aa" },
  { id: "modern", name: "Moderna", family: "'Bebas Neue', sans-serif", preview: "Aa" },
  { id: "neon", name: "Neón", family: "'Righteous', cursive", preview: "Aa" },
  { id: "typewriter", name: "Máquina", family: "'Roboto Mono', monospace", preview: "Aa" },
  { id: "elegant", name: "Elegante", family: "'Playfair Display', serif", preview: "Aa" },
];

export const COLOR_OPTIONS: ColorOption[] = [
  { id: "white", color: "#FFFFFF" },
  { id: "black", color: "#000000" },
  { id: "red", color: "#FF3B5C" },
  { id: "orange", color: "#FF9500" },
  { id: "yellow", color: "#FFCC00" },
  { id: "green", color: "#34C759" },
  { id: "teal", color: "#5AC8FA" },
  { id: "blue", color: "#007AFF" },
  { id: "purple", color: "#AF52DE" },
  { id: "pink", color: "#FF2D92" },
];

export const BRUSH_OPTIONS = [
  { id: "pen", name: "Plumón", icon: "✏️" },
  { id: "neon", name: "Neón", icon: "✨" },
  { id: "eraser", name: "Borrador", icon: "🧽" },
] as const;

export const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Bebas+Neue&family=Righteous&family=Roboto+Mono:wght@400;500&family=Playfair+Display:wght@400;700&display=swap";
