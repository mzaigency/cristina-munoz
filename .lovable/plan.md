# Mejorar el flujo de Lista de Espera

## Diagnóstico actual (qué falla)

**Cliente que se apunta:**
- Se inserta en `waitlist` y recibe un toast de confirmación. Punto.
- No tiene visibilidad de su posición ni puede cancelar/editar su solicitud.
- No recibe ningún mensaje de WhatsApp/push cuando se apunta.
- En "Mis citas" no aparece nada.

**Salón en el panel (`WaitlistManager`):**
- Ve la lista, pero las acciones reales son escasas: "marcar notificado" no envía nada, solo cambia un campo en BD.
- No hay botón claro para **convertir en cita** (crear booking real desde la entrada).
- No hay botón para **proponer un hueco concreto** ("te puedo dar el martes a las 11").
- No se ve el contexto: servicios pedidos, duración, profesional preferido están escondidos o truncados.
- No hay indicador de "¿qué huecos libres tengo cerca de su preferencia?" → el admin tiene que ir a la agenda manualmente y volver.

**Cron `check-waitlist-availability`:**
- Existe pero solo se dispara cuando se cancela una cita y, además, requiere coincidencia exacta de fecha. Si no encaja, la entrada se queda muerta para siempre.

---

## Plan de mejora (3 bloques)

### 1) Cliente: visibilidad y comunicación

- **Confirmación real**: al apuntarse se manda un push (si tiene la app) y un mensaje automático en la conversación con el salón: *"Te hemos añadido a la lista de espera para el {fecha}. Te avisaremos en cuanto haya un hueco."*
- **Sección "En espera" dentro de "Mis citas"**: nueva pestaña que lista las entradas activas del usuario con:
  - Salón, servicios pedidos, fecha preferida, profesional.
  - Estado: *Esperando · Avisado · Hueco propuesto*.
  - Botón **Cancelar** (borra/cancela su entrada).
- **Hueco propuesto**: cuando el salón le ofrece un hueco concreto (ver bloque 2), el cliente recibe push + mensaje con dos botones: **Aceptar** (crea booking automáticamente) o **Rechazar** (entrada vuelve a "esperando").

### 2) Panel del salón: acciones potentes

Rediseño de cada tarjeta del `WaitlistManager` para que el admin **pueda resolver desde ahí mismo** sin saltar a la agenda:

- **Botón "Proponer hueco"**: abre un mini-selector con los huecos libres del día/fecha preferida (reusa la lógica de `TenantDateTimeSelection`). Al elegir uno:
  - Si el cliente tiene cuenta → envía push + mensaje con botones aceptar/rechazar; estado pasa a `proposed`.
  - Si solo hay teléfono → genera un mensaje de WhatsApp pre-rellenado (`wa.me/...?text=...`) y marca como `notified`.
- **Botón "Convertir en cita"**: abre directamente el modal de creación de cita del CRM con todos los campos pre-rellenados (nombre, teléfono, servicios, profesional). Al guardar, la entrada de waitlist pasa a `booked` automáticamente.
- **Vista expandida** de cada tarjeta: muestra los servicios pedidos, duración total, rango horario preferido y notas (hoy se truncan).
- **Filtros y orden**: pestañas *Esperando / Avisados / Propuestos* y orden por fecha preferida (no solo por prioridad).
- **Indicador "Tienes hueco"**: badge verde en las entradas cuya fecha preferida tiene huecos libres que encajan con la duración pedida (cálculo en background al cargar).

### 3) Backend: estados y automatismos

- **Nuevos estados en `waitlist.status`**: añadir `proposed` y `expired` además de `waiting / notified / booked / cancelled`.
- **Edge function `propose-waitlist-slot`**: recibe `waitlist_id` + `date` + `time` + `stylist_id`, marca como `proposed`, guarda el hueco propuesto en columnas nuevas (`proposed_date`, `proposed_time`, `proposed_stylist_id`, `proposed_at`), y envía push + mensaje al cliente.
- **Edge function `accept-waitlist-proposal`**: el cliente la llama desde "Mis citas", crea el `booking` real validando que el hueco siga libre, y marca la entrada como `booked`.
- **Mejora del cron `check-waitlist-availability`**: además de fecha exacta, busca huecos en ±3 días de la fecha preferida y notifica al **admin** (no al cliente directamente) con un push *"Hay hueco para Cristina (lista de espera)"*, para que el admin decida proponer.
- **Auto-expiración**: entradas con fecha preferida ya pasada se marcan como `expired` automáticamente (trigger o limpieza diaria).

---

## Detalle técnico

**Migración SQL:**
```sql
ALTER TABLE waitlist 
  ADD COLUMN proposed_date date,
  ADD COLUMN proposed_time time,
  ADD COLUMN proposed_stylist_id uuid,
  ADD COLUMN proposed_at timestamptz,
  ADD COLUMN proposed_expires_at timestamptz;

-- RLS: usuarios pueden leer/cancelar sus propias entradas
CREATE POLICY "Users view own waitlist" ON waitlist 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users cancel own waitlist" ON waitlist 
  FOR UPDATE USING (auth.uid() = user_id) 
  WITH CHECK (status = 'cancelled');
```

**Archivos a tocar:**
- `src/components/admin/WaitlistManager.tsx` → rediseño con acciones reales (proponer hueco, convertir en cita, vista expandida, filtros).
- `src/components/admin/WaitlistProposeSlotDialog.tsx` (nuevo) → selector de huecos libres reusando lógica de disponibilidad.
- `src/pages/MyBookings.tsx` → nueva pestaña "En espera" con cancelar y aceptar/rechazar propuestas.
- `src/components/tenant/TenantDateTimeSelection.tsx` y `src/components/booking/DateTimeSelection.tsx` → tras apuntarse, enviar mensaje automático en conversación.
- `supabase/functions/propose-waitlist-slot/index.ts` (nueva).
- `supabase/functions/accept-waitlist-proposal/index.ts` (nueva).
- `supabase/functions/check-waitlist-availability/index.ts` → ampliar a ±3 días y notificar al admin.

**Mobile-first**: todas las tarjetas del admin y del cliente con safe-area, dialogs `max-h-[90vh]`, botones grandes táctiles, estética Liquid Glass coherente.
