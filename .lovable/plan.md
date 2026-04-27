# Plan: Reducir fricción de entrada + Kit de Transición WhatsApp

Dos cambios para acelerar la activación de nuevos negocios y darles munición para avisar a sus clientes desde el día uno.

---

## 1. Servicios precargados por tipo de negocio (Prioridad Alta)

**Objetivo:** Que cuando un negocio elija "Peluquería" (u otro tipo) en el onboarding, llegue al paso de servicios con ~10 servicios típicos ya rellenos, no con un folio en blanco.

### Qué hacemos

**a) Crear catálogo de servicios sugeridos por tipo de negocio**
Nuevo archivo `src/components/onboarding/suggested-services.ts` con un diccionario `business_type → ServiceForm[]` que cubre los 7 tipos existentes (peluquería, barbería, salón de belleza, estética, spa, uñas, multiservicios). Cada tipo tendrá entre 8 y 12 servicios típicos del sector con nombre, categoría, duración y precio orientativo en EUR. Ejemplos:

- **Peluquería:** Corte mujer, Corte hombre, Lavar y peinar, Tinte raíz, Tinte completo, Mechas, Mechas californianas, Tratamiento hidratación, Recogido, Flequillo.
- **Barbería:** Corte clásico, Corte + barba, Afeitado tradicional, Arreglo de barba, Corte niño, Tinte barba, Ritual completo, Cejas.
- **Uñas:** Manicura básica, Manicura semipermanente, Pedicura básica, Pedicura spa, Uñas acrílicas, Uñas gel, Nail art, Retirada esmalte.
- (Igual para los demás tipos.)

**b) Pasar el `business_type` al ServicesStep**
El tipo elegido en `BusinessTypeStep` ya se guarda en `tenants.features.business_type`. En `OnboardingSetup.tsx` lo pasaremos como prop al `ServicesStep` (o lo lee directamente del tenant al montar).

**c) Auto-rellenar al entrar al paso**
Al montar el `ServicesStep`, si el catálogo tiene servicios para ese tipo, en vez de un único servicio vacío se inicializa el array con la lista sugerida. El usuario puede:

- Editar nombre/precio/duración de cualquiera.
- Eliminar los que no ofrece (botón "Eliminar" ya existe).
- Añadir nuevos (botón "Añadir servicio" ya existe).

**d) Banner informativo + botón "Empezar de cero"**
Encima de la lista, un banner sutil tipo Liquid Glass:

> "Hemos precargado servicios típicos de [Peluquería]. Edita precios y duraciones, elimina los que no ofreces, o empieza de cero."

Con un botón secundario "Empezar de cero" que vacía la lista y deja un único servicio en blanco (comportamiento actual).

**e) "Servicio de Guante Blanco" — CTA de ayuda humana**
En el mismo paso, un segundo bloque pequeño tipo card con icono de cámara / WhatsApp:

> "¿Prefieres que lo configuremos por ti? Mándanos una foto de tu lista de precios por correo y lo dejamos listo en menos de 24h."

Con botón que abre `contacto@glowapp.app` con un mensaje pre-rellenado: *"Hola, soy [nombre del negocio] y quiero que me configuréis los servicios. Os adjunto foto de mi lista de precios."* El correo lo dejamos como constante editable.

---

## 2. Kit de Transición WhatsApp (Prioridad Media)

**Objetivo:** Dar al negocio plantillas listas para copiar y pegar para anunciar a sus clientes que ahora reservan por la app.

### Qué hacemos

**a) Nueva pestaña "Kit WhatsApp" en Marketing**
En `src/components/admin/sections/MarketingSection.tsx` añadimos una tercera pestaña junto a "Posts" y "Tarjetas QR":

```
[ Posts ] [ Tarjetas QR ] [ Kit WhatsApp ]
```

**b) Nuevo componente `WhatsAppKit.tsx**`
Contenido organizado en categorías colapsables o tabs internas:

1. **Estado de WhatsApp** (textos cortos, ≤139 caracteres)
  - "Reserva tu cita 24/7 en mi nueva app 💇‍♀️ link en bio"
  - "Ya no hace falta llamar — reserva online: [enlace]"
  - 3-4 variantes.
2. **Mensaje masivo a clientas** (texto largo personalizable)
  - Plantilla con `{nombre_cliente}` y `{nombre_salon}` que se sustituye en vivo si el negocio escribe su nombre.
  - Ejemplo: *"Hola {nombre}! Te escribo desde {salon}. A partir de ahora puedes reservar tu cita directamente desde el móvil sin llamadas ni esperas: [enlace]. ¡Pruébalo y dime qué te parece!"*
3. **Bio de Instagram / TikTok**
  - "📅 Reserva online 24/7 → [enlace]"
4. **Story / Post de anuncio**
  - Texto para acompañar una imagen anunciando el cambio.
5. **Respuesta automática WhatsApp Business**
  - Texto sugerido para configurar como mensaje de bienvenida/ausencia.

**c) UX del kit**
Cada plantilla en una card con:

- Texto previsualizado (ya con el enlace del salón sustituido: `https://glowapp.app/{slug}`).
- Botón **"Copiar"** (usa `navigator.clipboard` + toast "Copiado").
- Botón **"Compartir por WhatsApp"** que abre `https://wa.me/?text=<encoded>` (Web Share API en móvil).

El enlace del salón se obtiene del tenant actual (`tenants.slug`). Si aún no tiene slug, mostramos placeholder con aviso suave.

---

## Detalles técnicos

**Archivos nuevos**

- `src/components/onboarding/suggested-services.ts` — diccionario de servicios por tipo.
- `src/components/admin/marketing/WhatsAppKit.tsx` — componente del kit.

**Archivos modificados**

- `src/pages/OnboardingSetup.tsx` — leer `business_type` del tenant en `ServicesStep`, pre-rellenar estado inicial, añadir banner + CTA Guante Blanco.
- `src/components/admin/sections/MarketingSection.tsx` — añadir tercera pestaña.

**Sin cambios de base de datos.** Los servicios precargados se insertan con la lógica `INSERT` que ya existe en `handleSave`. No tocamos RLS ni edge functions.

**Estética:** Liquid Glass coherente con el resto de la app, mobile-first, respetando safe areas.

**Sin emojis innecesarios en código** — los emojis solo dentro de las plantillas WhatsApp donde aportan al mensaje real.

---

## Pregunta abierta antes de implementar

Necesito confirmar **el número de WhatsApp del "Servicio de Guante Blanco"** para enlazar el `wa.me`. Si me lo pasas al aprobar, lo dejo cableado; si no, lo dejo como constante en `src/config/support.ts` con un valor placeholder bien marcado.