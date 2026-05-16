# Plan revisado

## 1. Permitir solapamiento desde cita rápida
- En `QuickBookingSheet.tsx → handleCreate`, enviar `skipAvailabilityCheck: true`.
- Quitar cualquier bloqueo/aviso de hueco; el admin decide y ya moverá si hace falta.
- Aun así, leer `error.context.json()` para que cualquier error futuro muestre el mensaje real en lugar de *"non 2xx status code"*.

## 2. Áreas de click solo cada 30 min (en lugar de cada 15)
En `LocalCalendarCRM.tsx`:

- Reemplazar el handler único de la columna por **dos zonas clicables por hora**: `:00` y `:30`.
- Cada zona ocupa 30 min de alto (según `PIXELS_PER_MINUTE`).
- Se renderizan **debajo** de las citas existentes (`z-0`) para no robar clicks a las tarjetas de cita.
- Al hacer click: abre `QuickBookingSheet` con `time` = `HH:00` o `HH:30` exacto (no se snapea por coordenadas).

## 3. Hover sutil
- Cada zona `:00` / `:30`:
  - `cursor-pointer`
  - `hover:bg-foreground/[0.04]` (oscurecimiento muy sutil, neutro)
  - `transition-colors`
- Sin icono `+`, sin borde. Solo el oscurecimiento al pasar el ratón.
- En mobile (touch) no hay hover; el click sigue funcionando igual.

## Archivos a tocar
- `src/components/admin/QuickBookingSheet.tsx` — `skipAvailabilityCheck: true` + parseo de error.
- `src/components/admin/LocalCalendarCRM.tsx` — sustituir overlay único por grid de bloques de 30 min con hover.

## Lo que NO cambia
- Validación del backend `create-booking` sigue intacta (la usaremos para reservas de clientes, no para cita rápida del admin).
- Click sobre una cita existente sigue abriendo su detalle (los bloques quedan detrás).
