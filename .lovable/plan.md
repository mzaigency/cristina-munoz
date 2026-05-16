
## Crítica de la página `/negocios`

Revisión a fondo (mobile 390px, que es la prioridad) de hero, secciones, contenido y funnel. Aquí no propongo aún cambios de código — esto es la auditoría con recomendaciones priorizadas.

---

### 1. Lo que funciona bien ✅

- **Hero copy emocional**: "Tu libreta no debería decidir cuánto facturas este mes" conecta con el dolor real.
- **Mockup con stickers flotantes** ("+8h ahorro", "Nueva reserva María 17:30") aporta prueba visual.
- **LiveSalonsRow** carga salones reales de la BD → social proof auténtico (no mockeado).
- **PainPointsSection** con bento + emojis es memorable; el "📓 La libreta tiene la última palabra" como big card está bien resuelto.
- **FeaturesShowcase** con tabs + demos reales del producto es lo más fuerte: explica funcionalidades con UI propia, no con stock illustrations.
- **PricingSection** consume datos reales (`useSubscriptionPlans`) → sin riesgo de precios desincronizados con Stripe.
- **FloatingMobileCTA** aparece tras 500px de scroll y respeta `safe-area-inset-bottom` ✓.
- **B2BLeadForm** pre-relleno de tipos de servicio desde `BUSINESS_TYPES` → coherencia con la app.

---

### 2. Problemas críticos 🔴

#### A. Inconsistencias de contenido / hechos

1. **Pricing duplicado y desincronizable**: el `SEO.faq` JSON-LD afirma "Starter 19€ · Pro 39€ · Business 79€" pero `PricingSection` lo lee de BD. Si cambias precios, Google verá los antiguos.
2. **Métrica inventada**: "+1.247 reservas procesadas hoy" está hardcodeada. Si tienes 2 salones reales, es deshonesto y arruina la confianza si alguien lo cruza con `LiveSalonsRow` (que muestra 1-2 nombres).
3. **Claim sin sustento**: "−60% no-shows" en feature *Reservas 24/7*. Sin estudio, sin asterisco.
4. **Erratas en FAQ**: "No necesitan descargar nada aunque es aconsejable Glowapp" — frase rota, marca mal escrita ("Glowapp" debería ser "GlowApp"), falta puntuación.
5. **Testimonial único** en sección plural "Testimonials": 1 sola card en un carrusel snap → parece placeholder o catálogo en construcción.

#### B. Funnel confuso (doble vía sin contexto)

6. La página tiene **dos conversiones contradictorias** sin separación clara:
   - Self-serve: `Probar 30 días gratis` → `/onboarding` (×8 CTAs en la página)
   - Sales-led: `B2BLeadForm` justo después de pricing pidiendo nombre/email/teléfono
   No se explica *cuándo* usar cada uno. Resultado: el usuario decidido a probar gratis se encuentra un formulario y duda; el indeciso ya pasó por 3 CTAs y abandona.
7. **Fatiga de CTA**: 8 botones "Empezar" en una sola página. Hero (x2) + 1 por feature (x6) + Antes/Después + Pricing (x3) + Form + FinalCTA + FloatingMobile + StickyHeader. Saturación.

#### C. Inconsistencia visual / de marca

8. **Iconos de planes con paletas ajenas**: `starter` azul claro, `pro` amber/orange, `business` purple/pink. Introducen 6 colores nuevos que **no aparecen en ninguna otra parte** de la landing ni de la app (que usa `#22408b` + `#99329a`). Rompe identidad.
9. **Eyebrows con 6 estilos distintos** en 8 secciones — cada sección inventa su propio header (uppercase accent con sparkles / sin icono / con HelpCircle / con badge white-on-gradient). No hay sistema.
10. **Mezcla de border-radius**: `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-[2.4rem]`, `rounded-full` conviven sin lógica.
11. **Emojis vs liquid glass**: 💇‍♀️💈💅📓📵🤷🧾📞 chocan con el resto de la app (iOS-26 liquid glass, minimal). Funcionan en PainPoints pero rompen el premium feel.
12. **Doble sticky en mobile**: `StickyHeader` (top:0) + tabs de `FeaturesShowcase` (sticky top:16) + `FloatingMobileCTA` (bottom) → tres capas persistentes que reducen el área de lectura a ~60%.

#### D. Problemas de mobile (prioridad del proyecto)

13. **Stickers flotantes invaden el mockup**: en 390px el mockup mide 260px y los stickers `-left-4` / `-right-3` se salen o tapan contenido.
14. **Bento PainPoints colapsa**: en mobile todo es stack vertical de 5 cards iguales → se pierde el efecto "bento" y la card "big" deja de ser hero.
15. **Hero h1 con 5 líneas** en móvil ("Tu libreta no debería / decidir cuánto / facturas / este mes."): salto de línea forzado por width corto rompe el ritmo poético del copy.
16. **Carrusel de testimonios con 1 card** ocupa 85vw y deja un void enorme a la derecha.

#### E. Tono / temática

17. **Voz inconsistente**: copy coloquial directo ("que la gente salga guapa por la puerta", "Walk-ins sin caos", "WhatsApp a las 23:47") conviven con corporativo seco ("KPIs en tiempo real", "Analytics avanzados", "Dashboard de ingresos en vivo"). Decide una voz.
18. **"Hecho en España" no se explota**: aparece en el eyebrow del hero y desaparece. Cero referencia a soporte local, idioma, fiscalidad ES, etc.
19. **No menciona PWA / instalable / iOS** pese a que es uno de los diferenciadores reales de la app.
20. **Falta diferenciación competitiva** (Booksy, Treatwell, Fresha). El visitante no sabe por qué *este* en vez de *aquel*.

---

### 3. Plan de mejora propuesto (priorizado)

#### Sprint 1 — Higiene urgente (1-2h)

- **Borrar contadores inventados**: quitar "+1.247 reservas procesadas hoy" o sustituir por dato real desde BD (count de bookings hoy). Misma vara que LiveSalonsRow.
- **Quitar claim "−60% no-shows"** o añadir asterisco con base (estudio interno tras X envíos).
- **Sincronizar pricing en `SEO.faq`**: leer del mismo hook o eliminar las cifras y dejar "desde X€/mes, consulta planes".
- **Corregir FAQ**: "No necesitan descargar nada, aunque tener GlowApp instalada como app es lo más cómodo."
- **Marca consistente**: buscar/reemplazar "Glowapp" → "GlowApp" en todos los componentes business-landing.

#### Sprint 2 — Funnel limpio (medio día)

- **Separar las dos vías** con un H3 antes del `B2BLeadForm`:
  - Bloque self-serve = "Lánzate solo en 5 min" → `/onboarding`
  - Bloque guante blanco = "¿Prefieres que lo montemos contigo? Déjanos tus datos" → el form actual
- **Reducir CTAs**: eliminar el botón "Probar esta función" de cada feature (×6) — basta el sticky + final.
- **Quitar `BeforeAfterSection`** o fusionarlo con `PainPointsSection` (mismo mensaje contado dos veces).

#### Sprint 3 — Consistencia visual (medio día)

- **Sistema de eyebrows único**: chip pill con `text-xs uppercase tracking-wider text-primary` + icono opcional. Un solo componente `<SectionEyebrow icon? label>` reutilizado en todas las secciones.
- **Reemplazar iconos de planes** por `Zap`/`Crown`/`Building2` pero **con el gradient de marca** (`from-primary to-accent`) en lugar de azul/amber/purple ajenos.
- **Unificar radius**: `rounded-2xl` para cards, `rounded-3xl` para hero/CTA, `rounded-full` para pills/botones. Eliminar `rounded-xl` y `rounded-[2.4rem]` salvo el frame del iPhone.
- **Doble sticky → uno**: las tabs de `FeaturesShowcase` no deberían ser sticky si ya hay header sticky. Quitar `sticky top-16`.

#### Sprint 4 — Mobile polish

- **Stickers flotantes condicionales**: ocultar en `<sm` o reposicionar dentro del mockup (overlay sobre la pantalla).
- **Bento PainPoints mobile**: alternativa de 2 columnas en mobile (3 cards arriba "compactas" + 1 hero abajo) en lugar de 5 stacks iguales.
- **Hero h1**: rebajar a `text-[2rem]` en xs y permitir wrap natural sin `<br/>` forzados.
- **Sección Testimonials**: o bien recoger 2 testimonios reales más, o cambiar el formato a una sola card grande centrada sin pretexto de carrusel.

#### Sprint 5 — Voz y temática (refinado)

- **Decidir voz**: recomiendo *coloquial cálido* (la del hero), y reescribir features/benefits para que digan "Sabes lo que ingresaste hoy sin abrir Excel" en lugar de "Dashboard de ingresos en vivo".
- **Sección "Hecho en España"** real: soporte en español, equipo en Barcelona, integración con TPVs/IVA ES, factura simplificada — convierte el eyebrow en valor.
- **Bloque diferenciación**: tabla rápida vs Booksy/Treatwell/Fresha (3 filas: comisión, propiedad de cliente, tienda integrada).
- **Mención PWA**: en `FeaturesShowcase` añadir una feature "Instalable como app" con `Smartphone` icon.

---

### 4. Cómo seguir

Si quieres, ejecuto los sprints en orden (cada uno como mensaje independiente para poder revisar). Mi recomendación: empezar por **Sprint 1 (higiene)** y **Sprint 3 (consistencia visual)** porque son los que más impacto tienen sobre la percepción premium con menos cambio de copy.
