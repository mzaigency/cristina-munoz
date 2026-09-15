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

/** Tarjeta de cita con el mismo lenguaje visual que la agenda del panel. */
const ApptCard = ({ a, color }: { a: Appt; color: string }) => (
  <Section
    style={{
      borderRadius: '12px',
      backgroundColor: '#ffffff',
      border: `1px solid ${LINE}`,
      borderLeft: `4px solid ${color}`,
      padding: '9px 11px',
      margin: '0 0 7px',
    }}
  >
    <Row>
      <Column style={{ verticalAlign: 'top' as const }}>
        <Text style={{ fontSize: '13px', fontWeight: 700 as const, color: INK, margin: 0, lineHeight: 1.35 }}>
          {a.time}
          {a.endTime ? <span style={{ color: MUTED, fontWeight: 600 as const }}> – {a.endTime}</span> : null}
        </Text>
        <Text style={{ fontSize: '14px', fontWeight: 700 as const, color: INK, margin: '3px 0 0', lineHeight: 1.35 }}>
          {a.customerName}
          {a.isNew ? <span style={{ color: '#98329A', fontWeight: 700 as const }}> · nueva</span> : null}
        </Text>
        <Text style={{ fontSize: '13px', color: '#5c6070', margin: '1px 0 0', lineHeight: 1.4 }}>{a.services}</Text>
        {a.phone ? (
          <Text style={{ fontSize: '12px', color: MUTED, margin: '2px 0 0', lineHeight: 1.4 }}>{a.phone}</Text>
        ) : null}
      </Column>
      {a.price ? (
        <Column style={{ width: '58px', verticalAlign: 'top' as const, textAlign: 'right' as const }}>
          <Text style={{ fontSize: '13px', fontWeight: 700 as const, color: PRIMARY, margin: 0 }}>{eur(a.price)}</Text>
        </Column>
      ) : null}
    </Row>
  </Section>
)

/** Columna de profesional: cabecera de color + sus citas en orden. */
const StylistColumn = ({ st, width }: { st: StylistDay; width: string }) => {
  const color = st.color || PRIMARY
  return (
    <Column style={{ width, verticalAlign: 'top' as const, padding: '0 5px' }}>
      <Section
        style={{
          borderRadius: '14px',
          backgroundColor: s.panel.backgroundColor,
          border: `1px solid ${LINE}`,
          padding: '10px 10px 4px',
        }}
      >
        <Section
          style={{
            height: '4px',
            lineHeight: '4px',
            fontSize: '0px',
            background: color,
            borderRadius: '999px',
            margin: '0 0 8px',
          }}
        >
          &nbsp;
        </Section>
        <Text style={{ fontSize: '14px', fontWeight: 800 as const, color: INK, margin: '0 0 2px' }}>{st.name}</Text>
        <Text style={{ ...s.label, margin: '0 0 9px' }}>
          {st.appointments.length} {st.appointments.length === 1 ? 'cita' : 'citas'}
        </Text>
        {st.appointments.map((a, i) => (
          <ApptCard key={`${a.time}-${i}`} a={a} color={color} />
        ))}
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
                <StylistColumn key={st.name} st={st} width={width} />
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
