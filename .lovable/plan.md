

# Mejora del flujo de selección de profesional en reservas

## Cambios

### 1. Auto-skip cuando solo hay 1 profesional
En `TenantStylistSelection.tsx`: si después de cargar los estilistas solo hay 1 activo, llamar `onNext(stylist.slug)` automáticamente y no renderizar la UI de selección. Esto salta el paso 2 directamente.

En `TenantBookingFlow.tsx`: ajustar el botón "Volver" del paso 3 para que vuelva al paso 1 si solo hay 1 profesional (saltando el paso 2 vacío).

### 2. Renombrar "Cualquiera" → "Siguiente disponible"
En `TenantStylistSelection.tsx`: cambiar el nombre de la opción "any" de "Cualquiera" a "Siguiente disponible" y quitar la descripción redundante.

En `TenantBookingFlow.tsx` y `SuccessCelebration`: cambiar "Cualquier profesional" por "Siguiente disponible" donde aparezca.

En `StylistSelection.tsx` (booking genérico): mismo cambio de "Cualquiera" → "Siguiente disponible".

### 3. Mostrar disponibilidad por profesional cuando se elige "Siguiente disponible"
En `TenantDateTimeSelection.tsx`: cuando `stylist === "any"`, en vez de mostrar solo las horas fusionadas, mostrar junto a cada hora qué profesionales están disponibles. Si para una hora hay más de 1 profesional libre, mostrar un selector para que el usuario elija cuál prefiere antes de continuar.

Concretamente:
- Guardar un mapa `slotToStylists: Record<string, TenantStylist[]>` que asocie cada hora con los profesionales disponibles en ese slot.
- En la UI de horas, mostrar junto a cada botón los avatares/nombres de quiénes están libres.
- Al seleccionar una hora donde hay 2+ profesionales disponibles, mostrar un mini-selector (cards pequeñas) para elegir profesional.
- Si solo hay 1 disponible en esa hora, asignarlo automáticamente.

## Archivos a modificar
- `src/components/tenant/TenantStylistSelection.tsx` — auto-skip + renombrar
- `src/components/tenant/TenantBookingFlow.tsx` — gestionar skip paso 2 + texto
- `src/components/tenant/TenantDateTimeSelection.tsx` — mostrar profesionales por slot
- `src/components/booking/StylistSelection.tsx` — renombrar "Cualquiera"

