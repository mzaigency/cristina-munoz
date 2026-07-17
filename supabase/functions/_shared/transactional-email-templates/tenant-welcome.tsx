/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  ownerName?: string
  tenantName?: string
  tenantSlug?: string
  tenantLogoUrl?: string | null
  adminUrl?: string
  publicUrl?: string
}

const PRIMARY = '#22408B'
const ACCENT = '#98329A'
const GRADIENT = `linear-gradient(100deg, ${PRIMARY}, ${ACCENT})`
const GLOWAPP_LOGO = 'https://cristina-munoz.lovable.app/email-assets/glowapp-logo.png'

const Email = ({
  ownerName = 'Hola',
  tenantName = 'tu salón',
  tenantSlug = '',
  tenantLogoUrl,
  adminUrl = 'https://glowapp.app/admin',
  publicUrl,
}: Props) => {
  const salonUrl = publicUrl || (tenantSlug ? `https://glowapp.app/${tenantSlug}` : 'https://glowapp.app')
  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>Bienvenid@ a Glowapp — tu salón ya está activo</Preview>
      <Body style={main}>
        <Container style={container}>
          {tenantLogoUrl && (
            <Section style={logoWrap}>
              <Img src={tenantLogoUrl} width="72" height="72" alt={tenantName} style={{ display: 'block', margin: '0 auto', borderRadius: '50%', objectFit: 'cover' }} />
            </Section>
          )}

          <Section style={card}>
            <Text style={badge}>Bienvenida a Glowapp</Text>
            <Heading style={h1}>Bienvenid@, {ownerName}.</Heading>
            <Text style={lead}>
              <strong style={brand}>{tenantName}</strong> ya está activo en Glowapp. Desde hoy tu agenda no duerme, tu clienta es tuya y todo lo llevas desde el móvil.
            </Text>

            <Section style={ctaWrap}>
              <Button style={button} href={adminUrl}>Entrar al panel</Button>
            </Section>
            <Text style={muted}>
              Tu web: <Link href={salonUrl} style={inlineLink}>{salonUrl.replace('https://', '')}</Link>
            </Text>
          </Section>

          {/* Mensaje personal */}
          <Section style={block}>
            <Heading as="h2" style={h2}>Un mensaje para ti</Heading>
            <Text style={p}>
              Sabemos por qué estás aquí. Porque ayer, otra vez, contestaste un WhatsApp a las 22:30 para confirmar una cita. Porque has perdido clientas por no coger el teléfono con las manos llenas de tinte. Porque cada mes te preguntas cuánto te está costando seguir haciendo esto a mano.
            </Text>
            <Text style={p}>
              <strong>Eso se acaba hoy.</strong> Tienes una web con tu nombre, una agenda que trabaja sola de noche y en domingo, y un panel para llevarlo todo desde el móvil.
            </Text>
            <Text style={p}>
              Y una cosa clara desde el primer día: <strong>esa clienta es tuya.</strong> No te cobramos por cada cita, no te atamos con permanencia. Si un día te quieres ir, te vas.
            </Text>
          </Section>

          {/* Hoja de ruta */}
          <Section style={block}>
            <Heading as="h2" style={h2}>Tu hoja de ruta</Heading>

            <Text style={stepLabel}>Paso 1 · Hoy (5 minutos)</Text>
            <Text style={li}>• Sube tus mejores fotos de trabajos.</Text>
            <Text style={li}>• Revisa servicios, precios y horarios.</Text>
            <Text style={li}>• Copia tu enlace de reservas y compártelo.</Text>

            <Text style={stepLabel}>Paso 2 · Esta semana</Text>
            <Text style={li}>• Publica algo: un antes/después, una story del salón.</Text>
            <Text style={li}>• Pon tu enlace y QR en Instagram, WhatsApp y mostrador.</Text>
            <Text style={li}>• Activa los recordatorios automáticos.</Text>

            <Text style={stepLabel}>Paso 3 · Este mes</Text>
            <Text style={li}>• Pide reseñas a tus clientas de siempre.</Text>
            <Text style={li}>• Revisa tus estadísticas.</Text>
            <Text style={li}>• Reactiva clientas dormidas con el Kit de WhatsApp.</Text>
          </Section>

          {/* Lo que tienes / lo que no */}
          <Section style={block}>
            <Heading as="h2" style={h2}>Cómo somos contigo</Heading>
            <Text style={p}><strong>Lo que siempre vas a tener</strong></Text>
            <Text style={li}>✓ Un precio claro, en euros, desde el primer día.</Text>
            <Text style={li}>✓ Tu clienta siendo tuya, hoy y dentro de cinco años.</Text>
            <Text style={li}>✓ Una persona real por WhatsApp cuando la necesites.</Text>
            <Text style={li}>✓ Tus datos cuidados, con normativa europea.</Text>

            <Text style={{ ...p, marginTop: '16px' }}><strong>Lo que nunca vas a tener que aguantar</strong></Text>
            <Text style={li}>✕ Que te quiten un trozo de cada cita.</Text>
            <Text style={li}>✕ Comisiones escondidas.</Text>
            <Text style={li}>✕ Que tu clienta acabe siendo "del marketplace".</Text>
            <Text style={li}>✕ Letra pequeña que te ate cuando quieras irte.</Text>
          </Section>

          <Section style={quoteBox}>
            <Text style={quoteText}>
              "Cualquier duda, nos escribes. En serio, así de fácil. Una persona te responde por WhatsApp, en español, sin esperas eternas."
            </Text>
            <Text style={quoteSig}>— Equipo Glowapp</Text>
          </Section>

          <Section style={{ textAlign: 'center' as const, margin: '8px 0 0' }}>
            <Button style={button} href={adminUrl}>Empezar ahora</Button>
          </Section>

          <Hr style={hr} />

          <Section style={glowFooter}>
            <Img src={GLOWAPP_LOGO} width="90" height="auto" alt="Glowapp" style={{ display: 'block', margin: '0 auto 8px' }} />
            <Text style={copyright}>
              Tú mandas. Tú cobras. Tú decides. · <Link href="https://glowapp.app" style={footerLink}>glowapp.app</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Props) => `Bienvenid@ a Glowapp — ${d?.tenantName || 'tu salón'} ya está activo ✨`,
  displayName: 'Bienvenida negocio',
  previewData: {
    ownerName: 'Cristina',
    tenantName: 'Cristina Muñoz Perruqueria',
    tenantSlug: 'cristina-munoz',
    tenantLogoUrl: 'https://lyeyzdbplrgqsvyxpfek.supabase.co/storage/v1/object/public/tenant-assets/a1b2c3d4-e5f6-7890-abcd-ef1234567890/logo-1766948799579.png',
    adminUrl: 'https://glowapp.app/admin',
    publicUrl: 'https://glowapp.app/cristina-munoz',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif", margin: 0, padding: 0 }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 20px' }
const logoWrap = { textAlign: 'center' as const, marginBottom: '20px' }
const card = { backgroundColor: '#ffffff', border: '1px solid #eceef3', borderRadius: '16px', padding: '32px 28px', boxShadow: '0 4px 20px -8px rgba(34,64,139,0.08)' }
const block = { padding: '24px 28px 8px' }
const badge = { display: 'inline-block', background: GRADIENT, color: '#ffffff', fontSize: '11px', fontWeight: 700 as const, letterSpacing: '0.06em', textTransform: 'uppercase' as const, padding: '6px 14px', borderRadius: '999px', margin: '0 0 16px' }
const h1 = { fontSize: '28px', fontWeight: 800 as const, color: '#131520', letterSpacing: '-0.02em', margin: '0 0 12px', lineHeight: 1.2 }
const h2 = { fontSize: '18px', fontWeight: 800 as const, color: '#131520', letterSpacing: '-0.01em', margin: '0 0 12px' }
const lead = { fontSize: '15px', color: '#4a4d5c', lineHeight: 1.6, margin: '0 0 20px' }
const p = { fontSize: '14.5px', color: '#4a4d5c', lineHeight: 1.65, margin: '0 0 12px' }
const li = { fontSize: '14.5px', color: '#4a4d5c', lineHeight: 1.6, margin: '0 0 6px' }
const stepLabel = { fontSize: '12px', fontWeight: 700 as const, color: PRIMARY, letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: '18px 0 8px' }
const brand = { color: PRIMARY, fontWeight: 700 as const }
const ctaWrap = { textAlign: 'center' as const, margin: '8px 0 12px' }
const button = { background: GRADIENT, color: '#ffffff', fontSize: '15px', fontWeight: 700 as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const inlineLink = { color: PRIMARY, textDecoration: 'none', fontWeight: 600 as const }
const muted = { fontSize: '13px', color: '#676B7E', margin: '4px 0 0', textAlign: 'center' as const }
const quoteBox = { backgroundColor: '#f7f8fb', borderRadius: '12px', padding: '18px 22px', margin: '16px 28px' }
const quoteText = { fontSize: '14.5px', color: '#131520', fontStyle: 'italic' as const, lineHeight: 1.55, margin: '0 0 8px' }
const quoteSig = { fontSize: '12px', color: '#9098a8', margin: 0 }
const hr = { border: 'none', borderTop: '1px solid #e7e9f0', margin: '28px 0 18px' }
const glowFooter = { textAlign: 'center' as const, marginTop: '4px' }
const copyright = { fontSize: '12px', color: '#9098a8', textAlign: 'center' as const, margin: 0 }
const footerLink = { color: PRIMARY, textDecoration: 'none', fontWeight: 600 as const }
