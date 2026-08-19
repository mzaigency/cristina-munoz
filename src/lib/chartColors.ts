/**
 * Paleta de datos del panel — fuente única para gráficas y leyendas.
 *
 * Antes había dos arrays `COLORS` distintos (BusinessStats y AdvancedCashStats),
 * ambos empezando por un violeta `#8B5CF6` que no es el morado de Glowapp. Esta
 * paleta ancla en los colores de marca y se abre a tonos vecinos, de modo que
 * una gráfica del panel se reconoce como Glowapp.
 *
 * El orden importa: las series más relevantes caen primero.
 * Los valores acompañan a los tokens de src/styles/glow.css; si cambia la marca,
 * cambian los dos primeros aquí.
 */
export const CHART_COLORS: readonly string[] = [
  "#22408C", // azul de marca
  "#98329A", // púrpura de marca
  "#16A249", // verde (éxito)
  "#F59E0B", // ámbar (aviso)
  "#2E8FA8", // teal, vecino del azul
  "#C4487E", // rosa, vecino del púrpura
];

/** Color de la serie i, ciclando la paleta. Nunca devuelve undefined. */
export const chartColor = (i: number): string =>
  CHART_COLORS[((i % CHART_COLORS.length) + CHART_COLORS.length) % CHART_COLORS.length];

/**
 * Color de un profesional que aún no tiene el suyo asignado.
 * Antes cada pantalla improvisaba uno (#8B5CF6, #6366f1…), ninguno de marca.
 */
export const STYLIST_FALLBACK = CHART_COLORS[0];

/**
 * Tinta legible sobre un fondo cualquiera.
 *
 * Los colores de profesional y de cliente los elige quien usa el panel, así que
 * no se puede dar por hecho que el blanco contraste: el verde de marca sobre
 * blanco se queda en 3.3:1. Esto devuelve blanco o la tinta oscura del sistema,
 * lo que contraste más.
 */
export const readableInk = (background: string): string => {
  const hex = background.trim().replace("#", "");
  if (hex.length !== 3 && hex.length !== 6) return "#FFFFFF";
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  if ([r, g, b].some(Number.isNaN)) return "#FFFFFF";
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  // contraste contra blanco y contra la tinta principal (#131520)
  const vsWhite = 1.05 / (L + 0.05);
  const vsInk = (L + 0.05) / 0.0533;
  return vsWhite >= vsInk ? "#FFFFFF" : "#131520";
};
