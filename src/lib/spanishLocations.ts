/**
 * Carga diferida del dataset de provincias y municipios de España
 * (all-spanish-cities, ~1.5MB). El import dinámico lo mantiene fuera del
 * bundle inicial de Auth: solo se descarga cuando el usuario llega al paso
 * de ubicación del registro.
 */

export interface SpanishProvince {
  code: string;
  name: string;
}

type SpanishCitiesModule = typeof import("all-spanish-cities");

let modulePromise: Promise<SpanishCitiesModule> | null = null;

function loadModule(): Promise<SpanishCitiesModule> {
  if (!modulePromise) {
    modulePromise = import("all-spanish-cities");
  }
  return modulePromise;
}

export async function loadSpanishProvinces(): Promise<SpanishProvince[]> {
  const { provinces } = await loadModule();
  return provinces()
    .map((p) => ({ code: String(p.code), name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadSpanishCities(codeProvince: string): Promise<string[]> {
  const { cities } = await loadModule();
  return cities({ code_province: codeProvince })
    .map((c) => c.name)
    .sort();
}
