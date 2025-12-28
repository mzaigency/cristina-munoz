import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import { 
  X, Camera, Image as ImageIcon, Type, Check, 
  Sparkles, RotateCcw, Send, Palette, ChevronLeft,
  ChevronRight, Trash2, Smile, Music, AtSign, Hash,
  Sticker, PenTool, Undo2, Sun, Contrast, Droplets,
  Thermometer, Zap, Focus, Layers, Wand2
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
type EditTool = "filters" | "adjust" | "text" | "stickers" | "draw";

interface TextOverlay {
  id: string;
  text: string;
  font: string;
  color: string;
  position: { x: number; y: number };
  size: number;
  rotation: number;
}

interface StickerOverlay {
  id: string;
  emoji: string;
  position: { x: number; y: number };
  size: number;
  rotation: number;
}

interface AdjustmentValues {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  sharpen: number;
  vignette: number;
  fade: number;
}

// Instagram-style filters with more variety
const FILTERS = [
  { id: "none", name: "Normal", filter: "", icon: "✨" },
  { id: "clarendon", name: "Clarendon", filter: "contrast(1.2) saturate(1.35)", icon: "🌟" },
  { id: "gingham", name: "Gingham", filter: "brightness(1.05) hue-rotate(-10deg) sepia(0.1)", icon: "🌸" },
  { id: "moon", name: "Moon", filter: "grayscale(1) contrast(1.1) brightness(1.1)", icon: "🌙" },
  { id: "lark", name: "Lark", filter: "contrast(0.9) brightness(1.1) saturate(1.2)", icon: "🐦" },
  { id: "reyes", name: "Reyes", filter: "sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)", icon: "☀️" },
  { id: "juno", name: "Juno", filter: "saturate(1.4) contrast(1.15) brightness(1.05)", icon: "🔥" },
  { id: "slumber", name: "Slumber", filter: "saturate(0.66) brightness(1.05) sepia(0.1)", icon: "💤" },
  { id: "crema", name: "Crema", filter: "sepia(0.1) saturate(0.9) contrast(0.95) brightness(1.1)", icon: "☕" },
  { id: "ludwig", name: "Ludwig", filter: "saturate(0.85) contrast(1.1) brightness(1.05)", icon: "🎵" },
  { id: "aden", name: "Aden", filter: "hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)", icon: "🌅" },
  { id: "perpetua", name: "Perpetua", filter: "contrast(1.1) saturate(1.2) brightness(1.05)", icon: "🌊" },
];

const FONTS = [
  { id: "sans", name: "Moderna", class: "font-sans", preview: "Aa" },
  { id: "serif", name: "Elegante", class: "font-serif", preview: "Aa" },
  { id: "mono", name: "Técnica", class: "font-mono", preview: "Aa" },
  { id: "display", name: "Display", class: "font-display", preview: "Aa" },
  { id: "cursive", name: "Cursiva", class: "italic", preview: "Aa" },
];

const TEXT_COLORS = [
  { color: "#FFFFFF", name: "Blanco" },
  { color: "#000000", name: "Negro" },
  { color: "#FF3B30", name: "Rojo" },
  { color: "#FF9500", name: "Naranja" },
  { color: "#FFCC00", name: "Amarillo" },
  { color: "#34C759", name: "Verde" },
  { color: "#007AFF", name: "Azul" },
  { color: "#AF52DE", name: "Morado" },
  { color: "#FF2D55", name: "Rosa" },
  { color: "#5AC8FA", name: "Celeste" },
];

const STICKERS = [
  "❤️", "🔥", "✨", "💯", "👏", "🎉", "💪", "😍", 
  "💇‍♀️", "💅", "💄", "🪮", "✂️", "💈", "🌟", "⭐",
  "📍", "🏷️", "💬", "❗", "❓", "💕", "🫶", "👑"
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

const EDIT_TOOLS: { id: EditTool; icon: React.ReactNode; label: string }[] = [
  { id: "filters", icon: <Wand2 className="w-5 h-5" />, label: "Filtros" },
  { id: "adjust", icon: <Sun className="w-5 h-5" />, label: "Ajustar" },
  { id: "text", icon: <Type className="w-5 h-5" />, label: "Texto" },
  { id: "stickers", icon: <Smile className="w-5 h-5" />, label: "Stickers" },
];

const ADJUSTMENTS: { id: keyof AdjustmentValues; icon: React.ReactNode; label: string; min: number; max: number; default: number }[] = [
  { id: "brightness", icon: <Sun className="w-4 h-4" />, label: "Brillo", min: 50, max: 150, default: 100 },
  { id: "contrast", icon: <Contrast className="w-4 h-4" />, label: "Contraste", min: 50, max: 150, default: 100 },
  { id: "saturation", icon: <Droplets className="w-4 h-4" />, label: "Saturación", min: 0, max: 200, default: 100 },
  { id: "warmth", icon: <Thermometer className="w-4 h-4" />, label: "Calidez", min: -30, max: 30, default: 0 },
  { id: "fade", icon: <Layers className="w-4 h-4" />, label: "Fade", min: 0, max: 50, default: 0 },
];

export function StoryCreator({ isOpen, onClose, tenantId, onSuccess }: StoryCreatorProps) {
  const [step, setStep] = useState<Step>("capture");
  const [imageData, setImageData] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [caption, setCaption] = useState("");
  const [storyType, setStoryType] = useState<StoryType>("work");
  const [isUploading, setIsUploading] = useState(false);
  const [activeTool, setActiveTool] = useState<EditTool>("filters");
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [stickerOverlays, setStickerOverlays] = useState<StickerOverlay[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [currentFont, setCurrentFont] = useState("sans");
  const [currentTextColor, setCurrentTextColor] = useState("#FFFFFF");
  const [currentTextSize, setCurrentTextSize] = useState(24);
  const [filterIndex, setFilterIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<AdjustmentValues>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    warmth: 0,
    sharpen: 0,
    vignette: 0,
    fade: 0,
  });
  const [history, setHistory] = useState<{ filter: string; adjustments: AdjustmentValues }[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setStep("capture");
      setImageData(null);
      setSelectedFilter("none");
      setFilterIndex(0);
      setCaption("");
      setStoryType("work");
      setTextOverlays([]);
      setStickerOverlays([]);
      setCurrentText("");
      setActiveTool("filters");
      setSelectedOverlayId(null);
      setAdjustments({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        warmth: 0,
        sharpen: 0,
        vignette: 0,
        fade: 0,
      });
      setHistory([]);
    }
  }, [isOpen]);

  // Save to history when making changes
  const saveToHistory = useCallback(() => {
    setHistory(prev => [...prev.slice(-10), { filter: selectedFilter, adjustments: { ...adjustments } }]);
  }, [selectedFilter, adjustments]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedOverlayId) {
          setSelectedOverlayId(null);
        } else if (step === "publish") {
          setStep("edit");
        } else if (step === "edit") {
          setStep("capture");
          setImageData(null);
        } else {
          onClose();
        }
      }

      if (step === "edit" && activeTool === "filters") {
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

      // Delete selected overlay
      if ((e.key === "Delete" || e.key === "Backspace") && selectedOverlayId) {
        setTextOverlays(prev => prev.filter(t => t.id !== selectedOverlayId));
        setStickerOverlays(prev => prev.filter(s => s.id !== selectedOverlayId));
        setSelectedOverlayId(null);
      }

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        handleUndo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, step, activeTool, selectedOverlayId]);

  const handleUndo = () => {
    if (history.length > 0) {
      const lastState = history[history.length - 1];
      setSelectedFilter(lastState.filter);
      setAdjustments(lastState.adjustments);
      setHistory(prev => prev.slice(0, -1));
      toast("Deshacer cambio");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("La imagen es demasiado grande. Máximo 10MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setImageData(event.target?.result as string);
        setStep("edit");
        toast.success("¡Imagen cargada!");
      };
      reader.onerror = () => {
        toast.error("Error al cargar la imagen");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (step !== "edit" || activeTool !== "filters") return;

    const threshold = 50;
    if (info.offset.x > threshold) {
      saveToHistory();
      setFilterIndex((prev) => {
        const newIndex = prev > 0 ? prev - 1 : FILTERS.length - 1;
        setSelectedFilter(FILTERS[newIndex].id);
        return newIndex;
      });
    } else if (info.offset.x < -threshold) {
      saveToHistory();
      setFilterIndex((prev) => {
        const newIndex = prev < FILTERS.length - 1 ? prev + 1 : 0;
        setSelectedFilter(FILTERS[newIndex].id);
        return newIndex;
      });
    }
    setIsDragging(false);
  };

  // Build CSS filter string from adjustments + selected filter
  const buildFilterString = useCallback(() => {
    const baseFilter = FILTERS.find(f => f.id === selectedFilter)?.filter || "";
    const adjustmentFilter = [
      `brightness(${adjustments.brightness}%)`,
      `contrast(${adjustments.contrast}%)`,
      `saturate(${adjustments.saturation}%)`,
      adjustments.warmth !== 0 ? `sepia(${Math.abs(adjustments.warmth) / 100})` : "",
      adjustments.fade > 0 ? `opacity(${100 - adjustments.fade}%)` : "",
    ].filter(Boolean).join(" ");
    
    return `${baseFilter} ${adjustmentFilter}`.trim();
  }, [selectedFilter, adjustments]);

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

        ctx.filter = buildFilterString();
        ctx.drawImage(img, 0, 0, width, height);

        // Draw text overlays
        textOverlays.forEach(overlay => {
          ctx.filter = "none";
          const font = FONTS.find(f => f.id === overlay.font);
          ctx.font = `bold ${overlay.size * 2}px ${font?.id === "serif" ? "serif" : font?.id === "mono" ? "monospace" : "sans-serif"}`;
          ctx.fillStyle = overlay.color;
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillText(overlay.text, width * overlay.position.x, height * overlay.position.y);
        });

        // Draw sticker overlays
        stickerOverlays.forEach(sticker => {
          ctx.filter = "none";
          ctx.font = `${sticker.size * 2}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(sticker.emoji, width * sticker.position.x, height * sticker.position.y);
        });

        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
      };
      img.src = imageData;
    });
  }, [imageData, buildFilterString, textOverlays, stickerOverlays]);

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
      const newOverlay: TextOverlay = {
        id: `text-${Date.now()}`,
        text: currentText,
        font: currentFont,
        color: currentTextColor,
        position: { x: 0.5, y: 0.5 },
        size: currentTextSize,
        rotation: 0,
      };
      setTextOverlays(prev => [...prev, newOverlay]);
      setCurrentText("");
      toast.success("Texto añadido");
    }
  };

  const addSticker = (emoji: string) => {
    const newSticker: StickerOverlay = {
      id: `sticker-${Date.now()}`,
      emoji,
      position: { x: 0.5 + (Math.random() * 0.2 - 0.1), y: 0.5 + (Math.random() * 0.2 - 0.1) },
      size: 40,
      rotation: 0,
    };
    setStickerOverlays(prev => [...prev, newSticker]);
    toast.success("Sticker añadido");
  };

  const updateAdjustment = (key: keyof AdjustmentValues, value: number) => {
    saveToHistory();
    setAdjustments(prev => ({ ...prev, [key]: value }));
  };

  const goBack = () => {
    if (step === "publish") {
      setStep("edit");
    } else if (step === "edit") {
      setStep("capture");
      setImageData(null);
      setSelectedFilter("none");
      setFilterIndex(0);
      setTextOverlays([]);
      setStickerOverlays([]);
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

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {step === "edit" && history.length > 0 && (
                <button
                  onClick={handleUndo}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Deshacer"
                >
                  <Undo2 className="w-5 h-5 text-white" />
                </button>
              )}
              {step === "edit" && (
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

            <div className="text-center text-white/40 text-sm max-w-xs">
              <p>💡 Consejo: Las fotos verticales funcionan mejor para las stories</p>
            </div>
          </motion.main>
        )}

        {/* Step: Edit - Instagram Style */}
        {step === "edit" && imageData && (
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Image Preview with overlays */}
            <motion.div 
              ref={previewRef}
              className="flex-1 relative flex items-center justify-center p-4 min-h-0"
              drag={activeTool === "filters" ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
            >
              <div className="relative max-w-full max-h-full" onClick={() => setSelectedOverlayId(null)}>
                <motion.img
                  key={selectedFilter}
                  initial={{ opacity: 0.8, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={imageData}
                  alt="Vista previa de la imagen"
                  className="max-w-full max-h-[50vh] rounded-2xl object-contain shadow-2xl"
                  style={{ filter: buildFilterString() }}
                  draggable={false}
                />
                
                {/* Text Overlays */}
                {textOverlays.map((overlay) => (
                  <motion.div
                    key={overlay.id}
                    className={cn(
                      "absolute cursor-move flex items-center justify-center",
                      selectedOverlayId === overlay.id && "ring-2 ring-white ring-offset-2 ring-offset-transparent rounded-lg"
                    )}
                    style={{
                      left: `${overlay.position.x * 100}%`,
                      top: `${overlay.position.y * 100}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    drag
                    dragMomentum={false}
                    onDrag={(_, info) => {
                      const parent = previewRef.current;
                      if (!parent) return;
                      const rect = parent.getBoundingClientRect();
                      setTextOverlays(prev => prev.map(t => 
                        t.id === overlay.id 
                          ? { ...t, position: { 
                              x: Math.max(0.1, Math.min(0.9, (info.point.x - rect.left) / rect.width)), 
                              y: Math.max(0.1, Math.min(0.9, (info.point.y - rect.top) / rect.height)) 
                            }} 
                          : t
                      ));
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOverlayId(overlay.id);
                    }}
                  >
                    <span
                      className={cn(
                        "font-bold drop-shadow-lg px-2 text-center whitespace-nowrap",
                        FONTS.find(f => f.id === overlay.font)?.class
                      )}
                      style={{ 
                        color: overlay.color, 
                        fontSize: `${overlay.size}px`,
                        textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
                      }}
                    >
                      {overlay.text}
                    </span>
                    {selectedOverlayId === overlay.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTextOverlays(prev => prev.filter(t => t.id !== overlay.id));
                          setSelectedOverlayId(null);
                        }}
                        className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </motion.div>
                ))}

                {/* Sticker Overlays */}
                {stickerOverlays.map((sticker) => (
                  <motion.div
                    key={sticker.id}
                    className={cn(
                      "absolute cursor-move",
                      selectedOverlayId === sticker.id && "ring-2 ring-white ring-offset-2 ring-offset-transparent rounded-lg"
                    )}
                    style={{
                      left: `${sticker.position.x * 100}%`,
                      top: `${sticker.position.y * 100}%`,
                      transform: "translate(-50%, -50%)",
                      fontSize: `${sticker.size}px`,
                    }}
                    drag
                    dragMomentum={false}
                    onDrag={(_, info) => {
                      const parent = previewRef.current;
                      if (!parent) return;
                      const rect = parent.getBoundingClientRect();
                      setStickerOverlays(prev => prev.map(s => 
                        s.id === sticker.id 
                          ? { ...s, position: { 
                              x: Math.max(0.1, Math.min(0.9, (info.point.x - rect.left) / rect.width)), 
                              y: Math.max(0.1, Math.min(0.9, (info.point.y - rect.top) / rect.height)) 
                            }} 
                          : s
                      ));
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOverlayId(sticker.id);
                    }}
                  >
                    {sticker.emoji}
                    {selectedOverlayId === sticker.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStickerOverlays(prev => prev.filter(s => s.id !== sticker.id));
                          setSelectedOverlayId(null);
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </motion.div>
                ))}

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
              </div>
            </motion.div>

            {/* Edit Tools Bar - Instagram style */}
            <div className="bg-black border-t border-white/10">
              {/* Tool selector tabs */}
              <div className="flex border-b border-white/10">
                {EDIT_TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1 py-3 transition-all",
                      activeTool === tool.id 
                        ? "text-white border-b-2 border-white" 
                        : "text-white/50 hover:text-white/70"
                    )}
                  >
                    {tool.icon}
                    <span className="text-xs">{tool.label}</span>
                  </button>
                ))}
              </div>

              {/* Tool content */}
              <div className="p-4 safe-area-bottom">
                {/* Filters tool */}
                {activeTool === "filters" && (
                  <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                    <div className="flex gap-3" role="radiogroup">
                      {FILTERS.map((filter, index) => (
                        <button
                          key={filter.id}
                          onClick={() => {
                            saveToHistory();
                            setSelectedFilter(filter.id);
                            setFilterIndex(index);
                          }}
                          className={cn(
                            "flex flex-col items-center gap-2 shrink-0 transition-all",
                            selectedFilter === filter.id && "scale-105"
                          )}
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
                            {filter.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Adjust tool */}
                {activeTool === "adjust" && (
                  <div className="space-y-4 max-h-[200px] overflow-y-auto">
                    {ADJUSTMENTS.map((adj) => (
                      <div key={adj.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-white/70">
                            {adj.icon}
                            <span className="text-sm">{adj.label}</span>
                          </div>
                          <span className="text-white/50 text-sm">
                            {adjustments[adj.id]}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={adj.min}
                          max={adj.max}
                          value={adjustments[adj.id]}
                          onChange={(e) => updateAdjustment(adj.id, Number(e.target.value))}
                          className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => setAdjustments({
                        brightness: 100,
                        contrast: 100,
                        saturation: 100,
                        warmth: 0,
                        sharpen: 0,
                        vignette: 0,
                        fade: 0,
                      })}
                      className="w-full py-2 text-white/60 text-sm hover:text-white transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 inline mr-2" />
                      Restablecer ajustes
                    </button>
                  </div>
                )}

                {/* Text tool */}
                {activeTool === "text" && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        ref={textInputRef}
                        type="text"
                        value={currentText}
                        onChange={(e) => setCurrentText(e.target.value)}
                        placeholder="Escribe tu texto..."
                        maxLength={50}
                        className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/30 focus:border-transparent"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && currentText.trim()) {
                            addTextOverlay();
                          }
                        }}
                      />
                      <button
                        onClick={addTextOverlay}
                        disabled={!currentText.trim()}
                        className="px-4 py-3 rounded-xl bg-white text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Font selector */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
                      {FONTS.map((font) => (
                        <button
                          key={font.id}
                          onClick={() => setCurrentFont(font.id)}
                          className={cn(
                            "flex-shrink-0 px-4 py-2 rounded-lg transition-all",
                            font.class,
                            currentFont === font.id
                              ? "bg-white text-black"
                              : "bg-white/10 text-white hover:bg-white/20"
                          )}
                        >
                          <span className="text-sm font-bold">{font.preview}</span>
                        </button>
                      ))}
                    </div>

                    {/* Color selector */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
                      {TEXT_COLORS.map(({ color, name }) => (
                        <button
                          key={color}
                          onClick={() => setCurrentTextColor(color)}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all shadow-lg flex-shrink-0",
                            currentTextColor === color
                              ? "border-white scale-110"
                              : "border-transparent hover:scale-105"
                          )}
                          style={{ background: color }}
                          aria-label={`Color ${name}`}
                        />
                      ))}
                    </div>

                    {/* Size slider */}
                    <div className="flex items-center gap-3">
                      <Type className="w-4 h-4 text-white/50" />
                      <input
                        type="range"
                        min={16}
                        max={48}
                        value={currentTextSize}
                        onChange={(e) => setCurrentTextSize(Number(e.target.value))}
                        className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                      />
                      <Type className="w-6 h-6 text-white/50" />
                    </div>
                  </div>
                )}

                {/* Stickers tool */}
                {activeTool === "stickers" && (
                  <div className="grid grid-cols-8 gap-3 max-h-[160px] overflow-y-auto">
                    {STICKERS.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => addSticker(emoji)}
                        className="text-2xl hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
                  className="max-w-full max-h-[35vh] rounded-2xl object-contain shadow-2xl"
                  style={{ filter: buildFilterString() }}
                />
                {textOverlays.map((overlay) => (
                  <div
                    key={overlay.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${overlay.position.x * 100}%`,
                      top: `${overlay.position.y * 100}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <span
                      className={cn("font-bold drop-shadow-lg", FONTS.find(f => f.id === overlay.font)?.class)}
                      style={{ color: overlay.color, fontSize: `${overlay.size * 0.6}px` }}
                    >
                      {overlay.text}
                    </span>
                  </div>
                ))}
                {stickerOverlays.map((sticker) => (
                  <div
                    key={sticker.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${sticker.position.x * 100}%`,
                      top: `${sticker.position.y * 100}%`,
                      transform: "translate(-50%, -50%)",
                      fontSize: `${sticker.size * 0.6}px`,
                    }}
                  >
                    {sticker.emoji}
                  </div>
                ))}
              </div>
            </div>

            {/* Publish form */}
            <div className="p-4 space-y-4 safe-area-bottom bg-gradient-to-t from-black via-black/80 to-transparent pt-6">
              {/* Story type */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Tipo de story</label>
                <div className="grid grid-cols-3 gap-2">
                  {STORY_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setStoryType(type.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all",
                        storyType === type.id
                          ? "bg-white text-black"
                          : "bg-white/10 text-white hover:bg-white/20"
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
                <label htmlFor="caption" className="text-white/60 text-sm mb-2 block">
                  Descripción (opcional)
                </label>
                <textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Añade una descripción..."
                  rows={2}
                  maxLength={150}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/30 focus:border-transparent resize-none"
                />
                <p className="text-white/40 text-xs mt-1 text-right">{caption.length}/150</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
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
                      Publicar
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