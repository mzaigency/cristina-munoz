

# Mejora del CRM de Clientes - Plan de Implementación

## Alcance
Mejorar la sección de Clientes del panel admin con mejor UX mobile-first, filtros, estadísticas y acciones rápidas.

## Cambios planificados

### 1. Header con KPIs rápidos
Añadir una fila de stats compactas encima de la lista:
- Total clientes | Nuevos este mes | Gasto medio | Clientes inactivos (>30 días)
- Calculados directamente desde los datos ya cargados (sin queries extra)

### 2. Filtros con chips horizontales
Fila de chips scrollable debajo del buscador:
- "Todos", "VIP", "Frecuente", "Nuevo", "Inactivos (+30d)", "Top gastadores"
- Filtrado client-side sobre los datos existentes

### 3. Selector de ordenación
Dropdown compacto para ordenar por: Última visita, Nombre A-Z, Mayor gasto, Más visitas

### 4. Tarjetas de cliente mejoradas
- Avatar con iniciales coloreadas (basado en nombre)
- Indicador visual de gasto (mini barra o badge de gasto total)
- Mejor layout mobile con información más visible

### 5. Ficha de detalle enriquecida
- Servicios más frecuentes (calculados del historial de bookings)
- Botones de acción rápida: Llamar, WhatsApp, Enviar mensaje in-app, Crear cita
- Campo de cumpleaños (requiere migración DB para añadir columna `birthday` a tabla clients)
- Mejor diseño visual del historial

### 6. Exportar a CSV
Botón en el header para descargar listado de clientes como CSV (client-side, sin edge function)

### 7. Detección de duplicados
Al crear cliente, verificar si ya existe uno con el mismo teléfono y avisar

## Cambios en base de datos
- Migración: añadir columna `birthday date` a tabla `clients` (nullable)

## Archivos a modificar
- `src/components/admin/ClientsCRM.tsx` - Refactor completo del componente
- Migración SQL para columna birthday

## Notas técnicas
- Todo mobile-first con safe zones respetadas
- Sin dependencias nuevas, usando componentes UI existentes
- Filtros y stats calculados client-side para mantener rendimiento
- Export CSV usando Blob API nativa del navegador

