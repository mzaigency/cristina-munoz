## Plan aprobado (solo A + C)

### A. Política de Storage para avatares ✅ aplicada
La migración ya se aplicó: nuevas políticas en `storage.objects` que permiten a cualquier usuario autenticado subir/actualizar/borrar archivos solo dentro de `tenant-assets/avatars/{su_id}/...`. Las clientas ya pueden cambiar su foto de perfil.

### C. Logging diagnóstico en `check-availability`
Añadir en `supabase/functions/check-availability/index.ts`, justo antes del `return`, una línea de log con:

- `tenant_id`, `date`, `stylist`, `duration` solicitada
- nº de slots bloqueados y minutos bloqueados totales
- minutos de horario laboral disponibles del/los estilista(s)
- nº de estilistas chequeados

Así, si alguna clienta vuelve a reportar "está todo lleno", podemos revisar logs y ver si realmente quedaron 0 minutos libres o si fue un caso edge (servicio compuesto largo, override, etc.).

### Lo que NO se toca
- Flujo de reserva (login en paso 1 se mantiene tal cual).
- Lógica de `check-availability` (algoritmo de huecos).
- Horarios, overrides, RLS de `bookings`.

Pulsa **Implement plan** para aplicar el cambio C (el A ya está hecho).