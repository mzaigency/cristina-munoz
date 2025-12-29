import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [useBusinessHours, setUseBusinessHours] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open && stylistId) {
      fetchSchedules();
    }
  }, [open, stylistId]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      // First fetch stylist-specific hours
      const { data: stylistHours, error } = await supabase
        .from("stylist_business_hours")
        .select("*")
        .eq("stylist_id", stylistId);

      if (error) throw error;

      if (stylistHours && stylistHours.length > 0) {
        setUseBusinessHours(false);
        // Map to our format
        const mapped = DAYS.map(day => {
          const existing = stylistHours.find(h => h.day_of_week === day.value);
          return {
            day_of_week: day.value,
            is_working: existing?.is_working ?? true,
            start_time: existing?.start_time || "09:00",
            end_time: existing?.end_time || "19:00",
            break_start: existing?.break_start || null,
            break_end: existing?.break_end || null,
          };
        });
        setSchedules(mapped);
      } else {
        // Fetch tenant business hours as default
        setUseBusinessHours(true);
        const { data: tenantHours } = await supabase
          .from("tenant_business_hours")
          .select("*")
          .eq("tenant_id", tenantId);

        const mapped = DAYS.map(day => {
          const existing = tenantHours?.find(h => h.day_of_week === day.value);
          return {
            day_of_week: day.value,
            is_working: existing?.is_open ?? (day.value >= 2 && day.value <= 6),
            start_time: existing?.open_time?.substring(0, 5) || "09:00",
            end_time: existing?.close_time?.substring(0, 5) || "19:00",
            break_start: existing?.break_start?.substring(0, 5) || null,
            break_end: existing?.break_end?.substring(0, 5) || null,
          };
        });
        setSchedules(mapped);
      }
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

  const handleToggleUseBusinessHours = async (useDefault: boolean) => {
    if (useDefault) {
      // Delete stylist-specific hours
      const { error } = await supabase
        .from("stylist_business_hours")
        .delete()
        .eq("stylist_id", stylistId);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo restaurar el horario",
          variant: "destructive",
        });
        return;
      }

      setUseBusinessHours(true);
      toast({ title: "Horario restaurado", description: "Se usa el horario general del negocio" });
      fetchSchedules();
    } else {
      setUseBusinessHours(false);
    }
  };

  const updateSchedule = (dayOfWeek: number, updates: Partial<StylistSchedule>) => {
    setSchedules(prev => prev.map(s => 
      s.day_of_week === dayOfWeek ? { ...s, ...updates } : s
    ));
  };

  const handleSave = async () => {
    if (useBusinessHours) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      // Upsert all schedules
      const upsertData = schedules.map(s => ({
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

      toast({ title: "Horario guardado", description: "Los horarios se han actualizado correctamente" });
      onClose();
    } catch (error: any) {
      console.error("Error saving schedules:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron guardar los horarios",
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
            Horarios de {stylistName}
          </DialogTitle>
          <DialogDescription>
            Configura los horarios de trabajo específicos para este estilista
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Usar horario general del negocio</p>
                <p className="text-sm text-muted-foreground">
                  {useBusinessHours 
                    ? "Este estilista sigue el horario general" 
                    : "Este estilista tiene horario personalizado"}
                </p>
              </div>
              <Switch 
                checked={useBusinessHours}
                onCheckedChange={handleToggleUseBusinessHours}
              />
            </div>

            <div className="space-y-3">
              {DAYS.map(day => {
                const schedule = schedules.find(s => s.day_of_week === day.value);
                if (!schedule) return null;

                return (
                  <div 
                    key={day.value} 
                    className={`p-4 rounded-lg border ${schedule.is_working ? 'bg-card' : 'bg-muted/50'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Label className="font-medium">{day.label}</Label>
                      <Switch
                        checked={schedule.is_working}
                        onCheckedChange={(checked) => updateSchedule(day.value, { is_working: checked })}
                        disabled={useBusinessHours}
                      />
                    </div>

                    {schedule.is_working && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Entrada</Label>
                          <Input
                            type="time"
                            value={schedule.start_time || ""}
                            onChange={(e) => updateSchedule(day.value, { start_time: e.target.value })}
                            disabled={useBusinessHours}
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Salida</Label>
                          <Input
                            type="time"
                            value={schedule.end_time || ""}
                            onChange={(e) => updateSchedule(day.value, { end_time: e.target.value })}
                            disabled={useBusinessHours}
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Inicio descanso</Label>
                          <Input
                            type="time"
                            value={schedule.break_start || ""}
                            onChange={(e) => updateSchedule(day.value, { break_start: e.target.value || null })}
                            disabled={useBusinessHours}
                            className="h-9"
                            placeholder="--:--"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Fin descanso</Label>
                          <Input
                            type="time"
                            value={schedule.break_end || ""}
                            onChange={(e) => updateSchedule(day.value, { break_end: e.target.value || null })}
                            disabled={useBusinessHours}
                            className="h-9"
                            placeholder="--:--"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar Horarios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
