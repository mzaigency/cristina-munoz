/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Column, Heading, Row, Section, Text } from 'npm:@react-email/components@0.0.22'
import { BrandEmail, styles as s, PRIMARY, MUTED, LINE, INK } from '../email-brand.tsx'
import type { TemplateEntry } from './registry.ts'

interface Appt {
  time: string
  endTime?: string | null
  customerName: string
  phone?: string | null
  services: string
  price?: number | null
  isNew?: boolean
}

interface StylistDay {
  name: string
  color?: string | null
  appointments: Appt[]
}

interface Props {
  tenantName?: string
  tenantLogoUrl?: string | null
  dateLabel?: string
  totalCount?: number
  expectedRevenue?: number
  firstTime?: string | null
  lastTime?: string | null
  stylists?: StylistDay[]
  panelUrl?: string
}

const eur = (n: number) =>
  `${(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`

const toMin = (t: string): number => {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || '')
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 0
}

const fromMin = (min: number): string =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

const telHref = (phone: string): string => `tel:${phone.replace(/[^+\d]/g, '')}`

/** Mezcla del color del profesional con blanco, para el fondo suave de la cita. */
const softBg = (hex: string): string => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '')
  if (!m) return '#f2f5fb'
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const mix = (c: number) => Math.round(c + (255 - c) * 0.9)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

/**
 * Agenda del día pensada para leerse sin conexión y en el móvil:
 * un bloque por cita que SIEMPRE muestra hora, clienta, servicio y precio,
 * y los ratos libres como líneas compactas entre citas (útiles para encajar
 * llamadas). El teléfono es un enlace tel: para llamar tocando.
 */
const ApptBlock = ({ a, color }: { a: Appt; color: string }) => (
  <table
    role="presentation"
    cellPadding={0}
    cellSpacing={0}
    style={{
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: 0,
      backgroundColor: softBg(color),
      borderRadius: '10px',
      margin: '0 0 6px',
    }}
  >
    <tbody>
      <tr>
        <td style={{ width: '4px', backgroundColor: color, borderRadius: '10px 0 0 10px' }}>&nbsp;</td>
        <td style={{ padding: '10px 12px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: PRIMARY, margin: 0, lineHeight: 1.3 }}>
            {a.time}{a.endTime ? ` – ${a.endTime}` : ''}
            {a.price ? (
              <span style={{ float: 'right', color: INK }}>{eur(a.price)}</span>
            ) : null}
          </p>
          <p style={{ fontSize: '15px', fontWeight: 700, color: INK, margin: '2px 0 0', lineHeight: 1.3 }}>
            {a.customerName}
            {a.isNew ? (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#ffffff',
                  backgroundColor: '#98329A',
                  borderRadius: '999px',
                  padding: '2px 7px',
                  marginLeft: '6px',
                  verticalAlign: '2px',
                }}
              >
                NUEVA
              </span>
            ) : null}
          </p>
          <p style={{ fontSize: '13px', color: '#5c6070', margin: '2px 0 0', lineHeight: 1.35 }}>
            {a.services}
          </p>
          {a.phone ? (
            <p style={{ fontSize: '13px', margin: '4px 0 0', lineHeight: 1.3 }}>
              <a href={telHref(a.phone)} style={{ color: PRIMARY, fontWeight: 700, textDecoration: 'none' }}>
                {a.phone}
              </a>
            </p>
          ) : null}
        </td>
      </tr>
    </tbody>
  </table>
)

/** Línea compacta para el rato libre entre dos citas. */
const GapLine = ({ from, to }: { from: string; to: string }) => (
  <p
    style={{
      fontSize: '11px',
      fontWeight: 700,
      color: MUTED,
      textAlign: 'center',
      margin: '2px 0 8px',
      letterSpacing: '0.04em',
    }}
  >
    ··· {from} – {to} libre ···
  </p>
)

const StylistSection = ({ st }: { st: StylistDay }) => {
  const color = st.color || PRIMARY
  const appts = [...st.appointments].sort((a, b) => toMin(a.time) - toMin(b.time))

  const items: React.ReactNode[] = []
  let cursor: number | null = null
  appts.forEach((a, i) => {
    const start = toMin(a.time)
    if (cursor !== null && start > cursor) items.push(<GapLine key={`g-${i}`} from={fromMin(cursor)} to={a.time} />)
    items.push(<ApptBlock key={`a-${i}`} a={a} color={color} />)
    cursor = a.endTime ? toMin(a.endTime) : start + 60
  })

  return (
    <Section
      style={{
        borderRadius: '14px',
        backgroundColor: '#ffffff',
        border: `1px solid ${LINE}`,
        padding: '12px 12px 8px',
        margin: '0 0 12px',
      }}
    >
      <table role="presentation" cellPadding={0} cellSpacing={0} style={{ width: '100%', margin: '0 0 10px' }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'middle' }}>
              <span
                style={{
                  display: 'inline-block',
                  borderRadius: '999px',
                  backgroundColor: color,
                  padding: '5px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#ffffff',
                }}
              >
                {st.name}
              </span>
            </td>
            <td style={{ verticalAlign: 'middle', textAlign: 'right' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: MUTED }}>
                {appts.length} {appts.length === 1 ? 'cita' : 'citas'}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      {items}
    </Section>
  )
}

const Email = ({
  tenantName = 'tu salón',
  tenantLogoUrl,
  dateLabel = '',
  totalCount = 0,
  expectedRevenue = 0,
  firstTime,
  lastTime,
  stylists = [],
  panelUrl = 'https://www.glowapp.app/admin',
}: Props) => (
  <BrandEmail
    preview={`${totalCount} citas hoy en ${tenantName}${firstTime ? ` · desde las ${firstTime}` : ''}`}
    logoUrl={tenantLogoUrl || undefined}
    logoAlt={tenantName}
    footerNote={`Agenda del día de ${tenantName}`}
    maxWidth="560px"
  >
    <Section style={{ ...s.content, textAlign: 'center' as const }}>
      <Text style={s.badge}>Agenda de hoy</Text>
      <Heading style={s.h1}>
        {totalCount === 0 ? 'Hoy no tienes citas' : `Hoy tienes ${totalCount} ${totalCount === 1 ? 'cita' : 'citas'}`}
      </Heading>
      <Text style={s.lead}>
        {dateLabel ? (
          <>
            <strong style={s.strong}>{dateLabel}</strong> en{' '}
          </>
        ) : null}
        <strong style={s.strong}>{tenantName}</strong>. Toda la agenda de un vistazo, aunque te falle la
        conexión.
      </Text>
    </Section>

    {totalCount > 0 ? (
      <Section style={s.content}>
        <Section style={s.panel}>
          <Row>
            <Column style={{ width: '25%', verticalAlign: 'top' as const }}>
              <Text style={s.label}>Citas</Text>
              <Text style={s.value}>{totalCount}</Text>
            </Column>
            <Column style={{ width: '25%', verticalAlign: 'top' as const }}>
              <Text style={s.label}>Empiezas</Text>
              <Text style={s.value}>{firstTime || '—'}</Text>
            </Column>
            <Column style={{ width: '25%', verticalAlign: 'top' as const }}>
              <Text style={s.label}>Acabas</Text>
              <Text style={s.value}>{lastTime || '—'}</Text>
            </Column>
            <Column style={{ width: '25%', verticalAlign: 'top' as const }}>
              <Text style={s.label}>Previsión</Text>
              <Text style={s.value}>{expectedRevenue > 0 ? eur(expectedRevenue) : '—'}</Text>
            </Column>
          </Row>
        </Section>

        {stylists.map((st) => (
          <StylistSection key={st.name} st={st} />
        ))}
      </Section>
    ) : (
      <Section style={s.content}>
        <Section style={{ ...s.panel, textAlign: 'center' as const }}>
          <Text style={{ ...s.text, margin: 0 }}>
            Día libre de citas. Buen momento para publicar algo o llamar a las clientas que hace tiempo
            que no vienen.
          </Text>
        </Section>
      </Section>
    )}

    <Section style={s.content}>
      <Section style={s.ctaWrap}>
        <Button style={s.button} href={panelUrl}>
          Abrir la agenda
        </Button>
      </Section>
      <Text style={{ ...s.muted, textAlign: 'center' as const, margin: '12px 0 24px' }}>
        Sin conexión, apunta los cobros en papel y luego regístralos en Caja poniendo la fecha del día
        real: los números te cuadran igual.
      </Text>
    </Section>
  </BrandEmail>
)

export const template = {
  component: Email,
  subject: (d: Props) =>
    d?.totalCount
      ? `Hoy: ${d.totalCount} ${d.totalCount === 1 ? 'cita' : 'citas'}${d?.firstTime ? ` desde las ${d.firstTime}` : ''}`
      : 'Hoy no tienes citas',
  displayName: 'Agenda del día',
  previewData: {
    tenantName: 'Cristina Muñoz Perruqueria',
    dateLabel: 'martes 15 de septiembre',
    totalCount: 4,
    expectedRevenue: 210,
    firstTime: '09:30',
    lastTime: '18:00',
    stylists: [
      {
        name: 'Cristina',
        color: '#7C4DFF',
        appointments: [
          { time: '09:30', endTime: '10:30', customerName: 'Laura Gil', phone: '+34 600 111 222', services: 'Corte y peinado', price: 35 },
          { time: '11:00', endTime: '13:00', customerName: 'Marta Ruiz', phone: '+34 600 333 444', services: 'Tinte + Corte', price: 85, isNew: true },
        ],
      },
      {
        name: 'Desiree',
        color: '#35AFC4',
        appointments: [
          { time: '10:00', endTime: '10:30', customerName: 'Sara Vidal', services: 'Recogido', price: 20 },
          { time: '16:00', endTime: '17:00', customerName: 'Ana Pons', phone: '+34 600 555 666', services: 'Manicura', price: 25 },
          { time: '17:00', endTime: '18:00', customerName: 'Nuria Bosch', services: 'Corte', price: 30 },
        ],
      },
    ],
  },
} satisfies TemplateEntry
