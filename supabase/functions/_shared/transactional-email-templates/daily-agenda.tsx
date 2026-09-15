/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Heading, Section, Text } from 'npm:@react-email/components@0.0.22'
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

const softBg = (hex: string): string => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '')
  if (!m) return '#f2f5fb'
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const mix = (c: number) => Math.round(c + (255 - c) * 0.9)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

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

const Legend = ({ stylists }: { stylists: StylistDay[] }) => {
  const items = stylists
    .filter((st) => st.appointments.length > 0)
    .map((st) => ({ ...st, color: st.color || PRIMARY }))

  if (items.length === 0) return null

  return (
    <Section
      style={{
        borderRadius: '14px',
        backgroundColor: '#ffffff',
        border: `1px solid ${LINE}`,
        padding: '12px',
        margin: '0 0 12px',
      }}
    >
      <Text style={{ ...s.label, margin: '0 0 8px' }}>Profesionales</Text>
      <table role="presentation" cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
        <tbody>
          <tr>
            {items.map((st, i) => (
              <td
                key={st.name}
                style={{
                  verticalAlign: 'middle',
                  paddingRight: i < items.length - 1 ? '10px' : '0',
                  paddingBottom: '6px',
                }}
              >
                <table role="presentation" cellPadding={0} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '999px',
                          backgroundColor: st.color,
                          padding: '0',
                        }}
                      >
                        &nbsp;
                      </td>
                      <td style={{ paddingLeft: '6px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: INK }}>{st.name}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </Section>
  )
}

const Timeline = ({ stylists }: { stylists: StylistDay[] }) => {
  const colorOf = (name: string) => {
    const st = stylists.find((s) => s.name === name)
    return st?.color || PRIMARY
  }

  const all = stylists
    .flatMap((st) => st.appointments.map((a) => ({ ...a, stylistName: st.name })))
    .sort((a, b) => toMin(a.time) - toMin(b.time) || a.customerName.localeCompare(b.customerName))

  const items: React.ReactNode[] = []
  let cursor: number | null = null
  all.forEach((a, i) => {
    const start = toMin(a.time)
    if (cursor !== null && start > cursor) {
      items.push(<GapLine key={`g-${i}`} from={fromMin(cursor)} to={a.time} />)
    }
    items.push(<ApptBlock key={`a-${i}`} a={a} color={colorOf(a.stylistName)} />)
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
          <table role="presentation" cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
            <tbody>
              <tr>
                <td style={{ width: '25%', verticalAlign: 'top' }}>
                  <Text style={s.label}>Citas</Text>
                  <Text style={s.value}>{totalCount}</Text>
                </td>
                <td style={{ width: '25%', verticalAlign: 'top' }}>
                  <Text style={s.label}>Empiezas</Text>
                  <Text style={s.value}>{firstTime || '—'}</Text>
                </td>
                <td style={{ width: '25%', verticalAlign: 'top' }}>
                  <Text style={s.label}>Acabas</Text>
                  <Text style={s.value}>{lastTime || '—'}</Text>
                </td>
                <td style={{ width: '25%', verticalAlign: 'top' }}>
                  <Text style={s.label}>Previsión</Text>
                  <Text style={s.value}>{expectedRevenue > 0 ? eur(expectedRevenue) : '—'}</Text>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Legend stylists={stylists} />
        <Timeline stylists={stylists} />
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
    totalCount: 5,
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
          { time: '15:00', endTime: '16:00', customerName: 'Elena Sol', phone: '+34 600 777 888', services: 'Mechas', price: 60 },
        ],
      },
      {
        name: 'Desiree',
        color: '#35AFC4',
        appointments: [
          { time: '10:00', endTime: '10:30', customerName: 'Sara Vidal', services: 'Recogido', price: 20 },
          { time: '16:00', endTime: '17:00', customerName: 'Ana Pons', phone: '+34 600 555 666', services: 'Manicura', price: 25 },
        ],
      },
    ],
  },
} satisfies TemplateEntry
