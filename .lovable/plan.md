

## Plan: Web Push Notifications — Implementación Completa

### Resumen
Implementar notificaciones push nativas en la PWA usando Firebase Cloud Messaging (FCM). Los mensajes, formatos y acciones al tocar serán exactamente los que has definido.

### Requisito previo
Necesito tu **VAPID key** de Firebase Console (Project Settings → Cloud Messaging → Web Push certificates). Sin ella no puedo completar el paso 2.

---

### 1. Service Worker — `public/firebase-messaging-sw.js`
Escucha `push` events en background y muestra la notificación nativa del SO. Al tocar, abre la URL de acción correcta según el tipo:

| Tipo | Acción al tocar |
|------|----------------|
| `new_booking` | `/admin/{slug}` (agenda) |
| `client_cancellation` | `/admin/{slug}` (agenda) |
| `new_review` | `/{slug}` (perfil del salón) |
| `client_message` | `/messages` (chat abierto) |
| `booking_confirmed` | `/my-bookings` |
| `reminder_24h` | `/my-bookings` |
| `reminder_2h` | `/my-bookings` |
| `review_request` | `/my-bookings` (popup reseña) |
| `message` | `/messages` |

### 2. Hook — `src/hooks/usePushNotifications.ts`
- `requestPermission()` → pide permiso al usuario
- Registra SW de Firebase, obtiene token FCM con VAPID key
- Guarda token en `push_tokens` (tabla existente) con `platform: 'web'`
- Limpia token al cerrar sesión
- Detecta soporte y estado del permiso

### 3. Prompt de permisos — `src/components/notifications/PushPermissionPrompt.tsx`
Bottom sheet mobile-friendly (con safe area para iPhone) que aparece tras la primera reserva exitosa. Botones "Activar notificaciones" / "Ahora no". No se muestra si ya aceptó o rechazó.

### 4. Ajustes de notificaciones del cliente — `src/components/notifications/UserNotificationSettings.tsx`
Pantalla accesible desde el perfil del usuario donde puede activar/desactivar cada tipo:
- Recordatorio 24h, Recordatorio 2h, Solicitud de reseña
- Reserva confirmada, Reserva cancelada
- Mensajes, Promociones
- Toggle maestro de push (activa/desactiva el token)

Usa la tabla `user_notification_preferences` existente.

### 5. Ajustes admin — Modificar `NotificationSettings.tsx`
Añadir toggle de push al principio usando el hook `usePushNotifications`. Mostrar estado visual (activadas/bloqueadas/no soportadas).

### 6. Actualizar mensajes de notificación en triggers y Edge Functions
Actualizar la función SQL `trigger_booking_status_change` y la Edge Function `booking-notifications` para usar exactamente los mensajes definidos:

**Trigger SQL (status change):**
- Confirmada → `"✅ ¡Reserva confirmada! | Tu cita en [Salón] el [Día] a las [Hora] está lista"`
- Cancelada por admin → `"🚫 Cita cancelada | [Salón] ha cancelado tu cita del [Día] a las [Hora]"`
- Nuevo: notificar al admin cuando un **cliente** cancela → `"🚫 Cita cancelada | [Nombre] canceló su cita del [Día] a las [Hora]"`
- Nuevo: notificar al admin cuando se crea una reserva de cliente → `"✨ Nueva reserva | [Nombre] • [Día] [Hora] | [Servicios]"`

**Edge Function `booking-notifications` (cron):**
- 24h: `"📅 Recordatorio de cita | Mañana tienes cita en [Salón] a las [Hora]"` ✅ ya correcto
- 2h: `"⏰ Tu cita es en 2 horas | No olvides tu cita en [Salón] a las [Hora]"` ✅ ya correcto
- Review: `"⭐ ¿Qué tal tu experiencia? | Cuéntanos cómo te fue en [Salón]"` ✅ ya correcto

### 7. Notificaciones de mensajes y reseñas para admins
Crear/actualizar triggers SQL para:
- `new_review`: Cuando se inserta en `reviews` → push al admin del tenant: `"🌟 Nueva valoración | [Nombre] ha dejado una reseña de [X] estrellas"`
- `client_message`: Cuando se inserta en `direct_messages` con `sender_type='user'` → push al admin: `"💬 Nuevo mensaje de [Nombre] | [Extracto]"`
- `message` (salón→cliente): Cuando se inserta con `sender_type='salon'` → push al usuario: `"💬 Nuevo mensaje de [Salón] | [Extracto]"`

### 8. Configuración build
- Añadir dependencia `firebase` (solo `firebase/messaging`)
- Registrar SW de Firebase en `main.tsx` (con guard contra iframe/preview)
- Excluir `firebase-messaging-sw.js` del precache en `vite.config.ts`

---

### Archivos a crear
| Archivo | Descripción |
|---------|-------------|
| `public/firebase-messaging-sw.js` | SW para recibir push en background |
| `src/hooks/usePushNotifications.ts` | Hook de registro y permisos |
| `src/components/notifications/PushPermissionPrompt.tsx` | Prompt post-reserva |
| `src/components/notifications/UserNotificationSettings.tsx` | Ajustes de notificaciones del cliente |

### Archivos a modificar
| Archivo | Cambio |
|---------|--------|
| `src/components/admin/NotificationSettings.tsx` | Toggle de push con estado visual |
| `src/components/booking/BookingConfirmation.tsx` | Mostrar PushPermissionPrompt tras confirmar |
| `src/main.tsx` | Registrar SW Firebase con guard |
| `vite.config.ts` | Excluir SW de precache |
| `src/pages/Profile.tsx` | Link a ajustes de notificaciones |

### Migraciones SQL
| Migración | Contenido |
|-----------|-----------|
| Trigger `on_booking_created` | Push al admin con nueva reserva de cliente |
| Trigger `on_review_created` | Push al admin con nueva reseña |
| Trigger `on_message_created` | Push bidireccional (cliente↔admin) |
| Update `trigger_booking_status_change` | Actualizar mensajes + notificar admin en cancelación de cliente |

