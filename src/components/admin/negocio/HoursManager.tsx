import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  Sun,
  Moon,
  Copy,
  Save,
  Calendar,
  Plane,
  PartyPopper,
  CalendarOff,
  Sparkles,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";

interface HoursManagerProps {
  tenantId: string;
}

interface BusinessHour {
  id?: string;
  day_of_week: number;
  is_open: boolean;
  morning_start: string;
  morning_end: string;
  afternoon_start: string;
  afternoon_end: string;
  has_afternoon: boolean;
}

interface Override {
  id: string;
  date_from: string;
  date_to: string;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
  break_start: string | null;
  break_end: string | null;
  label: string | null;
}

interface FormState {
  label: string;
  date_from: string;
  date_to: string;
  is_closed: boolean;
  open_time: string;
  close_time: string;
  has_break: boolean;
  break_start: string;
  break_end: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Lun"}, { value: 2, label:"Mar"}, { value: 3, label:"Mié"}, { value: 4, label:"Jue"}, { value: 5, label:"Vie"}, { value: 6, label:"Sáb"}, { value: 0, label:"Dom" },
];

const DAYS_LONG = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const DEFAULT_HOURS: BusinessHour[] = DAYS_OF_WEEK.map((day) => ({
  day_of_week: day.value,
  is_open: day.value >= 1 && day.value <= 5,
  morning_start: "09:00",
  morning_end: "14:00",
  afternoon_start: "16:00",
  afternoon_end: "20:00",
  has_afternoon: day.value >= 1 && day.value <= 5,
}));

// Spanish national holidays (year-agnostic dates that always happen)
const ES_HOLIDAYS_FIXED = [
  { md: "01-01", label: "Año Nuevo"}, { md:"01-06", label: "Reyes"}, { md:"05-01", label: "Día del Trabajo"}, { md:"08-15", label: "Asunción"}, { md:"10-12", label: "Fiesta Nacional"}, { md:"11-01", label: "Todos los Santos"}, { md:"12-06", label: "Día de la Constitución"}, { md:"12-08", label: "Inmaculada"}, { md:"12-25", label: "Navidad"},
]; function todayISO() { return format(new Date(),"yyyy-MM-dd");
}

function fromDbHour(r: { id: string; day_of_week: number; is_open: boolean | null; open_time: string | null; close_time: string | null; break_start: string | null; break_end: string | null }): BusinessHour {
  const hasBreak = !!(r.break_start && r.break_end);
  return {
    id: r.id,
    day_of_week: r.day_of_week,
    is_open: r.is_open ?? false,
    morning_start: r.open_time?.slice(0, 5) || "09:00",
    morning_end: hasBreak ? r.break_start!.slice(0, 5) : r.close_time?.slice(0, 5) || "14:00",
    afternoon_start: hasBreak ? r.break_end!.slice(0, 5) : "16:00",
    afternoon_end: hasBreak ? r.close_time!.slice(0, 5) : "20:00",
    has_afternoon: hasBreak,
  };
}

function toDbHour(h: BusinessHour, tenantId: string) {
  if (!h.is_open) {
    return {
      tenant_id: tenantId,
      day_of_week: h.day_of_week,
      is_open: false,
      open_time: null,
      close_time: null,
      break_start: null,
      break_end: null,
    };
  }
  if (h.has_afternoon) {
    return {
      tenant_id: tenantId,
      day_of_week: h.day_of_week,
      is_open: true,
      open_time: h.morning_start,
      close_time: h.afternoon_end,
      break_start: h.morning_end,
      break_end: h.afternoon_start,
    };
  }
  return {
    tenant_id: tenantId,
    day_of_week: h.day_of_week,
    is_open: true,
    open_time: h.morning_start,
    close_time: h.morning_end,
    break_start: null,
    break_end: null,
  };
}

const initialForm = (mode: "day"|"week"|"range", base?: Partial<FormState>): FormState => {
  const start = base?.date_from || todayISO();
  let end = start;
  if (mode === "week") end = format(addDays(parseISO(start), 6), "yyyy-MM-dd");
  if (mode === "range") end = format(addDays(parseISO(start), 14), "yyyy-MM-dd");
  return {
    label: base?.label || "",
    date_from: start,
    date_to: base?.date_to || end,
    is_closed: base?.is_closed ?? false,
    open_time: base?.open_time || "09:00",
    close_time: base?.close_time || "19:00",
    has_break: base?.has_break ?? false,
    break_start: base?.break_start || "13:00",
    break_end: base?.break_end || "15:00",
  };
};

const formatHM = (t?: string | null) => (t ? t.slice(0, 5) : "");

export function HoursManager({ tenantId }: HoursManagerProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<"semana"|"especiales">("semana");

  // Weekly hours
  const [hours, setHours] = useState<BusinessHour[]>(DEFAULT_HOURS);
  const [savingWeekly, setSavingWeekly] = useState(false);

  // Overrides
  const [overrides, setOverrides] = useState<Override[]>([]);

  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm("day"));
  const [formMode, setFormMode] = useState<"day"|"week"|"range">("day");
  const [saving, setSaving] = useState(false);

  // Calendar
  const [calMonth, setCalMonth] = useState<Date>(startOfMonth(new Date()));

  const load = async () => {
    setLoading(true);
    const [hRes, oRes] = await Promise.all([
      supabase.from("tenant_business_hours").select("*").eq("tenant_id", tenantId),
      supabase
        .from("tenant_hours_overrides")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("date_from", { ascending: true }),
    ]);
    if (hRes.data && hRes.data.length > 0) {
      const merged = DAYS_OF_WEEK.map((day) => {
        const existing = hRes.data!.find((h) => h.day_of_week === day.value);
        return existing ? fromDbHour(existing) : DEFAULT_HOURS.find((h) => h.day_of_week === day.value)!;
      });
      setHours(merged);
    }
    setOverrides((oRes.data as Override[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [tenantId]);

  // Save weekly
  const saveWeekly = async () => {
    setSavingWeekly(true);
    await supabase.from("tenant_business_hours").delete().eq("tenant_id", tenantId);
    const { error } = await supabase
      .from("tenant_business_hours")
      .insert(hours.map((h) => toDbHour(h, tenantId)));
    setSavingWeekly(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive"}); return; } toast({ title:"Horario guardado"}); load(); }; const updateHour = (dow: number, patch: Partial<BusinessHour>) => { setHours((prev) => prev.map((h) => (h.day_of_week === dow ? { ...h, ...patch } : h))); }; const copyToAll = (sourceDow: number) => { const src = hours.find((h) => h.day_of_week === sourceDow); if (!src) return; setHours((prev) => prev.map((h) => ({ ...h, is_open: src.is_open, morning_start: src.morning_start, morning_end: src.morning_end, afternoon_start: src.afternoon_start, afternoon_end: src.afternoon_end, has_afternoon: src.has_afternoon, })) ); toast({ title:"Copiado a todos los días" });
  };

  // Quick actions for special hours
  const openVacaciones = () => {
    setFormMode("range");
    setEditingId(null);
    setForm(
      initialForm("range", {
        label: "Vacaciones",
        is_closed: true,
      })
    );
    setShowForm(true);
  };

  const openFestivo = () => {
    setFormMode("day");
    setEditingId(null);
    setForm(
      initialForm("day", {
        label: "Festivo",
        is_closed: true,
      })
    );
    setShowForm(true);
  };

  const openHorarioVerano = () => {
    setFormMode("range");
    setEditingId(null);
    const start = format(new Date(new Date().getFullYear(), 6, 1), "yyyy-MM-dd"); // 1 jul
    const end = format(new Date(new Date().getFullYear(), 7, 31), "yyyy-MM-dd"); // 31 ago
    setForm(
      initialForm("range", {
        label: "Horario verano",
        date_from: start,
        date_to: end,
        is_closed: false,
        open_time: "09:00",
        close_time: "15:00",
        has_break: false,
      })
    );
    setShowForm(true);
  };

  const openCustom = () => {
    setFormMode("day");
    setEditingId(null);
    setForm(initialForm("day"));
    setShowForm(true);
  };

  const openEdit = (it: Override) => {
    const isSingle = it.date_from === it.date_to;
    setFormMode(isSingle ? "day":"range");
    setEditingId(it.id);
    setForm({
      label: it.label ?? "",
      date_from: it.date_from,
      date_to: it.date_to,
      is_closed: it.is_closed,
      open_time: it.open_time?.slice(0, 5) || "09:00",
      close_time: it.close_time?.slice(0, 5) || "19:00",
      has_break: !!(it.break_start && it.break_end),
      break_start: it.break_start?.slice(0, 5) || "13:00",
      break_end: it.break_end?.slice(0, 5) || "15:00",
    });
    setShowForm(true);
  };

  // Festivos preset
  const addAllNationalHolidays = async () => {
    const year = new Date().getFullYear();
    const existing = new Set(overrides.map((o) => o.date_from));
    const toInsert = ES_HOLIDAYS_FIXED.map((h) => ({
      tenant_id: tenantId,
      date_from: `${year}-${h.md}`,
      date_to: `${year}-${h.md}`,
      is_closed: true,
      label: h.label,
      open_time: null,
      close_time: null,
      break_start: null,
      break_end: null,
    })).filter((h) => !existing.has(h.date_from));

    if (toInsert.length === 0) {
      toast({ title: "Sin novedades", description: "Todos los festivos nacionales ya están." });
      return;
    }

    const { error } = await supabase.from("tenant_hours_overrides").insert(toInsert);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive"}); return; } toast({ title: `${toInsert.length} festivos añadidos`, description: `Festivos nacionales ${year}`, }); load(); }; const saveForm = async () => { if (form.date_to < form.date_from) { toast({ title:"Rango inválido", variant: "destructive"}); return; } if (!form.is_closed && form.close_time <= form.open_time) { toast({ title:"Horario inválido", description: "Cierre debe ser posterior a apertura", variant: "destructive"}); return; } // Conflict check (skip self when editing) const conflicts = overrides.filter( (o) => o.id !== editingId && o.date_from <= form.date_to && o.date_to >= form.date_from ); if (conflicts.length > 0) { const first = conflicts[0]; toast({ title:"Solape detectado",
        description: `Se solapa con "${first.label || (first.is_closed ? "Cerrado":"Horario")}"del ${format(parseISO(first.date_from),"d MMM", { locale: es })}.`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const payload = {
      tenant_id: tenantId,
      date_from: form.date_from,
      date_to: form.date_to,
      is_closed: form.is_closed,
      label: form.label || null,
      open_time: form.is_closed ? null : form.open_time,
      close_time: form.is_closed ? null : form.close_time,
      break_start: !form.is_closed && form.has_break ? form.break_start : null,
      break_end: !form.is_closed && form.has_break ? form.break_end : null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("tenant_hours_overrides")
        .update(payload)
        .eq("id", editingId);
      setSaving(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive"}); return; } toast({ title:"Actualizado" });
    } else {
      const { error } = await supabase.from("tenant_hours_overrides").insert(payload);
      setSaving(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive"}); return; } toast({ title:"Horario especial añadido" });
    }
    setShowForm(false);
    setEditingId(null);
    load();
  };

  const deleteOverride = async (id: string) => {
    if (!confirm("¿Eliminar este horario especial?")) return;
    const { error } = await supabase.from("tenant_hours_overrides").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive"}); return; } toast({ title:"Eliminado"}); load(); }; // Categorize const today = todayISO(); const active = overrides.filter((o) => o.date_from <= today && o.date_to >= today); const upcoming = overrides.filter((o) => o.date_from > today); const past = overrides.filter((o) => o.date_to < today); // Calendar days const calStart = startOfMonth(calMonth); const calEnd = endOfMonth(calMonth); const calStartWeekday = (calStart.getDay() + 6) % 7; // Monday-start const calDaysCount = differenceInCalendarDays(calEnd, calStart) + 1; const overrideForDate = (d: Date): Override | undefined => { const iso = format(d,"yyyy-MM-dd");
    return overrides.find((o) => o.date_from <= iso && o.date_to >= iso);
  };

  const isOpenWeekday = (dow: number): boolean => {
    const h = hours.find((x) => x.day_of_week === dow);
    return !!h?.is_open;
  };

  // Closest upcoming override for hero
  const nextSpecial = upcoming[0];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Loader2 className="gp-spinner" />
      </div>
    );
  }

  return (
    <div className="gp-fade gp-neg-hours">
      <div className="gp-page-h">
        <div>
          <h2>Horarios</h2>
          <p>
            {active.length > 0
              ? `${active.length} horario${active.length === 1 ? "":"s"} especial${active.length === 1 ? "":"es"} activo${active.length === 1 ? "":"s"} ahora`
              : `${upcoming.length} próximo${upcoming.length === 1 ? "":"s"} cambio${upcoming.length === 1 ? "":"s"}`}
          </p>
        </div>
        {tab === "semana" && (
          <div className="gp-page-actions">
            <button
              className="gp-btn primary sm"
              onClick={saveWeekly}
              disabled={savingWeekly}
              type="button"
            >
              {savingWeekly ? <Loader2 className="gp-spinner-sm" /> : <Save style={{ width: 13, height: 13 }} />}
              Guardar
            </button>
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="gp-neg-hours-tabs">
        <button
          className={`gp-mkt-chip${tab === "semana"?" on":""}`}
          onClick={() => setTab("semana")}
          type="button"> <Calendar style={{ width: 13, height: 13 }} /> Semanal </button> <button className={`gp-mkt-chip${tab ==="especiales"?" on":""}`}
          onClick={() => setTab("especiales")}
          type="button"> <Sparkles style={{ width: 13, height: 13 }} /> Especiales ({overrides.length}) </button> </div> {tab ==="semana" && (
        <div className="gp-neg-week">
          {DAYS_OF_WEEK.map((day, idx) => {
            const h = hours.find((x) => x.day_of_week === day.value)!;
            return (
              <div key={day.value} className={`gp-card pad gp-neg-week-day${!h.is_open ? " is-off":""}`}>
                <div className="gp-neg-week-h">
                  <div className="gp-neg-week-title">
                    <input
                      type="checkbox"
                      checked={h.is_open}
                      onChange={(e) => updateHour(day.value, { is_open: e.target.checked })}
                    />
                    <strong>{DAYS_LONG[day.value]}</strong>
                    {!h.is_open && <span className="gp-badge neutral">Cerrado</span>}
                  </div>
                  {idx === 0 && h.is_open && (
                    <button className="gp-btn sm" onClick={() => copyToAll(day.value)} type="button">
                      <Copy style={{ width: 12, height: 12 }} /> A todos
                    </button>
                  )}
                </div>
                {h.is_open && (
                  <div className="gp-neg-week-shifts">
                    <div className="gp-neg-shift gp-neg-shift-morning">
                      <div className="gp-neg-shift-h">
                        <Sun style={{ width: 13, height: 13 }} /> Mañana
                      </div>
                      <div className="gp-neg-shift-inputs">
                        <input
                          type="time"
                          value={h.morning_start}
                          onChange={(e) => updateHour(day.value, { morning_start: e.target.value })}
                        />
                        <span>→</span>
                        <input
                          type="time"value={h.morning_end} onChange={(e) => updateHour(day.value, { morning_end: e.target.value })} /> </div> </div> <div className={`gp-neg-shift gp-neg-shift-afternoon${!h.has_afternoon ?" is-off":""}`}>
                      <div className="gp-neg-shift-h">
                        <Moon style={{ width: 13, height: 13 }} /> Tarde
                        <input
                          type="checkbox"checked={h.has_afternoon} onChange={(e) => updateHour(day.value, { has_afternoon: e.target.checked })} style={{ marginLeft:"auto" }}
                        />
                      </div>
                      {h.has_afternoon ? (
                        <div className="gp-neg-shift-inputs">
                          <input
                            type="time"
                            value={h.afternoon_start}
                            onChange={(e) => updateHour(day.value, { afternoon_start: e.target.value })}
                          />
                          <span>→</span>
                          <input
                            type="time"
                            value={h.afternoon_end}
                            onChange={(e) => updateHour(day.value, { afternoon_end: e.target.value })}
                          />
                        </div>
                      ) : (
                        <p className="gp-neg-shift-off">Sin turno</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "especiales" && (
        <div className="gp-neg-special">
          {/* Hero — active or next */}
          {(active.length > 0 || nextSpecial) && (
            <div className="gp-neg-special-hero">
              {active.length > 0 && (
                <div className="gp-neg-hero-active">
                  <CheckCircle2 style={{ width: 16, height: 16 }} />
                  <div>
                    <strong>Activo ahora: {active[0].label || (active[0].is_closed ? "Cerrado":"Horario especial")}</strong>
                    <span>
                      Hasta {format(parseISO(active[0].date_to), "d MMM", { locale: es })}
                    </span>
                  </div>
                </div>
              )}
              {!active.length && nextSpecial && (
                <div className="gp-neg-hero-next">
                  <AlertCircle style={{ width: 16, height: 16 }} />
                  <div>
                    <strong>
                      Próximo: {nextSpecial.label || (nextSpecial.is_closed ? "Cerrado":"Horario especial")}
                    </strong>
                    <span>
                      {format(parseISO(nextSpecial.date_from), "d MMM", { locale: es })}
                      {nextSpecial.date_from !== nextSpecial.date_to &&
                        ` → ${format(parseISO(nextSpecial.date_to), "d MMM", { locale: es })}`}
                      {"·"}
                      {differenceInCalendarDays(parseISO(nextSpecial.date_from), new Date())} días
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick action toolbar */}
          <div className="gp-neg-quick-actions">
            <button className="gp-neg-quick-action tone-rose" onClick={openVacaciones} type="button">
              <span className="gp-mkt-quick-ic"style={{ background:"var(--gp-mkt-rose-soft)", color: "var(--gp-mkt-rose)" }}>
                <Plane />
              </span>
              <strong>Vacaciones</strong>
              <span>Rango cerrado</span>
            </button>
            <button className="gp-neg-quick-action tone-warn" onClick={openFestivo} type="button">
              <span className="gp-mkt-quick-ic"style={{ background:"var(--gp-warn-soft)", color: "var(--gp-warn)" }}>
                <PartyPopper />
              </span>
              <strong>Festivo</strong>
              <span>Día cerrado</span>
            </button>
            <button className="gp-neg-quick-action tone-ok" onClick={openHorarioVerano} type="button">
              <span className="gp-mkt-quick-ic"style={{ background:"var(--gp-ok-soft)", color: "var(--gp-ok)" }}>
                <Sun />
              </span>
              <strong>Horario verano</strong>
              <span>Jul-Ago reducido</span>
            </button>
            <button className="gp-neg-quick-action tone-brand" onClick={openCustom} type="button">
              <span className="gp-mkt-quick-ic"style={{ background:"var(--gp-accent-soft)", color: "var(--gp-accent)" }}>
                <Plus />
              </span>
              <strong>Personalizado</strong>
              <span>Configurar manual</span>
            </button>
          </div>

          {/* Festivos preset */}
          <div className="gp-neg-festivos-banner">
            <div>
              <strong>Festivos nacionales {new Date().getFullYear()}</strong>
              <span>Año Nuevo · Reyes · 1 Mayo · 15 Ago · 12 Oct · Todos Santos · 6 Dic · 8 Dic · Navidad</span>
            </div>
            <button className="gp-btn sm primary" onClick={addAllNationalHolidays} type="button">
              <CalendarOff style={{ width: 13, height: 13 }} /> Añadir todos
            </button>
          </div>

          {/* Month calendar visual */}
          <div className="gp-card pad gp-mkt-card">
            <div className="gp-mkt-card-h">
              <div>
                <h3>Calendario del mes</h3>
                <p>{format(calMonth, "MMMM yyyy", { locale: es })}</p>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  className="gp-icon-btn"
                  onClick={() => setCalMonth(addMonths(calMonth, -1))}
                  type="button"
                >
                  <ChevronLeft style={{ width: 14, height: 14 }} />
                </button>
                <button
                  className="gp-icon-btn"
                  onClick={() => setCalMonth(startOfMonth(new Date()))}
                  type="button"
                  title="Hoy"
                >
                  <Calendar style={{ width: 14, height: 14 }} />
                </button>
                <button
                  className="gp-icon-btn"
                  onClick={() => setCalMonth(addMonths(calMonth, 1))}
                  type="button"
                >
                  <ChevronRight style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
            <div className="gp-neg-cal">
              <div className="gp-neg-cal-headers">
                {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="gp-neg-cal-grid">
                {Array.from({ length: calStartWeekday }).map((_, i) => (
                  <div key={`pad-${i}`} className="gp-neg-cal-cell is-pad"/> ))} {Array.from({ length: calDaysCount }).map((_, i) => { const d = addDays(calStart, i); const dow = d.getDay(); const iso = format(d,"yyyy-MM-dd");
                  const isToday = iso === today;
                  const ov = overrideForDate(d);
                  const baseOpen = isOpenWeekday(dow);
                  let state: "open"|"closed"|"special"|"special-closed"= baseOpen ?"open":"closed";
                  if (ov) state = ov.is_closed ? "special-closed":"special";
                  const cellClass = `gp-neg-cal-cell state-${state}${isToday ? " is-today":""}`;
                  return (
                    <button
                      key={iso}
                      className={cellClass}
                      onClick={() => {
                        if (ov) openEdit(ov);
                        else {
                          setFormMode("day");
                          setEditingId(null);
                          setForm(initialForm("day", { date_from: iso, date_to: iso }));
                          setShowForm(true);
                        }
                      }}
                      type="button"title={ov?.label || (state ==="closed"?"Cerrado":"Abierto")}
                    >
                      <span>{i + 1}</span>
                      {ov && <span className="gp-neg-cal-dot" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="gp-neg-cal-legend">
              <span className="state-open">Abierto</span>
              <span className="state-closed">Cerrado</span>
              <span className="state-special">Especial</span>
              <span className="state-special-closed">Cerrado especial</span>
            </div>
          </div>

          {/* Timeline strip */}
          {(active.length + upcoming.length) > 0 && (
            <div className="gp-card pad gp-mkt-card">
              <div className="gp-mkt-card-h">
                <div>
                  <h3>Próximos cambios</h3>
                  <p>{active.length + upcoming.length} horarios programados</p>
                </div>
              </div>
              <div className="gp-neg-overrides">
                {[...active.map((it) => ({ ...it, status: "active"as const })), ...upcoming.map((it) => ({ ...it, status:"upcoming"as const }))].map( (it) => { const days = differenceInCalendarDays(parseISO(it.date_to), parseISO(it.date_from)) + 1; const sameDay = it.date_from === it.date_to; return ( <div key={it.id} className={`gp-neg-override${it.status ==="active"?" is-active":""}${it.is_closed ? " is-closed":""}`}
                      >
                        <div className="gp-neg-override-h">
                          <div className="gp-neg-override-icon">
                            {it.is_closed ? (
                              <CalendarOff />
                            ) : it.label?.toLowerCase().includes("verano") ? (
                              <Sun />
                            ) : (
                              <Calendar />
                            )}
                          </div>
                          <div className="gp-neg-override-info">
                            <strong>
                              {it.label ||
                                (it.is_closed
                                  ? "Cerrado": `${formatHM(it.open_time)}–${formatHM(it.close_time)}`)} </strong> <span> {sameDay ? format(parseISO(it.date_from),"EEE d MMM", { locale: es })
                                : `${format(parseISO(it.date_from), "d MMM", { locale: es })} → ${format(parseISO(it.date_to), "d MMM", { locale: es })}`}
                              {"·"}
                              {days} día{days === 1 ? "":"s"}
                            </span>
                          </div>
                          {it.status === "active" && (
                            <span className="gp-badge ok">
                              <span className="pip"style={{ background:"currentColor" }} /> Activo
                            </span>
                          )}
                        </div>
                        {!it.is_closed && it.open_time && (
                          <div className="gp-neg-override-bar">
                            <HoursBar
                              isClosed={false}
                              openTime={it.open_time}
                              closeTime={it.close_time}
                              breakStart={it.break_start}
                              breakEnd={it.break_end}
                            />
                          </div>
                        )}
                        <div className="gp-neg-override-actions">
                          <button className="gp-btn sm" onClick={() => openEdit(it)} type="button">
                            Editar
                          </button>
                          <button
                            className="gp-btn sm danger"
                            onClick={() => deleteOverride(it.id)}
                            type="button"
                          >
                            <Trash2 style={{ width: 12, height: 12 }} />
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* Past collapsed */}
          {past.length > 0 && (
            <details className="gp-card pad gp-mkt-card">
              <summary className="gp-neg-past-summary">
                Pasados ({past.length})
              </summary>
              <div className="gp-neg-overrides" style={{ marginTop: 12 }}>
                {past.slice(0, 10).map((it) => (
                  <div key={it.id} className="gp-neg-override is-past">
                    <div className="gp-neg-override-h">
                      <div className="gp-neg-override-icon">
                        {it.is_closed ? <CalendarOff /> : <Calendar />}
                      </div>
                      <div className="gp-neg-override-info">
                        <strong>{it.label || (it.is_closed ? "Cerrado": `${formatHM(it.open_time)}–${formatHM(it.close_time)}`)}</strong> <span>{format(parseISO(it.date_from),"d MMM yyyy", { locale: es })}</span>
                      </div>
                      <button
                        className="gp-icon-btn"
                        onClick={() => deleteOverride(it.id)}
                        type="button"style={{ color:"var(--gp-danger)" }}
                      >
                        <Trash2 style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Form overlay */}
      {showForm && (
        <div className="gp-neg-create-backdrop" onClick={() => !saving && setShowForm(false)}>
          <div className="gp-neg-form-card" onClick={(e) => e.stopPropagation()}>
            <div className="gp-neg-form-h">
              <h3>{editingId ? "Editar horario especial":"Nuevo horario especial"}</h3>
              <button className="gp-icon-btn" onClick={() => setShowForm(false)} type="button">
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div className="gp-mkt-chip-row">
              <button
                className={`gp-mkt-chip${formMode === "day"?" on":""}`}
                onClick={() => {
                  setFormMode("day");
                  setForm({ ...form, date_to: form.date_from });
                }}
                type="button"> Día </button> <button className={`gp-mkt-chip${formMode ==="week"?" on":""}`}
                onClick={() => {
                  setFormMode("week");
                  setForm({ ...form, date_to: format(addDays(parseISO(form.date_from), 6), "yyyy-MM-dd") });
                }}
                type="button"> Semana </button> <button className={`gp-mkt-chip${formMode ==="range"?" on":""}`}
                onClick={() => setFormMode("range")}
                type="button"
              >
                Rango
              </button>
            </div>

            <div className="gp-neg-form-row">
              <label>Etiqueta</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Ej: Navidad, Vacaciones, Puente..."
              />
            </div>

            <div className="gp-neg-form-grid">
              <div className="gp-neg-form-row">
                <label>Desde</label>
                <input
                  type="date"value={form.date_from} onChange={(e) => { const v = e.target.value; setForm({ ...form, date_from: v, date_to: formMode ==="day"? v : formMode ==="week"? format(addDays(parseISO(v), 6),"yyyy-MM-dd")
                            : form.date_to < v
                              ? v
                              : form.date_to,
                    });
                  }}
                />
              </div>
              <div className="gp-neg-form-row">
                <label>Hasta</label>
                <input
                  type="date"value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} disabled={formMode ==="day"}
                />
              </div>
            </div>

            <div className="gp-neg-form-row gp-neg-form-toggle">
              <label>Cerrado</label>
              <input
                type="checkbox"
                checked={form.is_closed}
                onChange={(e) => setForm({ ...form, is_closed: e.target.checked })}
              />
            </div>

            {!form.is_closed && (
              <>
                <div className="gp-neg-form-grid">
                  <div className="gp-neg-form-row">
                    <label>Apertura</label>
                    <input
                      type="time"
                      value={form.open_time}
                      onChange={(e) => setForm({ ...form, open_time: e.target.value })}
                    />
                  </div>
                  <div className="gp-neg-form-row">
                    <label>Cierre</label>
                    <input
                      type="time"
                      value={form.close_time}
                      onChange={(e) => setForm({ ...form, close_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="gp-neg-form-row gp-neg-form-toggle">
                  <label>Con pausa</label>
                  <input
                    type="checkbox"
                    checked={form.has_break}
                    onChange={(e) => setForm({ ...form, has_break: e.target.checked })}
                  />
                </div>
                {form.has_break && (
                  <div className="gp-neg-form-grid">
                    <div className="gp-neg-form-row">
                      <label>Pausa desde</label>
                      <input
                        type="time"
                        value={form.break_start}
                        onChange={(e) => setForm({ ...form, break_start: e.target.value })}
                      />
                    </div>
                    <div className="gp-neg-form-row">
                      <label>Pausa hasta</label>
                      <input
                        type="time"
                        value={form.break_end}
                        onChange={(e) => setForm({ ...form, break_end: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {!form.is_closed && (
              <div className="gp-neg-bar-preview">
                <HoursBar
                  isClosed={false}
                  openTime={form.open_time}
                  closeTime={form.close_time}
                  breakStart={form.has_break ? form.break_start : null}
                  breakEnd={form.has_break ? form.break_end : null}
                />
              </div>
            )}

            <div className="gp-neg-create-actions">
              <button className="gp-btn" onClick={() => setShowForm(false)} disabled={saving}>
                Cancelar
              </button>
              <button className="gp-btn primary" onClick={saveForm} disabled={saving}>
                {saving && <Loader2 className="gp-spinner-sm"/>} {editingId ?"Guardar":"Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HoursBar({
  isClosed,
  openTime,
  closeTime,
  breakStart,
  breakEnd,
}: {
  isClosed: boolean;
  openTime?: string | null;
  closeTime?: string | null;
  breakStart?: string | null;
  breakEnd?: string | null;
}) {
  const dayStart = 7 * 60;
  const dayEnd = 22 * 60;
  const total = dayEnd - dayStart;
  const toMin = (t?: string | null) => {
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const pct = (min: number) => Math.max(0, Math.min(100, ((min - dayStart) / total) * 100));

  if (isClosed) {
    return <div className="gp-neg-bar gp-neg-bar-closed" />;
  }

  const o = toMin(openTime);
  const c = toMin(closeTime);
  const bs = toMin(breakStart);
  const be = toMin(breakEnd);
  const ranges: Array<{ start: number; end: number }> = [];
  if (o != null && c != null) {
    if (bs != null && be != null && bs > o && be < c) {
      ranges.push({ start: o, end: bs }, { start: be, end: c });
    } else {
      ranges.push({ start: o, end: c });
    }
  }

  return (
    <div className="gp-neg-bar">
      {ranges.map((r, i) => (
        <div
          key={i}
          className="gp-neg-bar-range"
          style={{ left: `${pct(r.start)}%`, width: `${pct(r.end) - pct(r.start)}%` }}
        />
      ))}
      {[9, 12, 15, 18, 21].map((h) => (
        <div key={h} className="gp-neg-bar-tick" style={{ left: `${pct(h * 60)}%` }} />
      ))}
    </div>
  );
}

export default HoursManager;
