

## Diagnóstico

El `WelcomeCarousel` actual (3 slides al abrir GlowApp por primera vez) tiene los problemas típicos de plantilla:

- **Demasiado invasivo**: ocupa el 100% de la pantalla con `bg-background` plano. El usuario no ve la app hasta terminar.
- **Estética genérica**: 3 iconos Lucide (`Sparkles`, `Calendar`, `Heart`) en círculos con gradientes pastel (rosa, violeta, ámbar) que no tienen nada que ver con la paleta de marca (azul `#22408b` + púrpura `#99329a`).
- **Copy plano**: "Descubre salones increíbles" / "Reserva en segundos" / "Guarda tus favoritos" — descripciones de SaaS sin alma.
- **Sin contexto visual**: no muestra ni un solo salón real, ni un avatar, ni una foto. Es solo iconos abstractos.
- **CTA grande genérico**: botón "Continuar" de 56px de alto que parece form de banca.
- **No respeta la identidad Liquid Glass** de la app (backdrop-blur, glass overlays).

## Objetivo

Convertirlo en un **bottom-sheet Liquid Glass** (estilo iOS 26, igual que el `InteractiveTour` del admin) con personalidad de marca, que:

1. **Se vea menos**: en lugar de cubrir toda la pantalla, aparece como sheet desde abajo dejando ver el feed difuminado detrás → sensación de "ya estás dentro de GlowApp".
2. **Tenga personalidad**: paleta de marca (azul + púrpura), copy con voz propia, mini-mockups visuales reales en lugar de iconos abstractos.
3. **Sea swipeable**: arrastra a la derecha/izquierda para navegar, swipe abajo para cerrar (como el tour del admin).
4. **Termine rápido**: 3 slides cortos, máx. 30 segundos.

## Nuevo diseño (3 slides)

### Estructura común
- **Bottom-sheet glass** con `bg-card/80 backdrop-blur-2xl` y `rounded-t-[28px]`, max-height `78vh`.
- **Backdrop** semi-transparente con `bg-black/40 backdrop-blur-md` (dejando entrever el feed).
- **Drag handle** superior (barrita) + progress bar segmentada (igual que tour admin v4).
- **Header animado** con logo GlowApp pequeño + tagline corto.
- **Footer**: dots minimalistas + botón "Continuar" / "Empezar a explorar" más compacto (h-12, no h-14).
- **Skip discreto**: "Saltar" en gris pequeño centrado abajo (no con X agresiva arriba).

### Slide 1 — "Bienvenido a GlowApp"
- **Visual**: Mock-card de un salón premium real (estilo `PremiumSalonCard` reducido) flotando con glow purple → muestra desde el segundo 1 cómo se ve un salón en el feed.
- **Copy**: 
  - Título: *"Tu próxima cita, en un toque"*
  - Sub: *"Descubre salones cerca de ti, con fotos reales y reseñas de gente como tú."*
- **Color accent**: gradient `from-primary to-purple-600` (marca real).

### Slide 2 — "Reserva sin llamar"
- **Visual**: Mini-stepper visual (Servicio → Pro → Hora → ✓) con chips de hora animados (estilo `BookingFlow` real).
- **Copy**:
  - Título: *"Sin llamadas. Sin esperas."*
  - Sub: *"Elige servicio, profesional y hora. Reservas confirmadas al instante."*
- **Color accent**: gradient `from-purple-600 to-primary`.

### Slide 3 — "Tu beauty diary"
- **Visual**: Stack de 3 avatares de salones favoritos con corazones y badges "Nuevo post" (estilo feed Following).
- **Copy**:
  - Título: *"Sigue tus salones favoritos"*
  - Sub: *"Recibe sus novedades, posts y promos. Como un Instagram, pero para reservar."*
- **Color accent**: gradient `from-primary via-purple-500 to-pink-500` (suave, solo en el visual).

## Detalles de personalidad

- **Microcopy con voz**: "Sin llamadas. Sin esperas." en lugar de "Reserva en segundos". "Como un Instagram, pero para reservar." en lugar de "Guarda tus favoritos".
- **Tipografía**: títulos en `text-2xl font-semibold tracking-tight` (no `text-3xl font-bold` que se ve infantil).
- **Animaciones**: spring suaves (`damping: 25, stiffness: 250`) en lugar de `ease: easeInOut`. Visuales con float-in escalonado.
- **Haptic**: mantener `selection` en swipes y `success` al completar.
- **Cero emojis** en el contenido (los emojis solo en el tour del admin que es más casual).

## Comportamiento "menos invasivo"

- Sheet aparece **400ms después** de cargar el feed (no inmediato), para que el usuario vea el feed primero.
- Backdrop con `pointer-events: none` en los bordes superiores → tap en el feed visible cierra el sheet.
- Tap en el backdrop = cerrar (marcando como visto).
- Swipe down > 100px = cerrar.
- Botón "Saltar" muy discreto (gris pequeño abajo), no la X agresiva arriba.

## Archivos

**Reescribir:**
- `src/components/onboarding/WelcomeCarousel.tsx` — bottom-sheet Liquid Glass + 3 slides nuevos con visuales reales

**Sin cambios:**
- `src/pages/Index.tsx` — sigue usando `useWelcomeOnboarding()` igual (misma API pública)
- `localStorage` key se mantiene (`glowapp_onboarding_completed`) para no re-mostrar a usuarios actuales

## Mobile-first (390x744)

- Sheet ocupa ~70vh, deja ~200px del feed visible difuminado arriba → sensación de "estás dentro".
- Visuales mock dimensionados a 320px máx ancho (caben en 390px con padding).
- Safe areas: `pb-[calc(env(safe-area-inset-bottom)+12px)]` en el footer.
- Drag horizontal con threshold 60px (igual que tour admin) para swipe entre slides.

