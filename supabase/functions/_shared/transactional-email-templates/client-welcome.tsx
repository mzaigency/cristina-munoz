/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Heading, Section, Text } from 'npm:@react-email/components@0.0.22'
import { BrandEmail, styles as s } from '../email-brand.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  customerName?: string
  tenantName?: string
  appUrl?: string
}

const Email = ({
  customerName = 'Hola',
  tenantName,
  appUrl = 'https://glowapp.app',
}: Props) => (
  <BrandEmail preview="Bienvenida a Glowapp: tus citas, siempre a mano">
    <Section style={{ ...s.content, textAlign: 'center' as const }}>
      <Text style={s.badge}>Bienvenida</Text>
      <Heading style={s.h1}>Bienvenida a Glowapp, {customerName}</Heading>
      <Text style={s.lead}>
        {tenantName
          ? <>Tu primera reserva en <strong style={s.strong}>{tenantName}</strong> ya está hecha. Esto es lo que puedes hacer ahora.</>
          : <>Tu primera reserva ya está hecha. Esto es lo que puedes hacer ahora.</>}
      </Text>
    </Section>

    <Section style={s.content}>
      <Section style={s.panel}>
        <Text style={s.label}>Paso 1</Text>
        <Text style={s.value}>Instala la app en tu móvil</Text>
        <Text style={{ ...s.muted, margin: '4px 0 0' }}>
          Abre glowapp.app en el móvil y añádela a tu pantalla de inicio. Recibirás recordatorios de tus citas.
        </Text>
        <Section style={s.divider}>&nbsp;</Section>
        <Text style={s.label}>Paso 2</Text>
        <Text style={s.value}>Gestiona tus citas sin llamar</Text>
        <Text style={{ ...s.muted, margin: '4px 0 0' }}>
          Reserva, reprograma o cancela cuando quieras, 24/7.
        </Text>
        <Section style={s.divider}>&nbsp;</Section>
        <Text style={s.label}>Paso 3</Text>
        <Text style={s.value}>Sigue a tus salones favoritos</Text>
        <Text style={{ ...s.muted, margin: '4px 0 0' }}>
          Descubre trabajos reales en el feed y guarda los que te inspiren.
        </Text>
      </Section>

      <Section style={s.ctaWrap}>
        <Button style={s.button} href={appUrl}>Abrir Glowapp</Button>
      </Section>
      <Text style={{ ...s.muted, textAlign: 'center' as const, margin: '12px 0 24px' }}>
        Nos vemos pronto. Si necesitas algo, responde a este correo.
      </Text>
    </Section>
  </BrandEmail>
)

export const template = {
  component: Email,
  subject: 'Bienvenida a Glowapp ✨',
  displayName: 'Bienvenida cliente',
  previewData: { customerName: 'Laura', tenantName: 'Cristina Muñoz Perruqueria' },
} satisfies TemplateEntry
