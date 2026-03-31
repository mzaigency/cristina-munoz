

## Plan: Safe Areas Globales — Enfoque Eficiente

### Situación actual
El proyecto ya maneja safe areas en la mayoría de sitios, pero de forma **dispersa**: cada página y componente lo hace manualmente con `env(safe-area-inset-*)`. Los componentes UI base (Sheet, Dialog, AlertDialog, Drawer) ya los incluyen. `AppLayout` también los gestiona.

El riesgo actual es que alguna página o popup nuevo se olvide de añadirlos. La solución es **centralizar** en CSS global + ajustar los pocos gaps que existen.

### Cambios

| Archivo | Qué |
|---------|-----|
| `src/index.css` | Añadir regla global en `@layer base` para que `html` tenga `padding: env(safe-area-inset-*)` en los 4 lados. Esto elimina la necesidad de que cada página lo haga por separado. Añadir regla para toasts/sonner con `bottom` offset que respete safe area. |
| `src/components/ui/sonner.tsx` | Posicionar toasts con offset inferior que respete `safe-area-inset-bottom` (actualmente no lo tiene). |
| `src/components/ui/toaster.tsx` | Mismo ajuste para el Toaster de shadcn (si no lo tiene ya). |
| `src/components/navigation/AppLayout.tsx` | Simplificar: quitar el div spacer fijo del top y el padding manual de safe areas, ya que el CSS global lo cubrirá. Mantener `pb-20` para la nav. |

### Enfoque técnico

En vez de hardcodear safe areas en cada componente, usaremos **una sola regla CSS global**:

```css
@layer base {
  html {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

Esto funciona porque:
- `viewport-fit=cover` ya está en el `<meta viewport>` del `index.html`
- El `html` element es el contenedor raíz — todo el contenido hereda el espacio seguro
- Los elementos `fixed` (nav, headers, sheets, dialogs) ya tienen sus propios safe area insets en los componentes UI base

Para los elementos `position: fixed` (que ignoran el padding del html), los componentes base (Sheet, Dialog, BottomNavigation) ya manejan safe areas individualmente, así que no necesitan cambio.

### Lo que NO se toca
- Sheet, Dialog, AlertDialog, Drawer → ya tienen safe areas
- BottomNavigation → ya tiene `pb-[env(safe-area-inset-bottom)]`
- Páginas que usan `noTopSafeArea` con headers sticky propios → seguirán funcionando porque el padding global del `html` se suma naturalmente

### Resultado
Cualquier nueva página o componente que se cree en el futuro **automáticamente** respetará las safe areas sin necesidad de código adicional.

