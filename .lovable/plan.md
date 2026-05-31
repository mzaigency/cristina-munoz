## Diagnóstico

He revisado el flujo completo `TenantBookingFlow` → `TenantDateTimeSelection` → `check-availability` → `create-booking`. **No es 100% consistente**. Detecto 4 inconsistencias entre el cálculo de huecos del frontend y la validación final del backend, principalmente con "Siguiente disponible" (any) y con servicios compuestos.

---

### 🔴 Inconsistencia 1 — Pre-selección de estilista con "any" en backend ignora horarios

`create-booking/index.ts` líneas 239–278 (rama `stylist === "any"`):

- Solo consulta `bookings` confirmados para detectar conflictos.
- **No comprueba** `stylist_business_hours` (horario semanal del estilista), ni `stylist_hours_overrides` (vacaciones / horario especial), ni el horario del negocio.
- Usa `total_duration` como bloque sólido — **no aplica `getActiveWindows`** como sí hace la validación posterior de las líneas 471–515.

**Consecuencia:** elige el primer estilista de la lista (siempre el mismo orden) y luego, en la validación de las líneas 376–433, puede devolver 409 *"no trabaja ese día"* aunque haya OTRO estilista que sí podía atender. El usuario ve "no disponible" para una franja que el front sí ofrecía.

### 🔴 Inconsistencia 2 — Frontend y backend no usan la misma lógica para "any"

- **Frontend** (`TenantDateTimeSelection` líneas 255–280): fusiona slots de TODOS los estilistas y guarda `slotToStylists[slot] = [estilistas válidos]`. Cuando hay >1, deja al usuario elegir; cuando hay 1, asigna ese.
- **Backend**: ignora qué estilista eligió el usuario en el front (no recibe `actualStylist` resuelto, recibe `"any"`) y vuelve a hacer pre-selección por orden de DB.

**Consecuencia:** si el usuario eligió a *Desi* en la UI cuando había 2 disponibles, el backend puede asignar a *Cris* (la primera de la lista) si también está libre. Reserva creada con estilista distinto al elegido.

### 🟠 Inconsistencia 3 — Validación de duplicado por teléfono solo mira misma `Hora` exacta

Líneas 436–460: filtra `eq("Hora", bookingTime)`. Si el mismo cliente reserva 16:00 y luego 16:30 con otro estilista (solapado), no lo detecta.

### 🟠 Inconsistencia 4 — `StylistSelection` legacy hardcoded a "cris"/"desi"

`src/components/booking/StylistSelection.tsx` solo lista 2 estilistas fijos. Se usa desde `src/components/booking/BookingFlow.tsx`, que parece flujo no-tenant. El flujo público real es `TenantBookingFlow` (correcto), pero conviene confirmar si `BookingFlow` está vivo o muerto, y borrarlo si no se monta en ninguna ruta.

---

## Plan de corrección

### 1. Backend `create-booking` — pre-selección "any" coherente con la validación final

Reemplazar el bucle líneas 239–278 por una función que, para cada estilista activo del tenant, ejecute **las mismas comprobaciones** que el bloque 285–515:

```text
para cada estilista activo:
  1. comprobar horario del negocio (override temporada > weekly)
  2. comprobar stylist_hours_overrides (vacaciones/especial)
  3. comprobar stylist_business_hours (semanal del estilista)
  4. comprobar conflicto con bookings usando getActiveWindows
si ninguno encaja → 409 con mensaje claro
```

Extraer estas comprobaciones a 3 helpers locales (`fitsBusinessHours`, `fitsStylistHours`, `hasBookingConflict`) y reutilizarlos también en la validación específica posterior — así el backend tiene UNA sola fuente de verdad.

### 2. Pasar el estilista resuelto desde el frontend al backend

En `TenantDateTimeSelection.handleNext` (línea 388) ya se calcula `available[0].slug` o `selectedSlotStylist`. Ese valor se propaga por `onNext(date, time, resolvedStylist)`. Verificar que `TenantBookingFlow` lo envía como `stylist` a `create-booking` (sustituyendo `"any"` por el slug concreto). Si ya lo hace, la rama `"any"` del backend solo se ejecuta para llamadas no-web (CRM/n8n) y aun así debe ser correcta (fix #1).

### 3. Reforzar deduplicación por teléfono

Cambiar la query de las líneas 436–460 para buscar bookings del mismo teléfono normalizado **del mismo día** y comprobar solapamiento por rango, no por igualdad de `Hora`.

### 4. Limpiar `BookingFlow` / `StylistSelection` legacy

- Si `BookingFlow` no se monta en `App.tsx`, borrar `src/components/booking/BookingFlow.tsx` y `StylistSelection.tsx`.
- Si sigue vivo, refactorizarlo para que lea estilistas reales de `tenant_stylists` (igual que `TenantDateTimeSelection`).

### 5. Test de regresión rápido tras los cambios

Llamar `create-booking` con `supabase--curl_edge_functions` para 3 casos:
- (a) "any" un día que Cris cierra → debe asignar Desi sin 409.
- (b) "any" con compuesto cuando un estilista tiene cita en la pausa → debe asignar al otro.
- (c) Estilista con `stylist_hours_overrides` cerrado → debe rechazar para ese estilista y proponer otro (o 409 limpio).

---

## Detalles técnicos

- Archivos a tocar: `supabase/functions/create-booking/index.ts` (refactor pre-selección + dedupe), `src/components/tenant/TenantBookingFlow.tsx` (asegurar envío del slug resuelto), opcionalmente borrar `src/components/booking/BookingFlow.tsx` + `StylistSelection.tsx`.
- Sin migraciones de DB.
- Sin cambios visuales en el flujo cliente.
- El componente `check-availability` ya está bien (combina overrides correctamente), no se toca.