## Problema

En la vista de cliente (`BookingFlow.tsx`), al avanzar de paso se hace scroll al `<section>` completo (que incluye el título "Reserva tu Cita"), por lo que el usuario aterriza arriba del todo y no ve dónde está. Además, el auto-scroll al CTA del `GuidedStep` queda tapado por ese scroll inicial.

## Cambios

### 1. `src/components/booking/BookingFlow.tsx`
- Añadir un nuevo `ref` (`progressRef`) sobre el contenedor de la barra de progresión (el div con "Servicios / Peluquera / Fecha / Confirmar").
- Reemplazar las 3 llamadas `bookingRef.current?.scrollIntoView(...)` en `handleServicesSelect`, `handleStylistSelect` y `handleDateTimeSelect` por `progressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })` con un pequeño offset superior (usando `scrollMarginTop` por CSS) para no quedar pegado al borde.
- Mantener `bookingRef` solo como contenedor de la sección.

### 2. `src/components/guided/GuidedStep.tsx`
- Asegurar que el scroll al CTA (cuando el paso se activa o cuando el botón pasa de `disabled` → habilitado) se ejecute **después** del scroll al progreso, aumentando el `setTimeout` inicial (de 120ms → ~450ms) para que no compita con el smooth-scroll a la barra de progresión.
- En el `MutationObserver` que detecta el cambio `disabled → enabled`, mantener el scroll al CTA con `block: "center"` (ya está, pero validar que se dispara tras una interacción del usuario, p. ej. tras seleccionar servicio).

### 3. Comportamiento resultante
- **Al cambiar de paso** (`step 1 → 2`, etc.): scroll suave a la barra de progresión (el usuario ve "voy por el paso 2 de 4").
- **Al completar la acción dentro del paso** (ej. seleccionar servicio que habilita "Continuar"): scroll suave hacia abajo al CTA destacado con halo.

### 4. Aplicar mismo patrón en admin
- Verificar `src/components/admin/AdminBookingFlow.tsx`: si hace `scrollIntoView` al header en cambio de paso, redirigirlo también a su barra de progresión (4 pasos Servicios/Profesional/Fecha/Confirmar) con un `progressRef` análogo. El comportamiento del CTA ya viene de `GuidedStep` y heredará el ajuste de timing.

## Notas técnicas (mobile-first)

- Usar `scroll-margin-top` (Tailwind: `scroll-mt-4` o similar) en el contenedor del progreso para respetar la safe-area / sticky headers en iPhone.
- No tocar lógica de negocio ni de reserva, solo navegación visual.
