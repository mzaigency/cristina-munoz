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

/**
 * Misma escala que la agenda del panel: 1 minuto = 1 px, compartida por todos
 * los carriles. La rejilla se dibuja como una tabla de franjas de 15 minutos
 * (cada franja = 15 px) y cada cita ocupa tantas filas como duración tenga,
 * así las horas coinciden de carril a carril.
 */
const SLOT_MIN = 15
const SLOT_PX = 15
const RULER_W = '44px'

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
  return { ...a, start, end: Math.max(end, start + SLOT_MIN) }
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

type LaneSeg =
  | { kind: 'appt'; a: TimedAppt; slots: number }
  | { kind: 'gap'; slots: number }

/** Trocea el día de un profesional en citas y huecos, en franjas de 15 min. */
const buildLane = (st: StylistDay, dayStart: number, dayEnd: number): LaneSeg[] => {
  const appts = st.appointments.map(timed).sort((a, b) => a.start - b.start)
  const segs: LaneSeg[] = []
  let cursor = dayStart
  for (const a of appts) {
    const start = Math.max(a.start, dayStart)
    const end = Math.min(a.end, dayEnd)
    if (start > cursor) segs.push({ kind: 'gap', slots: Math.round((start - cursor) / SLOT_MIN) })
    const slots = Math.max(1, Math.round((end - start) / SLOT_MIN))
    segs.push({ kind: 'appt', a, slots })
    cursor = Math.max(cursor, end)
  }
  if (cursor < dayEnd) segs.push({ kind: 'gap', slots: Math.round((dayEnd - cursor) / SLOT_MIN) })
  return segs.filter((sg) => sg.slots > 0)
}

/** Cita dentro de la rejilla: alto = duración, sin desplazar a los demás carriles. */
const ApptCell = ({ a, color, slots }: { a: TimedAppt; color: string; slots: number }) => {
  const h = slots * SLOT_PX - 3
  return (
    <Column
      rowSpan={slots}
      style={{
        height: `${slots * SLOT_PX}px`,
        verticalAlign: 'top' as const,
        padding: '0 5px 2px 0',
      }}
    >
      <Section
        style={{
          height: `${h}px`,
          borderRadius: '8px',
          backgroundColor: softBg(color),
          borderLeft: `3px solid ${color}`,
          padding: '4px 7px',
          overflow: 'hidden',
        }}
      >
        <Text
          style={{
            fontSize: slots >= 2 ? '12px' : '11px',
            fontWeight: 700 as const,
            color: INK,
            margin: 0,
            lineHeight: 1.25,
            whiteSpace: 'nowrap' as const,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {a.time} · {a.customerName}
          {a.isNew ? <span style={{ color: '#98329A' }}> · nueva</span> : null}
        </Text>
        {slots >= 2 ? (
          <Text
            style={{
              fontSize: '11px',
              color: '#5c6070',
              margin: '1px 0 0',
              lineHeight: 1.25,
              whiteSpace: 'nowrap' as const,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {a.services}
            {a.price ? <span style={{ color: PRIMARY, fontWeight: 700 as const }}> · {eur(a.price)}</span> : null}
          </Text>
        ) : null}
        {slots >= 4 && a.phone ? (
          <Text style={{ fontSize: '11px', color: MUTED, margin: '2px 0 0', lineHeight: 1.25 }}>{a.phone}</Text>
        ) : null}
      </Section>
    </Column>
  )
}

/** Rejilla completa: regla de horas + un carril por profesional, escala común. */
const AgendaGrid = ({ stylists }: { stylists: StylistDay[] }) => {
  const all = stylists.flatMap((st) => st.appointments.map(timed))
  const dayStart = all.length ? Math.floor(Math.min(...all.map((a) => a.start)) / 60) * 60 : 9 * 60
  const dayEnd = all.length ? Math.ceil(Math.max(...all.map((a) => a.end)) / 60) * 60 : 18 * 60
  const totalSlots = Math.max(1, Math.round((dayEnd - dayStart) / SLOT_MIN))

  const lanes = stylists.map((st) => ({ st, color: st.color || PRIMARY, segs: buildLane(st, dayStart, dayEnd) }))

  // Puntero por carril: qué segmento empieza en cada franja.
  const laneAt = lanes.map(({ segs }) => {
    const bySlot = new Map<number, LaneSeg>()
    let cur = 0
    for (const seg of segs) {
      bySlot.set(cur, seg)
      cur += seg.slots
    }
    return bySlot
  })

  const laneWidth = `${Math.floor((100 - 8) / lanes.length)}%`
  const gridRows: React.ReactNode[] = []

  for (let slot = 0; slot < totalSlots; slot++) {
    const minutes = dayStart + slot * SLOT_MIN
    const isHour = minutes % 60 === 0
    const cells: React.ReactNode[] = [
      <Column
        key="ruler"
        style={{
          width: RULER_W,
          height: `${SLOT_PX}px`,
          verticalAlign: 'top' as const,
          textAlign: 'right' as const,
          padding: '0 8px 0 0',
        }}
      >
        {isHour ? (
          <Text style={{ fontSize: '11px', fontWeight: 700 as const, color: MUTED, margin: '-6px 0 0', lineHeight: 1 }}>
            {fromMin(minutes)}
          </Text>
        ) : (
          <Text style={{ fontSize: '1px', color: '#ffffff', margin: 0, lineHeight: 1 }}>&nbsp;</Text>
        )}
      </Column>,
    ]
    lanes.forEach(({ color }, li) => {
      const seg = laneAt[li].get(slot)
      if (!seg) return // cubierto por el rowSpan de una cita anterior
      if (seg.kind === 'gap') {
        cells.push(
          <Column
            key={`g-${li}`}
            style={{
              width: laneWidth,
              height: `${SLOT_PX}px`,
              borderTop: isHour ? `1px solid ${LINE}` : '1px solid transparent',
              padding: '0 5px 0 0',
            }}
          >
            <Text style={{ fontSize: '1px', color: '#ffffff', margin: 0, lineHeight: 1 }}>&nbsp;</Text>
          </Column>,
        )
      } else {
        cells.push(<ApptCell key={`a-${li}`} a={seg.a} color={color} slots={seg.slots} />)
      }
    })
    gridRows.push(<Row key={`slot-${slot}`}>{cells}</Row>)
  }

  return (
    <Section
      style={{
        borderRadius: '14px',
        backgroundColor: '#ffffff',
        border: `1px solid ${LINE}`,
        padding: '12px 10px 14px',
      }}
    >
      {/* Cabecera de carriles */}
      <Row>
        <Column style={{ width: RULER_W }}>&nbsp;</Column>
        {lanes.map(({ st, color }) => (
          <Column key={st.name} style={{ width: laneWidth, padding: '0 5px 8px 0', verticalAlign: 'bottom' as const }}>
            <Section
              style={{
                borderRadius: '999px',
                backgroundColor: color,
                padding: '4px 0',
                textAlign: 'center' as const,
              }}
            >
              <Text style={{ fontSize: '12px', fontWeight: 700 as const, color: '#ffffff', margin: 0 }}>
                {st.name}
              </Text>
            </Section>
          </Column>
        ))}
      </Row>
      {gridRows}
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

        <AgendaGrid stylists={stylists} />
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
