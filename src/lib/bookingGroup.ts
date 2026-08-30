import { supabase } from "@/integrations/supabase/client";

export interface BookingGroupRow {
  id: string;
  Fecha: string;
  Hora: string;
  total_duration: number;
  stylist: string;
  related_booking_id: string | null;
}

export interface ShiftedBooking extends BookingGroupRow {
  nextDate: string;
  nextTime: string;
  nextEndTime: string;
}

const toLocalDate = (date: string, time: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

const toDateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const toTimeString = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:00`;

/** Returns every ancestor and descendant in a compound-booking chain. */
export async function fetchBookingGroup(seedId: string): Promise<BookingGroupRow[]> {
  const rows = new Map<string, BookingGroupRow>();
  const visited = new Set<string>();
  let pending = [seedId];

  while (pending.length > 0) {
    const ids = pending.filter((id) => !visited.has(id));
    if (ids.length === 0) break;
    ids.forEach((id) => visited.add(id));

    const [currentResult, childrenResult] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, Fecha, Hora, total_duration, stylist, related_booking_id")
        .in("id", ids),
      supabase
        .from("bookings")
        .select("id, Fecha, Hora, total_duration, stylist, related_booking_id")
        .in("related_booking_id", ids),
    ]);

    if (currentResult.error) throw currentResult.error;
    if (childrenResult.error) throw childrenResult.error;

    const discovered = [...(currentResult.data ?? []), ...(childrenResult.data ?? [])] as BookingGroupRow[];
    pending = [];
    for (const row of discovered) {
      rows.set(row.id, row);
      if (!visited.has(row.id)) pending.push(row.id);
      if (row.related_booking_id && !visited.has(row.related_booking_id)) {
        pending.push(row.related_booking_id);
      }
    }
  }

  if (!rows.has(seedId)) throw new Error("No se pudo cargar la cita completa");
  return [...rows.values()];
}

/** Keeps the original offsets between all parts, including processing pauses. */
export function shiftBookingGroup(
  rows: BookingGroupRow[],
  anchorId: string,
  targetDate: string,
  targetTime: string,
  targetStylist?: string,
): ShiftedBooking[] {
  const anchor = rows.find((row) => row.id === anchorId);
  if (!anchor) throw new Error("No se encontró la cita principal");

  const deltaMs =
    toLocalDate(targetDate, targetTime).getTime() -
    toLocalDate(anchor.Fecha, anchor.Hora).getTime();

  return rows.map((row) => {
    const nextStart = new Date(toLocalDate(row.Fecha, row.Hora).getTime() + deltaMs);
    const nextEnd = new Date(nextStart.getTime() + Math.max(0, row.total_duration) * 60_000);
    return {
      ...row,
      stylist: targetStylist ?? row.stylist,
      nextDate: toDateString(nextStart),
      nextTime: toTimeString(nextStart),
      nextEndTime: toTimeString(nextEnd),
    };
  });
}

export class SlotUnavailableError extends Error {
  constructor(message = "Algún tramo de la cita ya no está disponible") {
    super(message);
    this.name = "SlotUnavailableError";
  }
}

/**
 * `onlyRealBookings` ignores the synthetic slots that check-availability adds for
 * closed hours, breaks and days off (they carry no id). The admin panel must be
 * able to move an appointment outside opening hours on purpose.
 */
export async function validateShiftedBookingGroup(
  rows: ShiftedBooking[],
  tenantId: string,
  options: { onlyRealBookings?: boolean } = {},
) {
  const excludedBookingIds = new Set(rows.map((row) => row.id));

  for (const row of rows) {
    const { data, error } = await supabase.functions.invoke("check-availability", {
      body: {
        tenant_id: tenantId,
        date: row.nextDate,
        stylist: row.stylist,
        totalDuration: row.total_duration,
      },
    });
    if (error || !Array.isArray(data?.bookedSlots)) {
      throw new Error("No se pudo comprobar la disponibilidad");
    }

    const [hours, minutes] = row.nextTime.slice(0, 5).split(":").map(Number);
    const start = hours * 60 + minutes;
    const end = start + row.total_duration;
    const hasConflict = data.bookedSlots.some((slot: { id?: string; Hora: string; total_duration: number }) => {
      if (slot.id && excludedBookingIds.has(slot.id)) return false;
      if (options.onlyRealBookings && !slot.id) return false;
      const [slotHours, slotMinutes] = slot.Hora.slice(0, 5).split(":").map(Number);
      const slotStart = slotHours * 60 + slotMinutes;
      return start < slotStart + slot.total_duration && end > slotStart;
    });
    if (hasConflict) throw new SlotUnavailableError();
  }
}