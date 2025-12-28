import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import { 
  X, Camera, Image as ImageIcon, Type, Check, 
  Sparkles, RotateCcw, Send, Palette, ChevronLeft,
  ChevronRight, Trash2
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
type Step = "capture" | "edit" | "publish";

interface TextOverlay {
  text: string;
  font: string;
  color: string;
  position: { x: number; y: number };
}

const FILTERS = [
  { id: "none", name: "Original", filter: "", icon: "✨" },
  { id: "bright", name: "Brillo", filter: "brightness(1.2) contrast(1.1)", icon: "☀️" },
  { id: "warm", name: "Cálido", filter: "sepia(0.3) saturate(1.3)", icon: "🔥" },
  { id: "cool", name: "Frío", filter: "hue-rotate(-20deg) saturate(1.1)", icon: "❄️" },
  { id: "bw", name: "B&N", filter: "grayscale(1)", icon: "🖤" },
  { id: "vintage", name: "Vintage", filter: "sepia(0.4) contrast(1.1) brightness(0.9)", icon: "📷" },
  { id: "vivid", name: "Vívido", filter: "saturate(1.5) contrast(1.1)", icon: "🌈" },
  { id: "fade", name: "Fade", filter: "contrast(0.9) brightness(1.1) saturate(0.8)", icon: "🌫️" },
];

const FONTS = [
  { id: "sans", name: "Moderna", class: "font-sans", preview: "Aa" },
  { id: "serif", name: "Elegante", class: "font-serif", preview: "Aa" },
  { id: "mono", name: "Técnica", class: "font-mono", preview: "Aa" },
  { id: "display", name: "Display", class: "font-display", preview: "Aa" },
];

const TEXT_COLORS = [
  { color: "#FFFFFF", name: "Blanco" },
  { color: "#000000", name: "Negro" },
  { color: "#FF6B6B", name: "Coral" },
  { color: "#4ECDC4", name: "Turquesa" },
  { color: "#FFE66D", name: "Amarillo" },
  { color: "#95E1D3", name: "Menta" },
  { color: "#F38181", name: "Rosa" },
  { color: "#AA96DA", name: "Lavanda" },
];

const STORY_TYPES: { id: StoryType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "work", label: "Trabajo", icon: <Sparkles className="w-5 h-5" />, desc: "Muestra tus mejores trabajos" },
  { id: "promo", label: "Promo", icon: <Palette className="w-5 h-5" />, desc: "Ofertas y promociones" },
  { id: "behind_scenes", label: "Detrás", icon: <Camera className="w-5 h-5" />, desc: "El día a día del salón" },
];

const STEPS: { id: Step; label: string; num: number }[] = [
  { id: "capture", label: "Foto", num: 1 },
  { id: "edit", label: "Editar", num: 2 },
  { id: "publish", label: "Publicar", num: 3 },
];

export function StoryCreator({ isOpen, onClose, tenantId, onSuccess }: StoryCreatorProps) {
  const [step, setStep] = useState<Step>("capture");
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
  const [filterIndex, setFilterIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setStep("capture");
      setImageData(null);
      setSelectedFilter("none");
      setFilterIndex(0);
      setCaption("");
      setStoryType("work");
      setTextOverlay(null);
      setShowTextEditor(false);
      setCurrentText("");
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close or go back
      if (e.key === "Escape") {
        if (showTextEditor) {
          setShowTextEditor(false);
        } else if (step === "publish") {
          setStep("edit");
        } else if (step === "edit") {
          setStep("capture");
          setImageData(null);
        } else {
          onClose();
        }
      }

      // Arrow keys for filter navigation in edit mode
      if (step === "edit" && !showTextEditor) {
        if (e.key === "ArrowLeft") {
          setFilterIndex((prev) => {
            const newIndex = prev > 0 ? prev - 1 : FILTERS.length - 1;
            setSelectedFilter(FILTERS[newIndex].id);
            return newIndex;
          });
        } else if (e.key === "ArrowRight") {
          setFilterIndex((prev) => {
            const newIndex = prev < FILTERS.length - 1 ? prev + 1 : 0;
            setSelectedFilter(FILTERS[newIndex].id);
            return newIndex;
          });
        }
      }

      // Enter to proceed
      if (e.key === "Enter" && !e.shiftKey) {
        if (showTextEditor && currentText.trim()) {
          e.preventDefault();
          addTextOverlay();
        } else if (step === "edit" && !showTextEditor) {
          setStep("publish");
        } else if (step === "publish" && !isUploading) {
          handlePublish();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, step, showTextEditor, currentText, isUploading]);

  // Focus text input when text editor opens
  useEffect(() => {
    if (showTextEditor && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [showTextEditor]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("La imagen es demasiado grande. Máximo 10MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setImageData(event.target?.result as string);
        setStep("edit");
        toast.success("¡Imagen cargada! Ahora puedes editarla.");
      };
      reader.onerror = () => {
        toast.error("Error al cargar la imagen");
      };
      reader.readAsDataURL(file);
    }
  };

  // Swipe gesture to change filters
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (step !== "edit" || showTextEditor) return;

    const threshold = 50;
    if (info.offset.x > threshold) {
      // Swipe right - previous filter
      setFilterIndex((prev) => {
        const newIndex = prev > 0 ? prev - 1 : FILTERS.length - 1;
        setSelectedFilter(FILTERS[newIndex].id);
        return newIndex;
      });
    } else if (info.offset.x < -threshold) {
      // Swipe left - next filter
      setFilterIndex((prev) => {
        const newIndex = prev < FILTERS.length - 1 ? prev + 1 : 0;
        setSelectedFilter(FILTERS[newIndex].id);
        return newIndex;
      });
    }
    setIsDragging(false);
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

        const filter = FILTERS.find(f => f.id === selectedFilter);
        ctx.filter = filter?.filter || "none";
        ctx.drawImage(img, 0, 0, width, height);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const blob = await applyFilterToCanvas();
      if (!blob) throw new Error("Error procesando imagen");

      const fileName = `${tenantId}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("story-images")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
          upsert: false
        });

      if (uploadError) {
        console.error("Storage error:", uploadError);
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
        const { data: { publicUrl } } = supabase.storage
          .from("story-images")
          .getPublicUrl(fileName);

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

      toast.success("¡Story publicada con éxito!");
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
      toast.success("Texto añadido");
    }
  };

  const goBack = () => {
    if (step === "publish") {
      setStep("edit");
    } else if (step === "edit") {
      setStep("capture");
      setImageData(null);
      setSelectedFilter("none");
      setFilterIndex(0);
      setTextOverlay(null);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentStepIndex = STEPS.findIndex(s => s.id === step);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Crear nueva story"
      >
        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          aria-hidden="true"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
          aria-hidden="true"
        />
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

        {/* Header with progress */}
        <header className="relative z-20 safe-area-top">
          {/* Progress bar */}
          <div className="flex gap-1 px-4 pt-4 pb-2">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={cn(
                  "flex-1 h-1 rounded-full transition-all duration-300",
                  i <= currentStepIndex ? "bg-white" : "bg-white/20"
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-4 py-2">
            <button
              onClick={goBack}
              className="flex items-center gap-1 p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label={step === "capture" ? "Cerrar" : "Volver"}
            >
              {step === "capture" ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <ChevronLeft className="w-6 h-6 text-white" />
              )}
            </button>

            <div className="text-center">
              <span className="text-white font-semibold text-lg">
                {STEPS.find(s => s.id === step)?.label}
              </span>
              <p className="text-white/50 text-xs">
                Paso {currentStepIndex + 1} de {STEPS.length}
              </p>
            </div>

            {/* Right action */}
            {step === "edit" && !showTextEditor && (
              <button
                onClick={() => setStep("publish")}
                className="flex items-center gap-1 px-4 py-2 rounded-full bg-white text-black font-medium text-sm"
                aria-label="Continuar a publicar"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step !== "edit" && <div className="w-20" />}
          </div>
        </header>

        {/* Step: Capture */}
        {step === "capture" && (
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-8 px-6"
          >
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-rose-500 via-purple-500 to-blue-500 flex items-center justify-center">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Comparte tu trabajo
              </h2>
              <p className="text-white/60 text-base">
                Sube una foto de tu último trabajo, una promoción o el día a día de tu salón
              </p>
            </div>

            <div className="flex gap-4 w-full max-w-xs">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br from-rose-500/20 to-purple-600/20 border border-white/10 hover:border-white/30 transition-all"
                aria-label="Abrir cámara"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
                  <Camera className="w-7 h-7 text-white" />
                </div>
                <span className="text-white font-medium">Cámara</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 hover:border-white/30 transition-all"
                aria-label="Abrir galería"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <ImageIcon className="w-7 h-7 text-white" />
                </div>
                <span className="text-white font-medium">Galería</span>
              </motion.button>
            </div>

            {/* Tips */}
            <div className="text-center text-white/40 text-sm max-w-xs">
              <p>💡 Consejo: Las fotos verticales funcionan mejor para las stories</p>
            </div>
          </motion.main>
        )}

        {/* Step: Edit */}
        {step === "edit" && imageData && (
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Image Preview with swipe gestures */}
            <motion.div 
              className="flex-1 relative flex items-center justify-center p-4 min-h-0"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
            >
              <div className="relative max-w-full max-h-full">
                <motion.img
                  key={selectedFilter}
                  initial={{ opacity: 0.8, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={imageData}
                  alt="Vista previa de la imagen"
                  className="max-w-full max-h-[55vh] rounded-2xl object-contain shadow-2xl"
                  style={{
                    filter: FILTERS.find(f => f.id === selectedFilter)?.filter || "none"
                  }}
                  draggable={false}
                />
                
                {/* Filter name indicator */}
                <AnimatePresence>
                  {isDragging && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-full"
                    >
                      <span className="text-white font-medium">
                        {FILTERS[filterIndex].icon} {FILTERS[filterIndex].name}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Text Overlay Preview */}
                {textOverlay && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <span
                      className={cn(
                        "text-3xl font-bold drop-shadow-lg px-4 text-center",
                        FONTS.find(f => f.id === textOverlay.font)?.class
                      )}
                      style={{ color: textOverlay.color }}
                    >
                      {textOverlay.text}
                    </span>
                  </motion.div>
                )}

                {/* Swipe hint */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/40 text-xs">
                  <ChevronLeft className="w-3 h-3" />
                  <span>Desliza para cambiar filtro</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </motion.div>

            {/* Text Editor Modal */}
            <AnimatePresence>
              {showTextEditor && (
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  className="absolute inset-x-0 bottom-0 bg-black/95 backdrop-blur-xl rounded-t-3xl p-6 safe-area-bottom z-30"
                >
                  {/* Handle bar */}
                  <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                  
                  <div className="space-y-5">
                    <div>
                      <label className="text-white/60 text-sm mb-2 block">Tu texto</label>
                      <input
                        ref={textInputRef}
                        type="text"
                        value={currentText}
                        onChange={(e) => setCurrentText(e.target.value)}
                        placeholder="Escribe tu texto..."
                        maxLength={50}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white text-lg placeholder:text-white/40 focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                        aria-label="Texto para añadir a la imagen"
                      />
                      <p className="text-white/40 text-xs mt-1 text-right">{currentText.length}/50</p>
                    </div>

                    {/* Font selector */}
                    <div>
                      <label className="text-white/60 text-sm mb-2 block">Fuente</label>
                      <div className="flex gap-2">
                        {FONTS.map((font) => (
                          <button
                            key={font.id}
                            onClick={() => setCurrentFont(font.id)}
                            className={cn(
                              "flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all",
                              font.class,
                              currentFont === font.id
                                ? "bg-white text-black"
                                : "bg-white/10 text-white hover:bg-white/20"
                            )}
                            aria-label={`Fuente ${font.name}`}
                            aria-pressed={currentFont === font.id}
                          >
                            <span className="text-xl font-bold">{font.preview}</span>
                            <span className="text-xs">{font.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color selector */}
                    <div>
                      <label className="text-white/60 text-sm mb-2 block">Color</label>
                      <div className="flex gap-3 justify-center flex-wrap">
                        {TEXT_COLORS.map(({ color, name }) => (
                          <button
                            key={color}
                            onClick={() => setCurrentTextColor(color)}
                            className={cn(
                              "w-10 h-10 rounded-full border-2 transition-all shadow-lg",
                              currentTextColor === color
                                ? "border-white scale-110 ring-2 ring-white/30"
                                : "border-transparent hover:scale-105"
                            )}
                            style={{ background: color }}
                            aria-label={`Color ${name}`}
                            aria-pressed={currentTextColor === color}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Preview */}
                    {currentText && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-white/60 text-xs mb-2">Vista previa:</p>
                        <p
                          className={cn("text-2xl font-bold text-center", FONTS.find(f => f.id === currentFont)?.class)}
                          style={{ color: currentTextColor }}
                        >
                          {currentText}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => {
                          setShowTextEditor(false);
                          setCurrentText("");
                        }}
                        className="flex-1 py-4 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={addTextOverlay}
                        disabled={!currentText.trim()}
                        className="flex-1 py-4 rounded-xl bg-white text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Añadir texto
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Editing Tools */}
            {!showTextEditor && (
              <div className="p-4 space-y-4 safe-area-bottom bg-gradient-to-t from-black via-black/80 to-transparent pt-8">
                {/* Quick actions */}
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setShowTextEditor(true)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all",
                      textOverlay ? "bg-white/20 text-white" : "bg-white/10 text-white hover:bg-white/20"
                    )}
                    aria-label="Añadir texto"
                  >
                    <Type className="w-5 h-5" />
                    <span className="text-sm font-medium">Texto</span>
                  </button>

                  {textOverlay && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => {
                        setTextOverlay(null);
                        toast("Texto eliminado");
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                      aria-label="Eliminar texto"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Quitar</span>
                    </motion.button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedFilter("none");
                      setFilterIndex(0);
                      setTextOverlay(null);
                      toast("Cambios descartados");
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                    aria-label="Reiniciar edición"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span className="text-sm font-medium">Reset</span>
                  </button>
                </div>

                {/* Filters carousel */}
                <div>
                  <p className="text-white/60 text-xs mb-2 px-2">Filtros</p>
                  <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                    <div className="flex gap-3" role="radiogroup" aria-label="Filtros de imagen">
                      {FILTERS.map((filter, index) => (
                        <button
                          key={filter.id}
                          onClick={() => {
                            setSelectedFilter(filter.id);
                            setFilterIndex(index);
                          }}
                          className={cn(
                            "flex flex-col items-center gap-2 shrink-0 transition-all",
                            selectedFilter === filter.id && "scale-105"
                          )}
                          role="radio"
                          aria-checked={selectedFilter === filter.id}
                          aria-label={`Filtro ${filter.name}`}
                        >
                          <div
                            className={cn(
                              "w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shadow-lg",
                              selectedFilter === filter.id
                                ? "border-white ring-2 ring-white/30"
                                : "border-transparent hover:border-white/30"
                            )}
                          >
                            <img
                              src={imageData}
                              alt=""
                              className="w-full h-full object-cover"
                              style={{ filter: filter.filter }}
                              draggable={false}
                            />
                          </div>
                          <span className={cn(
                            "text-xs transition-colors",
                            selectedFilter === filter.id ? "text-white font-medium" : "text-white/60"
                          )}>
                            {filter.icon} {filter.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.main>
        )}

        {/* Step: Publish */}
        {step === "publish" && imageData && (
          <motion.main
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Preview */}
            <div className="flex-1 relative flex items-center justify-center p-4 min-h-0">
              <div className="relative">
                <img
                  src={imageData}
                  alt="Vista previa final"
                  className="max-w-full max-h-[40vh] rounded-2xl object-contain shadow-2xl"
                  style={{
                    filter: FILTERS.find(f => f.id === selectedFilter)?.filter || "none"
                  }}
                />
                {textOverlay && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span
                      className={cn(
                        "text-2xl font-bold drop-shadow-lg px-4 text-center",
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

            {/* Publish form */}
            <div className="p-4 space-y-5 safe-area-bottom bg-gradient-to-t from-black via-black/80 to-transparent pt-6">
              {/* Story type */}
              <div>
                <label className="text-white/60 text-sm mb-3 block">Tipo de story</label>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de story">
                  {STORY_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setStoryType(type.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 py-4 px-2 rounded-xl transition-all",
                        storyType === type.id
                          ? "bg-white text-black"
                          : "bg-white/10 text-white hover:bg-white/20"
                      )}
                      role="radio"
                      aria-checked={storyType === type.id}
                      aria-label={`${type.label}: ${type.desc}`}
                    >
                      {type.icon}
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-white/40 text-xs mt-2 text-center">
                  {STORY_TYPES.find(t => t.id === storyType)?.desc}
                </p>
              </div>

              {/* Caption */}
              <div>
                <label htmlFor="caption" className="text-white/60 text-sm mb-2 block">
                  Descripción (opcional)
                </label>
                <textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Añade una descripción para tu story..."
                  rows={2}
                  maxLength={150}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/30 focus:border-transparent resize-none transition-all"
                />
                <p className="text-white/40 text-xs mt-1 text-right">{caption.length}/150</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep("edit")}
                  className="flex-1 py-4 rounded-2xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Editar
                </button>
                <button
                  onClick={handlePublish}
                  disabled={isUploading}
                  className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Publicar Story
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.main>
        )}
      </motion.div>
    </AnimatePresence>
  );
}