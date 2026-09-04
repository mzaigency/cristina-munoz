import { useEffect, useMemo, useState } from "react";
import { useGlowConfirm } from "../layout/GlowConfirm";
import { GlowModal } from "../layout/GlowModal";
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
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Store,
  Users,
  Clock,
  X,
  Undo2,
  Redo2,
  RotateCcw,
  Palmtree,
  PenLine,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { TeamScheduleTab } from "./TeamScheduleTab";
import { AllAbsencesTab } from "./AllAbsencesTab";
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
  initialMainTab?: "salon" | "equipo" | "vacaciones";
  viewMode?: "horarios" | "ausencias" | "all";
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
  /** Días de la semana a los que aplica. Vacío = todos los del rango. */
  days_of_week: number[];
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
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
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
  { md: "01-01", label: "Año Nuevo" },
  { md: "01-06", label: "Reyes" },
  { md: "05-01", label: "Día del Trabajo" },
  { md: "08-15", label: "Asunción" },
  { md: "10-12", label: "Fiesta Nacional" },
  { md: "11-01", label: "Todos los Santos" },
  { md: "12-06", label: "Día de la Constitución" },
  { md: "12-08", label: "Inmaculada" },
  { md: "12-25", label: "Navidad" },
];

function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
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

const initialForm = (mode: "day" | "week" | "range", base?: Partial<FormState>): FormState => {
  const start = base?.date_from || todayISO();
  let end = start;
  if (mode === "week") end = format(addDays(parseISO(start), 6), "yyyy-MM-dd");
  if (mode === "range") end = format(addDays(parseISO(start), 14), "yyyy-MM-dd");
  return {
    label: base?.label || "",
    days_of_week: (base as { days_of_week?: number[] | null } | undefined)?.days_of_week ?? [],
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

export function HoursManager({ tenantId, initialMainTab, viewMode = "all" }: HoursManagerProps) {
  const { toast } = useToast();
  const { confirm, confirmDialog } = useGlowConfirm();
  const [mainTab, setMainTab] = useState<"salon" | "equipo" | "vacaciones">(
    viewMode === "horarios" && initialMainTab === "vacaciones"
      ? "salon"
      : initialMainTab || "salon"
  );

  useEffect(() => {
    if (initialMainTab) {
      if (viewMode === "horarios" && initialMainTab === "vacaciones") {
        setMainTab("salon");
      } else {
        setMainTab(initialMainTab);
      }
    }
  }, [initialMainTab, viewMode]);

  const [tab, setTab] = useState<"semana" | "especiales">("semana");

  // Weekly hours
  const [hours, setHours] = useState<BusinessHour[]>(DEFAULT_HOURS);
  const [initialHours, setInitialHours] = useState<BusinessHour[] | null>(null);
  const [undoStack, setUndoStack] = useState<BusinessHour[][]>([]);
  const [redoStack, setRedoStack] = useState<BusinessHour[][]>([]);
  const [savingWeekly, setSavingWeekly] = useState(false);

  // Overrides
  const [overrides, setOverrides] = useState<Override[]>([]);

  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm("day"));
  const [formMode, setFormMode] = useState<"day" | "week" | "range">("day");
  const [saving, setSaving] = useState(false);

  // Calendar
  const [calMonth, setCalMonth] = useState<Date>(startOfMonth(new Date()));

  const hasChanges = useMemo(() => {
    if (!initialHours) return false;
    return JSON.stringify(hours) !== JSON.stringify(initialHours);
  }, [hours, initialHours]);

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
      setInitialHours(merged);
    } else {
      setInitialHours(DEFAULT_HOURS);
    }
    setUndoStack([]);
    setRedoStack([]);
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
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Horario guardado" });
    setInitialHours(hours);
    setUndoStack([]);
    setRedoStack([]);
  };

  // Undo (Ctrl+Z / Cmd+Z)
  const undo = () => {
    if (undoStack.length > 0) {
      const previous = undoStack[undoStack.length - 1];
      setUndoStack((prev) => prev.slice(0, -1));
      setRedoStack((prev) => [...prev, hours]);
      setHours(previous);
      toast({
        title: "Deshecho (Ctrl+Z)",
        description: "Se ha recuperado el estado previo del horario.",
      });
    } else if (initialHours && hasChanges) {
      setRedoStack((prev) => [...prev, hours]);
      setHours(initialHours);
      toast({
        title: "Horario restaurado",
        description: "Se han recuperado los horarios originales guardados en el servidor.",
      });
    } else {
      load();
      toast({
        title: "Horario recargado",
        description: "Se ha sincronizado con los horarios guardados en base de datos.",
      });
    }
  };

  // Redo (Ctrl+Y / Cmd+Shift+Z)
  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, hours]);
    setHours(next);
    toast({
      title: "Rehecho",
      description: "Se ha vuelto a aplicar el cambio.",
    });
  };

  // Discard changes
  const discardChanges = () => {
    if (initialHours) {
      setUndoStack((prev) => [...prev, hours]);
      setHours(initialHours);
      toast({
        title: "Cambios descartados",
        description: "Se ha recuperado el horario guardado.",
      });
    } else {
      load();
    }
  };

  const updateHour = (dow: number, patch: Partial<BusinessHour>) => {
    setUndoStack((prev) => [...prev, hours]);
    setRedoStack([]);
    setHours((prev) => prev.map((h) => (h.day_of_week === dow ? { ...h, ...patch } : h)));
  };

  const copyToAll = (sourceDow: number) => {
    const src = hours.find((h) => h.day_of_week === sourceDow);
    if (!src) return;
    setUndoStack((prev) => [...prev, hours]);
    setRedoStack([]);
    setHours((prev) =>
      prev.map((h) => ({
        ...h,
        is_open: src.is_open,
        morning_start: src.morning_start,
        morning_end: src.morning_end,
        afternoon_start: src.afternoon_start,
        afternoon_end: src.afternoon_end,
        has_afternoon: src.has_afternoon,
      }))
    );
    toast({
      title: `Horario copiado a todos los días`,
      description: "Pulsa Ctrl+Z o haz clic en 'Deshacer' para revertir en cualquier momento.",
    });
  };

  // Keyboard shortcut Ctrl+Z / Cmd+Z / Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "TEXTAREA" ||
          (target.tagName === "INPUT" && (target as HTMLInputElement).type === "text"))
      ) {
        return;
      }
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undoStack, redoStack, hours, initialHours, hasChanges]);

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
    setFormMode(isSingle ? "day" : "range");
    setEditingId(it.id);
    setForm({
      days_of_week: (it as { days_of_week?: number[] | null }).days_of_week ?? [],
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
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: `${toInsert.length} festivos añadidos`,
      description: `Festivos nacionales ${year}`,
    });
    load();
  };

  const saveForm = async () => {
    if (form.date_to < form.date_from) {
      toast({ title: "Rango inválido", variant: "destructive" });
      return;
    }
    if (!form.is_closed) {
      if (form.close_time <= form.open_time) {
        toast({ title: "Horario inválido", description: "Cierre debe ser posterior a apertura", variant: "destructive" });
        return;
      }
      if (form.has_break) {
        if (form.break_start <= form.open_time || form.break_end <= form.break_start || form.close_time <= form.break_end) {
          toast({
            title: "Horario de turnos inválido",
            description: "Comprueba las horas: Apertura < Fin mañana < Apertura tarde < Cierre.",
            variant: "destructive",
          });
          return;
        }
      }
    }

    // Conflict check (skip self when editing)
    const conflicts = overrides.filter((o) => {
      if (o.id === editingId) return false;
      if (o.date_from > form.date_to || o.date_to < form.date_from) return false;
      // Dos excepciones sobre el mismo rango no chocan si van a días distintos
      const suyos = (o as { days_of_week?: number[] | null }).days_of_week;
      if (!suyos?.length || !form.days_of_week.length) return true;
      return form.days_of_week.some((d) => suyos.includes(d));
    });
    if (conflicts.length > 0) {
      const first = conflicts[0];
      toast({
        title: "Solape detectado",
        description: `Se solapa con "${first.label || (first.is_closed ? "Cerrado" : "Horario")}" del ${format(parseISO(first.date_from), "d MMM", { locale: es })}.`,
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
      // vacío = todos los días del rango; así se guarda NULL y no cambia nada
      days_of_week: form.days_of_week.length ? form.days_of_week : null,
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
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Actualizado" });
    } else {
      const { error } = await supabase.from("tenant_hours_overrides").insert(payload);
      setSaving(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Horario especial añadido" });
    }
    setShowForm(false);
    setEditingId(null);
    load();
  };

  const deleteOverride = async (id: string) => {
    const ok = await confirm({
      title: "¿Eliminar este horario especial?",
      description: "Esos días vuelven a tu horario habitual.",
    });
    if (!ok) return;
    const { error } = await supabase.from("tenant_hours_overrides").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Eliminado" });
    load();
  };

  // Categorize
  const today = todayISO();
  const active = overrides.filter((o) => o.date_from <= today && o.date_to >= today);
  const upcoming = overrides.filter((o) => o.date_from > today);
  const past = overrides.filter((o) => o.date_to < today);

  // Calendar days
  const calStart = startOfMonth(calMonth);
  const calEnd = endOfMonth(calMonth);
  const calStartWeekday = (calStart.getDay() + 6) % 7; // Monday-start
  const calDaysCount = differenceInCalendarDays(calEnd, calStart) + 1;

  const overrideForDate = (d: Date): Override | undefined => {
    const iso = format(d, "yyyy-MM-dd");
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
        <Loader2 className="glow-spinner" />
      </div>
    );
  }

  return (
    <div className="glow-fade glow-neg-hours">
      <div className="glow-page-h">
        <div>
          <h2>Horarios y Disponibilidad</h2>
          <p>Gestiona el horario de apertura del salón, los turnos del equipo y las vacaciones.</p>
        </div>
        {mainTab === "salon" && tab === "semana" && (
          <div className="glow-page-actions flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              className="flex-1 sm:flex-none glow-btn glow-btn--sm justify-center"
              onClick={openVacaciones}
              type="button"
              title="Registrar vacaciones, festivos o cierres del salón"
            >
              <CalendarOff style={{ width: 13, height: 13 }} />
              <span>Vacaciones / Festivo</span>
            </button>
            <button
              className="glow-btn glow-btn--sm justify-center"
              onClick={undo}
              disabled={undoStack.length === 0 && !hasChanges}
              type="button"
              title="Deshacer último cambio (Ctrl+Z o Cmd+Z)"
            >
              <Undo2 style={{ width: 13, height: 13 }} />
              <span>Deshacer</span>
            </button>
            {hasChanges && (
              <button
                className="glow-btn glow-btn--sm justify-center"
                onClick={discardChanges}
                type="button"
                title="Descartar cambios no guardados y volver al horario original"
                style={{ color: "var(--glow-destructive, #ef4444)" }}
              >
                <RotateCcw style={{ width: 13, height: 13 }} />
                <span>Descartar</span>
              </button>
            )}
            <button
              className="w-full sm:w-auto glow-btn glow-btn--primary glow-btn--sm justify-center"
              onClick={saveWeekly}
              disabled={savingWeekly}
              type="button"
            >
              {savingWeekly ? <Loader2 className="glow-spinner-sm" /> : <Save style={{ width: 13, height: 13 }} />}
              <span>Guardar horario del salón</span>
            </button>
          </div>
        )}
      </div>

      {/* Pestañas Maestras (100% responsive en móvil) */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border overflow-x-auto no-scrollbar mb-4">
        <button
          type="button"
          onClick={() => setMainTab("salon")}
          className={`flex-1 min-w-[130px] sm:min-w-0 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            mainTab === "salon"
              ? "bg-background text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Horario del Salón</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab("equipo")}
          className={`flex-1 min-w-[130px] sm:min-w-0 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            mainTab === "equipo"
              ? "bg-background text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Turnos del Equipo</span>
        </button>

        {viewMode !== "horarios" && (
          <button
            type="button"
            onClick={() => setMainTab("vacaciones")}
            className={`flex-1 min-w-[140px] sm:min-w-0 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              mainTab === "vacaciones"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <CalendarOff className="w-3.5 h-3.5" />
            <span>Vacaciones y Ausencias</span>
          </button>
        )}
      </div>

      {/* ── Vista 2: Turnos del Equipo ── */}
      {mainTab === "equipo" && <TeamScheduleTab tenantId={tenantId} />}

      {/* ── Vista 3: Vacaciones y Ausencias Unificadas ── */}
      {mainTab === "vacaciones" && <AllAbsencesTab tenantId={tenantId} />}

      {/* ── Vista 1: Horario del Salón ── */}
      {mainTab === "salon" && (
        <>
          {/* Sub-tabs del Salón */}
          <div className="glow-neg-hours-tabs">
            <button
              className={`glow-mkt-chip${tab === "semana" ? " on" : ""}`}
              onClick={() => setTab("semana")}
              type="button"
            >
              <Calendar style={{ width: 13, height: 13 }} /> Semanal
            </button>
            <button
              className={`glow-mkt-chip${tab === "especiales" ? " on" : ""}`}
              onClick={() => setTab("especiales")}
              type="button"
            >
              <Sparkles style={{ width: 13, height: 13 }} /> Festivos y Cierres ({overrides.length})
            </button>
          </div>

          {tab === "semana" && (
            <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden mt-3">
              {/* Table Header / Subtitle Toolbar */}
              <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-border/70 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Horario habitual de la semana</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configura los días en que abre el salón y los tramos de apertura para atención a clientes.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={openVacaciones}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 border border-primary/25 transition-all shadow-2xs"
                    title="Añadir vacaciones o festivos donde el salón cerrará"
                  >
                    <CalendarOff className="w-3.5 h-3.5" />
                    <span>Añadir vacaciones / festivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={undo}
                    disabled={undoStack.length === 0 && !hasChanges}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground bg-background hover:bg-muted border border-border hover:text-foreground transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Deshacer cambios (Ctrl+Z o Cmd+Z)"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Deshacer (Ctrl+Z)</span>
                  </button>
                  {hasChanges && (
                    <button
                      type="button"
                      onClick={discardChanges}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 bg-background hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-all shadow-2xs"
                      title="Restablecer al horario original guardado"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Descartar</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => copyToAll(1)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground bg-background hover:bg-muted border border-border hover:text-foreground transition-all shadow-2xs"
                    title="Copiar horario del Lunes a toda la semana"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Lunes a toda la semana</span>
                  </button>
                </div>
              </div>

              {/* Rows Monday to Sunday */}
              <div className="divide-y divide-border/50">
                {DAYS_OF_WEEK.map((day) => {
                  const h = hours.find((x) => x.day_of_week === day.value)!;
                  return (
                    <div
                      key={day.value}
                      className={`px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        !h.is_open ? "bg-muted/10 opacity-75 hover:opacity-100" : "hover:bg-muted/15"
                      }`}
                    >
                      {/* Day & Switch */}
                      <div className="flex items-center justify-between sm:justify-start gap-3 min-w-[180px]">
                        <div className="flex items-center gap-3">
                          <Switch
                            id={`salon-switch-${day.value}`}
                            checked={h.is_open}
                            onCheckedChange={(checked) => updateHour(day.value, { is_open: checked })}
                          />
                          <label
                            htmlFor={`salon-switch-${day.value}`}
                            className="cursor-pointer select-none flex flex-col"
                          >
                            <span className={`text-sm font-semibold ${h.is_open ? "text-foreground" : "text-muted-foreground"}`}>
                              {DAYS_LONG[day.value]}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {h.is_open ? "Abierto" : "Cerrado"}
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Time Inputs / Shifts */}
                      <div className="flex-1 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
                        {!h.is_open ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-muted-foreground bg-muted/40 border border-dashed border-border/80 w-fit">
                            Cerrado todo el día
                          </span>
                        ) : (
                          <>
                            {/* Turno Mañana / Continuo */}
                            <div className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 rounded-xl bg-background border border-border shadow-2xs">
                              <div className="flex items-center gap-1.5">
                                <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span className="text-xs font-medium text-muted-foreground">
                                  {h.has_afternoon ? "Mañana:" : "Continuo:"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="time"
                                  value={h.morning_start}
                                  onChange={(e) => updateHour(day.value, { morning_start: e.target.value })}
                                  className="w-[72px] px-1 py-0.5 text-xs font-semibold rounded bg-muted/30 border border-transparent focus:border-ring focus:bg-background outline-none text-foreground transition-all"
                                />
                                <span className="text-xs text-muted-foreground">→</span>
                                <input
                                  type="time"
                                  value={h.morning_end}
                                  onChange={(e) => updateHour(day.value, { morning_end: e.target.value })}
                                  className="w-[72px] px-1 py-0.5 text-xs font-semibold rounded bg-muted/30 border border-transparent focus:border-ring focus:bg-background outline-none text-foreground transition-all"
                                />
                              </div>
                            </div>

                            {/* Turno Tarde (si tiene) o botón para añadirlo */}
                            {h.has_afternoon ? (
                              <div className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 rounded-xl bg-background border border-border shadow-2xs">
                                <div className="flex items-center gap-1.5">
                                  <Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                  <span className="text-xs font-medium text-muted-foreground">Tarde:</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="time"
                                    value={h.afternoon_start}
                                    onChange={(e) => updateHour(day.value, { afternoon_start: e.target.value })}
                                    className="w-[72px] px-1 py-0.5 text-xs font-semibold rounded bg-muted/30 border border-transparent focus:border-ring focus:bg-background outline-none text-foreground transition-all"
                                  />
                                  <span className="text-xs text-muted-foreground">→</span>
                                  <input
                                    type="time"
                                    value={h.afternoon_end}
                                    onChange={(e) => updateHour(day.value, { afternoon_end: e.target.value })}
                                    className="w-[72px] px-1 py-0.5 text-xs font-semibold rounded bg-muted/30 border border-transparent focus:border-ring focus:bg-background outline-none text-foreground transition-all"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateHour(day.value, { has_afternoon: false })}
                                    className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-0.5"
                                    title="Quitar turno de tarde (jornada continua)"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  updateHour(day.value, {
                                    has_afternoon: true,
                                    afternoon_start: "16:00",
                                    afternoon_end: "20:00",
                                  })
                                }
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-foreground/30 hover:bg-muted/30 transition-all"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Añadir turno de tarde</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Quick copy row to all */}
                      {h.is_open && (
                        <div className="shrink-0 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => copyToAll(day.value)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors text-xs inline-flex items-center gap-1"
                            title={`Copiar horario de ${DAYS_LONG[day.value]} a todos los días`}
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-medium hidden md:inline">Copiar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Card Footer with Save CTA */}
              <div className="px-5 py-3.5 bg-muted/20 border-t border-border/70 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {hasChanges
                    ? "Tienes cambios sin guardar. Puedes usar Deshacer (Ctrl+Z) o Descartar antes de guardar."
                    : "Los cambios guardados aplicarán a las futuras reservas y al horario público del salón."}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={undo}
                    disabled={undoStack.length === 0 && !hasChanges}
                    className="glow-btn glow-btn--sm"
                    title="Deshacer (Ctrl+Z)"
                  >
                    <Undo2 style={{ width: 13, height: 13 }} />
                    Deshacer
                  </button>
                  <button
                    className="glow-btn glow-btn--primary glow-btn--sm"
                    onClick={saveWeekly}
                    disabled={savingWeekly}
                    type="button"
                  >
                    {savingWeekly ? <Loader2 className="glow-spinner-sm" /> : <Save style={{ width: 13, height: 13 }} />}
                    Guardar horario del salón
                  </button>
                </div>
              </div>
            </div>
          )}

      {tab === "especiales" && (
        <div className="glow-neg-special">
          {/* Hero — active or next */}
          {(active.length > 0 || nextSpecial) && (
            <div className="glow-neg-special-hero">
              {active.length > 0 && (
                <div className="glow-neg-hero-active">
                  <CheckCircle2 style={{ width: 16, height: 16 }} />
                  <div>
                    <strong>Activo ahora: {active[0].label || (active[0].is_closed ? "Cerrado" : "Horario especial")}</strong>
                    <span>
                      Hasta {format(parseISO(active[0].date_to), "d MMM", { locale: es })}
                    </span>
                  </div>
                </div>
              )}
              {!active.length && nextSpecial && (
                <div className="glow-neg-hero-next">
                  <AlertCircle style={{ width: 16, height: 16 }} />
                  <div>
                    <strong>
                      Próximo: {nextSpecial.label || (nextSpecial.is_closed ? "Cerrado" : "Horario especial")}
                    </strong>
                    <span>
                      {format(parseISO(nextSpecial.date_from), "d MMM", { locale: es })}
                      {nextSpecial.date_from !== nextSpecial.date_to &&
                        ` → ${format(parseISO(nextSpecial.date_to), "d MMM", { locale: es })}`}
                      {" · "}
                      {differenceInCalendarDays(parseISO(nextSpecial.date_from), new Date())} días
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick action toolbar */}
          <div className="glow-neg-quick-actions">
            <button className="glow-neg-quick-action tone-rose" onClick={openVacaciones} type="button">
              <span className="glow-mkt-quick-ic" style={{ background: "var(--glow-accent-soft)", color: "var(--glow-accent)" }}>
                <Plane />
              </span>
              <strong>Cierre por vacaciones</strong>
              <span>Todo el local cerrado</span>
            </button>
            <button className="glow-neg-quick-action tone-warn" onClick={openFestivo} type="button">
              <span className="glow-mkt-quick-ic" style={{ background: "var(--glow-warn-soft)", color: "var(--glow-warn-ink)" }}>
                <PartyPopper />
              </span>
              <strong>Festivo</strong>
              <span>Día cerrado</span>
            </button>
            <button className="glow-neg-quick-action tone-ok" onClick={openHorarioVerano} type="button">
              <span className="glow-mkt-quick-ic" style={{ background: "var(--glow-ok-soft)", color: "var(--glow-ok-ink)" }}>
                <Sun />
              </span>
              <strong>Horario verano</strong>
              <span>Jul-Ago reducido</span>
            </button>
            <button className="glow-neg-quick-action tone-brand" onClick={openCustom} type="button">
              <span className="glow-mkt-quick-ic" style={{ background: "var(--glow-brand-soft)", color: "var(--glow-brand)" }}>
                <Plus />
              </span>
              <strong>Personalizado</strong>
              <span>Configurar manual</span>
            </button>
          </div>

          {/* Festivos preset */}
          <div className="glow-neg-festivos-banner">
            <div>
              <strong>Festivos nacionales {new Date().getFullYear()}</strong>
              <span>Año Nuevo · Reyes · 1 Mayo · 15 Ago · 12 Oct · Todos Santos · 6 Dic · 8 Dic · Navidad</span>
            </div>
            <button className="glow-btn glow-btn--sm glow-btn--primary" onClick={addAllNationalHolidays} type="button">
              <CalendarOff style={{ width: 13, height: 13 }} /> Añadir todos
            </button>
          </div>

          {/* Month calendar visual */}
          <div className="glow-card glow-card--pad glow-mkt-card">
            <div className="glow-mkt-card-h">
              <div>
                <h3>Calendario del mes</h3>
                <p>{format(calMonth, "MMMM yyyy", { locale: es })}</p>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  className="glow-icon-btn"
                  onClick={() => setCalMonth(addMonths(calMonth, -1))}
                  type="button"
                >
                  <ChevronLeft style={{ width: 14, height: 14 }} />
                </button>
                <button
                  className="glow-icon-btn"
                  onClick={() => setCalMonth(startOfMonth(new Date()))}
                  type="button"
                  title="Hoy"
                >
                  <Calendar style={{ width: 14, height: 14 }} />
                </button>
                <button
                  className="glow-icon-btn"
                  onClick={() => setCalMonth(addMonths(calMonth, 1))}
                  type="button"
                >
                  <ChevronRight style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
            <div className="glow-neg-cal">
              <div className="glow-neg-cal-headers">
                {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="glow-neg-cal-grid">
                {Array.from({ length: calStartWeekday }).map((_, i) => (
                  <div key={`pad-${i}`} className="glow-neg-cal-cell is-pad" />
                ))}
                {Array.from({ length: calDaysCount }).map((_, i) => {
                  const d = addDays(calStart, i);
                  const dow = d.getDay();
                  const iso = format(d, "yyyy-MM-dd");
                  const isToday = iso === today;
                  const ov = overrideForDate(d);
                  const baseOpen = isOpenWeekday(dow);
                  let state: "open" | "closed" | "special" | "special-closed" = baseOpen ? "open" : "closed";
                  if (ov) state = ov.is_closed ? "special-closed" : "special";
                  const cellClass = `glow-neg-cal-cell state-${state}${isToday ? " is-today" : ""}`;
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
                      type="button"
                      title={ov?.label || (state === "closed" ? "Cerrado" : "Abierto")}
                    >
                      <span>{i + 1}</span>
                      {ov && <span className="glow-neg-cal-dot" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="glow-neg-cal-legend">
              <span className="state-open">Abierto</span>
              <span className="state-closed">Cerrado</span>
              <span className="state-special">Especial</span>
              <span className="state-special-closed">Cerrado especial</span>
            </div>
          </div>

          {/* Timeline strip */}
          {(active.length + upcoming.length) > 0 && (
            <div className="glow-card glow-card--pad glow-mkt-card">
              <div className="glow-mkt-card-h">
                <div>
                  <h3>Próximos cambios</h3>
                  <p>{active.length + upcoming.length} horarios programados</p>
                </div>
              </div>
              <div className="glow-neg-overrides">
                {[...active.map((it) => ({ ...it, status: "active" as const })), ...upcoming.map((it) => ({ ...it, status: "upcoming" as const }))].map(
                  (it) => {
                    const days = differenceInCalendarDays(parseISO(it.date_to), parseISO(it.date_from)) + 1;
                    const sameDay = it.date_from === it.date_to;
                    return (
                      <div
                        key={it.id}
                        className={`glow-neg-override${it.status === "active" ? " is-active" : ""}${it.is_closed ? " is-closed" : ""}`}
                      >
                        <div className="glow-neg-override-h">
                          <div className="glow-neg-override-icon">
                            {it.is_closed ? (
                              <CalendarOff />
                            ) : it.label?.toLowerCase().includes("verano") ? (
                              <Sun />
                            ) : (
                              <Calendar />
                            )}
                          </div>
                          <div className="glow-neg-override-info">
                            <strong>
                              {it.label ||
                                (it.is_closed
                                  ? "Cerrado"
                                  : `${formatHM(it.open_time)}–${formatHM(it.close_time)}`)}
                            </strong>
                            <span>
                              {sameDay
                                ? format(parseISO(it.date_from), "EEE d MMM", { locale: es })
                                : `${format(parseISO(it.date_from), "d MMM", { locale: es })} → ${format(parseISO(it.date_to), "d MMM", { locale: es })}`}
                              {" · "}
                              {days} día{days === 1 ? "" : "s"}
                            </span>
                          </div>
                          {it.status === "active" && (
                            <span className="glow-badge glow-badge--ok">
                              <span className="pip" style={{ background: "currentColor" }} /> Activo
                            </span>
                          )}
                        </div>
                        {!it.is_closed && it.open_time && (
                          <div className="glow-neg-override-bar">
                            <HoursBar
                              isClosed={false}
                              openTime={it.open_time}
                              closeTime={it.close_time}
                              breakStart={it.break_start}
                              breakEnd={it.break_end}
                            />
                          </div>
                        )}
                        <div className="glow-neg-override-actions">
                          <button className="glow-btn glow-btn--sm" onClick={() => openEdit(it)} type="button">
                            Editar
                          </button>
                          <button
                            className="glow-btn glow-btn--sm glow-btn--danger"
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
            <details className="glow-card glow-card--pad glow-mkt-card">
              <summary className="glow-neg-past-summary">
                Pasados ({past.length})
              </summary>
              <div className="glow-neg-overrides" style={{ marginTop: 12 }}>
                {past.slice(0, 10).map((it) => (
                  <div key={it.id} className="glow-neg-override is-past">
                    <div className="glow-neg-override-h">
                      <div className="glow-neg-override-icon">
                        {it.is_closed ? <CalendarOff /> : <Calendar />}
                      </div>
                      <div className="glow-neg-override-info">
                        <strong>{it.label || (it.is_closed ? "Cerrado" : `${formatHM(it.open_time)}–${formatHM(it.close_time)}`)}</strong>
                        <span>{format(parseISO(it.date_from), "d MMM yyyy", { locale: es })}</span>
                      </div>
                      <button
                        className="glow-icon-btn"
                        onClick={() => deleteOverride(it.id)}
                        type="button"
                        style={{ color: "var(--glow-danger-ink)" }}
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
        </>
      )}

      {/* Modal intuitivo de Vacaciones / Festivos / Horario Especial */}
      <GlowModal
        open={showForm}
        onOpenChange={(o) => !saving && setShowForm(o)}
        title={editingId ? "Editar fecha especial" : "Registrar vacaciones o festivo"}
        description="Bloquea días completos para vacaciones/festivos o define una jornada especial."
        icon={<CalendarOff />}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button className="glow-btn glow-btn--sm" onClick={() => setShowForm(false)} disabled={saving} type="button">
              Cancelar
            </button>
            <button className="glow-btn glow-btn--primary glow-btn--sm" onClick={saveForm} disabled={saving} type="button">
              {saving && <Loader2 className="glow-spinner-sm" />}
              {editingId ? "Guardar cambios" : form.is_closed ? "Confirmar cierre del salón" : "Guardar horario especial"}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 py-1">
          {/* 1. Selector de Tipo: Salón Cerrado vs Horario Especial */}
          <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl border border-border/60 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setForm({ ...form, is_closed: true })}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                form.is_closed
                  ? "bg-background text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarOff className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Salón cerrado</span>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, is_closed: false })}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                !form.is_closed
                  ? "bg-background text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Horario especial</span>
            </button>
          </div>

          {/* 2. Fechas de afectación con atajos a 1 clic */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-foreground">
                Fechas afectadas
              </label>
              {(() => {
                try {
                  const days = differenceInCalendarDays(parseISO(form.date_to || form.date_from), parseISO(form.date_from)) + 1;
                  return (
                    <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {days} {days === 1 ? "día" : "días"}
                    </span>
                  );
                } catch {
                  return null;
                }
              })()}
            </div>

            {/* Atajos de 1 clic */}
            <div className="flex flex-wrap gap-1 mb-2">
              {[
                {
                  label: "Hoy",
                  apply: () => {
                    const t = todayISO();
                    setForm({ ...form, date_from: t, date_to: t });
                  },
                },
                {
                  label: "Mañana",
                  apply: () => {
                    const m = format(addDays(new Date(), 1), "yyyy-MM-dd");
                    setForm({ ...form, date_from: m, date_to: m });
                  },
                },
                {
                  label: "Esta semana",
                  apply: () => {
                    const start = todayISO();
                    const end = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
                    setForm({ ...form, date_from: start, date_to: end });
                  },
                },
                {
                  label: "1 semana",
                  apply: () => {
                    const start = form.date_from || todayISO();
                    const end = format(addDays(parseISO(start), 6), "yyyy-MM-dd");
                    setForm({ ...form, date_to: end });
                  },
                },
                {
                  label: "15 días",
                  apply: () => {
                    const start = form.date_from || todayISO();
                    const end = format(addDays(parseISO(start), 14), "yyyy-MM-dd");
                    setForm({ ...form, date_to: end });
                  },
                },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={preset.apply}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-border/70 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Inputs de fecha directos y limpios */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10.5px] font-medium text-muted-foreground mb-1 block">Desde</span>
                <input
                  type="date"
                  value={form.date_from}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm({
                      ...form,
                      date_from: v,
                      date_to: form.date_to < v ? v : form.date_to,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-background border border-border focus:border-ring outline-none text-foreground transition-all shadow-2xs"
                />
              </div>
              <div>
                <span className="text-[10.5px] font-medium text-muted-foreground mb-1 block">Hasta</span>
                <input
                  type="date"
                  value={form.date_to}
                  min={form.date_from}
                  onChange={(e) => setForm({ ...form, date_to: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-background border border-border focus:border-ring outline-none text-foreground transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* 3. Motivo: pastillas directas y solo input si elige "Otro" */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Motivo
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Vacaciones", icon: Plane, closed: true },
                { label: "Festivo", icon: PartyPopper, closed: true },
                { label: "Puente", icon: Calendar, closed: true },
                { label: "Navidad", icon: Sparkles, closed: true },
                { label: "Horario de verano", icon: Sun, closed: false, open: "09:00", close: "15:00" },
                { label: "Reforma", icon: Store, closed: true },
              ].map((preset) => {
                const isSelected = form.label.toLowerCase() === preset.label.toLowerCase();
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({
                        ...f,
                        label: preset.label,
                        is_closed: preset.closed,
                        open_time: preset.open || f.open_time,
                        close_time: preset.close || f.close_time,
                      }));
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-2xs font-semibold"
                        : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{preset.label}</span>
                  </button>
                );
              })}

              {/* Botón de motivo personalizado */}
              <button
                type="button"
                onClick={() => {
                  const isPreset = ["vacaciones", "festivo", "puente", "navidad", "horario de verano", "reforma"].includes(form.label.toLowerCase());
                  if (isPreset) setForm({ ...form, label: "" });
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  !["vacaciones", "festivo", "puente", "navidad", "horario de verano", "reforma"].includes(form.label.toLowerCase()) && form.label !== ""
                    ? "bg-primary text-primary-foreground border-primary shadow-2xs font-semibold"
                    : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <PenLine className="w-3.5 h-3.5" />
                <span>Otro motivo...</span>
              </button>
            </div>

            {/* Input solo visible si el motivo es personalizado o está vacío */}
            {(!["vacaciones", "festivo", "puente", "navidad", "horario de verano", "reforma"].includes(form.label.toLowerCase()) || form.label === "") && (
              <input
                type="text"
                autoFocus
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Escribe el motivo (ej. Fiestas patronales, mudanza...)"
                className="w-full mt-2 px-3 py-2 text-xs rounded-xl bg-background border border-border focus:border-ring outline-none text-foreground transition-all shadow-2xs"
              />
            )}
          </div>

          {/* 4. Si es horario especial (abierto): Horario con soporte para Doble Turno (Partido) */}
          {!form.is_closed && (
            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <label className="text-xs font-semibold text-foreground">
                    Horario de atención
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      has_break: !f.has_break,
                      break_start: f.break_start || "14:00",
                      break_end: f.break_end || "16:30",
                    }));
                  }}
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                >
                  {form.has_break ? (
                    <>
                      <X className="w-3 h-3" />
                      <span>Quitar turno de tarde (Jornada continua)</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span>Añadir turno de tarde (Doble turno)</span>
                    </>
                  )}
                </button>
              </div>

              {!form.has_break ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10.5px] font-medium text-muted-foreground mb-1 block">Apertura</span>
                    <input
                      type="time"
                      value={form.open_time}
                      onChange={(e) => setForm({ ...form, open_time: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg bg-background border border-border outline-none text-foreground shadow-2xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10.5px] font-medium text-muted-foreground mb-1 block">Cierre</span>
                    <input
                      type="time"
                      value={form.close_time}
                      onChange={(e) => setForm({ ...form, close_time: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg bg-background border border-border outline-none text-foreground shadow-2xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Turno de Mañana */}
                  <div className="p-2.5 rounded-lg bg-background border border-border/60">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      Turno de Mañana
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground mb-1 block">Apertura</span>
                        <input
                          type="time"
                          value={form.open_time}
                          onChange={(e) => setForm({ ...form, open_time: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs font-semibold rounded-md bg-muted/30 border border-border outline-none text-foreground"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground mb-1 block">Cierre de mañana</span>
                        <input
                          type="time"
                          value={form.break_start}
                          onChange={(e) => setForm({ ...form, break_start: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs font-semibold rounded-md bg-muted/30 border border-border outline-none text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Turno de Tarde */}
                  <div className="p-2.5 rounded-lg bg-background border border-border/60">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                      <Moon className="w-3.5 h-3.5 text-indigo-500" />
                      Turno de Tarde
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground mb-1 block">Apertura de tarde</span>
                        <input
                          type="time"
                          value={form.break_end}
                          onChange={(e) => setForm({ ...form, break_end: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs font-semibold rounded-md bg-muted/30 border border-border outline-none text-foreground"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground mb-1 block">Cierre</span>
                        <input
                          type="time"
                          value={form.close_time}
                          onChange={(e) => setForm({ ...form, close_time: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs font-semibold rounded-md bg-muted/30 border border-border outline-none text-foreground"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </GlowModal>
      {confirmDialog}
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
    return <div className="glow-neg-bar glow-neg-bar-closed" />;
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
    <div className="glow-neg-bar">
      {ranges.map((r, i) => (
        <div
          key={i}
          className="glow-neg-bar-range"
          style={{ left: `${pct(r.start)}%`, width: `${pct(r.end) - pct(r.start)}%` }}
        />
      ))}
      {[9, 12, 15, 18, 21].map((h) => (
        <div key={h} className="glow-neg-bar-tick" style={{ left: `${pct(h * 60)}%` }} />
      ))}
    </div>
  );
}

export default HoursManager;
