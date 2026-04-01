

# Fix: Notificaciones se "actualizan" y switch queda desactivado

## Problemas detectados

### Problema 1: El prompt de "Nueva versión" aparece al activar notificaciones
Al registrar `firebase-messaging-sw.js`, el detector de actualizaciones en `main.tsx` detecta un nuevo Service Worker y dispara el evento `swUpdated`, mostrando el banner de actualización y recargando la página.

### Problema 2: El switch queda desactivado tras recargar
`isEnabled` se calcula como `permission === "granted" && !!token`. Pero `token` solo se guarda en memoria (useState). Al recargar la página, el token se pierde y `isEnabled` vuelve a `false`, aunque el permiso siga concedido.

## Cambios

### 1. `src/hooks/usePushNotifications.ts`
- En el `useEffect` inicial, si `permission === "granted"`, intentar recuperar el token FCM existente automáticamente (importar Firebase, obtener el token sin pedir permiso de nuevo).
- Esto garantiza que tras cualquier recarga, el switch refleje el estado real.

### 2. `src/main.tsx`
- Filtrar el evento `updatefound` para que solo dispare `swUpdated` cuando el SW actualizado es el de Workbox/PWA (la URL contiene `sw.js` o `workbox`), no cuando es `firebase-messaging-sw.js`.

### 3. `src/components/pwa/UpdatePrompt.tsx`
- Añadir un guard adicional: al escuchar `controllerchange`, ignorar si el nuevo controller es el Firebase SW.

## Archivos a modificar
1. `src/hooks/usePushNotifications.ts` — recuperar token en mount si ya hay permiso
2. `src/main.tsx` — filtrar SW de firebase del detector de updates
3. `src/components/pwa/UpdatePrompt.tsx` — guard contra firebase SW

