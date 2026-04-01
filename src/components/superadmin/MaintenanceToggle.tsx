import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wrench, AlertTriangle, Loader2 } from "lucide-react";

export const MaintenanceToggle = () => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "maintenance_mode")
        .maybeSingle();

      if (!error && data) {
        setEnabled(data.value === "true");
      }
    } catch (e) {
      console.error("Error fetching maintenance status:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenance = async (newValue: boolean) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("app_config")
        .upsert(
          { key: "maintenance_mode", value: newValue ? "true" : "false" },
          { onConflict: "key" }
        );

      if (error) throw error;

      setEnabled(newValue);
      toast({
        title: newValue ? "🔧 Modo mantenimiento activado" : "✅ App activa",
        description: newValue
          ? "Los usuarios verán la pantalla de mantenimiento"
          : "La app vuelve a estar disponible para todos",
      });
    } catch (e) {
      console.error("Error toggling maintenance:", e);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-card/40 backdrop-blur-xl border-white/[0.08] ${enabled ? "border-amber-500/30" : ""}`}>
      <CardHeader className="pb-2 p-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wrench className="h-4 w-4" />
          Modo Mantenimiento
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">
              {enabled
                ? "App en mantenimiento"
                : "App funcionando con normalidad"}
            </p>
            {enabled && (
              <div className="flex items-center gap-2 mt-1.5">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <Badge variant="outline" className="text-warning border-warning/30 text-[10px]">
                  En mantenimiento
                </Badge>
              </div>
            )}
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={toggleMaintenance}
            disabled={saving}
          />
        </div>
      </CardContent>
    </Card>
  );
};
