/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Section, Text } from 'npm:@react-email/components@0.0.22'
import { BrandEmail, PRIMARY, styles as s } from '../email-brand.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  code?: string
  tenantName?: string
  tenantLogoUrl?: string | null
}

const Email = ({ code = '000000', tenantName, tenantLogoUrl }: Props) => (
  <BrandEmail
    preview={`Tu código de confirmación es ${code}`}
    logoUrl={tenantLogoUrl || undefined}
    logoAlt={tenantName || 'Glowapp'}
    footerNote={tenantName ? `Enviado en nombre de ${tenantName}` : undefined}
  >
    <Section style={{ ...s.content, textAlign: 'center' as const }}>
      <Text style={s.badge}>Código de confirmación</Text>
      <Heading style={s.h1}>
        {tenantName ? `Confirma tu reserva en ${tenantName}` : 'Confirma tu reserva'}
      </Heading>
      <Text style={s.lead}>Introduce este código para confirmar tu cita:</Text>
    </Section>

    <Section style={s.content}>
      <Section style={{ ...s.panel, textAlign: 'center' as const }}>
        <Text
          style={{
            ...s.bigValue,
            color: PRIMARY,
            letterSpacing: '0.26em',
            fontFamily: "'Courier New', Courier, monospace",
          }}
        >
          {code}
        </Text>
      </Section>
      <Text style={{ ...s.muted, textAlign: 'center' as const, margin: '14px 0 24px' }}>
        El código caduca en 10 minutos.
        <br />
        Si no has solicitado esta reserva, ignora este email.
      </Text>
    </Section>
  </BrandEmail>
)

export const template = {
  component: Email,
  subject: (d: Props) => `${d?.code || ''} es tu código de Glowapp`.trim(),
  displayName: 'Código de confirmación (reserva sin cuenta)',
  previewData: {
    code: '482913',
    tenantName: 'Cristina Muñoz Perruqueria',
  },
} satisfies TemplateEntry
