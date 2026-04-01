

# Vincular Ficha de Cliente con Usuario Registrado

## Resumen
Añadir la posibilidad de vincular cada ficha de cliente del CRM con un usuario registrado en la app (tabla `profiles`). Así el admin puede ver si un cliente tiene cuenta, su @username y avatar.

## Cambios planificados

### 1. Migración DB: añadir `user_id` a `clients`
```sql
ALTER TABLE public.clients ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
```

### 2. Actualizar tipos (`clients/types.ts`)
- Añadir `user_id: string | null` al interface `Client`

### 3. Buscador de usuario en ClientForm
- Añadir campo "Vincular cuenta @" con input de búsqueda
- Al escribir, buscar en `profiles` por `username` o `full_name` (igual que en AdminBookingFlow)
- Dropdown con resultados mostrando avatar + nombre + @username
- Al seleccionar, guardar el `user_id` en el payload de insert/update
- Indicador visual cuando está vinculado, con opción de desvincular

### 4. Mostrar cuenta vinculada en ClientDetail
- En el header de la ficha, si tiene `user_id`, mostrar avatar y @username del perfil vinculado
- Fetch al `profiles` con el `user_id` para obtener avatar y username
- Badge visual "Cuenta vinculada" o "Sin cuenta" si no tiene

### 5. Indicador en ClientCard
- Pequeño icono o badge en la tarjeta de la lista si el cliente tiene cuenta vinculada (ej: icono de @ o checkmark)

## Archivos a modificar
1. **Migración SQL** - nueva columna `user_id`
2. `src/components/admin/clients/types.ts` - añadir `user_id`
3. `src/components/admin/clients/ClientForm.tsx` - buscador de usuario + vincular
4. `src/components/admin/clients/ClientDetail.tsx` - mostrar perfil vinculado
5. `src/components/admin/clients/ClientCard.tsx` - indicador visual

## Notas técnicas
- La búsqueda de perfiles usa la misma RLS policy "Admins can view all profiles" que ya existe
- Mobile-first: dropdown de búsqueda con scroll y safe zones
- Sin dependencias nuevas

