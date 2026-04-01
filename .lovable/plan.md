

# Citas compuestas: borrar ambas partes + contar como 1

## Problema actual
1. **Al borrar parte 1 desde el calendario admin**, solo se envía `bookingId` de esa cita. La edge function `cancel-booking` busca `related_booking_id` en las citas enviadas, pero la relación va de part1 → main y part2 → part1. Si borras part1, no encuentra part2 porque part2 apunta a part1 (no al revés).
2. **En MyBookings** ya se filtran las part2 correctamente, pero en el calendario admin se muestran ambas partes como citas separadas.
3. **El conteo de visitas** (`total_visits` en tabla `clients`) cuenta cada booking individual, incluyendo part2.

## Cambios planificados

### 1. Edge function `cancel-booking/index.ts` - Buscar en ambas direcciones
Actualmente solo busca `related_booking_id` de las citas enviadas. Hay que también buscar citas que apunten A las citas enviadas:
```sql
-- Buscar citas cuyo related_booking_id sea alguno de los IDs a cancelar
SELECT * FROM bookings WHERE related_booking_id IN (idsToCancel)
```
Esto garantiza que si borras part1, se encuentra part2 (que tiene `related_booking_id = part1.id`), y viceversa.

### 2. Calendario admin `LocalCalendarCRM.tsx` - Agrupar visualmente
- Filtrar las part2 del renderizado (igual que MyBookings): no mostrar bookings con `compound_part === "part2"`
- En la cita part1, mostrar la duración total combinada (part1 + pausa + part2)
- Al hacer fetch, guardar la info de part2 para mostrar servicios completos

### 3. Conteo de citas del cliente
- En `ClientsCRM.tsx` y `ClientDetail.tsx`, al calcular stats desde bookings, filtrar las part2 para que un servicio compuesto cuente como 1 visita
- Actualizar la query de historial de citas en `ClientDetail.tsx` para filtrar part2

## Archivos a modificar
1. `supabase/functions/cancel-booking/index.ts` - Buscar related bookings en ambas direcciones
2. `src/components/admin/LocalCalendarCRM.tsx` - Filtrar part2 del renderizado
3. `src/components/admin/clients/ClientDetail.tsx` - Filtrar part2 en historial y stats

