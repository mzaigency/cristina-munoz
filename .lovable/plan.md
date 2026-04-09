

# Plan: Reestructuración del Panel de Admin

## Resumen

Reorganizar las 7 tabs actuales (`dashboard`, `agenda`, `business`, `content`, `team`, `communication`, `settings`) en 8 tabs con nueva lógica: separar **Operaciones** de **Estrategia**, dar a Clientes su propio módulo, y crear una sección de Informes.

## Mapeo: Estructura actual → Nueva

```text
ACTUAL                          NUEVO
──────────────────────────────────────────────────────
dashboard                  →    dashboard (Inicio)
agenda (calendar/waitlist/ →    agenda (Calendario, Lista de espera, Caja 🔒Pro)
        clients)                  ↑ Caja se mueve de business a aquí
                           →    clients (Base datos, Reseñas, Mensajes)
                                  ↑ Clientes sale de agenda
                                  ↑ Reseñas y Mensajes salen de communication
business (cash/promos/     →    catalog (Servicios, Productos, Paquetes🔒, Promos🔒)
  packages/products/              ↑ Servicios se mueve de team a aquí
  goals/stats)             →    marketing (Posts, QR Cards)
                                  ↑ QR sale de content, Posts desde communication
content (QR cards)         →    (eliminada — se distribuye)
team (stylists/services/   →    team (Staff, Horarios, Comisiones🔒)
  commissions/hours)              ↑ Servicios sale de aquí
communication (messages/   →    (eliminada — se distribuye)
  reviews)
                           →    reports (Stats🔒, Objetivos🔒, PDF🔒)
                                  ↑ Stats, Goals, PDF salen de business
settings                   →    settings (sin cambios)
```

## Archivos a modificar

### 1. `src/pages/TenantAdmin.tsx`
- Cambiar `TabValue` a: `dashboard | agenda | clients | catalog | marketing | team | reports | settings`
- Actualizar `navItems` con nuevos iconos y labels
- Actualizar `tabMap` en dashboard `onNavigate` y tour `onTabChange`
- Actualizar `handleQuickAction`: `new-payment` → `agenda`, `new-service` → `catalog`
- Actualizar `renderContent()` con las nuevas secciones
- Actualizar filtro de tabs para stylists (ocultar `settings`, `team`, `reports`)

### 2. `src/components/admin/sections/AgendaSection.tsx`
- Quitar sub-tab `clients`
- Añadir sub-tab `cash` (CashRegisterManager) con lock Pro
- Eliminar prop `onNavigateToCash` (ya no se navega fuera)
- Import `CashRegisterManager`, `LockedFeature`, `usePlanLimits`

### 3. Nueva: `src/components/admin/sections/ClientsSection.tsx`
- Sub-tabs: `directory` (ClientsCRM), `reviews` (ReviewsManager), `messages` (MessagesManager)
- Reusar badges de mensajes no leídos

### 4. Nueva: `src/components/admin/sections/CatalogSection.tsx`
- Sub-tabs: `services` (ServicesManager), `products` (ProductsManager), `packages` 🔒Pro (ServicePackagesManager), `promos` 🔒Pro (PromotionsManager)
- Lock logic con `usePlanLimits`

### 5. Nueva: `src/components/admin/sections/MarketingSection.tsx`
- Sub-tabs: `posts` (PostCreator/PostGrid), `qr` (QRCardGenerator)
- Nota: Posts usa componente social existente (`src/components/social/PostCreator.tsx`)

### 6. Nueva: `src/components/admin/sections/ReportsSection.tsx`
- Sub-tabs: `stats` 🔒Pro (BusinessStats), `goals` 🔒Business (MonthlyGoals), `pdf` 🔒Pro (PDFReportsGenerator)
- Todo bloqueado por plan

### 7. `src/components/admin/sections/TeamSection.tsx`
- Quitar sub-tab `services` (se va a Catálogo)
- Mantener: `stylists`, `hours`, `commissions`

### 8. `src/components/admin/sections/BusinessSection.tsx`
- **Eliminar** — todo redistribuido

### 9. `src/components/admin/sections/CommunicationSection.tsx`
- **Eliminar** — todo redistribuido

### 10. `src/components/admin/sections/ContentSection.tsx`
- **Eliminar** — QR va a Marketing

### 11. `src/components/admin/sections/index.ts`
- Quitar exports de Business, Communication, Content
- Añadir exports: ClientsSection, CatalogSection, MarketingSection, ReportsSection

### 12. `src/components/admin/AdminDashboard.tsx`
- Actualizar `statCards[].tab` mappings:
  - `cash` → `agenda` (caja ahora está en agenda)
  - `messages` → `clients` (mensajes ahora en clientes)
  - `reviews` → `clients`
- Actualizar `tabMap` en `onNavigate` callback
- Formación y ROI permanecen en dashboard (ya están ahí)

### 13. `src/components/admin/InteractiveTour.tsx`
- Actualizar `TOUR_STEPS`:
  - Quitar step `content` y `communication`
  - Añadir steps: `clients`, `catalog`, `marketing`, `reports`
  - Actualizar `targetTab` de cada step
  - Incrementar `STORAGE_KEY` a `v4`

### 14. `src/components/admin/content/TrainingChecklist.tsx`
- Actualizar `navigateTo` mappings:
  - `services` → `catalog` (subTab: `services`)
  - `cash_register` → `agenda` (subTab: `cash`)
  - `first_message` → `clients` (subTab: `messages`)
  - `first_post` → `marketing` (subTab: `posts`)
  - `review_analytics` → `reports` (subTab: `stats`)

### 15. `src/hooks/useAdminNotifications.ts`
- Verificar que `markSectionViewed` y `getCommunicationCount` funcionen con los nuevos tab names

### 16. SessionStorage keys
- `openCashTab` → ahora abre sub-tab `cash` dentro de `agenda`
- `openTeamSubTab` → solo `stylists | hours | commissions` (sin `services`)
- `openBusinessSubTab` → **eliminar** (ya no existe business)
- Añadir: `openCatalogSubTab`, `openClientsSubTab`, `openMarketingSubTab`, `openReportsSubTab`

## Sin migraciones SQL

No se necesitan cambios en base de datos. Es reorganización puramente frontend.

