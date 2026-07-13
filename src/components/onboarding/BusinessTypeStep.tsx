import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StepProps } from "./types";
import { BUSINESS_TYPES, BUSINESS_TYPES_BY_ID, type BusinessTypeId } from "@/constants/businessTypes";

interface BusinessTypeStepProps extends StepProps {
  tenantName: string;
  setTenantName: (name: string) => void;
}

export function BusinessTypeStep({ tenantId, onNext, tenantName, setTenantName }: BusinessTypeStepProps) {
  const [selectedType, setSelectedType] = useState<BusinessTypeId | "">("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedType || !tenantName.trim()) {
      toast.error("Añade el nombre y elige un tipo de negocio");
      return;
    }

    setSaving(true);
    try {
      const businessTypeLabel = BUSINESS_TYPES_BY_ID[selectedType]?.label ?? selectedType;

      const { error } = await supabase
        .from("tenants")
        .update({
          name: tenantName.trim(),
          features: {
            reviews: true,
            whatsapp: true,
            cash_register: true,
            google_calendar: true,
            business_type: selectedType,
            business_type_label: businessTypeLabel,
          },
        })
        .eq("id", tenantId);

      if (error) throw error;

      toast.success("Listo, vamos al siguiente paso");
      onNext();
    } catch (error) {
      console.error("Error saving business type:", error);
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">¿Qué tipo de negocio tienes?</h2>
        <p className="text-sm text-muted-foreground">Personalizamos tu web y tu catálogo según tu tipo de negocio.</p>
      </div>

      {/* Nombre del negocio */}
      <div className="space-y-2">
        <Label htmlFor="businessName" className="text-sm font-medium">
          Nombre de tu negocio
        </Label>
        <Input
          id="businessName"
          value={tenantName}
          onChange={(e) => setTenantName(e.target.value)}
          placeholder="Ej: Salón María, Barbería El Clásico…"
          className="h-12 rounded-xl text-base"
        />
        <p className="text-[11px] text-muted-foreground">Aparecerá en tu página web.</p>
      </div>

      {/* Tipo de negocio */}
      <div className="space-y-2.5">
        <Label className="text-sm font-medium">Tipo de negocio</Label>
        <div className="grid grid-cols-2 gap-2.5">
          {BUSINESS_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;

            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedType(type.id)}
                aria-pressed={isSelected}
                className={`group relative flex flex-col rounded-2xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/[0.04] shadow-sm ring-1 ring-primary/20"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                {isSelected && (
                  <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                  </span>
                )}
                <span
                  className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                    isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:text-primary"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold leading-tight text-foreground">{type.label}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{type.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving || !selectedType || !tenantName.trim()}
        className="h-12 w-full rounded-xl"
        size="lg"
        data-guided-cta="true"
      >
        {saving ? "Guardando…" : "Continuar"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
