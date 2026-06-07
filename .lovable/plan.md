## Objetivo

Aplicar el lenguaje visual del handoff (Plus Jakarta Sans, tarjetas planas con `--shadow-xs`, KPIs limpias, sub-tabs tipo pill, agenda timeline pro, sidebar desplegable + bottom-nav móvil con "Más") a todo el panel admin. **Cero cambios funcionales**: se mantienen hooks, queries, RLS, permisos, props y rutas internas. Solo cambia markup presentacional, clases Tailwind, tokens CSS y la arquitectura de información.

Paleta actual `#22408b` (azul marca) y `#99329a` (acento púrpura) **se mantienen** — solo se sustituye el indigo del prototipo por estos tokens existentes. Liquid Glass se desactiva en el panel admin (la app pública/feed conservan su estética).

## Arquitectura de información — migración a 7 secciones

Estado actual (5 secciones):
```
Inicio (resumen/actividad/agenda/caja/espera/pedidos) · Clientes · Catálogo · Marketing · Negocio
```

Estado objetivo (7 secciones):
```
Inicio    → resumen · actividad
Agenda    → día · semana · espera
Caja      → cobros · pedidos · cierre
Clientes  → directorio · mensajes
Catálogo  → servicios · productos · paquetes
Marketing → posts · promos · reseñas · qr
Negocio   → equipo · informes · ajustes
```

Movimientos:
- **Agenda** y **Caja** salen de Inicio como secciones top-level.
- **Espera** pasa de Inicio a Agenda.
- **Pedidos** pasa de Inicio a Caja.
- **Cierre** se añade como sub-tab nueva dentro de Caja (vista de arqueo del día — UI nueva, datos ya existentes en cash_register).
- **Promos** pasa de Catálogo a Marketing.
- **Reseñas** pasa de Clientes a Marketing.
- **Semana** se añade como sub-tab nueva en Agenda (tablero 7 columnas reutilizando `LocalCalendarCRM`).
- Mensajes mantiene su sitio en Clientes **y** se añade icono global en topbar con badge.

`LEGACY_NAV_MAP` se amplía para que cualquier link viejo (`/admin/x/inicio/caja`, `/admin/x/clientes/resenas`, etc.) redirija a la nueva ruta. Los slugs internos de rutas se mantienen; solo cambia dónde vive cada sub-tab.

## Sistema de diseño (tokens)

Nuevo bloque en `src/index.css` dentro de `@layer base` bajo selector `.gp-admin` (scoped al panel para no afectar landing/feed/tenant):

```css
.gp-admin {
  --gp-bg: oklch(0.98 0.006 265);
  --gp-card: #ffffff;
  --gp-card-2: oklch(0.985 0.004 265);
  --gp-ink: oklch(0.24 0.02 265);
  --gp-ink2: oklch(0.45 0.02 265);
  --gp-muted: oklch(0.62 0.015 265);
  --gp-line: oklch(0.925 0.007 265);
  --gp-line2: oklch(0.955 0.004 265);
  --gp-chip: oklch(0.968 0.006 265);
  --gp-accent: #22408b;           /* paleta actual conservada */
  --gp-accent-ink: #1a3270;
  --gp-accent-soft: color-mix(in oklab, #22408b, white 88%);
  --gp-accent-softer: color-mix(in oklab, #22408b, white 94%);
  --gp-purple: #99329a;
  --gp-ok: oklch(0.62 0.15 150); --gp-ok-soft: oklch(0.95 0.04 150);
  --gp-warn: oklch(0.72 0.15 65); --gp-warn-soft: oklch(0.96 0.05 75);
  --gp-danger: oklch(0.62 0.2 25); --gp-danger-soft: oklch(0.96 0.04 25);
  --gp-info: oklch(0.62 0.13 230); --gp-info-soft: oklch(0.95 0.04 230);
  --gp-r-sm: 10px; --gp-r: 14px; --gp-r-lg: 18px; --gp-r-xl: 22px;
  --gp-shadow-xs: 0 1px 2px rgba(20,22,40,.05);
  --gp-shadow: 0 1px 2px rgba(20,22,40,.04), 0 10px 30px -16px rgba(20,22,40,.18);
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  background: var(--gp-bg);
  color: var(--gp-ink);
}
```

Plus Jakarta Sans vía `<link>` en `index.html`. Clases reusables `@layer components`: `.gp-card`, `.gp-kpi`, `.gp-pill`, `.gp-badge-{ok,warn,danger,info}`, `.gp-subtab` (ya existe — se mejora), `.gp-chip`, `.gp-row`. Color por persona: helper `hashHueFromName(name)` → `oklch(L C hue)` (ya existe parcialmente en stylists).

## Shell de navegación

`src/pages/TenantAdmin.tsx` + `src/components/admin/layout/`:
- **AdminShell** nuevo wrapper que envuelve el panel con `<div className="gp-admin">` y aplica grid `sidebar | (topbar + main + bottomnav)`.
- **Desktop (≥920px):** sidebar fijo 252px con logo, 7 secciones; al hacer click en una sección se despliega su sub-nav anidada bajo el item (lista indentada con borde-guía izquierdo). Pie con avatar + plan.
- **Móvil (<920px):** sidebar oculto → **bottom-nav** con 4 secciones principales (Inicio, Agenda, Caja, Clientes) + botón **"Más"** que abre `Sheet` con Catálogo · Marketing · Negocio. Sub-tabs van en tira de pills sticky bajo la topbar (componente `AdminSubNav` ya existe — se reestiliza).
- **Topbar:** breadcrumb + título subsección, buscador global (existente), icono IA, campana con badge (existente), icono Mensajes con badge no-leídos (nuevo, link a `/clientes/mensajes`), botón "Nueva cita".

`AdminSubNav.tsx` se actualiza con las 7 secciones nuevas. `LEGACY_NAV_MAP` mapea claves antiguas.

## Componentes a reestilizar (solo CSS/markup)

| Componente | Cambios |
|---|---|
| `AdminDashboard.tsx` (Resumen) | KPI cards con `.gp-kpi` (icono cuadrado *-soft, valor 27px/800, delta), grid 4→2→1 |
| `ActivitySection.tsx` | Lista de eventos con `.gp-row`, iconos coloreados por tipo, timestamps relativos |
| `LocalCalendarCRM.tsx` | Ya rediseñado en pasos previos — solo mover a tokens `--gp-*` y aplicar `.gp-card` al contenedor. Vista Semana nueva (7 columnas, mismo render de citas pero compacto) |
| `WaitlistManager`, `ProductOrdersManager`, `CashRegisterManager` | `.gp-card`, `.gp-row`, badges `.gp-badge-*`. Nuevo subtab "Cierre" en Caja con arqueo del día |
| `ClientsManager`, `ConversationList`, `ChatWindow` | Listas con avatares + métricas derecha + chevron, en móvil colapsa columnas |
| `MarketingSection` | Añade subtab Promos y Reseñas (movidos), mantiene Posts y QR |
| `CatalogSection` | Elimina subtab Promos (movida a Marketing) |
| `TeamSection`, `ReportsSection`, `SettingsSection` | Tarjetas planas, formularios con `.gp-card` y inputs reestilizados |
| Botones primarios | `bg-[--gp-accent] text-white rounded-[11px]` (mantiene shadcn) |
| Sheets/Drawers | Header con degradado del color de persona, stats 3 cols, acciones abajo |

## Reglas críticas

- **Animaciones**: estado de reposo siempre `opacity: 1`. Para framer-motion, `initial={{ y: 8 }}` + `animate={{ y: 0 }}` (sin opacity en initial) o respeta `prefers-reduced-motion`.
- **Safe areas iOS**: el bottom-nav respeta `env(safe-area-inset-bottom)`; modales mantienen `pb-[72px]` (memoria existente).
- **Móvil-first**: hit targets ≥44px, texto ≥12px, importes con `&nbsp;` antes de `€` y `tabular-nums`.
- **Sin tocar**: `LocalCalendarCRM` lógica de solape (memoria reciente), `QuickBookingSheet` (memoria reciente), `usePlanLimits`, `LockedFeature`, hooks Supabase, edge functions.

## Plan de ejecución (commits pequeños, verificable)

1. **Tokens + fuente + shell**: index.css, index.html, AdminShell, sidebar desplegable, bottom-nav con "Más", topbar con Mensajes global.
2. **Navegación**: AdminSubNav con 7 secciones, LEGACY_NAV_MAP ampliado, App.tsx routes, TenantAdmin.tsx renderContent.
3. **Inicio**: AdminDashboard + ActivitySection re-skin.
4. **Agenda**: reestiliza container, añade vista Semana, mueve Espera aquí, mueve Caja/Pedidos fuera.
5. **Caja**: sección top-level con Cobros · Pedidos · Cierre (nuevo).
6. **Clientes**: lista re-skin, mueve Reseñas fuera.
7. **Catálogo**: re-skin, mueve Promos fuera.
8. **Marketing**: añade Promos + Reseñas como subtabs.
9. **Negocio**: re-skin Equipo/Informes/Ajustes.
10. **QA visual** + verificación de rutas legacy + memoria actualizada.

## Lo que no entra en este plan
- Landing pública, feed, perfil cliente, tenant landing (mantienen Liquid Glass).
- Cambios de paleta global (se conserva #22408b / #99329a).
- Lógica de Caja "Cierre" más allá del UI sobre datos existentes.
- Lógica de Vista Semana — reutiliza el mismo componente de agenda en modo 7-col.
