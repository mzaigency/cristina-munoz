

# Plan: Email de confirmación B2B via Resend

## Implementación

Añadir un template `b2b-lead-confirmation` al edge function `send-email` existente (que ya usa Resend) y dispararlo desde el formulario B2B.

### 1. `supabase/functions/send-email/index.ts`
- Ampliar `EmailType` con `'b2b-lead-confirmation'`
- Añadir template con branding GlowApp: logo, gradiente indigo/violeta, copy aprobado
- Copy del email:
  > Hola [contact_name],
  > Hemos recibido tu solicitud de información sobre GlowApp y nos alegra mucho que quieras dar el paso para profesionalizar tu salón.
  > Lo ideal es que hablemos 10 minutos para entender las necesidades específicas de tu negocio y mostrarte cómo puedes empezar a ahorrar tiempo y dinero desde el primer día.
  > Te contactaremos en las próximas 24 horas.
  > — El equipo de GlowApp
- Botón CTA: "Visita GlowApp" → glowapp.app
- Info box con el nombre del negocio registrado

### 2. `src/components/business-landing/B2BLeadForm.tsx`
- Después del insert exitoso y antes del webhook, añadir llamada fire-and-forget:
```typescript
supabase.functions.invoke('send-email', {
  body: {
    type: 'b2b-lead-confirmation',
    to: parsed.data.email,
    data: {
      contactName: parsed.data.contact_name,
      businessName: parsed.data.business_name,
    },
  },
}).catch(() => {});
```

### 3. Deploy
- Redesplegar `send-email` edge function

## Sin migraciones SQL
No se necesitan cambios en base de datos.

