// Tipos centralizados para el sistema de reservas

export type ServiceType = 'Simple' | 'Compuesto';

export interface Service {
  id: string;
  name: string;
  type: ServiceType;
  duration_part1_active: number;
  duration_exposure_pause: number;
  duration_part2_active: number;
  category: string;
  /** Duración total calculada: duration_part1_active + duration_exposure_pause + duration_part2_active */
  duration: number;
}

export type Stylist = 'cris' | 'desi' | 'any';

export interface BookingData {
  services: Service[];
  stylist: Stylist | null;
  date: Date | null;
  time: string | null;
  name: string;
  phone: string;
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface BookedSlot {
  Hora: string;
  total_duration: number;
}
