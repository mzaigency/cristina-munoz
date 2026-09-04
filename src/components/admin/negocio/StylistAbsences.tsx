import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  Plus,
  Trash2,
  CalendarOff,
  Calendar as CalendarIcon,
  Palmtree,
  Activity,
  Coffee,
  GraduationCap,
  Sparkles,
  PenLine,
} from "lucide-react";
import { format, parseISO, isSameDay, isWithinInterval, startOfDay, addDays, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

/**
 * Ausencias del profesional (vacaciones, bajas, festivos propios).
 * Rediseñado con estética premium Glow, badges de estado y selector fluido.
 */

export interface StylistAbsencesProps {
  tenantId: string;
  stylistId: string;
  initialAdding?: boolean;
  onChanged?: () => void;
}

export interface StylistOverride {
  id: string;
  date_from: string;
  date_to: string;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
  label: string | null;
}

const fmtDay = (iso: string) => {
  try {
    return format(parseISO(iso), "d MMM", { locale: es });
  } catch {
    return iso;
  }
};

const REASONS = [
  { label: "Vacaciones", icon: Palmtree },
  { label: "Baja médica", icon: Activity },
  { label: "Día libre", icon: Coffee },
  { label: "Asuntos propios", icon: Sparkles },
  { label: "Formación", icon: GraduationCap },
];

const toIso = (d: Date) => format(d, "yyyy-MM-dd");

export function StylistAbsences({
  tenantId,
  stylistId,
  initialAdding = false,
  onChanged,
}: StylistAbsencesProps) {
  const { toast } = useToast();
  const [rows, setRows] = useState<StylistOverride[] | null>(null);
  const [adding, setAdding] = useState(initialAdding);
  const [saving, setSaving] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [label, setLabel] = useState("Vacaciones");
  const [customLabel, setCustomLabel] = useState("");
  const [calOpen, setCalOpen] = useState(false);

  const load = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const { data } = await supabase
      .from("stylist_hours_overrides")
      .select("id, date_from, date_to, is_closed, open_time, close_time, label")
      .eq("stylist_id", stylistId)
      .gte("date_to", today)
      .order("date_from");
    setRows((data ?? []) as StylistOverride[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stylistId]);

  useEffect(() => {
    if (initialAdding) setAdding(true);
  }, [initialAdding]);

  const openAdd = () => {
    setRange(undefined);
    setLabel("Vacaciones");
    setCustomLabel("");
    setAdding(true);
  };

  const add = async () => {
    if (!range?.from) {
      toast({ title: "Selecciona al menos un día", variant: "destructive" });
      return;
    }
    const from = range.from;
    const to = range.to ?? range.from;
    if (to < from) {
      toast({ title: "La fecha de fin es anterior al inicio", variant: "destructive" });
      return;
    }

    const finalLabel = customLabel.trim() || label.trim() || "Vacaciones";

    setSaving(true);
    const { error } = await supabase.from("stylist_hours_overrides").insert({
      tenant_id: tenantId,
      stylist_id: stylistId,
      date_from: toIso(from),
      date_to: toIso(to),
      is_closed: true,
      label: finalLabel,
    });
    setSaving(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Ausencia registrada",
      description: `Se bloquearán las reservas entre el ${fmtDay(toIso(from))} y el ${fmtDay(toIso(to))}.`,
    });
    setAdding(false);
    load();
    if (onChanged) onChanged();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("stylist_hours_overrides").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Ausencia eliminada" });
    load();
    if (onChanged) onChanged();
  };

  const rangeLabel = (() => {
    if (!range?.from) return "Elegir fechas de inicio y fin";
    const f = range.from;
    const t = range.to ?? range.from;
    if (isSameDay(f, t)) return format(f, "EEE d 'de' MMMM", { locale: es });
    return `${format(f, "d MMM", { locale: es })} – ${format(t, "d MMM yyyy", { locale: es })}`;
  })();

  const dayCount = range?.from
    ? Math.round(((range.to ?? range.from).getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  const todayDate = startOfDay(new Date());

  const getAbsenceStatus = (dateFromStr: string, dateToStr: string) => {
    try {
      const from = startOfDay(parseISO(dateFromStr));
      const to = startOfDay(parseISO(dateToStr));
      if (isWithinInterval(todayDate, { start: from, end: to })) {
        return { label: "En curso", isCurrent: true };
      }
      if (todayDate < from) {
        return { label: "Próxima", isCurrent: false };
      }
      return { label: "Pasada", isCurrent: false };
    } catch {
      return { label: "Programada", isCurrent: false };
    }
  };

  return (
    <div className="glow-absences-wrap" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Cabecera de sección */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "rgba(153, 50, 154, 0.1)",
              color: "var(--glow-accent, #99329a)",
            }}
          >
            <CalendarOff style={{ width: 15, height: 15 }} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--glow-ink)" }}>
              Vacaciones y Ausencias
            </h4>
            <span style={{ fontSize: 12, color: "var(--glow-ink-3)" }}>
              Días bloqueados sin reservas online
            </span>
          </div>
        </div>

        {!adding && (
          <button
            type="button"
            className="glow-btn glow-btn--sm glow-btn--primary"
            onClick={openAdd}
            style={{ gap: 5, padding: "5px 12px", fontSize: 12.5 }}
          >
            <Plus style={{ width: 13, height: 13 }} />
            <span>Añadir</span>
          </button>
        )}
      </div>

      {/* Formulario desplegable */}
      {adding && (
        <div
          style={{
            padding: 16,
            borderRadius: 14,
            border: "1px solid var(--glow-line)",
            background: "var(--glow-surface)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--glow-ink)" }}>
              Nueva ausencia o periodo vacacional
            </span>
            {dayCount > 0 && (
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "var(--glow-brand)",
                  background: "rgba(34,64,139,0.08)",
                  padding: "3px 10px",
                  borderRadius: 999,
                }}
              >
                {dayCount} {dayCount === 1 ? "día seleccionado" : "días seleccionados"}
              </span>
            )}
          </div>

          {/* Presets Rápidos de 1 Clic */}
          <div className="flex flex-wrap gap-1.5 mb-1">
            {[
              { label: "Hoy", getRange: () => ({ from: new Date(), to: new Date() }) },
              { label: "Mañana", getRange: () => ({ from: addDays(new Date(), 1), to: addDays(new Date(), 1) }) },
              { label: "Esta semana", getRange: () => ({ from: new Date(), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
              {
                label: "Próxima semana",
                getRange: () => {
                  const nextMon = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7);
                  return { from: nextMon, to: addDays(nextMon, 6) };
                },
              },
              { label: "15 días", getRange: () => ({ from: new Date(), to: addDays(new Date(), 14) }) },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setRange(p.getRange())}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Fechas Desde / Hasta Limpias */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10.5px] font-medium text-muted-foreground mb-1 block">Desde</span>
              <input
                type="date"
                value={range?.from ? format(range.from, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const d = e.target.value ? parseISO(e.target.value) : undefined;
                  setRange((prev) => ({ from: d, to: prev?.to && d && prev.to < d ? d : prev?.to ?? d }));
                }}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-background border border-border focus:border-ring outline-none text-foreground transition-all shadow-2xs"
              />
            </div>
            <div>
              <span className="text-[10.5px] font-medium text-muted-foreground mb-1 block">Hasta</span>
              <input
                type="date"
                value={range?.to ? format(range.to, "yyyy-MM-dd") : (range?.from ? format(range.from, "yyyy-MM-dd") : "")}
                min={range?.from ? format(range.from, "yyyy-MM-dd") : undefined}
                onChange={(e) => {
                  const d = e.target.value ? parseISO(e.target.value) : undefined;
                  setRange((prev) => ({ from: prev?.from, to: d }));
                }}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-background border border-border focus:border-ring outline-none text-foreground transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Selector de Motivo con Chips */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Tipo de ausencia
            </label>
            <div className="flex flex-wrap gap-1.5">
              {REASONS.map((r) => {
                const Icon = r.icon;
                const active = label === r.label && !customLabel;
                return (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => {
                      setLabel(r.label);
                      setCustomLabel("");
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-2xs font-semibold"
                        : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{r.label}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  if (!customLabel) setCustomLabel(" ");
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  customLabel
                    ? "bg-primary text-primary-foreground border-primary shadow-2xs font-semibold"
                    : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <PenLine className="w-3.5 h-3.5" />
                <span>Otro motivo...</span>
              </button>
            </div>

            {customLabel !== "" && (
              <input
                type="text"
                autoFocus
                placeholder="Escribe el motivo (ej: Cita médica, examen...)"
                value={customLabel.trimStart()}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="w-full mt-2 px-3 py-2 text-xs rounded-xl bg-background border border-border focus:border-ring outline-none text-foreground transition-all shadow-2xs"
              />
            )}
          </div>

          {/* Acciones */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
            <button
              type="button"
              className="glow-btn glow-btn--sm"
              onClick={() => setAdding(false)}
              disabled={saving}
              style={{ fontSize: 12.5 }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="glow-btn glow-btn--primary glow-btn--sm"
              onClick={add}
              disabled={saving || !range?.from}
              style={{ fontSize: 12.5, gap: 6 }}
            >
              {saving && <Loader2 className="glow-spinner-sm" />}
              <span>Confirmar ausencia</span>
            </button>
          </div>
        </div>
      )}

      {/* Lista de Ausencias Activas/Futuras */}
      {rows === null ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
          <Loader2 className="glow-spinner-sm" />
        </div>
      ) : rows.length === 0 && !adding ? (
        <div
          style={{
            padding: "16px 14px",
            borderRadius: 12,
            border: "1px dashed var(--glow-line)",
            background: "var(--glow-sunk, #f8fafc)",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--glow-ink-3)" }}>
            Sin ausencias ni vacaciones programadas.
          </p>
          <button
            type="button"
            onClick={openAdd}
            style={{
              marginTop: 6,
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--glow-brand)",
              cursor: "pointer",
            }}
          >
            + Programar vacaciones o días libres
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {rows.map((r) => {
            const status = getAbsenceStatus(r.date_from, r.date_to);
            const isSingle = r.date_from === r.date_to;
            const datesText = isSingle
              ? fmtDay(r.date_from)
              : `${fmtDay(r.date_from)} – ${fmtDay(r.date_to)}`;

            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: status.isCurrent
                    ? "1.5px solid color-mix(in oklab, var(--glow-ok-ink) 40%, transparent)"
                    : "1px solid var(--glow-line)",
                  background: status.isCurrent
                    ? "color-mix(in oklab, var(--glow-ok-ink) 5%, var(--glow-surface))"
                    : "var(--glow-surface)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: status.isCurrent
                        ? "color-mix(in oklab, var(--glow-ok-ink) 12%, transparent)"
                        : "var(--glow-sunk)",
                      color: status.isCurrent ? "var(--glow-ok-ink)" : "var(--glow-ink-2)",
                      flexShrink: 0,
                    }}
                  >
                    {r.label?.toLowerCase().includes("baja") ? (
                      <Activity style={{ width: 15, height: 15 }} />
                    ) : (
                      <Palmtree style={{ width: 15, height: 15 }} />
                    )}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 13, fontWeight: 700, color: "var(--glow-ink)" }}>
                        {r.label || "Vacaciones"}
                      </strong>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          padding: "1px 6px",
                          borderRadius: 999,
                          background: status.isCurrent
                            ? "color-mix(in oklab, var(--glow-ok-ink) 14%, transparent)"
                            : "rgba(34,64,139,0.08)",
                          color: status.isCurrent ? "var(--glow-ok-ink)" : "var(--glow-brand)",
                        }}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--glow-ink-3)",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        marginTop: 2,
                      }}
                    >
                      <span>{datesText}</span>
                      {!r.is_closed && r.open_time && (
                        <span>
                          · Horario especial {r.open_time.slice(0, 5)}–{r.close_time?.slice(0, 5)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  title="Eliminar ausencia"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    border: "none",
                    background: "transparent",
                    color: "var(--glow-ink-3)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    flexShrink: 0,
                  }}
                >
                  <Trash2 style={{ width: 14, height: 14 }} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StylistAbsences;
