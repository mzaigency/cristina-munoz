/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Heading, Section, Text } from 'npm:@react-email/components@0.0.22'
import { BrandEmail, styles as s } from '../email-brand.tsx'

interface Props {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: Props) => (
  <BrandEmail preview="Restablece tu contraseña de Glowapp">
    <Section style={{ ...s.content, textAlign: 'center' as const }}>
      <Text style={s.badge}>Recuperar contraseña</Text>
      <Heading style={s.h1}>Restablece tu contraseña</Heading>
      <Text style={s.lead}>
        Hemos recibido una solicitud para cambiar la contraseña de tu cuenta en{' '}
        <strong style={s.strong}>{siteName}</strong>. Pulsa el botón para crear una nueva.
      </Text>
      <Section style={s.ctaWrap}>
        <Button style={s.button} href={confirmationUrl}>Crear nueva contraseña</Button>
      </Section>
      <Text style={s.muted}>El enlace expira en 1 hora.</Text>
      <Text style={{ ...s.muted, margin: '8px 0 24px' }}>
        Si no has solicitado este cambio, ignora este email. Tu contraseña actual sigue activa.
      </Text>
    </Section>
  </BrandEmail>
)

export default RecoveryEmail
