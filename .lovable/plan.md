# Importador con IA: agenda + servicios desde foto

## Objetivo

Eliminar la fricción de migrar a GlowApp permitiendo al admin **subir fotos** de su agenda física (o de otra app) y de su lista de servicios/tarifas. La IA extrae los datos y un wizard los valida antes de crearlos en bloque.

---

## Dos importadores, un mismo patrón

### A) Importador de Agenda (citas existentes)
### B) Importador de Servicios (carta de precios / tarifa)

Comparten arquitectura, edge functions y componentes UI. Cambian prompt, schema de extracción y tabla destino.

---

## Flujo de usuario

```text
1. Entrada
   ├─ Onboarding: paso opcional "¿Tienes ya citas o servicios?"
   └─ Dashboard admin: banner dismissible "Importa tus datos en 2 minutos"
        │
        ▼
2. Selector: ¿Qué quieres importar?  [Citas]  [Servicios]
        │
        ▼
3. Pantalla de subida con GUÍA visual
   ┌──────────────────────────────────┐
   │  📷 Sube fotos claras de tu...   │
   │                                   │
   │  Para CITAS, asegúrate de que     │
   │  se vea:                          │
   │   ✓ Fecha visible (día/mes)       │
   │   ✓ Hora de cada cita             │
   │   ✓ Nombre del cliente            │
   │   ✓ Servicio (si lo apuntas)      │
   │                                   │
   │  Para SERVICIOS:                  │
   │   ✓ Nombre del servicio           │
   │   ✓ Precio                        │
   │   ✓ Duración (si la tienes)       │
   │                                   │
   │  💡 Tips:                         │
   │   • Buena luz, sin reflejos       │
   │   • Una página por foto            │
   │   • Hasta 10 fotos por importación│
   │                                   │
   │  [📸 Hacer foto]  [🖼️ Galería]   │
   └──────────────────────────────────┘
        │
        ▼
4. Procesamiento IA (loader con progreso)
   • Edge function `import-from-photos`
   • Lovable AI (google/gemini-2.5-pro vision)
   • Devuelve JSON estructurado vía tool calling
   • Campos faltantes = null/vacío (NUNCA inventa)
        │
        ▼
5. Wizard de revisión (editable)
   ├─ Cada fila con badge: ✓ completa | ⚠ faltan datos | ✗ descartar
   ├─ Edición inline de cualquier campo
   ├─ Match automático con clients/services existentes
   └─ Resumen al pie: X listas, Y con huecos, Z descartadas
        │
        ▼
6. Confirmación → batch insert
   • Citas: bookings con skip_availability_check=true, canal='imported'
   • Servicios: services nuevos
   • Clientes nuevos: se crean en clients
   • Toast con resumen + enlace a la sección
```

Si el plan es **Business**, en el paso 3 aparece además el botón **"Lo hacemos por ti gratis"** (Guante Blanco) que envía las fotos a soporte vía webhook n8n.

---

## Detalle de prompts IA

### Prompt para AGENDA (citas)

```
Eres un experto en digitalizar agendas de salones de belleza/peluquería.
Analiza la imagen y extrae TODAS las citas visibles.

REGLAS CRÍTICAS:
1. NUNCA inventes datos. Si un campo no está claro o no aparece, déjalo como null.
2. Extrae EXACTAMENTE lo que ves, sin asumir.
3. Para fechas: usa formato YYYY-MM-DD. Si solo ves "Lunes" o "15", deja date=null
   y pon la pista en raw_date_text.
4. Para horas: formato HH:MM 24h. Si ves "10" sin AM/PM, asume horario laboral
   (8:00-21:00) y elige el más probable. Si imposible saber, deja null.
5. Para clientes: extrae el nombre tal cual aparece. Si solo hay un mote o inicial,
   úsalo. Si no hay nombre legible, deja null.
6. Para servicios: usa palabras simples (corte, tinte, mechas, manicura...).
   Si solo hay un código o abreviatura, déjalo en raw_service_text.
7. Por cada fila incluye un campo confidence (0-1) según lo segura que estés.
8. Si la imagen no es una agenda, devuelve rows vacío y reason='not_an_agenda'.

Devuelve JSON con la estructura definida en la tool.
```

Schema (tool calling):
```json
{
  "rows": [{
    "date": "string|null",        // YYYY-MM-DD
    "time": "string|null",         // HH:MM
    "duration_minutes": "number|null",
    "customer_name": "string|null",
    "customer_phone": "string|null",
    "service_name": "string|null",
    "stylist_name": "string|null",
    "notes": "string|null",
    "raw_text": "string|null",     // texto original si algo no se pudo parsear
    "confidence": "number"          // 0-1
  }],
  "reason": "string|null"
}
```

### Prompt para SERVICIOS

```
Eres un experto en digitalizar cartas de servicios de salones.
Analiza la imagen y extrae TODOS los servicios visibles con su precio y duración.

REGLAS CRÍTICAS:
1. NUNCA inventes precios ni duraciones. Si no aparecen, déjalos null.
2. Extrae el NOMBRE tal cual aparece (puedes corregir mayúsculas/tildes obvias).
3. Precios: número en euros (sin símbolo). "25€" → 25. "Desde 30" → 30.
   Si hay rango "20-30", usa el menor y anota en notes "Desde 20€".
4. Duración: en minutos. "1h" → 60. "1h30" → 90. "30 min" → 30.
   Si no aparece, deja null (el admin la rellenará).
5. Categoría: agrupa con la cabecera de la sección si la ves
   (Corte, Color, Tratamientos, Manicura, etc.). Si no, deja null.
6. Confidence (0-1) por fila.
7. Si la imagen no es una carta de servicios, devuelve rows vacío.

Devuelve JSON con la estructura definida en la tool.
```

Schema:
```json
{
  "rows": [{
    "name": "string",              // requerido
    "price": "number|null",
    "duration_minutes": "number|null",
    "category": "string|null",
    "description": "string|null",
    "notes": "string|null",
    "confidence": "number"
  }]
}
```

**Modelo:** `google/gemini-2.5-pro` (vision + razonamiento + contexto largo). Fallback a `google/gemini-2.5-flash` si rate limit.

---

## Componentes React (mobile-first)

```
src/components/admin/import/
  ├── ImportEntryPoint.tsx        # Selector citas/servicios + guía visual
  ├── PhotoUploader.tsx           # input capture="environment", drag&drop, previews
  ├── ImportGuideCard.tsx         # Instrucciones "en la foto debe aparecer..."
  ├── ProcessingState.tsx         # Loader con progreso por imagen
  ├── ReviewBookingsTable.tsx     # Wizard de revisión de citas (cards en mobile)
  ├── ReviewServicesTable.tsx     # Wizard de revisión de servicios
  ├── ImportSummary.tsx           # Confirmación final con totales
  ├── WhiteGloveCTA.tsx           # Solo plan Business
  └── useAgendaImport.ts          # Hook orquestador
```

Diseño: Liquid Glass, safe areas iPhone, cards en móvil → tabla en desktop.

---

## Edge functions

### `extract-from-photos` (genérica)
- Input: `{ images: string[] (data URLs), mode: 'bookings'|'services', tenant_id }`
- Valida JWT + admin del tenant
- Por imagen: llama Lovable AI con el prompt y schema correspondiente (tool calling)
- Combina resultados, normaliza, devuelve `{ rows: [...], stats }`
- Maneja 429 / 402 con mensajes claros

### `commit-imported-bookings`
- Input: `{ tenant_id, rows: [...] }`
- Upsert clientes por teléfono normalizado o nombre+tenant
- Insert bookings (`skip_availability_check=true`, `canal='imported'`, `status='confirmed'`)
- Solo filas con date+time+customer_name no nulos; el resto se rechaza con motivo
- Devuelve `{ created_bookings, created_clients, skipped }`

### `commit-imported-services`
- Input: `{ tenant_id, rows: [...] }`
- Solo filas con `name` no nulo
- Insert en `services` con campos faltantes a null/0
- Devuelve `{ created_services, skipped }`

### `request-import-concierge` (solo Business)
- Sube fotos a bucket privado, dispara webhook n8n con metadata + URLs firmadas (24h)
- Email de confirmación al admin (Resend)

---

## Base de datos

```sql
-- Bucket privado
insert into storage.buckets (id, name, public)
values ('agenda-imports', 'agenda-imports', false);

-- RLS: solo el admin del tenant sube/lee sus archivos
-- path: {tenant_id}/{job_id}/{filename}

-- Auditoría opcional
create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  user_id uuid not null,
  mode text not null check (mode in ('bookings','services')),
  image_count int not null default 0,
  rows_extracted int not null default 0,
  rows_committed int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.import_jobs enable row level security;
-- Policy: admins del tenant ven los suyos

-- Marca para ocultar el banner
alter table public.tenant_settings
  add column if not exists imported_data_at timestamptz;
```

Cron: borrar archivos de `agenda-imports` con > 7 días.

---

## Integración UI

- **Onboarding**: nuevo paso opcional `ImportDataStep` antes de la generación AI. Botón "Saltar" prominente.
- **Dashboard admin**: banner dismissible (siguiendo patrón de `OnboardingChecklist`) que desaparece cuando `imported_data_at` está marcado o el admin lo cierra.
- **Acceso permanente**: subpestaña "Importar" dentro de Agenda y dentro de Catálogo (servicios).

---

## Consideraciones

- **Privacidad**: aviso visible antes de subir (datos personales de clientes), borrado automático a 7 días, bucket privado.
- **Coste IA**: máx 10 fotos/job; throttle 3 jobs/día en Free/Pro, ilimitado en Business.
- **Robustez**: si confidence < 0.5 → fila marcada en amarillo y forzada a revisar.
- **Campos faltantes**: nunca se inventan; el wizard los muestra vacíos para que el admin decida (rellenar, dejar en blanco, o descartar la fila).
- **Mobile-first**: cámara nativa iPhone, safe areas respetadas en todos los modales.

---

## Fuera de alcance (siguientes iteraciones)

- Importación CSV/Excel/.ics
- Sincronización continua con Google Calendar
- OCR offline en cliente
