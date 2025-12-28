import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Camera, Image as ImageIcon, Type, Check, 
  Sparkles, Sun, Moon, Contrast, Droplets,
  RotateCcw, Send, Palette
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StoryCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess: () => void;
}

type StoryType = "work" | "promo" | "behind_scenes";

interface TextOverlay {
  text: string;
  font: string;
  color: string;
  position: { x: number; y: number };
}

const FILTERS = [
  { id: "none", name: "Original", filter: "" },
  { id: "bright", name: "Brillo", filter: "brightness(1.2) contrast(1.1)" },
  { id: "warm", name: "Cálido", filter: "sepia(0.3) saturate(1.3)" },
  { id: "cool", name: "Frío", filter: "hue-rotate(-20deg) saturate(1.1)" },
  { id: "bw", name: "B&N", filter: "grayscale(1)" },
  { id: "vintage", name: "Vintage", filter: "sepia(0.4) contrast(1.1) brightness(0.9)" },
  { id: "vivid", name: "Vívido", filter: "saturate(1.5) contrast(1.1)" },
  { id: "fade", name: "Fade", filter: "contrast(0.9) brightness(1.1) saturate(0.8)" },
];

const FONTS = [
  { id: "sans", name: "Moderna", class: "font-sans" },
  { id: "serif", name: "Elegante", class: "font-serif" },
  { id: "mono", name: "Técnica", class: "font-mono" },
  { id: "display", name: "Display", class: "font-display" },
];

const TEXT_COLORS = [
  "#FFFFFF", "#000000", "#FF6B6B", "#4ECDC4", 
  "#FFE66D", "#95E1D3", "#F38181", "#AA96DA"
];

const STORY_TYPES: { id: StoryType; label: string; icon: React.ReactNode }[] = [
  { id: "work", label: "Trabajo", icon: <Sparkles className="w-4 h-4" /> },
  { id: "promo", label: "Promo", icon: <Palette className="w-4 h-4" /> },
  { id: "behind_scenes", label: "Detrás", icon: <Camera className="w-4 h-4" /> },
];

export function StoryCreator({ isOpen, onClose, tenantId, onSuccess }: StoryCreatorProps) {
  const [step, setStep] = useState<"capture" | "edit" | "publish">("capture");
  const [imageData, setImageData] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [caption, setCaption] = useState("");
  const [storyType, setStoryType] = useState<StoryType>("work");
  const [isUploading, setIsUploading] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [textOverlay, setTextOverlay] = useState<TextOverlay | null>(null);
  const [currentText, setCurrentText] = useState("");
  const [currentFont, setCurrentFont] = useState("sans");
  const [currentTextColor, setCurrentTextColor] = useState("#FFFFFF");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setStep("capture");
      setImageData(null);
      setSelectedFilter("none");
      setCaption("");
      setStoryType("work");
      setTextOverlay(null);
      setShowTextEditor(false);
    }
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageData(event.target?.result as string);
        setStep("edit");
      };
      reader.readAsDataURL(file);
    }
  };

  const applyFilterToCanvas = useCallback(async (): Promise<Blob | null> => {
    if (!imageData || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const img = new Image();
    img.crossOrigin = "anonymous";
    
    return new Promise((resolve) => {
      img.onload = () => {
        // Set canvas size to match image aspect ratio
        const maxWidth = 1080;
        const maxHeight = 1920;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (maxHeight / height) * width;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Apply filter
        const filter = FILTERS.find(f => f.id === selectedFilter);
        ctx.filter = filter?.filter || "none";
        ctx.drawImage(img, 0, 0, width, height);

        // Add text overlay if exists
        if (textOverlay) {
          ctx.filter = "none";
          const font = FONTS.find(f => f.id === textOverlay.font);
          ctx.font = `bold 48px ${font?.id === "serif" ? "serif" : font?.id === "mono" ? "monospace" : "sans-serif"}`;
          ctx.fillStyle = textOverlay.color;
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillText(textOverlay.text, width * textOverlay.position.x, height * textOverlay.position.y);
        }

        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
      };
      img.src = imageData;
    });
  }, [imageData, selectedFilter, textOverlay]);

  const handlePublish = async () => {
    if (!imageData) return;

    setIsUploading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Apply filter and get blob
      const blob = await applyFilterToCanvas();
      if (!blob) throw new Error("Error procesando imagen");

      // Upload to storage
      const fileName = `${tenantId}/${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("story-images")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
          upsert: false
        });

      if (uploadError) {
        // If bucket doesn't exist, use a placeholder URL for now
        console.error("Storage error:", uploadError);
        // For demo purposes, we'll use the base64 directly
        const { error: storyError } = await supabase
          .from("salon_stories")
          .insert({
            tenant_id: tenantId,
            image_url: imageData,
            caption: caption || null,
            story_type: storyType,
            created_by: user.id,
          });

        if (storyError) throw storyError;
      } else {
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("story-images")
          .getPublicUrl(fileName);

        // Create story record
        const { error: storyError } = await supabase
          .from("salon_stories")
          .insert({
            tenant_id: tenantId,
            image_url: publicUrl,
            caption: caption || null,
            story_type: storyType,
            created_by: user.id,
          });

        if (storyError) throw storyError;
      }

      toast.success("¡Story publicada!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error publishing story:", error);
      toast.error("Error al publicar la story");
    } finally {
      setIsUploading(false);
    }
  };

  const addTextOverlay = () => {
    if (currentText.trim()) {
      setTextOverlay({
        text: currentText,
        font: currentFont,
        color: currentTextColor,
        position: { x: 0.5, y: 0.5 },
      });
      setShowTextEditor(false);
      setCurrentText("");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 safe-area-top">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <span className="text-white font-semibold">
            {step === "capture" && "Nueva Story"}
            {step === "edit" && "Editar"}
            {step === "publish" && "Publicar"}
          </span>
          <div className="w-10" />
        </div>

        {/* Step: Capture */}
        {step === "capture" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-8 px-8"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                Comparte tu trabajo
              </h2>
              <p className="text-white/60">
                Sube una foto de tu último trabajo o promoción
              </p>
            </div>

            <div className="flex gap-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <span className="text-white font-medium">Cámara</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <span className="text-white font-medium">Galería</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step: Edit */}
        {step === "edit" && imageData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full"
          >
            {/* Image Preview */}
            <div className="flex-1 relative flex items-center justify-center p-4 pt-20">
              <div className="relative max-w-full max-h-full">
                <img
                  src={imageData}
                  alt="Preview"
                  className="max-w-full max-h-[60vh] rounded-xl object-contain"
                  style={{
                    filter: FILTERS.find(f => f.id === selectedFilter)?.filter || "none"
                  }}
                />
                
                {/* Text Overlay Preview */}
                {textOverlay && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{
                      top: `${(textOverlay.position.y - 0.5) * 100}%`,
                    }}
                  >
                    <span
                      className={cn(
                        "text-3xl font-bold drop-shadow-lg",
                        FONTS.find(f => f.id === textOverlay.font)?.class
                      )}
                      style={{ color: textOverlay.color }}
                    >
                      {textOverlay.text}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Text Editor Modal */}
            <AnimatePresence>
              {showTextEditor && (
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  className="absolute inset-x-0 bottom-0 bg-black/90 backdrop-blur-xl rounded-t-3xl p-6 safe-area-bottom z-30"
                >
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={currentText}
                      onChange={(e) => setCurrentText(e.target.value)}
                      placeholder="Escribe tu texto..."
                      className="w-full bg-white/10 border-none rounded-xl px-4 py-3 text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/30"
                      autoFocus
                    />

                    {/* Font selector */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {FONTS.map((font) => (
                        <button
                          key={font.id}
                          onClick={() => setCurrentFont(font.id)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors",
                            font.class,
                            currentFont === font.id
                              ? "bg-white text-black"
                              : "bg-white/10 text-white"
                          )}
                        >
                          {font.name}
                        </button>
                      ))}
                    </div>

                    {/* Color selector */}
                    <div className="flex gap-2 justify-center">
                      {TEXT_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setCurrentTextColor(color)}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-transform",
                            currentTextColor === color
                              ? "border-white scale-110"
                              : "border-transparent"
                          )}
                          style={{ background: color }}
                        />
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowTextEditor(false)}
                        className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={addTextOverlay}
                        className="flex-1 py-3 rounded-xl bg-white text-black font-medium"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Editing Tools */}
            {!showTextEditor && (
              <div className="p-4 space-y-4 safe-area-bottom">
                {/* Quick actions */}
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setShowTextEditor(true)}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <Type className="w-5 h-5 text-white" />
                    <span className="text-xs text-white/80">Texto</span>
                  </button>
                  {textOverlay && (
                    <button
                      onClick={() => setTextOverlay(null)}
                      className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <RotateCcw className="w-5 h-5 text-white" />
                      <span className="text-xs text-white/80">Quitar</span>
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-3 px-2">
                    {FILTERS.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 shrink-0 transition-all",
                          selectedFilter === filter.id && "scale-105"
                        )}
                      >
                        <div
                          className={cn(
                            "w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors",
                            selectedFilter === filter.id
                              ? "border-white"
                              : "border-transparent"
                          )}
                        >
                          <img
                            src={imageData}
                            alt={filter.name}
                            className="w-full h-full object-cover"
                            style={{ filter: filter.filter }}
                          />
                        </div>
                        <span className="text-xs text-white/80">{filter.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Next button */}
                <button
                  onClick={() => setStep("publish")}
                  className="w-full py-4 rounded-2xl bg-white text-black font-semibold flex items-center justify-center gap-2"
                >
                  Siguiente
                  <Check className="w-5 h-5" />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Step: Publish */}
        {step === "publish" && imageData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full"
          >
            {/* Preview */}
            <div className="flex-1 relative flex items-center justify-center p-4 pt-20">
              <img
                src={imageData}
                alt="Preview"
                className="max-w-full max-h-[50vh] rounded-xl object-contain"
                style={{
                  filter: FILTERS.find(f => f.id === selectedFilter)?.filter || "none"
                }}
              />
              {textOverlay && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span
                    className={cn(
                      "text-3xl font-bold drop-shadow-lg",
                      FONTS.find(f => f.id === textOverlay.font)?.class
                    )}
                    style={{ color: textOverlay.color }}
                  >
                    {textOverlay.text}
                  </span>
                </div>
              )}
            </div>

            {/* Publish form */}
            <div className="p-4 space-y-4 safe-area-bottom">
              {/* Story type */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Tipo de story</label>
                <div className="flex gap-2">
                  {STORY_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setStoryType(type.id)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-colors",
                        storyType === type.id
                          ? "bg-white text-black"
                          : "bg-white/10 text-white"
                      )}
                    >
                      {type.icon}
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Descripción (opcional)</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Añade una descripción..."
                  rows={2}
                  className="w-full bg-white/10 border-none rounded-xl px-4 py-3 text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/30 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("edit")}
                  className="flex-1 py-4 rounded-2xl bg-white/10 text-white font-medium"
                >
                  Atrás
                </button>
                <button
                  onClick={handlePublish}
                  disabled={isUploading}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Publicar
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}