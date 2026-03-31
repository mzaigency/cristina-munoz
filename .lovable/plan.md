
Objetivo: quitar la sensación de “refresh” en Inicio para usuarios normales, especialmente en móvil, evitando que cada pantalla vuelva a resolver sesión y datos base al entrar.

Qué está pasando
- No parece un logout/login real, sino una cascada de chequeos al montar cada página.
- En Inicio se disparan a la vez varios hooks/componentes con auth:
  - `useFavorites`
  - `useFollows`
  - `useRecommendations`
  - `useCurrentUserTenant`
  - `BottomNavigation` (`useUnreadMessages` + avatar)
  - `SmartSearchHeader` (superadmin)
  - `NotificationBadge` / `useNotifications`
- Además, páginas como `MyBookings`, `Messages` y `Profile` vuelven a hacer `getSession/getUser` al abrirse, así que la navegación se siente como recarga completa.

Plan de implementación

1. Crear una fuente única de sesión en cliente
- Añadir un contexto/hook global tipo `useAuthSession`.
- Resolver la sesión una sola vez al arrancar la app.
- Escuchar `onAuthStateChange` una sola vez y compartir:
  - `user`
  - `session`
  - `loading`
  - `isAuthenticated`

2. Reemplazar chequeos repetidos en Inicio y navegación
- Refactorizar estos hooks para que usen el contexto global en vez de `getSession/getUser`:
  - `useFavorites`
  - `useFollows`
  - `useRecommendations`
  - `usePosts`
  - `useUnreadMessages`
  - `useNotifications`
  - `useCurrentUserTenant`
- Ajustar `BottomNavigation` y `SmartSearchHeader` para reutilizar esa misma sesión y no volver a consultar auth al montar.

3. Evitar loaders agresivos en pantallas de usuario
- `MyBookings`, `Messages` y `Profile` deben esperar al estado global de auth antes de redirigir o cargar.
- Sustituir “pantalla vacía + spinner” por transiciones más estables:
  - mantener layout/header/bottom bar visibles
  - cargar solo el contenido interno
- Esto es importante para mobile: menos parpadeo, mejor continuidad visual y safe areas intactas.

4. Reducir consultas duplicadas de perfil/rol
- Unificar datos derivados del usuario:
  - avatar
  - tenant vinculado
  - flags de admin/stylist/superadmin
- Mantener caché en memoria para esos metadatos y refrescar solo en `SIGNED_IN` / `SIGNED_OUT`.

5. Revisar Inicio específicamente
- Inicio debe renderizar primero la parte pública y enriquecer después:
  - feed discover
  - favoritos
  - recomendaciones
  - badge de mensajes
- Los elementos opcionales de usuario no deben bloquear la pantalla completa.
- Si algo aún no está listo, mostrar estado parcial discreto, no sensación de recarga.

Resultado esperado
- Entrar en Inicio ya no parecerá un refresh.
- Cambiar entre Inicio, Citas, Mensajes y Perfil será mucho más fluido.
- Menos consultas redundantes al backend.
- Mejor experiencia móvil, respetando safe areas y continuidad visual.

Detalles técnicos
- Punto central a corregir: hoy la app tiene demasiados `supabase.auth.getSession()` / `getUser()` repartidos por hooks y páginas.
- La mejora clave es pasar de “cada pantalla resuelve auth” a “la app resuelve auth una vez y las pantallas consumen ese estado”.
- Mantendría React Query para datos funcionales, pero separaría completamente:
  - estado de sesión global
  - consultas de negocio dependientes del usuario
