

# Plan: Dar personalidad a la landing de Negocios

## Diagnóstico
Revisando la landing actual veo los síntomas típicos de "plantilla IA":
- **Hero genérico**: badge de estrellas + headline + 3 pills + 2 CTAs. Lo tiene cualquier SaaS.
- **Copy plano**: "Reservas 24/7", "Calendario inteligente", "Métricas que importan"… frases que ya nadie lee.
- **Iconos Lucide en círculos de colores**: visualmente intercambiable con miles de landings.
- **Falta de prueba social real**: no hay testimonios con cara, ni nombres de salones reales, ni números concretos ("Cristina Muñoz Perruquería ahorra 8h/semana").
- **Sin "voz de marca"**: el tono podría ser de Calendly, Fresha, Booksy o Square. Nada dice GlowApp.
- **Cero referencias al sector belleza más allá de la palabra**: no hay lenguaje de peluquería/barbería/estética, ni guiños visuales (tijeras, espejos, secador, esmalte…).

## Estrategia: 4 ejes para aportar alma

### 1. Voz de marca con actitud (sector belleza)
Pasar de SaaS neutro → **hablar como un compañero del sector**. Ejemplos de cambio de copy:

| Antes (genérico) | Después (con voz) |
|---|---|
| "Deja de perder clientes por WhatsApp" | "Tu libreta no debería decidir cuánto facturas este mes" |
| "Reservas 24/7" | "Mientras tú cierras caja, ya tienes 3 reservas para mañana" |
| "Métricas que importan" | "Sabe qué servicio te da más margen sin abrir una hoja de Excel" |
| "Tu salón merece más que una libreta" | "Hecho por y para profesionales que viven con tijeras en la mano" |

### 2. Hero rediseñado con personalidad
Reemplazar el hero genérico por uno **visualmente distintivo**:
- Fondo con **gradiente animado de marca** (#22408b → #99329a) en blobs orgánicos lentos (no el degradado radial soso actual).
- **Eyebrow específico**: "Hecho en España · Para peluquerías, barberías y centros de estética" en vez de "30 días gratis".
- **Headline en 2 líneas con énfasis tipográfico** (mezcla peso normal + cursiva display para una palabra clave, ej. *"belleza"* en Playfair).
- **Mockup móvil flotante a la derecha** mostrando una landing real de tenant (no solo texto centrado).
- **Pequeña fila de logos / nombres de salones reales** debajo del CTA ("Cristina Muñoz, Barber Studio Madrid, …").
- **Micro-interacción**: contador animado tipo "+1.247 reservas procesadas hoy" para dar sensación de producto vivo.

### 3. Sección nueva: "Para quién es GlowApp"
Tres tarjetas con foto/ilustración por tipo de negocio (Peluquería, Barbería, Centro de estética/uñas), cada una con un dolor específico y un beneficio concreto. Esto rompe la sensación de plantilla y aterriza el producto.

### 4. Testimonios reales con cara
Sección nueva (entre BeforeAfter y Pricing) con 2-3 testimonios formato "card iOS":
- Foto circular del propietario
- Nombre + nombre del salón + ciudad
- Cita corta y específica con número ("Pasé de 12 a 35 reservas online al mes")
- Estrellas y badge "Cliente desde 2024"

Si aún no hay testimonios reales, dejar el componente preparado y poblarlo con 2 placeholders explícitos (Cristina Muñoz ya existe como tenant real).

### 5. Mejoras de detalle visual
- **PainPointsSection**: cambiar las 5 cards iguales por un **layout asimétrico** tipo bento (1 grande + 4 pequeñas) con ilustraciones simples en vez de iconos rojos.
- **FeaturesShowcase**: reemplazar los `bg-gradient-to-br from-blue-500…` (colores aleatorios por feature) por **un único acento de marca** + tipografía mayor en el headline. Ahora parece pixel-art de colores.
- **FinalCTASection**: añadir un **mockup del dashboard real** detrás del CTA (semi-transparente) en vez del bloque liso de gradiente.
- Añadir **textura sutil de grano** (`bg-noise`) en secciones blancas para evitar el look "Tailwind por defecto".

## Archivos a modificar/crear

**Modificar:**
- `src/components/business-landing/HeroSection.tsx` — rediseño completo con mockup, blobs animados, copy con voz
- `src/components/business-landing/PainPointsSection.tsx` — layout bento + copy nuevo
- `src/components/business-landing/FeaturesShowcase.tsx` — copy con personalidad, unificar acento de color
- `src/components/business-landing/FinalCTASection.tsx` — añadir mockup + copy con voz
- `src/pages/ForBusiness.tsx` — insertar nuevas secciones en el orden correcto
- `src/index.css` — utilidad `.bg-noise` y keyframes para blobs

**Crear:**
- `src/components/business-landing/ForWhoSection.tsx` — "Peluquería / Barbería / Estética"
- `src/components/business-landing/TestimonialsSection.tsx` — testimonios con cara
- `src/components/business-landing/AnimatedHeroBackground.tsx` — blobs gradiente animados reutilizable

## Orden final de la landing
1. StickyHeader
2. **Hero rediseñado**
3. **ForWhoSection** (nueva)
4. PainPointsSection (rediseñada)
5. FeaturesShowcase (copy nuevo)
6. BeforeAfterSection
7. **TestimonialsSection** (nueva)
8. PricingSection
9. B2BLeadForm
10. FAQSection
11. FinalCTASection (mejorado)
12. Footer + FloatingMobileCTA

## Prioridad mobile (390x744)
Todos los rediseños se piensan primero para iPhone: mockup hero pasa debajo del texto en mobile, bento de pain points colapsa a stack vertical, testimonios en carousel horizontal con snap, safe-area respetada en todos los CTAs fijos.

