## 1. Feed de inicio — estilo Treatwell/Fresha

**Diagnóstico actual:** 6 carruseles apilados (Favoritos, Para ti, Tendencia, Cerca, Hoy, Recién llegados) + cabecera + AISearchBar + FeedToggle + filtros + CategoryPills. Demasiado scroll antes de ver un salón. Las `PremiumSalonCard` repiten el mismo salón en varias secciones, lo que hace sentir el feed pobre y redundante.

**Nueva estructura (mobile-first, prioridad 843px y menores):**

```text
┌──────────────────────────────┐
│ Header (logo + notif + B2B)  │
├──────────────────────────────┤
│ HERO buscador + ubicación    │  ← protagonista
│ "Encuentra tu salón ideal"   │
│ [🔍 Busca servicio o lugar]  │
│ 📍 Cerca de mí · ✨ Hoy      │
├──────────────────────────────┤
│ Categorías (chips horiz)     │  ← CategoryPills compacto
├──────────────────────────────┤
│ ⚡ Disponibles HOY (carrusel)│  ← solo si hay
├──────────────────────────────┤
│ 📍 Cerca de ti (carrusel)    │  ← solo si hay ubicación
├──────────────────────────────┤
│ ✨ Recomendados para ti      │  ← grid vertical principal,
│ [card grande]                │     scroll infinito, dedup
│ [card grande]                │     contra los carruseles
│ [card grande]                │     de arriba
└──────────────────────────────┘
```

**Cambios concretos:**

1. **Hero buscador unificado** — fusionar `SmartSearchHeader` + `AISearchBar` + filtros "Cerca/Favoritos" en un único bloque hero compacto (≈180px alto) con buscador grande, atajos de ubicación y "huecos hoy", y favoritos como icono.
2. **Reducir a 3 secciones máximo** (en este orden):
   - **Huecos hoy** (carrusel, solo si `tenantsWithAvailability.length > 0`).
   - **Cerca de ti** (carrusel, solo si `hasLocation`; CTA para activar ubicación si no).
   - **Para ti / Destacados** (grid vertical principal, no carrusel — es el cuerpo del feed).
3. **Eliminar como secciones independientes**: Favoritos (acceso vía icono header), Tendencia (mezclado en Para ti via score), Recién llegados (badge "Nuevo" en card, ya existe).
4. **Deduplicación**: los salones que aparecen en "Huecos hoy" o "Cerca de ti" se excluyen del grid principal "Para ti" para evitar repetición.
5. **Tarjeta principal mejorada**: en el grid "Para ti", usar variante full-width de `PremiumSalonCard` con imagen 16:9 más grande (h-64), badges más limpios (max 1 visible), botón "Reservar" prominente. En carruseles seguir usando la versión compacta actual.
6. **Quitar `FeedToggle`** del nivel superior y mover "Siguiendo" como tab secundario más sutil (chip en el hero) — el modo descubrir es lo principal.

**Archivos afectados:**
- `src/pages/Index.tsx` — reorganizar layout, lógica de dedup, simplificar render.
- `src/components/feed/sections/DiscoverSections.tsx` — reducir a 3 secciones, marcar el grid "Para ti" como sección principal vertical.
- `src/components/feed/PremiumSalonCard.tsx` — añadir variante `featured` con imagen mayor y layout más editorial.
- `src/components/feed/SmartSearchHeader.tsx` + `AISearchBar.tsx` — fusionar en un nuevo `FeedHero.tsx` (o reorganizar para que visualmente sean un bloque continuo con búsqueda protagonista).
- `src/components/feed/FeedToggle.tsx` — degradarlo a chip inline en el hero o eliminarlo si "Siguiendo" se mueve a otra ruta.

## 2. Auto-actualización silenciosa

**Problema actual:** `UpdatePrompt` aparece muy seguido y a veces aunque no haya cambios reales. Causa: se dispara con `swUpdated` (vite-plugin-pwa), `controllerchange` ya estaba excluido pero `useAppVersion` también muestra prompt cuando detecta `version.json` distinto, y los SW de Firebase Messaging interfieren.

**Solución — auto-update silencioso:**

1. **Eliminar `UpdatePrompt` visible.** Sustituirlo por recarga automática controlada:
   - Cuando `useAppVersion` detecte versión nueva, en vez de poner `setUpdateAvailable(true)`, llamar directamente a `acceptUpdate()` **si la pestaña está oculta** o **el usuario está inactivo >30s** (sin scroll/click). Así nunca interrumpe.
   - Si el usuario está activo, esperar al próximo `visibilitychange` → `hidden` (bloquea pestaña) o al volver a `visible` después de >2min de inactividad → recargar entonces.
2. **Ignorar `swUpdated` cuando viene del SW de Firebase**: el evento ya se intenta filtrar pero vamos a quitar el prompt visual por completo, así esos falsos positivos dejan de molestar.
3. **`useAppVersion` mejoras:**
   - Comparar siempre `data.version` (no `buildTime`) para evitar ruido por rebuilds idénticos.
   - Añadir guard: si `serverVersion` cambió pero el hash del bundle servido en `index.html` no, ignorar (evita flapping de CDN).
4. **Toast opcional minimal post-recarga**: tras `reload`, leer `sessionStorage.glowapp_just_updated` y mostrar un toast `"Actualizado a la última versión"` 2s con el `useToast` existente. Sin botones, no bloquea.

**Archivos afectados:**
- `src/hooks/useAppVersion.ts` — quitar el modelo "prompt + dismiss", convertir en hook que recarga sola con heurística de inactividad.
- `src/components/pwa/UpdatePrompt.tsx` — **eliminar** (o reducir a un toast `Sonner` muy discreto).
- `src/main.tsx` o `src/App.tsx` — al boot, leer flag de "just updated" y mostrar toast 2s.
- `public/firebase-messaging-sw.js` — verificar que no emite eventos que `vite-plugin-pwa` interprete como update.

## Detalles técnicos

- **Dedup de carruseles vs grid:** mantener un `Set<id>` con los ids ya mostrados arriba; filtrar antes del `.map` del grid principal.
- **Inactividad:** detectar con listeners `mousemove`, `touchstart`, `scroll`, `keydown` reseteando un timer; tras 30s sin eventos + pestaña visible, considerar idle.
- **Safe areas iOS:** el nuevo hero respeta `env(safe-area-inset-top)` (ya cubierto globalmente vía `html`).
- **Sin cambios de schema ni edge functions.**

## Fuera de alcance

- Cambios al modo "Siguiendo" más allá de mover su entry point.
- Rediseño de `PremiumSalonCard` carrusel (solo se añade variante `featured`).
- Cambios en SEO / sitemap / Google Search Console.
