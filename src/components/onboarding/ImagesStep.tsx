import { useState, useRef } from "react";
import { ArrowLeft, ArrowRight, Loader2, Upload, X, Camera, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StepProps } from "./types";

export function ImagesStep({ onNext, onPrev, tenantId, loading, setLoading }: StepProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [salonPhoto, setSalonPhoto] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSalon, setUploadingSalon] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const salonInputRef = useRef<HTMLInputElement>(null);
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

  const handleSalonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "La foto no puede superar 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingSalon(true);
    try {
      const url = await uploadFile(file, 'hero');
      if (url) setSalonPhoto(url);
      toast({ title: "Foto subida correctamente" });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al subir la foto",
        variant: "destructive",
      });
    } finally {
      setUploadingSalon(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData: Record<string, unknown> = {};
      if (logoUrl) updateData.logo_url = logoUrl;
      if (salonPhoto) {
        updateData.hero_images = [salonPhoto];
        updateData.hero_image_url = salonPhoto;
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
          Añade tu logo y una foto de tu salón
        </p>
      </div>

      {/* Stacked layout — logo square, salon photo horizontal */}
      <div className="space-y-4">
        {/* Logo Upload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Logo</Label>
            <span className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-full">Opcional</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Aparecerá en la cabecera de tu web
          </p>
          <div className="ios-card p-4">
            {logoUrl ? (
              <div className="relative w-24 h-24 mx-auto">
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
                className="w-full py-8 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2"
              >
                {uploadingLogo ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Upload className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-medium text-foreground block">Subir logo</span>
                      <span className="text-[10px] text-muted-foreground">máx 5MB</span>
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

        {/* Salon Photo */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Foto del salón</Label>
            <span className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-full">Opcional</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight">
            La imagen principal de tu página
          </p>
          <div className="ios-card p-4">
            {salonPhoto ? (
              <div className="relative aspect-video w-full">
                <img
                  src={salonPhoto}
                  alt="Foto del salón"
                  className="w-full h-full object-cover rounded-xl"
                />
                <button
                  onClick={() => setSalonPhoto(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => salonInputRef.current?.click()}
                disabled={uploadingSalon}
                className="w-full aspect-video border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2"
              >
                {uploadingSalon ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Camera className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-medium text-foreground block">Subir foto</span>
                      <span className="text-[10px] text-muted-foreground">máx 10MB</span>
                    </div>
                  </>
                )}
              </button>
            )}
            <input
              ref={salonInputRef}
              type="file"
              accept="image/*"
              onChange={handleSalonUpload}
              className="hidden"
            />
          </div>
        </div>
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
