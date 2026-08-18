import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, Save, Sun, Moon, Copy } from "lucide-react";

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

interface BusinessHoursManagerProps {
  tenantId: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes"}, { value: 2, label:"Martes"}, { value: 3, label:"Miércoles"}, { value: 4, label:"Jueves"}, { value: 5, label:"Viernes"}, { value: 6, label:"Sábado"}, { value: 0, label:"Domingo"}
]; const DEFAULT_HOURS: BusinessHour[] = DAYS_OF_WEEK.map(day => ({ day_of_week: day.value, is_open: day.value >= 1 && day.value <= 5, morning_start:"09:00",
  morning_end: "14:00",
  afternoon_start: "16:00",
  afternoon_end: "20:00",
  has_afternoon: day.value >= 1 && day.value <= 5
}));

// Convert from DB format (open_time, close_time, break_start, break_end) to UI format
function fromDbFormat(record: any): BusinessHour {
  const hasBreak = record.break_start && record.break_end;
  
  return {
    id: record.id,
    day_of_week: record.day_of_week,
    is_open: record.is_open ?? false,
    morning_start: record.open_time || "09:00",
    morning_end: hasBreak ? record.break_start : record.close_time || "14:00",
    afternoon_start: hasBreak ? record.break_end : "16:00",
    afternoon_end: hasBreak ? record.close_time : "20:00",
    has_afternoon: hasBreak
  };
}

// Convert from UI format to DB format
function toDbFormat(hour: BusinessHour, tenantId: string) {
  if (!hour.is_open) {
    return {
      tenant_id: tenantId,
      day_of_week: hour.day_of_week,
      is_open: false,
      open_time: null,
      close_time: null,
      break_start: null,
      break_end: null
    };
  }

  if (hour.has_afternoon) {
    // Morning + Afternoon with break
    return {
      tenant_id: tenantId,
      day_of_week: hour.day_of_week,
      is_open: true,
      open_time: hour.morning_start,
      close_time: hour.afternoon_end,
      break_start: hour.morning_end,
      break_end: hour.afternoon_start
    };
  } else {
    // Only morning, no break
    return {
      tenant_id: tenantId,
      day_of_week: hour.day_of_week,
      is_open: true,
      open_time: hour.morning_start,
      close_time: hour.morning_end,
      break_start: null,
      break_end: null
    };
  }
}

export function BusinessHoursManager({ tenantId }: BusinessHoursManagerProps) {
  const [hours, setHours] = useState<BusinessHour[]>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBusinessHours();
  }, [tenantId]);

  const fetchBusinessHours = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tenant_business_hours")
      .select("*")
      .eq("tenant_id", tenantId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los horarios",
        variant: "destructive"}); } else if (data && data.length > 0) { const mergedHours = DAYS_OF_WEEK.map(day => { const existing = data.find(h => h.day_of_week === day.value); if (existing) { return fromDbFormat(existing); } return DEFAULT_HOURS.find(h => h.day_of_week === day.value)!; }); setHours(mergedHours); } setLoading(false); }; const updateHour = (dayOfWeek: number, field: keyof BusinessHour, value: any) => { setHours(prev => prev.map(h => h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h )); }; const validateHours = (): boolean => { for (const hour of hours) { if (!hour.is_open) continue; const morningStart = timeToMinutes(hour.morning_start); const morningEnd = timeToMinutes(hour.morning_end); if (morningStart >= morningEnd) { toast({ title:"Error de validación",
          description: `${DAYS_OF_WEEK.find(d => d.value === hour.day_of_week)?.label}: La hora de fin de mañana debe ser posterior a la de inicio`,
          variant: "destructive"}); return false; } if (hour.has_afternoon) { const afternoonStart = timeToMinutes(hour.afternoon_start); const afternoonEnd = timeToMinutes(hour.afternoon_end); if (morningEnd >= afternoonStart) { toast({ title:"Error de validación",
            description: `${DAYS_OF_WEEK.find(d => d.value === hour.day_of_week)?.label}: El turno de tarde debe comenzar después del turno de mañana`,
            variant: "destructive"}); return false; } if (afternoonStart >= afternoonEnd) { toast({ title:"Error de validación",
            description: `${DAYS_OF_WEEK.find(d => d.value === hour.day_of_week)?.label}: La hora de fin de tarde debe ser posterior a la de inicio`,
            variant: "destructive"
          });
          return false;
        }
      }
    }
    return true;
  };

  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const handleSave = async () => {
    if (!validateHours()) return;

    setSaving(true);

    // First delete existing hours for this tenant
    await supabase
      .from("tenant_business_hours")
      .delete()
      .eq("tenant_id", tenantId);

    // Then insert the new hours
    const { error } = await supabase
      .from("tenant_business_hours")
      .insert(hours.map(h => toDbFormat(h, tenantId)));

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los horarios",
        variant: "destructive"}); } else { toast({ title:"Éxito", description: "Horarios guardados correctamente"}); fetchBusinessHours(); } setSaving(false); }; const copyToAllDays = (sourceDay: number) => { const source = hours.find(h => h.day_of_week === sourceDay); if (!source) return; setHours(prev => prev.map(h => ({ ...h, is_open: source.is_open, morning_start: source.morning_start, morning_end: source.morning_end, afternoon_start: source.afternoon_start, afternoon_end: source.afternoon_end, has_afternoon: source.has_afternoon }))); toast({ title:"Copiado", description: "Horario aplicado a todos los días" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horario de Apertura
            </CardTitle>
            <CardDescription>
              Configura los turnos de mañana y tarde de tu salón
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto h-11 md:h-10">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar Cambios
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {DAYS_OF_WEEK.map((day, index) => {
            const hour = hours.find(h => h.day_of_week === day.value)!;
            return (
              <div
                key={day.value}
                className="rounded-lg border p-4 space-y-4"
              >
                {/* Day header with switch */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={hour.is_open}
                      onCheckedChange={(checked) => updateHour(day.value, "is_open", checked)}
                    />
                    <span className={`font-semibold text-lg ${!hour.is_open ? "text-muted-foreground":""}`}>
                      {day.label}
                    </span>
                    {!hour.is_open && (
                      <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">Cerrado</span>
                    )}
                  </div>
                  {index === 0 && hour.is_open && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToAllDays(day.value)}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar a todos
                    </Button>
                  )}
                </div>

                {hour.is_open && (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    {/* Morning section */}
                    <div className="rounded-lg bg-[var(--gp-warn-soft)]  p-4 space-y-3">
                      <div className="flex items-center gap-2 text-[var(--gp-warn-ink)] ">
                        <Sun className="h-4 w-4" />
                        <Label className="font-medium">Turno de Mañana</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">Desde</Label>
                          <Input
                            type="time"value={hour.morning_start} onChange={(e) => updateHour(day.value,"morning_start", e.target.value)}
                            className="mt-1 h-11 md:h-10"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">Hasta</Label>
                          <Input
                            type="time"value={hour.morning_end} onChange={(e) => updateHour(day.value,"morning_end", e.target.value)}
                            className="mt-1 h-11 md:h-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Afternoon section */}
                    <div className={`rounded-lg p-4 space-y-3 ${hour.has_afternoon ? 'bg-[var(--gp-info-soft)] ' : 'bg-muted/50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[var(--gp-info-ink)] ">
                          <Moon className="h-4 w-4" />
                          <Label className="font-medium">Turno de Tarde</Label>
                        </div>
                        <Switch
                          checked={hour.has_afternoon}
                          onCheckedChange={(checked) => updateHour(day.value, "has_afternoon", checked)}
                        />
                      </div>
                      {hour.has_afternoon ? (
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">Desde</Label>
                            <Input
                              type="time"value={hour.afternoon_start} onChange={(e) => updateHour(day.value,"afternoon_start", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">Hasta</Label>
                            <Input
                              type="time"value={hour.afternoon_end} onChange={(e) => updateHour(day.value,"afternoon_end", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Sin turno de tarde
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
