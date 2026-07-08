# Design

Sistema visual del panel admin de tenant (shell `gp-*`, scoped a `.gp-shell` en `src/index.css`). La web pública de cada salón usa su propio tema por tenant; este documento cubre el panel.

## Theme

Claro, calmado, iOS-inspired. Superficie blanca sobre fondo frío casi-blanco; un solo acento (azul Glow) usado con intención. Densidad media-baja: el panel es el sitio ordenado del día de la dueña.

## Colors

Tokens reales (OKLCH/hex, en `.gp-shell`):

| Token | Valor | Uso |
|---|---|---|
| `--gp-accent` | `#22408b` (Azul Glow) | Acción primaria, estado activo |
| `--gp-accent-ink` | `#1a3270` | Texto sobre soft |
| `--gp-accent-soft` | color-mix accent+88% blanco | Fondos de estado activo |
| `--gp-purple` | `#99329a` (Púrpura Glow) | Solo en degradado de marca (logo/avatar) |
| `--gp-bg` | `oklch(0.98 0.006 265)` | Fondo de app |
| `--gp-surface` | `#ffffff` | Tarjetas, nav, sheets |
| `--gp-ink` | `oklch(0.24 0.02 265)` | Texto principal |
| `--gp-ink2` | `oklch(0.45 0.02 265)` | Texto secundario |
| `--gp-muted-c` | `oklch(0.62 0.015 265)` | Etiquetas, hints (solo texto grande/bold) |
| `--gp-line` / `--gp-line2` | `oklch(0.925/0.955 · 265)` | Bordes |
| `--gp-ok` / `--gp-warn` / `--gp-danger` / `--gp-info` | oklch 150/65/25/230 | Semánticos, con variantes `-soft` |

Degradado de marca (`primary→accent`) reservado a logo, avatar y CTA hero de marketing — no en UI de trabajo.

## Typography

- **Plus Jakarta Sans** en todo el panel (400/600/700/800). Sin serif en producto.
- Títulos de página 20–24px w800 tracking -0.02em; cuerpo 13.5–14.5px w500–600; etiquetas 10.5–12.5px w700–800.
- Números tabulares (`.gp-mono`) en dinero y horas.
- "Glowapp" como palabra → `font-ashing` (solo el wordmark).

## Components

- **Shell**: sidebar 252px (desktop) / bottom-nav 5 items + FAB speed-dial (móvil ≤920px). Topbar sticky 56–64px con miga (sección / subtab). Subnav de pills horizontal scrolleable (móvil).
- **Primitivas propias** `gp-*`: `gp-card`, `gp-btn` (primary/ghost/sm/danger), `gp-badge` (semánticos), `gp-seg` (segmented), `gp-input`, `gp-kpi`, `gp-row`/`gp-list`, `gp-empty`, `gp-sheet` (slide-over), `gp-more` (bottom sheet). shadcn/Radix para Dialog/Popover/Dropdown/Sheet.
- **Agenda** namespace `ag-*`: grid de día con scroll propio, cabecera de estilistas sticky, gutter de horas sticky-left, tarjeta hero del día (`gh`), selector semanal (`wk`), tabs de profesionales (`ag-proftab`).
- Radios: 11–16px componentes, 20px tarjetas grandes, 99px pills. Sombra `--gp-shadow-xs` en reposo, `--gp-shadow` en hover/elevación.

## Layout

- Móvil: contenido `padding: 14px 12px`, `padding-bottom` respeta bottom-nav + safe-area. Scroll principal en `.gp-main-wrap`; la agenda tiene scroller interno propio.
- Z-scale actual: subnav 18 < topbar 20 < sidebar 30 < bottom-nav 40 < FAB 44–46 < more-sheet 50 < sheet/overlay 60.

## Motion

- Easing de marca: `cubic-bezier(.3,.9,.3,1)` (`--gp-ease`); marketing usa `cubic-bezier(0.23,1,0.32,1)`.
- Transiciones 150–220ms, transform/opacity. Sección entra con fade+y (framer-motion, 150ms).
- Regla GSAP: solo existe en `CinematicHero.tsx` (marketing). El panel usa CSS + framer-motion.
- `prefers-reduced-motion` obligatorio en toda animación nueva.
