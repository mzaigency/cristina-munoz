import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scissors, Sparkles, Heart, Leaf, Users, Palette, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StepProps } from "./types";

const businessTypes = [
  { 
    id: "peluqueria", 
    label: "Peluquería", 
    icon: Scissors, 
    description: "Cortes, peinados y tratamientos capilares",
    color: "from-purple-500 to-pink-500"
  },
  { 
    id: "barberia", 
    label: "Barbería", 
    icon: Scissors, 
    description: "Cortes masculinos, afeitado y barba",
    color: "from-amber-600 to-orange-500"
  },
  { 
    id: "salon_belleza", 
    label: "Salón de Belleza", 
    icon: Sparkles, 
    description: "Servicios integrales de belleza",
    color: "from-rose-400 to-pink-500"
  },
  { 
    id: "estetica", 
    label: "Centro de Estética", 
    icon: Heart, 
    description: "Tratamientos faciales y corporales",
    color: "from-teal-400 to-cyan-500"
  },
  { 
    id: "spa", 
    label: "Spa & Wellness", 
    icon: Leaf, 
    description: "Masajes, relajación y bienestar",
    color: "from-green-400 to-emerald-500"
  },
  { 
    id: "unas", 
    label: "Salón de Uñas", 
    icon: Palette, 
    description: "Manicura, pedicura y nail art",
    color: "from-fuchsia-400 to-purple-500"
  },
  { 
    id: "multiservicios", 
    label: "Multiservicios", 
    icon: Users, 
    description: "Combina varios servicios de belleza",
    color: "from-indigo-400 to-violet-500"
  },
  { 
    id: "otro", 
    label: "Otro", 
    icon: MoreHorizontal, 
    description: "Especifica tu tipo de negocio",
    color: "from-gray-400 to-slate-500"
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
      const businessTypeLabel = selectedType === "otro" 
        ? customType 
        : businessTypes.find(t => t.id === selectedType)?.label || selectedType;

      const { error } = await supabase
        .from("tenants")
        .update({ 
          name: tenantName.trim(),
          // We'll store this in features JSON for now
          features: {
            reviews: true,
            whatsapp: true,
            cash_register: true,
            google_calendar: true,
            business_type: businessType,
            business_type_label: businessTypeLabel
          }
        })
        .eq("id", tenantId);

      if (error) throw error;
      
      toast.success("Tipo de negocio guardado");
      onNext();
    } catch (error) {
      console.error("Error saving business type:", error);
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const selectedTypeData = businessTypes.find(t => t.id === selectedType);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">¿Qué tipo de negocio tienes?</h2>
        <p className="text-muted-foreground">
          Esto nos ayudará a personalizar tu experiencia
        </p>
      </div>

      {/* Business Name */}
      <div className="space-y-2">
        <Label htmlFor="businessName">Nombre de tu negocio</Label>
        <Input
          id="businessName"
          value={tenantName}
          onChange={(e) => setTenantName(e.target.value)}
          placeholder="Ej: Salón María, Barbería El Clásico..."
          className="text-lg"
        />
      </div>

      {/* Business Type Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {businessTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          
          return (
            <Card
              key={type.id}
              className={`p-4 cursor-pointer transition-all hover:scale-105 ${
                isSelected 
                  ? "ring-2 ring-primary shadow-lg" 
                  : "hover:shadow-md"
              }`}
              onClick={() => setSelectedType(type.id)}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${type.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-sm">{type.label}</span>
                <span className="text-xs text-muted-foreground line-clamp-2">
                  {type.description}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Custom Type Input */}
      {selectedType === "otro" && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
          <Label htmlFor="customType">Especifica tu tipo de negocio</Label>
          <Input
            id="customType"
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            placeholder="Ej: Centro de micropigmentación, Estudio de cejas..."
          />
        </div>
      )}

      {/* Preview Card */}
      {selectedType && tenantName && (
        <Card className="p-4 bg-muted/50 animate-in fade-in">
          <div className="flex items-center gap-3">
            {selectedTypeData && (
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${selectedTypeData.color} flex items-center justify-center`}>
                <selectedTypeData.icon className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <p className="font-semibold">{tenantName}</p>
              <p className="text-sm text-muted-foreground">
                {selectedType === "otro" ? customType : selectedTypeData?.label}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Button 
        onClick={handleSave} 
        disabled={saving || !selectedType || !tenantName.trim() || (selectedType === "otro" && !customType.trim())}
        className="w-full"
        size="lg"
      >
        {saving ? "Guardando..." : "Continuar"}
      </Button>
    </div>
  );
}
