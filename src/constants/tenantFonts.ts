/**
 * Catálogo canónico de tipografías para la web pública del salón (Tenant Landing).
 * Compartido entre el panel de edición visual (TenantEditPanel), el inyector de estilos (TenantThemeProvider)
 * y el flujo de onboarding (TypographyStep, DesignStep).
 */

export interface TenantFontOption {
  value: string;
  label: string;
  category: "Elegante" | "Editorial" | "Moderno" | "Lujo" | "Limpio" | "Neutro";
  style: "serif" | "sans-serif";
  sample: string;
  description: string;
}

/**
 * Fuentes para Títulos (Headings)
 * Curadas específicamente para salones de belleza, peluquerías, estética y spas.
 */
export const HEADING_FONT_OPTIONS: TenantFontOption[] = [
  {
    value: "Playfair Display",
    label: "Playfair Display",
    category: "Editorial",
    style: "serif",
    sample: "Aa",
    description: "Clásica, editorial y sofisticada",
  },
  {
    value: "Cormorant Garamond",
    label: "Cormorant",
    category: "Lujo",
    style: "serif",
    sample: "Aa",
    description: "Haute couture, esbelta y parisina",
  },
  {
    value: "Cinzel",
    label: "Cinzel",
    category: "Lujo",
    style: "serif",
    sample: "Aa",
    description: "Atelier romano y alta gama",
  },
  {
    value: "Bodoni Moda",
    label: "Bodoni Moda",
    category: "Editorial",
    style: "serif",
    sample: "Aa",
    description: "Alto contraste estilo revista Vogue",
  },
  {
    value: "Syne",
    label: "Syne",
    category: "Moderno",
    style: "sans-serif",
    sample: "Aa",
    description: "Vanguardista y creativa",
  },
  {
    value: "DM Serif Display",
    label: "DM Serif",
    category: "Elegante",
    style: "serif",
    sample: "Aa",
    description: "Cálida, orgánica y cercana",
  },
  {
    value: "Plus Jakarta Sans",
    label: "Plus Jakarta",
    category: "Limpio",
    style: "sans-serif",
    sample: "Aa",
    description: "Moderna, equilibrada y suave",
  },
  {
    value: "Outfit",
    label: "Outfit",
    category: "Moderno",
    style: "sans-serif",
    sample: "Aa",
    description: "Geométrica y minimalismo premium",
  },
];

/**
 * Fuentes para Cuerpo de Texto (Body)
 * Alta legibilidad en pantallas móviles, cartas de servicios y descripciones.
 */
export const BODY_FONT_OPTIONS: TenantFontOption[] = [
  {
    value: "Plus Jakarta Sans",
    label: "Plus Jakarta Sans",
    category: "Limpio",
    style: "sans-serif",
    sample: "Aa",
    description: "Recomendada Glowapp — legibilidad impecable",
  },
  {
    value: "Poppins",
    label: "Poppins",
    category: "Moderno",
    style: "sans-serif",
    sample: "Aa",
    description: "Geométrica con curvas amigables",
  },
  {
    value: "Inter",
    label: "Inter",
    category: "Neutro",
    style: "sans-serif",
    sample: "Aa",
    description: "Precisión suiza y máxima nitidez",
  },
  {
    value: "Montserrat",
    label: "Montserrat",
    category: "Moderno",
    style: "sans-serif",
    sample: "Aa",
    description: "Estructurada, contemporánea y sólida",
  },
  {
    value: "DM Sans",
    label: "DM Sans",
    category: "Limpio",
    style: "sans-serif",
    sample: "Aa",
    description: "Relajada, fresca y muy legible",
  },
  {
    value: "Urbanist",
    label: "Urbanist",
    category: "Lujo",
    style: "sans-serif",
    sample: "Aa",
    description: "Lujo silencioso con proporciones modernas",
  },
];

/**
 * Mapeo para retrocompatibilidad con onboarding types
 */
export const fontOptions = HEADING_FONT_OPTIONS.map((f) => ({
  value: f.value,
  label: f.label,
  category: f.category,
}));

export const bodyFontOptions = BODY_FONT_OPTIONS.map((f) => ({
  value: f.value,
  label: f.label,
  category: f.category,
}));

/**
 * Especificaciones de pesos para Google Fonts
 */
export const GOOGLE_FONT_SPECS: Record<string, string> = {
  "Playfair Display": "ital,wght@0,400..800;1,400..700",
  "Cormorant Garamond": "ital,wght@0,400..700;1,400..700",
  "Cinzel": "wght@400..900",
  "Bodoni Moda": "ital,opsz,wght@0,6..96,400..900;1,6..96,400..900",
  "Syne": "wght@500..800",
  "DM Serif Display": "ital,wght@0,400;1,400",
  "Plus Jakarta Sans": "ital,wght@0,400..800;1,400..800",
  "Outfit": "wght@400..800",
  "Poppins": "ital,wght@0,400;0,500;0,600;0,700;1,400",
  "Inter": "wght@400;500;600;700",
  "Montserrat": "ital,wght@0,400;0,500;0,600;0,700;1,400",
  "DM Sans": "ital,opsz,wght@0,9..40,400..700;1,9..40,400..700",
  "Urbanist": "ital,wght@0,400..700;1,400..700",
};

export const DEFAULT_HEADING_FONT = "Playfair Display";
export const DEFAULT_BODY_FONT = "Plus Jakarta Sans";
