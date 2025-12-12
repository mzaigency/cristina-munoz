// Utilidades de lógica de negocio para reservas

import { Service, TimeRange } from '@/types/booking';
import { BUSINESS_HOURS, SLOT_INTERVAL, BusinessHours } from '@/constants/business';

/**
 * Obtiene los horarios de negocio para un día específico
 */
export function getBusinessHours(dayOfWeek: number): BusinessHours {
  return BUSINESS_HOURS[dayOfWeek] || BUSINESS_HOURS[0];
}

/**
 * Verifica si dos rangos de tiempo se solapan
 */
export function hasOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Calcula las ventanas de tiempo activas para los servicios seleccionados
 */
export function getActiveWindows(startMin: number, services: Service[]): TimeRange[] {
  const windows: TimeRange[] = [];
  let currentTime = startMin;

  for (const service of services) {
    if (service.type === 'Compuesto') {
      // Ventana activa parte 1
      windows.push({
        start: currentTime,
        end: currentTime + service.duration_part1_active
      });
      currentTime += service.duration_part1_active + service.duration_exposure_pause;
      // Ventana activa parte 2
      windows.push({
        start: currentTime,
        end: currentTime + service.duration_part2_active
      });
      currentTime += service.duration_part2_active;
    } else {
      // Servicio simple - toda la duración es activa
      windows.push({
        start: currentTime,
        end: currentTime + service.duration
      });
      currentTime += service.duration;
    }
  }

  return windows;
}

/**
 * Genera los slots base para un día específico
 */
export function generateBaseSlots(dayOfWeek: number): Set<number> {
  const hours = getBusinessHours(dayOfWeek);
  const slotsSet = new Set<number>();

  if (hours.isClosed) return slotsSet;

  // Slots de la mañana
  if (hours.morningEnd > 0) {
    for (let minutes = hours.morningStart; minutes < hours.morningEnd; minutes += SLOT_INTERVAL) {
      slotsSet.add(minutes);
    }
  }

  // Slots de la tarde
  if (hours.afternoonEnd > 0) {
    for (let minutes = hours.afternoonStart; minutes < hours.afternoonEnd; minutes += SLOT_INTERVAL) {
      slotsSet.add(minutes);
    }
  }

  return slotsSet;
}

/**
 * Formatea minutos a string HH:MM
 */
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Parsea string HH:MM a minutos
 */
export function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Calcula los slots disponibles para una fecha específica
 */
export function calculateAvailableSlots(
  date: Date,
  bookedRanges: TimeRange[],
  services: Service[],
  totalDuration: number
): string[] {
  const dayOfWeek = date.getDay();
  const hours = getBusinessHours(dayOfWeek);

  if (hours.isClosed) return [];

  const isToday = date.toDateString() === new Date().toDateString();
  const currentMinutes = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : 0;

  // Generar slots base
  const slotsSet = generateBaseSlots(dayOfWeek);

  // Añadir slots flexibles después de cada reserva existente
  bookedRanges.forEach(booking => {
    const endTime = booking.end;
    const inMorning = endTime >= hours.morningStart && endTime < hours.morningEnd;
    const inAfternoon = endTime >= hours.afternoonStart && endTime < hours.afternoonEnd;
    if (inMorning || inAfternoon) {
      slotsSet.add(endTime);
    }
  });

  // Convertir a array ordenado de strings
  const allSlots = Array.from(slotsSet)
    .sort((a, b) => a - b)
    .map(minutesToTimeString);

  // Filtrar slots disponibles
  return allSlots.filter(slot => {
    const startMinutes = timeStringToMinutes(slot);
    const endMinutes = startMinutes + totalDuration;

    // Filtrar slots pasados si es hoy
    if (isToday && startMinutes <= currentMinutes) return false;

    // Verificar límites de horario
    const inMorning = startMinutes >= hours.morningStart && startMinutes < hours.morningEnd;
    const inAfternoon = startMinutes >= hours.afternoonStart && startMinutes < hours.afternoonEnd;

    if (inMorning && endMinutes > hours.morningEnd) return false;
    if (inAfternoon && endMinutes > hours.afternoonEnd) return false;

    // Verificar solapamiento con reservas existentes
    const activeWindows = getActiveWindows(startMinutes, services);
    for (const window of activeWindows) {
      for (const booking of bookedRanges) {
        if (hasOverlap(window.start, window.end, booking.start, booking.end)) {
          return false;
        }
      }
    }

    return true;
  });
}

/**
 * Formatea fecha a string YYYY-MM-DD
 */
export function formatDateToISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
