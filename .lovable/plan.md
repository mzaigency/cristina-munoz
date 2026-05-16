
# Plan: Refactor integral UI/UX del panel admin

Objetivo: convertir el panel admin en la pieza más cuidada de la app. Pasamos de 8 tabs a **5**, migramos sub-tabs de `sessionStorage` a **rutas anidadas reales**, unificamos tokens y arreglamos los 20 puntos del audit. Mantenemos la **hamburguesa** en móvil (mejorada por dentro). Trabajo dividido en 5 fases ejecutables de forma independiente para poder revisar/aprobar cada hito.

---

## Nueva arquitectura de tabs (5)

```text
Inicio        → Dashboard + Agenda + Caja        (sub: resumen | agenda | caja)
Clientes      → Directorio + Mensajes + Reseñas  (sub: directorio | mensajes | reseñas)
Catálogo      → Servicios + Productos + Promos + Pedidos (sub: servicios | productos | promos | pedidos)
Marketing     → Posts + QR + Email + WhatsApp Kit (sub: posts | qr | email | whatsapp)
Negocio       → Equipo + Horarios + Informes + Ajustes + Plan (sub: equipo | horarios | informes | ajustes | plan)
```

Permisos: si `isStylist && !isAdmin`, se ocultan Marketing y Negocio (igual que hoy con settings/team/reports).

---

## Fase 1 — Routing real con sub-tabs anidados

Reemplazar `activeTab` + `sessionStorage` por React Router nested routes.

```text
/admin/:slug
  ├─ /inicio        (default redirect)
  │   ├─ /resumen   (DashboardPanel)
  │   ├─ /agenda    (AgendaPanel)
  │   └─ /caja      (CashRegisterPanel)
  ├─ /clientes/(directorio|mensajes|resenas)
  ├─ /catalogo/(servicios|productos|promociones|pedidos)
  ├─ /marketing/(posts|qr|email|whatsapp)
  └─ /negocio/(equipo|horarios|informes|ajustes|plan)
```

- `TenantAdmin.tsx` se convierte en **AdminLayout** con `<Outlet />`.
- Cada sección (`AgendaSection`, `ClientsSection`, etc.) se convierte en mini-layout con sus propios sub-routes + `<Outlet />`.
- Tabs y sub-tabs usan `NavLink` (`useLocation` para active state). Adiós a `sessionStorage.setItem("openCatalogSubTab", ...)`.
- Compatibilidad: redirect `/admin/:slug` → `/admin/:slug/inicio/resumen`. Mantener handler temporal que lee `sessionStorage` legacy y hace `navigate(...)` durante 1 release.
- `handleQuickAction` y `handleNavigate` del Dashboard se reescriben para hacer `navigate(...)` en vez de set state.
- Beneficios: back/forward del navegador, URLs compartibles, deep links push notifications, analytics limpia.

## Fase 2 — Sistema de navegación unificado (mobile + desktop)

Crear `<AdminTopNav>` y `<AdminSubNav>` como componentes únicos.

- **Top nav (5 tabs)**: en desktop barra horizontal; en móvil **dentro del Sheet (hamburguesa mejorada)** + un **header compacto** con avatar/menú de cuenta a la derecha.
- **Sub nav**: tira horizontal sticky bajo el header, con `framer-motion` underline animado (reutilizar patrón de `feed-navigation-tabs`).
- **Estado activo único**: variante shadcn nueva `tab="admin"` con tokens del design system. Elimina los 3 estilos distintos actuales.
- **Hamburguesa rediseñada**:
  - Header con avatar circular + nombre salón + email + chip de plan.
  - 5 entradas principales con icono + label + badge.
  - Sección "Cuenta" colapsable: Ver web, Notificaciones, Cerrar sesión.
  - Footer pegado abajo con safe-area-inset.
- Eliminamos uno de los dos botones tour/help: fusionar en un único `?` con popover (Tour interactivo / Centro de ayuda / Atajos).

## Fase 3 — Inicio reescrito (Dashboard + Agenda + Caja en uno)

- Sub-tab por defecto: **Resumen** (cards de hoy: citas, ingresos, próximas, alertas).
- Sub-tab **Agenda**: el calendario actual.
- Sub-tab **Caja**: `CashRegisterManager` con su propio acceso permanente (hoy escondido).
- **CTA primaria contextual** en el header de Inicio: botón "+ Nueva cita" siempre visible (sustituye a la falta de FAB sin romper el patrón de hamburguesa elegido).
- Quick actions del dashboard refactorizadas con jerarquía visual clara (primaria/secundaria/terciaria).

## Fase 4 — Sistema visual unificado

- **Tokens de tipografía**: definir `text-nav-label`, `text-tab-label`, `text-badge` en tailwind config. Eliminar `text-[9px]`, `text-[10px]` sueltos.
- **Badges**: componente `<NotifBadge count|dot>`. En tabs principales solo punto rojo (dot). El número aparece en sub-tabs. Tamaño accesible (`h-5 min-w-[20px]`, `text-[11px]`, peso 700).
- **Iconografía**: `User` para Clientes, `Users` para Equipo (resolver colisión actual). Set completo revisado.
- **Estado activo unificado**: gradient sutil + ring + shadow. Mismo aspecto en top nav, sub nav y sidebar móvil.
- **Safe areas**: el `<main>` móvil pasa de `pb-24` hardcoded a `pb-[calc(env(safe-area-inset-bottom)+1rem)]`. Sub-nav sticky respeta `top: env(safe-area-inset-top) + 56px`.

## Fase 5 — Pulido fino y "wow"

- **Transiciones entre tabs**: `framer-motion` fade+slide 150ms en el `<Outlet />` (key por `pathname`).
- **Search global (Cmd+K / botón en header)**: command palette con shadcn `Command`. Busca: ir a sección, cliente por nombre, servicio, próxima cita. Atajo `⌘K` (desktop) / botón lupa (móvil).
- **Skeletons por sección**: usar `ContentSkeleton`/`ListSkeleton` en cada Suspense boundary, no `Loader2` global.
- **Swipe hint**: primera vez en móvil, toast efímero "Desliza ← → para cambiar de sección" (flag en localStorage).
- **PullToRefresh contextual**: el toast indica qué se refrescó ("Agenda actualizada" / "Notificaciones al día").
- **Breadcrumb móvil**: en sub-rutas profundas, micro-breadcrumb encima del sub-nav ("Catálogo › Servicios").
- **Menú de cuenta (avatar dropdown)** en header: foto del salón, email, Ver web pública, Ajustes rápidos, Cerrar sesión. Sustituye los 3 iconos sueltos actuales en desktop.

---

## Detalles técnicos

- **Sin migración de DB**: todo es frontend + routing.
- **Archivos nuevos**:
  - `src/components/admin/layout/AdminLayout.tsx`
  - `src/components/admin/layout/AdminTopNav.tsx`
  - `src/components/admin/layout/AdminSubNav.tsx`
  - `src/components/admin/layout/AdminMobileSheet.tsx`
  - `src/components/admin/layout/AdminAccountMenu.tsx`
  - `src/components/admin/layout/AdminCommandPalette.tsx`
  - `src/components/admin/layout/NotifBadge.tsx`
  - `src/components/admin/sections/inicio/{ResumenPanel,AgendaPanel,CajaPanel}.tsx`
  - `src/components/admin/sections/clientes/(Directorio|Mensajes|Resenas)Panel.tsx` (envoltorios sobre componentes existentes)
  - Equivalentes para `catalogo`, `marketing`, `negocio`.
- **Refactor**:
  - `src/pages/TenantAdmin.tsx` → reduce a guardia de auth + `<AdminLayout />`.
  - `src/App.tsx` → registrar nuevas rutas anidadas con `Route element={<AdminLayout/>}` y children.
  - Eliminar todo `sessionStorage.setItem("open*SubTab"|"openCashTab")`; los callers (`AdminDashboard`, `OnboardingChecklist`, `InteractiveTour`, push routing) usan `navigate()`.
- **Compatibilidad push/deep-links**: `useDeepLinks` y `notifications/push-event-routing` actualizar mapping a las nuevas rutas. Mantener redirects de las antiguas.
- **Tailwind config**: añadir tokens `--admin-nav-active`, `--admin-nav-glow`, escala tipográfica nav.
- **Memoria a actualizar**: `mem://features/admin/panel-restructuring-v4` → v5 con nueva arquitectura.

---

## Orden de entrega sugerido (commits independientes, cada uno deja la app funcionando)

```text
1. Fase 1: routing real + redirects de compatibilidad
2. Fase 4: tokens + badges + iconos (base visual)
3. Fase 2: AdminLayout/TopNav/SubNav/MobileSheet + AccountMenu
4. Fase 3: Inicio unificado (Resumen + Agenda + Caja)
5. Fase 5: pulido (transiciones, Cmd+K, breadcrumb, hints)
```

## Riesgos y mitigación

- **Push notifications con URLs viejas** → mantener rutas legacy con redirect 6 meses.
- **InteractiveTour** depende de `data-tour-step` → re-mapear selectores tras el refactor (incluido en Fase 2).
- **OnboardingChecklist** llama `handleNavigate(tab, subTab)` → adaptar a `navigate(path)` (incluido en Fase 1).
- **Tests visuales** del calendario y caja → smoke manual al final de Fase 3.

---

## Fuera de alcance (explícito)

- Bottom navigation y FAB (descartados por la respuesta del usuario).
- Cambios de copy/branding del producto.
- Cambios en flujos de booking público.
- Nuevas features funcionales.

