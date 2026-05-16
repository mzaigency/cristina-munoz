## Problema

La barra de sub-tabs no es consistente entre secciones:

- **Inicio** (`/admin/:slug/inicio`) muestra el Dashboard sin ninguna pestaña secundaria; Agenda / Caja / Espera / Pedidos solo aparecen si se entra por URL.
- **Negocio** muestra directamente Equipo sin tabs para Informes / Ajustes.
- **Clientes / Catálogo / Marketing** sí muestran sus tabs internos, pero cada sección los pinta a su manera (estilos distintos, scroll diferente, sin badges).

El usuario quiere que en cada sección aparezcan **todos** los sub-tabs visibles y accesibles desde la cabecera.

## Solución

Crear una **sub-nav única** renderizada por `TenantAdmin` justo debajo del nav principal (sticky, debajo del header), alimentada por una definición central de sub-tabs por sección. Cada sección composite deja de pintar su propio `TabsList` y se vuelve solo "contenido".

### 1. Nueva definición central de sub-tabs

`src/components/admin/layout/adminSubNav.ts`:

```ts
export type AdminSubTab = {
  value: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "waitlist" | "orders" | "messages" | "reviews";
  lockedFeature?: "cash_register"; // muestra "Pro" + bloqueo
};

export const ADMIN_SUB_NAV: Record<SectionValue, AdminSubTab[]> = {
  inicio:   [resumen, agenda, caja(lock), espera(badge), pedidos(badge)],
  clientes: [directorio, mensajes(badge), resenas(badge)],
  catalogo: [services, products, packages, promos],
  marketing:[posts, qr, whatsapp],
  negocio:  [equipo, informes, ajustes],
};
```

### 2. Nuevo componente `AdminSubNav`

`src/components/admin/layout/AdminSubNav.tsx`:

- Sticky bajo el header (`top` calculado con `env(safe-area-inset-top)` + altura del header).
- Mobile-first: scroll horizontal con `ScrollArea`, chips compactos (icono + label corto), badge rojo con `NotifBadge` para pendientes, candado + "Pro" para `lockedFeature`.
- Subrayado animado con `framer-motion` (`layoutId="admin-subnav-underline"`).
- Recibe: `section`, `activeSubTab`, `counts` (waitlist, orders, messages, reviews), `lockedFeatures` (de `usePlanLimits`), `onSelect(subTab)`.

### 3. Cambios en `TenantAdmin.tsx`

- Importar y montar `<AdminSubNav>` dentro del `<header>`, debajo de `<nav>` principal (desktop) y debajo de la fila top (mobile).
- Calcular el `subTab` por defecto cuando la URL no lo trae (primer item de `ADMIN_SUB_NAV[activeSection]`).
- `onSelect={(t) => goToSection(activeSection, t)}` reutiliza el navegador existente.
- Pasar `counts` desde `notificationCounts` (que ya existe).

### 4. Simplificar las secciones composite

Eliminar `<TabsList>` interno de:

- `InicioSection`: ya no necesita lógica de tabs porque la sub-nav vive arriba; mantiene el switch `tab === "resumen"` → Dashboard, resto → AgendaSection con `subTab` mapeado. Sigue igual la lógica de mapeo `agenda/caja/espera/pedidos → calendar/cash/waitlist/orders`.
- `AgendaSection`: cuando recibe `subTab` controlado desde fuera, **ocultar** su `TabsList` propio (añadir prop `hideTabs`). Mantener `TabsContent` para que el `Tabs` siga gestionando el cambio interno.
- `ClientsSection`, `CatalogSection`, `MarketingSection`, `SettingsSection`: añadir prop `hideTabs` (o simplemente no renderizar `TabsList` cuando se pasa `subTab` desde el padre). El contenido por sub-tab ya está controlado por `subTab`.
- `NegocioSection`: ya no necesita switch interno extra; sigue mapeando `equipo|informes|ajustes` a los componentes hijos. Pero **importante**: `equipo` y `ajustes` tienen sus *propios* sub-sub-tabs (estilistas/horarios/comisiones y general/plan/alertas). Esos sub-sub-tabs **se mantienen dentro de la sección**, no se mueven a la sub-nav global (evitamos 3 niveles de nav). Eso significa que la sub-nav global solo va al nivel sección → sub-tab, no a sub-sub-tab.

### 5. Resultado visual

```text
┌──────────────────────────────────────────────────────┐
│ [logo] Cristina Muñoz       [?] | [avatar plan▾]     │  ← header
├──────────────────────────────────────────────────────┤
│ [Inicio] [Clientes] [Catálogo] [Marketing] [Negocio] │  ← nav principal
├──────────────────────────────────────────────────────┤
│ Resumen · Agenda · Caja🔒 · Espera•3 · Pedidos•1     │  ← sub-nav nueva
├──────────────────────────────────────────────────────┤
│ ...contenido...                                      │
└──────────────────────────────────────────────────────┘
```

## Detalles técnicos

- **Badges**: reutilizar `NotifBadge` con `variant="inline"` y mapping desde `notificationCounts` ya disponible en `TenantAdmin`.
- **Locked**: `usePlanLimits(tenantId).hasFeature("cash_register")` decide si se muestra candado. Click en bloqueado abre el flujo de upgrade existente (igual que hoy en AgendaSection).
- **Default sub-tab**: cuando se entra a una sección sin `subTab`, no se redirige la URL automáticamente (evitamos historial sucio); el `AdminSubNav` resalta el primer item y el componente hijo lo trata como default.
- **Mobile safe-area**: el sticky sub-nav suma su altura (~44px) al `paddingBottom` del main no se ve afectado; el `top` sticky usa la altura combinada del header. Probar en viewport iPhone para que no tape contenido.
- **Animación**: subrayado con `motion.div layoutId` para transición fluida al cambiar de sub-tab; respeta `prefers-reduced-motion`.
- **Accesibilidad**: `role="tablist"`, `aria-selected`, `aria-label` con conteo de pendientes en cada tab.

## Archivos

- **Nuevo**: `src/components/admin/layout/adminSubNav.ts` (config), `src/components/admin/layout/AdminSubNav.tsx` (UI).
- **Editar**: `src/pages/TenantAdmin.tsx` (montar sub-nav + pasar counts/locks).
- **Editar**: `AgendaSection.tsx`, `ClientsSection.tsx`, `CatalogSection.tsx`, `MarketingSection.tsx`, `SettingsSection.tsx` → añadir prop `hideTabs` y ocultar `TabsList` cuando esté activa.
- **Editar**: `InicioSection.tsx`, `NegocioSection.tsx` → ningún `TabsList` extra (ya delegan).

## Fuera de alcance

- No tocar los sub-sub-tabs dentro de Equipo (estilistas/horarios/comisiones) ni Ajustes (general/plan/alertas): mantienen su `Tabs` interno.
- No cambiar URLs ni el mapeo `LEGACY_NAV_MAP`.
