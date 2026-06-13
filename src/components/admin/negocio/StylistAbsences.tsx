import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, X, CalendarOff, Clock, CalendarIcon } from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

/**
 * Ausencias del profesional (vacaciones, bajas, festivos propios), inline en
 * su ficha. Lee y borra cualquier override; el alta inline crea periodos de
 * cierre (is_closed). Las reservas online ya los respetan: check-availability
 * y create-booking consultan stylist_hours_overrides.
 */

interface Props {
  tenantId: string;
  stylistId: string;
}

interface Override {
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

const REASONS = ["Vacaciones", "Baja", "Libre", "Personal", "Formación"];

const toIso = (d: Date) => format(d, "yyyy-MM-dd");

export function StylistAbsences({ tenantId, stylistId }: Props) {
  const { toast } = useToast();
  const [rows, setRows] = useState<Override[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [label, setLabel] = useState("Vacaciones");
  const [calOpen, setCalOpen] = useState(false);

  const load = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const { data } = await supabase
      .from("stylist_hours_overrides")
      .select("id, date_from, date_to, is_closed, open_time, close_time, label")
      .eq("stylist_id", stylistId)
      .gte("date_to", today)
      .order("date_from");
    setRows((data ?? []) as Override[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stylistId]);

  const openAdd = () => {
    setRange(undefined); // Empieza vacío para que el usuario elija
    setLabel("Vacaciones");
    setAdding(true);
  };

  const add = async () => {
    if (!range?.from) {
      toast({ title: "Elige al menos un día", variant: "destructive" });
      return;
    }
    const from = range.from;
    const to = range.to ?? range.from;
    if (to < from) {
      toast({ title: "La fecha de fin es anterior al inicio", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("stylist_hours_overrides").insert({
      tenant_id: tenantId,
      stylist_id: stylistId,
      date_from: toIso(from),
      date_to: toIso(to),
      is_closed: true,
      label: label.trim() || "Vacaciones",
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Ausencia añadida", description: "Esos días no se ofrecerán reservas." });
    setAdding(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("stylist_hours_overrides").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Ausencia eliminada" });
    load();
  };

  const rangeLabel = (() => {
    if (!range?.from) return "Selecciona un día o rango de fechas";
    const f = range.from;
    const t = range.to ?? range.from;
    if (isSameDay(f, t)) return format(f, "EEE d MMM", { locale: es });
    return `${format(f, "d MMM", { locale: es })} – ${format(t, "d MMM", { locale: es })}`;
  })();

  const dayCount = range?.from
    ? Math.round(((range.to ?? range.from).getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  return (
    <div className="gp-absences">
      <div className="gp-team-sec-h" style={{ marginTop: 4 }}>
        <h4 className="gp-neg-section-h">
          <CalendarOff /> Ausencias
        </h4>
        {!adding && (
          <button className="gp-btn sm" onClick={openAdd} type="button">
            <Plus style={{ width: 12, height: 12 }} /> Añadir
          </button>
        )}
      </div>

      {rows === null ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
          <Loader2 className="gp-spinner-sm" />
        </div>
      ) : rows.length === 0 && !adding ? (
        <p className="gp-neg-help" style={{ margin: 0 }}>
          Sin ausencias próximas. Añade vacaciones o festivos y esos días no entrarán reservas.
        </p>
      ) : (
        <div className="gp-absences-list">
          {rows.map((r) => (
            <div key={r.id} className="gp-absences-row">
              <span className="gp-absences-dates">
                {r.date_from === r.date_to ? fmtDay(r.date_from) : `${fmtDay(r.date_from)} – ${fmtDay(r.date_to)}`}
              </span>
              <span className="gp-absences-label">
                {r.is_closed ? (
                  r.label || "Vacaciones"
                ) : (
                  <>
                    <Clock style={{ width: 11, height: 11 }} /> Horario especial {r.open_time?.slice(0, 5)}–
                    {r.close_time?.slice(0, 5)}
                  </>
                )}
              </span>
              <button
                className="gp-sched-edit-ic"
                onClick={() => remove(r.id)}
                title="Eliminar"
                aria-label="Eliminar ausencia"
                type="button"
              >
                <X />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 14,
            border: "1px solid oklch(0.925 0.007 265)",
            background: "linear-gradient(180deg, rgba(34,64,139,0.04), rgba(153,50,154,0.03))",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Selector de rango simplificado */}
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid oklch(0.92 0.01 265)",
                  background: "#fff",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <CalendarIcon style={{ width: 16, height: 16, color: "#22408b" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1f2340", flex: 1 }}>{rangeLabel}</span>
                {dayCount > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#22408b",
                      background: "rgba(34,64,139,0.1)",
                      padding: "3px 8px",
                      borderRadius: 999,
                    }}
                  >
                    {dayCount} {dayCount === 1 ? "día" : "días"}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
              <Calendar
                mode="range"
                selected={range}
                onSelect={(r) => setRange(r)}
                numberOfMonths={1}
                locale={es}
                weekStartsOn={1}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          {/* Motivo */}
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {REASONS.map((r) => {
                const on = label === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setLabel(r)}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "5px 11px",
                      borderRadius: 999,
                      border: on ? "1px solid #99329a" : "1px solid oklch(0.92 0.01 265)",
                      background: on ? "rgba(153,50,154,0.1)" : "#fff",
                      color: on ? "#99329a" : "#525673",
                      cursor: "pointer",
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              className="gp-absences-form-label"
              placeholder="O escribe otro motivo…"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !saving) add();
              }}
            />
          </div>

          <div className="gp-absences-form-actions">
            <button className="gp-btn sm" onClick={() => setAdding(false)} disabled={saving} type="button">
              Cancelar
            </button>
            <button className="gp-btn primary sm" onClick={add} disabled={saving} type="button">
              {saving && <Loader2 className="gp-spinner-sm" />}
              Guardar ausencia
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StylistAbsences;
