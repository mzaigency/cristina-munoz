## Problema

En el panel `/admin/montserratfaig`, al crear una cita, aparecen "Cris" y "Desi" (las profesionales de Cristina Muñoz) en lugar de las profesionales reales de Montse.

## Causa

`src/components/admin/AdminBookingFlow.tsx` reutiliza `src/components/booking/StylistSelection.tsx`, que tiene la lista de estilistas **hardcodeada**:

```tsx
const stylists = [
  { id: "cris", name: "Cris" },
  { id: "desi", name: "Desi" },
  { id: "any", name: "Siguiente disponible" },
];
```

No hace ninguna consulta a `tenant_stylists` filtrada por `tenant_id`. Por eso siempre muestra Cris/Desi independientemente del tenant.

Además, `DateTimeSelection` ya carga correctamente las estilistas reales del tenant desde `tenant_stylists` (línea 96), pero al pintar disponibilidad usa el `stylist` (slug) seleccionado en el paso anterior — que es "cris" o "desi", slugs que no existen en el tenant de Montse — por lo que los huecos mostrados son inconsistentes.

## Solución

1. **Crear un nuevo componente `AdminStylistSelection`** (en `src/components/admin/`) que:
   - Reciba `tenantId` por props.
   - Cargue de `tenant_stylists` los profesionales activos de ese tenant (`slug`, `name`, `color`, `avatar_url`).
   - Renderice una tarjeta por profesional + una opción "Siguiente disponible" (`any`) solo si hay 2+ profesionales.
   - Si solo hay 1 profesional, auto-seleccionarlo y saltar este paso (consistente con la lógica existente de booking público).
   - Mantenga el mismo estilo visual de `StylistSelection` actual.

2. **Actualizar `AdminBookingFlow.tsx`**:
   - Sustituir `import { StylistSelection }` por `AdminStylistSelection` y pasarle `tenantId`.
   - Cambiar la línea 509 (resumen) para mostrar el nombre real del estilista en vez de hardcodear `cris ? "Cris" : "Desi"`.
   - Tipar `stylist` como `string` (slug dinámico) en lugar del tipo unión `Stylist` ('cris'|'desi'|'any'), o ampliar el tipo.

3. **Verificar `DateTimeSelection`**: ya acepta cualquier slug y filtra por `tenant_id` en la edge function `check-availability` — no requiere cambios.

## Archivos afectados

- **Nuevo**: `src/components/admin/AdminStylistSelection.tsx`
- **Editado**: `src/components/admin/AdminBookingFlow.tsx`

## Notas

- No tocamos `src/components/booking/StylistSelection.tsx` porque podría usarse en otros flujos legacy; el panel admin usará el nuevo componente tenant-aware.
- Sin cambios de base de datos: `tenant_stylists` ya contiene los datos correctos por tenant.
