/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Heading, Section, Text } from 'npm:@react-email/components@0.0.22'
import { BrandEmail, styles as s } from '../email-brand.tsx'

interface Props {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: Props) => (
  <BrandEmail preview="Tu enlace para acceder a Glowapp">
    <Section style={{ ...s.content, textAlign: 'center' as const }}>
      <Text style={s.badge}>Acceso rápido</Text>
      <Heading style={s.h1}>Tu enlace de acceso</Heading>
      <Text style={s.lead}>
        Pulsa el botón para entrar en <strong style={s.strong}>{siteName}</strong>. Este enlace es de un solo
        uso y caduca pronto.
      </Text>
      <Section style={s.ctaWrap}>
        <Button style={s.button} href={confirmationUrl}>Entrar en Glowapp</Button>
      </Section>
      <Text style={{ ...s.muted, margin: '14px 0 24px' }}>
        Si no has pedido este enlace, puedes ignorar este email.
      </Text>
    </Section>
  </BrandEmail>
)

export default MagicLinkEmail
