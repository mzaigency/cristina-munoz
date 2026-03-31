

## Plan: Sidebar Navigation para Admin Panel en Móvil

### Problema actual
El panel de admin usa una barra horizontal de tabs debajo del header que en móvil (390px) se desborda horizontalmente y requiere scroll lateral — difícil de navegar con 7 secciones.

### Solución
Reemplazar la navegación horizontal en móvil por un **sidebar deslizable desde la izquierda** (drawer/sheet), activado con un botón hamburguesa en el header. En desktop se mantiene el layout actual.

### Diseño del Sidebar Móvil

```text
┌──────────────────────┐
│ ☰  Cristina Muñoz  ⋯│  ← Header simplificado con hamburguesa
├──────────────────────┤
│                      │
│   Contenido activo   │
│                      │
└──────────────────────┘

Al tocar ☰:
┌─────────────┬────────┐
│ Logo + Name │        │
│─────────────│ (dim)  │
│ ▸ Inicio    │        │
│ ▸ Agenda  2 │        │
│ ▸ Clientes  │        │
│ ▸ Negocio   │        │
│ ▸ Equipo    │        │
│ ▸ Comunica 3│        │
│ ▸ Ajustes   │        │
│─────────────│        │
│ Ver web ↗   │        │
│ Cerrar ses. │        │
└─────────────┴────────┘
```

- Cada item muestra icono + label + badge (si aplica)
- Tab activo resaltado con fondo primary y texto blanco
- Al seleccionar un tab, el drawer se cierra automáticamente
- Logo/nombre del salón en la parte superior del sidebar
- "Ver web" y "Cerrar sesión" en la parte inferior
- Safe area respetada (top y bottom)

### Cambios técnicos

| Archivo | Cambio |
|---------|--------|
| `src/pages/TenantAdmin.tsx` | En móvil: reemplazar la `<nav>` horizontal por un `<Sheet>` (drawer izquierdo). Mover botones de acción (Ver web, Home, Logout) al sidebar. Header queda con: hamburguesa + logo/nombre + ayuda/tour. En desktop: sin cambios. |

### Detalles de implementación

1. **Header móvil simplificado**: Botón hamburguesa (Menu icon) a la izquierda, logo + nombre en centro, tour/ayuda a la derecha
2. **Sheet from left**: Usar el componente `Sheet` existente con `side="left"` 
3. **Nav items en vertical**: Reutilizar el array `navItems` existente, renderizados como botones verticales con icono, label y badge
4. **Footer del sidebar**: "Ver web" y "Cerrar sesión" fijados abajo
5. **Auto-close**: `setOpen(false)` al seleccionar un tab
6. **Swipe navigation**: Se mantiene para el contenido
7. **Safe areas**: `padding-top: env(safe-area-inset-top)` en el sidebar y `padding-bottom: env(safe-area-inset-bottom)`

Solo se modifica `src/pages/TenantAdmin.tsx`. No se crean componentes nuevos — el sidebar es inline usando `Sheet`.

