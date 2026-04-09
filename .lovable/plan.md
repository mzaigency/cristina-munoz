

# Plan: Mejoras en Tarjetas QR, Formación y reorganización de secciones

## Resumen de cambios

5 problemas a resolver:
1. **Tarjetas QR**: usar logo, colores y fuentes del salón + añadir 3 plantillas más (total 7)
2. **QR y texto borroso en descarga**: el canvas es 600x400 — demasiado bajo. Subir a 1200x800 (2x) y generar QR a 400px
3. **Formación y ROI fuera de Contenido**: mover a Dashboard (como sub-secciones del dashboard principal)
4. **Stories → Posts**: cambiar el paso "Publica tu primer Story" a "Publica tu primer Post"
5. **Navegación de formación**: cada paso debe navegar a la pestaña Y sub-pestaña correcta

## Cambios por archivo

### 1. `src/components/admin/content/QRCardGenerator.tsx`
- Fetch adicional: `primary_color`, `secondary_color`, `font_heading`, `font_body` del tenant
- Cargar Google Fonts en canvas via `FontFace` API antes de dibujar
- Añadir logo del salón en la tarjeta (cargar imagen con `new Image()`)
- **Canvas 1200x800** (2x resolución) para descarga nítida
- **QR generado a 400px** en vez de 200px
- 3 plantillas nuevas usando colores del salón:
  - `"salon"` — usa primary_color como fondo + fuente del salón
  - `"gradient"` — gradiente primary→secondary
  - `"glass"` — fondo blanco con bordes glassmorphism y acentos del salón
- Template `"brand"` ahora usa el primary_color real del tenant (no hardcoded `#8B5CF6`)

### 2. `src/components/admin/sections/ContentSection.tsx`
- Eliminar tabs de Formación y ROI
- Solo queda el QRCardGenerator (renombrar a "Marketing" sin tabs)

### 3. `src/components/admin/AdminDashboard.tsx`
- Integrar `TrainingChecklist` y `ROICalculator` como secciones del dashboard
- Formación visible para tenants < 30 días (ya existe `OnboardingChecklist`)
- ROI visible siempre como card colapsable

### 4. `src/components/admin/content/TrainingChecklist.tsx`
- Cambiar "Publica tu primer Story" → "Publica tu primer Post" (id: `first_post`)
- Icono: `ImagePlus` en vez de `Camera`
- **Navegación precisa con sub-tabs**:
  - `services` → navegar a `team` + `sessionStorage.setItem('openTeamSubTab', 'services')`
  - `first_booking` → `agenda` (correcto)
  - `cash_register` → `business` + `sessionStorage.setItem('openBusinessSubTab', 'cash')`
  - `first_message` → `communication` (correcto)
  - `first_post` → `communication` (correcto, posts están ahí)
  - `review_analytics` → `business` + `sessionStorage.setItem('openBusinessSubTab', 'stats')`
- `onNavigate` pasa un objeto `{ tab, subTab }` en vez de solo string

### 5. `src/pages/TenantAdmin.tsx`
- Actualizar `onNavigate` del dashboard para aceptar sub-tab y guardarlo en sessionStorage
- `TeamSection` y `BusinessSection` deben leer sessionStorage al montar para abrir la sub-tab correcta

### 6. `src/components/admin/sections/TeamSection.tsx`
- Al montar, leer `sessionStorage.getItem('openTeamSubTab')` y abrir esa sub-tab

### 7. `src/components/admin/sections/BusinessSection.tsx`
- Ya lee `openCashTab` — extender para leer `openBusinessSubTab` genérico

## Sin migraciones SQL necesarias

