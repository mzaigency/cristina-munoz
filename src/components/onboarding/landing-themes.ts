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
    description: "Cinematográfico a sangre con degradados profundos y atmósfera envolvente",
    heroLayout: "fullscreen",
    servicesLayout: "cards",
    galleryLayout: "grid",
    reviewsLayout: "carousel",
    defaultColors: { primary: "#22408C", secondary: "#98329A" },
    recommendedFonts: { heading: "Playfair Display", body: "Plus Jakarta Sans" },
    buttonStyle: "pill"
  },
  {
    id: "minimal",
    name: "Minimalista",
    description: "Lujo sereno y simétrico estilo boutique parisina con viñeteado sutil",
    heroLayout: "minimal",
    servicesLayout: "list",
    galleryLayout: "masonry",
    reviewsLayout: "single",
    defaultColors: { primary: "#18181B", secondary: "#71717A" },
    recommendedFonts: { heading: "Cormorant Garamond", body: "Urbanist" },
    buttonStyle: "rounded"
  },
  {
    id: "split",
    name: "Dividido",
    description: "Studio editorial con composición asimétrica y marco de fotografía",
    heroLayout: "split",
    servicesLayout: "horizontal-scroll",
    galleryLayout: "carousel",
    reviewsLayout: "grid",
    defaultColors: { primary: "#0EA5E9", secondary: "#06B6D4" },
    recommendedFonts: { heading: "Cinzel", body: "Plus Jakarta Sans" },
    buttonStyle: "rounded"
  },
  {
    id: "glass",
    name: "Cristal Flotante",
    description: "Efecto Liquid Glass translúcido con desenfoque de fondo y micro-brillos",
    heroLayout: "glass",
    servicesLayout: "cards",
    galleryLayout: "grid",
    reviewsLayout: "carousel",
    defaultColors: { primary: "#A855F7", secondary: "#EC4899" },
    recommendedFonts: { heading: "Bodoni Moda", body: "Montserrat" },
    buttonStyle: "pill"
  },
  {
    id: "bold",
    name: "Impacto Creativo",
    description: "Presencia tipográfica contundente, badges de color y estética atelier",
    heroLayout: "bold",
    servicesLayout: "accordion",
    galleryLayout: "vertical-slider",
    reviewsLayout: "quotes",
    defaultColors: { primary: "#E11D48", secondary: "#F43F5E" },
    recommendedFonts: { heading: "Syne", body: "DM Sans" },
    buttonStyle: "rounded"
  }
];

export const getThemeById = (id: string): LandingTheme => {
  return landingThemes.find(t => t.id === id) || landingThemes[0];
};
