

# Auditoría y Optimización del Código

## Problemas encontrados

### 1. Llamadas redundantes a `supabase.auth.getUser()` y `getSession()`
Se encontraron **75+ llamadas a `getUser()`** y **100+ a `getSession()`** dispersas por todo el proyecto, cuando ya existe un `AuthContext` que provee `user` y `session`. Cada llamada es una petición de red innecesaria.

**Archivos afectados** (principales):
- `src/hooks/usePushNotifications.ts` — 3 llamadas a `getUser()`, debería usar `useAuth()`
- `src/components/feed/StoriesCarousel.tsx` — `getUser()` para obtener `currentUserId`
- `src/components/feed/StoryReplyInput.tsx` — `getUser()` 
- `src/components/tenant/TenantContactSection.tsx` — `getUser()`
- `src/components/tenant/TenantHeader.tsx` — `getSession()`
- `src/components/tenant/TenantBookingFlow.tsx` — `getSession()`
- `src/components/booking/BookingFlow.tsx` — `getSession()`
- `src/components/social/CommentsSection.tsx` — `getSession()`
- `src/components/admin/NotificationSettings.tsx` — `getUser()`
- `src/components/admin/MessagesManager.tsx` — `getUser()`
- `src/components/business-landing/StickyHeader.tsx` — `getSession()`

**Solución**: Reemplazar con `useAuth()` del contexto existente.

### 2. `useRecommendations` recrea el `Map` en cada render
En `useRecommendations.ts`, `scoresMap` se crea fuera de `useMemo`, así que se reconstruye en **cada render** del componente `Index`.

**Solución**: Envolver en `useMemo`.

### 3. `PremiumSalonCard` invoca hooks `useFavorites()` y `useFollows()` por cada tarjeta
Cada tarjeta ejecuta sus propios hooks, que internamente hacen queries a Supabase. Con N salones, esto multiplica las suscripciones y renders.

**Solución**: Levantar `useFavorites` y `useFollows` al componente padre (`Index`) y pasar `isFav` / `isFollowing` / callbacks como props.

### 4. `useUnreadMessages` escucha TODOS los cambios en `conversations` y `direct_messages`
El filtro de realtime no tiene `.eq('user_id', user.id)`, recibiendo eventos de **todos** los usuarios.

**Solución**: Añadir `filter: 'user_id=eq.' + user.id` al canal.

### 5. `useTodayAvailability` hace N llamadas a Edge Function secuencialmente
Invoca `check-availability` para cada tenant en lotes de 5, generando muchas peticiones.

**Solución**: Crear un endpoint batch o al menos cachear resultados con `staleTime`.

### 6. `handleSearchChange` guarda en `recentSearches` en cada tecleo > 2 chars
Debería guardar solo al hacer submit/blur, no al escribir.

### 7. QueryClient sin configuración de retry/error
`const queryClient = new QueryClient()` usa defaults (3 retries). Debería tener config global optimizada.

---

## Plan de cambios

### Paso 1: Centralizar auth — eliminar `getUser()`/`getSession()` redundantes
Reemplazar en ~15 archivos las llamadas directas por `useAuth()`. En componentes que no son hooks (callbacks dentro de mutations), usar `session` del contexto.

### Paso 2: Memoizar `scoresMap` en `useRecommendations`
Envolver la creación del `Map` en `useMemo` con dependencia en `data`.

### Paso 3: Levantar hooks de `PremiumSalonCard` al padre
Mover `useFavorites` y `useFollows` a `Index.tsx`, pasar datos como props a `PremiumSalonCard`.

### Paso 4: Filtrar realtime en `useUnreadMessages`
Añadir filtro por `user_id` en el canal de `conversations`.

### Paso 5: Optimizar QueryClient
Añadir configuración global: `retry: 1`, `staleTime: 60000`, `refetchOnWindowFocus: false`.

### Paso 6: Fix `handleSearchChange`
Solo guardar búsquedas recientes en blur/submit, no en cada keystroke.

---

## Detalles técnicos

```text
Archivos a modificar:
├── src/hooks/useRecommendations.ts        (memoizar scoresMap)
├── src/hooks/useUnreadMessages.ts         (filtro realtime)
├── src/pages/Index.tsx                    (levantar hooks, fix search)
├── src/components/feed/PremiumSalonCard.tsx (recibir props en vez de hooks)
├── src/App.tsx                            (QueryClient config)
├── src/hooks/usePushNotifications.ts      (usar useAuth)
├── src/components/feed/StoriesCarousel.tsx (usar useAuth)
├── src/components/feed/StoryReplyInput.tsx (usar useAuth)
├── src/components/tenant/TenantHeader.tsx  (usar useAuth)
├── src/components/tenant/TenantContactSection.tsx (usar useAuth)
├── src/components/tenant/TenantBookingFlow.tsx    (usar useAuth)
├── src/components/booking/BookingFlow.tsx          (usar useAuth)
├── src/components/social/CommentsSection.tsx       (usar useAuth)
├── src/components/admin/NotificationSettings.tsx   (usar useAuth)
├── src/components/admin/MessagesManager.tsx        (usar useAuth)
└── src/components/business-landing/StickyHeader.tsx(usar useAuth)
```

Estimación: ~16 archivos, cambios quirúrgicos. Sin cambios visuales ni de funcionalidad.

