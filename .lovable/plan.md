## Objetivo

Convertir la app en una experiencia "guiada al 100%" para profesionales senior y clientas mayores: nadie debería preguntarse "¿qué pulso ahora?" o "¿cómo salgo de aquí?".

Filosofía elegida (según tus respuestas):
- **Scroll automático + halo animado** sobre el siguiente CTA en cada paso.
- Mantener tamaños/tipografía actuales (no agrandamos).
- Aplicar a: panel admin (crear cita, agenda, ajustes), onboarding inicial del salón, y reserva de clienta.

## Piezas a construir

### 1. Sistema reutilizable `GuidedFlow` (nuevo)

Hook + componente único que se usará en todos los flujos por pasos. Componentes nuevos en `src/components/guided/`:

- **`GuidedStep.tsx`** — wrapper que envuelve cada paso de un flujo. Props: `isActive`, `ctaSelector` (data-attr del botón "siguiente"), `title?`, `helperText?`. Cuando se monta:
  1. Hace `scrollIntoView({ behavior: "smooth", block: "center" })` al contenedor.
  2. Aplica un halo pulsante (ring + animación `animate-pulse-glow` ya en `tailwind.config`) al elemento que matchea `[data-guided-cta="true"]` dentro de él.
  3. El halo se quita cuando el usuario interactúa con el CTA.

- **`GuidedHeader.tsx`** — header sticky superior (dentro de cada flujo/modal) con:
  - Botón "Salir" (X grande con texto "Salir") siempre visible a la izquierda, `aria-label="Salir"`.
  - Título del paso actual ("Paso 2 de 4 · Elige profesional").
  - Mini barra de progreso.

- **`GuidedHelperBar.tsx`** — banda inferior fija (sticky bottom, encima de safe-area) con:
  - Texto "👉 {helperText}" del paso actual (ej. "Ahora pulsa **Continuar** para ver los horarios").
  - Botón secundario "Volver" + botón primario "Continuar" duplicado y siempre visible.
  - Esto resuelve "que se vea siempre dónde tocar".

- **`useScrollToActiveStep.ts`** — hook que dispara `scrollIntoView` cada vez que cambia el step.

- **`useHighlightCta.ts`** — hook que añade clase `guided-halo` al CTA del step activo y la quita al avanzar.

CSS nuevo en `index.css`:
```css
.guided-halo { @apply ring-4 ring-primary/60 ring-offset-2 ring-offset-background animate-pulse; }
```

### 2. Aplicarlo a flujos clave

**A. `AdminBookingFlow.tsx`** (crear cita desde panel admin):
- Envolver cada paso en `GuidedStep`.
- Marcar el botón "Continuar" / tarjeta de servicio principal con `data-guided-cta="true"`.
- Sustituir el header actual por `GuidedHeader` (mantiene los círculos 1-2-3-4 + progreso, pero añade botón Salir grande + título del paso).
- Añadir `GuidedHelperBar` con frases tipo:
  - Paso 1: "Toca los servicios de la cita y luego pulsa Continuar"
  - Paso 2: "Elige la profesional que atenderá"
  - Paso 3: "Selecciona día y hora libres en verde"
  - Paso 4: "Escribe nombre y teléfono y pulsa Confirmar cita"
- Auto-scroll al cambiar de paso.

**B. `AgendaSection.tsx` y `LocalCalendarCRM.tsx`**:
- Botón "Crear cita" siempre visible, grande, con halo si la agenda está vacía hoy.
- Cuando se abre un evento del calendario, mostrar `GuidedHelperBar` con "Toca **Cobrar** para registrar el pago, o **Cancelar cita** si no viene".
- Botones de la barra de acciones de la cita (`agenda-buttons-behavior` ya en memoria) con etiquetas siempre visibles, no solo iconos.

**C. `TenantSettings.tsx` (Ajustes)**:
- Sticky bottom bar con "Guardar cambios" siempre visible en lugar de un botón al final del formulario.
- Al pulsar "Cambiar foto", scroll automático al área del cropper.
- Mensaje claro tras guardar ("✓ Cambios guardados correctamente") con scroll al top.

**D. Onboarding inicial del salón** (`OnboardingSetup.tsx` y pasos):
- Reusar `GuidedHeader` + `GuidedHelperBar` en cada paso (`BusinessInfoStep`, `ImagesStep`, `DesignStep`, etc.).
- Halo sobre el primer campo vacío de cada paso.
- Auto-scroll al primer error de validación.
- Botón "Salir y guardar borrador" visible arriba.

**E. Reserva de clienta** (`BookingFlow.tsx`, `ServiceSelection`, `StylistSelection`, `DateTimeSelection`, `BookingConfirmation`):
- Mismo `GuidedHeader` con "Paso X de 4" y botón "Salir" grande.
- `GuidedHelperBar` inferior con instrucción del paso ("Toca un horario en verde para reservarlo").
- Auto-scroll al primer hueco disponible cuando cargan los horarios.
- Tras confirmar, scroll automático al mensaje de éxito.

### 3. "No bordes que no salgan"

Auditar y arreglar:
- Todos los `Dialog`/`Sheet`/modales del panel admin: garantizar botón cerrar (X) **fijo en la esquina superior derecha**, tamaño mínimo 44x44, etiqueta "Cerrar" visible.
- En móvil, los modales fullscreen deben tener un botón "← Volver" sticky arriba.
- Componente `EscapeButton` reutilizable.

## Archivos afectados (resumen)

**Nuevos**:
- `src/components/guided/GuidedStep.tsx`
- `src/components/guided/GuidedHeader.tsx`
- `src/components/guided/GuidedHelperBar.tsx`
- `src/components/guided/EscapeButton.tsx`
- `src/hooks/useScrollToActiveStep.ts`
- `src/hooks/useHighlightCta.ts`

**Editados** (esta primera tanda — panel admin):
- `src/components/admin/AdminBookingFlow.tsx`
- `src/components/admin/sections/AgendaSection.tsx`
- `src/components/admin/LocalCalendarCRM.tsx`
- `src/components/admin/TenantSettings.tsx`
- `src/index.css` (clase `.guided-halo`)

**Editados** (segunda tanda — onboarding y reserva):
- `src/pages/OnboardingSetup.tsx`
- `src/components/onboarding/*Step.tsx` (los 4-5 principales)
- `src/components/booking/BookingFlow.tsx`
- `src/components/booking/ServiceSelection.tsx`
- `src/components/booking/DateTimeSelection.tsx`
- `src/components/booking/BookingConfirmation.tsx`

## Plan de entrega

1. **Tanda 1**: sistema `GuidedFlow` + aplicarlo a `AdminBookingFlow` (mayor impacto inmediato — crear cita es la acción más usada).
2. **Tanda 2**: agenda + ajustes del panel.
3. **Tanda 3**: onboarding inicial.
4. **Tanda 4**: reserva pública de clienta.

Si lo prefieres, podemos hacerlo todo de golpe, pero recomiendo entregar tanda a tanda para que valides el patrón en `AdminBookingFlow` antes de propagarlo.

## Notas técnicas

- Sin cambios de BD ni edge functions.
- Sin nuevas dependencias.
- Usar `scrollIntoView` nativo + Tailwind `animate-pulse` para el halo (ya disponibles).
- Respetar safe-areas (memoria `safe-area-global-implementation`): `GuidedHelperBar` con `padding-bottom: env(safe-area-inset-bottom)`.
- Mobile-first siempre (tu preferencia de proyecto).
