import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CalendarRange, Plus, Trash2, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

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

const emptyForm = {
  label: "",
  date_from: "",
  date_to: "",
  is_closed: false,
  open_time: "08:00",
  close_time: "15:00",
  has_break: false,
  break_start: "13:00",
  break_end: "14:00",
};

export function SeasonalHoursManager({ tenantId }: Props) {
  const [items, setItems] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("tenant_hours_overrides")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("date_from", { ascending: true });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setItems((data as Override[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (tenantId) load();
  }, [tenantId]);

  const handleSave = async () => {
    if (!form.date_from || !form.date_to) {
      toast({ title: "Faltan fechas", description: "Indica desde y hasta", variant: "destructive" });
      return;
    }
    if (form.date_to < form.date_from) {
      toast({ title: "Rango inválido", description: "La fecha 'Hasta' debe ser posterior", variant: "destructive" });
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
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Horario especial creado" });
    setForm(emptyForm);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any).from("tenant_hours_overrides").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Horario especial eliminado" });
    load();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-primary" />
          <CardTitle>Horarios especiales por temporada</CardTitle>
        </div>
        <CardDescription>
          Define un horario distinto para un rango de fechas (ej. "todo agosto de 8:00 a 15:00"). Tiene
          prioridad sobre el horario semanal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lista */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aún no hay horarios especiales configurados.
            </p>
          ) : (
            items.map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-background"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {it.label && <span className="font-medium truncate">{it.label}</span>}
                    {it.is_closed ? (
                      <Badge variant="destructive">Cerrado</Badge>
                    ) : (
                      <Badge variant="secondary">
                        {it.open_time?.slice(0, 5)}–{it.close_time?.slice(0, 5)}
                        {it.break_start && ` (pausa ${it.break_start.slice(0, 5)}–${it.break_end?.slice(0, 5)})`}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(parseISO(it.date_from), "d MMM yyyy", { locale: es })} →{" "}
                    {format(parseISO(it.date_to), "d MMM yyyy", { locale: es })}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(it.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Formulario */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="font-medium">Nuevo horario especial</p>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Nombre (opcional)</Label>
            <Input
              placeholder="Ej. Horario de verano"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Desde</Label>
              <Input
                type="date"
                value={form.date_from}
                onChange={(e) => setForm({ ...form, date_from: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Hasta</Label>
              <Input
                type="date"
                value={form.date_to}
                onChange={(e) => setForm({ ...form, date_to: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-background p-3">
            <div>
              <p className="text-sm font-medium">Cerrado en este periodo</p>
              <p className="text-xs text-muted-foreground">No se podrán reservar citas</p>
            </div>
            <Switch
              checked={form.is_closed}
              onCheckedChange={(v) => setForm({ ...form, is_closed: v })}
            />
          </div>

          {!form.is_closed && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Apertura</Label>
                  <Input
                    type="time"
                    value={form.open_time}
                    onChange={(e) => setForm({ ...form, open_time: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Cierre</Label>
                  <Input
                    type="time"
                    value={form.close_time}
                    onChange={(e) => setForm({ ...form, close_time: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-background p-3">
                <p className="text-sm font-medium">Pausa para comer</p>
                <Switch
                  checked={form.has_break}
                  onCheckedChange={(v) => setForm({ ...form, has_break: v })}
                />
              </div>

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

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Crear horario especial
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
