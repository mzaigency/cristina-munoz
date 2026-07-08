# Product

## Register

product

## Users

**Laura, la dueña del salón** (28–45, peluquería / estética / fisio, 1–6 profesionales, España). Usa el panel **desde el móvil, de pie, entre clienta y clienta, muchas veces con una sola mano** y con las manos ocupadas o manchadas (tinte, aceite). Sesiones de 10–60 segundos: mirar la agenda, apuntar una cita que le dictan por teléfono, cobrar con la clienta delante. No es técnica; viene de la libreta y de WhatsApp. El desktop existe pero el móvil ES el producto para ella.

Usuario secundario: Hugo (fundador) enseñando el panel en demos puerta a puerta desde su propio móvil — la primera impresión en 30 segundos decide la venta.

## Product Purpose

Glowapp es el panel de gestión (agenda, caja, CRM, marketing) + web pública para negocios de belleza y bienestar. Compite contra Booksy/Fresha/Treatwell con precio plano, 0% comisión de captación y web propia. Éxito = la dueña deja la libreta: apunta, cobra y consulta más rápido en Glowapp que en papel. La versión móvil del panel debe sentirse **app nativa de gestión de primer nivel**, no web adaptada.

## Brand Personality

Cercana, clara, con confianza experta. Tuteo siempre, femenino por defecto. "Compañera del sector que va al grano". Calma profesional: el salón ya es caótico; el panel es el sitio donde todo está en orden. Nada de jerga SaaS.

## Anti-references

- **Booksy app**: densa, gris, formularios interminables; sensación "software de empresa".
- **Web-con-botones-grandes**: el panel móvil actual — shell web responsivo, no app. Es exactamente lo que se está rediseñando.
- Dashboards genéricos shadcn/admin-template: tarjetas KPI idénticas en grid, todo igual de importante.
- Nada de glassmorphism decorativo ni gradientes en texto.

## Design Principles

1. **La agenda es la casa.** Todo lo demás orbita alrededor del día de hoy. Cero fricción entre abrir la app y ver "qué toca ahora".
2. **Una mano, de pie, con prisa.** Acciones frecuentes en zona de pulgar; lo destructivo lejos de él. Cada tarea core (nueva cita, cobrar) en ≤2 gestos desde cualquier pantalla.
3. **Jerarquía de verdad.** En cada pantalla hay UNA cosa que importa más; se le da el espacio. No todo es tarjeta, no todo es KPI.
4. **Motion con propósito.** Las transiciones explican de dónde viene y a dónde va (sheet sube, día desliza). Nunca decoración; siempre `prefers-reduced-motion`.
5. **Enseñable en 30 segundos.** Cada pantalla debe "venderse sola" en una demo de puerta fría: se entiende sin explicación.

## Accessibility & Inclusion

Pragmático táctil (sin certificación formal): targets ≥44px, contraste AA (≥4.5:1 en texto de cuerpo), acciones frecuentes alcanzables con el pulgar, `prefers-reduced-motion` respetado en toda animación, textos de sistema en español llano (nada de "error 400").
