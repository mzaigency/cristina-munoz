import sharp from "sharp";
import { statSync } from "node:fs";

// Optimiza imágenes in-place: mismos nombres → cero cambios de código.
// - Logos sobredimensionados: redimensiona al ancho máx mostrado (x2 retina).
// - Iconos/PNG pesados: recomprime con paleta (lossless visual, gran ahorro).

const jobs = [
  // [ruta, opciones]
  { file: "src/assets/glowapp-logo.png", width: 600 },
  { file: "src/assets/Glowapp Letras.png", width: 800 },
  { file: "public/og-image.png" },
  { file: "public/icon-512.png" },
  { file: "public/icon-512-maskable.png" },
  { file: "public/pwa-512x512.png" },
  { file: "public/icon-192.png" },
  { file: "public/icon-192-maskable.png" },
  { file: "public/pwa-192x192.png" },
  { file: "public/apple-touch-icon.png" },
  { file: "public/favicon.png" },
];

const kb = (n) => Math.round(n / 1024) + "KB";
let totalBefore = 0;
let totalAfter = 0;

for (const { file, width } of jobs) {
  let before;
  try {
    before = statSync(file).size;
  } catch {
    console.log(`skip (missing): ${file}`);
    continue;
  }

  let pipeline = sharp(file);
  if (width) {
    pipeline = pipeline.resize({ width, withoutEnlargement: true });
  }
  // PNG con paleta + compresión máxima: mismo formato, mucho menos peso.
  const buf = await pipeline
    .png({ quality: 80, compressionLevel: 9, palette: true, effort: 10 })
    .toBuffer();

  // Escribir solo si mejora.
  if (buf.length < before) {
    const { writeFileSync } = await import("node:fs");
    writeFileSync(file, buf);
    totalBefore += before;
    totalAfter += buf.length;
    console.log(`${file.padEnd(40)} ${kb(before).padStart(7)} → ${kb(buf.length).padStart(7)}`);
  } else {
    console.log(`${file.padEnd(40)} ${kb(before).padStart(7)} (sin mejora, intacto)`);
  }
}

console.log("─".repeat(60));
console.log(`TOTAL  ${kb(totalBefore)} → ${kb(totalAfter)}  (ahorro ${kb(totalBefore - totalAfter)})`);
