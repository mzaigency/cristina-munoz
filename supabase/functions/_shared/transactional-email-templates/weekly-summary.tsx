/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Column, Heading, Row, Section, Text } from 'npm:@react-email/components@0.0.22'
import { BrandEmail, styles as s } from '../email-brand.tsx'
import type { TemplateEntry } from './registry.ts'

interface TopService {
  name: string
  count: number
}

interface PeakHour {
  hour: string
  count: number
}

interface Props {
  ownerName?: string
  tenantName?: string
  tenantLogoUrl?: string | null
  rangeLabel?: string
  revenue?: number
  revenuePrev?: number
  bookings?: number
  bookingsPrev?: number
  avgTicket?: number
  newClients?: number
  cancelled?: number
  topServices?: TopService[]
  peakHours?: PeakHour[]
  panelUrl?: string
}

const eur = (n: number) =>
  `${(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`

const delta = (now: number, prev: number) => {
  if (!prev) return null
  const pct = Math.round(((now - prev) / prev) * 100)
  if (pct === 0) return 'igual que la semana pasada'
  return `${pct > 0 ? '+' : ''}${pct}% vs. semana pasada`
}

const Email = ({
  ownerName = 'Hola',
  tenantName = 'tu salón',
  tenantLogoUrl,
  rangeLabel = '',
  revenue = 0,
  revenuePrev = 0,
  bookings = 0,
  bookingsPrev = 0,
  avgTicket = 0,
  newClients = 0,
  cancelled = 0,
  topServices = [],
  peakHours = [],
  panelUrl = 'https://www.glowapp.app/admin',
}: Props) => {
  const revDelta = delta(revenue, revenuePrev)
  const bookDelta = delta(bookings, bookingsPrev)
  const maxPeak = peakHours.reduce((m, h) => Math.max(m, h.count), 0) || 1

  return (
    <BrandEmail
      preview={`${tenantName}: ${eur(revenue)} y ${bookings} citas esta semana`}
      logoUrl={tenantLogoUrl || undefined}
      logoAlt={tenantName}
      footerNote={`Resumen semanal de ${tenantName}`}
    >
      <Section style={{ ...s.content, textAlign: 'center' as const }}>
        <Text style={s.badge}>Resumen semanal</Text>
        <Heading style={s.h1}>Así ha ido tu semana, {ownerName}</Heading>
        <Text style={s.lead}>
          {rangeLabel ? <>Del <strong style={s.strong}>{rangeLabel}</strong> en </> : null}
          <strong style={s.strong}>{tenantName}</strong>. Todo lo importante, sin entrar al panel.
        </Text>
      </Section>

      <Section style={s.content}>
        <Section style={{ ...s.panel, textAlign: 'center' as const }}>
          <Text style={s.label}>Facturado</Text>
          <Text style={s.bigValue}>{eur(revenue)}</Text>
          {revDelta ? <Text style={{ ...s.muted, margin: '6px 0 0' }}>{revDelta}</Text> : null}
        </Section>

        <Section style={s.panel}>
          <Row>
            <Column style={{ width: '50%', verticalAlign: 'top' as const }}>
              <Text style={s.label}>Citas atendidas</Text>
              <Text style={s.value}>{bookings}</Text>
              {bookDelta ? <Text style={{ ...s.muted, margin: '2px 0 0' }}>{bookDelta}</Text> : null}
            </Column>
            <Column style={{ width: '50%', verticalAlign: 'top' as const }}>
              <Text style={s.label}>Ticket medio</Text>
              <Text style={s.value}>{eur(avgTicket)}</Text>
            </Column>
          </Row>
          <Section style={s.divider}>&nbsp;</Section>
          <Row>
            <Column style={{ width: '50%', verticalAlign: 'top' as const }}>
              <Text style={s.label}>Clientas nuevas</Text>
              <Text style={s.value}>{newClients}</Text>
            </Column>
            <Column style={{ width: '50%', verticalAlign: 'top' as const }}>
              <Text style={s.label}>Cancelaciones</Text>
              <Text style={s.value}>{cancelled}</Text>
            </Column>
          </Row>
        </Section>

        {topServices.length ? (
          <Section style={s.panel}>
            <Text style={s.label}>Servicios más pedidos</Text>
            {topServices.slice(0, 5).map((srv, i) => (
              <Row key={srv.name} style={{ marginTop: i === 0 ? '8px' : '6px' }}>
                <Column style={{ verticalAlign: 'middle' as const }}>
                  <Text style={{ ...s.value, margin: 0 }}>
                    {i + 1}. {srv.name}
                  </Text>
                </Column>
                <Column style={{ textAlign: 'right' as const, verticalAlign: 'middle' as const, width: '80px' }}>
                  <Text style={{ ...s.muted, margin: 0 }}>
                    {srv.count} {srv.count === 1 ? 'cita' : 'citas'}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>
        ) : null}

        {peakHours.length ? (
          <Section style={s.panel}>
            <Text style={s.label}>Horas punta</Text>
            {peakHours.slice(0, 4).map((h, i) => (
              <Row key={h.hour} style={{ marginTop: i === 0 ? '8px' : '6px' }}>
                <Column style={{ width: '58px', verticalAlign: 'middle' as const }}>
                  <Text style={{ ...s.value, margin: 0 }}>{h.hour}</Text>
                </Column>
                <Column style={{ verticalAlign: 'middle' as const }}>
                  <Section
                    style={{
                      height: '10px',
                      lineHeight: '10px',
                      fontSize: '0px',
                      borderRadius: '999px',
                      background: 'linear-gradient(100deg,#22408C,#98329A)',
                      width: `${Math.max(12, Math.round((h.count / maxPeak) * 100))}%`,
                    }}
                  >
                    &nbsp;
                  </Section>
                </Column>
                <Column style={{ textAlign: 'right' as const, verticalAlign: 'middle' as const, width: '64px' }}>
                  <Text style={{ ...s.muted, margin: 0 }}>{h.count}</Text>
                </Column>
              </Row>
            ))}
            <Text style={{ ...s.muted, margin: '10px 0 0' }}>
              Ahí es donde más te buscan: reserva esas horas para tus servicios mejor pagados.
            </Text>
          </Section>
        ) : null}

        <Section style={s.ctaWrap}>
          <Button style={s.button} href={panelUrl}>Ver el detalle en mi panel</Button>
        </Section>
        <Text style={{ ...s.muted, textAlign: 'center' as const, margin: '12px 0 24px' }}>
          Te lo enviamos cada lunes con los datos de la semana anterior.
        </Text>
      </Section>
    </BrandEmail>
  )
}

export const template = {
  component: Email,
  subject: (d: Props) =>
    `Tu semana en ${d?.tenantName || 'tu salón'}: ${eur(d?.revenue || 0)} y ${d?.bookings || 0} citas`,
  displayName: 'Resumen semanal del salón',
  previewData: {
    ownerName: 'Cristina',
    tenantName: 'Cristina Muñoz Perruqueria',
    rangeLabel: '1 al 7 de septiembre',
    revenue: 1840,
    revenuePrev: 1620,
    bookings: 42,
    bookingsPrev: 38,
    avgTicket: 44,
    newClients: 6,
    cancelled: 2,
    topServices: [
      { name: 'Corte + Peinado', count: 14 },
      { name: 'Color raíz', count: 9 },
      { name: 'Mechas', count: 7 },
    ],
    peakHours: [
      { hour: '17:00', count: 9 },
      { hour: '18:00', count: 8 },
      { hour: '10:00', count: 6 },
      { hour: '11:00', count: 5 },
    ],
  },
} satisfies TemplateEntry
