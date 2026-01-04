export interface LandingTheme {
  id: string;
  name: string;
  description: string;
  
  // Layout del hero
  heroLayout: "fullscreen" | "minimal" | "split" | "bold" | "glass";
  
  // Estilo de servicios
  servicesLayout: "cards" | "list" | "horizontal-scroll" | "accordion";
  
  // Estilo de galeria
  galleryLayout: "grid" | "masonry" | "carousel" | "vertical-slider";
  
  // Estilo de reviews
  reviewsLayout: "carousel" | "single" | "grid" | "quotes";
  
  // Colores por defecto del tema
  defaultColors: {
    primary: string;
    secondary: string;
  };
  
  // Fuentes recomendadas
  recommendedFonts: {
    heading: string;
    body: string;
  };
  
  // Estilo de botón recomendado
  buttonStyle: "rounded" | "pill" | "square" | "sharp";
}

export const landingThemes: LandingTheme[] = [
  {
    id: "immersive",
    name: "Inmersivo",
    description: "Hero cinematográfico a pantalla completa con parallax",
    heroLayout: "fullscreen",
    servicesLayout: "cards",
    galleryLayout: "grid",
    reviewsLayout: "carousel",
    defaultColors: { primary: "#8B5CF6", secondary: "#D946EF" },
    recommendedFonts: { heading: "Playfair Display", body: "Inter" },
    buttonStyle: "pill"
  },
  {
    id: "minimal",
    name: "Minimalista",
    description: "Elegante con mucho espacio en blanco",
    heroLayout: "minimal",
    servicesLayout: "list",
    galleryLayout: "masonry",
    reviewsLayout: "single",
    defaultColors: { primary: "#18181B", secondary: "#71717A" },
    recommendedFonts: { heading: "Cormorant Garamond", body: "Raleway" },
    buttonStyle: "sharp"
  },
  {
    id: "split",
    name: "Dividido",
    description: "Imagen y contenido lado a lado",
    heroLayout: "split",
    servicesLayout: "horizontal-scroll",
    galleryLayout: "carousel",
    reviewsLayout: "grid",
    defaultColors: { primary: "#0EA5E9", secondary: "#06B6D4" },
    recommendedFonts: { heading: "Poppins", body: "Inter" },
    buttonStyle: "rounded"
  },
  {
    id: "bold",
    name: "Impactante",
    description: "Colores vibrantes y formas audaces",
    heroLayout: "bold",
    servicesLayout: "accordion",
    galleryLayout: "vertical-slider",
    reviewsLayout: "quotes",
    defaultColors: { primary: "#F97316", secondary: "#EAB308" },
    recommendedFonts: { heading: "Montserrat", body: "Open Sans" },
    buttonStyle: "square"
  },
  {
    id: "glass",
    name: "Cristal",
    description: "Efecto glassmorphism moderno y elegante",
    heroLayout: "glass",
    servicesLayout: "cards",
    galleryLayout: "grid",
    reviewsLayout: "carousel",
    defaultColors: { primary: "#A855F7", secondary: "#EC4899" },
    recommendedFonts: { heading: "Outfit", body: "Inter" },
    buttonStyle: "rounded"
  }
];

export const getThemeById = (id: string): LandingTheme => {
  return landingThemes.find(t => t.id === id) || landingThemes[0];
};
