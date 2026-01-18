import { useState } from "react";
import { Share2, ArrowLeft, ArrowRight, Loader2, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StepProps } from "./types";

export function SocialStep({ onNext, onPrev, tenantId, loading, setLoading }: StepProps) {
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      // Format Instagram URL if just username provided
      let instagramUrl = instagram;
      if (instagram && !instagram.includes("instagram.com")) {
        instagramUrl = `https://instagram.com/${instagram.replace("@", "")}`;
      }

      // Format Facebook URL if just username provided
      let facebookUrl = facebook;
      if (facebook && !facebook.includes("facebook.com")) {
        facebookUrl = `https://facebook.com/${facebook}`;
      }

      // Format TikTok URL if just username provided
      let tiktokUrl = tiktok;
      if (tiktok && !tiktok.includes("tiktok.com")) {
        tiktokUrl = `https://tiktok.com/@${tiktok.replace("@", "")}`;
      }

      const { error } = await supabase
        .from("tenants")
        .update({
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          Redes sociales
        </h3>
        <p className="text-sm text-muted-foreground">
          Conecta tus redes sociales para que los clientes te sigan
        </p>
      </div>

      <div className="space-y-4">
        <div className="ios-card p-4">
          <Label className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
              <Instagram className="h-4 w-4 text-white" />
            </div>
            Instagram
          </Label>
          <Input
            placeholder="@tusalonbelleza o URL completa"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className="h-12 rounded-xl"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Puedes poner solo tu usuario o la URL completa
          </p>
        </div>

        <div className="ios-card p-4">
          <Label className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            Facebook
          </Label>
          <Input
            placeholder="tusalonbelleza o URL completa"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            className="h-12 rounded-xl"
          />
        </div>

        <div className="ios-card p-4">
          <Label className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </div>
            TikTok
          </Label>
          <Input
            placeholder="@tusalonbelleza o URL completa"
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            className="h-12 rounded-xl"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Puedes poner solo tu usuario o la URL completa
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
