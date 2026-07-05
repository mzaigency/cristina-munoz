/**
 * Helpers puros del importador de clientes CSV (Booksy/Fresha/Treatwell/genérico).
 * Sin dependencias — testeables en aislamiento.
 */

export interface ParsedRow {
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  birthday: string | null;
}

/**
 * Parser CSV tolerante: comillas, separador `,` o `;` (Booksy España exporta
 * con `;` según configuración regional), saltos de línea dentro de comillas.
 */
export function parseCsv(text: string): string[][] {
  // Detectar separador en la primera línea fuera de comillas
  const firstLine = text.slice(0, text.indexOf("\n") === -1 ? text.length : text.indexOf("\n"));
  const commas = (firstLine.match(/,/g) || []).length;
  const semis = (firstLine.match(/;/g) || []).length;
  const sep = semis > commas ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === sep) {
      row.push(field); field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some(f => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some(f => f.trim() !== "")) rows.push(row);
  return rows;
}

/** Encuentra el índice de columna cuyo header coincide con alguno de los alias (ES/EN de Booksy, Fresha, Treatwell). */
export function findCol(headers: string[], aliases: string[]): number {
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  const h = headers.map(norm);
  for (const alias of aliases) {
    const idx = h.findIndex(x => x === norm(alias));
    if (idx !== -1) return idx;
  }
  for (const alias of aliases) {
    const idx = h.findIndex(x => x.includes(norm(alias)));
    if (idx !== -1) return idx;
  }
  return -1;
}

/** DD/MM/YYYY o YYYY-MM-DD → YYYY-MM-DD (columna `birthday` es date). */
export function parseBirthday(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

export const normPhone = (p: string | null) => (p || "").replace(/\D/g, "").replace(/^34/, "");
export const normEmail = (e: string | null) => (e || "").trim().toLowerCase();
