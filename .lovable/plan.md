
# Plan: Centro de Formacion y Contenido para Profesionales

## Resumen
Crear dos nuevas funcionalidades en el panel de admin: (1) un **sistema de onboarding guiado por pasos** que acompane al profesional en sus primeras semanas, y (2) una nueva seccion **"Contenido"** donde pueda generar tarjetas con QR, material de marketing y ver su progreso/ROI.

## Arquitectura

Se anade una nueva tab **"Contenido"** al panel de admin (7 tabs total) y se mejora el dashboard con un **checklist de progreso** para nuevos usuarios.

```text
TenantAdmin tabs (actual → nuevo):
  dashboard | agenda | business | team | communication | settings
                                                          ↓
  dashboard | agenda | business | content | team | communication | settings
```

## Cambios detallados

### 1. Nueva seccion "Contenido" (`src/components/admin/sections/ContentSection.tsx`)
Tab con 3 sub-pestanas:

- **Marketing**: Generador de tarjetas con QR code apuntando a `glowapp.app/{slug}`. El usuario puede:
  - Generar tarjeta de visita digital con logo, nombre, QR y eslogan
  - Descargar en PNG/PDF para imprimir
  - Elegir entre 3-4 plantillas de diseno
  - Usar libreria `qrcode` (npm) para generar el QR en canvas

- **Formacion**: Checklist interactivo con videos/guias de cada herramienta:
  - Configurar agenda y servicios
  - Realizar primer cobro en caja
  - Enviar primer mensaje a cliente
  - Publicar primer post
  - Revisar analytics de la primera semana
  - Estado guardado en DB (tabla `tenant_onboarding_progress`)

- **ROI**: Panel simplificado que muestra:
  - Ingresos generados desde el registro
  - Citas gestionadas vs no-shows evitados
  - Estimacion del ahorro de tiempo
  - Comparativa con el coste del plan

### 2. Checklist de bienvenida en Dashboard (`AdminDashboard.tsx`)
- Anadir un componente `OnboardingChecklist` al dashboard que aparece solo si el tenant tiene < 30 dias
- Muestra progreso: "3/7 pasos completados"
- Cada paso lleva a la seccion correspondiente
- Se puede descartar permanentemente

### 3. Tabla nueva: `tenant_onboarding_progress`
```sql
CREATE TABLE tenant_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL UNIQUE,
  steps_completed JSONB DEFAULT '{}',
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: solo el admin del tenant puede leer/escribir
```

### 4. Registrar la tab en `TenantAdmin.tsx`
- Anadir `"content"` al tipo `TabValue`
- Anadir icono `Palette` o `FileImage` a navItems
- Renderizar `<ContentSection tenantId={tenant.id} tenantSlug={tenant.slug} />`

### 5. Actualizar `sections/index.ts`
- Exportar `ContentSection`

### 6. Actualizar InteractiveTour y HelpTutorial
- Anadir paso para la seccion "Contenido"

## Archivos a crear
- `src/components/admin/sections/ContentSection.tsx` — Componente principal con tabs
- `src/components/admin/content/QRCardGenerator.tsx` — Generador de tarjetas QR
- `src/components/admin/content/TrainingChecklist.tsx` — Checklist de formacion
- `src/components/admin/content/ROICalculator.tsx` — Panel de retorno de inversion
- `src/components/admin/OnboardingChecklist.tsx` — Widget de progreso en dashboard

## Archivos a modificar
- `src/pages/TenantAdmin.tsx` — Nueva tab "content"
- `src/components/admin/sections/index.ts` — Export
- `src/components/admin/AdminDashboard.tsx` — Integrar checklist
- `src/components/admin/InteractiveTour.tsx` — Nuevo paso
- `src/components/admin/HelpTutorial.tsx` — Nueva seccion de ayuda

## Dependencia npm
- `qrcode` (ligera, genera QR en canvas/SVG sin servidor)

## Migracion SQL
- Crear tabla `tenant_onboarding_progress` con RLS
