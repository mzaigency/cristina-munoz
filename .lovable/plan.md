## Diagnóstico

Revisando logs de consola y políticas RLS encontré dos bugs distintos que explican que "no se guarde nada":

### Bug 1 · Subida de imagen Hero/Logo falla con RLS
Console muestra:
```
StorageApiError: new row violates row-level security policy
status 403 — handleImageUpload (TenantSettings.tsx:85)
```
Las políticas del bucket `tenant-assets` exigen que `storage.foldername(name)[1] = get_user_tenant_id()` o que exista fila en `tenant_admins`. Si el usuario logueado es **superadmin** (ej. impersonando desde `/admin/montserratfaig`) **no tiene fila** en `tenant_admins` para ese tenant → `get_user_tenant_id()` devuelve `NULL` → la subida falla. **No existe política de SuperAdmin para storage**.

### Bug 2 · UPDATE de `tenants` no guarda nada (silencioso)
Políticas actuales en `public.tenants`:
- `SuperAdmin can update tenants` → UPDATE ✅
- `Tenant admins can view their tenant` → SELECT ✅
- **No hay política UPDATE para `tenant_admins`** ❌

Resultado: cuando un admin de tenant (no superadmin) pulsa "Guardar" en TenantSettings, el `update()` afecta 0 filas pero **no devuelve error** → el toast dice "Guardado" pero no se persiste nada (teléfono, dirección, hero_image_url, etc.). Esto coincide exactamente con el síntoma reportado en el onboarding ("no se ha guardado nada... solo el servicio").

---

## Plan

### 1. Migración SQL

**a) Política UPDATE en `tenants` para tenant_admins:**
```sql
CREATE POLICY "Tenant admins can update their tenant"
ON public.tenants FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM tenant_admins ta WHERE ta.tenant_id = tenants.id AND ta.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM tenant_admins ta WHERE ta.tenant_id = tenants.id AND ta.user_id = auth.uid()));
```

**b) Políticas SuperAdmin en `storage.objects` para `tenant-assets`** (INSERT/UPDATE/DELETE) usando `is_superadmin()`.

**c) Reforzar política upload tenant_admins** (ya existe `tenant_admins_upload_assets`, verificar que cubre el caso).

### 2. Frontend: `TenantSettings.tsx`

Cambiar `handleSave()` para añadir `.select("id")` después del `update()` y lanzar error si `data.length === 0`. Así nunca volverá a aparecer "Guardado" sin haberse guardado realmente.

```typescript
const { data, error } = await supabase
  .from("tenants")
  .update({ ...payload })
  .eq("id", tenantId)
  .select("id");
if (error) throw error;
if (!data || data.length === 0) throw new Error("Sin permisos para guardar");
```

### 3. Verificación

- Probar guardar teléfono/dirección como admin del tenant Montserrat
- Probar subir imagen hero como superadmin impersonando
- Confirmar que el toast de error aparece si falla

### Archivos afectados
- Nueva migración SQL (políticas RLS)
- `src/components/admin/TenantSettings.tsx` (validación post-update)
