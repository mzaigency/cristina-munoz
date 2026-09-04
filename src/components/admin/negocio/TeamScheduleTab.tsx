import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Clock,
  Pencil,
  Loader2,
  Store,
  UserCog,
  Moon,
  Users,
} from "lucide-react";
import { readableInk } from "@/lib/chartColors";
import { StylistDrawer } from "./StylistDrawer";

interface TeamScheduleTabProps {
  tenantId: string;
}

interface Stylist {
  id: string;
  name: string;
  color: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

interface DayHour {
  stylist_id: string;
  day_of_week: number;
  is_working: boolean;
  start_time: string | null;
  end_time: string | null;
}

interface SalonHour {
  day_of_week: number;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
}

const DAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "");

export function TeamScheduleTab({ tenantId }: TeamScheduleTabProps) {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [ownHours, setOwnHours] = useState<DayHour[]>([]);
  const [salonHours, setSalonHours] = useState<SalonHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStylistId, setSelectedStylistId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [stylistsRes, ownHoursRes, salonHoursRes] = await Promise.all([
      supabase
        .from("tenant_stylists")
        .select("id, name, color, avatar_url, is_active")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("stylist_business_hours")
        .select("stylist_id, day_of_week, is_working, start_time, end_time"),
      supabase
        .from("tenant_business_hours")
        .select("day_of_week, is_open, open_time, close_time")
        .eq("tenant_id", tenantId),
    ]);

    setStylists((stylistsRes.data ?? []) as Stylist[]);
    setOwnHours((ownHoursRes.data ?? []) as DayHour[]);
    setSalonHours((salonHoursRes.data ?? []) as SalonHour[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Loader2 className="glow-spinner" />
      </div>
    );
  }

  if (stylists.length === 0) {
    return (
      <div className="glow-card pad" style={{ textAlign: "center", padding: 32 }}>
        <Users style={{ width: 32, height: 32, color: "var(--glow-ink-3)", margin: "0 auto 10px" }} />
        <h4 style={{ margin: 0, color: "var(--glow-ink)" }}>No hay profesionales activos</h4>
        <p style={{ fontSize: 13, color: "var(--glow-ink-3)", marginTop: 4 }}>
          Añade profesionales en la sección de Equipo para configurar sus horarios individuales.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Banner explicativo */}
      <div
        style={{
          padding: "12px 16px",
          borderRadius: 12,
          background: "rgba(34, 64, 139, 0.04)",
          border: "1px solid rgba(34, 64, 139, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Clock style={{ width: 18, height: 18, color: "var(--glow-brand)", flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: 13, color: "var(--glow-ink)" }}>
              Cuadrante Semanal del Personal
            </strong>
            <p style={{ margin: 0, fontSize: 12, color: "var(--glow-ink-3)" }}>
              Consulta las horas de atención de cada profesional. Los que siguen el horario del salón se actualizan automáticamente con el local.
            </p>
          </div>
        </div>
      </div>

      {/* Grid / Tarjetas de Estilistas */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {stylists.map((s) => {
          const stylistOwn = ownHours.filter((h) => h.stylist_id === s.id);
          const hasOwnSchedule = stylistOwn.length > 0;

          return (
            <div
              key={s.id}
              className="glow-card"
              style={{
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* Cabecera del Estilista */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="glow-neg-stylist-avatar shrink-0"
                    style={{
                      background: s.color || "var(--glow-brand)",
                      color: readableInk(s.color || "#22408C"),
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                    }}
                  >
                    {s.avatar_url ? (
                      <img src={s.avatar_url} alt="" />
                    ) : (
                      <span>{s.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <strong style={{ fontSize: 14, color: "var(--glow-ink)" }}>{s.name}</strong>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      {hasOwnSchedule ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: "var(--glow-brand)",
                            background: "rgba(34, 64, 139, 0.08)",
                            padding: "2px 7px",
                            borderRadius: 999,
                          }}
                        >
                          <UserCog style={{ width: 11, height: 11 }} /> Horario personalizado
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: "var(--glow-ink-3)",
                            background: "var(--glow-sunk)",
                            padding: "2px 7px",
                            borderRadius: 999,
                          }}
                        >
                          <Store style={{ width: 11, height: 11 }} /> Sigue horario del salón
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="glow-btn glow-btn--sm w-full sm:w-auto justify-center"
                  onClick={() => setSelectedStylistId(s.id)}
                  style={{ gap: 5, fontSize: 12.5 }}
                >
                  <Pencil style={{ width: 12, height: 12 }} />
                  <span>Modificar turnos</span>
                </button>
              </div>

              {/* Cuadrante de los 7 días de la semana (con scroll horizontal suave en móvil) */}
              <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 6,
                    minWidth: "540px",
                  }}
                  className="md:min-w-0"
                >
                {DAYS.map((d) => {
                  let working = false;
                  let start: string | null = null;
                  let end: string | null = null;

                  if (hasOwnSchedule) {
                    const found = stylistOwn.find((h) => h.day_of_week === d.value);
                    if (found && found.is_working) {
                      working = true;
                      start = found.start_time;
                      end = found.end_time;
                    }
                  } else {
                    const found = salonHours.find((h) => h.day_of_week === d.value);
                    if (found && found.is_open) {
                      working = true;
                      start = found.open_time;
                      end = found.close_time;
                    }
                  }

                  return (
                    <div
                      key={d.value}
                      style={{
                        padding: "8px 6px",
                        borderRadius: 8,
                        background: working ? "var(--glow-surface)" : "var(--glow-sunk)",
                        border: working ? "1px solid var(--glow-line)" : "1px dashed var(--glow-line)",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: working ? "var(--glow-ink)" : "var(--glow-ink-3)",
                        }}
                      >
                        {d.label}
                      </span>
                      {working ? (
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            color: "var(--glow-brand)",
                            fontVariantNumeric: "tabular-nums",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {hhmm(start)}–{hhmm(end)}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 10,
                            color: "var(--glow-ink-3)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 2,
                          }}
                        >
                          <Moon style={{ width: 9, height: 9 }} /> Libre
                        </span>
                      )}
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawer para editar el estilista seleccionado si se pulsa 'Modificar turnos' */}
      {selectedStylistId && (
        <StylistDrawer
          tenantId={tenantId}
          stylistId={selectedStylistId}
          initialTab="schedule"
          onClose={() => setSelectedStylistId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

export default TeamScheduleTab;
