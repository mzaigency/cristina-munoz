import type { PlanFeature } from "@/hooks/usePlanLimits";

export interface TourStep {
  id: string;
  /**
   * CSS selector resolved at runtime to anchor the spotlight.
   * Omit for "center" overlay steps (welcome / done).
   */
  target?: string;
  /** Where to navigate before showing this step. */
  goto?: { section: string; subTab?: string };
  /** Required plan feature; if missing → step shown with locked badge. */
  requiredFeature?: PlanFeature;
  /** Minimum plan slug name for the lock badge. */
  requiredPlan?: "pro" | "business";
  emoji: string;
  title: string;
  body: string;
  /** Quick tips chips. */
  tips?: string[];
  /** "Pequeña victoria" message shown when entering this step. */
  cheer?: string;
  /** Trigger small confetti burst (3-5 particles) when entering. */
  celebrate?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    emoji: "👋",
    title: "Bienvenida a tu panel",
    body: "Recorrido rápido de 90 segundos. Te muestro lo esencial y dónde está cada cosa.",
    tips: ["10 pasos", "Puedes saltar cuando quieras"],
    cheer: "¡Vamos!",
  },
  {
    id: "sidebar",
    target: '[data-tour-target="sidebar-nav"], [data-tour-target="mobile-bottom-nav"]',
    emoji: "🧭",
    title: "Tu menú de navegación",
    body: "8 secciones principales. Desde aquí entras a todo: agenda, clientes, catálogo y más.",
    tips: ["Despliega sub-secciones"],
  },
  {
    id: "inicio",
    goto: { section: "inicio", subTab: "resumen" },
    target: '[data-tour-target="inicio-stats"]',
    emoji: "📊",
    title: "Resumen del día",
    body: "Métricas clave, próximas citas y un checklist para configurar tu salón paso a paso.",
    tips: ["KPIs en vivo", "Checklist inicial"],
    cheer: "¡Buen comienzo!",
  },
  {
    id: "agenda",
    goto: { section: "agenda", subTab: "dia" },
    target: '[data-tour-target="agenda-calendar"]',
    emoji: "📅",
    title: "Tu agenda",
    body: "Toca un hueco vacío para crear una cita. Arrastra para mover. Color por estilista.",
    tips: ["Drag & drop", "Crea citas en 3 toques"],
    celebrate: true,
    cheer: "¡Genial, 3 de 10!",
  },
  {
    id: "caja",
    goto: { section: "caja", subTab: "cobros" },
    target: '[data-tour-target="caja-cobros"]',
    requiredFeature: "cash_register",
    requiredPlan: "pro",
    emoji: "💰",
    title: "Caja y cobros",
    body: "Cobra al finalizar la cita: efectivo, tarjeta o mixto. Cierra el día con un toque.",
    tips: ["Cierre diario", "Exporta a Excel"],
  },
  {
    id: "clientes",
    goto: { section: "clientes", subTab: "directorio" },
    target: '[data-tour-target="clientes-directorio"]',
    emoji: "👥",
    title: "Tus clientes",
    body: "CRM completo: historial, notas privadas, etiquetas VIP y métricas financieras por cliente.",
    tips: ["VIP automático", "Notas privadas"],
    cheer: "¡Mitad del camino! 🔥",
    celebrate: true,
  },
  {
    id: "catalogo",
    goto: { section: "catalogo", subTab: "services" },
    target: '[data-tour-target="catalogo-services"]',
    emoji: "✂️",
    title: "Catálogo de servicios",
    body: "Define precio, duración y categoría. Aparecen automáticamente al reservar online.",
    tips: ["Visible en tu web", "Categorías"],
  },
  {
    id: "marketing",
    goto: { section: "marketing", subTab: "qr" },
    target: '[data-tour-target="marketing-qr"]',
    emoji: "🔳",
    title: "Tarjetas QR imprimibles",
    body: "Genera tarjetas y carteles A4 con tu QR de reserva. Compártelos en redes o imprime.",
    tips: ["Cartel A4", "Tarjeta social"],
    cheer: "¡Casi lo tienes!",
  },
  {
    id: "negocio",
    goto: { section: "negocio", subTab: "equipo" },
    target: '[data-tour-target="negocio-equipo"]',
    emoji: "💼",
    title: "Equipo y horarios",
    body: "Gestiona estilistas, horarios, comisiones y objetivos. Todo el back-office del salón.",
    tips: ["Color por estilista", "Comisiones auto"],
    celebrate: true,
  },
  {
    id: "done",
    emoji: "🎉",
    title: "¡Listo, ya conoces tu panel!",
    body: "Pulsa el ? arriba para repetir este tour o abrir el centro de ayuda cuando lo necesites.",
    tips: ["Centro de ayuda siempre disponible"],
    cheer: "¡Eres increíble!",
    celebrate: true,
  },
];

export const TOUR_STORAGE_KEY = "glowapp_admin_tour_v6_completed";
