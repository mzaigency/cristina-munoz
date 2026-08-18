/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Heading, Section, Text } from 'npm:@react-email/components@0.0.22'
import { BrandEmail, styles as s } from '../email-brand.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  customerName?: string
  tenantName?: string
  tenantLogoUrl?: string | null
  date?: string
  time?: string
  stylist?: string | null
  services?: string
  expiresIn?: string
  acceptUrl?: string
}

const Email = ({
  customerName = 'Hola',
  tenantName = 'el salón',
  tenantLogoUrl,
  date = '',
  time = '',
  stylist,
  services = '',
  expiresIn = '2 horas',
  acceptUrl = 'https://glowapp.app/mis-citas',
}: Props) => (
  <BrandEmail
    preview={`Se ha liberado un hueco en ${tenantName}: ${date} a las ${time}`}
    logoUrl={tenantLogoUrl || undefined}
    logoAlt={tenantName}
    footerNote={`Enviado en nombre de ${tenantName}`}
  >
    <Section style={{ ...s.content, textAlign: 'center' as const }}>
      <Text style={s.badge}>Hueco disponible</Text>
      <Heading style={s.h1}>¡Se ha liberado tu hueco, {customerName}!</Heading>
      <Text style={s.lead}>
        Estabas en la lista de espera de <strong style={s.strong}>{tenantName}</strong> y acaba de quedar
        libre una hora que encaja contigo.
      </Text>
    </Section>

    <Section style={s.content}>
      <Section style={{ ...s.panel, textAlign: 'center' as const }}>
        <Text style={s.label}>Hueco propuesto</Text>
        <Text style={s.bigValue}>{time}</Text>
        <Text style={{ ...s.muted, margin: '6px 0 0' }}>{date}</Text>
      </Section>

      <Section style={s.dashed}>&nbsp;</Section>

      {services || stylist ? (
        <Section style={s.panel}>
          {services ? (
            <>
              <Text style={s.label}>Servicios</Text>
              <Text style={s.value}>{services}</Text>
            </>
          ) : null}
          {stylist ? (
            <>
              {services ? <Section style={s.divider}>&nbsp;</Section> : null}
              <Text style={s.label}>Profesional</Text>
              <Text style={s.value}>{stylist}</Text>
            </>
          ) : null}
        </Section>
      ) : null}

      <Section style={s.ctaWrap}>
        <Button style={s.button} href={acceptUrl}>Confirmar este hueco</Button>
      </Section>
      <Text style={{ ...s.muted, textAlign: 'center' as const, margin: '12px 0 24px' }}>
        Reservado para ti durante {expiresIn}. Si no lo confirmas, pasará a la siguiente persona.
      </Text>
    </Section>
  </BrandEmail>
)

export const template = {
  component: Email,
  subject: (d: Props) => `Hueco libre en ${d?.tenantName || 'tu salón'}: ${d?.date || ''} a las ${d?.time || ''}`.trim(),
  displayName: 'Hueco de lista de espera',
  previewData: {
    customerName: 'Laura',
    tenantName: 'Cristina Muñoz Perruqueria',
    date: '25/07/2026',
    time: '10:30',
    stylist: 'Cristina',
    services: 'Corte + Color',
    expiresIn: '2 horas',
  },
} satisfies TemplateEntry
