/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Heading, Link, Section, Text } from 'npm:@react-email/components@0.0.22'
import { BrandEmail, styles as s } from '../email-brand.tsx'

interface Props {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: Props) => (
  <BrandEmail preview="Te han invitado a unirte a Glowapp">
    <Section style={{ ...s.content, textAlign: 'center' as const }}>
      <Text style={s.badge}>Invitación</Text>
      <Heading style={s.h1}>Te esperamos en Glowapp</Heading>
      <Text style={s.lead}>
        Te han invitado a unirte a{' '}
        <Link href={siteUrl} style={s.link}>{siteName}</Link>. Pulsa el botón para aceptar la invitación y
        crear tu cuenta.
      </Text>
      <Section style={s.ctaWrap}>
        <Button style={s.button} href={confirmationUrl}>Aceptar invitación</Button>
      </Section>
      <Text style={{ ...s.muted, margin: '14px 0 24px' }}>
        Si no esperabas esta invitación, puedes ignorar este email.
      </Text>
    </Section>
  </BrandEmail>
)

export default InviteEmail
