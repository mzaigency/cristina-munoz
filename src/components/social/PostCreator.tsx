import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Image as ImageIcon, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUserTenant } from "@/hooks/useCurrentUserTenant";
import { usePosts } from "@/hooks/usePosts";
import { useHaptic } from "@/hooks/useHaptic";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PostCreatorProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = [
  { id: "corte", label: "Corte" },
  { id: "color", label: "Color" },
  { id: "peinado", label: "Peinado" },
  { id: "tratamiento", label: "Tratamiento" },
  { id: "uñas", label: "Uñas" },
  { id: "maquillaje", label: "Maquillaje" },
  { id: "otro", label: "Otro" },
];

export function PostCreator({ isOpen, onClose }: PostCreatorProps) {
  const { tenant } = useCurrentUserTenant();
  const { createPost } = usePosts(tenant?.id);
  const haptic = useHaptic();
  
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      haptic.light();
    }
  };

  const handleSubmit = async () => {
    if (!imageFile || !tenant?.id) {
      toast.error("Selecciona una imagen");
      return;
    }

    setIsUploading(true);
    haptic.medium();

    try {
      // Upload image to Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${tenant.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, imageFile);

      if (uploadError) {
        // If bucket doesn't exist, create it
        if (uploadError.message.includes('not found')) {
          toast.error("Configurando almacenamiento...");
          return;
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

      // Create post
      createPost({
        tenantId: tenant.id,
        imageUrl: publicUrl,
        caption: caption || undefined,
        category: category || undefined,
      });

      toast.success("¡Publicación creada!");
      haptic.success();
      
      // Reset form
      setCaption("");
      setCategory(null);
      setImageFile(null);
      setImagePreview(null);
      onClose();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Error al crear la publicación");
      haptic.error();
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    haptic.light();
    onClose();
  };

  if (!tenant) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <button onClick={handleClose} className="p-2 -ml-2">
              <X className="w-6 h-6" />
            </button>
            <span className="font-semibold">Nueva publicación</span>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!imageFile || isUploading}
              className="rounded-full px-4"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1" />
                  Publicar
                </>
              )}
            </Button>
          </div>

          <div className="flex flex-col h-[calc(100vh-60px)] overflow-y-auto">
            {/* Image Section */}
            <div className="relative aspect-square bg-muted flex items-center justify-center">
              {imagePreview ? (
                <div className="relative w-full h-full">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-3 right-3 p-2 bg-black/50 rounded-full"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex gap-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 p-6 bg-muted-foreground/10 rounded-2xl"
                    >
                      <ImageIcon className="w-10 h-10 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Galería</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 p-6 bg-muted-foreground/10 rounded-2xl"
                    >
                      <Camera className="w-10 h-10 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Cámara</span>
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Selecciona una imagen de tu trabajo
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* Caption & Category */}
            <div className="p-4 space-y-4">
              {/* Tenant Info */}
              <div className="flex items-center gap-3">
                {tenant.logo_url ? (
                  <img
                    src={tenant.logo_url}
                    alt={tenant.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: tenant.primary_color || 'hsl(var(--primary))' }}
                  >
                    {tenant.name.charAt(0)}
                  </div>
                )}
                <span className="font-medium">{tenant.name}</span>
              </div>

              {/* Caption */}
              <Textarea
                placeholder="Escribe una descripción..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="min-h-[100px] resize-none border-0 bg-muted/50 focus-visible:ring-0"
              />

              {/* Category Pills */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Categoría</span>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setCategory(category === cat.id ? null : cat.id);
                        haptic.light();
                      }}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        category === cat.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}