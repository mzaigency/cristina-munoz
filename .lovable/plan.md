# Eliminar el paso "Profesional" del ciclo de reserva

## Objetivo

Pasar de un flujo de **4 pasos** (Servicios → Profesional → Fecha → Confirmar) a un flujo de **3 pasos** (Servicios → Fecha → Confirmar), tanto en cliente (`TenantBookingFlow`) como en admin (`AdminBookingFlow`).

La lógica de mostrar avatares disponibles bajo cada hora y de pedir profesional cuando hay más de uno disponible para ese slot **ya existe** dentro de `TenantDateTimeSelection` (modo `stylist="any"`). Lo aprovechamos forzando `stylist = "any"` siempre, y replicamos esa misma UX en la versión admin si no la tiene.

## Cambios

### 1. Cliente — `src/components/tenant/TenantBookingFlow.tsx`

- Eliminar `step === 2` (TenantStylistSelection) y todo su render.
- Inicializar `bookingData.stylist = "any"` por defecto.
- Renumerar pasos: 1=Servicios, 2=Fecha/Hora, 3=Confirmar.
- Tras `handleServicesSelect`, ir directamente al paso 2 (fecha).
- Quitar import `TenantStylistSelection`, estado/efectos de `stylistCount` y la lógica de "skip step 2 if only 1 professional".
- Actualizar la barra de progreso (3 etapas en lugar de 4) y los textos del header (`step === N`).
- `handleBack` simplificado (resta 1).
- Eliminar el coachmark de "3 pasos" o actualizar copy si procede.

### 2. Admin — `src/components/admin/AdminBookingFlow.tsx`

- Mismas operaciones: eliminar `step === 2` con `AdminStylistSelection`, forzar `stylist = "any"`, renumerar a 3 pasos.
- Asegurar que el componente de fecha/hora que usa muestra avatares y el selector cuando hay varios disponibles. Si actualmente usa otro componente sin esta lógica, **unificar reusando `TenantDateTimeSelection**` pasándole `stylist="any"` (es agnóstico al tipo de usuario).
- Actualizar textos de progreso (`Servicios / Fecha / Confirmar`), `STEP_TITLES`, `STEP_DESCRIPTIONS` y helpers (`step === N`).
- Mantener el resumen final mostrando el profesional ya resuelto desde `bookingData.stylist`.

### 3. Archivos a borrar (si quedan huérfanos)

- `src/components/tenant/TenantStylistSelection.tsx`
- `src/components/admin/AdminStylistSelection.tsx`
- `src/components/booking/StylistSelection.tsx` (sólo si no lo usa nadie más; verificar con búsqueda antes de borrar).

### 4. No tocar

- `QuickBookingSheet` (calendario admin): la creación rápida desde una celda ya tiene profesional implícito por la columna, no aplica.
- `RescheduleFlow`: comprobar si arrastra el paso de profesional; si lo tiene, fuera del scope salvo que lo pidas explícitamente.
- Edge functions y schema: sin cambios.

## Detalles técnicos

- `TenantDateTimeSelection` ya implementa con `stylist="any"`:
  - `slotToStylists`: mapa `hora → profesionales disponibles`.
  - Render de avatares debajo de la hora.
  - Bloque "¿Con quién prefieres?" cuando hay >1 disponible.
  - Auto-asignación si sólo hay 1.
  - Devuelve `resolvedStylist` en `onNext`.
- Mantener tipo `Stylist` aceptando `"any"` y cualquier slug dinámico (ya tipado como `string` en `bookingData.stylist` tras resolver).

## Flujo resultante

```text
1. Servicios  →  2. Fecha y hora (con avatares y nombre + selección si >1)  →  3. Confirmar
```