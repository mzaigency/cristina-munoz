/// <reference types="npm:@types/react@18.3.1" />
/**
 * Estética unificada de los correos de Glowapp (misma que el ticket de caja):
 * fondo gris muy claro, tarjeta blanca redondeada con barra de gradiente de marca,
 * bloques resaltados, CTA en píldora con gradiente y footer "Enviado con Glowapp".
 */
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

export const PRIMARY = '#22408B'
export const ACCENT = '#98329A'
export const GRADIENT = `linear-gradient(100deg, ${PRIMARY}, ${ACCENT})`
export const INK = '#131520'
export const BODY_TEXT = '#4a4d5c'
export const MUTED = '#8A8FA3'
export const LINE = '#ECEDF3'
export const SURFACE = '#F6F7FB'

export const GLOWAPP_LOGO = 'https://www.glowapp.app/email-assets/glowapp-logo.png'
export const GLOWAPP_ICON = 'https://www.glowapp.app/email-assets/glowapp-icon.png'

export const styles = {
  main: {
    backgroundColor: '#ffffff',
    margin: 0,
    padding: 0,
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  outer: { backgroundColor: SURFACE, padding: '28px 12px' },
  card: {
    maxWidth: '520px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    border: `1px solid ${LINE}`,
    borderRadius: '22px',
    overflow: 'hidden' as const,
  },
  bar: { height: '5px', lineHeight: '5px', fontSize: '0px', background: GRADIENT },
  header: { padding: '26px 28px 4px', textAlign: 'center' as const },
  logo: {
    display: 'block',
    margin: '0 auto 12px',
    borderRadius: '16px',
    objectFit: 'cover' as const,
    border: `1px solid ${LINE}`,
  },
  wordmark: { display: 'block', margin: '0 auto 14px' },
  badge: {
    display: 'inline-block',
    padding: '5px 14px',
    borderRadius: '999px',
    backgroundColor: '#EEF1FA',
    color: PRIMARY,
    fontSize: '11px',
    fontWeight: 700 as const,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    margin: '0 0 14px',
  },
  h1: {
    fontSize: '24px',
    lineHeight: 1.25,
    fontWeight: 800 as const,
    color: INK,
    letterSpacing: '-0.02em',
    margin: '0 0 10px',
  },
  h2: { fontSize: '17px', fontWeight: 700 as const, color: INK, margin: '0 0 10px', lineHeight: 1.3 },
  content: { padding: '0 28px' },
  text: { fontSize: '15px', lineHeight: 1.65, color: BODY_TEXT, margin: '0 0 16px' },
  lead: { fontSize: '15px', lineHeight: 1.65, color: BODY_TEXT, margin: '0 0 20px', textAlign: 'center' as const },
  strong: { color: PRIMARY, fontWeight: 700 as const },
  panel: { backgroundColor: SURFACE, borderRadius: '16px', padding: '18px 20px', margin: '0 0 20px' },
  label: {
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: MUTED,
    fontWeight: 600 as const,
    margin: '0',
  },
  value: { fontSize: '15px', color: INK, fontWeight: 600 as const, margin: '4px 0 0' },
  bigValue: { fontSize: '30px', lineHeight: 1.1, fontWeight: 800 as const, color: INK, letterSpacing: '-0.02em', margin: '6px 0 0' },
  divider: { borderTop: `1px solid ${LINE}`, margin: '14px 0', height: '0px', lineHeight: '0px', fontSize: '0px' },
  dashed: { borderTop: `2px dashed #E4E6EF`, margin: '4px 0 16px', height: '0px', lineHeight: '0px', fontSize: '0px' },
  ctaWrap: { textAlign: 'center' as const, margin: '4px 0 8px' },
  button: {
    background: GRADIENT,
    backgroundColor: PRIMARY,
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 700 as const,
    borderRadius: '999px',
    padding: '13px 28px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  muted: { fontSize: '13px', color: MUTED, lineHeight: 1.6, margin: '12px 0 0' },
  link: { color: PRIMARY, textDecoration: 'none', fontWeight: 600 as const },
  footer: {
    padding: '16px 28px 22px',
    backgroundColor: '#FBFBFD',
    borderTop: `1px solid ${LINE}`,
    textAlign: 'center' as const,
  },
  footerText: { fontSize: '11px', color: '#A2A6B6', margin: 0, lineHeight: 1.6 },
}

interface ShellProps {
  preview: string
  /** Logo cuadrado (salón). Si no hay, se usa el wordmark de Glowapp. */
  logoUrl?: string | null
  logoAlt?: string
  /** Texto del footer antes de la firma de Glowapp */
  footerNote?: React.ReactNode
  children: React.ReactNode
}

export const BrandEmail = ({ preview, logoUrl, logoAlt = 'Glowapp', footerNote, children }: ShellProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={styles.main}>
      <Section style={styles.outer}>
        <Container style={styles.card}>
          <Section style={styles.bar}>&nbsp;</Section>
          <Section style={styles.header}>
            {logoUrl ? (
              <Img src={logoUrl} width="56" height="56" alt={logoAlt} style={styles.logo} />
            ) : (
              <Img src={GLOWAPP_LOGO} width="128" alt="Glowapp" style={styles.wordmark} />
            )}
          </Section>
          {children}
          <Section style={styles.footer}>
            {footerNote ? <Text style={styles.footerText}>{footerNote}</Text> : null}
            <Text style={styles.footerText}>
              Enviado con{' '}
              <Link href="https://www.glowapp.app" style={{ color: PRIMARY, fontWeight: 700, textDecoration: 'none' }}>
                Glowapp
              </Link>{' '}
              · reservas y gestión para tu salón
            </Text>
          </Section>
        </Container>
      </Section>
    </Body>
  </Html>
)
