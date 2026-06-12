import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, Coffee, X, CopyCheck } from "lucide-react";
import { SeasonalHoursManager } from "./SeasonalHoursManager";
import { Separator } from "@/components/ui/separator";

/**
 * Editor del horario PROPIO del profesional. La decisión "horario del salón
 * vs propio" vive en la ficha (StylistDrawer); aquí siempre se edita el
 * propio. Si aún no existe, llega sembrado con el horario del salón como
 * punto de partida y se crea al guardar.
 */

interface StylistSchedule {
  day_of_week: number;
  is_working: boolean;
  start_time: string | null;
  end_time: string | null;
  break_start: string | null;
  break_end: string | null;
}

interface StylistScheduleEditorProps {
  open: boolean;
  onClose: () => void;
  stylistId: string;
  stylistName: string;
  tenantId: string;
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

export function StylistScheduleEditor({ open, onClose, stylistId, stylistName, tenantId }: StylistScheduleEditorProps) {
  const [schedules, setSchedules] = useState<StylistSchedule[]>([]);
  const [initialJson, setInitialJson] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const dirty = useMemo(() => JSON.stringify(schedules) !== initialJson, [schedules, initialJson]);

  useEffect(() => {
    if (open && stylistId) {
      fetchSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stylistId]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data: stylistHours, error } = await supabase
        .from("stylist_business_hours")
        .select("*")
        .eq("stylist_id", stylistId);

      if (error) throw error;

      let mapped: StylistSchedule[];
      if (stylistHours && stylistHours.length > 0) {
        mapped = DAYS.map((day) => {
          const existing = stylistHours.find((h) => h.day_of_week === day.value);
          return {
            day_of_week: day.value,
            is_working: existing?.is_working ?? true,
            start_time: existing?.start_time?.substring(0, 5) || "09:00",
            end_time: existing?.end_time?.substring(0, 5) || "19:00",
            break_start: existing?.break_start?.substring(0, 5) || null,
            break_end: existing?.break_end?.substring(0, 5) || null,
          };
        });
      } else {
        // Sin horario propio todavía: sembrar con el del salón como base
        const { data: tenantHours } = await supabase
          .from("tenant_business_hours")
          .select("*")
          .eq("tenant_id", tenantId);

        mapped = DAYS.map((day) => {
          const existing = tenantHours?.find((h) => h.day_of_week === day.value);
          return {
            day_of_week: day.value,
            is_working: existing?.is_open ?? (day.value >= 1 && day.value <= 5),
            start_time: existing?.open_time?.substring(0, 5) || "09:00",
            end_time: existing?.close_time?.substring(0, 5) || "19:00",
            break_start: existing?.break_start?.substring(0, 5) || null,
            break_end: existing?.break_end?.substring(0, 5) || null,
          };
        });
      }
      setSchedules(mapped);
      // Sin horario propio aún: guardar debe estar activo desde el principio
      // (abrir este editor ya expresa la intención de crearlo).
      setInitialJson(stylistHours && stylistHours.length > 0 ? JSON.stringify(mapped) : "");
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los horarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = (dayOfWeek: number, updates: Partial<StylistSchedule>) => {
    setSchedules((prev) => prev.map((s) => (s.day_of_week === dayOfWeek ? { ...s, ...updates } : s)));
  };

  /** Copia las horas de un día al resto de días laborables. */
  const applyToAll = (dayOfWeek: number) => {
    const source = schedules.find((s) => s.day_of_week === dayOfWeek);
    if (!source) return;
    setSchedules((prev) =>
      prev.map((s) =>
        s.is_working
          ? {
              ...s,
              start_time: source.start_time,
              end_time: source.end_time,
              break_start: source.break_start,
              break_end: source.break_end,
            }
          : s,
      ),
    );
    toast({ title: "Horas copiadas al resto de días" });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const upsertData = schedules.map((s) => ({
        stylist_id: stylistId,
        tenant_id: tenantId,
        day_of_week: s.day_of_week,
        is_working: s.is_working,
        start_time: s.start_time,
        end_time: s.end_time,
        break_start: s.break_start || null,
        break_end: s.break_end || null,
      }));

      const { error } = await supabase
        .from("stylist_business_hours")
        .upsert(upsertData, { onConflict: "stylist_id,day_of_week" });

      if (error) throw error;

      toast({ title: "Horario guardado", description: `${stylistName} ya tiene horario propio.` });
      onClose();
    } catch (error) {
      console.error("Error saving schedules:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron guardar los horarios",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horario de {stylistName}
          </DialogTitle>
          <DialogDescription>
            Horario propio: las reservas online solo ofrecerán huecos dentro de estas horas.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2.5 py-2">
            {DAYS.map((day) => {
              const schedule = schedules.find((s) => s.day_of_week === day.value);
              if (!schedule) return null;
              const hasBreak = schedule.break_start != null || schedule.break_end != null;

              return (
                <div
                  key={day.value}
                  className={`rounded-lg border p-3.5 transition-colors ${
                    schedule.is_working ? "bg-card" : "bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Label className={`font-semibold ${schedule.is_working ? "" : "text-muted-foreground"}`}>
                      {day.label}
                    </Label>
                    <div className="flex items-center gap-2">
                      {!schedule.is_working && (
                        <span className="text-xs text-muted-foreground">Descansa</span>
                      )}
                      <Switch
                        checked={schedule.is_working}
                        onCheckedChange={(checked) => updateSchedule(day.value, { is_working: checked })}
                        aria-label={`Trabaja el ${day.label}`}
                      />
                    </div>
                  </div>

                  {schedule.is_working && (
                    <div className="mt-3 flex flex-wrap items-end gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Entrada</Label>
                        <Input
                          type="time"
                          value={schedule.start_time || ""}
                          onChange={(e) => updateSchedule(day.value, { start_time: e.target.value })}
                          className="h-9 w-[110px]"
                        />
                      </div>
                      <span className="pb-2 text-muted-foreground">–</span>
                      <div>
                        <Label className="text-xs text-muted-foreground">Salida</Label>
                        <Input
                          type="time"
                          value={schedule.end_time || ""}
                          onChange={(e) => updateSchedule(day.value, { end_time: e.target.value })}
                          className="h-9 w-[110px]"
                        />
                      </div>

                      {hasBreak ? (
                        <>
                          <div>
                            <Label className="text-xs text-muted-foreground">Descanso</Label>
                            <Input
                              type="time"
                              value={schedule.break_start || ""}
                              onChange={(e) => updateSchedule(day.value, { break_start: e.target.value || null })}
                              className="h-9 w-[110px]"
                            />
                          </div>
                          <span className="pb-2 text-muted-foreground">–</span>
                          <div>
                            <Label className="text-xs text-muted-foreground">&nbsp;</Label>
                            <Input
                              type="time"
                              value={schedule.break_end || ""}
                              onChange={(e) => updateSchedule(day.value, { break_end: e.target.value || null })}
                              className="h-9 w-[110px]"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground"
                            onClick={() => updateSchedule(day.value, { break_start: null, break_end: null })}
                            title="Quitar descanso"
                            aria-label="Quitar descanso"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 gap-1.5 text-muted-foreground"
                          onClick={() =>
                            updateSchedule(day.value, { break_start: "14:00", break_end: "15:00" })
                          }
                        >
                          <Coffee className="h-3.5 w-3.5" />
                          Descanso
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-9 gap-1.5 text-muted-foreground"
                        onClick={() => applyToAll(day.value)}
                        title="Copiar estas horas a todos los días laborables"
                      >
                        <CopyCheck className="h-3.5 w-3.5" />
                        Aplicar a todos
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}

            <Separator className="!my-5" />

            <SeasonalHoursManager tenantId={tenantId} stylistId={stylistId} stylistName={stylistName} compact />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading || !dirty}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {dirty ? "Guardar horario" : "Sin cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
