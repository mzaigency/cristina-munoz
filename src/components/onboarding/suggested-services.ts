import { ServiceForm } from "./types";
import { businessTypeLabels as canonicalLabels } from "@/constants/businessTypes";

/**
 * Catálogo de servicios sugeridos por tipo de negocio.
 * Se precarga en el paso de servicios del onboarding para que el negocio
 * llegue con una base editable en lugar de un folio en blanco.
 *
 * Las claves coinciden con los `id` de `BusinessTypeStep.businessTypes`.
 */

const make = (
  name: string,
  category: string,
  duration: number,
  price: number
): ServiceForm => ({
  name,
  category,
  type: "simple",
  duration,
  duration_part1_active: duration,
  duration_exposure_pause: 0,
  duration_part2_active: 0,
  price: price.toString(),
});

export const suggestedServicesByType: Record<string, ServiceForm[]> = {
  peluqueria: [
    make("Corte mujer", "Corte", 45, 20),
    make("Corte hombre", "Corte", 30, 15),
    make("Corte niño/a", "Corte", 25, 12),
    make("Lavar y peinar", "Peinado", 30, 15),
    make("Tinte raíz", "Color", 60, 35),
    make("Tinte completo", "Color", 90, 50),
    make("Mechas", "Color", 120, 65),
    make("Mechas californianas / Balayage", "Color", 150, 90),
    make("Tratamiento hidratación", "Tratamientos", 30, 20),
    make("Recogido", "Peinado", 60, 35),
  ],
  barberia: [
    make("Corte clásico", "Corte", 30, 14),
    make("Corte + barba", "Combos", 45, 22),
    make("Afeitado tradicional", "Barba", 30, 15),
    make("Arreglo de barba", "Barba", 20, 10),
    make("Corte niño", "Corte", 25, 12),
    make("Tinte de barba", "Color", 30, 18),
    make("Ritual completo", "Combos", 60, 35),
    make("Cejas", "Extras", 10, 5),
  ],
  salon_belleza: [
    make("Corte mujer", "Peluquería", 45, 20),
    make("Tinte completo", "Peluquería", 90, 50),
    make("Manicura semipermanente", "Uñas", 45, 22),
    make("Pedicura spa", "Uñas", 60, 30),
    make("Depilación facial", "Depilación", 15, 10),
    make("Depilación piernas completas", "Depilación", 45, 25),
    make("Maquillaje social", "Maquillaje", 45, 35),
    make("Limpieza facial básica", "Estética", 60, 40),
    make("Diseño de cejas", "Cejas y pestañas", 20, 12),
    make("Lifting de pestañas", "Cejas y pestañas", 60, 40),
  ],
  estetica: [
    make("Limpieza facial profunda", "Faciales", 75, 45),
    make("Tratamiento antiedad", "Faciales", 90, 65),
    make("Peeling químico", "Faciales", 60, 55),
    make("Hidratación facial", "Faciales", 60, 40),
    make("Radiofrecuencia facial", "Aparatología", 45, 50),
    make("Presoterapia corporal", "Corporal", 45, 35),
    make("Masaje reductor", "Corporal", 60, 45),
    make("Drenaje linfático", "Corporal", 60, 50),
    make("Diseño y tinte de cejas", "Cejas y pestañas", 30, 18),
    make("Depilación con cera", "Depilación", 30, 18),
  ],
  spa: [
    make("Masaje relajante 60 min", "Masajes", 60, 50),
    make("Masaje relajante 90 min", "Masajes", 90, 75),
    make("Masaje descontracturante", "Masajes", 60, 55),
    make("Masaje de piedras calientes", "Masajes", 75, 65),
    make("Ritual facial relax", "Faciales", 60, 55),
    make("Circuito spa", "Wellness", 90, 35),
    make("Aromaterapia", "Wellness", 60, 50),
    make("Reflexología podal", "Masajes", 45, 40),
  ],
  unas: [
    make("Manicura básica", "Manicura", 30, 15),
    make("Manicura semipermanente", "Manicura", 45, 22),
    make("Pedicura básica", "Pedicura", 45, 20),
    make("Pedicura spa", "Pedicura", 60, 30),
    make("Uñas acrílicas", "Construcción", 90, 40),
    make("Uñas de gel", "Construcción", 90, 40),
    make("Relleno acrílico/gel", "Construcción", 60, 30),
    make("Nail art (por uña)", "Decoración", 10, 3),
    make("Retirada de esmaltado", "Extras", 20, 8),
    make("Retirada de acrílico/gel", "Extras", 30, 12),
  ],
  multiservicios: [
    make("Corte mujer", "Peluquería", 45, 20),
    make("Corte hombre", "Peluquería", 30, 15),
    make("Tinte completo", "Peluquería", 90, 50),
    make("Manicura semipermanente", "Uñas", 45, 22),
    make("Pedicura spa", "Uñas", 60, 30),
    make("Limpieza facial", "Estética", 60, 40),
    make("Depilación facial", "Depilación", 15, 10),
    make("Diseño de cejas", "Cejas y pestañas", 20, 12),
    make("Masaje relajante", "Masajes", 60, 45),
  ],
};

/**
 * Devuelve la lista sugerida para un tipo de negocio.
 * Si el tipo no está en el catálogo (caso "otro" o tipo personalizado),
 * devuelve null y el flujo se comporta como antes (un servicio en blanco).
 */
export function getSuggestedServices(
  businessType: string | undefined | null
): ServiceForm[] | null {
  if (!businessType) return null;
  const list = suggestedServicesByType[businessType];
  if (!list) return null;
  // Devolvemos copias para que el estado pueda mutarse libremente.
  return list.map((s) => ({ ...s }));
}

export const businessTypeLabels: Record<string, string> = {
  peluqueria: "Peluquería",
  barberia: "Barbería",
  salon_belleza: "Salón de Belleza",
  estetica: "Centro de Estética",
  spa: "Spa & Wellness",
  unas: "Salón de Uñas",
  multiservicios: "Multiservicios",
};
