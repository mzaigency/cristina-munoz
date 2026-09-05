import { useState, useEffect } from "react";
import { Type, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StepProps, fontOptions, bodyFontOptions, buttonStyles } from "./types";
import {
  DEFAULT_HEADING_FONT,
  DEFAULT_BODY_FONT,
  GOOGLE_FONT_SPECS,
} from "@/constants/tenantFonts";

export function TypographyStep({ onNext, onPrev, tenantId, tenantName, loading, setLoading }: StepProps) {
  const [headingFont, setHeadingFont] = useState(DEFAULT_HEADING_FONT);
  const [bodyFont, setBodyFont] = useState(DEFAULT_BODY_FONT);
  const [buttonStyle, setButtonStyle] = useState("rounded");
  const { toast } = useToast();

  // Load Google Fonts dynamically
  useEffect(() => {
    const fonts = Array.from(new Set([...fontOptions.map(f => f.value), ...bodyFontOptions.map(f => f.value)]));
    const fontParams = fonts.map(f => {
      const family = f.replace(/ /g, "+");
      const axes = GOOGLE_FONT_SPECS[f] || "wght@400;600";
      return `family=${family}:${axes}`;
    }).join("&");

    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?${fontParams}&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          font_heading: headingFont,
          font_body: bodyFont,
          button_style: buttonStyle,
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
          <Type className="h-5 w-5 text-primary" />
          Tipografía y estilo
        </h3>
        <p className="text-sm text-muted-foreground">
          Elige las fuentes que mejor representen tu marca
        </p>
      </div>

      {/* Preview */}
      <div className="ios-card p-6 text-center">
        <h2 
          className="text-2xl font-bold mb-2" 
          style={{ fontFamily: headingFont }}
        >
          {tenantName || "Tu Salón"}
        </h2>
        <p 
          className="text-muted-foreground mb-4"
          style={{ fontFamily: bodyFont }}
        >
          Donde la belleza cobra vida
        </p>
        <button
          className={`px-6 py-2 bg-primary text-primary-foreground ${
            buttonStyles.find(b => b.value === buttonStyle)?.preview || "rounded-xl"
          }`}
          style={{ fontFamily: bodyFont }}
        >
          Reservar cita
        </button>
      </div>

      {/* Heading Font */}
      <div className="space-y-3">
        <Label>Fuente para títulos</Label>
        <div className="grid grid-cols-2 gap-2">
          {fontOptions.map((font) => (
            <button
              key={font.value}
              type="button"
              onClick={() => setHeadingFont(font.value)}
              className={`p-3 rounded-xl border-2 transition-all text-left ${
                headingFont === font.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <p 
                className="font-bold text-lg text-foreground truncate" 
                style={{ fontFamily: font.value }}
              >
                {font.label}
              </p>
              <p className="text-[10px] text-muted-foreground">{font.category}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Body Font */}
      <div className="space-y-3">
        <Label>Fuente para texto</Label>
        <div className="grid grid-cols-2 gap-2">
          {bodyFontOptions.map((font) => (
            <button
              key={font.value}
              type="button"
              onClick={() => setBodyFont(font.value)}
              className={`p-3 rounded-xl border-2 transition-all text-left ${
                bodyFont === font.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <p 
                className="text-sm text-foreground" 
                style={{ fontFamily: font.value }}
              >
                {font.label}
              </p>
              <p className="text-[10px] text-muted-foreground">{font.category}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Button Style */}
      <div className="space-y-3">
        <Label>Estilo de botones</Label>
        <div className="grid grid-cols-4 gap-2">
          {buttonStyles.map((style) => (
            <button
              key={style.value}
              type="button"
              onClick={() => setButtonStyle(style.value)}
              className={`p-3 rounded-xl border-2 transition-all ${
                buttonStyle === style.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div 
                className={`h-8 bg-primary mx-auto w-full ${style.preview}`}
              />
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                {style.label}
              </p>
            </button>
          ))}
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
