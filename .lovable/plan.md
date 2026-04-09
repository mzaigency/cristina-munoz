

# Plan: Rediseñar el Tour Interactivo

## Problemas actuales
1. El botón de tour está en el header y el prompt de "¿Primera vez?" se posiciona mal en móvil (se sale de pantalla)
2. El tour es un modal estático centrado — poco dinámico y nada interactivo
3. Los 10 pasos con dots no caben bien en 390px

## Nuevo diseño: Tour bottom-sheet con animaciones y swipe

### Concepto
- **Bottom-sheet estilo iOS** en vez de modal centrado — siempre visible sin tapar la navegación
- **Swipeable** entre pasos (gesture horizontal)
- **Animación del icono** con pulse/bounce al entrar cada paso
- **Fondo con spotlight** suave que destaca la zona relevante
- **Auto-prompt** aparece como bottom-sheet pequeño, no como floating card que se sale

### Cambios en `InteractiveTour.tsx`

**Estructura del tour activo:**
- Bottom sheet fijo (`fixed bottom-0`) con `safe-area-inset-bottom`
- Altura máxima `60vh`, con contenido scrollable si necesario
- Animación slide-up al aparecer, slide-down al cerrar
- Swipe left/right para navegar entre pasos (reusando touch events)
- Swipe down para cerrar/skip

**Contenido de cada paso:**
- Icono grande animado (scale bounce + gradient background)
- Título y descripción compactos
- Tips con chips/pills en vez de lista vertical (ahorra espacio)
- Barra de progreso visual tipo segmentos (no dots — mejor para 10 pasos en móvil)

**Auto-prompt para nuevos usuarios:**
- Bottom-sheet mini (no floating card) — siempre dentro de pantalla
- Posicionado con `bottom: calc(env(safe-area-inset-bottom) + 16px)`

**Navegación:**
- Botones "Anterior" / "Siguiente" con iconos
- Progress bar segmentada en la parte superior del sheet
- Swipe gesture nativo para avanzar/retroceder
- Tap en el fondo oscuro = skip

### Animaciones (motion/react)
- `slideY` from bottom para abrir/cerrar
- `slideX` para transición entre pasos (como carrusel)
- Icono: `scale(0) → scale(1.1) → scale(1)` con spring
- Progress segments: width animation suave

### Archivos a modificar
- `src/components/admin/InteractiveTour.tsx` — reescritura completa del componente

### Sin cambios en otros archivos
El componente se renderiza igual desde `TenantAdmin.tsx`, solo cambia su UI interna.

