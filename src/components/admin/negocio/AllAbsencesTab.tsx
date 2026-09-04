import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CalendarOff,
  Plus,
  Loader2,
  Trash2,
  Calendar as CalendarIcon,
  Store,
  Palmtree,
  Activity,
  Coffee,
  Sparkles,
  GraduationCap,
  PartyPopper,
  PenLine,
} from "lucide-react";
import { format, parseISO, isSameDay, isWithinInterval, startOfDay, addDays, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { GlowModal } from "@/components/admin/layout/GlowModal";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface AllAbsencesTabProps {
  tenantId: string;
}

interface Stylist {
  id: string;
  name: string;
  color: string | null;
}

interface UnifiedAbsence {
  id: string;
  source: "salon" | "stylist";
  targetName: string;
  targetId?: string;
  date_from: string;
  date_to: string;
  label: string;
  is_closed: boolean;
}

const fmtDay = (iso: string) => {
  try {
    return format(parseISO(iso), "d MMM", { locale: es });
  } catch {
    return iso;
  }
};

const toIso = (d: Date) => format(d, "yyyy-MM-dd");

const REASONS = [
  { label: "Vacaciones", icon: Palmtree },
  { label: "Baja médica", icon: Activity },
  { label: "Día libre", icon: Coffee },
  { label: "Festivo local", icon: PartyPopper },
  { label: "Asuntos propios", icon: Sparkles },
  { label: "Formación", icon: GraduationCap },
];

export function AllAbsencesTab({ tenantId }: AllAbsencesTabProps) {
  const { toast } = useToast();
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [absences, setAbsences] = useState<UnifiedAbsence[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [targetType, setTargetType] = useState<"salon" | "stylist">("salon");
  const [selectedStylistId, setSelectedStylistId] = useState<string>("");
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [reasonLabel, setReasonLabel] = useState("Vacaciones");
  const [customReason, setCustomReason] = useState("");
  const [calOpen, setCalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const today = format(new Date(), "yyyy-MM-dd");

    const [stylistsRes, salonOverridesRes, stylistOverridesRes] = await Promise.all([
      supabase
        .from("tenant_stylists")
        .select("id, name, color")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("tenant_hours_overrides")
        .select("id, date_from, date_to, label, is_closed")
        .eq("tenant_id", tenantId)
        .gte("date_to", today)
        .order("date_from"),
      supabase
        .from("stylist_hours_overrides")
        .select("id, stylist_id, date_from, date_to, label, is_closed")
        .eq("tenant_id", tenantId)
        .gte("date_to", today)
        .order("date_from"),
    ]);

    const sts = (stylistsRes.data ?? []) as Stylist[];
    setStylists(sts);
    const stylistMap = new Map(sts.map((s) => [s.id, s.name]));

    const unified: UnifiedAbsence[] = [];

    // Salón
    (salonOverridesRes.data ?? []).forEach((o) => {
      unified.push({
        id: o.id,
        source: "salon",
        targetName: "Salón (Todo el local)",
        date_from: o.date_from,
        date_to: o.date_to,
        label: o.label || "Cierre de negocio",
        is_closed: o.is_closed,
      });
    });

    // Estilistas
    (stylistOverridesRes.data ?? []).forEach((o) => {
      unified.push({
        id: o.id,
        source: "stylist",
        targetName: stylistMap.get(o.stylist_id) || "Profesional",
        targetId: o.stylist_id,
        date_from: o.date_from,
        date_to: o.date_to,
        label: o.label || "Vacaciones",
        is_closed: o.is_closed,
      });
    });

    unified.sort((a, b) => a.date_from.localeCompare(b.date_from));
    setAbsences(unified);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const openNewAbsence = () => {
    setTargetType("salon");
    setSelectedStylistId(stylists[0]?.id || "");
    setRange(undefined);
    setReasonLabel("Vacaciones");
    setCustomReason("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!range?.from) {
      toast({ title: "Elige las fechas", variant: "destructive" });
      return;
    }
    const from = range.from;
    const to = range.to ?? range.from;
    if (to < from) {
      toast({ title: "La fecha final no puede ser anterior", variant: "destructive" });
      return;
    }

    const finalReason = customReason.trim() || reasonLabel.trim() || "Vacaciones";
    setSaving(true);

    if (targetType === "salon") {
      const { error } = await supabase.from("tenant_hours_overrides").insert({
        tenant_id: tenantId,
        date_from: toIso(from),
        date_to: toIso(to),
        is_closed: true,
        label: finalReason,
      });
      setSaving(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Cierre del salón registrado" });
    } else {
      if (!selectedStylistId) {
        setSaving(false);
        toast({ title: "Selecciona un profesional", variant: "destructive" });
        return;
      }
      const { error } = await supabase.from("stylist_hours_overrides").insert({
        tenant_id: tenantId,
        stylist_id: selectedStylistId,
        date_from: toIso(from),
        date_to: toIso(to),
        is_closed: true,
        label: finalReason,
      });
      setSaving(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Ausencia del profesional registrada" });
    }

    setModalOpen(false);
    load();
  };

  const handleDelete = async (absence: UnifiedAbsence) => {
    if (absence.source === "salon") {
      const { error } = await supabase.from("tenant_hours_overrides").delete().eq("id", absence.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase.from("stylist_hours_overrides").delete().eq("id", absence.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    }
    toast({ title: "Ausencia eliminada" });
    load();
  };

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

  const filteredAbsences = absences.filter((a) => {
    if (filter === "all") return true;
    if (filter === "salon") return a.source === "salon";
    return a.targetId === filter;
  });

  const rangeLabel = (() => {
    if (!range?.from) return "Selecciona el rango de fechas";
    const f = range.from;
    const t = range.to ?? range.from;
    if (isSameDay(f, t)) return format(f, "EEE d 'de' MMMM", { locale: es });
    return `${format(f, "d MMM", { locale: es })} – ${format(t, "d MMM yyyy", { locale: es })}`;
  })();

  const dayCount = range?.from
    ? Math.round(((range.to ?? range.from).getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Cabecera y botón principal */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--glow-ink)" }}>
            Vacaciones y Ausencias Planificadas
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--glow-ink-3)" }}>
            Control unificado de cierres de salón y vacaciones individuales del equipo.
          </p>
        </div>

        <button
          type="button"
          className="glow-btn glow-btn--primary glow-btn--sm w-full sm:w-auto justify-center"
          onClick={openNewAbsence}
          style={{ gap: 6, padding: "6px 14px", fontSize: 13 }}
        >
          <Plus style={{ width: 14, height: 14 }} />
          <span>Registrar vacaciones / ausencia</span>
        </button>
      </div>

      {/* Filtros rápidos con scroll horizontal suave */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`glow-mkt-chip shrink-0${filter === "all" ? " on" : ""}`}
          style={{ fontSize: 12 }}
        >
          Todas ({absences.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("salon")}
          className={`glow-mkt-chip shrink-0${filter === "salon" ? " on" : ""}`}
          style={{ fontSize: 12 }}
        >
          🏢 Salón ({absences.filter((a) => a.source === "salon").length})
        </button>
        {stylists.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setFilter(s.id)}
            className={`glow-mkt-chip shrink-0${filter === s.id ? " on" : ""}`}
            style={{ fontSize: 12 }}
          >
            👤 {s.name} ({absences.filter((a) => a.targetId === s.id).length})
          </button>
        ))}
      </div>

      {/* Lista de Ausencias */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <Loader2 className="glow-spinner" />
        </div>
      ) : filteredAbsences.length === 0 ? (
        <div
          className="glow-card pad"
          style={{
            textAlign: "center",
            padding: 36,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <CalendarOff style={{ width: 32, height: 32, color: "var(--glow-ink-3)" }} />
          <h4 style={{ margin: 0, color: "var(--glow-ink)" }}>Sin ausencias ni vacaciones programadas</h4>
          <p style={{ margin: 0, fontSize: 13, color: "var(--glow-ink-3)", maxWidth: 380 }}>
            No hay periodos bloqueados. Puedes registrar vacaciones para un profesional concreto o un cierre general del salón.
          </p>
          <button
            type="button"
            className="glow-btn glow-btn--primary glow-btn--sm"
            onClick={openNewAbsence}
            style={{ marginTop: 6 }}
          >
            <Plus style={{ width: 13, height: 13 }} />
            <span>Añadir ahora</span>
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredAbsences.map((a) => {
            const status = getAbsenceStatus(a.date_from, a.date_to);
            const isSingle = a.date_from === a.date_to;
            const datesText = isSingle
              ? fmtDay(a.date_from)
              : `${fmtDay(a.date_from)} – ${fmtDay(a.date_to)}`;

            return (
              <div
                key={`${a.source}-${a.id}`}
                className="glow-card"
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  border: status.isCurrent
                    ? "1.5px solid color-mix(in oklab, var(--glow-ok-ink) 40%, transparent)"
                    : "1px solid var(--glow-line)",
                  background: status.isCurrent
                    ? "color-mix(in oklab, var(--glow-ok-ink) 4%, var(--glow-surface))"
                    : "var(--glow-surface)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: a.source === "salon" ? "rgba(34, 64, 139, 0.08)" : "rgba(153, 50, 154, 0.08)",
                      color: a.source === "salon" ? "var(--glow-brand)" : "var(--glow-accent, #99329a)",
                      flexShrink: 0,
                    }}
                  >
                    {a.source === "salon" ? (
                      <Store style={{ width: 17, height: 17 }} />
                    ) : (
                      <Palmtree style={{ width: 17, height: 17 }} />
                    )}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 13.5, color: "var(--glow-ink)" }}>{a.label}</strong>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "1px 7px",
                          borderRadius: 999,
                          background: a.source === "salon" ? "rgba(34, 64, 139, 0.08)" : "rgba(153, 50, 154, 0.08)",
                          color: a.source === "salon" ? "var(--glow-brand)" : "var(--glow-accent, #99329a)",
                        }}
                      >
                        {a.targetName}
                      </span>
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
                            : "var(--glow-sunk)",
                          color: status.isCurrent ? "var(--glow-ok-ink)" : "var(--glow-ink-3)",
                        }}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: "var(--glow-ink-3)", marginTop: 2 }}>
                      <span>{datesText}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(a)}
                  title="Eliminar ausencia"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    color: "var(--glow-ink-3)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--glow-danger, #ef4444)";
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--glow-ink-3)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Trash2 style={{ width: 15, height: 15 }} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Registro de Ausencia / Vacaciones */}
      <GlowModal
        open={modalOpen}
        onOpenChange={(o) => !saving && setModalOpen(o)}
        title="Registrar Vacaciones o Ausencia"
        description="Bloquea las reservas en la agenda para todo el salón o un profesional concreto."
        icon={<CalendarOff />}
        size="md"
        footer={
          <>
            <button
              className="glow-btn"
              onClick={() => setModalOpen(false)}
              disabled={saving}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="glow-btn glow-btn--primary"
              onClick={handleSave}
              disabled={saving || !range?.from}
              type="button"
            >
              {saving && <Loader2 className="glow-spinner-sm" />}
              Guardar bloqueo
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* ¿A quién aplica? */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">
              ¿A quién aplica este bloqueo?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetType("salon")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  targetType === "salon"
                    ? "border-primary bg-primary/10 text-primary shadow-2xs ring-1 ring-primary/20"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Todo el salón</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType("stylist")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  targetType === "stylist"
                    ? "border-primary bg-primary/10 text-primary shadow-2xs ring-1 ring-primary/20"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <Palmtree className="w-4 h-4" />
                <span>Un profesional</span>
              </button>
            </div>

            {targetType === "stylist" && (
              <div className="mt-3">
                <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                  Selecciona el miembro del equipo:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border border-border/70 rounded-xl bg-muted/20">
                  {stylists.map((s) => {
                    const isSelected = selectedStylistId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedStylistId(s.id)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-2xs font-semibold"
                            : "border-border bg-background text-foreground hover:bg-muted"
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold shrink-0"
                          style={{ background: isSelected ? "rgba(255,255,255,0.3)" : s.color || "var(--glow-brand)" }}
                        >
                          {s.name.charAt(0).toUpperCase()}
                        </span>
                        <span>{s.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Rango de Fechas Limpio y Directo */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-foreground">
                Fechas del bloqueo
              </label>
              {dayCount > 0 && (
                <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {dayCount} {dayCount === 1 ? "día" : "días"}
                </span>
              )}
            </div>

            {/* Presets a 1 clic */}
            <div className="flex flex-wrap gap-1 mb-2">
              {[
                { label: "Hoy", getRange: () => ({ from: new Date(), to: new Date() }) },
                { label: "Mañana", getRange: () => ({ from: addDays(new Date(), 1), to: addDays(new Date(), 1) }) },
                { label: "Esta semana", getRange: () => ({ from: new Date(), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
                {
                  label: "Próx. semana",
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
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-border/70 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Fechas Desde / Hasta */}
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
          </div>

          {/* Tipo de ausencia */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Tipo de ausencia
            </label>
            <div className="flex flex-wrap gap-1.5">
              {REASONS.map((r) => {
                const Icon = r.icon;
                const active = reasonLabel === r.label && !customReason;
                return (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => {
                      setReasonLabel(r.label);
                      setCustomReason("");
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
                  if (!customReason) setCustomReason(" ");
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  customReason
                    ? "bg-primary text-primary-foreground border-primary shadow-2xs font-semibold"
                    : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <PenLine className="w-3.5 h-3.5" />
                <span>Otro motivo...</span>
              </button>
            </div>

            {customReason !== "" && (
              <input
                type="text"
                autoFocus
                placeholder="Escribe el motivo (ej: Cita médica, examen...)"
                value={customReason.trimStart()}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full mt-2 px-3 py-2 text-xs rounded-xl bg-background border border-border focus:border-ring outline-none text-foreground transition-all shadow-2xs"
              />
            )}
          </div>
        </div>
      </GlowModal>
    </div>
  );
}

export default AllAbsencesTab;
