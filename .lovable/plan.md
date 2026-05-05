
# Fix: nuevo tenant queda en Starter, datos no se guardan, citas con horarios cruzados

He auditado el flujo completo (BusinessOnboarding → Stripe → provision-business → OnboardingSetup → wizard → check-availability) y he encontrado **3 bugs de raíz** que explican exactamente lo que has visto.

---

## Bug 1 · El plan siempre aparece como "Starter" tras el pago

**Causa exacta:** en `src/pages/OnboardingSetup.tsx` (línea ~1014) el wizard llama a `provision-business` con el parámetro mal nombrado:

```ts
body: {
  businessName,
  businessSlug,
  email: session.user.email,
  plan: localStorage.getItem("onboarding_plan") || "monthly", // ❌ envía billingCycle como "plan"
}
```

Pero `supabase/functions/provision-business/index.ts` espera **`planSlug`** (no `plan`), y al no recibirlo cae al default `"starter"`. Además, lo que se guarda en `localStorage` es el **billing cycle** (`monthly`/`annual`), no el slug del plan (`starter`/`pro`/`business`). Resultado: el tenant siempre nace Starter, con `max_stylists=1`, `max_services=15` y `features` capadas, aunque hayan pagado Pro.

El webhook `stripe-webhook` tampoco rescata el plan correcto al crear el tenant porque solo reacciona a `customer.subscription.updated/deleted`, no a `checkout.session.completed`, y el `tenant_id` aún no está en el metadata de la suscripción cuando llega.

**Fix:**
1. En `BusinessOnboarding.handleSubmit`, guardar también el plan elegido en `localStorage`:
   ```ts
   localStorage.setItem("onboarding_plan_slug", selectedPlan);
   localStorage.setItem("onboarding_billing_cycle", billingCycle);
   ```
2. En `OnboardingSetup.initSetup`, pasar correctamente:
   ```ts
   body: { businessName, businessSlug, email, planSlug: localStorage.getItem("onboarding_plan_slug") || "starter" }
   ```
3. Verificar contra Stripe antes de provisionar: validar el `session_id` con `stripe.checkout.sessions.retrieve` dentro de `provision-business` (o crear una pequeña edge `verify-checkout-session`) para confirmar que el plan pagado coincide con el `planSlug` enviado y obtener el `subscription.id` para guardarlo en `tenants.stripe_subscription_id`. Esto blinda contra manipulación cliente.
4. En `stripe-webhook`, añadir manejo de `checkout.session.completed` que busque el tenant por `metadata.business_slug` y refresque `subscription_plan`, `max_stylists`, `max_services`, `features` y `subscription_expires_at` con los valores reales de la suscripción. Así, aunque el wizard fallara, el webhook corrige el plan en segundos.

---

## Bug 2 · No se guarda contenido SEO, hero, dirección, slug…

**Causa exacta:** revisando `BusinessInfoStep`, `LocationStep`, `ImagesStep`, `DesignStep` y `AIGenerationStep`, todos hacen `supabase.from("tenants").update({...}).eq("id", tenantId)`. Los `update` están bien escritos, pero:

- El error nunca se muestra (toast.error genérico) y muchos pasos **no esperan a la promesa** o ignoran el error y avanzan igual (ej. `AIGenerationStep.handleSave` swallowea el error).
- Si la sesión ha caducado o el `tenant_admins` no se creó (caso del bug 1, ver más abajo), las RLS de `tenants UPDATE` rechazan silenciosamente todas las escrituras y el wizard sigue avanzando creyendo que guardó.
- El `slug` no se actualiza nunca tras `provision-business`: lo que el cliente personaliza después en `BusinessInfoStep` solo cambia `name`/`description`/etc, pero **el slug se queda con el valor inicial** que mandó la landing. Si el usuario lo cambia en el formulario, no se persiste.

**Fix:**
1. Añadir comprobación post-update en cada Step: si `error` o `data === null`, mostrar toast rojo claro ("No se ha podido guardar — vuelve a intentarlo") y **no avanzar** al siguiente paso.
2. En `BusinessInfoStep` permitir editar y persistir `slug` (con validación de unicidad usando un RPC `check_slug_available`).
3. En `AIGenerationStep.handleSave` propagar el error y desactivar `onNext()` si el update falla.
4. Revisar política RLS de `tenants UPDATE`: debe permitir al `tenant_admin` (no solo al superadmin) escribir todos los campos del onboarding (`tagline`, `description`, `hero_image_url`, `hero_images`, `address`, `city`, `postal_code`, `slug`, `logo_url`, etc.). Hoy se aplica `tenant_admins.is_owner = true`; confirmar que en provision-business se está creando con `is_owner: true` (sí lo hace) y que el rol `admin` también se inserta (sí). Si todo está bien, basta con surfacear errores.
5. Añadir un paso final "**Revisión**" antes de activar el tenant que muestre todos los datos guardados leyéndolos de la BD (no del estado local) para que el dueño confirme antes de publicar. Si falta algo, no se activa.

---

## Bug 3 · Al crear cita en admin salen horarios de "cris" y "desi" (de otro tenant)

**Causa exacta:** en `supabase/functions/check-availability/index.ts` línea 13, el schema valida:

```ts
stylist: z.enum(['cris', 'desi', 'any']).or(z.string())
```

y, peor aún, líneas 36-45 tienen un fallback `getDefaultTenantId()` que **selecciona el primer tenant activo de la BD** si no llega `tenant_id`:

```ts
async function getDefaultTenantId(supabase) {
  const { data: tenant } = await supabase.from('tenants').select('id').eq('is_active', true).limit(1).maybeSingle();
  return tenant?.id || null;
}
```

Como Cristina es el tenant activo más antiguo, cualquier llamada que llegue **sin `tenant_id`** consulta sus reservas y sus stylists `cris`/`desi`. Además el frontend admin (`AdminBookingFlow → DateTimeSelection`) sí pasa `tenantId`, pero si en algún punto del flujo `tenantId` es `undefined` (p. ej. el nuevo tenant aún no terminó onboarding o el componente recibe `null`), se cae al fallback y aparecen los slots de Cristina.

**Fix:**
1. En `check-availability`: eliminar `getDefaultTenantId` por completo. Si `tenant_id` no llega → devolver `400 { error: "tenant_id is required" }`. Forzar a todos los callers a pasarlo.
2. Quitar el `z.enum(['cris','desi','any'])` y dejar solo `z.string().min(1)` — ese enum es legacy de la primera clienta.
3. En `AdminBookingFlow.tsx` y `TenantAdmin.tsx`, asegurar que `tenantId` se resuelve **antes** de renderizar el flujo de booking (loading state si aún no está). Lanzar un `console.error` y un toast si por error se intenta invocar sin tenant.
4. En `DateTimeSelection` y `TenantDateTimeSelection`, añadir guard: si `!tenantId` no hacer fetch y mostrar mensaje "cargando salón…".
5. Auditar las RLS de `bookings SELECT` para confirmar que solo devuelven filas donde `tenant_id = get_user_tenant_id()` para usuarios con rol admin/stylist (defensa en profundidad por si el fallback se reintroduce).

---

## Detalles técnicos (resumen para implementación)

```text
Archivos a modificar
────────────────────
src/pages/BusinessOnboarding.tsx          → guardar plan_slug y billing_cycle en localStorage
src/pages/OnboardingSetup.tsx             → enviar planSlug correcto a provision-business
supabase/functions/provision-business/    → validar contra Stripe session_id (opcional pero recomendado)
supabase/functions/stripe-webhook/        → añadir handler checkout.session.completed
supabase/functions/check-availability/    → eliminar fallback getDefaultTenantId, exigir tenant_id
src/components/booking/DateTimeSelection.tsx           → guard si !tenantId
src/components/tenant/TenantDateTimeSelection.tsx      → guard si !tenantId
src/components/admin/AdminBookingFlow.tsx              → loading state hasta tener tenantId
src/components/onboarding/{BusinessInfo,Location,Images,Design,AIGeneration}Step.tsx
                                           → surfacear errores de update + bloquear onNext si falla
src/components/onboarding/BusinessInfoStep.tsx → permitir editar slug con validación
```

Migración SQL adicional (opcional, defensa en profundidad):
```sql
-- Columna para trazar la suscripción Stripe en el tenant
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS stripe_customer_id text;
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_sub ON public.tenants(stripe_subscription_id);
```

---

## Acción inmediata para tu clienta actual (manual, antes del deploy)

Como el tenant ya quedó mal, te corrijo los datos ahora desde la BD:
- Detectar el `tenant_id` por slug y subir `subscription_plan` a `pro`, `max_stylists=3`, `max_services=50`, `features` Pro completo y `subscription_expires_at` al fin del período de prueba (30 días desde hoy).

Lo hago en cuanto apruebes el plan, junto con los fixes.

---

## Qué no toco

- Diseño visual del wizard (no es el problema).
- Lógica de stylists/horarios por estilista (funciona bien una vez se respeta el `tenant_id`).
- El proceso de pago de Stripe en sí (los Price IDs son correctos).

¿Procedo?
