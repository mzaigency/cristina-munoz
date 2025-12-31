// ============================================
// STORY CREATOR PREMIUM ASSETS
// ============================================

// FUENTES PREMIUM
export const STORY_FONTS = [
  { id: "playfair", name: "Playfair Display", url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap" },
  { id: "dancing", name: "Dancing Script", url: "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" },
  { id: "bebas", name: "Bebas Neue", url: "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" },
  { id: "montserrat", name: "Montserrat", url: "https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=swap" },
  { id: "pacifico", name: "Pacifico", url: "https://fonts.googleapis.com/css2?family=Pacifico&display=swap" },
  { id: "lobster", name: "Lobster", url: "https://fonts.googleapis.com/css2?family=Lobster&display=swap" },
  { id: "oswald", name: "Oswald", url: "https://fonts.googleapis.com/css2?family=Oswald:wght@700&display=swap" },
  { id: "sacramento", name: "Sacramento", url: "https://fonts.googleapis.com/css2?family=Sacramento&display=swap" },
  { id: "righteous", name: "Righteous", url: "https://fonts.googleapis.com/css2?family=Righteous&display=swap" },
  { id: "permanent", name: "Permanent Marker", url: "https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap" },
];

// PALETA DE COLORES PREMIUM
export const STORY_COLORS = [
  "#FFFFFF", "#000000", "#FF3B5C", "#FF6B35", "#F7C948", 
  "#4ECDC4", "#A78BFA", "#EC4899", "#10B981", "#3B82F6",
  "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#84CC16",
  "#E879F9", "#FB923C", "#22D3EE", "#A3E635", "#F472B6",
];

// GRADIENTES PARA TEXTO
export const TEXT_GRADIENTS = [
  { id: "sunset", colors: ["#FF3B5C", "#FF6B35", "#F7C948"], name: "Atardecer" },
  { id: "ocean", colors: ["#3B82F6", "#06B6D4", "#10B981"], name: "Océano" },
  { id: "purple", colors: ["#A78BFA", "#EC4899", "#F472B6"], name: "Violeta" },
  { id: "gold", colors: ["#F7C948", "#FB923C", "#EF4444"], name: "Dorado" },
  { id: "mint", colors: ["#10B981", "#4ECDC4", "#22D3EE"], name: "Menta" },
  { id: "neon", colors: ["#E879F9", "#A78BFA", "#3B82F6"], name: "Neón" },
  { id: "fire", colors: ["#EF4444", "#FB923C", "#F7C948"], name: "Fuego" },
  { id: "rainbow", colors: ["#FF3B5C", "#F7C948", "#10B981", "#3B82F6", "#A78BFA"], name: "Arcoíris" },
];

// ESTILOS DE TEXTO PREMIUM
export const TEXT_STYLES = [
  { 
    id: "normal", 
    name: "Normal", 
    icon: "Type",
    css: {} 
  },
  { 
    id: "neon", 
    name: "Neón", 
    icon: "Zap",
    css: { 
      textShadow: "0 0 5px currentColor, 0 0 10px currentColor, 0 0 20px currentColor, 0 0 40px currentColor" 
    } 
  },
  { 
    id: "outline", 
    name: "Outline", 
    icon: "Square",
    css: { 
      WebkitTextStroke: "2px currentColor",
      WebkitTextFillColor: "transparent",
    } 
  },
  { 
    id: "shadow3d", 
    name: "3D", 
    icon: "Box",
    css: { 
      textShadow: "2px 2px 0 #000, 4px 4px 0 #333, 6px 6px 0 #666" 
    } 
  },
  { 
    id: "glitch", 
    name: "Glitch", 
    icon: "Activity",
    css: { 
      textShadow: "-2px 0 #FF3B5C, 2px 0 #3B82F6",
      animation: "glitch 0.3s infinite"
    } 
  },
  { 
    id: "retro", 
    name: "Retro", 
    icon: "Star",
    css: { 
      textShadow: "3px 3px 0 #F7C948, 6px 6px 0 #FF6B35" 
    } 
  },
  { 
    id: "emboss", 
    name: "Relieve", 
    icon: "Layers",
    css: { 
      textShadow: "-1px -1px 1px rgba(255,255,255,0.5), 1px 1px 1px rgba(0,0,0,0.5)" 
    } 
  },
  { 
    id: "fire", 
    name: "Fuego", 
    icon: "Flame",
    css: { 
      textShadow: "0 0 5px #FF6B35, 0 0 10px #EF4444, 0 0 20px #F7C948, 0 -5px 30px #FF3B5C" 
    } 
  },
];

// FILTROS DE IMAGEN
export const IMAGE_FILTERS = [
  { id: "none", name: "Original", filter: "" },
  { id: "clarendon", name: "Clarendon", filter: "contrast(1.2) saturate(1.35)" },
  { id: "gingham", name: "Gingham", filter: "brightness(1.05) hue-rotate(-10deg)" },
  { id: "moon", name: "Moon", filter: "grayscale(1) contrast(1.1) brightness(1.1)" },
  { id: "lark", name: "Lark", filter: "contrast(0.9) saturate(1.2) brightness(1.1)" },
  { id: "reyes", name: "Reyes", filter: "sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)" },
  { id: "juno", name: "Juno", filter: "sepia(0.35) contrast(1.15) brightness(1.15) saturate(1.8)" },
  { id: "slumber", name: "Slumber", filter: "saturate(0.66) brightness(1.05) sepia(0.15)" },
  { id: "crema", name: "Crema", filter: "sepia(0.5) contrast(1.25) brightness(1.15) saturate(0.9)" },
  { id: "ludwig", name: "Ludwig", filter: "saturate(0.85) brightness(1.05) contrast(1.1)" },
  { id: "aden", name: "Aden", filter: "hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)" },
  { id: "perpetua", name: "Perpetua", filter: "brightness(1.1) saturate(1.1)" },
  { id: "valencia", name: "Valencia", filter: "sepia(0.08) contrast(1.08) brightness(1.08)" },
  { id: "xpro2", name: "X-Pro II", filter: "sepia(0.3) contrast(1.3) saturate(1.3)" },
  { id: "willow", name: "Willow", filter: "grayscale(0.5) contrast(0.95) brightness(0.9)" },
  { id: "nashville", name: "Nashville", filter: "sepia(0.2) contrast(1.2) brightness(1.05) saturate(1.2)" },
];

// ============================================
// STICKERS PREMIUM POR CATEGORÍAS
// ============================================

export interface StickerCategory {
  id: string;
  name: string;
  icon: string;
  stickers: string[];
}

export const STICKER_CATEGORIES: StickerCategory[] = [
  {
    id: "beauty",
    name: "Belleza",
    icon: "Sparkles",
    stickers: [
      "💇‍♀️", "💇", "💇‍♂️", "💅", "💄", "👄", "💋", "✨", "🌟", "⭐",
      "💎", "👑", "🎀", "🌸", "🌺", "🌹", "💐", "🪷", "🌷", "🪻",
      "🧴", "🪮", "🪥", "🧼", "🧽", "🪞", "💆‍♀️", "💆", "💆‍♂️", "🧖‍♀️",
    ]
  },
  {
    id: "celebration",
    name: "Celebración",
    icon: "PartyPopper",
    stickers: [
      "🎉", "🎊", "🥳", "🎈", "🎁", "🎂", "🍾", "🥂", "🎆", "🎇",
      "🪩", "🎤", "🎵", "🎶", "💃", "🕺", "🎭", "🎪", "🎬", "🎧",
      "🏆", "🥇", "🏅", "🎖️", "🎗️", "🎟️", "🎫", "🌈", "🦋", "✨",
    ]
  },
  {
    id: "mood",
    name: "Mood",
    icon: "Heart",
    stickers: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💗",
      "💖", "💝", "💘", "💕", "💞", "💓", "💔", "❣️", "💌", "🥰",
      "😍", "🤩", "😘", "😊", "😎", "🥹", "😭", "🔥", "💯", "👏",
    ]
  },
  {
    id: "promo",
    name: "Promociones",
    icon: "Tag",
    stickers: [
      "🔥", "⚡", "💥", "💫", "🌟", "✨", "🆕", "🆓", "🔝", "💰",
      "💵", "💸", "🤑", "📣", "📢", "🔔", "⏰", "⏳", "📅", "🗓️",
      "✅", "☑️", "✔️", "💯", "🎯", "🏷️", "🪧", "📍", "📌", "🚀",
    ]
  },
  {
    id: "social",
    name: "Social",
    icon: "Users",
    stickers: [
      "👍", "👎", "👊", "✊", "🤛", "🤜", "🤝", "🙌", "👐", "🤲",
      "🤞", "✌️", "🤟", "🤘", "🤙", "👋", "🖐️", "✋", "👆", "👇",
      "👈", "👉", "💪", "🦾", "🙏", "✍️", "🤳", "📱", "💻", "📸",
    ]
  },
  {
    id: "food",
    name: "Food & Drinks",
    icon: "Coffee",
    stickers: [
      "☕", "🍵", "🧋", "🥤", "🧃", "🍷", "🍸", "🍹", "🍺", "🥂",
      "🍾", "🧁", "🎂", "🍰", "🍪", "🍩", "🍫", "🍬", "🍭", "🍮",
      "🍨", "🍧", "🍦", "🍡", "🥧", "🧇", "🥐", "🥖", "🥯", "🍿",
    ]
  },
  {
    id: "nature",
    name: "Naturaleza",
    icon: "Leaf",
    stickers: [
      "🌸", "🌺", "🌻", "🌼", "🌷", "🌹", "🥀", "💐", "🪷", "🪻",
      "🌿", "🍀", "🍃", "🍂", "🍁", "🌴", "🌵", "🌲", "🌳", "🪴",
      "🌈", "☀️", "🌤️", "⛅", "🌙", "⭐", "🌟", "✨", "💫", "🦋",
    ]
  },
  {
    id: "weather",
    name: "Tiempo",
    icon: "Sun",
    stickers: [
      "☀️", "🌤️", "⛅", "🌥️", "☁️", "🌦️", "🌧️", "⛈️", "🌩️", "🌨️",
      "❄️", "🌬️", "💨", "🌪️", "🌫️", "🌈", "☔", "⚡", "🔥", "💧",
      "💦", "🌊", "🏖️", "🏝️", "🌅", "🌄", "🌇", "🌆", "🌃", "🌉",
    ]
  },
  {
    id: "arrows",
    name: "Flechas",
    icon: "ArrowRight",
    stickers: [
      "➡️", "⬅️", "⬆️", "⬇️", "↗️", "↘️", "↙️", "↖️", "↕️", "↔️",
      "↩️", "↪️", "⤴️", "⤵️", "🔄", "🔃", "🔀", "🔁", "🔂", "▶️",
      "⏩", "⏭️", "⏯️", "◀️", "⏪", "⏮️", "🔼", "⏫", "🔽", "⏬",
    ]
  },
  {
    id: "symbols",
    name: "Símbolos",
    icon: "Hash",
    stickers: [
      "💯", "🔥", "⚡", "💥", "💫", "✨", "🌟", "⭐", "🎯", "🔴",
      "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "❤️", "💙",
      "💚", "💛", "🧡", "💜", "🖤", "🤍", "🤎", "💗", "❌", "✅",
    ]
  },
];

// ============================================
// HERRAMIENTA DE DIBUJO
// ============================================

export const BRUSH_SIZES = [
  { id: "xs", size: 2, name: "Extra fino" },
  { id: "sm", size: 4, name: "Fino" },
  { id: "md", size: 8, name: "Medio" },
  { id: "lg", size: 16, name: "Grueso" },
  { id: "xl", size: 32, name: "Extra grueso" },
];

export const BRUSH_TYPES = [
  { id: "pen", name: "Bolígrafo", icon: "Pen" },
  { id: "marker", name: "Marcador", icon: "Edit3" },
  { id: "highlighter", name: "Subrayador", icon: "Highlighter" },
  { id: "spray", name: "Spray", icon: "Sparkles" },
];

// ============================================
// AJUSTES DE IMAGEN
// ============================================

export interface ImageAdjustment {
  id: string;
  name: string;
  icon: string;
  min: number;
  max: number;
  default: number;
  step: number;
  unit: string;
  cssProperty: string;
}

export const IMAGE_ADJUSTMENTS: ImageAdjustment[] = [
  { id: "brightness", name: "Brillo", icon: "Sun", min: 0, max: 200, default: 100, step: 5, unit: "%", cssProperty: "brightness" },
  { id: "contrast", name: "Contraste", icon: "Circle", min: 0, max: 200, default: 100, step: 5, unit: "%", cssProperty: "contrast" },
  { id: "saturation", name: "Saturación", icon: "Droplet", min: 0, max: 200, default: 100, step: 5, unit: "%", cssProperty: "saturate" },
  { id: "temperature", name: "Temperatura", icon: "Thermometer", min: -50, max: 50, default: 0, step: 5, unit: "°", cssProperty: "hue-rotate" },
  { id: "blur", name: "Desenfoque", icon: "Eye", min: 0, max: 20, default: 0, step: 1, unit: "px", cssProperty: "blur" },
  { id: "vignette", name: "Viñeta", icon: "Aperture", min: 0, max: 100, default: 0, step: 5, unit: "%", cssProperty: "vignette" },
];

// Función helper para generar el filtro CSS
export const generateFilterCSS = (adjustments: Record<string, number>): string => {
  const parts: string[] = [];
  
  if (adjustments.brightness !== 100) {
    parts.push(`brightness(${adjustments.brightness}%)`);
  }
  if (adjustments.contrast !== 100) {
    parts.push(`contrast(${adjustments.contrast}%)`);
  }
  if (adjustments.saturation !== 100) {
    parts.push(`saturate(${adjustments.saturation}%)`);
  }
  if (adjustments.temperature !== 0) {
    parts.push(`hue-rotate(${adjustments.temperature}deg)`);
  }
  if (adjustments.blur > 0) {
    parts.push(`blur(${adjustments.blur}px)`);
  }
  
  return parts.join(" ");
};

// Función helper para generar viñeta CSS
export const generateVignetteCSS = (intensity: number): string => {
  if (intensity === 0) return "none";
  const opacity = intensity / 100;
  return `radial-gradient(circle, transparent 40%, rgba(0,0,0,${opacity}) 100%)`;
};

// ============================================
// ANIMACIONES DE TEXTO
// ============================================

export const TEXT_ANIMATIONS = [
  { id: "none", name: "Sin animación", css: {} },
  { id: "pulse", name: "Pulso", css: { animation: "pulse 2s ease-in-out infinite" } },
  { id: "bounce", name: "Rebote", css: { animation: "bounce 1s ease infinite" } },
  { id: "shake", name: "Vibrar", css: { animation: "shake 0.5s ease-in-out infinite" } },
  { id: "glow", name: "Brillo", css: { animation: "glow 2s ease-in-out infinite alternate" } },
  { id: "typing", name: "Escribir", css: { animation: "typing 3s steps(40, end)" } },
];

// CSS adicional para animaciones (debe agregarse al index.css)
export const ANIMATION_KEYFRAMES = `
@keyframes glitch {
  0%, 100% { text-shadow: -2px 0 #FF3B5C, 2px 0 #3B82F6; }
  25% { text-shadow: 2px 0 #FF3B5C, -2px 0 #3B82F6; }
  50% { text-shadow: -2px 0 #3B82F6, 2px 0 #FF3B5C; }
  75% { text-shadow: 2px 0 #3B82F6, -2px 0 #FF3B5C; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@keyframes glow {
  from { text-shadow: 0 0 5px currentColor, 0 0 10px currentColor; }
  to { text-shadow: 0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor; }
}

@keyframes typing {
  from { width: 0; }
  to { width: 100%; }
}
`;
