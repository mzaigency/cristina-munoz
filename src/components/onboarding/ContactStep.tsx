import { useState } from "react";
import { Phone, Mail, ArrowLeft, ArrowRight, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StepProps } from "./types";

export function ContactStep({ onNext, onPrev, tenantId, loading, setLoading }: StepProps) {
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          phone: phone || null,
          whatsapp_number: sameAsPhone ? phone : whatsapp || null,
          email: email || null,
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
          <Phone className="h-5 w-5 text-primary" />
          Información de contacto
        </h3>
        <p className="text-sm text-muted-foreground">
          Añade tus datos de contacto para que los clientes puedan comunicarse contigo
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Teléfono
          </Label>
          <Input
            type="tel"
            placeholder="+34 612 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-12 rounded-xl mt-2"
          />
        </div>

        <div className="ios-card p-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-green-500" />
              WhatsApp
            </Label>
            <button
              type="button"
              onClick={() => setSameAsPhone(!sameAsPhone)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                sameAsPhone 
                  ? "bg-primary/10 text-primary" 
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {sameAsPhone ? "Igual que teléfono" : "Número diferente"}
            </button>
          </div>
          
          {!sameAsPhone && (
            <Input
              type="tel"
              placeholder="+34 612 345 678"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="h-12 rounded-xl"
            />
          )}
          
          {sameAsPhone && phone && (
            <p className="text-sm text-muted-foreground">
              Se usará el mismo número: {phone}
            </p>
          )}
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </Label>
          <Input
            type="email"
            placeholder="contacto@misalon.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl mt-2"
          />
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
