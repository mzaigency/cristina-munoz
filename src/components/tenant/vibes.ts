/**
 * Vibes: dirección de arte por tipo de negocio para las webs públicas de tenant.
 *
 * Un vibe define el par tipográfico y la mecánica visual (clase CSS `tv-*`
 * con tokens propios en index.css). El color sigue siendo del salón
 * (primary/secondary del tenant); el vibe decide CÓMO se usa ese color.
 *
 * Si el tenant ha elegido fuentes propias en su panel, esas ganan siempre
 * (identidad del negocio > plantilla).
 */

export type TenantVibe = "atelier" | "calm" | "pop";

export interface VibeDef {
  id: TenantVibe;
  fontHeading: string;
  fontBody: string;
  /** Pesos extra a cargar de Google Fonts para el heading */
  headingWeights: string;
}

export const VIBES: Record<TenantVibe, VibeDef> = {
  // Peluquería, barbería, salones: atelier editorial cálido, display con carácter
  atelier: {
    id: "atelier",
    fontHeading: "Bodoni Moda",
    fontBody: "Hanken Grotesk",
    headingWeights: "400;500;600;700",
  },
  // Fisio, masaje, salud, spa: clínico-sereno, sans amable, aire
  calm: {
    id: "calm",
    fontHeading: "Marcellus",
    fontBody: "Karla",
    headingWeights: "400",
  },
  // Uñas, pestañas, makeup: pop moderno, display rotundo, color valiente
  pop: {
    id: "pop",
    fontHeading: "Unbounded",
    fontBody: "Schibsted Grotesk",
    headingWeights: "400;500;600;700",
  },
};

const VIBE_BY_TYPE: Record<string, TenantVibe> = {
  peluqueria: "atelier",
  barberia: "atelier",
  salon_belleza: "atelier",
  estetica: "atelier",
  fisioterapia: "calm",
  masaje: "calm",
  osteopatia: "calm",
  salud: "calm",
  spa: "calm",
  wellness: "calm",
  yoga: "calm",
  unas: "pop",
  nails: "pop",
  pestanas: "pop",
  lashes: "pop",
  maquillaje: "pop",
  tattoo: "pop",
};

export function vibeForBusinessType(businessType?: string | null): TenantVibe {
  if (!businessType) return "atelier";
  return VIBE_BY_TYPE[businessType.toLowerCase()] || "atelier";
}
