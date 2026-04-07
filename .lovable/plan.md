

# Fix: Limpiar badges de notificaciones al hacer click

## Problema
Cuando abres el panel de notificaciones (campana), el badge rojo con el número sigue visible. Esto genera frustración porque el usuario ya ha "visto" las notificaciones pero el indicador no desaparece.

## Cambios

### 1. `NotificationBadge.tsx` — Marcar todas como leídas al abrir
Cuando el Sheet se abre, llamar `markAllAsRead()` automáticamente. Esto elimina el badge al instante.

### 2. `useNotifications.ts` — Optimistic update en `markAllAsRead`
Asegurar que `unreadCount` se pone a 0 de forma optimista (inmediata) antes de esperar la respuesta del servidor, para que el badge desaparezca sin delay.

### 3. Admin section badges (ya funciona)
Los badges del panel admin (`handleTabClick` → `markSectionViewed`) ya limpian correctamente al hacer click. No requieren cambios.

## Archivos a modificar
- `src/components/notifications/NotificationBadge.tsx` — llamar `markAllAsRead` al abrir
- `src/hooks/useNotifications.ts` — asegurar update optimista inmediato

