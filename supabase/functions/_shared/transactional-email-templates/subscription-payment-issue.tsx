/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Heading, Section, Text } from 'npm:@react-email/components@0.0.22'
import { BrandEmail, styles as s } from '../email-brand.tsx'
import type { TemplateEntry } from './registry.ts'

type Kind = 'payment_failed' | 'trial_ending' | 'renewed' | 'cancelled'

interface Props {
  ownerName?: string
  tenantName?: string
  planName?: string
  amount?: string | null
  date?: string | null
  kind?: Kind
  billingUrl?: string
}

const COPY: Record<Kind, { badge: string; title: (n: string) => string; lead: string; cta: string; note: string }> = {
  payment_failed: {
    badge: 'Pago rechazado',
    title: (n) => `No hemos podido cobrar tu plan, ${n}`,
    lead: 'Tu banco ha rechazado el cargo. Actualiza tu tarjeta para que tu salón siga funcionando sin cortes.',
    cta: 'Actualizar método de pago',
    note: 'Volveremos a intentarlo automáticamente durante los próximos días.',
  },
  trial_ending: {
    badge: 'Prueba a punto de acabar',
    title: (n) => `Tu mes gratis termina pronto, ${n}`,
    lead: 'Cuando acabe la prueba empezaremos a cobrar tu plan. No hay permanencia: puedes cancelar cuando quieras.',
    cta: 'Ver mi plan',
    note: 'Si quieres cambiar de plan, hazlo antes de la fecha de renovación.',
  },
  renewed: {
    badge: 'Plan renovado',
    title: (n) => `Tu plan se ha renovado, ${n}`,
    lead: 'Todo sigue en marcha. Aquí tienes el detalle de la renovación.',
    cta: 'Ver facturación',
    note: 'Puedes descargar tus facturas desde el panel en cualquier momento.',
  },
  cancelled: {
    badge: 'Suscripción cancelada',
    title: (n) => `Tu suscripción se ha cancelado, ${n}`,
    lead: 'Tu salón dejará de estar publicado al final del periodo pagado. Puedes reactivarlo cuando quieras.',
    cta: 'Reactivar mi plan',
    note: 'Tus datos se conservan; nada se pierde si vuelves.',
  },
}

const Email = ({
  ownerName = 'Hola',
  tenantName = 'tu salón',
  planName = 'tu plan',
  amount,
  date,
  kind = 'payment_failed',
  billingUrl = 'https://glowapp.app/admin',
}: Props) => {
  const copy = COPY[kind] || COPY.payment_failed
  return (
    <BrandEmail preview={copy.lead}>
      <Section style={{ ...s.content, textAlign: 'center' as const }}>
        <Text style={s.badge}>{copy.badge}</Text>
        <Heading style={s.h1}>{copy.title(ownerName)}</Heading>
        <Text style={s.lead}>{copy.lead}</Text>
      </Section>

      <Section style={s.content}>
        <Section style={s.panel}>
          <Text style={s.label}>Negocio</Text>
          <Text style={s.value}>{tenantName}</Text>
          <Section style={s.divider}>&nbsp;</Section>
          <Text style={s.label}>Plan</Text>
          <Text style={s.value}>{planName}</Text>
          {amount ? (
            <>
              <Section style={s.divider}>&nbsp;</Section>
              <Text style={s.label}>Importe</Text>
              <Text style={s.value}>{amount}</Text>
            </>
          ) : null}
          {date ? (
            <>
              <Section style={s.divider}>&nbsp;</Section>
              <Text style={s.label}>Fecha</Text>
              <Text style={s.value}>{date}</Text>
            </>
          ) : null}
        </Section>

        <Section style={s.ctaWrap}>
          <Button style={s.button} href={billingUrl}>{copy.cta}</Button>
        </Section>
        <Text style={{ ...s.muted, textAlign: 'center' as const, margin: '12px 0 24px' }}>{copy.note}</Text>
      </Section>
    </BrandEmail>
  )
}

export const template = {
  component: Email,
  subject: (d: Props) => {
    const k = (d?.kind || 'payment_failed') as Kind
    const name = d?.tenantName || 'tu salón'
    if (k === 'trial_ending') return `Tu prueba gratis de Glowapp termina pronto`
    if (k === 'renewed') return `Plan renovado · ${name}`
    if (k === 'cancelled') return `Suscripción cancelada · ${name}`
    return `Problema con el pago de tu plan Glowapp`
  },
  displayName: 'Facturación del plan',
  previewData: {
    ownerName: 'Cristina',
    tenantName: 'Cristina Muñoz Perruqueria',
    planName: 'Pro',
    amount: '49,00 €',
    date: '01/08/2026',
    kind: 'payment_failed',
  },
} satisfies TemplateEntry
