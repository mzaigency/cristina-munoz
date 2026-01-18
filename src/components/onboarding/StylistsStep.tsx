import { useState } from "react";
import { Users, ArrowLeft, ArrowRight, Loader2, Plus, X, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StepProps, StylistForm, stylistColors } from "./types";
import { cn } from "@/lib/utils";

export function StylistsStep({ 
  onNext, 
  onPrev, 
  tenantId, 
  loading, 
  setLoading,
  maxStylists = 1,
  planSlug = "starter"
}: StepProps) {
  const [stylists, setStylists] = useState<StylistForm[]>([
    { name: "", color: stylistColors[0] },
  ]);
  const { toast } = useToast();

  const validStylistsCount = stylists.filter(s => s.name.trim()).length;
  const canAddMore = stylists.length < maxStylists;

  const addStylist = () => {
    if (!canAddMore) {
      toast({
        title: "Límite alcanzado",
        description: `Tu plan permite máximo ${maxStylists} profesional(es). Puedes actualizar tu plan más adelante.`,
        variant: "destructive",
      });
      return;
    }
    const nextColor = stylistColors[stylists.length % stylistColors.length];
    setStylists([...stylists, { name: "", color: nextColor }]);
  };

  const removeStylist = (index: number) => {
    if (stylists.length > 1) {
      setStylists(stylists.filter((_, i) => i !== index));
    }
  };

  const updateStylist = (index: number, field: keyof StylistForm, value: string) => {
    const newStylists = [...stylists];
    newStylists[index] = { ...newStylists[index], [field]: value };
    setStylists(newStylists);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSave = async () => {
    const validStylists = stylists.filter((s) => s.name.trim());

    if (validStylists.length === 0) {
      onNext();
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("tenant_stylists").insert(
        validStylists.map((s) => ({
          tenant_id: tenantId,
          name: s.name.trim(),
          slug: generateSlug(s.name),
          color: s.color,
          is_active: true,
        }))
      );

      if (error) throw error;
      onNext();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Tu equipo
        </h3>
        <p className="text-sm text-muted-foreground">
          Añade a los estilistas que trabajarán en el salón. Cada uno tendrá su propio calendario.
        </p>
      </div>

      <div className="space-y-3">
        {stylists.map((stylist, index) => (
          <div key={index} className="ios-card p-4">
            <div className="flex items-start gap-3">
              {/* Color picker */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-10 h-10 rounded-full border-2 border-white shadow-md cursor-pointer"
                  style={{ backgroundColor: stylist.color }}
                  onClick={() => {
                    const currentIndex = stylistColors.indexOf(stylist.color);
                    const nextIndex = (currentIndex + 1) % stylistColors.length;
                    updateStylist(index, "color", stylistColors[nextIndex]);
                  }}
                />
                <span className="text-[10px] text-muted-foreground">Color</span>
              </div>

              {/* Name input */}
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">
                  Estilista {index + 1}
                </Label>
                <Input
                  placeholder="Nombre del estilista"
                  value={stylist.name}
                  onChange={(e) => updateStylist(index, "name", e.target.value)}
                  className="h-11 rounded-xl mt-1"
                />
              </div>

              {/* Remove button */}
              {stylists.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStylist(index)}
                  className="text-muted-foreground hover:text-destructive h-10 w-10 mt-5"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          onClick={addStylist}
          disabled={!canAddMore}
          className={cn(
            "w-full h-11 rounded-xl border-dashed",
            !canAddMore && "opacity-60"
          )}
        >
          {canAddMore ? (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Añadir otro estilista
            </>
          ) : (
            <>
              <Crown className="h-4 w-4 mr-2 text-amber-500" />
              Límite de tu plan ({maxStylists})
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {validStylistsCount} / {maxStylists} profesionales • 💡 El color ayuda a diferenciar las citas
      </p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrev} className="flex-1 h-12 rounded-xl">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Atrás
        </Button>
        <Button onClick={handleSave} className="flex-1 h-12 rounded-xl" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
