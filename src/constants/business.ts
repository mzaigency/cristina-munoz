// Business configuration constants

export type ServiceGroup = 
  | 'Coloración' 
  | 'Corte' 
  | 'Estética' 
  | 'Peinados y Tratamientos' 
  | 'Asesoramiento profesional';

export const SERVICE_GROUPS: ServiceGroup[] = [
  'Corte',
  'Coloración',
  'Peinados y Tratamientos',
  'Estética',
  'Asesoramiento profesional'
];

export interface BusinessHours {
  morningStart: number;
  morningEnd: number;
  afternoonStart: number;
  afternoonEnd: number;
  isClosed: boolean;
}

// Default business hours (can be overridden by tenant settings)
export const BUSINESS_HOURS: Record<number, BusinessHours> = {
  0: { morningStart: 0, morningEnd: 0, afternoonStart: 0, afternoonEnd: 0, isClosed: true }, // Domingo
  1: { morningStart: 540, morningEnd: 780, afternoonStart: 900, afternoonEnd: 1200, isClosed: false }, // Lunes
  2: { morningStart: 540, morningEnd: 780, afternoonStart: 900, afternoonEnd: 1200, isClosed: false },
  3: { morningStart: 540, morningEnd: 780, afternoonStart: 900, afternoonEnd: 1200, isClosed: false },
  4: { morningStart: 540, morningEnd: 780, afternoonStart: 900, afternoonEnd: 1200, isClosed: false },
  5: { morningStart: 540, morningEnd: 780, afternoonStart: 900, afternoonEnd: 1200, isClosed: false },
  6: { morningStart: 540, morningEnd: 840, afternoonStart: 0, afternoonEnd: 0, isClosed: false }, // Sábado
};

export const SLOT_INTERVAL = 15; // minutes
