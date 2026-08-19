import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TenantBusinessHours {
  morningStart: number;
  morningEnd: number;
  afternoonStart: number;
  afternoonEnd: number;
  isClosed: boolean;
}

interface TenantBusinessHoursRecord {
  day_of_week: number;
  is_open: boolean | null;
  open_time: string | null;
  close_time: string | null;
  break_start: string | null;
  break_end: string | null;
}

interface TenantHoursOverrideRecord {
  date_from: string;
  date_to: string;
  is_closed: boolean | null;
  open_time: string | null;
  close_time: string | null;
  break_start: string | null;
  break_end: string | null;
}

const SLOT_INTERVAL = 30;

function timeToMinutes(time: string | null): number {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

function buildHoursFromRange(
  isOpen: boolean,
  openTime: string | null,
  closeTime: string | null,
  breakStart: string | null,
  breakEnd: string | null,
): TenantBusinessHours {
  if (!isOpen) {
    return {
      morningStart: 0,
      morningEnd: 0,
      afternoonStart: 0,
      afternoonEnd: 0,
      isClosed: true,
    };
  }

  const open = timeToMinutes(openTime);
  const close = timeToMinutes(closeTime);
  const bStart = breakStart ? timeToMinutes(breakStart) : null;
  const bEnd = breakEnd ? timeToMinutes(breakEnd) : null;

  if (bStart !== null && bEnd !== null && bStart > 0 && bEnd > 0) {
    return {
      morningStart: open,
      morningEnd: bStart,
      afternoonStart: bEnd,
      afternoonEnd: close,
      isClosed: false,
    };
  }

  // No break - treat as continuous morning hours
  return {
    morningStart: open,
    morningEnd: close,
    afternoonStart: 0,
    afternoonEnd: 0,
    isClosed: false,
  };
}

function parseBusinessHours(record: TenantBusinessHoursRecord): TenantBusinessHours {
  return buildHoursFromRange(
    !!record.is_open,
    record.open_time,
    record.close_time,
    record.break_start,
    record.break_end,
  );
}

function parseOverride(record: TenantHoursOverrideRecord): TenantBusinessHours {
  return buildHoursFromRange(
    !record.is_closed,
    record.open_time,
    record.close_time,
    record.break_start,
    record.break_end,
  );
}

function formatDateToISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Default business hours for when no tenant hours are configured
const DEFAULT_HOURS: Record<number, TenantBusinessHours> = {
  0: { morningStart: 0, morningEnd: 0, afternoonStart: 0, afternoonEnd: 0, isClosed: true },
  1: { morningStart: 0, morningEnd: 0, afternoonStart: 0, afternoonEnd: 0, isClosed: true },
  2: { morningStart: 9 * 60, morningEnd: 13 * 60, afternoonStart: 15 * 60, afternoonEnd: 19 * 60, isClosed: false },
  3: { morningStart: 9 * 60, morningEnd: 13 * 60, afternoonStart: 15 * 60, afternoonEnd: 19 * 60, isClosed: false },
  4: { morningStart: 9 * 60, morningEnd: 13 * 60, afternoonStart: 15 * 60, afternoonEnd: 19 * 60, isClosed: false },
  5: { morningStart: 9 * 60, morningEnd: 13 * 60, afternoonStart: 15 * 60, afternoonEnd: 19 * 60, isClosed: false },
  6: { morningStart: 9 * 60, morningEnd: 14 * 60, afternoonStart: 0, afternoonEnd: 0, isClosed: false },
};

export function useTenantBusinessHours(tenantId: string) {
  const [businessHours, setBusinessHours] = useState<Record<number, TenantBusinessHours> | null>(null);
  const [overrides, setOverrides] = useState<Array<TenantHoursOverrideRecord>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinessHours = async () => {
      if (!tenantId) {
        setLoading(false);
        return;
      }

      try {
        const today = formatDateToISO(new Date());
        const [hoursRes, overridesRes] = await Promise.all([
          supabase
            .from("tenant_business_hours")
            .select("day_of_week, is_open, open_time, close_time, break_start, break_end")
            .eq("tenant_id", tenantId),
          supabase
            .from("tenant_hours_overrides")
            .select("date_from, date_to, is_closed, open_time, close_time, break_start, break_end")
            .eq("tenant_id", tenantId)
            .gte("date_to", today),
        ]);

        if (hoursRes.error) {
          console.error("Error fetching business hours:", hoursRes.error);
          setBusinessHours(DEFAULT_HOURS);
        } else if (hoursRes.data && hoursRes.data.length > 0) {
          const hoursMap: Record<number, TenantBusinessHours> = { ...DEFAULT_HOURS };
          hoursRes.data.forEach((record) => {
            hoursMap[record.day_of_week] = parseBusinessHours(record as TenantBusinessHoursRecord);
          });
          setBusinessHours(hoursMap);
        } else {
          setBusinessHours(DEFAULT_HOURS);
        }

        if (!overridesRes.error && overridesRes.data) {
          setOverrides(overridesRes.data as TenantHoursOverrideRecord[]);
        }
      } catch (error) {
        console.error("Error fetching business hours:", error);
        setBusinessHours(DEFAULT_HOURS);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessHours();
  }, [tenantId]);

  const effectiveHours = businessHours || DEFAULT_HOURS;

  /**
   * Excepción que aplica a una fecha.
   *
   * Gana la MÁS ESPECÍFICA, no la primera de la lista: un festivo de un solo
   * día tiene que poder tapar a una jornada intensiva de un mes entero. Antes
   * se cogía la primera que devolviera la consulta, así que cuál ganaba
   * dependía del orden de las filas.
   */
  const getOverrideRowForDate = (date: Date) => {
    const iso = formatDateToISO(date);
    const dow = date.getDay();
    const matches = overrides.filter((o) => {
      if (o.date_from > iso || o.date_to < iso) return false;
      // days_of_week vacío o ausente = todos los días del rango (como antes)
      const dias = (o as { days_of_week?: number[] | null }).days_of_week;
      return !dias || dias.length === 0 || dias.includes(dow);
    });
    if (matches.length === 0) return null;
    const span = (o: (typeof matches)[number]) =>
      Date.parse(o.date_to) - Date.parse(o.date_from);
    return [...matches].sort((a, b) => span(a) - span(b))[0];
  };

  const getOverrideForDate = (date: Date): TenantBusinessHours | null => {
    const row = getOverrideRowForDate(date);
    return row ? parseOverride(row) : null;
  };

  /**
   * Horario de un día concreto.
   *
   * Una excepción de RANGO (una jornada intensiva de verano, por ejemplo)
   * cambia las horas de los días que el salón ya abre; no convierte en
   * laborable un día que está cerrado en el horario semanal. Antes sustituía
   * al horario entero, así que la intensiva de agosto abría también los lunes
   * y los domingos que el salón tiene cerrados, y se podía reservar en ellos.
   *
   * Una excepción de UN SOLO DÍA sí manda del todo: es una decisión
   * deliberada sobre esa fecha, tanto para cerrar como para abrir.
   */
  const getBusinessHoursForDay = (dayOfWeek: number, date?: Date): TenantBusinessHours => {
    const base = effectiveHours[dayOfWeek] || DEFAULT_HOURS[dayOfWeek];
    if (!date) return base;

    const row = getOverrideRowForDate(date);
    if (!row) return base;

    const override = parseOverride(row);
    const unSoloDia = row.date_from === row.date_to;
    if (unSoloDia || override.isClosed) return override;
    if (base.isClosed) return base;
    return override;
  };

  const generateBaseSlots = (dayOfWeek: number, date?: Date): Set<number> => {
    const hours = getBusinessHoursForDay(dayOfWeek, date);
    const slotsSet = new Set<number>();

    if (hours.isClosed) return slotsSet;

    if (hours.morningEnd > 0) {
      for (let minutes = hours.morningStart; minutes < hours.morningEnd; minutes += SLOT_INTERVAL) {
        slotsSet.add(minutes);
      }
    }

    if (hours.afternoonEnd > 0) {
      for (let minutes = hours.afternoonStart; minutes < hours.afternoonEnd; minutes += SLOT_INTERVAL) {
        slotsSet.add(minutes);
      }
    }

    return slotsSet;
  };

  const getClosedDays = (): number[] => {
    return Object.entries(effectiveHours)
      .filter(([_, hours]) => hours.isClosed)
      .map(([day]) => parseInt(day));
  };

  return {
    businessHours: effectiveHours,
    loading,
    generateBaseSlots,
    getBusinessHoursForDay,
    getClosedDays,
    getOverrideForDate,
  };
}
