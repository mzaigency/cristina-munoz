# Glowapp — cristina-munoz repo

## ¿Qué es Glowapp?

**"Instagram + reservas online + software de gestión"** para belleza y bienestar en España.

Dos productos en uno:
- **App social de descubrimiento + reservas** para clientes finales (gratis).
- **Web profesional + panel de gestión (ERP)** para negocios (primer mes gratis, sin permanencia).

Disponible como web ([glowapp.app](https://glowapp.app)) y **PWA instalable** en iOS/Android. 100% español, datos en la UE (RGPD).

---

## Stack técnico

- **Frontend**: Vite + React + TypeScript + Tailwind CSS + shadcn-ui
- **Animaciones**: Framer Motion (`motion`). GSAP retirado en jul 2026 (se eliminó el hero cinemático)
- **Backend**: Supabase (DB + Edge Functions Deno) + Stripe
- **Auth/pagos**: Supabase Auth + Stripe Checkout/Webhooks
- **PWA**: instalable, push notifications, modo offline básico
- **Multi-tenant**: cada negocio = un tenant con web, tema y datos aislados

### Regla GSAP
GSAP ya no se usa en el proyecto (el hero cinemático `CinematicHero` se eliminó en jul 2026). No reintroducir GSAP; usar Framer Motion.

---

## Identidad visual de marca

### Paleta de colores (HSL en código, valores reales)

| Rol | HSL | HEX |
|---|---|---|
| `--primary` (Azul Glow) | `223 61% 34%` | `#22408C` |
| `--accent` (Púrpura Glow) | `299 51% 40%` | `#98329A` |
| `--background` | `0 0% 100%` | `#FFFFFF` |
| `--foreground` | `230 25% 10%` | `#131520` |
| `--muted-foreground` | `230 10% 45%` | `#676B7E` |
| Éxito | `142 76% 36%` | `#16A249` |
| Error/destructive | `0 84% 60%` | `#EF4343` |

**Degradado de marca**: `linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))` — firma visual de Glowapp, usar en botones CTA, texto gradiente, glows.

**Tarjeta navy** (hero, tarjetas premium): `linear-gradient(150deg, hsl(223 55% 17%), hsl(258 45% 8%))`

### Tipografías

| Familia | Clase Tailwind | Uso |
|---|---|---|
| **Plus Jakarta Sans** | `font-sans` | UI del producto: app de clientes, cuerpo, botones |
| **Poppins** | `font-poppins` | **Landing `/negocios`** (scope en el root de `ForBusiness`) y **todo el panel de admin** (token `--glow-font`, ago 2026) |
| **Playfair Display** | `font-serif` | Titulares editoriales de la web pública del tenant (NO en `/negocios`) |
| **Ashing** *(solo logo)* | `font-ashing` | Wordmark "Glowapp" en el producto/tenant. NO se usa en `/negocios` (allí "Glowapp" va en Poppins) |

**Regla**: en `/negocios` todo es Poppins, sin serif italic ni font-ashing (decisión Hugo jul 2026 — "sin manuscritas"). En la web del salón (tenant), Playfair italic para titulares con carácter. Ashing solo para el wordmark en producto/tenant.

### Estética UI
- iOS-inspired + glassmorphism: tarjetas con blur, `--radius: 1rem`, sombras suaves elevadas
- Easing de marca: `cubic-bezier(0.23, 1, 0.32, 1)` (constante `EASE` en `_landingShared.tsx`)
- Animaciones: `fade-in-up`, `float`, `shimmer` — nada brusco
- Iconografía: Lucide React, redondeada, limpia

---

## Identidad verbal y tono de voz

**Cercano, claro y con confianza experta.** Tuteo siempre. Tono de compañera del sector que va al grano.

**Palabras SÍ**: gratis, tu cliente, tu marca, sin comisión, sin compromiso, en 5 minutos, desde el móvil, 24/7, dueña de tu agenda, soporte en español.

**Palabras NO**: "barato" (usar *sin comisión* / *precio plano*), "usuario" (usar *tu negocio* / *tu salón*), "leads", "monetizar", "disruptivo", jerga SaaS/B2B, anglicismos innecesarios.

**Default de género**: femenino como referencia principal (buyer persona es mayoritariamente dueñas de salón), sin excluir barberos.

---

## Buyer Persona principal — "Laura, la dueña del salón"

- Mujer 28–45, propietaria/autónoma de peluquería, barbería, estética, spa, uñas. 1–6 profesionales.
- **Dolores**: teléfono sonando mientras atiende, pierde reservas fuera de horario, agenda en libreta/WhatsApp, no-shows sin control, caja a mano, sin tiempo para marketing.
- **Frustración competencia** (datos verificados jul 2026): Booksy cuesta 34,99€+IVA/mes y suma 8€/mes por profesional extra, Boost opcional se queda 30% de la primera visita de clientes nuevos del marketplace (NO cobra comisión por reserva normal — no afirmar lo contrario); Treatwell cobra cuota anual + comisión solo por clientes nuevos del marketplace; Fresha es gratis de base pero cobra 20% de la primera cita de clientes nuevos del marketplace y 2,19%+0,20€ por cobro online; soporte en inglés.
- **Disparador de compra**: "perdí otra clienta porque llamó con las manos en un tinte".
- **Cómo decide**: prueba gratis antes de pagar, necesita ver que se monta rápido desde el móvil, le convence el precio plano (no paga por silla ni por captar) y "ser dueña de su cliente". OJO: Glowapp NO es más barato que Booksy en todos los casos (a 5+ profesionales Booksy puede salir más barato que Business) — vender propiedad + producto completo, no "ahorro".
- **Dónde se informa**: Instagram, TikTok, grupos de WhatsApp de profesionales.

---

## Funciones del producto (mapa completo)

### Para clientes finales (gratis)
- Feed social (descubrimiento de salones como Instagram), stories, seguir salones
- Búsqueda con IA por lenguaje natural + filtros por categoría y ciudad
- Reservas online en ~1 min, 24/7, sin llamadas
- Lista de espera, reprogramar/cancelar citas
- CRM personal: historial, favoritos, reseñas verificadas
- Mensajería directa cliente ↔ salón

### Para negocios — Web del salón
Cada negocio: web en `glowapp.app/{slug}`, con dominio propio, 100% editable.
Hero, servicios, equipo, galería, reseñas verificadas, ubicación, tienda integrada, reserva online embebida, tema visual propio.

### Para negocios — Panel de gestión (ERP)
**Agenda**: multi-profesional, reserva rápida manual, recurrencia, horarios por estilista, ausencias, lista de espera *(Business)*

**CRM**: ficha de cliente, historial, gasto total, notas, tags VIP, exportar CSV

**Catálogo**: servicios, paquetes *(Pro+)*, productos, tienda integrada

**Caja** *(Pro+)*: cobro rápido, cierre diario, historial, estadísticas avanzadas, exportar, tickets, Stripe (solo comisión Stripe, Glowapp no añade nada)

**Equipo**: perfiles de estilistas, comisiones *(Business)*, ausencias

**Marketing**: posts y stories desde el panel, broadcast a clientes, Kit WhatsApp (plantillas/campañas), recordatorios automáticos *(Pro+)*, promociones *(Pro+)*, QR en alta resolución, analytics de feed y stories

**Estadísticas**: dashboard tiempo real, reservas, objetivos *(Business)*, informes PDF *(Pro+)*

**Onboarding IA** (~5 min): alta guiada con IA que genera branding, web y catálogo sugerido según tipo de negocio. Importación de agenda existente.

---

## Planes y precios

30 días gratis en todos los planes, sin tarjeta que se cobre, sin permanencia.

| Plan | Profesionales | Caja | Analytics av. | WhatsApp recrd. | Comisiones | Objetivos |
|---|---|---|---|---|---|---|
| **Starter** | 1 | — | — | — | — | — |
| **Pro** | varios | ✅ | ✅ | ✅ | — | — |
| **Business** | ilimitados | ✅ | ✅ | ✅ | ✅ | ✅ |

Modelo: suscripción plana en euros. Cobros online solo comisión Stripe. Sin comisión por reserva.

---

## Diferenciadores vs competencia

| (verificado jul 2026) | Booksy | Treatwell | Fresha | **Glowapp** |
|---|---|---|---|---|
| Cuota | 34,99€+IVA/mes **+8€/profesional extra** | Cuota anual (~230€/año) | 0€/mes | **Plana por plan: 29/49/89€** |
| Comisión reservas propias | 0% | 0% | 0% | **0%** |
| Comisión clientes nuevos marketplace | Boost opcional: 30% 1ª visita | Sí, solo nuevos | 20% de la 1ª cita | **Sin marketplace de pago: 0%** |
| Pagos online | 2% + 0,15€ | 2% + IVA | 2,19% + 0,20€ | **Solo comisión Stripe** |
| Web propia con dominio | No (perfil en su web) | No (listado marketplace) | No | **Sí** |
| Capa social (feed/stories) | No | No | No | **Sí** |
| Soporte en español | Chat/email | Email genérico | Chat en inglés | **WhatsApp humano** |
| Primer mes | Cuota desde el inicio | Cuota anual | Base gratis | **Gratis sin cargo** |

**Regla de oro claims**: nunca afirmar que Booksy/Treatwell/Fresha cobran "comisión por reserva" a secas — es falso en 2026 y es riesgo legal (publicidad comparativa, art. 10 LCD). El ángulo ganador: precio plano + web/cliente propios + 0% captación + soporte local.

---

## Estructura de la página /negocios (ForBusiness.tsx)

Rediseñada jul 2026 hacia un registro **bold/plantilla** (inspirada en zentroestudio.es) con firma Glowapp: **Poppins**, blanco con washes sutiles de marca, sin eyebrows, texto en gradiente de marca como acento. Root con `font-poppins`. Orden:

1. `StickyHeader` — nav píldora flotante (logo + links + CTA gradiente)
2. `HeroSection` — hero editorial bold estático (Poppins, SIN GSAP). Titular "El único sistema que hace crecer tu salón **de verdad.**" (cierre en gradiente). Entrada blur+fade+stagger con Framer Motion. Sin phone mockup
3. `SocialProofStrip` — métricas count-up + salones reales (Cristina Muñoz, Montserrat Faig)
4. `PainPointsSection` — el problema: grid 2×2 con iconos (sin emoji, sin eyebrow), sobre wash
5. `PanelShowcase` — screenshots reales del panel (tabs: Inicio/Agenda/Caja/Negocio)
6. `FeatureGrid` — "Un sistema entero. No una función suelta." 6 módulos en un contenedor único con divisores internos (matriz, no tarjetas sueltas)
7. `ComparisonTable` — "Ellos alquilan tus clientas. Glowapp te las da." Tabla limpia vs Booksy/Fresha (sección propia, fuera del precio). Claims verificados (ver regla de oro)
8. `SalonTestimonials` — reseñas de salones reales
9. `HowItWorks` — "De cero a reservas en 3 pasos."
10. `PricingSection` — tabla de precios real (3 planes del DB vía `useSubscriptionPlans`, medio destacado "Más popular", toggle mensual/anual)
11. `FAQSection` — lista con divisores (sin card por pregunta)
12. `ClosingCTA` — tarjeta navy de marca (único bloque oscuro), CTA a `/onboarding`
13. `Footer`

### Notas de diseño de la landing
- Helper `washBg` en `_landingShared.tsx` (degradado radial sutil de marca sobre blanco); fondo global en `LandingBackground` (rejilla + glow)
- Reveals unificados a **blur+fade** suave (`filter: blur(10px)` → `blur(0)`), `EASE` de marca. OJO: son `whileInView` (gating de visibilidad) → en preview con tab oculto se congelan; en navegador real animan bien
- `SectionHeader` (en `_landingShared.tsx`): `eyebrow` es opcional; en `/negocios` no se usa
- `FeatureSpotlights`, `ProblemAgitation`, `PricingCompare` (eliminado), `MobileHeroStory`/`HeroStory`/`CinematicHero` (eliminados): no renderizar / ya no existen

---

## Sistema de diseño del panel de admin — `glow-*`

Fuente única: **`src/styles/glow.css`** (importado al principio de `index.css`).
Regla dura: **ningún componente del panel escribe un color a mano**. Si un color
no está en `glow.css`, no existe.

### Cómo está construido
- Todo se apoya en **6 colores literales** (`brand`, `accent`, `ok`, `warn`, `danger` + la
  escala de tinta). Los `-soft` y los `-ink` se derivan con `color-mix`, así que cambiar
  la marca es cambiar una línea.
- Los tokens se declaran en **canales RGB** (`--glow-brand-rgb: 34 64 140`) para que
  Tailwind pueda darles opacidad (`bg-glow-brand/20`) sin duplicar el valor.
- Viven en `:root`, no scopeados: los sheets y diálogos de Radix se montan en un portal
  fuera del panel y con los tokens scopeados perderían el tema.
- Las primitivas van en `@layer components`, así una utility de Tailwind gana a una
  primitiva. `src/styles/*.css` está en el `content` de tailwind.config para que la capa
  no se purgue.

### Tipografía
El panel va en **Poppins** (`--glow-font`), la misma del sistema de marca en
`/negocios`. Se aplica desde `body[data-glow-panel]`, que pone `TenantAdmin` al
montarse, **no desde `.glow-shell`**: los diálogos y hojas de Radix se montan en
un portal colgando de `body` y desde el shell se quedarían con la fuente
anterior. No usar `font-body` dentro del panel — fuerza Plus Jakarta.

### Escalas
| | pasos | tokens |
|---|---|---|
| Radio | 5 | `--glow-r-sm/md/lg/xl/full` (10/14/18/24/999) |
| Tipografía | 7 | `--glow-t-2xs…2xl` (11/12.5/13.5/15/17/22/28) con su peso |
| Sombra | 3 | `--glow-e1/e2/e3` |
| Espaciado | múltiplos de 4 | `--glow-s1…s10` |
| Motion | — | `--glow-ease` (easing de marca), `--glow-fast`, `--glow-base` |

### Primitivas
`glow-btn` (`--primary/--brand/--ghost/--danger/--sm/--block/--icon`), `glow-icon-btn`,
`glow-card` (`--pad/--clip`), `glow-card-h`, `glow-page-h`, `glow-badge`, `glow-chip`,
`glow-input`, `glow-kpi`, `glow-row`, `glow-avatar`, `glow-empty`, `glow-subnav`,
`glow-subtab`, `glow-filter-row`, `glow-search`, `glow-spinner`, `glow-fade`,
`glow-group` (+`-dot`/`-n`), `glow-row-actions`, `glow-field` (+`-hint`/`-error`),
`glow-form`, `glow-form-grid`, `glow-swatch`, `glow-progress`, `glow-toolbar`,
`glow-save-bar`.

**Modificadores siempre en BEM** (`glow-btn--sm`, nunca `glow-btn sm`): dentro de
`@layer components` Tailwind genera variantes responsive de cualquier clase que se
llame igual que una utility suya, y `.glow-btn.block` compilaba como `.sm\:block.glow-btn`.

### Reglas de color
- **No hay token «info»**: lo informativo es el azul de marca. Así no reaparece un azul ajeno.
- `--glow-ink-4` es **solo decorativo, nunca texto** (2.6:1 sobre blanco).
- Los iconos sobre fondo `-soft` usan siempre la variante `-ink`.
- Para gráficas y color de profesional: `src/lib/chartColors.ts` (`CHART_COLORS`,
  `chartColor(i)`, `STYLIST_FALLBACK`). No inventar arrays de colores.
- **Texto sobre un color elegido por quien usa el panel** (avatar de cliente o de
  profesional, círculo de ranking): `readableInk(color)`, nunca `text-white` a secas.
  El verde de marca sobre blanco se queda en 3.3:1; el helper devuelve blanco o tinta
  oscura, lo que contraste más (peor caso medido: 4.6:1).
- El degradado de marca (`--glow-gradient`) es firma: **un solo botón por pantalla**
  (`glow-btn--brand`). El resto de acciones, `glow-btn--primary` (azul plano).

### Navegación
**Una sola fila de pestañas**, la del shell (`AdminSubNav` + `ADMIN_SUB_NAV`). Las
secciones NO pintan su propia fila: solo despachan por `subTab`. Si añades un subtab,
va en `ADMIN_SUB_NAV` y en el `switch` de la sección, no en una fila nueva.

Las pestañas son **texto**, no píldoras: el activo se marca con color de marca, peso
y un subrayado de 2 px. Nada de tarjetas (decisión Hugo, ago 2026 — "con cambio de
color queda más clean").

**Cuidado con el modificador `on`**: `.glow-navitem`, `.glow-subitem`, `.glow-bottom-item`,
`.glow-mkt-chip`, `.ag-pay-method` y compañía usan su propia clase `.on`, NO
`glow-subtab--on`. Confundirlas pinta la píldora de marca donde no toca.

### KPIs y filtros
Toda cifra destacada usa `glow-kpis` + `glow-kpi`; los filtros de contenido, `glow-toolbar`
+ `glow-chip`. Nada de mini-cajas ni píldoras propias por pantalla.

### Listados de una sección
**Una sola matriz, no una tarjeta por grupo**: un `glow-card` con `glow-group` como
cabecera de cada categoría y `glow-row` por elemento. La misma pieza sirve en móvil y
escritorio — nada de una lista para móvil y una `<table>` distinta detrás de
`hidden md:block`. Las acciones van en `glow-row-actions` (visibles al pasar el ratón
en escritorio, siempre visibles en táctil). Cabecera con métricas reales y
`glow-toolbar` con buscador + chips de filtro.

### Formularios
`glow-field` (label arriba, `glow-input`, `glow-field-hint` debajo) dentro de
`glow-form` / `glow-form-grid`. **No usar `Card`, `Label` ni `Input` de shadcn en el
panel** — son otro lenguaje visual (otro radio, otra sombra). Sí se conservan los
componentes de Radix por comportamiento (`Select`, `Switch`, `Dialog`, `Sheet`).
Formularios largos: `glow-save-bar` fija abajo.

### Modo oscuro
El panel es **solo claro**. `darkMode: "class"` está fijado a propósito: sin esa línea
Tailwind usa `"media"` y las variantes `dark:` se activan solas con el SO en oscuro,
invirtiendo media interfaz. No reintroducir `dark:` en el panel.

---

## Archivos clave

| Archivo | Qué es |
|---|---|
| `src/pages/ForBusiness.tsx` | Página `/negocios`; compone las secciones (root `font-poppins`) |
| `src/components/business-landing/HeroSection.tsx` | Hero bold estático (Poppins, Framer Motion, sin GSAP) |
| `src/components/business-landing/FeatureGrid.tsx` | Matriz de 6 módulos con divisores internos |
| `src/components/business-landing/ComparisonTable.tsx` | Tabla vs Booksy/Fresha (sección propia, fuera del precio) |
| `src/components/business-landing/PricingSection.tsx` | Tabla de precios (3 planes del DB, medio destacado) |
| `src/components/business-landing/_landingShared.tsx` | `EASE`, `AnimatedNumber`, `gradientText`, `Eyebrow` (opcional), `washBg` |
| `src/components/business-landing/PanelShowcase.tsx` | Tabs con screenshots reales del panel (panel-*.png) |
| `src/components/business-landing/RoiCalculator.tsx` | Calculadora de ahorro vs competencia |
| `src/styles/glow.css` | **Design system del panel**: tokens + primitivas `glow-*` |
| `src/lib/chartColors.ts` | Paleta de gráficas y color por defecto de profesional |
| `src/components/admin/layout/AdminSubNav.tsx` | Fila única de pestañas de sección |
| `src/index.css` | Tokens shadcn, font-ashing, CSS de secciones (`glow-mkt-*`, `glow-neg-*`, `ag-*`) |
| `src/content/competitors.ts` | Copy completo de páginas alternativa-a-* |
| `src/hooks/usePlanLimits.ts` | Qué funciones van en cada plan (Starter/Pro/Business) |
| `/Users/hugomunxz/GLOWAPP/` | Docs de marca: Marketing, Funciones, Bienvenida, Guion VO |

---

## Convenciones de este repo

- **Caveman mode activo** — respuestas cortas, sin filler, fragmentos OK
- **"Glowapp" con `font-ashing`** en el producto/tenant. EXCEPCIÓN: en `/negocios` va en Poppins (sin manuscritas)
- **No cards genéricas** en el hero (decisión firme del usuario)
- **GSAP eliminado** — no reintroducir; usar Framer Motion
- **`ProblemAgitation`, `FeatureSpotlights`, `PricingCompare`**: no usar en `/negocios` (los dos primeros conservados sin renderizar; `PricingCompare` eliminado)
- **Diseño de UI: maquetar antes de construir** — Hugo quiere ver maqueta (`mcp__visualize__show_widget`) y validar antes de tocar código
- Assets de screenshots reales: `src/assets/panel-*.png` (desktop) y `mobile-*.png`
- **Panel de admin: usar `glow-*`** (ver sección del sistema de diseño). `gp-*` ya no existe.
