import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, X, CalendarOff, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

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

export function StylistAbsences({ tenantId, stylistId }: Props) {
  const { toast } = useToast();
  const [rows, setRows] = useState<Override[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [label, setLabel] = useState("");

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
    const today = format(new Date(), "yyyy-MM-dd");
    setFrom(today);
    setTo(today);
    setLabel("");
    setAdding(true);
  };

  const add = async () => {
    if (!from || !to) {
      toast({ title: "Elige las fechas", variant: "destructive" });
      return;
    }
    if (to < from) {
      toast({ title: "La fecha de fin es anterior al inicio", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("stylist_hours_overrides").insert({
      tenant_id: tenantId,
      stylist_id: stylistId,
      date_from: from,
      date_to: to,
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
                    <Clock style={{ width: 11, height: 11 }} /> Horario especial{" "}
                    {r.open_time?.slice(0, 5)}–{r.close_time?.slice(0, 5)}
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
        <div className="gp-absences-form">
          <div className="gp-absences-form-dates">
            <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} aria-label="Desde" />
            <span>–</span>
            <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} aria-label="Hasta" />
          </div>
          <input
            type="text"
            className="gp-absences-form-label"
            placeholder="Motivo (Vacaciones, baja…)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !saving) add();
            }}
          />
          <div className="gp-absences-form-actions">
            <button className="gp-btn sm" onClick={() => setAdding(false)} disabled={saving} type="button">
              Cancelar
            </button>
            <button className="gp-btn primary sm" onClick={add} disabled={saving} type="button">
              {saving && <Loader2 className="gp-spinner-sm" />}
              Añadir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StylistAbsences;
