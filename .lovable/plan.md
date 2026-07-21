
# Rediseño móvil integral — 4 zonas críticas

Objetivo: que las 4 pantallas donde Laura (dueña) y sus clientas pasan más tiempo se sientan **app nativa**, no web adaptada. Prioridad iPhone estrecho (375px), safe areas siempre, pulgar cómodo.

Orden de implementación por impacto sobre conversión y uso diario:

---

## 1. Booking Flow móvil (`ServiceSelection`, `DateTimeSelection`, `BookingSummaryMobile`)

**Problemas actuales**
- 4 pasos con `BookingSummaryMobile` fijo abajo (z-9999) que **pisa el CTA "Continuar"** de cada paso.
- El resumen expandible ocupa demasiado alto cuando tiene 3+ servicios → tapa el calendario.
- Grid de servicios en 2 columnas con tarjetas altas: mucho scroll para ver 5-6 servicios.
- `DateTimeSelection`: días de la semana en fila horizontal apretada + slots en grid 3-col con targets <44px.
- Progress "Paso X de 4" está duplicado (arriba y dentro del summary).

**Rediseño**
- **Header sticky compacto** (56px): back + título del paso + progress bar fino (4 segmentos, 3px alto). Elimina el "Paso X de 4" duplicado.
- **BookingSummaryMobile como barra minimal** (56px colapsado): solo total + duración + CTA primario del paso (Continuar/Confirmar). El CTA vive DENTRO de la barra → un solo elemento fijo, no dos capas superpuestas. Sheet expandible tira hacia arriba para ver detalle.
- **Selector de servicios**: lista vertical con filas compactas (72px alto, checkbox táctil grande a la derecha, precio + duración a la izquierda del check). Categorías como chips sticky arriba si hay >1 categoría.
- **DateTimeSelection**: 
  - Selector de día = carrusel horizontal snap-scroll (7 días visibles a la vez, chip 56×64px con día + número).
  - Slots en 2 columnas (no 3) con altura 48px, tipografía 16px, estados claros (disponible/lleno/seleccionado).
  - Sticky "Mañana / Tarde / Noche" como segmented control arriba de la grilla.
- **Confirmación (paso 4)**: ver sección 2.

**Safe areas**: barra inferior con `pb-[env(safe-area-inset-bottom)]`. Header con `pt-[env(safe-area-inset-top)]` solo si es fullscreen (no en overlay).

---

## 2. BookingConfirmation móvil

**Problemas actuales**
- Card grande con logo del salón + resumen + formulario apilado → 2 scrolls hasta el botón.
- Formulario de teléfono (cuando falta) aparece como bloque inline sin jerarquía diferenciada.
- CTA "Confirmar reserva" se pierde bajo el `BookingSummaryMobile` fijo.

**Rediseño**
- **Layout de una pantalla sin scroll** en iPhone 13+ (390×844):
  - Header: "Confirma tu cita" + salón (avatar 32px + nombre).
  - Resumen compacto en 1 tarjeta: fecha + hora grande (24px), servicios en línea separados por •, duración total + precio total a la derecha.
  - Datos del cliente: 2-3 campos con labels flotantes (nombre readonly, teléfono si falta, notas opcional colapsable).
  - CTA gigante primario abajo (dentro de la barra sticky, no bookbar duplicado).
- **Estado "falta teléfono"**: no bloquea, aparece como campo requerido inline con hint claro "Necesitamos tu móvil para recordarte la cita".
- Éxito: `SuccessCelebration` fullscreen ya existe, mantenerlo.

---

## 3. Agenda móvil (panel admin) — `AgendaView` móvil

**Problemas actuales** (dolor diario de Laura, una mano, entre clientas)
- Vista día muestra columnas por estilista → en móvil se ven medias columnas y hay scroll horizontal.
- Citas de <30min quedan visualmente aplastadas.
- Botón "Nueva cita" flotante compite con la bottom-nav.
- No hay salto rápido a "ahora".

**Rediseño**
- **Vista día = una sola columna cronológica** (agrupa multi-estilista con badge de color del pro). Multi-pro solo en tablet+.
- **Timeline vertical densa**: bloques con hora izquierda (48px ancho), cita a la derecha, color del estilista en la barra izquierda del bloque. Mínimo 56px de alto por cita.
- **Header sticky**: fecha grande + swipe horizontal para cambiar día + botón "Hoy" cuando no estás en hoy.
- **Línea "ahora"** roja fina cruzando el timeline, con auto-scroll al abrir.
- **FAB "+"** con `bottom: calc(80px + env(safe-area-inset-bottom))` para no chocar con nav.
- **Long-press en cita** → sheet de acciones (cobrar, reprogramar, cancelar). Tap simple → detalle.

---

## 4. Landing de tenant en móvil

**Problemas actuales**
- Hero: Playfair italic + gradiente de marca + foto pelean. En 375px se amontonan.
- `TenantBookBar` fija abajo se solapa con safe-area/nav.
- Secciones sin ritmo: servicios, equipo, galería y reseñas tienen todas el mismo peso visual.

**Rediseño**
- **Hero**: foto full-bleed 100vh con overlay gradient bottom, título editorial (una sola tipografía, no mezclar Playfair + gradiente), CTA único centrado abajo del hero (no en la bookbar duplicado). Nombre del salón + categoría + ciudad como metadata pequeña sobre el título.
- **TenantBookBar**: solo aparece al hacer scroll pasado el hero (evita duplicar CTA). `pb-[env(safe-area-inset-bottom)]` fijo.
- **Jerarquía de secciones**: Servicios (primero, denso), Equipo (carrusel horizontal), Galería (grid 2-col), Reseñas (carrusel). Cada sección con `SectionHeader` unificado.
- **Servicios en móvil**: lista vertical (no grid), fila 72px con nombre + duración + precio. Tap → añadir a reserva.

---

## Sistema compartido (crear una vez, usar en las 4 zonas)

- Componente `MobileStickyBar` con slot para CTA y safe-area. Reemplaza `BookingSummaryMobile` inferior + `TenantBookBar` + botones flotantes duplicados.
- Componente `MobilePageHeader` con back + título + progress opcional + safe-area top.
- Tokens: espaciados táctiles (`--tap-min: 44px`), altura de barras (`--bar-h: 56px`), z-index unificado (nav: 40, sticky-bar: 50, overlay: 80, modal: 100).

---

## Fuera de alcance de este plan
- No se toca lógica de negocio (edge functions, RLS, hooks de datos).
- No se rediseña desktop (queda intacto).
- No se cambian tipografías ni paleta globales.

---

## Detalles técnicos

**Archivos que se tocarán:**
- `src/components/booking/ServiceSelection.tsx` — lista móvil
- `src/components/booking/DateTimeSelection.tsx` — carrusel días + slots 2-col
- `src/components/booking/BookingSummaryMobile.tsx` — barra minimal con CTA integrado
- `src/components/booking/BookingConfirmation.tsx` — layout una pantalla
- `src/components/admin/agenda/*` (identificar el componente móvil actual)
- `src/pages/TenantLanding.tsx` + `src/components/tenant/*` (hero, bookbar, secciones)
- Nuevos: `src/components/mobile/MobileStickyBar.tsx`, `src/components/mobile/MobilePageHeader.tsx`

**Verificación:**
- Playwright viewport 390×844 (iPhone 13) + 375×667 (iPhone SE) para cada pantalla.
- Contraste AA en todos los textos sobre gradiente/foto.
- `prefers-reduced-motion` respetado.

---

## Orden de ejecución sugerido
1. Sistema compartido (`MobileStickyBar`, `MobilePageHeader`, tokens).
2. Booking Flow (pasos 1-3) + Confirmation (paso 4) — el flujo completo de una tacada.
3. Agenda admin móvil.
4. Landing tenant móvil.

¿Apruebas este alcance o quieres recortar/reordenar antes de que lo implemente?
