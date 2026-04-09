

# Plan: Corregir 3 bugs del Onboarding Setup

## Problemas identificados

### 1. No deja subir imágenes
El `ImagesStep` sube a `tenant-assets` con path `${tenantId}/logo/...`. La política RLS de INSERT en `storage.objects` verifica `foldername(name)[1] = get_user_tenant_id()`. 

**Causa probable**: En modo demo, `provision-business` crea el tenant y el `tenant_admins`, pero `get_user_tenant_id()` podría no reflejar el nuevo tenant si hay caché o si la función no encuentra el registro por algún race condition. Además, el usuario puede estar en el paso de imágenes **antes** de que el `tenant_admins` se propague correctamente.

**Solución**: Añadir una política RLS adicional para INSERT en `storage.objects` que permita subir a `tenant-assets` si el usuario es admin del tenant (verificando directamente contra `tenant_admins` con el folder name, sin depender de `get_user_tenant_id()`). Alternativamente, verificar que `get_user_tenant_id()` funciona y si no, crear un fallback. 

Tras revisar, la política actual es: `(storage.foldername(name))[1] = (get_user_tenant_id())::text`. El problema es que `get_user_tenant_id()` hace una query a `tenant_admins` y devuelve el `tenant_id`. En el onboarding, esto debería funcionar porque `provision-business` ya insertó el registro. Voy a verificar la función `get_user_tenant_id` y si no hay bug ahí, probaré con un enfoque más directo: cambiar la política para verificar contra `tenant_admins` directamente usando el foldername.

### 2. No deja borrar entero la duración de un servicio
En las líneas 532, 559, 569, 580 de `OnboardingSetup.tsx`:
```tsx
onChange={(e) => updateService(index, "duration", parseInt(e.target.value) || 30)}
```
Cuando el usuario borra todo el contenido, `parseInt("")` es `NaN`, y `NaN || 30` = 30. Así que inmediatamente vuelve a 30 y no se puede borrar.

**Solución**: Permitir que el campo esté vacío temporalmente (guardar el valor raw como string o permitir 0 durante edición), pero validar al guardar que no sea 0 ni null. Usar un approach donde se permite el string vacío durante edición y se convierte al enviar.

### 3. Vista previa de temas se sale de la pantalla
El `ThemePreviewModal` en `ThemeStep.tsx` usa `aspect-[9/19]` dentro de un contenedor con `max-w-[300px]`. En viewport 390px con padding, el modal con el phone frame + info + buttons se extiende más allá de la pantalla.

**Solución**: Reducir el tamaño del phone frame, usar `max-h-[85vh]` con scroll, o hacer el preview modal más compacto para que quepa en 390x844.

---

## Cambios por archivo

### `src/pages/OnboardingSetup.tsx`
- **Duración editable**: Cambiar los inputs de duración para usar string en el state y permitir campo vacío. Cambiar `parseInt(e.target.value) || 30` por una función que permita vacío durante edición.
- Actualizar `updateService` para aceptar strings en los campos de duración.
- En `handleSave`, validar que las duraciones sean >= 1 (no null/0), mostrando error si alguna es inválida.

### `src/components/onboarding/ThemeStep.tsx`
- **Preview modal**: Reducir `max-w-[300px]` a `max-w-[260px]`, usar `max-h-[90vh] overflow-y-auto` en el contenedor del modal.
- Ajustar el phone frame para que sea más compacto en móvil.
- Reducir padding y espaciado del info/actions debajo del phone frame.

### Migración SQL (storage RLS)
- Revisar/actualizar la política de INSERT en `storage.objects` para `tenant-assets` para que funcione correctamente durante onboarding. Posiblemente reescribir usando una verificación directa contra `tenant_admins` en vez de `get_user_tenant_id()`.

