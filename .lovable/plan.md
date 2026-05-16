
# Plan: Crear cita rápida con click directo en el calendario

## Problema

Crear una cita desde el panel admin obliga a recorrer 4 pasos secuenciales (servicios → profesional → fecha → hora → cliente) en `AdminBookingFlow.tsx`, igual que un cliente final. Para uso diario en el salón es lento y repetitivo, sobre todo cuando ya estás mirando el calendario y sabes exactamente dónde quieres meter la cita.

## Idea principal

Hacer que **cada hueco libre del calendario sea clicable**. Al pulsar, se abre un mini-modal "Cita rápida" con la **fecha, hora y profesional ya rellenas** (las inferimos del hueco que has tocado). Tú solo eliges cliente + servicio y guardas. Si necesitas el flujo largo (recurrencia, varios servicios, etc.), sigue disponible con el botón "+" actual.

## Diseño del flujo nuevo

### 1. Click en hueco libre del calendario

En `LocalCalendarCRM.tsx`, añadir capa clicable en cada celda vacía del grid (por día + franja horaria + columna de profesional). Visualmente:
- Hover: fondo `bg-primary/5` + cursor pointer + icono `+` sutil en el centro.
- Al clicar: abre `QuickBookingSheet` con `{ date, time, stylistSlug }` precargados.

### 2. QuickBookingSheet (componente nuevo, mobile-first)

Bottom sheet estilo iOS (Liquid Glass) con **una sola pantalla**, sin pasos:

```text
┌────────────────────────────────┐
│  Nueva cita                  ✕ │
│  Lunes 18 nov · 10:30 · Montse │ ← chip editable
├────────────────────────────────┤
│  Cliente                       │
│  [🔍 Buscar o escribir nombre] │ ← autocomplete CRM (ya existe)
│  └─ resultados / "Nuevo: ..."  │
├────────────────────────────────┤
│  Servicio                      │
│  [chips de servicios + buscar] │ ← multi-select compacto
│  Duración total: 45 min        │
├────────────────────────────────┤
│  [ Crear cita ]   [Más opciones]│
└────────────────────────────────┘
```

- **Cliente**: reutiliza el autocomplete ya implementado en `AdminBookingFlow` (búsqueda en `clients` con stats badge). Si no existe → "Crear nuevo: {nombre}" inline, solo nombre + teléfono opcional.
- **Servicio**: grid de chips agrupados por categoría, con buscador encima. Multi-select. La duración se recalcula y se muestra.
- **Chip fecha/hora/profesional**: clicable para editar inline (popover) sin salir del sheet.
- **"Más opciones"**: abre el `AdminBookingFlow` largo actual con los datos ya rellenos, para casos con recurrencia, promos, etc.

### 3. Crear cita

Reutiliza la misma lógica de inserción que `AdminBookingFlow` (función `handleCreateBooking`). Tras crear:
- Cierra el sheet.
- Toast de éxito.
- La cita aparece animada en el calendario (ya hay realtime).

## Archivos a tocar

- **Nuevo**: `src/components/admin/QuickBookingSheet.tsx` — el sheet de una pantalla.
- **Modificar**: `src/components/admin/LocalCalendarCRM.tsx`
  - Añadir overlay clicable en celdas vacías del grid horario.
  - Estado `quickBooking: { date, time, stylistSlug } | null` y render del sheet.
- **Reutilizar tal cual**: lógica de autocomplete de clientes, lista de servicios, función de creación de booking (extraer a hook `useCreateBooking` si hace falta para no duplicar).
- **Mantener intacto**: `AdminBookingFlow.tsx` (sigue siendo el flujo "Más opciones" / botón "+").

## Detalles UX importantes

- **Defaults estrictos**: como pediste, no asumimos servicio ni cliente. Solo precargamos lo que viene implícito del click (fecha + hora + columna de profesional).
- **Safe area iPhone**: sheet respeta `env(safe-area-inset-bottom)` y deja margen para la bottom nav.
- **Móvil primero**: el grid del calendario en móvil ya es estrecho; el área clicable debe ser ≥ 44px de alto para ser cómoda con el dedo.
- **Conflictos**: si el hueco resulta no estar libre (ya hay cita), el botón "Crear cita" se deshabilita con aviso.
- **Click vs drag**: si en el futuro hay drag-to-create (arrastrar para definir duración), este click es el caso simple; el drag sería complementario.

## Lo que NO entra en este plan

- Drag de servicio sobre hueco (lo descartamos por ahora, click es suficiente).
- "Servicio favorito por cliente" / defaults inteligentes (rechazado explícitamente).
- Rediseñar el flujo largo `AdminBookingFlow` — se mantiene como fallback.

## Resultado esperado

De **4 pasos + búsqueda manual** → a **1 click en el hueco + 2 selects en un sheet**. Crear una cita debería pasar de ~30s a ~5-8s.
