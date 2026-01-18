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
  /** Precio del servicio */
  price?: number | null;
}

export interface ServicePackage {
  id: string;
  name: string;
  description: string | null;
  services: { id: string; name: string; price: number }[];
  original_total: number;
  package_price: number;
  discount_percentage: number | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
}

export interface Promotion {
  id: string;
  name: string;
  code: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number | null;
  max_uses: number | null;
  uses_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
}

export type Stylist = 'cris' | 'desi' | 'any';

export interface BookingData {
  services: Service[];
  stylist: Stylist | null;
  date: Date | null;
  time: string | null;
  name: string;
  phone: string;
  appliedPromotion?: Promotion | null;
  packageId?: string | null;
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface BookedSlot {
  Hora: string;
  total_duration: number;
}
