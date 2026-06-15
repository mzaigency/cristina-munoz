
# Rediseño del Acto 2 del Hero (HeroStory)

## Diagnóstico

El acto 2 actual (`HeroStory.tsx`) es **solo texto cinético**: tres frases dolor→solución sobre 3 blobs glow. Resultado: se siente genérico, sin storytelling visual, sin identidad. Lo que falta:

- **Motion graphics reales** por beat (no solo tipografía).
- **Parallax 3D multicapa** con elementos diegéticos (no blobs decorativos).
- **Pain points específicos y dolorosos** para la peluquera/barbero/esteticista autónoma, no abstracciones.
- **Continuidad narrativa**: hoy son 3 escenas inconexas. Debería ser un arco "antes → ahora → después".

## Storytelling — nuevo guion

Arco de 5 beats encadenados, cada uno con su motion graphic propio. Mismo motor GSAP scrub que ya existe (no se toca `CinematicHero` salvo añadir hooks para los nuevos elementos).

```text
BEAT 1 — "El móvil no para"     →  Glowapp responde por ti
BEAT 2 — "Huecos vacíos"        →  Tu agenda, llena sola
BEAT 3 — "Tickets en una caja"  →  Cada euro, contado
BEAT 4 — "Sin web, invisible"   →  Tu propio sitio, hoy
BEAT 5 — Slogan + remate (se mantiene)
```

Cada beat tiene **tres planos en Z**:
- Fondo (-400px): ambiente, ruido de marca.
- Medio (-150px): el "dolor" como motion graphic.
- Frente (0px): la frase + la solución que florece.

## Motion graphics por beat

Todos SVG/CSS animados con GSAP scrub (sin librerías nuevas). Inspiración: storytelling estilo Linear/Arc/Vercel.

**Beat 1 — WhatsApps que ahogan**
- Cascada de burbujas de chat (SVG) cayendo desde arriba con stagger, rotación leve, parallax Z.
- Al resolver: las burbujas se agrupan y se convierten en una sola tarjeta "Reserva confirmada · Lucía · 18:30".

**Beat 2 — Agenda con huecos**
- Grid de calendario semanal (SVG) con slots vacíos parpadeando en rojo desaturado.
- Al resolver: los huecos se rellenan en cascada con bloques de color marca + check.

**Beat 3 — Tickets de papel**
- Lluvia de tickets/recibos de papel en 3D (rotateX, parallax), pila desordenada al fondo.
- Al resolver: se condensan en un único "cierre de caja" digital con cifra animada (counter 0 → €1.247).

**Beat 4 — Sin web (NUEVO pain point)**
- Resultado de Google falso con "No encontrado" + cards de competencia detrás.
- Al resolver: emerge el mockup de la web tenant (reutilizar `cristina-mobile.png`) con badge "tusalon.glowapp.app".

**Beat 5 — Slogan + remate**: se mantiene, ajustando timing.

## Parallax 3D reforzado

- El `stageRef` ya rota con el mouse. Añadir a cada beat 2–3 capas con `translateZ` distintos para que el parallax sea visible (hoy solo los blobs lo tienen).
- En mobile (sin mouse): añadir parallax por scroll con `gsap.to(..., { y, scrollTrigger })` para que las capas se desplacen entre sí durante el scrub.
- Grain + viñeta sobre el escenario para sensación cinematográfica.

## Archivos a tocar

```text
src/components/business-landing/
├── HeroStory.tsx                  ← reescritura completa (5 beats, motion graphics)
├── hero-story/                    ← NUEVO subdirectorio
│   ├── BeatWhatsapps.tsx
│   ├── BeatAgenda.tsx
│   ├── BeatTickets.tsx
│   ├── BeatWeb.tsx
│   └── motion-primitives.tsx     ← SVGs (Bubble, CalendarGrid, Ticket, GoogleResult)
└── CinematicHero.tsx              ← añadir selectores a timeline (beat-4) + parallax Z helpers
```

No se toca: `ForBusiness.tsx`, el resto de secciones, ni el acto 1 (texto editorial + tarjeta navy).

## Identidad visual

- Paleta marca (primary blue + accent purple) en todos los motion graphics, nunca colores arbitrarios.
- Tipografía existente (Plus Jakarta Sans + Playfair italic) — solo se añaden los SVGs.
- Mobile-first: cada beat probado a 390×778. Capas Z reducidas en mobile (-180 / -80 / 0) para evitar clipping.
- Respeta `prefers-reduced-motion`: los motion graphics se renderizan estáticos en su estado "solución".

## Detalles técnicos

- Sin nuevas dependencias. GSAP scrub ya está cargado.
- SVGs inline (no assets) para que se animen con GSAP por selector.
- Cada beat exporta dos refs: `.ch-pain-fx` (motion graphic del dolor) y `.ch-sol-fx` (mockup solución). El timeline en `CinematicHero` los desintegra/florece junto al texto.
- Contador animado del beat 3: `gsap.to({v:0}, {v:1247, snap:{v:1}, onUpdate})`.
- Performance: `will-change: transform`, `transform: translateZ(0)` en capas pesadas, SVGs con `<use>` para repetición barata.

## Riesgos

- 5 beats alargan el pin del hero (~+1200px scroll). Mitigación: reducir hold-times de cada beat de 0.9 a 0.6.
- Mobile podría tirar de GPU. Mitigación: reducir cantidad de partículas (8 burbujas en mobile vs 18 desktop).

## Fuera de scope

- No se rehacen las secciones siguientes (`SocialProofStrip`, `PanelShowcase`, etc.).
- No se sustituyen los mockups de Cristina (solo se reutiliza el mobile en el beat 4).
