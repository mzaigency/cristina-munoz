## Diagnóstico del bug de notificaciones

Montserrat (dueña de "Montserrat Faig") no comparte permisos con el salón de Cristina — no es admin ni estilista allí. El problema está en **cómo se registran los tokens FCM de push**:

- `src/hooks/usePushNotifications.ts` hace `upsert` en `push_tokens` con `onConflict: "user_id,token"`. Eso solo evita duplicados por par (usuario+token), pero **nunca limpia el token cuando otro usuario lo reclama** en el mismo navegador.
- El token FCM es único por navegador/dispositivo. Si Cristina inició sesión una vez en ese dispositivo (o Montserrat probó la cuenta), su `push_tokens` se quedó vinculado al `user_id` de Cristina. Cuando Cristina recibe una notificación, FCM la entrega al mismo navegador → aparece en el teléfono de Montserrat.
- No hay limpieza de token al hacer logout.

### Fix de notificaciones

1. **`src/hooks/usePushNotifications.ts`**
   - En `saveToken`: antes del `upsert`, borrar cualquier fila con el **mismo token y distinto `user_id`** (`delete().eq("token", fcmToken).neq("user_id", user.id)`). Así el token siempre apunta solo al usuario actualmente logueado en ese navegador.
   - Suscribirse al evento `SIGNED_OUT` de `supabase.auth.onAuthStateChange`: cuando dispara, borrar el `push_tokens` del token actual (`delete().eq("token", token)`) y limpiar `localStorage[FCM_TOKEN_CACHE_KEY]`.
2. **Migración de limpieza** (`supabase--migration`)
   - Deduplicar `push_tokens` existentes: para cada `token`, conservar solo la fila con `updated_at` más reciente. Esto resuelve el caso de Montserrat sin esperar a que el frontend se ejecute.

No se tocan las edge functions ni los triggers — siguen enviando al `user_id` correcto; solo deja de haber tokens "fantasma" apuntando a usuarios antiguos.

## Nueva sub-pestaña "Actividad" en Inicio

Añadir un feed cronológico que combine los últimos eventos del tenant (reservas, reseñas, mensajes, pedidos, nuevos clientes).

### Cambios

1. **`src/components/admin/layout/AdminSubNav.tsx`**
   - Añadir entrada en `ADMIN_SUB_NAV.inicio`:
     ```ts
     { value: "actividad", label: "Actividad", icon: Activity }
     ```
     justo después de `resumen`.

2. **`src/components/admin/sections/ActivitySection.tsx`** (nuevo)
   - Hook propio `useTenantActivity(tenantId)` que carga en paralelo y filtrando por `tenant_id`:
     - `bookings` (últimas 20 creadas/modificadas, con cliente, servicio, fecha)
     - `reviews` (últimas 10, con rating y autor)
     - `direct_messages` vía `conversations` (últimos mensajes entrantes)
     - `product_orders` (últimos 10)
     - `clients` nuevos (últimos 7 días)
   - Une todo en un array `{ type, icon, title, subtitle, time, action_url }`, ordenado por `created_at` desc, limitado a 40.
   - Suscripción Realtime con filtro `tenant_id=eq.${tenantId}` para las 4 tablas — refresca el feed automáticamente.
   - UI mobile-first liquid glass (siguiendo memoria de estilo): lista vertical con iconos coloreados por tipo, timestamps relativos (`date-fns/formatDistanceToNow` ya usado en el proyecto), tap → navega a la sección correspondiente (`/admin/{slug}/inicio/agenda`, `/clientes/mensajes`, etc.).
   - Filtros chip-style arriba: "Todo / Reservas / Reseñas / Mensajes / Pedidos".
   - Empty state si no hay actividad reciente.
   - Respeta safe-areas y el bottom-nav (padding inferior 72px).

3. **`src/components/admin/sections/InicioSection.tsx`**
   - Añadir rama `if (tab === "actividad") return <ActivitySection tenantId={tenantId} onNavigate={onNavigate} />`.
   - Actualizar el JSDoc del `subTab`.

### Lo que NO hace
- No crea tablas nuevas — toda la data existe ya y RLS filtra por `tenant_id` automáticamente.
- No toca el panel Dashboard actual ("Resumen") ni el sistema de badges.
- No cambia las edge functions de envío de push.

## Verificación
- Probar que tras login en un navegador donde había otra cuenta, la fila vieja del token desaparece (`select * from push_tokens where token = ...`).
- Probar Activity con realtime: crear una reserva manualmente y ver que aparece en el feed en segundos.
