/**
 * Reescribe una URL pública de Supabase Storage para servirla a través del
 * transformador de imágenes (redimensiona + recomprime en el CDN). Reduce
 * drásticamente el peso de fotos subidas a tamaño completo.
 *
 * Solo afecta URLs `/storage/v1/object/public/...`; cualquier otra cosa
 * (data URIs, assets locales, dominios externos) se devuelve intacta, así que
 * es seguro pasarle cualquier `src`.
 */
const PUBLIC_PREFIX = "/storage/v1/object/public/";
const RENDER_PREFIX = "/storage/v1/render/image/public/";

interface Opts {
  width?: number;
  quality?: number;
}

export function supabaseImage(url: string | null | undefined, { width, quality = 70 }: Opts = {}): string {
  if (!url || !url.includes(PUBLIC_PREFIX)) return url ?? "";
  const base = url.replace(PUBLIC_PREFIX, RENDER_PREFIX);
  const params = new URLSearchParams();
  if (width) params.set("width", String(width));
  params.set("quality", String(quality));
  return `${base}?${params.toString()}`;
}
