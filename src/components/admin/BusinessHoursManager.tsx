import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, Save } from "lucide-react";

interface BusinessHour {
  id?: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
  break_start: string | null;
  break_end: string | null;
}

interface BusinessHoursManagerProps {
  tenantId: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" }
];

const DEFAULT_HOURS: BusinessHour[] = DAYS_OF_WEEK.map(day => ({
  day_of_week: day.value,
  is_open: day.value >= 1 && day.value <= 5,
  open_time: "09:00",
  close_time: "20:00",
  break_start: null,
  break_end: null
}));

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
        variant: "destructive"
      });
    } else if (data && data.length > 0) {
      const mergedHours = DAYS_OF_WEEK.map(day => {
        const existing = data.find(h => h.day_of_week === day.value);
        if (existing) {
          return {
            id: existing.id,
            day_of_week: existing.day_of_week,
            is_open: existing.is_open ?? false,
            open_time: existing.open_time,
            close_time: existing.close_time,
            break_start: existing.break_start,
            break_end: existing.break_end
          };
        }
        return DEFAULT_HOURS.find(h => h.day_of_week === day.value)!;
      });
      setHours(mergedHours);
    }
    setLoading(false);
  };

  const updateHour = (dayOfWeek: number, field: keyof BusinessHour, value: any) => {
    setHours(prev => prev.map(h => 
      h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h
    ));
  };

  const handleSave = async () => {
    setSaving(true);

    // First delete existing hours for this tenant
    await supabase
      .from("tenant_business_hours")
      .delete()
      .eq("tenant_id", tenantId);

    // Then insert the new hours
    const { error } = await supabase
      .from("tenant_business_hours")
      .insert(
        hours.map(h => ({
          tenant_id: tenantId,
          day_of_week: h.day_of_week,
          is_open: h.is_open,
          open_time: h.is_open ? h.open_time : null,
          close_time: h.is_open ? h.close_time : null,
          break_start: h.is_open ? h.break_start : null,
          break_end: h.is_open ? h.break_end : null
        }))
      );

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los horarios",
        variant: "destructive"
      });
    } else {
      toast({ title: "Éxito", description: "Horarios guardados correctamente" });
      fetchBusinessHours();
    }

    setSaving(false);
  };

  const copyToAllDays = (sourceDay: number) => {
    const source = hours.find(h => h.day_of_week === sourceDay);
    if (!source) return;

    setHours(prev => prev.map(h => ({
      ...h,
      is_open: source.is_open,
      open_time: source.open_time,
      close_time: source.close_time,
      break_start: source.break_start,
      break_end: source.break_end
    })));

    toast({ title: "Copiado", description: "Horario aplicado a todos los días" });
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horario de Apertura
            </CardTitle>
            <CardDescription>
              Configura el horario de apertura de tu salón
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={saving}>
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
                className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center"
              >
                <div className="flex items-center gap-4 md:w-40">
                  <Switch
                    checked={hour.is_open}
                    onCheckedChange={(checked) => updateHour(day.value, "is_open", checked)}
                  />
                  <span className={`font-medium ${!hour.is_open ? "text-muted-foreground" : ""}`}>
                    {day.label}
                  </span>
                </div>

                {hour.is_open && (
                  <div className="flex flex-1 flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground whitespace-nowrap">Apertura:</Label>
                      <Input
                        type="time"
                        value={hour.open_time || "09:00"}
                        onChange={(e) => updateHour(day.value, "open_time", e.target.value)}
                        className="w-28"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground whitespace-nowrap">Cierre:</Label>
                      <Input
                        type="time"
                        value={hour.close_time || "20:00"}
                        onChange={(e) => updateHour(day.value, "close_time", e.target.value)}
                        className="w-28"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground whitespace-nowrap">Descanso:</Label>
                      <Input
                        type="time"
                        value={hour.break_start || ""}
                        onChange={(e) => updateHour(day.value, "break_start", e.target.value || null)}
                        className="w-28"
                        placeholder="--:--"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="time"
                        value={hour.break_end || ""}
                        onChange={(e) => updateHour(day.value, "break_end", e.target.value || null)}
                        className="w-28"
                        placeholder="--:--"
                      />
                    </div>
                    {index === 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToAllDays(day.value)}
                      >
                        Copiar a todos
                      </Button>
                    )}
                  </div>
                )}

                {!hour.is_open && (
                  <span className="text-sm text-muted-foreground">Cerrado</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
