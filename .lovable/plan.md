

## Diagnóstico

### Problema 1: Bloquear periodo no funciona — RLS de `bookings`

La política INSERT actual de `bookings` es:
```sql
WITH CHECK ((auth.uid() = user_id) AND (user_id IS NOT NULL) AND (tenant_id IS NOT NULL))
```

`handleBlockPeriod` en `LocalCalendarCRM.tsx` (línea 504) hace `supabase.from("bookings").insert(...)` directo desde el cliente, **sin `user_id`** (porque un bloqueo no pertenece a un usuario, es del salón). RLS lo rechaza siempre.

Lo mismo pasaría con cualquier inserción que haga el admin para un cliente sin cuenta — pero el `AdminBookingFlow` ya pasa por la edge function `create-booking` (que usa `service_role` y se salta RLS), así que ese flujo sí funciona. **El bloqueo es el único insert directo desde cliente que queda roto.**

Falta una política INSERT para staff del tenant (admin/stylist) que permita crear bookings de su tenant aunque no tengan `user_id`.

### Problema 2: Tenant nuevo no permite reservar

Dijiste que lo creaste y lo borraste. Confirmado en BD: solo existe Cristina Muñoz. La causa más probable es la **estrategia de activación**: los tenants se crean con `is_active = false` y se activan tras el onboarding/generación AI (memoria `features/onboarding/tenant-activation-strategy`). El edge function `create-booking` rechaza con 403 "Este negocio no está activo" si el tenant no está activo aún (línea 191-195).

Como ya borraste el tenant, no puedo reproducirlo, pero dejaré una mejora defensiva.

## Solución

### Fix 1 (crítico): Política RLS para que el staff del tenant pueda hacer INSERT directo

Migración nueva:

```sql
CREATE POLICY "Tenant staff can create bookings for their tenant"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = public.get_user_tenant_id()
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'stylist'::app_role)
  )
);
```

Esto convive con la política existente "Users can create their own bookings" (clientes finales reservando para sí mismos). Como son políticas permisivas, basta que una pase. El bloqueo de periodo (sin `user_id`) pasará por la nueva política porque el admin pertenece al tenant.

No toco el resto de políticas (SELECT/UPDATE/DELETE de staff ya están bien).

### Fix 2 (defensivo): Mensaje claro cuando el tenant no está activo

En `BookingConfirmation.tsx`, cuando `create-booking` devuelva 403 con "no está activo", mostrar toast amigable: *"Este salón aún no está disponible para reservas. Vuelve a intentarlo en unos minutos."* en lugar del error técnico.

## Verificación post-fix

1. Bloqueo de periodo → admin abre dialog "Bloquear periodo", elige fecha, click "Bloquear" → se crea registro tipo `🔒 BLOQUEADO` o `🌴 VACACIONES` y aparece pintado en rojo en la agenda.
2. Reserva pública en tenant existente → sigue funcionando igual (vía edge function).
3. Si creas otro tenant nuevo y aún no está activo → toast claro en lugar de error.

## Archivos

**Migración SQL nueva**: política INSERT para staff del tenant en `bookings`.
**Editar**: `src/components/booking/BookingConfirmation.tsx` — mejorar manejo de error 403 "tenant inactivo".

**Sin cambios**: `LocalCalendarCRM.tsx` (la lógica del cliente está bien; el problema era 100% RLS).

