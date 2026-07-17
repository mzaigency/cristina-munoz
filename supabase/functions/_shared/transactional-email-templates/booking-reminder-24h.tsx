/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
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

const PRIMARY = '#22408B'
const ACCENT = '#98329A'
const GRADIENT = `linear-gradient(100deg, ${PRIMARY}, ${ACCENT})`
const GLOWAPP_LOGO = 'https://cristina-munoz.lovable.app/email-assets/glowapp-logo.png'

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
  manageUrl = 'https://glowapp.app/mis-citas',
}: Props) => {
  const fullAddress = [tenantAddress, tenantCity].filter(Boolean).join(', ')
  const mapsHref = mapsUrl || (fullAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${tenantName} ${fullAddress}`)}` : null)
  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>Mañana tienes cita en {tenantName} a las {time}</Preview>
      <Body style={main}>
        <Container style={container}>
          {tenantLogoUrl && (
            <Section style={logoWrap}>
              <Img src={tenantLogoUrl} width="72" height="72" alt={tenantName} style={{ display: 'block', margin: '0 auto', borderRadius: '50%', objectFit: 'cover' }} />
            </Section>
          )}
          <Section style={card}>
            <Text style={badge}>Recordatorio</Text>
            <Heading style={h1}>Mañana te esperamos, {customerName}</Heading>
            <Text style={text}>
              Solo un recordatorio de que mañana tienes tu cita en <strong style={brand}>{tenantName}</strong>.
              Si no puedes venir, avísanos con tiempo para liberar el hueco.
            </Text>

            <Section style={detailsBox}>
              <Text style={detailLabel}>Fecha</Text>
              <Text style={detailValue}>{date}</Text>
              <Hr style={hr} />
              <Text style={detailLabel}>Hora</Text>
              <Text style={detailValue}>{time}</Text>
              {services && (
                <>
                  <Hr style={hr} />
                  <Text style={detailLabel}>Servicios</Text>
                  <Text style={detailValue}>{services}</Text>
                </>
              )}
              {fullAddress && (
                <>
                  <Hr style={hr} />
                  <Text style={detailLabel}>Dónde</Text>
                  <Text style={detailValue}>{fullAddress}</Text>
                  {mapsHref && (
                    <Link href={mapsHref} style={mapsLink}>📍 Cómo llegar en Google Maps</Link>
                  )}
                </>
              )}
              {tenantPhone && (
                <>
                  <Hr style={hr} />
                  <Text style={detailLabel}>Teléfono del salón</Text>
                  <Text style={detailValue}>{tenantPhone}</Text>
                </>
              )}
            </Section>

            <Button style={button} href={manageUrl}>Gestionar mi cita</Button>
            <Text style={muted}>¿No puedes venir? Cancela o reprograma desde tu cuenta.</Text>
          </Section>

          <Section style={glowFooter}>
            <Img src={GLOWAPP_LOGO} width="90" height="auto" alt="Glowapp" style={{ display: 'block', margin: '0 auto 8px' }} />
            <Text style={copyright}>
              Enviado por <Link href="https://glowapp.app" style={footerLink}>Glowapp</Link> en nombre de {tenantName}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Props) => `⏰ Mañana a las ${d?.time || ''} en ${d?.tenantName || 'tu salón'}`.trim(),
  displayName: 'Recordatorio 24h',
  previewData: {
    customerName: 'Laura',
    tenantName: 'Cristina Muñoz Perruqueria',
    tenantLogoUrl: 'https://lyeyzdbplrgqsvyxpfek.supabase.co/storage/v1/object/public/tenant-assets/a1b2c3d4-e5f6-7890-abcd-ef1234567890/logo-1766948799579.png',
    tenantAddress: 'C/ Major 12',
    tenantCity: 'Barcelona',
    tenantPhone: '+34 600 000 000',
    date: '25/07/2026',
    time: '10:30',
    services: 'Corte + Color',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif", margin: 0, padding: 0 }
const container = { maxWidth: '540px', margin: '0 auto', padding: '32px 20px' }
const logoWrap = { textAlign: 'center' as const, marginBottom: '20px' }
const card = { backgroundColor: '#ffffff', border: '1px solid #eceef3', borderRadius: '16px', padding: '32px 28px', boxShadow: '0 4px 20px -8px rgba(34,64,139,0.08)' }
const badge = { display: 'inline-block', background: GRADIENT, color: '#ffffff', fontSize: '11px', fontWeight: 700 as const, letterSpacing: '0.06em', textTransform: 'uppercase' as const, padding: '6px 14px', borderRadius: '999px', margin: '0 0 16px' }
const h1 = { fontSize: '26px', fontWeight: 800 as const, color: '#131520', letterSpacing: '-0.02em', margin: '0 0 12px', lineHeight: 1.2 }
const text = { fontSize: '15px', color: '#4a4d5c', lineHeight: 1.6, margin: '0 0 20px' }
const brand = { color: PRIMARY, fontWeight: 700 as const }
const detailsBox = { backgroundColor: '#f7f8fb', borderRadius: '12px', padding: '18px 20px', margin: '0 0 24px' }
const detailLabel = { fontSize: '11px', color: '#9098a8', fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: '0 0 4px' }
const detailValue = { fontSize: '15px', color: '#131520', fontWeight: 600 as const, margin: '0 0 4px' }
const mapsLink = { fontSize: '13px', color: PRIMARY, textDecoration: 'none', fontWeight: 600 as const, display: 'inline-block', marginTop: '6px' }
const hr = { border: 'none', borderTop: '1px solid #e7e9f0', margin: '12px 0' }
const button = { background: GRADIENT, color: '#ffffff', fontSize: '15px', fontWeight: 700 as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const muted = { fontSize: '13px', color: '#676B7E', margin: '16px 0 0' }
const glowFooter = { textAlign: 'center' as const, marginTop: '24px' }
const copyright = { fontSize: '12px', color: '#9098a8', textAlign: 'center' as const, margin: 0 }
const footerLink = { color: PRIMARY, textDecoration: 'none', fontWeight: 600 as const }
