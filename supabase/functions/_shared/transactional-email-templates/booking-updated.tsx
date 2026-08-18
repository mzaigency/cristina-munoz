/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Heading, Link, Section, Text } from 'npm:@react-email/components@0.0.22'
import { BrandEmail, styles as s } from '../email-brand.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  customerName?: string
  tenantName?: string
  tenantLogoUrl?: string | null
  tenantAddress?: string | null
  tenantCity?: string | null
  tenantPhone?: string | null
  mapsUrl?: string | null
  previousDate?: string
  previousTime?: string
  date?: string
  time?: string
  services?: string
  stylist?: string | null
  manageUrl?: string
}

const Email = ({
  customerName = 'Hola',
  tenantName = 'el salón',
  tenantLogoUrl,
  tenantAddress,
  tenantCity,
  tenantPhone,
  mapsUrl,
  previousDate,
  previousTime,
  date = '',
  time = '',
  services = '',
  stylist,
  manageUrl = 'https://glowapp.app/mis-citas',
}: Props) => {
  const fullAddress = [tenantAddress, tenantCity].filter(Boolean).join(', ')
  const mapsHref =
    mapsUrl ||
    (fullAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${tenantName} ${fullAddress}`)}`
      : null)
  const hadPrevious = Boolean(previousDate || previousTime)

  return (
    <BrandEmail
      preview={`Tu cita en ${tenantName} ahora es el ${date} a las ${time}`}
      logoUrl={tenantLogoUrl || undefined}
      logoAlt={tenantName}
      footerNote={`Enviado en nombre de ${tenantName}`}
    >
      <Section style={{ ...s.content, textAlign: 'center' as const }}>
        <Text style={s.badge}>Cita modificada</Text>
        <Heading style={s.h1}>Hemos actualizado tu cita, {customerName}</Heading>
        <Text style={s.lead}>
          Tu cita en <strong style={s.strong}>{tenantName}</strong> ha cambiado. Estos son los nuevos datos.
        </Text>
      </Section>

      <Section style={s.content}>
        {hadPrevious ? (
          <Section style={{ ...s.panel, textAlign: 'center' as const }}>
            <Text style={s.label}>Antes</Text>
            <Text style={{ ...s.value, textDecoration: 'line-through', color: '#8A8FA3' }}>
              {[previousDate, previousTime].filter(Boolean).join(' · ')}
            </Text>
          </Section>
        ) : null}

        <Section style={{ ...s.panel, textAlign: 'center' as const }}>
          <Text style={s.label}>Nueva cita</Text>
          <Text style={s.bigValue}>{time}</Text>
          <Text style={{ ...s.muted, margin: '6px 0 0' }}>{date}</Text>
        </Section>

        <Section style={s.dashed}>&nbsp;</Section>

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
          {fullAddress ? (
            <>
              <Section style={s.divider}>&nbsp;</Section>
              <Text style={s.label}>Dónde</Text>
              <Text style={s.value}>{fullAddress}</Text>
              {mapsHref ? (
                <Text style={{ margin: '6px 0 0' }}>
                  <Link href={mapsHref} style={s.link}>Cómo llegar en Google Maps</Link>
                </Text>
              ) : null}
            </>
          ) : null}
          {tenantPhone ? (
            <>
              <Section style={s.divider}>&nbsp;</Section>
              <Text style={s.label}>Teléfono del salón</Text>
              <Text style={s.value}>{tenantPhone}</Text>
            </>
          ) : null}
        </Section>

        <Section style={s.ctaWrap}>
          <Button style={s.button} href={manageUrl}>Ver mi cita</Button>
        </Section>
        <Text style={{ ...s.muted, textAlign: 'center' as const, margin: '12px 0 24px' }}>
          ¿No te va bien el nuevo horario? Puedes reprogramar desde tu cuenta.
        </Text>
      </Section>
    </BrandEmail>
  )
}

export const template = {
  component: Email,
  subject: (d: Props) => `Tu cita ha cambiado · ${d?.date || ''} a las ${d?.time || ''}`.trim(),
  displayName: 'Cita modificada',
  previewData: {
    customerName: 'Laura',
    tenantName: 'Cristina Muñoz Perruqueria',
    tenantAddress: 'C/ Major 12',
    tenantCity: 'Barcelona',
    tenantPhone: '+34 600 000 000',
    previousDate: '25/07/2026',
    previousTime: '10:30',
    date: '26/07/2026',
    time: '12:00',
    services: 'Corte + Color',
    stylist: 'Cristina',
  },
} satisfies TemplateEntry
