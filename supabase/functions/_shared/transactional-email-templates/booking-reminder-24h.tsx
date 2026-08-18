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
  date?: string
  time?: string
  services?: string
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
  date = '',
  time = '',
  services = '',
  manageUrl = 'https://www.glowapp.app/mis-citas',
}: Props) => {
  const fullAddress = [tenantAddress, tenantCity].filter(Boolean).join(', ')
  const mapsHref =
    mapsUrl ||
    (fullAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${tenantName} ${fullAddress}`)}`
      : null)

  return (
    <BrandEmail
      preview={`Mañana tienes cita en ${tenantName} a las ${time}`}
      logoUrl={tenantLogoUrl || undefined}
      logoAlt={tenantName}
      footerNote={`Enviado en nombre de ${tenantName}`}
    >
      <Section style={{ ...s.content, textAlign: 'center' as const }}>
        <Text style={s.badge}>Recordatorio</Text>
        <Heading style={s.h1}>Mañana te esperamos, {customerName}</Heading>
        <Text style={s.lead}>
          Un recordatorio de tu cita en <strong style={s.strong}>{tenantName}</strong>. Si no puedes venir,
          avísanos con tiempo para liberar el hueco.
        </Text>
      </Section>

      <Section style={s.content}>
        <Section style={{ ...s.panel, textAlign: 'center' as const }}>
          <Text style={s.label}>Mañana a las</Text>
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
          {fullAddress ? (
            <>
              {services ? <Section style={s.divider}>&nbsp;</Section> : null}
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
          <Button style={s.button} href={manageUrl}>Gestionar mi cita</Button>
        </Section>
        <Text style={{ ...s.muted, textAlign: 'center' as const, margin: '12px 0 24px' }}>
          ¿No puedes venir? Cancela o reprograma desde tu cuenta.
        </Text>
      </Section>
    </BrandEmail>
  )
}

export const template = {
  component: Email,
  subject: (d: Props) => `Mañana a las ${d?.time || ''} en ${d?.tenantName || 'tu salón'}`.trim(),
  displayName: 'Recordatorio 24h',
  previewData: {
    customerName: 'Laura',
    tenantName: 'Cristina Muñoz Perruqueria',
    tenantLogoUrl:
      'https://lyeyzdbplrgqsvyxpfek.supabase.co/storage/v1/object/public/tenant-assets/a1b2c3d4-e5f6-7890-abcd-ef1234567890/logo-1766948799579.png',
    tenantAddress: 'C/ Major 12',
    tenantCity: 'Barcelona',
    tenantPhone: '+34 600 000 000',
    date: '25/07/2026',
    time: '10:30',
    services: 'Corte + Color',
  },
} satisfies TemplateEntry
