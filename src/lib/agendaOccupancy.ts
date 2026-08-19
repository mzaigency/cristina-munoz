/**
 * Minutos realmente ocupados de una jornada.
 *
 * No vale sumar duraciones: el salón dobla citas a la misma hora (dos clientas
 * a la vez mientras una tiene el tinte actuando), y sumando se contaban los
 * mismos minutos dos veces. Con suficientes solapes el total superaba la
 * jornada y el porcentaje se quedaba clavado en 100 %.
 *
 * Lo correcto es la unión de los intervalos: el tiempo en que hay al menos una
 * cita, contado una sola vez.
 */
export interface Interval {
  start: number;
  end: number;
}

export const busyMinutes = (intervals: Interval[]): number => {
  const sorted = intervals.filter((i) => i.end > i.start).sort((a, b) => a.start - b.start);
  let total = 0;
  let curStart = Number.NaN;
  let curEnd = Number.NaN;

  for (const it of sorted) {
    if (Number.isNaN(curEnd) || it.start > curEnd) {
      if (!Number.isNaN(curEnd)) total += curEnd - curStart;
      curStart = it.start;
      curEnd = it.end;
    } else if (it.end > curEnd) {
      curEnd = it.end;
    }
  }
  if (!Number.isNaN(curEnd)) total += curEnd - curStart;
  return total;
};

/** "09:30" -> 570 */
export const toMinutesOfDay = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
