/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Heading, Link, Section, Text } from 'npm:@react-email/components@0.0.22'
import { BrandEmail, styles as s } from '../email-brand.tsx'

interface Props {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ recipient, confirmationUrl }: Props) => (
  <BrandEmail preview="Confirma tu email para activar tu cuenta de Glowapp">
    <Section style={{ ...s.content, textAlign: 'center' as const }}>
      <Text style={s.badge}>Confirma tu email</Text>
      <Heading style={s.h1}>¡Ya casi estás!</Heading>
      <Text style={s.lead}>
        Gracias por unirte a <strong style={s.strong}>Glowapp</strong>. Solo te falta un paso: confirma que{' '}
        <Link href={`mailto:${recipient}`} style={s.link}>{recipient}</Link> es tu email.
      </Text>
      <Section style={s.ctaWrap}>
        <Button style={s.button} href={confirmationUrl}>Confirmar mi cuenta</Button>
      </Section>
      <Text style={s.muted}>Este enlace expira en 24 horas.</Text>
      <Text style={{ ...s.muted, margin: '8px 0 24px' }}>
        Si no creaste una cuenta en Glowapp, puedes ignorar este email sin problema.
      </Text>
    </Section>
  </BrandEmail>
)

export default SignupEmail
