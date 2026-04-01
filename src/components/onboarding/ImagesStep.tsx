import { useState, useRef } from "react";
import { ArrowLeft, ArrowRight, Loader2, Upload, X, Camera, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StepProps } from "./types";

export function ImagesStep({ onNext, onPrev, tenantId, loading, setLoading }: StepProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${tenantId}/${folder}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('tenant-assets')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('tenant-assets')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El logo no puede superar 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingLogo(true);
    try {
      const url = await uploadFile(file, 'logo');
      if (url) setLogoUrl(url);
      toast({ title: "Logo subido correctamente" });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al subir el logo",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (heroImages.length + files.length > 5) {
      toast({
        title: "Límite alcanzado",
        description: "Puedes subir máximo 5 imágenes",
        variant: "destructive",
      });
      return;
    }

    setUploadingHero(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) continue;
        const url = await uploadFile(file, 'hero');
        if (url) newUrls.push(url);
      }
      setHeroImages([...heroImages, ...newUrls]);
      toast({ title: `${newUrls.length} imagen(es) subida(s)` });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al subir imágenes",
        variant: "destructive",
      });
    } finally {
      setUploadingHero(false);
    }
  };

  const removeHeroImage = (index: number) => {
    setHeroImages(heroImages.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData: Record<string, unknown> = {};
      if (logoUrl) updateData.logo_url = logoUrl;
      if (heroImages.length > 0) {
        updateData.hero_images = heroImages;
        updateData.hero_image_url = heroImages[0];
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from("tenants")
          .update(updateData)
          .eq("id", tenantId);

        if (error) throw error;
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          📸 Imágenes de tu negocio
        </h3>
        <p className="text-sm text-muted-foreground">
          Añade tu logo y fotos para que tu página se vea profesional
        </p>
      </div>

      {/* Logo Upload */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Logo</Label>
          <span className="text-[11px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">Opcional</span>
        </div>
        <p className="text-[11px] text-muted-foreground -mt-1">
          Se mostrará en la cabecera de tu página web
        </p>
        <div className="ios-card p-4">
          {logoUrl ? (
            <div className="relative w-20 h-20 mx-auto">
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full object-contain rounded-xl"
              />
              <button
                onClick={() => setLogoUrl(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="w-full py-6 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors flex flex-col items-center gap-2"
            >
              {uploadingLogo ? (
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-medium text-foreground block">Subir logo</span>
                    <span className="text-[11px] text-muted-foreground">PNG, JPG · máx 5MB</span>
                  </div>
                </>
              )}
            </button>
          )}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Salon Photos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Fotos del salón</Label>
          <span className="text-[11px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">Opcional</span>
        </div>
        <p className="text-[11px] text-muted-foreground -mt-1">
          Se mostrarán en la portada de tu página · máx 5 fotos
        </p>
        <div className="grid grid-cols-3 gap-2">
          {heroImages.map((url, index) => (
            <div key={index} className="relative aspect-square">
              <img
                src={url}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover rounded-xl"
              />
              <button
                onClick={() => removeHeroImage(index)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          {heroImages.length < 5 && (
            <button
              onClick={() => heroInputRef.current?.click()}
              disabled={uploadingHero}
              className="aspect-square border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1.5"
            >
              {uploadingHero ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <>
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium">Añadir</span>
                </>
              )}
            </button>
          )}
        </div>
        <input
          ref={heroInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleHeroUpload}
          className="hidden"
        />
      </div>

      <p className="text-[11px] text-muted-foreground text-center bg-secondary/30 rounded-xl py-2.5 px-4">
        💡 Puedes saltar este paso y añadir imágenes después desde tu panel
      </p>

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
