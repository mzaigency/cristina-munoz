/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Heading, Section, Text } from 'npm:@react-email/components@0.0.22'
import { BrandEmail, styles as s } from '../email-brand.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  customerName?: string
  tenantName?: string
  tenantLogoUrl?: string | null
  tenantPhone?: string | null
  date?: string
  time?: string
  services?: string
  reason?: string | null
  cancelledBy?: 'salon' | 'cliente'
  rebookUrl?: string
}

const Email = ({
  customerName = 'Hola',
  tenantName = 'el salón',
  tenantLogoUrl,
  tenantPhone,
  date = '',
  time = '',
  services = '',
  reason,
  cancelledBy = 'cliente',
  rebookUrl = 'https://glowapp.app',
}: Props) => (
  <BrandEmail
    preview={`Tu cita del ${date} en ${tenantName} ha sido cancelada`}
    logoUrl={tenantLogoUrl || undefined}
    logoAlt={tenantName}
    footerNote={`Enviado en nombre de ${tenantName}`}
  >
    <Section style={{ ...s.content, textAlign: 'center' as const }}>
      <Text style={s.badge}>Cita cancelada</Text>
      <Heading style={s.h1}>Tu cita ha sido cancelada, {customerName}</Heading>
      <Text style={s.lead}>
        {cancelledBy === 'salon'
          ? <>Lo sentimos: <strong style={s.strong}>{tenantName}</strong> ha tenido que cancelar tu cita.</>
          : <>Hemos cancelado tu cita en <strong style={s.strong}>{tenantName}</strong> tal y como pediste.</>}
      </Text>
    </Section>

    <Section style={s.content}>
      <Section style={{ ...s.panel, textAlign: 'center' as const }}>
        <Text style={s.label}>Cita cancelada</Text>
        <Text style={s.bigValue}>{time}</Text>
        <Text style={{ ...s.muted, margin: '6px 0 0' }}>{date}</Text>
      </Section>

      <Section style={s.dashed}>&nbsp;</Section>

      {services || reason || tenantPhone ? (
        <Section style={s.panel}>
          {services ? (
            <>
              <Text style={s.label}>Servicios</Text>
              <Text style={s.value}>{services}</Text>
            </>
          ) : null}
          {reason ? (
            <>
              {services ? <Section style={s.divider}>&nbsp;</Section> : null}
              <Text style={s.label}>Motivo</Text>
              <Text style={s.value}>{reason}</Text>
            </>
          ) : null}
          {tenantPhone ? (
            <>
              {services || reason ? <Section style={s.divider}>&nbsp;</Section> : null}
              <Text style={s.label}>Teléfono del salón</Text>
              <Text style={s.value}>{tenantPhone}</Text>
            </>
          ) : null}
        </Section>
      ) : null}

      <Section style={s.ctaWrap}>
        <Button style={s.button} href={rebookUrl}>Reservar otra hora</Button>
      </Section>
      <Text style={{ ...s.muted, textAlign: 'center' as const, margin: '12px 0 24px' }}>
        Puedes elegir nuevo día y hora en un minuto desde la app.
      </Text>
    </Section>
  </BrandEmail>
)

export const template = {
  component: Email,
  subject: (d: Props) => `Cita cancelada · ${d?.date || ''} en ${d?.tenantName || 'tu salón'}`.trim(),
  displayName: 'Cita cancelada',
  previewData: {
    customerName: 'Laura',
    tenantName: 'Cristina Muñoz Perruqueria',
    tenantPhone: '+34 600 000 000',
    date: '25/07/2026',
    time: '10:30',
    services: 'Corte + Color',
    cancelledBy: 'salon',
    reason: 'Imprevisto en el salón',
  },
} satisfies TemplateEntry
