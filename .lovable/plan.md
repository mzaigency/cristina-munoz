# Plan: Indicador visual de confirmación WhatsApp + Feature en planes

## Parte 1: Indicador visual en la agenda

solo cuando leas en la tabla bookings que reminder_sent esta en "confirmado"

3. **Añadir indicador visual en las tarjetas de cita** — junto a los iconos existentes (Check completada, ShieldAlert), mostrar un pequeño icono de verificación WhatsApp (un `CheckCheck` de lucide o similar en verde) cuando `whatsapp_confirmed === true`. Se mostrará tanto en vista compacta como expandida.
4. **Tooltip/title** — el icono tendrá `title="Confirmado por WhatsApp"`

## Parte 2: Feature "whatsapp_reminders" en planes

### Migración SQL

Actualizar la tabla `subscription_plans` para añadir `whatsapp_reminders: true` en el JSON `features` de los planes `pro` y `business`, y `false` en `starter`:

```sql
UPDATE subscription_plans SET features = features || '{"whatsapp_reminders": true}' WHERE slug IN ('pro', 'business');
UPDATE subscription_plans SET features = features || '{"whatsapp_reminders": false}' WHERE slug = 'starter';
```

### `src/components/business-landing/PricingSection.tsx`

Añadir al mapa `FEATURE_LABELS`:

```ts
whatsapp_reminders: "Recordatorios por WhatsApp",
```

Esto hará que aparezca automáticamente como check en los planes Pro y Business.

## Archivos a modificar

- `src/components/admin/LocalCalendarCRM.tsx` — fetch con join + icono visual
- `src/components/business-landing/PricingSection.tsx` — label del feature
- Migración SQL — features JSON en subscription_plans