/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Column, Heading, Row, Section, Text } from 'npm:@react-email/components@0.0.22'
import { BrandEmail, styles as s } from '../email-brand.tsx'
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
        <strong style={s.strong}>{tenantName}</strong>. Todo el día en este correo, para tenerlo a mano
        aunque te falle la conexión.
      </Text>
    </Section>

    {totalCount > 0 ? (
      <Section style={s.content}>
        <Section style={s.panel}>
          <Row>
            <Column style={{ width: '33%', verticalAlign: 'top' as const }}>
              <Text style={s.label}>Citas</Text>
              <Text style={s.value}>{totalCount}</Text>
            </Column>
            <Column style={{ width: '34%', verticalAlign: 'top' as const }}>
              <Text style={s.label}>Empiezas</Text>
              <Text style={s.value}>{firstTime || '—'}</Text>
            </Column>
            <Column style={{ width: '33%', verticalAlign: 'top' as const }}>
              <Text style={s.label}>Acabas</Text>
              <Text style={s.value}>{lastTime || '—'}</Text>
            </Column>
          </Row>
          {expectedRevenue > 0 ? (
            <>
              <Section style={s.divider}>&nbsp;</Section>
              <Text style={s.label}>Previsión de caja</Text>
              <Text style={s.value}>{eur(expectedRevenue)}</Text>
            </>
          ) : null}
        </Section>

        {stylists.map((st) => (
          <Section key={st.name} style={s.panel}>
            <Row>
              <Column style={{ width: '14px', verticalAlign: 'middle' as const }}>
                <Section
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '999px',
                    background: st.color || '#22408B',
                  }}
                >
                  &nbsp;
                </Section>
              </Column>
              <Column style={{ verticalAlign: 'middle' as const }}>
                <Text style={{ ...s.label, margin: 0 }}>
                  {st.name} · {st.appointments.length} {st.appointments.length === 1 ? 'cita' : 'citas'}
                </Text>
              </Column>
            </Row>

            {st.appointments.map((a, i) => (
              <Section key={`${a.time}-${i}`} style={{ margin: i === 0 ? '10px 0 0' : '0' }}>
                {i > 0 ? <Section style={s.divider}>&nbsp;</Section> : null}
                <Row>
                  <Column style={{ width: '62px', verticalAlign: 'top' as const }}>
                    <Text style={{ ...s.value, margin: 0 }}>{a.time}</Text>
                    {a.endTime ? (
                      <Text style={{ ...s.footerText, margin: '2px 0 0' }}>a {a.endTime}</Text>
                    ) : null}
                  </Column>
                  <Column style={{ verticalAlign: 'top' as const }}>
                    <Text style={{ ...s.value, margin: 0 }}>
                      {a.customerName}
                      {a.isNew ? (
                        <span style={{ color: '#98329A', fontWeight: 700 }}> · nueva</span>
                      ) : null}
                    </Text>
                    <Text style={{ ...s.muted, margin: '2px 0 0' }}>{a.services}</Text>
                    {a.phone ? (
                      <Text style={{ ...s.muted, margin: '2px 0 0' }}>{a.phone}</Text>
                    ) : null}
                  </Column>
                  {a.price ? (
                    <Column style={{ width: '64px', verticalAlign: 'top' as const, textAlign: 'right' as const }}>
                      <Text style={{ ...s.value, margin: 0 }}>{eur(a.price)}</Text>
                    </Column>
                  ) : null}
                </Row>
              </Section>
            ))}
          </Section>
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
        color: '#22408B',
        appointments: [
          { time: '09:30', endTime: '10:30', customerName: 'Laura Gil', phone: '+34 600 111 222', services: 'Corte y peinado', price: 35 },
          { time: '11:00', endTime: '13:00', customerName: 'Marta Ruiz', phone: '+34 600 333 444', services: 'Tinte + Corte', price: 85, isNew: true },
        ],
      },
      {
        name: 'Desiree',
        color: '#98329A',
        appointments: [
          { time: '16:00', endTime: '17:00', customerName: 'Ana Pons', phone: '+34 600 555 666', services: 'Manicura', price: 25 },
          { time: '17:00', endTime: '18:00', customerName: 'Nuria Bosch', services: 'Corte', price: 30 },
        ],
      },
    ],
  },
} satisfies TemplateEntry
