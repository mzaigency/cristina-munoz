/**
 * 🎯 CATÁLOGO CANÓNICO DE TIPOS DE NEGOCIO
 * ----------------------------------------
 * ÚNICA fuente de verdad para todos los tipos de negocio del producto.
 * Cualquier componente (onboarding, feed, directorio SEO, B2B lead form,
 * landing tenant, sitemap…) DEBE importar desde aquí. NO duplicar listas.
 *
 * Decisión de catálogo (mayo 2026): 7 tipos esenciales para SEO en España.
 * Sin "otro" (no aporta a búsqueda). Etiquetas cortas y consistentes.
 */
import {
  Scissors,
  Sparkles,
  Droplets,
  Hand,
  Brush,
  HeartPulse,
  Gem,
  type LucideIcon,
} from "lucide-react";

export type BusinessTypeId =
  | "peluqueria"
  | "barberia"
  | "estetica"
  | "spa"
  | "unas"
  | "salon_belleza"
  | "fisioterapia";

export interface BusinessType {
  /** Identificador interno (DB `features.business_type`). */
  id: BusinessTypeId;
  /** Etiqueta corta canónica (UI). */
  label: string;
  /** Plural completo para títulos / breadcrumbs / SEO. */
  labelPlural: string;
  /** Slug usado en URLs públicas: /{urlSlug} y /{urlSlug}/:city */
  urlSlug: string;
  /** Emoji corto (onboarding cards). */
  emoji: string;
  /** Icono lucide para pills/categorías. */
  icon: LucideIcon;
  /** Descripción corta para tarjetas de selección. */
  description: string;
  /** Keywords SEO long-tail por tipo. */
  seoKeywords: string;
  /** Frase descriptiva para meta description del tenant. */
  tenantTagline: string;
  /** Estilos visuales para BusinessTypeStep. */
  color: string;
  borderActive: string;
}

export const BUSINESS_TYPES: BusinessType[] = [
  {
    id: "peluqueria",
    label: "Peluquería",
    labelPlural: "Peluquerías",
    urlSlug: "peluquerias",
    emoji: "✂️",
    icon: Scissors,
    description: "Cortes, peinados y color",
    seoKeywords:
      "corte de pelo, coloración, mechas, balayage, peinados, tratamientos capilares",
    tenantTagline:
      "Especialistas en corte, coloración y cuidado del cabello.",
    color: "from-violet-500/20 to-purple-500/20",
    borderActive: "border-violet-500",
  },
  {
    id: "barberia",
    label: "Barbería",
    labelPlural: "Barberías",
    urlSlug: "barberias",
    emoji: "💈",
    icon: Scissors,
    description: "Cortes, afeitado y barba",
    seoKeywords:
      "corte de pelo hombre, afeitado clásico, arreglo de barba, degradado, fade",
    tenantTagline:
      "Especialistas en cortes masculinos, afeitado clásico y cuidado de barba.",
    color: "from-amber-500/20 to-orange-500/20",
    borderActive: "border-amber-500",
  },
  {
    id: "estetica",
    label: "Estética",
    labelPlural: "Centros de Estética",
    urlSlug: "estetica",
    emoji: "🧖‍♀️",
    icon: Brush,
    description: "Faciales y tratamientos corporales",
    seoKeywords:
      "tratamientos faciales, limpieza facial, rejuvenecimiento, tratamientos corporales, radiofrecuencia",
    tenantTagline:
      "Expertos en tratamientos faciales, corporales y rejuvenecimiento.",
    color: "from-teal-500/20 to-cyan-500/20",
    borderActive: "border-teal-500",
  },
  {
    id: "spa",
    label: "Spa",
    labelPlural: "Spas",
    urlSlug: "spa",
    emoji: "🧘",
    icon: Droplets,
    description: "Masajes y bienestar",
    seoKeywords:
      "masajes relajantes, tratamientos wellness, aromaterapia, circuito spa, relajación",
    tenantTagline:
      "Centro de bienestar con masajes, tratamientos relajantes y circuito spa.",
    color: "from-green-500/20 to-emerald-500/20",
    borderActive: "border-green-500",
  },
  {
    id: "unas",
    label: "Uñas",
    labelPlural: "Centros de Uñas",
    urlSlug: "unas",
    emoji: "💅",
    icon: Hand,
    description: "Manicura, pedicura y nail art",
    seoKeywords:
      "manicura, pedicura, uñas acrílicas, uñas de gel, nail art, esmaltado permanente",
    tenantTagline:
      "Especialistas en manicura, pedicura, uñas de gel y nail art.",
    color: "from-fuchsia-500/20 to-purple-500/20",
    borderActive: "border-fuchsia-500",
  },
  {
    id: "salon_belleza",
    label: "Salón de Belleza",
    labelPlural: "Salones de Belleza",
    urlSlug: "salones-belleza",
    emoji: "💎",
    icon: Gem,
    description: "Servicios integrales de belleza",
    seoKeywords:
      "maquillaje, tratamientos faciales, depilación, manicura, pedicura, belleza integral",
    tenantTagline:
      "Servicios integrales de belleza: maquillaje, tratamientos y más.",
    color: "from-pink-500/20 to-rose-500/20",
    borderActive: "border-pink-500",
  },
  {
    id: "fisioterapia",
    label: "Fisioterapia",
    labelPlural: "Centros de Fisioterapia",
    urlSlug: "fisioterapia",
    emoji: "🌿",
    icon: HeartPulse,
    description: "Rehabilitación y bienestar físico",
    seoKeywords:
      "fisioterapia, rehabilitación, masaje terapéutico, punción seca, recuperación deportiva, dolor de espalda",
    tenantTagline:
      "Fisioterapeutas titulados especializados en rehabilitación y recuperación.",
    color: "from-indigo-500/20 to-violet-500/20",
    borderActive: "border-indigo-500",
  },
];

/** Map por id para lookups O(1). */
export const BUSINESS_TYPES_BY_ID: Record<BusinessTypeId, BusinessType> =
  BUSINESS_TYPES.reduce(
    (acc, t) => {
      acc[t.id] = t;
      return acc;
    },
    {} as Record<BusinessTypeId, BusinessType>,
  );

/** Map por urlSlug para resolver rutas /{slug} y sitemap. */
export const BUSINESS_TYPES_BY_URL_SLUG: Record<string, BusinessType> =
  BUSINESS_TYPES.reduce(
    (acc, t) => {
      acc[t.urlSlug] = t;
      return acc;
    },
    {} as Record<string, BusinessType>,
  );

/** Helper: obtener tipo por id, tolerante a valores desconocidos. */
export const getBusinessType = (
  id: string | null | undefined,
): BusinessType | null => {
  if (!id) return null;
  return BUSINESS_TYPES_BY_ID[id as BusinessTypeId] ?? null;
};

/** Etiqueta corta para `features.business_type` (compat). */
export const businessTypeLabels: Record<string, string> = BUSINESS_TYPES.reduce(
  (acc, t) => {
    acc[t.id] = t.label;
    return acc;
  },
  {} as Record<string, string>,
);
