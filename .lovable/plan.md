# Pantallas del cliente en escritorio: estética premium Glowapp

Objetivo: que Inicio, Mis Citas, Mensajes y Mi Perfil se vean como un producto único y cuidado en ordenador, sin las mezclas de estilos actuales, y con los salones en rejilla con botón "Ver más" en vez de scroll infinito.

## Qué está descuadrado hoy

Comprobado en la pantalla de Inicio a 1440px:

- El contenido queda arrinconado a la izquierda con un hueco vacío enorme a la derecha: las tarjetas de las secciones tienen un ancho fijo (310px) dentro de filas deslizables pensadas para móvil.
- El buscador va centrado con un ancho distinto al del resto del contenido, así que nada queda alineado entre sí.
- La fila de categorías se corta por el borde derecho, sin final visible ni flechas.
- Conviven tres lenguajes visuales: chips de colores distintos (naranja, verde, azul), pastilla negra de "Todos", botones flotantes redondos y tarjetas con sombras diferentes.
- El menú lateral usa otro registro: botón con degradado, subrayados y tipografías que no casan con el contenido.

## Qué se hará

**1. Una sola rejilla de contenido**
- Mismo ancho y márgenes para cabecera, buscador, filtros y contenido: todo alineado en la misma columna centrada.
- En escritorio los salones pasan a rejilla de 3 (y 4 en pantallas grandes) por sección, con tarjetas que crecen al ancho disponible. En móvil se mantiene la fila deslizable actual, que ahí funciona bien.
- Cada sección muestra una primera tanda y un botón "Ver más" que despliega el resto — nada de scroll infinito ni carga automática.

**2. Tarjetas de salón premium**
- Una sola forma de tarjeta: foto grande con esquinas de marca, nombre, descripción a dos líneas, ciudad y valoración en su sitio fijo, y borde/sombra suaves iguales en todas.
- Las etiquetas ("Huecos hoy", "Nuevo", "Popular", "Verificado") se unifican en un único estilo de marca en vez de cinco colores distintos.
- Al pasar el ratón: elevación sutil y ligero acercamiento de la foto, con el easing de marca.

**3. Filtros y buscador**
- Fila de categorías con un solo estilo de pastilla (activa en azul de marca, resto neutra), con contador cuando aplique, y en escritorio repartida sin corte lateral.
- Buscador con el ancho del contenido, borde y sombra de marca, y el botón de enviar en el degradado Glowapp (único acento fuerte de la pantalla).
- El conmutador Descubrir/Actividad se integra en la cabecera en lugar de flotar centrado.

**4. Menú lateral**
- Tipografía, radios, colores y espaciados de los tokens de marca; activo marcado con color y peso, sin degradados sueltos.
- Pie del menú con una sola acción principal y el resto en secundario.

**5. Mis Citas, Mensajes y Mi Perfil**
- Misma columna, misma cabecera y mismas tarjetas que Inicio: en escritorio las citas pasan a rejilla de dos columnas en vez de una lista estrecha centrada.
- Mensajes con lista y conversación a dos paneles bien proporcionados en escritorio.
- Perfil con tarjetas de la misma familia y avatar/datos alineados a la rejilla.
- Cero cambios en móvil salvo los que hereden de las tarjetas unificadas; se respetan las zonas seguras de iPhone.

## Detalles técnicos

- Layout: `AppLayout` define un contenedor único (`glow-container`) reutilizado por `Index`, `MyBookings`, `Messages`, `Profile`; se elimina el desajuste entre `max-w-2xl/3xl` del buscador y `max-w-6xl` del contenido.
- `FeedSection`: en `md+` renderiza rejilla (`grid` 3/4 col) en lugar de flex con `overflow-x-auto`; `FeedCarouselItem` deja de forzar ancho fijo cuando está en modo rejilla. Estado de sección con tanda inicial + "Ver más" (paso configurable), sustituyendo el crecimiento por scroll de `Index` (`visibleCount`/`ITEMS_PER_PAGE` se reutiliza por sección).
- `PremiumSalonCard`: unificación de badges en un componente interno de etiqueta con variantes basadas en tokens `--glow-*`; alturas fijas por bloque para que la rejilla no baile.
- `CategoryPills`: un único estilo con variantes activa/inactiva por tokens; en escritorio `flex-wrap` en vez de scroll horizontal.
- `ClientSidebar`: colores, radios y tipografía desde tokens; se retira el degradado del botón secundario.
- Solo capa de presentación: nada de cambios en consultas, hooks de datos ni backend.
