

# Plan: Cambiar colores principales a #22408b y #99329a

## Resumen
Actualizar los colores primario (azul) y acento (morado) de la app con los nuevos valores de marca, afectando botones con gradiente y toda la interfaz.

## Conversión de colores
- `#22408b` → HSL: 223 61% 34%
- `#99329a` → HSL: 299 51% 40%

## Cambios en `src/index.css`

Líneas 21-32 y 46, 60-61, 65, 67-71: actualizar todas las referencias a primary y accent:

```css
--primary: 223 61% 34%;
--accent: 299 51% 40%;
--ring: 223 61% 34%;
--gradient-start: 223 61% 34%;
--gradient-end: 299 51% 40%;
--sidebar-primary: 223 61% 34%;
--sidebar-ring: 223 61% 34%;
```

Ajustar también los soft gradients para que deriven de los nuevos tonos:
```css
--gradient-soft-start: 223 15% 97%;
--gradient-soft-end: 299 12% 97%;
```

## Archivos a modificar
- `src/index.css` — variables CSS root (unico archivo)

