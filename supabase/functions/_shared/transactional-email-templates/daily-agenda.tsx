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

/** Escala de la agenda: 1 minuto = 1 px, como en el panel. */
const PX_PER_MIN = 1
/** Alto mínimo de una cita para que quepa el contenido. */
const MIN_BLOCK_PX = 56

const toMin = (t: string): number => {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || '')
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 0
}

const fromMin = (min: number): string =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

interface TimedAppt extends Appt {
  start: number
  end: number
}

const timed = (a: Appt): TimedAppt => {
  const start = toMin(a.time)
  const end = a.endTime ? toMin(a.endTime) : start + 60
  return { ...a, start, end: Math.max(end, start + 15) }
}

/** Mezcla del color del profesional con blanco, para el fondo suave de la cita. */
const softBg = (hex: string): string => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '')
  if (!m) return '#f2f5fb'
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const mix = (c: number) => Math.round(c + (255 - c) * 0.9)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

/** Bloque de cita con alto proporcional a su duración. */
const ApptBlock = ({ a, color, heightPx }: { a: TimedAppt; color: string; heightPx: number }) => (
  <Section
    style={{
      height: `${heightPx}px`,
      borderRadius: '10px',
      backgroundColor: softBg(color),
      borderLeft: `4px solid ${color}`,
      padding: '6px 9px',
      margin: '0 0 2px',
      overflow: 'hidden',
    }}
  >
    <Text
      style={{
        fontSize: '13px',
        fontWeight: 700 as const,
        color: INK,
        margin: 0,
        lineHeight: 1.3,
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {a.customerName}
      {a.isNew ? <span style={{ color: '#98329A' }}> · nueva</span> : null}
    </Text>
    <Text
      style={{
        fontSize: '12px',
        color: '#5c6070',
        margin: '1px 0 0',
        lineHeight: 1.3,
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {a.services}
      {a.price ? <span style={{ color: PRIMARY, fontWeight: 700 as const }}> · {eur(a.price)}</span> : null}
    </Text>
    {heightPx >= 84 && a.phone ? (
      <Text style={{ fontSize: '11px', color: MUTED, margin: '2px 0 0', lineHeight: 1.3 }}>{a.phone}</Text>
    ) : null}
  </Section>
)

/** Hueco sin citas: espacio en blanco con la misma escala. */
const Gap = ({ minutes }: { minutes: number }) => {
  const h = Math.max(0, Math.round(minutes * PX_PER_MIN))
  if (h < 4) return null
  return <Section style={{ height: `${h}px`, lineHeight: `${h}px`, fontSize: '0px' }}>&nbsp;</Section>
}

/** Columna de profesional: cabecera + línea de tiempo con escala píxel/minuto. */
const StylistColumn = ({
  st,
  width,
  dayStart,
}: {
  st: StylistDay
  width: string
  dayStart: number
}) => {
  const color = st.color || PRIMARY
  const appts = st.appointments.map(timed).sort((a, b) => a.start - b.start)

  const blocks: React.ReactNode[] = []
  let cursor = dayStart
  appts.forEach((a, i) => {
    if (a.start > cursor) blocks.push(<Gap key={`gap-${i}`} minutes={a.start - cursor} />)
    const heightPx = Math.max(MIN_BLOCK_PX, Math.round((a.end - a.start) * PX_PER_MIN))
    blocks.push(
      <Row key={`t-${i}`}>
        <Column style={{ width: '44px', verticalAlign: 'top' as const }}>
          <Text style={{ fontSize: '11px', fontWeight: 700 as const, color: MUTED, margin: 0, lineHeight: 1.3 }}>
            {a.time}
          </Text>
        </Column>
        <Column style={{ verticalAlign: 'top' as const }}>
          <ApptBlock a={a} color={color} heightPx={heightPx} />
        </Column>
      </Row>,
    )
    cursor = Math.max(cursor, a.end)
  })

  return (
    <Column style={{ width, verticalAlign: 'top' as const, padding: '0 5px' }}>
      <Section
        style={{
          borderRadius: '14px',
          backgroundColor: s.panel.backgroundColor,
          border: `1px solid ${LINE}`,
          padding: '10px 10px 12px',
        }}
      >
        <Row>
          <Column style={{ verticalAlign: 'middle' as const }}>
            <Section
              style={{
                display: 'inline-block',
                borderRadius: '999px',
                backgroundColor: color,
                padding: '4px 10px',
              }}
            >
              <Text style={{ fontSize: '12px', fontWeight: 700 as const, color: '#ffffff', margin: 0 }}>
                {st.name}
              </Text>
            </Section>
          </Column>
          <Column style={{ verticalAlign: 'middle' as const, textAlign: 'right' as const }}>
            <Text style={{ ...s.label, margin: 0 }}>
              {st.appointments.length} {st.appointments.length === 1 ? 'cita' : 'citas'}
            </Text>
          </Column>
        </Row>
        <Section style={{ height: '10px', lineHeight: '10px', fontSize: '0px' }}>&nbsp;</Section>
        {appts.length === 0 ? (
          <Text style={{ ...s.muted, textAlign: 'center' as const, margin: '12px 0' }}>Sin citas hoy</Text>
        ) : (
          <>
            {blocks}
            <Row>
              <Column style={{ width: '44px', verticalAlign: 'top' as const }}>
                <Text style={{ fontSize: '11px', fontWeight: 700 as const, color: MUTED, margin: 0, lineHeight: 1.3 }}>
                  {fromMin(cursor)}
                </Text>
              </Column>
              <Column>&nbsp;</Column>
            </Row>
          </>
        )}
      </Section>
    </Column>
  )
}

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
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
}: Props) => {
  const perRow = stylists.length >= 3 ? 3 : 2
  const width = `${Math.round(100 / perRow)}%`
  const rows = chunk(stylists, perRow)

  // Todas las columnas comparten el mismo arranque de día para que se alineen.
  const allStarts = stylists.flatMap((st) => st.appointments.map((a) => toMin(a.time)))
  const dayStart = allStarts.length ? Math.floor(Math.min(...allStarts) / 60) * 60 : 9 * 60

  return (
    <BrandEmail
      preview={`${totalCount} citas hoy en ${tenantName}${firstTime ? ` · desde las ${firstTime}` : ''}`}
      logoUrl={tenantLogoUrl || undefined}
      logoAlt={tenantName}
      footerNote={`Agenda del día de ${tenantName}`}
      maxWidth="760px"
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

          {rows.map((group, ri) => (
            <Row key={`row-${ri}`} style={{ margin: '0 0 14px' }}>
              {group.map((st) => (
                <StylistColumn key={st.name} st={st} width={width} dayStart={dayStart} />
              ))}
              {group.length < perRow
                ? Array.from({ length: perRow - group.length }).map((_, i) => (
                    <Column key={`fill-${i}`} style={{ width, verticalAlign: 'top' as const }}>
                      &nbsp;
                    </Column>
                  ))
                : null}
            </Row>
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
}

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
          { time: '16:00', endTime: '17:00', customerName: 'Ana Pons', phone: '+34 600 555 666', services: 'Manicura', price: 25 },
          { time: '17:00', endTime: '18:00', customerName: 'Nuria Bosch', services: 'Corte', price: 30 },
        ],
      },
    ],
  },
} satisfies TemplateEntry
