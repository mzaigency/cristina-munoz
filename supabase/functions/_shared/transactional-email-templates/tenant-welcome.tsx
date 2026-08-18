/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Heading, Link, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandEmail, styles, PRIMARY, SURFACE, INK, BODY_TEXT, MUTED } from '../email-brand.tsx'

interface Props {
  ownerName?: string
  tenantName?: string
  tenantSlug?: string
  tenantLogoUrl?: string | null
  adminUrl?: string
  publicUrl?: string
}

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
    <BrandEmail
      preview="Bienvenid@ a Glowapp — tu salón ya está activo"
      logoUrl={tenantLogoUrl || undefined}
      logoAlt={tenantName}
    >
      <Section style={body}>
        <Section style={{ textAlign: 'center' as const }}>
          <Text style={styles.badge}>Bienvenida a Glowapp</Text>
          <Heading style={h1}>Bienvenid@, {ownerName}.</Heading>
          <Text style={lead}>
            <strong style={brand}>{tenantName}</strong> ya está activo en Glowapp. Desde hoy tu agenda no duerme, tu
            clienta es tuya y todo lo llevas desde el móvil.
          </Text>
          <Section style={styles.ctaWrap}>
            <Button style={styles.button} href={adminUrl}>Entrar al panel</Button>
          </Section>
          <Text style={styles.muted}>
            Tu web: <Link href={salonUrl} style={styles.link}>{salonUrl.replace('https://', '')}</Link>
          </Text>
        </Section>

        <Section style={styles.divider} />

        <Heading as="h2" style={h2}>Un mensaje para ti</Heading>
        <Text style={p}>
          Sabemos por qué estás aquí. Porque ayer, otra vez, contestaste un WhatsApp a las 22:30 para confirmar una
          cita. Porque has perdido clientas por no coger el teléfono con las manos llenas de tinte.
        </Text>
        <Text style={p}>
          <strong>Eso se acaba hoy.</strong> Tienes una web con tu nombre, una agenda que trabaja sola de noche y en
          domingo, y un panel para llevarlo todo desde el móvil.
        </Text>
        <Text style={p}>
          Y una cosa clara desde el primer día: <strong>esa clienta es tuya.</strong> No te cobramos por cada cita, no
          te atamos con permanencia.
        </Text>

        <Section style={panel}>
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

        <Section style={quoteBox}>
          <Text style={quoteText}>
            "Cualquier duda, nos escribes. En serio, así de fácil. Una persona te responde por WhatsApp, en español,
            sin esperas eternas."
          </Text>
          <Text style={quoteSig}>— Equipo Glowapp</Text>
        </Section>

        <Section style={styles.ctaWrap}>
          <Button style={styles.button} href={adminUrl}>Empezar ahora</Button>
        </Section>
      </Section>
    </BrandEmail>
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
    tenantLogoUrl: null,
    adminUrl: 'https://glowapp.app/admin',
    publicUrl: 'https://glowapp.app/cristina-munoz',
  },
} satisfies TemplateEntry

const body = { padding: '4px 28px 26px' }
const h1 = { fontSize: '24px', fontWeight: 800 as const, color: INK, letterSpacing: '-0.02em', margin: '0 0 10px', lineHeight: 1.25 }
const h2 = { fontSize: '17px', fontWeight: 800 as const, color: INK, letterSpacing: '-0.01em', margin: '18px 0 10px' }
const lead = { fontSize: '15px', color: BODY_TEXT, lineHeight: 1.6, margin: '0 0 18px' }
const p = { fontSize: '14.5px', color: BODY_TEXT, lineHeight: 1.65, margin: '0 0 12px' }
const li = { fontSize: '14.5px', color: BODY_TEXT, lineHeight: 1.6, margin: '0 0 6px' }
const stepLabel = { fontSize: '11px', fontWeight: 700 as const, color: PRIMARY, letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: '16px 0 8px' }
const brand = { color: PRIMARY, fontWeight: 700 as const }
const panel = { backgroundColor: SURFACE, borderRadius: '16px', padding: '4px 20px 16px', margin: '20px 0' }
const quoteBox = { backgroundColor: SURFACE, borderRadius: '16px', padding: '18px 20px', margin: '20px 0' }
const quoteText = { fontSize: '14.5px', color: INK, fontStyle: 'italic' as const, lineHeight: 1.55, margin: '0 0 8px' }
const quoteSig = { fontSize: '12px', color: MUTED, margin: 0 }
