import { useState } from "react";
import { MapPin, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StepProps } from "./types";

export function LocationStep({ onNext, onPrev, tenantId, loading, setLoading }: StepProps) {
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          address: address || null,
          city: city || null,
          postal_code: postalCode || null,
          google_maps_url: googleMapsUrl || null,
        })
        .eq("id", tenantId);

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
          <MapPin className="h-5 w-5 text-primary" />
          Ubicación del salón
        </h3>
        <p className="text-sm text-muted-foreground">
          Añade tu dirección para que los clientes te encuentren fácilmente
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Dirección</Label>
          <Input
            placeholder="Calle Principal 123"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="h-12 rounded-xl mt-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Ciudad</Label>
            <Input
              placeholder="Madrid"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-12 rounded-xl mt-2"
            />
          </div>
          <div>
            <Label>Código Postal</Label>
            <Input
              placeholder="28001"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="h-12 rounded-xl mt-2"
            />
          </div>
        </div>

        <div>
          <Label>Enlace de Google Maps (opcional)</Label>
          <Input
            placeholder="https://maps.google.com/..."
            value={googleMapsUrl}
            onChange={(e) => setGoogleMapsUrl(e.target.value)}
            className="h-12 rounded-xl mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Copia el enlace de compartir desde Google Maps
          </p>
        </div>
      </div>

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
