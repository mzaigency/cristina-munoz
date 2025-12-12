// Constantes de negocio centralizadas

/** Grupos de servicios para la UI */
export const SERVICE_GROUPS = [
  'Asesoramiento profesional',
  'Coloración',
  'Corte',
  'Estética',
  'Peinados y Tratamientos'
] as const;

export type ServiceGroup = typeof SERVICE_GROUPS[number];

/** Horarios de negocio por día de la semana (0 = Domingo, 6 = Sábado) */
export interface BusinessHours {
  morningStart: number;
  morningEnd: number;
  afternoonStart: number;
  afternoonEnd: number;
  isClosed: boolean;
}

export const BUSINESS_HOURS: Record<number, BusinessHours> = {
  0: { morningStart: 0, morningEnd: 0, afternoonStart: 0, afternoonEnd: 0, isClosed: true }, // Domingo - Cerrado
  1: { morningStart: 0, morningEnd: 0, afternoonStart: 0, afternoonEnd: 0, isClosed: true }, // Lunes - Cerrado
  2: { morningStart: 9 * 60, morningEnd: 12 * 60 + 30, afternoonStart: 15 * 60, afternoonEnd: 19 * 60, isClosed: false }, // Martes
  3: { morningStart: 9 * 60, morningEnd: 12 * 60 + 30, afternoonStart: 15 * 60, afternoonEnd: 19 * 60, isClosed: false }, // Miércoles
  4: { morningStart: 9 * 60, morningEnd: 12 * 60 + 30, afternoonStart: 15 * 60, afternoonEnd: 19 * 60, isClosed: false }, // Jueves
  5: { morningStart: 9 * 60, morningEnd: 12 * 60 + 30, afternoonStart: 15 * 60, afternoonEnd: 19 * 60, isClosed: false }, // Viernes
  6: { morningStart: 8 * 60, morningEnd: 13 * 60, afternoonStart: 0, afternoonEnd: 0, isClosed: false }, // Sábado
};

/** Intervalo de slots en minutos */
export const SLOT_INTERVAL = 30;

/** Información de estilistas */
export const STYLISTS = {
  cris: {
    name: 'Cristina',
    description: 'Especialista en coloración'
  },
  desi: {
    name: 'Desiree',
    description: 'Especialista en cortes'
  },
  any: {
    name: 'Sin preferencia',
    description: 'Te asignamos la primera disponible'
  }
} as const;
