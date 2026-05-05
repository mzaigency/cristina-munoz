# Feed por secciones (estilo Booksy, alma GlowApp)

Reorganizar el feed Discover de un grid plano a un **scroll vertical de secciones temáticas**, cada una con su carrusel horizontal de tarjetas (snap, mobile-first). Mantenemos la estética Liquid Glass, los `PremiumSalonCard` y los degradados Primary/Purple — solo cambia la **arquitectura de presentación**.

## Secciones propuestas (orden mobile)

1. **Cerca de ti** — usa `useGeolocation` + ordena por distancia. Si no hay permiso, muestra un CTA suave "Activar ubicación" en la propia sección.
2. **Huecos hoy** — `useTodayAvailability`. Solo aparece si hay 1+ salones disponibles hoy. Badge verde de urgencia.
3. **Para ti** (solo logueados) — orden por `scoresMap` de `useRecommendations`. Si el usuario no tiene historial, se oculta.
4. **Tendencia / Popular** — top por rating ≥4 y reviews. Sustituye al "Destacados" actual.
5. **Recién llegados** — orden por `created_at` desc, limitado a últimas 4 semanas.
6. **Explora por categoría** — chips horizontales (peluquería, barbería, uñas, spa…). Al tocar uno, abre vista filtrada (modo grid actual reutilizado).
7. **Tus favoritos** (solo si hay) — atajo a la sección de favoritos completa.

Cada sección solo se renderiza si tiene contenido relevante → evita feed vacío.

## Patrón visual de cada sección

```text
[icono] Título sección             Ver todo →
─────────────────────────────────────────────
 ◀ [card] [card] [card] [card] ▶   (snap-x)
```

- Header compacto: icono Lucide + título bold + contador sutil + link "Ver todo".
- Carrusel horizontal con `scroll-snap-x mandatory`, `overflow-x-auto`, fade lateral con máscara CSS.
- Tarjetas: variante compacta de `PremiumSalonCard` (~280px ancho en mobile, full alto), reutilizando el componente con un prop `variant="carousel"`.
- Sin flechas en mobile (swipe nativo); flechas discretas solo en ≥md.
- Animación `motion` stagger por sección al entrar en viewport (`whileInView`).

## Búsqueda y filtros

- Cuando hay `searchQuery` o `selectedCategory` activo → se **colapsan las secciones** y se muestra el grid clásico de resultados (comportamiento actual). Esto preserva la UX de búsqueda focalizada.
- Pills de categoría siguen visibles arriba como navegación rápida.
- Toggle `Cerca` / `Favoritos` se mantiene pero se vuelve redundante con las secciones → lo movemos a un único botón de "Ordenar" o lo retiramos en modo secciones.

## Personalidad GlowApp (no es Booksy)

- Fondo Liquid Glass animado se mantiene.
- Headers de sección con micro-gradiente Primary→Purple en el icono.
- Tarjetas conservan halo/sombra premium y badges de recomendación.
- Tipografía display GlowApp para títulos de sección.
- Transiciones suaves entre secciones (no cortes duros tipo Booksy).

## Arquitectura técnica

Nuevos archivos:

- `src/components/feed/sections/FeedSection.tsx` — wrapper genérico (header + carrusel snap).
- `src/components/feed/sections/DiscoverSections.tsx` — orquesta las 6-7 secciones, recibe `salons`, `scoresMap`, etc.
- `src/components/feed/PremiumSalonCard.tsx` — añadir prop `variant?: "grid" | "carousel"` (carousel = ancho fijo ~280px, mismo diseño).

Cambios en `src/pages/Index.tsx`:

- Si `searchQuery || selectedCategory` activo → render grid actual.
- Si no → render `<DiscoverSections salons={salonsWithDistance} ... />`.
- Reusa todos los hooks existentes (`useGeolocation`, `useTodayAvailability`, `useRecommendations`, `useFavorites`).
- Sin cambios de datos / RPC / RLS.

Mobile-first y safe-area:

- Carruseles con `pl-4 pr-4 -mx-4` para sangrado bonito edge-to-edge.
- Respeta `pb-28` actual para bottom nav.
- Snap por tarjeta (`snap-start`).

## Fuera de scope

- No tocamos backend, RPCs, ni el modo "Following".
- No tocamos Admin ni Booking.
- No añadimos nuevas tablas ni columnas.

## Preguntas opcionales (puedo decidir yo si prefieres)

- ¿Mantener el toggle "Cerca/Favoritos" arriba o retirarlo al haber sección dedicada? retirarlo
- ¿"Ver todo" navega a una página filtrada o expande la sección inline? expande la seccion