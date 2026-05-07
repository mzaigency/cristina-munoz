# Telemetría de secciones del feed Discover

Objetivo: medir **impresiones**, **clics** y **conversiones (reservas)** por sección (`favorites`, `foryou`, `popular`, `near`, `today`, `new`) para poder iterar el algoritmo de recomendaciones con datos reales.

## 1. Modelo de datos

Nueva tabla `feed_events` (insert-only, append log):

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid pk | gen_random_uuid |
| user_id | uuid null | auth.uid() o null si anónimo |
| session_id | text | id estable por sesión (localStorage) |
| event_type | text | `impression` \| `click` \| `conversion` |
| section_id | text | `favorites`, `foryou`, `popular`, `near`, `today`, `new` |
| tenant_id | uuid null | salón impactado |
| position | int null | índice dentro del carrusel (0-based) |
| score | numeric null | score de recomendación si aplica |
| metadata | jsonb | `{ matchReasons, distance, hasAvailability, source }` |
| created_at | timestamptz default now() |

Índices: `(section_id, created_at)`, `(tenant_id, event_type)`, `(user_id, created_at)`.

**RLS**:
- INSERT: anon + authenticated (con validación de longitud y `event_type` en {impression,click,conversion}).
- SELECT: solo `is_superadmin()`.
- UPDATE/DELETE: nadie.

## 2. Eventos (qué se mide)

- **impression**: cuando una `<FeedSection>` entra en viewport ≥50% durante ≥500ms (IntersectionObserver). Una impresión por sección por sesión cada 30 min para evitar spam, y una impresión por tarjeta visible (lazy en el carrusel al hacer scroll).
- **click**: tap en una `PremiumSalonCard` dentro de una sección → registra section_id + tenant_id + position.
- **conversion**: al confirmarse una reserva (`create-booking` success), se envía un evento con la sección/tenant_id de origen recuperado de un atributo `?ref=section:foryou` añadido al link del card o de un `sessionStorage` (`glow_last_section_click`).

## 3. Arquitectura cliente

Nuevo módulo `src/lib/telemetry.ts`:
- `getSessionId()` — uuid persistido en localStorage.
- `trackEvent(event)` — encola en memoria, hace flush por batches cada 5s o cada 10 eventos vía un único insert a `feed_events` (Supabase client). No bloquea UI; usa `requestIdleCallback`.
- `useTrackImpression(sectionId, ref)` — hook con IntersectionObserver para `<FeedSection>`.
- `useTrackCardImpression(sectionId, tenantId, position)` — para cada `FeedCarouselItem` cuando entra en viewport.

Cambios mínimos:
- `FeedSection.tsx` → acepta prop `sectionId`, dispara impression al entrar en viewport.
- `FeedCarouselItem.tsx` → acepta `sectionId`, `tenantId`, `position`, dispara impression de tarjeta.
- `DiscoverSections.tsx` → pasa `sectionId` a cada sección y a cada item.
- `PremiumSalonCard.tsx` → si recibe prop `trackContext`, intercepta el click del Link y registra `click` antes de navegar; también guarda el contexto en `sessionStorage` para correlacionar con la conversión.
- En el flujo de reserva (`BookingFlow` / `create-booking` success) → leer `glow_last_section_click` y disparar evento `conversion` con `section_id` y `tenant_id`.

## 4. Privacidad y rendimiento

- Sin PII en `metadata`.
- Batching y `keepalive: true` en el último flush (`beforeunload`) para no perder eventos.
- Toggle global `localStorage.glow_disable_telemetry === '1'` para opt-out.
- Tamaño payload acotado por RLS check (`length(section_id) <= 32`, etc.).

## 5. Vista superadmin (fuera de scope inmediato, propuesta)

Sección nueva en SuperAdmin → "Feed Analytics":
- CTR por sección = clicks / impressions.
- CVR por sección = conversions / clicks.
- Top tenants por sección.
- Comparativa "Para ti" vs "Tendencia" para validar el algoritmo.

Esto se puede añadir en una segunda iteración con un par de RPCs `SECURITY DEFINER` que agreguen métricas semanalmente.

## 6. Entregables de esta tarea

1. Migración: tabla `feed_events` + RLS.
2. `src/lib/telemetry.ts` con batching y session id.
3. Hooks de tracking en `FeedSection` y `FeedCarouselItem`.
4. Click tracking en `PremiumSalonCard` (opt-in vía prop).
5. Conversion tracking en el handler de reserva exitosa.
6. Wiring en `DiscoverSections` para pasar `sectionId` y `position`.

## Fuera de scope

- Dashboard de analítica (se hará después con datos ya recogidos).
- A/B testing del algoritmo.
- Exportación a herramientas externas (PostHog, GA, etc.).
