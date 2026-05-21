import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  CalendarRange,
  Plus,
  Trash2,
  Sparkles,
  CalendarDays,
  CalendarClock,
  Sun,
  DoorClosed,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

interface Props {
  tenantId: string;
}

type Mode = "day" | "week" | "range";

const today = () => format(new Date(), "yyyy-MM-dd");

const initialForm = (mode: Mode) => {
  const start = today();
  const end =
    mode === "day"
      ? start
      : mode === "week"
        ? format(addDays(new Date(), 6), "yyyy-MM-dd")
        : format(addDays(new Date(), 30), "yyyy-MM-dd");
  return {
    label: "",
    date_from: start,
    date_to: end,
    is_closed: false,
    open_time: "09:00",
    close_time: "19:00",
    has_break: false,
    break_start: "13:00",
    break_end: "15:00",
  };
};

const formatHM = (t?: string | null) => (t ? t.slice(0, 5) : "");

// Mini visual timeline (8h–22h) showing open ranges
const HoursBar = ({
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
}) => {
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
    return (
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-destructive/10">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent_0_6px,hsl(var(--destructive)/0.25)_6px_12px)]" />
      </div>
    );
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
    <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
      {ranges.map((r, i) => (
        <div
          key={i}
          className="absolute top-0 h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
          style={{ left: `${pct(r.start)}%`, width: `${pct(r.end) - pct(r.start)}%` }}
        />
      ))}
      {/* hour ticks */}
      {[9, 12, 15, 18, 21].map((h) => (
        <div
          key={h}
          className="absolute top-1/2 h-1 w-px -translate-y-1/2 bg-foreground/20"
          style={{ left: `${pct(h * 60)}%` }}
        />
      ))}
    </div>
  );
};

export function SeasonalHoursManager({ tenantId }: Props) {
  const [items, setItems] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<Mode>("day");
  const [form, setForm] = useState(initialForm("day"));
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("tenant_hours_overrides")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("date_from", { ascending: true });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setItems((data as Override[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (tenantId) load();
  }, [tenantId]);

  const changeMode = (m: Mode) => {
    setMode(m);
    setForm((f) => {
      const base = initialForm(m);
      return {
        ...base,
        // keep current "from" if user already chose one
        date_from: f.date_from || base.date_from,
        date_to:
          m === "day"
            ? f.date_from || base.date_from
            : m === "week"
              ? format(addDays(new Date(f.date_from || base.date_from), 6), "yyyy-MM-dd")
              : f.date_to || base.date_to,
        is_closed: f.is_closed,
        open_time: f.open_time,
        close_time: f.close_time,
        has_break: f.has_break,
        break_start: f.break_start,
        break_end: f.break_end,
        label: f.label,
      };
    });
  };

  const handleFromChange = (v: string) => {
    setForm((f) => ({
      ...f,
      date_from: v,
      date_to:
        mode === "day"
          ? v
          : mode === "week"
            ? format(addDays(new Date(v), 6), "yyyy-MM-dd")
            : f.date_to < v
              ? v
              : f.date_to,
    }));
  };

  const dayCount = useMemo(() => {
    if (!form.date_from || !form.date_to) return 0;
    return differenceInCalendarDays(parseISO(form.date_to), parseISO(form.date_from)) + 1;
  }, [form.date_from, form.date_to]);

  const handleSave = async () => {
    if (!form.date_from || !form.date_to) {
      toast({ title: "Faltan fechas", description: "Indica desde y hasta", variant: "destructive" });
      return;
    }
    if (form.date_to < form.date_from) {
      toast({ title: "Rango inválido", description: "La fecha 'Hasta' debe ser posterior", variant: "destructive" });
      return;
    }
    if (!form.is_closed) {
      if (form.close_time <= form.open_time) {
        toast({ title: "Horario inválido", description: "El cierre debe ser después de la apertura", variant: "destructive" });
        return;
      }
      if (form.has_break && (form.break_end <= form.break_start || form.break_start <= form.open_time || form.break_end >= form.close_time)) {
        toast({ title: "Pausa inválida", description: "La pausa debe estar dentro del horario", variant: "destructive" });
        return;
      }
    }

    // Detect overlap with existing overrides
    const overlapping = items.filter(
      (it) => it.date_from <= form.date_to && it.date_to >= form.date_from,
    );
    if (overlapping.length > 0) {
      const first = overlapping[0];
      const sameDay = first.date_from === first.date_to;
      const range = sameDay
        ? format(parseISO(first.date_from), "d 'de' MMM", { locale: es })
        : `${format(parseISO(first.date_from), "d MMM", { locale: es })} → ${format(parseISO(first.date_to), "d MMM", { locale: es })}`;
      toast({
        title: "Se solapa con otro horario especial",
        description: `Ya existe "${first.label || (first.is_closed ? "Cerrado" : `${formatHM(first.open_time)}–${formatHM(first.close_time)}`)}" (${range}). Elimínalo o cambia las fechas antes de guardar.`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const payload: any = {
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
    const { error } = await (supabase as any).from("tenant_hours_overrides").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "No se pudo guardar", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Horario aplicado ✨",
      description: `Activo desde ya en ${dayCount} día${dayCount > 1 ? "s" : ""}. Tus clientes ya ven los huecos correctos.`,
    });
    setForm(initialForm(mode));
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any).from("tenant_hours_overrides").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Horario eliminado", description: "Vuelve a aplicarse el horario semanal." });
    load();
  };

  const todayISO = today();
  const active = items.filter((i) => i.date_from <= todayISO && i.date_to >= todayISO);
  const upcoming = items.filter((i) => i.date_from > todayISO);
  const past = items.filter((i) => i.date_to < todayISO);

  const renderItem = (it: Override, status: "active" | "upcoming" | "past") => {
    const days = differenceInCalendarDays(parseISO(it.date_to), parseISO(it.date_from)) + 1;
    const sameDay = it.date_from === it.date_to;
    return (
      <div
        key={it.id}
        className={cn(
          "group relative overflow-hidden rounded-2xl border bg-card p-4 transition-all",
          status === "active" && "border-primary/40 bg-primary/5 shadow-sm",
          status === "past" && "opacity-60",
        )}
      >
        {status === "active" && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
            <CheckCircle2 className="h-3 w-3" /> Activo ahora
          </div>
        )}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              it.is_closed ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
            )}
          >
            {it.is_closed ? <DoorClosed className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold truncate">
                {it.label || (it.is_closed ? "Cerrado" : `${formatHM(it.open_time)} – ${formatHM(it.close_time)}`)}
              </p>
              <Badge variant="outline" className="text-[10px]">
                {days} día{days > 1 ? "s" : ""}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sameDay
                ? format(parseISO(it.date_from), "EEEE d 'de' MMMM", { locale: es })
                : `${format(parseISO(it.date_from), "d MMM", { locale: es })} → ${format(parseISO(it.date_to), "d MMM yyyy", { locale: es })}`}
            </p>
            <div className="mt-3">
              <HoursBar
                isClosed={it.is_closed}
                openTime={it.open_time}
                closeTime={it.close_time}
                breakStart={it.break_start}
                breakEnd={it.break_end}
              />
              {!it.is_closed && (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {formatHM(it.open_time)}–{formatHM(it.close_time)}
                  {it.break_start && ` · pausa ${formatHM(it.break_start)}–${formatHM(it.break_end)}`}
                </p>
              )}
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="opacity-60 group-hover:opacity-100"
            onClick={() => handleDelete(it.id)}
            aria-label="Eliminar"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
            <CalendarRange className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle>Horarios especiales</CardTitle>
            <CardDescription className="mt-0.5">
              Cambia o cierra un día, una semana o una temporada. Tiene prioridad sobre el horario semanal.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Active highlight */}
        {active.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Aplicándose hoy</p>
            <div className="space-y-2">{active.map((it) => renderItem(it, "active"))}</div>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Próximos</p>
            <div className="space-y-2">{upcoming.map((it) => renderItem(it, "upcoming"))}</div>
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center transition-all hover:border-primary/60 hover:bg-primary/10"
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg">
              <Sparkles className="h-7 w-7" />
            </div>
            <p className="font-semibold">Crear horario especial</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Vacaciones, festivo, jornada intensiva de verano…
            </p>
          </button>
        )}

        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Toggle form button when there are items */}
        {!loading && items.length > 0 && !showForm && (
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            className="w-full border-dashed border-primary/40 text-primary hover:bg-primary/5"
          >
            <Plus className="mr-2 h-4 w-4" /> Añadir otro horario especial
          </Button>
        )}

        {/* Form */}
        {showForm && (
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="font-semibold">Nuevo horario especial</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>

            {/* Mode chips */}
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "day", label: "Un día", icon: CalendarDays },
                  { id: "week", label: "Una semana", icon: CalendarClock },
                  { id: "range", label: "Periodo", icon: CalendarRange },
                ] as const
              ).map((opt) => {
                const Icon = opt.icon;
                const isSel = mode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => changeMode(opt.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-all",
                      isSel
                        ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "border-border bg-background hover:border-primary/40 hover:bg-primary/5",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">
                  {mode === "day" ? "Día" : "Desde"}
                </Label>
                <Input
                  type="date"
                  value={form.date_from}
                  min={todayISO}
                  onChange={(e) => handleFromChange(e.target.value)}
                  className="mt-1"
                />
              </div>
              {mode !== "day" && (
                <div>
                  <Label className="text-xs text-muted-foreground">Hasta</Label>
                  <Input
                    type="date"
                    value={form.date_to}
                    min={form.date_from}
                    onChange={(e) => setForm({ ...form, date_to: e.target.value })}
                    className="mt-1"
                  />
                </div>
              )}
              {mode === "day" && (
                <div>
                  <Label className="text-xs text-muted-foreground">Etiqueta (opcional)</Label>
                  <Input
                    placeholder="Festivo, congreso…"
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            {mode !== "day" && (
              <div>
                <Label className="text-xs text-muted-foreground">Etiqueta (opcional)</Label>
                <Input
                  placeholder={mode === "week" ? "Semana corta" : "Horario de verano"}
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="mt-1"
                />
              </div>
            )}

            {/* Closed toggle */}
            <button
              type="button"
              onClick={() => setForm({ ...form, is_closed: !form.is_closed })}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all",
                form.is_closed
                  ? "border-destructive/40 bg-destructive/5"
                  : "border-border bg-background hover:border-primary/30",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    form.is_closed ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
                  )}
                >
                  <DoorClosed className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Cerrado en este periodo</p>
                  <p className="text-xs text-muted-foreground">No se podrán reservar citas</p>
                </div>
              </div>
              <Switch checked={form.is_closed} onCheckedChange={(v) => setForm({ ...form, is_closed: v })} />
            </button>

            {!form.is_closed && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Apertura
                    </Label>
                    <Input
                      type="time"
                      value={form.open_time}
                      onChange={(e) => setForm({ ...form, open_time: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Cierre
                    </Label>
                    <Input
                      type="time"
                      value={form.close_time}
                      onChange={(e) => setForm({ ...form, close_time: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, has_break: !form.has_break })}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all",
                    form.has_break ? "border-primary/40 bg-primary/5" : "border-border bg-background",
                  )}
                >
                  <p className="text-sm font-medium">Pausa para comer</p>
                  <Switch checked={form.has_break} onCheckedChange={(v) => setForm({ ...form, has_break: v })} />
                </button>

                {form.has_break && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Inicio pausa</Label>
                      <Input
                        type="time"
                        value={form.break_start}
                        onChange={(e) => setForm({ ...form, break_start: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Fin pausa</Label>
                      <Input
                        type="time"
                        value={form.break_end}
                        onChange={(e) => setForm({ ...form, break_end: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Live preview */}
            <div className="rounded-xl border bg-background p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vista previa</p>
                <Badge variant="secondary" className="text-[10px]">
                  {dayCount} día{dayCount !== 1 ? "s" : ""}
                </Badge>
              </div>
              <HoursBar
                isClosed={form.is_closed}
                openTime={form.open_time}
                closeTime={form.close_time}
                breakStart={form.has_break ? form.break_start : null}
                breakEnd={form.has_break ? form.break_end : null}
              />
              <p className="text-xs text-muted-foreground">
                {form.is_closed
                  ? "Cerrado todo el día"
                  : `${form.open_time} – ${form.close_time}${
                      form.has_break ? ` · pausa ${form.break_start}–${form.break_end}` : ""
                    }`}
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Aplicar horario especial
            </Button>
          </div>
        )}

        {/* Past collapsed */}
        {past.length > 0 && (
          <details className="rounded-xl border bg-muted/30 p-3 text-sm">
            <summary className="cursor-pointer font-medium text-muted-foreground">
              Pasados ({past.length})
            </summary>
            <div className="mt-3 space-y-2">{past.map((it) => renderItem(it, "past"))}</div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
