/**
 * Paleta única para todas las gráficas del panel.
 * Deriva de la identidad Glowapp (azul + púrpura) con acentos suaves,
 * para que ninguna sección invente colores propios.
 */
export const GP_CHART_COLORS: string[] = [
  "#22408b", // azul marca
  "#99329a", // púrpura marca
  "#4A7FD1", // azul claro
  "#16A249", // verde éxito
  "#E0A63C", // ámbar aviso
  "#8A8FA3", // gris neutro
];

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

/**
 * Colores asignables a profesionales en la agenda.
 * Derivados de la marca (azul → púrpura) más acentos suaves,
 * para que la agenda no mezcle azules genéricos de Tailwind.
 */
export const GP_STYLIST_COLORS: string[] = [
  "#22408b", // azul marca
  "#99329a", // púrpura marca
  "#4A7FD1", // azul claro
  "#7A5AC7", // violeta puente
  "#16A249", // verde
  "#E0A63C", // ámbar
  "#C9764D", // terracota
  "#5B6B8C", // azul grisáceo
];
