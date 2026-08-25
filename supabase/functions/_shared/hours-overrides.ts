/**
 * Resolución de excepciones de horario (tenant y profesional).
 *
 * Mismas reglas que el frontend (`src/hooks/useTenantBusinessHours.ts`), para
 * que lo que ve la clienta y lo que valida el servidor no puedan discrepar:
 *
 * 1. De todas las excepciones que cubren la fecha gana la MÁS ESPECÍFICA
 *    (rango más corto). Un festivo de un día tapa a la jornada intensiva de
 *    todo agosto. A igualdad de rango gana el cierre.
 * 2. `days_of_week` limita la excepción a esos días de la semana
 *    (0 = domingo … 6 = sábado). NULL o vacío = todos los días del rango.
 * 3. Una excepción de UN SOLO DÍA o un CIERRE manda del todo.
 *    Una excepción de RANGO (jornada intensiva) solo cambia las horas de los
 *    días que ya están abiertos en el horario semanal: no convierte en
 *    laborable un día cerrado.
 */

export type HoursOverrideRow = {
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
  break_start: string | null;
  break_end: string | null;
  date_from: string;
  date_to: string;
  days_of_week?: number[] | null;
  label?: string | null;
};

export function dayOfWeekForDate(dateISO: string): number {
  return new Date(dateISO + "T12:00:00Z").getUTCDay();
}

export function isSingleDayOverride(row: HoursOverrideRow): boolean {
  return row.date_from === row.date_to;
}

/** Excepción aplicable a la fecha, la más específica de todas. */
export function pickOverrideForDate<T extends HoursOverrideRow>(
  rows: T[] | null | undefined,
  dateISO: string,
): T | null {
  if (!rows || rows.length === 0) return null;
  const dow = dayOfWeekForDate(dateISO);

  const matches = rows.filter((row) => {
    if (row.date_from > dateISO || row.date_to < dateISO) return false;
    const days = row.days_of_week;
    return !days || days.length === 0 || days.includes(dow);
  });
  if (matches.length === 0) return null;

  const span = (row: T) => Date.parse(row.date_to) - Date.parse(row.date_from);
  return [...matches].sort((a, b) => {
    const diff = span(a) - span(b);
    if (diff !== 0) return diff;
    // A igualdad de especificidad, el cierre gana: nunca abrir por sorteo.
    return Number(b.is_closed) - Number(a.is_closed);
  })[0];
}

/**
 * ¿La excepción sustituye por completo al horario semanal?
 * Sí para cierres y para excepciones de un solo día.
 */
export function overrideReplacesWeekly(row: HoursOverrideRow): boolean {
  return row.is_closed || isSingleDayOverride(row);
}
