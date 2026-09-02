/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Heading, Section, Text } from 'npm:@react-email/components@0.0.22'
import { BrandEmail, styles as s, PRIMARY } from '../email-brand.tsx'

interface Props {
  token: string
}

export const ReauthenticationEmail = ({ token }: Props) => (
  <BrandEmail preview="Tu código de verificación de Glowapp">
    <Section style={{ ...s.content, textAlign: 'center' as const }}>
      <Text style={s.badge}>Verificación</Text>
      <Heading style={s.h1}>Tu código de verificación</Heading>
      <Text style={s.lead}>Introduce este código para confirmar tu identidad:</Text>
      <Section style={{ ...s.panel, textAlign: 'center' as const }}>
        <Text style={code}>{token}</Text>
      </Section>
      <Text style={{ ...s.muted, margin: '0 0 24px' }}>
        El código caduca en unos minutos. Si no has pedido esto, ignora el email.
      </Text>
    </Section>
  </BrandEmail>
)

export default ReauthenticationEmail

const code = {
  fontSize: '34px',
  fontWeight: 800 as const,
  letterSpacing: '0.28em',
  color: PRIMARY,
  margin: 0,
  fontFamily: "'Courier New', monospace",
}
