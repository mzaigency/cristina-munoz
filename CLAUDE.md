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
- **Animaciones**: GSAP (ScrollTrigger) + Framer Motion
- **Backend**: Supabase (DB + Edge Functions Deno) + Stripe
- **Auth/pagos**: Supabase Auth + Stripe Checkout/Webhooks
- **PWA**: instalable, push notifications, modo offline básico
- **Multi-tenant**: cada negocio = un tenant con web, tema y datos aislados

### Regla GSAP
GSAP solo existe en `src/components/business-landing/CinematicHero.tsx`. No añadir en otros archivos.

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
| **Plus Jakarta Sans** | `font-sans` | UI, cuerpo, botones, títulos de producto |
| **Playfair Display** | `font-serif` | Titulares editoriales, hero, landing |
| **Ashing** *(solo logo)* | `font-ashing` | Wordmark "Glowapp" — toda instancia del texto "Glowapp" lleva `font-ashing` + `letter-spacing: 0.05em` (ya en `.font-ashing` CSS) |

**Regla**: en marketing/hero, Playfair italic para el titular con carácter. En UI, Jakarta Sans. Ashing SOLO para la palabra "Glowapp".

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

Orden de secciones:
1. `StickyHeader`
2. `CinematicHero` — hero pinned GSAP con scrollytelling kinético
3. `MobileHeroStory` — variante móvil del relato
4. `SocialProofStrip` — métricas count-up + salones reales (Cristina Muñoz, Montserrat Faig)
5. `PanelShowcase` — screenshots reales del panel (tabs: Inicio/Agenda/Caja/Negocio)
6. `SalonTestimonials`
7. `HowItWorks`
8. `PricingCompare` — tabla comparativa vs Booksy/Treatwell/Fresha
9. `FAQSection`
10. `ClosingCTA`
11. `Footer`

### CinematicHero — arquitectura del scrollytelling
- Pin único GSAP extendido (`end: "+=4800"`), scrub:1
- **Acto 1**: texto editorial "El salón que sueñas, / gestionado solo." sobre fondo claro con grid
- **Acto 2** (relato en `HeroStory.tsx`): tarjeta navy sube → expande a fullscreen → 3 beats dolor→solución:
  - Beat 1: "Todo el día respondiendo **WhatsApps**." → desintegración char a char → "Glowapp responde por ti."
  - Beat 2: "La contabilidad, **a mano**, cada noche." → "La caja se cuadra sola."
  - Beat 3: "La agenda, siempre un **caos**." → "Cada cita, en su sitio."
  - Slogan bloom: "El software de salón / que se paga solo." (antes decía "que no te cuesta nada" — retirado por falso: el producto cuesta desde 29€/mes)
  - Remate con shine sweep: "Tú, a hacer brillar el salón."
- **CTA**: pullback → "Empieza hoy." + botones → `/onboarding` / scroll a `#producto`

### Reglas de diseño del hero
- Dolor: texto gris-azulado frío (`hsl(220 16% 72%)`), keyword en blanco
- Solución: gradiente de marca (`.ch-text-gradient`)
- Blobs glow a distintos `translateZ` para parallax 3D real
- Mouse tilt sobre el escenario (`stageRef`)
- `prefers-reduced-motion`: hero estático, relato oculto
- `ProblemAgitation`: archivo existe pero NO se renderiza (redundante con el relato)

---

## Archivos clave

| Archivo | Qué es |
|---|---|
| `src/components/business-landing/CinematicHero.tsx` | Hero pinned GSAP, todo el timeline del scrollytelling |
| `src/components/business-landing/HeroStory.tsx` | Markup presentacional del relato (solo JSX, sin lógica) |
| `src/components/business-landing/_landingShared.tsx` | `EASE`, `AnimatedNumber`, `gradientText`, `Eyebrow` |
| `src/components/business-landing/PanelShowcase.tsx` | Tabs con screenshots reales del panel (panel-*.png) |
| `src/components/business-landing/PricingCompare.tsx` | Comparativa Glowapp vs Booksy/Treatwell/Fresha |
| `src/components/business-landing/RoiCalculator.tsx` | Calculadora de ahorro vs competencia |
| `src/index.css` | Design tokens: colores HSL, font-ashing (letter-spacing: 0.05em), fuentes |
| `src/content/competitors.ts` | Copy completo de páginas alternativa-a-* |
| `src/hooks/usePlanLimits.ts` | Qué funciones van en cada plan (Starter/Pro/Business) |
| `/Users/hugomunxz/GLOWAPP/` | Docs de marca: Marketing, Funciones, Bienvenida, Guion VO |

---

## Convenciones de este repo

- **Caveman mode activo** — respuestas cortas, sin filler, fragmentos OK
- **Toda instancia del texto "Glowapp"** en JSX → `<span className="font-ashing">Glowapp</span>`
- **No cards genéricas** en el hero (decisión firme del usuario)
- **GSAP solo en CinematicHero.tsx**
- **`ProblemAgitation`**: no renderizar en ForBusiness (archivo conservado)
- Assets de screenshots reales: `src/assets/panel-*.png` (desktop) y `mobile-*.png`
