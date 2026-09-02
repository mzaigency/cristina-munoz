/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Heading, Link, Section, Text } from 'npm:@react-email/components@0.0.22'
import { BrandEmail, styles as s } from '../email-brand.tsx'

interface Props {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ siteName, oldEmail, newEmail, confirmationUrl }: Props) => (
  <BrandEmail preview="Confirma el cambio de email en Glowapp">
    <Section style={{ ...s.content, textAlign: 'center' as const }}>
      <Text style={s.badge}>Cambio de email</Text>
      <Heading style={s.h1}>Confirma tu nuevo email</Heading>
      <Text style={s.lead}>
        Has solicitado cambiar el email de tu cuenta en <strong style={s.strong}>{siteName}</strong>.
      </Text>
      <Section style={s.panel}>
        <Text style={s.label}>Email actual</Text>
        <Text style={s.value}>
          <Link href={`mailto:${oldEmail}`} style={s.link}>{oldEmail}</Link>
        </Text>
        <Section style={s.divider}>&nbsp;</Section>
        <Text style={s.label}>Email nuevo</Text>
        <Text style={s.value}>
          <Link href={`mailto:${newEmail}`} style={s.link}>{newEmail}</Link>
        </Text>
      </Section>
      <Section style={s.ctaWrap}>
        <Button style={s.button} href={confirmationUrl}>Confirmar cambio</Button>
      </Section>
      <Text style={{ ...s.muted, margin: '14px 0 24px' }}>
        Si no has pedido este cambio, protege tu cuenta cambiando tu contraseña cuanto antes.
      </Text>
    </Section>
  </BrandEmail>
)

export default EmailChangeEmail
