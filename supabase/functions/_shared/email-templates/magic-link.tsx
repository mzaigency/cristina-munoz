/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface Props {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu enlace para acceder a Glowapp</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoWrap}>
          <Img src={LOGO} width="140" height="auto" alt="Glowapp" style={{ display: 'block', margin: '0 auto' }} />
        </Section>
        <Section style={card}>
          <Text style={badge}>Acceso rápido</Text>
          <Heading style={h1}>Tu enlace de acceso</Heading>
          <Text style={text}>
            Pulsa el botón para entrar en <strong style={brand}>{siteName}</strong>. Este enlace es de un
            solo uso y caduca pronto.
          </Text>
          <Button style={button} href={confirmationUrl}>Entrar en Glowapp</Button>
          <Text style={footer}>
            Si no has pedido este enlace, puedes ignorar este email.
          </Text>
        </Section>
        <Text style={copyright}>
          © {new Date().getFullYear()} Glowapp · <Link href="https://glowapp.app" style={footerLink}>glowapp.app</Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const LOGO = 'https://www.glowapp.app/email-assets/glowapp-logo.png'
const PRIMARY = '#22408B'
const ACCENT = '#98329A'
const GRADIENT = `linear-gradient(100deg, ${PRIMARY}, ${ACCENT})`
const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif", margin: 0, padding: 0 }
const container = { maxWidth: '520px', margin: '0 auto', padding: '32px 20px' }
const logoWrap = { textAlign: 'center' as const, marginBottom: '24px' }
const card = { backgroundColor: '#ffffff', border: '1px solid #eceef3', borderRadius: '16px', padding: '32px 28px', boxShadow: '0 4px 20px -8px rgba(34,64,139,0.08)' }
const badge = { display: 'inline-block', background: GRADIENT, color: '#ffffff', fontSize: '11px', fontWeight: 700 as const, letterSpacing: '0.06em', textTransform: 'uppercase' as const, padding: '6px 14px', borderRadius: '999px', margin: '0 0 16px' }
const h1 = { fontSize: '26px', fontWeight: 800 as const, color: '#131520', letterSpacing: '-0.02em', margin: '0 0 16px', lineHeight: 1.2 }
const text = { fontSize: '15px', color: '#4a4d5c', lineHeight: 1.6, margin: '0 0 24px' }
const brand = { color: PRIMARY, fontWeight: 700 as const }
const button = { background: GRADIENT, color: '#ffffff', fontSize: '15px', fontWeight: 700 as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#9098a8', margin: '24px 0 0', lineHeight: 1.5 }
const copyright = { fontSize: '12px', color: '#9098a8', textAlign: 'center' as const, margin: '24px 0 0' }
const footerLink = { color: PRIMARY, textDecoration: 'none', fontWeight: 600 as const }
