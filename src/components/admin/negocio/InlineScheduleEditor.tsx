import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Coffee, X, CopyCheck, Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

/**
 * Editor inline del horario propio del profesional. Vive dentro de la ficha
 * (sin modal): cada día es una fila editable, y al haber cambios aparece una
 * barra de guardar pegada abajo. Si aún no existe horario propio llega
 * sembrado con el del salón y se crea al guardar.
 */

interface Props {
  tenantId: string;
  stylistId: string;
  /** Llamado tras guardar con éxito (el padre recarga resumen y lista). */
  onSaved: () => void;
  /** Llamado al descartar sin guardar (el padre vuelve a la vista anterior). */
  onDiscard: () => void;
}

interface DayRow {
  day_of_week: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
}

const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

const hhmm = (t: string | null | undefined, fallback: string) => (t ? t.substring(0, 5) : fallback);

export function InlineScheduleEditor({ tenantId, stylistId, onSaved, onDiscard }: Props) {
  const { toast } = useToast();
  const [rows, setRows] = useState<DayRow[] | null>(null);
  const [initialJson, setInitialJson] = useState("");
  const [undoStack, setUndoStack] = useState<DayRow[][]>([]);
  const [hadOwn, setHadOwn] = useState(false);
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(() => (rows ? JSON.stringify(rows) !== initialJson : false), [rows, initialJson]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: own } = await supabase
        .from("stylist_business_hours")
        .select("*")
        .eq("stylist_id", stylistId);

      let mapped: DayRow[];
      if (own && own.length > 0) {
        setHadOwn(true);
        mapped = DAYS.map((d) => {
          const e = own.find((h) => h.day_of_week === d.value);
          return {
            day_of_week: d.value,
            is_working: e?.is_working ?? true,
            start_time: hhmm(e?.start_time, "09:00"),
            end_time: hhmm(e?.end_time, "19:00"),
            break_start: e?.break_start ? e.break_start.substring(0, 5) : null,
            break_end: e?.break_end ? e.break_end.substring(0, 5) : null,
          };
        });
      } else {
        // Sembrar con el horario del salón como punto de partida
        setHadOwn(false);
        const { data: salon } = await supabase
          .from("tenant_business_hours")
          .select("*")
          .eq("tenant_id", tenantId);
        mapped = DAYS.map((d) => {
          const e = salon?.find((h) => h.day_of_week === d.value);
          return {
            day_of_week: d.value,
            is_working: e?.is_open ?? (d.value >= 1 && d.value <= 5),
            start_time: hhmm(e?.open_time, "09:00"),
            end_time: hhmm(e?.close_time, "19:00"),
            break_start: e?.break_start ? e.break_start.substring(0, 5) : null,
            break_end: e?.break_end ? e.break_end.substring(0, 5) : null,
          };
        });
      }
      if (cancelled) return;
      setRows(mapped);
      // Sin horario propio aún: guardar activo desde el principio (entrar a
      // editar ya expresa la intención de crearlo).
      setInitialJson(own && own.length > 0 ? JSON.stringify(mapped) : "");
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [tenantId, stylistId]);

  const undo = () => {
    if (undoStack.length > 0) {
      const prev = undoStack[undoStack.length - 1];
      setUndoStack((s) => s.slice(0, -1));
      setRows(prev);
      toast({ title: "Deshecho (Ctrl+Z)", description: "Horario anterior restaurado." });
    } else if (initialJson) {
      try {
        setRows(JSON.parse(initialJson));
        toast({ title: "Horario restablecido", description: "Se ha vuelto al horario original." });
      } catch {}
    }
  };

  const update = (day: number, patch: Partial<DayRow>) => {
    if (rows) setUndoStack((s) => [...s, rows]);
    setRows((prev) => (prev ? prev.map((r) => (r.day_of_week === day ? { ...r, ...patch } : r)) : prev));
  };

  const applyToAll = (day: number) => {
    setRows((prev) => {
      if (!prev) return prev;
      const src = prev.find((r) => r.day_of_week === day);
      if (!src) return prev;
      setUndoStack((s) => [...s, prev]);
      return prev.map((r) =>
        r.is_working
          ? {
              ...r,
              start_time: src.start_time,
              end_time: src.end_time,
              break_start: src.break_start,
              break_end: src.break_end,
            }
          : r,
      );
    });
    toast({
      title: "Horas copiadas al resto de días",
      description: "Pulsa Ctrl+Z o Deshacer para revertir en cualquier momento.",
    });
  };

  // Keyboard shortcut Ctrl+Z / Cmd+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undoStack, rows, initialJson]);

  const save = async () => {
    if (!rows) return;
    setSaving(true);
    const { error } = await supabase.from("stylist_business_hours").upsert(
      rows.map((r) => ({
        stylist_id: stylistId,
        tenant_id: tenantId,
        day_of_week: r.day_of_week,
        is_working: r.is_working,
        start_time: r.start_time,
        end_time: r.end_time,
        break_start: r.break_start || null,
        break_end: r.break_end || null,
      })),
      { onConflict: "stylist_id,day_of_week" },
    );
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Horario guardado" });
    onSaved();
  };

  if (rows === null) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
        <Loader2 className="glow-spinner-sm" />
      </div>
    );
  }

  return (
    <div className="glow-sched-edit">
      <div className="glow-neg-sched">
        {DAYS.map((d) => {
          const r = rows.find((x) => x.day_of_week === d.value)!;
          const hasBreak = r.break_start != null || r.break_end != null;
          return (
            <div key={d.value} className={`glow-sched-edit-row${r.is_working ? "" : " off"}`}>
              <div className="glow-sched-edit-head">
                <span className="glow-neg-sched-day" style={{ width: "auto" }}>
                  {d.label}
                </span>
                <div className="glow-sched-edit-head-actions">
                  {!r.is_working && <span className="glow-neg-sched-rest">Descansa</span>}
                  <Switch
                    checked={r.is_working}
                    onCheckedChange={(v) => update(d.value, { is_working: v })}
                    aria-label={`Trabaja el ${d.label}`}
                  />
                </div>
              </div>

              {r.is_working && (
                <>
                  <div className="glow-sched-edit-times">
                    <input
                      type="time"
                      value={r.start_time}
                      onChange={(e) => update(d.value, { start_time: e.target.value })}
                      aria-label="Hora de entrada"
                    />
                    <span>–</span>
                    <input
                      type="time"
                      value={r.end_time}
                      onChange={(e) => update(d.value, { end_time: e.target.value })}
                      aria-label="Hora de salida"
                    />
                    <div className="glow-sched-edit-row-actions">
                      {!hasBreak && (
                        <button
                          className="glow-sched-edit-ic"
                          onClick={() => update(d.value, { break_start: "14:00", break_end: "15:00" })}
                          title="Añadir descanso"
                          aria-label="Añadir descanso"
                          type="button"
                        >
                          <Coffee />
                        </button>
                      )}
                      <button
                        className="glow-sched-edit-ic"
                        onClick={() => applyToAll(d.value)}
                        title="Copiar estas horas a todos los días"
                        aria-label="Copiar estas horas a todos los días"
                        type="button"
                      >
                        <CopyCheck />
                      </button>
                    </div>
                  </div>

                  {hasBreak && (
                    <div className="glow-sched-edit-times break">
                      <Coffee className="glow-sched-edit-break-ic" />
                      <input
                        type="time"
                        value={r.break_start ?? ""}
                        onChange={(e) => update(d.value, { break_start: e.target.value || null })}
                        aria-label="Inicio del descanso"
                      />
                      <span>–</span>
                      <input
                        type="time"
                        value={r.break_end ?? ""}
                        onChange={(e) => update(d.value, { break_end: e.target.value || null })}
                        aria-label="Fin del descanso"
                      />
                      <div className="glow-sched-edit-row-actions">
                        <button
                          className="glow-sched-edit-ic"
                          onClick={() => update(d.value, { break_start: null, break_end: null })}
                          title="Quitar descanso"
                          aria-label="Quitar descanso"
                          type="button"
                        >
                          <X />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Barra de acciones: visible si hay cambios o si aún no existe horario propio */}
      {(dirty || !hadOwn) && (
        <div className="glow-sched-edit-bar">
          <button
            className="glow-btn glow-btn--sm"
            onClick={undo}
            disabled={undoStack.length === 0 && !dirty}
            type="button"
            title="Deshacer último cambio (Ctrl+Z)"
          >
            <Undo2 style={{ width: 13, height: 13 }} />
            Deshacer
          </button>
          <button className="glow-btn glow-btn--sm" onClick={onDiscard} disabled={saving} type="button">
            {hadOwn ? "Descartar" : "Cancelar"}
          </button>
          <button className="glow-btn glow-btn--primary glow-btn--sm" onClick={save} disabled={saving || !rows} type="button">
            {saving && <Loader2 className="glow-spinner-sm" />}
            {hadOwn ? "Guardar cambios" : "Crear horario propio"}
          </button>
        </div>
      )}
    </div>
  );
}

export default InlineScheduleEditor;
