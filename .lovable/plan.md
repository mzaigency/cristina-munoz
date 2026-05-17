
# Pulido del módulo Informes (Admin → Negocio → Informes)

Mantenemos los 4 subtabs (Stats · Feed · Objetivos · Reportes). Solo tocamos **Stats** y **Reportes**. Feed y Objetivos quedan como están.

---

## 1. Stats — unificar y reforzar

**Archivo principal:** `src/components/admin/BusinessStats.tsx`

### 1.1 Eliminar los 4 sub-sub-tabs internos
Quitamos el `<Tabs>` interno (`overview / stylists / services / clients`, líneas ~527-545 y su contenido). Pasamos a **una sola vista vertical** organizada por bloques con jerarquía clara, todo filtrado por `tenantId` (ya lo está, pero auditamos cada query para garantizarlo).

### 1.2 Estructura nueva (scroll único, mobile-first)
Selector de período arriba (`7 días / Este mes / Trimestre`) → ya existe.

Bloques en orden:

1. **KPIs principales (grid 2×2 en mobile, 4×1 en desktop)** — los actuales:
   - Ingresos · Ticket medio · Reservas · Valoración
   - Cada uno con `% vs período anterior`.
2. **Citas nuevas hoy (NUEVO bloque destacado)** — card con desglose por canal:
   - Total · Vía Admin (canal=`crm`) · Vía Web (canal=`web`/`whatsapp`/null)
   - Mini bar comparativa visual.
   - Esta misma métrica se replica en el Dashboard (ver §3).
3. **Objetivo del mes** (si existe) — barra de progreso + proyección. Ya existe, se mantiene.
4. **Evolución de ingresos** — AreaChart actual.
5. **Métodos de pago + Resumen rápido** (propinas, descuentos, transacciones, media/día) — grid 2 columnas.
6. **Equipo: Ingresos por estilista** — PieChart + leyenda con %. Es la vista que más valor aporta del antiguo tab "Equipo".
7. **Top servicios** — lista compacta top 8 con ingresos + nº de veces realizado (BarChart horizontal o lista con barra de progreso).
8. **Clientes** — 4 mini-KPIs en línea: Total · Nuevos este mes · Recurrentes · Retención %. Sin tab propio.
9. **Horas pico** — BarChart por hora (se mantiene).

### 1.3 Métricas nuevas que tienen sentido añadir
- **Tasa de cancelación** (cancelled / total bookings) → mini-KPI en la card de Reservas.
- **% reservas online vs CRM** del período → ya tenemos los datos en `bookingStats.channels`, lo exponemos como barra dual debajo de la KPI de Reservas.
- **Mejor día / mejor hora** del período → texto resumen sobre Horas Pico ("Tu mejor día: jueves · Hora estrella: 18:00").

### 1.4 Auditoría tenant_id
Recorremos cada `fetch*Stats()` en `BusinessStats.tsx` (líneas 145-411) y confirmamos `.eq("tenant_id", tenantId)` en todas las consultas a `transactions`, `bookings`, `monthly_goals`, `clients`, `reviews`, `tenant_stylists`. Ya están filtradas; lo dejamos explícito y añadimos comentario para futuras métricas.

---

## 2. Reportes (PDF) — rediseño profundo con identidad GlowApp

**Archivo:** `src/components/admin/PDFReportsGenerator.tsx`

### 2.1 Problemas actuales
- HTML básico color violeta plano `#8B5CF6` (no coincide con marca `#22408b` + `#99329a`).
- No tiene logo, no respira identidad GlowApp.
- Sin gráficos, solo tablas.
- Solo 3 plantillas, ninguna realmente útil para imprimir o compartir con socio/asesoría.

### 2.2 Rediseño visual
- **Header** con logo GlowApp + nombre del salón + período + fecha generación.
- **Paleta de marca:** gradiente `#22408b → #99329a` en headers de sección y barras.
- Tipografía limpia (system-ui), jerarquía clara, mucho whitespace.
- Tarjetas KPI grandes con iconos SVG inline.
- **Mini-gráficos SVG inline** (no recharts, demasiado pesado para print): barras horizontales para top servicios y estilistas; sparkline simple para evolución diaria.
- Footer con `glowapp.app` y nº de página.
- Print-optimized: márgenes A4, page-break entre secciones, sin sombras.

### 2.3 Plantillas reorganizadas (4 informes, no 3)
1. **Resumen mensual ejecutivo** — un PDF "todo en uno" para el dueño/asesor: KPIs, evolución, métodos de pago, top servicios, top estilistas, comparativa mes anterior.
2. **Productividad por estilista** — detalle por profesional: servicios, ventas, propinas, ticket medio, ranking, comisiones estimadas (si activas).
3. **Servicios y catálogo** — top servicios, peor desempeño, servicios sin ventas, mix de categorías.
4. **Informe para asesoría / fiscal (NUEVO)** — desglose por días con totales en efectivo, tarjeta, IVA estimado, propinas. Pensado para imprimir y entregar al gestor.

### 2.4 Selector de período mejorado
Además del selector mensual actual, añadimos: **Personalizado (rango de fechas)** y **Trimestre actual / anterior**.

---

## 3. Dashboard — métrica "Citas nuevas hoy"

**Archivo:** `src/components/admin/AdminDashboard.tsx` (interface `DashboardStats` línea 36)

Actualmente `todayBookings` cuenta las citas **del día** (campo `Fecha`). Añadimos una **métrica distinta**: citas **creadas hoy** (`created_at` ≥ inicio del día), desglosadas por canal:

- `newBookingsTodayTotal`
- `newBookingsTodayCrm` (canal = `'crm'`)
- `newBookingsTodayWeb` (canal in `('web','whatsapp')` o NULL)

Se renderiza como una card destacada en el grid superior del dashboard, con el desglose 50/50 (Admin · Web) y un pequeño indicador de tendencia vs ayer.

---

## Detalles técnicos

- **Stats:** todas las queries ya usan `.eq("tenant_id", tenantId)`. Auditamos línea por línea y añadimos test manual con dos tenants para verificar aislamiento.
- **Canal web** sigue la convención del edge function `get-bookings-stats`: `canal IN ('web','whatsapp') OR canal IS NULL`.
- **PDF:** seguimos usando `window.open` + `print()` (no añadimos dependencia pesada). El HTML generado pasa a ser un template modular con helpers (`renderKPI`, `renderBar`, `renderTable`).
- **Mobile safety zones:** las cards del dashboard mantienen el padding actual y el `pb-safe` global.
- **Sin cambios de BD ni de RLS.** Solo frontend.

## Archivos a modificar

```text
src/components/admin/BusinessStats.tsx        (refactor vista única + métricas nuevas)
src/components/admin/PDFReportsGenerator.tsx  (rediseño completo + 4ª plantilla)
src/components/admin/AdminDashboard.tsx       (nueva métrica "citas nuevas hoy" por canal)
```

## Fuera de alcance
- TenantFeedAnalytics (Feed) — sin cambios.
- MonthlyGoals (Objetivos) — sin cambios.
- Estructura de subtabs de ReportsSection — sin cambios.
