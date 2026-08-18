/**
 * Paleta única para todas las gráficas del panel.
 * Deriva de la identidad Glowapp (azul + púrpura) con acentos suaves,
 * para que ninguna sección invente colores propios.
 */
export const GP_CHART_COLORS = [
  "#22408b", // azul marca
  "#99329a", // púrpura marca
  "#4A7FD1", // azul claro
  "#16A249", // verde éxito
  "#E0A63C", // ámbar aviso
  "#8A8FA3", // gris neutro
] as const;

export const GP_CHART = {
  primary: "#22408b",
  purple: "#99329a",
  info: "#4A7FD1",
  ok: "#16A249",
  warn: "#E0A63C",
  danger: "#DC5A52",
  muted: "#8A8FA3",
  grid: "#E7E8EE",
} as const;
