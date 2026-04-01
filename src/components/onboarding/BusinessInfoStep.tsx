import { useState } from "react";
import { MapPin, Phone, Share2, ArrowRight, Loader2, MessageCircle, Mail, Instagram, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StepProps } from "./types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function BusinessInfoStep({ onNext, onPrev, tenantId, loading, setLoading }: StepProps) {
  // Location
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");

  // Contact
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [sameAsPhone, setSameAsPhone] = useState(true);

  // Social
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");

  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      // Format social URLs
      let instagramUrl = instagram;
      if (instagram && !instagram.includes("instagram.com")) {
        instagramUrl = `https://instagram.com/${instagram.replace("@", "")}`;
      }
      let facebookUrl = facebook;
      if (facebook && !facebook.includes("facebook.com")) {
        facebookUrl = `https://facebook.com/${facebook}`;
      }
      let tiktokUrl = tiktok;
      if (tiktok && !tiktok.includes("tiktok.com")) {
        tiktokUrl = `https://tiktok.com/@${tiktok.replace("@", "")}`;
      }

      const { error } = await supabase
        .from("tenants")
        .update({
          address: address || null,
          city: city || null,
          postal_code: postalCode || null,
          google_maps_url: googleMapsUrl || null,
          phone: phone || null,
          whatsapp_number: sameAsPhone ? phone : whatsapp || null,
          email: email || null,
          instagram_url: instagramUrl || null,
          facebook_url: facebookUrl || null,
          tiktok_url: tiktokUrl || null,
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
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Datos de contacto
        </h3>
        <p className="text-sm text-muted-foreground">
          Añade tu información para que los clientes te encuentren
        </p>
      </div>

      <Accordion type="multiple" defaultValue={["location", "contact"]} className="space-y-2">
        {/* Location */}
        <AccordionItem value="location" className="border rounded-xl px-4 overflow-hidden">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Ubicación</p>
                <p className="text-[11px] text-muted-foreground">Dirección del salón</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 space-y-3">
            <Input
              placeholder="Calle Principal 123"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-11 rounded-xl"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Ciudad"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-11 rounded-xl"
              />
              <Input
                placeholder="Código Postal"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <Input
              placeholder="Enlace Google Maps (opcional)"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              className="h-11 rounded-xl"
            />
          </AccordionContent>
        </AccordionItem>

        {/* Contact */}
        <AccordionItem value="contact" className="border rounded-xl px-4 overflow-hidden">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Contacto</p>
                <p className="text-[11px] text-muted-foreground">Teléfono, WhatsApp, Email</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Teléfono</Label>
              <Input
                type="tel"
                placeholder="+34 612 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 rounded-xl mt-1"
              />
            </div>

            <div className="flex items-center justify-between bg-secondary/30 rounded-xl p-3">
              <Label className="flex items-center gap-2 text-sm">
                <MessageCircle className="h-4 w-4 text-green-500" />
                WhatsApp igual que teléfono
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
                {sameAsPhone ? "Sí" : "No"}
              </button>
            </div>

            {!sameAsPhone && (
              <Input
                type="tel"
                placeholder="WhatsApp: +34 612 345 678"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="h-11 rounded-xl"
              />
            )}

            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input
                type="email"
                placeholder="contacto@misalon.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl mt-1"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Social */}
        <AccordionItem value="social" className="border rounded-xl px-4 overflow-hidden">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Share2 className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Redes sociales</p>
                <p className="text-[11px] text-muted-foreground">Opcional</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shrink-0">
                <Instagram className="h-4 w-4 text-white" />
              </div>
              <Input
                placeholder="@tusalonbelleza"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <Input
                placeholder="tusalonbelleza"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0">
                <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </div>
              <Input
                placeholder="@tusalonbelleza"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex gap-3 pt-2">
        {onPrev && (
          <Button variant="outline" onClick={onPrev} className="flex-1 h-12 rounded-xl">
            Atrás
          </Button>
        )}
        <Button onClick={handleSave} className="flex-1 h-12 rounded-xl" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
