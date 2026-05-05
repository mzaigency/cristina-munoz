import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StepProps } from "./types";

const businessTypes = [
  {
    id: "peluqueria",
    label: "Peluquería",
    emoji: "✂️",
    description: "Cortes, peinados y color",
    color: "from-violet-500/20 to-purple-500/20",
    borderActive: "border-violet-500",
  },
  {
    id: "barberia",
    label: "Barbería",
    emoji: "💈",
    description: "Cortes, afeitado y barba",
    color: "from-amber-500/20 to-orange-500/20",
    borderActive: "border-amber-500",
  },
  {
    id: "salon_belleza",
    label: "Salón de Belleza",
    emoji: "💅",
    description: "Servicios integrales de belleza",
    color: "from-pink-500/20 to-rose-500/20",
    borderActive: "border-pink-500",
  },
  {
    id: "estetica",
    label: "Centro Estética",
    emoji: "🧖‍♀️",
    description: "Faciales y tratamientos corporales",
    color: "from-teal-500/20 to-cyan-500/20",
    borderActive: "border-teal-500",
  },
  {
    id: "spa",
    label: "Spa & Wellness",
    emoji: "🧘",
    description: "Masajes y bienestar",
    color: "from-green-500/20 to-emerald-500/20",
    borderActive: "border-green-500",
  },
  {
    id: "unas",
    label: "Salón de Uñas",
    emoji: "💎",
    description: "Manicura, pedicura y nail art",
    color: "from-fuchsia-500/20 to-purple-500/20",
    borderActive: "border-fuchsia-500",
  },
  {
    id: "fisioterapia",
    label: "Fisioterapia",
    emoji: "🌟",
    description: "Combina varios servicios",
    color: "from-indigo-500/20 to-violet-500/20",
    borderActive: "border-indigo-500",
  },
  {
    id: "otro",
    label: "Otro",
    emoji: "🏠",
    description: "Especifica tu negocio",
    color: "from-gray-500/20 to-slate-500/20",
    borderActive: "border-gray-500",
  },
];

interface BusinessTypeStepProps extends StepProps {
  tenantName: string;
  setTenantName: (name: string) => void;
}

export function BusinessTypeStep({ tenantId, onNext, tenantName, setTenantName }: BusinessTypeStepProps) {
  const [selectedType, setSelectedType] = useState<string>("");
  const [customType, setCustomType] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedType || !tenantName.trim()) {
      toast.error("Por favor, completa todos los campos");
      return;
    }

    if (selectedType === "otro" && !customType.trim()) {
      toast.error("Por favor, especifica tu tipo de negocio");
      return;
    }

    setSaving(true);
    try {
      const businessType = selectedType === "otro" ? customType : selectedType;
      const businessTypeLabel =
        selectedType === "otro" ? customType : businessTypes.find((t) => t.id === selectedType)?.label || selectedType;

      const { error } = await supabase
        .from("tenants")
        .update({
          name: tenantName.trim(),
          features: {
            reviews: true,
            whatsapp: true,
            cash_register: true,
            google_calendar: true,
            business_type: businessType,
            business_type_label: businessTypeLabel,
          },
        })
        .eq("id", tenantId);

      if (error) throw error;

      toast.success("¡Perfecto! Vamos al siguiente paso");
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
      <div className="text-center space-y-2">
        <div className="text-4xl mb-2">👋</div>
        <h2 className="text-2xl font-bold text-foreground">¿Qué tipo de negocio tienes?</h2>
        <p className="text-sm text-muted-foreground">Personalizaremos todo para tu tipo de negocio</p>
      </div>

      {/* Business Name */}
      <div className="space-y-2">
        <Label htmlFor="businessName" className="text-sm font-medium">
          Nombre de tu negocio
        </Label>
        <Input
          id="businessName"
          value={tenantName}
          onChange={(e) => setTenantName(e.target.value)}
          placeholder="Ej: Salón María, Barbería El Clásico..."
          className="h-12 rounded-xl text-base"
        />
        <p className="text-[11px] text-muted-foreground">Este nombre aparecerá en tu página web</p>
      </div>

      {/* Business Type Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {businessTypes.map((type) => {
          const isSelected = selectedType === type.id;

          return (
            <button
              key={type.id}
              type="button"
              className={`relative p-4 rounded-2xl border-2 transition-all text-left ${
                isSelected
                  ? `${type.borderActive} bg-gradient-to-br ${type.color} shadow-sm`
                  : "border-border hover:border-primary/30 bg-card"
              }`}
              onClick={() => setSelectedType(type.id)}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              <div className="text-2xl mb-2">{type.emoji}</div>
              <p className="font-semibold text-sm text-foreground leading-tight">{type.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{type.description}</p>
            </button>
          );
        })}
      </div>

      {/* Custom Type Input */}
      {selectedType === "otro" && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
          <Label htmlFor="customType" className="text-sm">
            Especifica tu tipo de negocio
          </Label>
          <Input
            id="customType"
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            placeholder="Ej: Centro de micropigmentación..."
            className="h-12 rounded-xl"
          />
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={saving || !selectedType || !tenantName.trim() || (selectedType === "otro" && !customType.trim())}
        className="w-full h-12 rounded-xl"
        size="lg"
        data-guided-cta="true"
      >
        {saving ? "Guardando..." : "Continuar"}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
