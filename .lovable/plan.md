
# Actualizar iconos cuadrados al nuevo logo

Solo iconos cuadrados/app icons. **NO se toca** `src/assets/glowapp-logo.png` ni `src/assets/Glowapp Letras.png` (logotipo completo del header, footer y QR).

## Archivos a sustituir desde el zip

Desde `/tmp/iconkitchen-extracted/web/` → `public/`:

- `favicon.ico` → `public/favicon.ico`
- `apple-touch-icon.png` → `public/apple-touch-icon.png`
- `icon-192.png` → `public/icon-192.png` y `public/pwa-192x192.png`
- `icon-512.png` → `public/icon-512.png` y `public/pwa-512x512.png`
- `icon-192-maskable.png` → `public/icon-192-maskable.png`
- `icon-512-maskable.png` → `public/icon-512-maskable.png`
- `icon-192.png` → `public/favicon.png` (usado en footer y stats como mini-logo cuadrado)

Total: 8 archivos en `public/` reemplazados, sin cambios de código.

## Lo que NO se cambia

- `src/assets/glowapp-logo.png` (preloader, NotFound, ForBusiness, etc.)
- `src/assets/Glowapp Letras.png` (QR generator)
- Cualquier referencia en código (`index.html`, componentes) — las rutas siguen siendo las mismas.
