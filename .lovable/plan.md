

## Diagnóstico

Las 5 demos actuales (`DemoLanding`, `DemoBookingFlow`, `DemoCalendar`, `DemoCashRegister`, `DemoAnalytics`) son **maquetas inventadas** dentro de un mockup de iPhone. No comparten un solo pixel con el panel real. Eso explica por qué se siente a "plantilla":

- `DemoCalendar` usa columnas % por estilista; el real (`LocalCalendarCRM`) usa **2px/min, drag&drop, líneas de hora cada 28px y badge `CheckCheck`** para WhatsApp.
- `DemoCashRegister` muestra "Cobrar tarjeta / efectivo" + lista plana; el real (`CashRegisterManager`) usa **tabs (Cobro / Historial / Resumen) y `DailySummary` con tarjetas cash/card/total**.
- `DemoAnalytics` es un grid simple; el real (`BusinessStats`) usa **Recharts (Area, Pie, Bar) con paleta `#8B5CF6 #EC4899 #10B981 #F59E0B`** y comparativas vs periodo anterior.
- `DemoLanding` no se parece a `TenantHero` (hero glass, foto de fondo, badges de servicios).
- Falta una demo del **Dashboard** (la pantalla más representativa: KPIs gradiente + acciones rápidas + próxima cita).

## Objetivo

Reescribir las 5 demos importando **directamente los mismos componentes/estilos del admin** (`AdminDashboard`, `LocalCalendarCRM`, `QuickPayment` + `DailySummary`, `BusinessStats`, `TenantHero`), envueltos en un wrapper que:

1. Inyecta datos ficticios sin tocar Supabase.
2. Bloquea interacciones destructivas (no se puede borrar/editar nada real).
3. Escala el contenido al ancho del mockup (220-280px) sin romper layouts.

## Estrategia técnica

### Patrón "DemoShell"
Componente nuevo `DemoShell.tsx` que:
- Renderiza children dentro de un contenedor con `pointer-events: none` (excepto en hovers visuales).
- Aplica un `transform: scale(...)` proporcional al ancho del marco para que el panel real (pensado para 390px+) entre limpio en 220/280px.
- Provee un mock de `supabase` vía un wrapper local que devuelve los datos ficticios cuando los componentes hacen fetch (alternativa más simple: forkear los componentes a versiones `*Preview` que reciben los datos por props).

### Decisión: forks ligeros, no mocking de Supabase
Mockear Supabase es frágil (los componentes hacen 5-10 queries). En su lugar, extraigo **sub-componentes puramente visuales** que ya existen o son fáciles de aislar, y los alimento con `demoData.ts`:

| Demo | Componentes reales reutilizados | Cómo |
|---|---|---|
| **DemoDashboard** (NUEVA, sustituye `DemoLanding` en el slot "Dashboard"?) | KPI cards + quick actions + next booking de `AdminDashboard` (extraer JSX a `DashboardPreview`) | Pasamos `stats` por props, mismo gradient `from-violet-500 to-purple-600`, etc. |
| **DemoCalendar** | Reescribir con la **misma lógica visual** de `LocalCalendarCRM`: `PIXELS_PER_MINUTE=2`, columna de horas, líneas de grid, current time line roja, badge `CheckCheck` verde, color por estilista de `tenant_stylists` | Citas vienen de `demoAppointments` |
| **DemoBookingFlow** | Reusar la estética de `BookingFlow` (steps, chips de hora, total sticky) | Mismas clases tailwind |
| **DemoCashRegister** | Reusar `DailySummary` (3 tarjetas cash/card/total) + lista de transacciones con icono `Banknote`/`CreditCard` como en `TransactionHistory` | Datos de `demoTransactions` |
| **DemoAnalytics** | Recharts `AreaChart` + `PieChart` con la **misma paleta** y formato `formatCurrency` de `BusinessStats` | Datos de `demoWeeklyData` + `demoPopularServices` |
| **DemoLanding** | Reusar `HeroGlass` o `HeroMinimal` + sección de servicios de `TenantServicesSection` reducida | Datos `demoSalonInfo` + `demoServices` |

### Slot "Web" → mantener DemoLanding fiel a TenantHero
La feature "Tu web profesional" sigue mostrando un mini-tenant. Reescribo `DemoLanding` para que sea **literalmente** un `HeroGlass` reducido (gradiente con foto, badge de rating, chips de servicios) y debajo el `TenantServicesSection` simplificado.

### Añadir slot "Panel/Dashboard"
La feature "Calendario inteligente" es lo más vendible pero el usuario también querrá ver el **dashboard**. Propongo:
- Renombrar la feature `landing` a `dashboard` y mostrar `DemoDashboard` (KPIs + quick actions).
- Mover `DemoLanding` a una nueva feature `web` o mantenerlo como secundario. **Pregunta abajo.**

## Archivos a crear/modificar

**Crear:**
- `src/components/business-landing/demos/DemoDashboard.tsx` — extracto fiel de `AdminDashboard` con `demoStats`
- `src/components/business-landing/demos/_shared/DemoShell.tsx` — wrapper escalado + bloqueo de eventos

**Reescribir desde cero (mismas clases/colores que el admin real):**
- `DemoCalendar.tsx` — copiar lógica visual de `LocalCalendarCRM` (PIXELS_PER_MINUTE=2, current time line, CheckCheck)
- `DemoCashRegister.tsx` — usar tarjetas estilo `DailySummary` + transacciones estilo `TransactionHistory`
- `DemoAnalytics.tsx` — Recharts con paleta `BusinessStats` (`#8B5CF6 #EC4899 #10B981 #F59E0B`), comparativas vs periodo anterior
- `DemoBookingFlow.tsx` — pasos visuales idénticos a `BookingFlow` (chips de hora, total sticky inferior)
- `DemoLanding.tsx` — clon visual reducido de `TenantHero` (HeroGlass) + `TenantServicesSection`

**Modificar:**
- `src/components/business-landing/FeaturesShowcase.tsx` — actualizar `features` array (orden + nuevo slot dashboard si se aprueba)
- `src/components/business-landing/demos/index.ts` — exports
- `src/components/business-landing/demos/demoData.ts` — añadir campos: `nextBookingTime`, `weeklyGrowth`, `unreadMessages`, `pendingReviews`, `closed_at`, `confirmed_count` para alimentar las nuevas demos

## Mobile-first (390x744)
- Mockup en mobile va a 220px de ancho → aplico `scale(0.56)` al contenido real (que está pensado para 390px) en `DemoShell`, anclado top-left, con `transform-origin` y `width: 178%` para llenar.
- En desktop (mockup 280px) → `scale(0.72)`, ancho `139%`.
- Esto garantiza que el panel real cabe sin reescribir layouts ni romper safe areas.

## Pregunta antes de empezar
<lov-tool-use id="toolu_vrtx_018VY9GQ4cFiimjZvifndyEM" name="questions--ask_questions" requires-approval="true" integration-id="questions" data="{\"questions\": [{\"header\":\"Slot Dashboard\",\"question\":\"¿Quieres que añada un nuevo slot 'Dashboard' a las features (sería el primero, el más impactante) o reemplazo alguno existente?\",\"options\":[{\"label\":\"Añadir Dashboard (6 features)\",\"description\":\"Dashboard nuevo + mantener Web/Reservas/Agenda/Caja/Datos. La pestaña Dashboard sería la primera mostrada.\"},{\"label\":\"Sustituir 'Web' por 'Dashboard'\",\"description\":\"Mantener 5 features pero cambiar la primera. La web del salón ya se muestra en el hero del landing.\"},{\"label\":\"Solo rediseñar las 5 actuales\",\"description\":\"No tocar la estructura, solo hacer las 5 demos 100% fieles al panel real.\"}],\"multiSelect\":false,\"allowOther\":false},{\"header\":\"Estrategia técnica\",\"question\":\"Para que las demos sean realmente fieles al admin, ¿prefieres que extraiga sub-componentes 'puros' del admin (más limpio pero más archivos) o que clone el JSX/CSS exacto en cada demo (más rápido, sin tocar admin)?\",\"options\":[{\"label\":\"Clonar JSX/CSS en demos\",\"description\":\"Más rápido. Las demos quedan pixel-perfect pero son código duplicado. Cero riesgo en el admin real.\"},{\"label\":\"Extraer sub-componentes puros\",\"description\":\"Refactor: separar 'KpiCard', 'CalendarGrid', 'DailySummaryCard' a componentes que reciben props. Más limpio pero toca el admin.\"}],\"multiSelect\":false,\"allowOther\":false}]}">
</lov-tool-use>
<lov-plan>

## Diagnóstico

Las 5 demos actuales (`DemoLanding`, `DemoBookingFlow`, `DemoCalendar`, `DemoCashRegister`, `DemoAnalytics`) son **maquetas inventadas** dentro de un mockup de iPhone. No comparten un solo pixel con el panel real:

- `DemoCalendar` usa columnas % por estilista; el real (`LocalCalendarCRM`) usa **2px/min, líneas cada 28px, current time line roja, badge `CheckCheck` verde** para confirmaciones WhatsApp.
- `DemoCashRegister` muestra "Cobrar tarjeta/efectivo" plano; el real (`CashRegisterManager`) usa **tabs (Cobro/Historial/Resumen) y `DailySummary` con 3 tarjetas (cash/card/total)**.
- `DemoAnalytics` es un grid simple; el real (`BusinessStats`) usa **Recharts (Area, Pie, Bar) con paleta `#8B5CF6 #EC4899 #10B981 #F59E0B`** y comparativas vs periodo anterior.
- `DemoLanding` no se parece a `TenantHero` (hero glass, foto de fondo).
- **Falta una demo del Dashboard** (KPIs gradientes + acciones rápidas + próxima cita) que es la pantalla más impactante del admin.

## Estrategia

Reescribir las demos para que sean **clones visuales 1:1** del admin real, usando exactamente las mismas clases Tailwind, gradientes, tipografía y componentes (`DailySummary`, `Recharts`, lógica `PIXELS_PER_MINUTE=2` del calendario, etc.), alimentados por `demoData.ts` (sin Supabase).

### Decisión técnica: clonar JSX/CSS, no mockear Supabase
Mockear el cliente Supabase es frágil (cada componente real hace 5-10 queries). En su lugar, **forkeo el JSX visual** del admin a las demos pasándole datos directamente. Cero riesgo de tocar el panel real en producción.

### Mapping demo ↔ admin real

| Demo | Fuente real a clonar | Detalles fieles |
|---|---|---|
| **DemoDashboard** (NUEVA) | `AdminDashboard.tsx` líneas 184-293 | KPI cards con gradientes (`from-violet-500 to-purple-600`, `from-emerald-500 to-green-600`), Quick Actions, Próxima cita |
| **DemoCalendar** (rediseño) | `LocalCalendarCRM.tsx` | `PIXELS_PER_MINUTE=2`, columna horas izda, línea hora actual roja, badge `CheckCheck` verde, drag handle visual |
| **DemoCashRegister** (rediseño) | `CashRegisterManager` + `DailySummary` + `TransactionHistory` | 3 tarjetas (efectivo/tarjeta/total), tabs, lista con iconos `Banknote/CreditCard` |
| **DemoAnalytics** (rediseño) | `BusinessStats.tsx` | Recharts `AreaChart` + `PieChart` con paleta exacta + selector periodo + comparativa % |
| **DemoBookingFlow** (rediseño) | `BookingFlow.tsx` + `TenantBookingFlow` | Steps visuales, chips de hora, total sticky inferior, mismas clases |
| **DemoLanding** (rediseño) | `TenantHero` (`HeroGlass`) + `TenantServicesSection` | Hero con foto fondo + glass overlay, badges rating, chips servicios |

### Patrón "DemoShell"
Wrapper común con `pointer-events: none` (las demos son visuales, no interactivas) y `transform: scale()` proporcional al ancho del mockup (220px mobile / 280px desktop) para que el JSX real (pensado para 390px+) entre limpio sin reescribir layouts.

### Slot Dashboard
Añado **un 6º feature "Panel" como primer slot** porque el dashboard es lo más vendible. La feature "Tu web profesional" mantiene `DemoLanding` rediseñado.

## Archivos

**Crear:**
- `src/components/business-landing/demos/DemoDashboard.tsx`
- `src/components/business-landing/demos/_shared/DemoShell.tsx`

**Reescribir:**
- `DemoCalendar.tsx`, `DemoCashRegister.tsx`, `DemoAnalytics.tsx`, `DemoBookingFlow.tsx`, `DemoLanding.tsx`

**Modificar:**
- `FeaturesShowcase.tsx` — añadir slot `dashboard` (primero), reordenar
- `demos/index.ts` — exports
- `demos/demoData.ts` — añadir `nextBooking`, `weeklyGrowth`, `unreadMessages`, `pendingReviews`, `monthlyGoal`

## Mobile-first (390x744)
Mockup mobile = 220px → `scale(0.56)` en `DemoShell` con `transform-origin: top left` y `width: 178%`. Mockup desktop = 280px → `scale(0.72)`, `width: 139%`. Safe areas respetadas porque clonamos los layouts del admin que ya las respetan.

