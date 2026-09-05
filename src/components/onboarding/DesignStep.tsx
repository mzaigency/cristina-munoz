import { useState, useEffect } from "react";
import { Palette, Type, Paintbrush, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StepProps, colorPresets, fontOptions, bodyFontOptions, buttonStyles } from "./types";
import {
  DEFAULT_HEADING_FONT,
  DEFAULT_BODY_FONT,
  GOOGLE_FONT_SPECS,
} from "@/constants/tenantFonts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DesignStepProps extends StepProps {
  tenantName?: string;
}

export function DesignStep({ onNext, onPrev, tenantId, tenantName, loading, setLoading }: DesignStepProps) {
  const [activeTab, setActiveTab] = useState("colors");
  const [selectedColor, setSelectedColor] = useState(colorPresets[0]);
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [customPrimary, setCustomPrimary] = useState("#8B5CF6");
  const [customSecondary, setCustomSecondary] = useState("#D946EF");
  const [headingFont, setHeadingFont] = useState(DEFAULT_HEADING_FONT);
  const [bodyFont, setBodyFont] = useState(DEFAULT_BODY_FONT);
  const [buttonStyle, setButtonStyle] = useState("rounded");
  const { toast } = useToast();

  // Load Google Fonts
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
    return () => { if (document.head.contains(link)) document.head.removeChild(link); };
  }, []);

  const handleSaveColorsAndTypo = async () => {
    setLoading(true);
    try {
      const primaryColor = useCustomColor ? customPrimary : selectedColor.primary;
      const secondaryColor = useCustomColor ? customSecondary : selectedColor.secondary;

      const { data: updated, error } = await supabase
        .from("tenants")
        .update({
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          font_heading: headingFont,
          font_body: bodyFont,
          button_style: buttonStyle,
        })
        .eq("id", tenantId)
        .select("id");

      if (error) throw error;
      if (!updated || updated.length === 0) {
        throw new Error("No se ha podido guardar el diseño (sin permisos).");
      }
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
        <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Palette className="h-5 w-5 text-primary" />
          Personaliza el diseño
        </h3>
        <p className="text-sm text-muted-foreground">
          Elige el color y la tipografía de tu marca. Usan la plantilla Glowapp.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="colors" className="flex-1 text-xs">
            <Palette className="mr-1 h-3.5 w-3.5" />
            Colores
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex-1 text-xs">
            <Type className="mr-1 h-3.5 w-3.5" />
            Fuentes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Paleta de colores</Label>
            <button
              type="button"
              onClick={() => setUseCustomColor(!useCustomColor)}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Paintbrush className="h-3 w-3" />
              {useCustomColor ? "Usar paletas" : "Personalizar"}
            </button>
          </div>

          {!useCustomColor ? (
            <div className="grid grid-cols-4 gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setSelectedColor(preset)}
                  className={`rounded-xl border-2 p-2 transition-all ${
                    selectedColor.name === preset.name
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className={`h-8 w-full rounded-lg bg-gradient-to-r ${preset.gradient}`} />
                  <p className="mt-1 text-center text-[10px] text-muted-foreground">{preset.name}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-secondary/30 p-4">
              <div>
                <Label className="text-xs text-muted-foreground">Principal</Label>
                <div className="mt-1 flex items-center gap-2">
                  <input type="color" value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="h-9 w-10 cursor-pointer rounded-lg border-0" />
                  <Input value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="h-9 rounded-lg font-mono text-xs" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Secundario</Label>
                <div className="mt-1 flex items-center gap-2">
                  <input type="color" value={customSecondary} onChange={(e) => setCustomSecondary(e.target.value)} className="h-9 w-10 cursor-pointer rounded-lg border-0" />
                  <Input value={customSecondary} onChange={(e) => setCustomSecondary(e.target.value)} className="h-9 rounded-lg font-mono text-xs" />
                </div>
              </div>
              <div className="col-span-2">
                <div className="h-8 w-full rounded-lg" style={{ background: `linear-gradient(to right, ${customPrimary}, ${customSecondary})` }} />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="typography" className="mt-4 space-y-4">
          {/* Preview */}
          <div className="ios-card p-4 text-center">
            <h2 className="mb-1 text-xl font-bold" style={{ fontFamily: headingFont }}>
              {tenantName || "Tu Salón"}
            </h2>
            <p className="mb-3 text-sm text-muted-foreground" style={{ fontFamily: bodyFont }}>
              Donde la belleza cobra vida
            </p>
            <button
              className={`bg-primary px-5 py-1.5 text-sm text-primary-foreground ${
                buttonStyles.find(b => b.value === buttonStyle)?.preview || "rounded-xl"
              }`}
              style={{ fontFamily: bodyFont }}
            >
              Reservar cita
            </button>
          </div>

          {/* Fuente títulos */}
          <div className="space-y-2">
            <Label className="text-xs">Fuente títulos</Label>
            <div className="grid grid-cols-2 gap-2">
              {fontOptions.map((font) => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => setHeadingFont(font.value)}
                  className={`rounded-xl border-2 p-2.5 text-left transition-all ${
                    headingFont === font.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="truncate text-sm font-bold text-foreground" style={{ fontFamily: font.value }}>
                    {font.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{font.category}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Fuente texto */}
          <div className="space-y-2">
            <Label className="text-xs">Fuente texto</Label>
            <div className="grid grid-cols-2 gap-2">
              {bodyFontOptions.map((font) => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => setBodyFont(font.value)}
                  className={`rounded-xl border-2 p-2.5 text-left transition-all ${
                    bodyFont === font.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="text-sm text-foreground" style={{ fontFamily: font.value }}>{font.label}</p>
                  <p className="text-[10px] text-muted-foreground">{font.category}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Estilo botones */}
          <div className="space-y-2">
            <Label className="text-xs">Estilo botones</Label>
            <div className="grid grid-cols-4 gap-2">
              {buttonStyles.map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => setButtonStyle(style.value)}
                  className={`rounded-xl border-2 p-2.5 transition-all ${
                    buttonStyle === style.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className={`mx-auto h-6 w-full bg-primary ${style.preview}`} />
                  <p className="mt-1 text-center text-[10px] text-muted-foreground">{style.label}</p>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => {
            if (activeTab === "typography") setActiveTab("colors");
            else onPrev?.();
          }}
          className="h-12 flex-1 rounded-xl"
        >
          Atrás
        </Button>
        <Button
          onClick={() => {
            if (activeTab === "colors") setActiveTab("typography");
            else handleSaveColorsAndTypo();
          }}
          className="h-12 flex-1 rounded-xl"
          disabled={loading}
          data-guided-cta="true"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {activeTab === "typography" ? "Crear mi página" : "Siguiente"}
        </Button>
      </div>
    </div>
  );
}
