import { useState, useEffect } from "react";
import { Palette, Type, Layers, Paintbrush, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StepProps, colorPresets, fontOptions, bodyFontOptions, buttonStyles } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeStep } from "./ThemeStep";

interface DesignStepProps extends StepProps {
  tenantName?: string;
}

export function DesignStep({ onNext, onPrev, tenantId, tenantName, loading, setLoading }: DesignStepProps) {
  const [activeTab, setActiveTab] = useState("theme");
  const [selectedColor, setSelectedColor] = useState(colorPresets[0]);
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [customPrimary, setCustomPrimary] = useState("#8B5CF6");
  const [customSecondary, setCustomSecondary] = useState("#D946EF");
  const [headingFont, setHeadingFont] = useState("Playfair Display");
  const [bodyFont, setBodyFont] = useState("Inter");
  const [buttonStyle, setButtonStyle] = useState("rounded");
  const [themeCompleted, setThemeCompleted] = useState(false);
  const { toast } = useToast();

  // Load Google Fonts
  useEffect(() => {
    const fonts = [...fontOptions.map(f => f.value), ...bodyFontOptions.map(f => f.value)];
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f.replace(" ", "+")}`).join("&")}&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const handleThemeNext = () => {
    setThemeCompleted(true);
    setActiveTab("colors");
  };

  const handleSaveColorsAndTypo = async () => {
    setLoading(true);
    try {
      const primaryColor = useCustomColor ? customPrimary : selectedColor.primary;
      const secondaryColor = useCustomColor ? customSecondary : selectedColor.secondary;

      const { error } = await supabase
        .from("tenants")
        .update({
          primary_color: primaryColor,
          secondary_color: secondaryColor,
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

  // If on "theme" tab, render the full ThemeStep
  if (activeTab === "theme" && !themeCompleted) {
    return (
      <ThemeStep
        onNext={handleThemeNext}
        onPrev={onPrev}
        tenantId={tenantId}
        tenantName={tenantName}
        loading={loading}
        setLoading={setLoading}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Personaliza el diseño
        </h3>
        <p className="text-sm text-muted-foreground">
          Colores y tipografía de tu marca
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="theme" className="flex-1 text-xs">
            <Layers className="h-3.5 w-3.5 mr-1" />
            Tema
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex-1 text-xs">
            <Palette className="h-3.5 w-3.5 mr-1" />
            Colores
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex-1 text-xs">
            <Type className="h-3.5 w-3.5 mr-1" />
            Fuentes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4 mt-4">
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
                  className={`p-2 rounded-xl border-2 transition-all ${
                    selectedColor.name === preset.name 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className={`h-8 w-full rounded-lg bg-gradient-to-r ${preset.gradient}`} />
                  <p className="text-[10px] text-muted-foreground mt-1 text-center">{preset.name}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-xl">
              <div>
                <Label className="text-xs text-muted-foreground">Principal</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="w-10 h-9 rounded-lg cursor-pointer border-0" />
                  <Input value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="h-9 rounded-lg font-mono text-xs" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Secundario</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={customSecondary} onChange={(e) => setCustomSecondary(e.target.value)} className="w-10 h-9 rounded-lg cursor-pointer border-0" />
                  <Input value={customSecondary} onChange={(e) => setCustomSecondary(e.target.value)} className="h-9 rounded-lg font-mono text-xs" />
                </div>
              </div>
              <div className="col-span-2">
                <div className="h-8 w-full rounded-lg" style={{ background: `linear-gradient(to right, ${customPrimary}, ${customSecondary})` }} />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="typography" className="space-y-4 mt-4">
          {/* Preview */}
          <div className="ios-card p-4 text-center">
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: headingFont }}>
              {tenantName || "Tu Salón"}
            </h2>
            <p className="text-sm text-muted-foreground mb-3" style={{ fontFamily: bodyFont }}>
              Donde la belleza cobra vida
            </p>
            <button
              className={`px-5 py-1.5 bg-primary text-primary-foreground text-sm ${
                buttonStyles.find(b => b.value === buttonStyle)?.preview || "rounded-xl"
              }`}
              style={{ fontFamily: bodyFont }}
            >
              Reservar cita
            </button>
          </div>

          {/* Heading Font */}
          <div className="space-y-2">
            <Label className="text-xs">Fuente títulos</Label>
            <div className="grid grid-cols-2 gap-2">
              {fontOptions.map((font) => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => setHeadingFont(font.value)}
                  className={`p-2.5 rounded-xl border-2 transition-all text-left ${
                    headingFont === font.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-bold text-sm text-foreground truncate" style={{ fontFamily: font.value }}>
                    {font.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{font.category}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Body Font */}
          <div className="space-y-2">
            <Label className="text-xs">Fuente texto</Label>
            <div className="grid grid-cols-2 gap-2">
              {bodyFontOptions.map((font) => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => setBodyFont(font.value)}
                  className={`p-2.5 rounded-xl border-2 transition-all text-left ${
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

          {/* Button Style */}
          <div className="space-y-2">
            <Label className="text-xs">Estilo botones</Label>
            <div className="grid grid-cols-4 gap-2">
              {buttonStyles.map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => setButtonStyle(style.value)}
                  className={`p-2.5 rounded-xl border-2 transition-all ${
                    buttonStyle === style.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className={`h-6 bg-primary mx-auto w-full ${style.preview}`} />
                  <p className="text-[10px] text-muted-foreground mt-1 text-center">{style.label}</p>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {activeTab !== "theme" && (
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => {
            if (activeTab === "colors") {
              setThemeCompleted(false);
              setActiveTab("theme");
            } else {
              setActiveTab("colors");
            }
          }} className="flex-1 h-12 rounded-xl">
            Atrás
          </Button>
          <Button 
            onClick={() => {
              if (activeTab === "colors") {
                setActiveTab("typography");
              } else {
                handleSaveColorsAndTypo();
              }
            }} 
            className="flex-1 h-12 rounded-xl" 
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {activeTab === "typography" ? "Crear mi página ✨" : "Siguiente"}
          </Button>
        </div>
      )}
    </div>
  );
}
