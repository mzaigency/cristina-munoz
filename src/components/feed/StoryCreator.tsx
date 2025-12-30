import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import {
  X,
  Camera,
  Image as ImageIcon,
  Type,
  Check,
  Sparkles,
  RotateCcw,
  Send,
  Palette,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Smile,
  Sun,
  Contrast,
  Thermometer,
  Droplets,
  Download,
  Undo2,
  GripHorizontal,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/contexts/NavigationContext";

// --- TYPES ---
interface StoryCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess: () => void;
}

type StoryType = "work" | "promo" | "behind_scenes";
type Step = "capture" | "edit" | "publish";
type EditTool = "none" | "filters" | "adjust" | "text" | "stickers";

interface OverlayItem {
  id: string;
  type: "text" | "sticker";
  content: string; // Text content or Emoji
  style?: {
    font?: string;
    color?: string;
    backgroundColor?: string;
  };
  x: number; // Percentage 0-1
  y: number; // Percentage 0-1
  scale: number;
  rotation: number;
}

interface AdjustmentValues {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  blur: number;
}

// --- CONSTANTS ---
const FILTERS = [
  { id: "none", name: "Normal", filter: "", class: "" },
  { id: "vivid", name: "Vivid", filter: "contrast(1.1) saturate(1.2)", class: "contrast-[1.1] saturate-[1.2]" },
  { id: "warm", name: "Warm", filter: "sepia(0.2) contrast(1.05)", class: "sepia-[0.2] contrast-[1.05]" },
  {
    id: "cool",
    name: "Cool",
    filter: "hue-rotate(180deg) sepia(0.1) saturate(0.8)",
    class: "hue-rotate-15 sepia-[0.1]",
  },
  { id: "bw", name: "B&W", filter: "grayscale(1) contrast(1.1)", class: "grayscale contrast-[1.1]" },
  {
    id: "vintage",
    name: "Vintage",
    filter: "sepia(0.4) contrast(1.1) brightness(0.9)",
    class: "sepia-[0.4] contrast-[1.1] brightness-[0.9]",
  },
];

const FONTS = [
  { id: "sans", name: "Modern", class: "font-sans font-bold" },
  { id: "serif", name: "Classic", class: "font-serif font-semibold italic" },
  { id: "mono", name: "Tech", class: "font-mono font-bold tracking-tighter" },
  { id: "cursive", name: "Hand", class: "font-cursive italic font-bold" }, // Assuming font-cursive exists in your tailwind or use custom class
];

const COLORS = [
  "#FFFFFF",
  "#000000",
  "#FF3B30",
  "#FF9500",
  "#FFCC00",
  "#34C759",
  "#007AFF",
  "#AF52DE",
  "#FF2D55",
  "#5AC8FA",
];

const STICKERS = ["❤️", "🔥", "✨", "💯", "🎉", "😍", "💇‍♀️", "💅", "✂️", "💈", "📍", "🏷️", "💬", "👑"];

// --- HELPER MATH FOR GESTURES ---
const getDistance = (touches: React.TouchList) => {
  return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
};

const getAngle = (touches: React.TouchList) => {
  return (Math.atan2(touches[1].clientY - touches[0].clientY, touches[1].clientX - touches[0].clientX) * 180) / Math.PI;
};

// --- COMPONENT ---
export function StoryCreator({ isOpen, onClose, tenantId, onSuccess }: StoryCreatorProps) {
  // State
  const [step, setStep] = useState<Step>("capture");
  const [imageData, setImageData] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<EditTool>("none");
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [adjustments, setAdjustments] = useState<AdjustmentValues>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    warmth: 0,
    blur: 0,
  });

  // Text Editor State
  const [textInput, setTextInput] = useState("");
  const [activeFont, setActiveFont] = useState("sans");
  const [activeColor, setActiveColor] = useState("#FFFFFF");
  const [isEditingText, setIsEditingText] = useState(false);

  // Publish State
  const [storyType, setStoryType] = useState<StoryType>("work");
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef({ startDist: 0, startAngle: 0, startScale: 1, startRotation: 0 });

  const { setNavigationHidden } = useNavigation();

  // Effects
  useEffect(() => {
    setNavigationHidden(isOpen);
    if (!isOpen) resetState();
  }, [isOpen]);

  const resetState = () => {
    setStep("capture");
    setImageData(null);
    setOverlays([]);
    setAdjustments({ brightness: 100, contrast: 100, saturation: 100, warmth: 0, blur: 0 });
    setSelectedFilter("none");
    setCaption("");
    setActiveTool("none");
  };

  // --- HANDLERS ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageData(ev.target?.result as string);
        setStep("edit");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTouchStart = (e: React.TouchEvent, item: OverlayItem) => {
    if (e.touches.length === 2) {
      e.preventDefault(); // Prevent scroll
      gestureRef.current.startDist = getDistance(e.touches);
      gestureRef.current.startAngle = getAngle(e.touches);
      gestureRef.current.startScale = item.scale;
      gestureRef.current.startRotation = item.rotation;
    } else {
      setSelectedOverlayId(item.id);
    }
  };

  const handleTouchMove = (e: React.TouchEvent, item: OverlayItem) => {
    if (e.touches.length === 2 && selectedOverlayId === item.id) {
      e.preventDefault();
      const currentDist = getDistance(e.touches);
      const currentAngle = getAngle(e.touches);

      const scaleFactor = currentDist / gestureRef.current.startDist;
      const angleDiff = currentAngle - gestureRef.current.startAngle;

      updateOverlay(item.id, {
        scale: Math.max(0.5, Math.min(3, gestureRef.current.startScale * scaleFactor)),
        rotation: gestureRef.current.startRotation + angleDiff,
      });
    }
  };

  const addText = () => {
    if (!textInput.trim()) {
      setIsEditingText(false);
      return;
    }
    const newOverlay: OverlayItem = {
      id: Date.now().toString(),
      type: "text",
      content: textInput,
      style: { font: activeFont, color: activeColor },
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
    };
    setOverlays([...overlays, newOverlay]);
    setTextInput("");
    setIsEditingText(false);
    setActiveTool("none");
  };

  const addSticker = (emoji: string) => {
    const newOverlay: OverlayItem = {
      id: Date.now().toString(),
      type: "sticker",
      content: emoji,
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
    };
    setOverlays([...overlays, newOverlay]);
    toast.success("Sticker añadido", { position: "top-center" });
  };

  const updateOverlay = (id: string, updates: Partial<OverlayItem>) => {
    setOverlays((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };

  const deleteOverlay = (id: string) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
    setSelectedOverlayId(null);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  // --- FINAL RENDER LOGIC ---
  const generateFinalImage = async () => {
    if (!imageData || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    return new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Set canvas to high res
        const width = 1080;
        const height = 1920; // 9:16 aspect ratio
        canvas.width = width;
        canvas.height = height;

        // Draw Base Image with Filters
        ctx.filter = `
          ${FILTERS.find((f) => f.id === selectedFilter)?.filter} 
          brightness(${adjustments.brightness}%) 
          contrast(${adjustments.contrast}%) 
          saturate(${adjustments.saturation}%)
          sepia(${Math.abs(adjustments.warmth) / 100})
        `;

        // Draw image "contain" or "cover" style
        const scale = Math.max(width / img.width, height / img.height);
        const x = width / 2 - (img.width / 2) * scale;
        const y = height / 2 - (img.height / 2) * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        // Reset filter for overlays
        ctx.filter = "none";

        // Draw Overlays
        overlays.forEach((overlay) => {
          ctx.save();
          const posX = overlay.x * width;
          const posY = overlay.y * height;

          ctx.translate(posX, posY);
          ctx.rotate((overlay.rotation * Math.PI) / 180);
          ctx.scale(overlay.scale, overlay.scale);

          if (overlay.type === "text") {
            const fontConfig = FONTS.find((f) => f.id === overlay.style?.font);
            // Approximate font mapping
            const fontFamily =
              fontConfig?.id === "serif"
                ? "serif"
                : fontConfig?.id === "mono"
                  ? "monospace"
                  : fontConfig?.id === "cursive"
                    ? "cursive"
                    : "sans-serif";
            ctx.font = `bold 40px ${fontFamily}`;
            ctx.fillStyle = overlay.style?.color || "#fff";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillText(overlay.content, 0, 0);
          } else {
            ctx.font = "60px Arial"; // Emoji font
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(overlay.content, 0, 0);
          }
          ctx.restore();
        });

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas blob failed"));
          },
          "image/jpeg",
          0.9,
        );
      };
      img.src = imageData;
    });
  };

  const handlePublish = async () => {
    setIsUploading(true);
    try {
      const blob = await generateFinalImage();
      if (!blob) throw new Error("Failed to generate image");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const fileName = `${tenantId}/${Date.now()}.jpg`;
      const { error: uploadErr } = await supabase.storage.from("story-images").upload(fileName, blob);
      if (uploadErr) throw uploadErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from("story-images").getPublicUrl(fileName);

      await supabase.from("salon_stories").insert({
        tenant_id: tenantId,
        image_url: publicUrl,
        caption,
        story_type: storyType,
        created_by: user.id,
      });

      toast.success("¡Story publicada!");
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Error al publicar");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black text-white flex flex-col overflow-hidden"
      >
        <canvas ref={canvasRef} className="hidden" />

        {/* --- HEADER --- */}
        <div className="flex items-center justify-between p-4 z-20 bg-gradient-to-b from-black/80 to-transparent">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 backdrop-blur-md">
            <X className="w-6 h-6" />
          </button>

          {step === "edit" && !isEditingText && (
            <div className="flex gap-4">
              {/* Tools Toolbar Top */}
              <button
                onClick={() => {
                  setActiveTool("text");
                  setIsEditingText(true);
                }}
                className="p-2"
              >
                <Type className="w-6 h-6 drop-shadow-md" />
              </button>
              <button onClick={() => setActiveTool(activeTool === "stickers" ? "none" : "stickers")} className="p-2">
                <Smile className="w-6 h-6 drop-shadow-md" />
              </button>
            </div>
          )}

          {step === "edit" && !isEditingText && (
            <button
              onClick={() => setStep("publish")}
              className="px-4 py-2 bg-white text-black rounded-full font-bold text-sm flex items-center gap-1 shadow-lg"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex-1 relative bg-neutral-900 flex items-center justify-center overflow-hidden">
          {/* STEP 1: CAPTURE */}
          {step === "capture" && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-col gap-6 items-center"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-pink-500 to-violet-500 flex items-center justify-center shadow-xl shadow-pink-500/20 mb-4 animate-pulse">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Nueva Historia</h2>

              <div className="flex gap-4">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95"
                >
                  <Camera className="w-8 h-8 text-pink-500" />
                  <span className="font-medium">Cámara</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95"
                >
                  <ImageIcon className="w-8 h-8 text-blue-500" />
                  <span className="font-medium">Galería</span>
                </button>
              </div>

              {/* Hidden Inputs */}
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
              <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileSelect} />
            </motion.div>
          )}

          {/* STEP 2: EDIT CANVAS */}
          {step === "edit" && imageData && (
            <div
              ref={containerRef}
              className="relative w-full h-full max-w-lg aspect-[9/16] bg-black shadow-2xl overflow-hidden"
              onClick={() => setSelectedOverlayId(null)}
            >
              {/* Base Image */}
              <img
                src={imageData}
                alt="Story base"
                className={cn(
                  "w-full h-full object-cover pointer-events-none transition-all duration-300",
                  FILTERS.find((f) => f.id === selectedFilter)?.class,
                )}
                style={{
                  filter: `
                    brightness(${adjustments.brightness}%) 
                    contrast(${adjustments.contrast}%) 
                    saturate(${adjustments.saturation}%) 
                    sepia(${Math.abs(adjustments.warmth) / 100})
                    blur(${adjustments.blur}px)
                  `,
                }}
              />

              {/* Overlays Layer */}
              {overlays.map((item) => (
                <motion.div
                  key={item.id}
                  drag
                  dragMomentum={false}
                  dragConstraints={containerRef}
                  onDragEnd={(_, info) => {
                    // Update position percentage based on container size
                    if (containerRef.current) {
                      const rect = containerRef.current.getBoundingClientRect();
                      updateOverlay(item.id, {
                        x: Math.max(0, Math.min(1, (info.point.x - rect.left) / rect.width)),
                        y: Math.max(0, Math.min(1, (info.point.y - rect.top) / rect.height)),
                      });
                    }
                  }}
                  onTouchStart={(e) => handleTouchStart(e as any, item)}
                  onTouchMove={(e) => handleTouchMove(e as any, item)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOverlayId(item.id);
                  }}
                  style={{
                    left: `${item.x * 100}%`,
                    top: `${item.y * 100}%`,
                    scale: item.scale,
                    rotate: item.rotation,
                    x: "-50%",
                    y: "-50%",
                  }}
                  className={cn(
                    "absolute cursor-grab active:cursor-grabbing touch-none select-none",
                    selectedOverlayId === item.id && "z-50",
                  )}
                >
                  <div
                    className={cn(
                      "relative px-4 py-2 rounded-lg transition-all",
                      selectedOverlayId === item.id
                        ? "ring-2 ring-white ring-offset-2 ring-offset-black/50 bg-black/20 backdrop-blur-sm"
                        : "",
                    )}
                  >
                    {item.type === "text" ? (
                      <span
                        className={cn(
                          "text-2xl whitespace-nowrap drop-shadow-md",
                          FONTS.find((f) => f.id === item.style?.font)?.class,
                        )}
                        style={{ color: item.style?.color }}
                      >
                        {item.content}
                      </span>
                    ) : (
                      <span className="text-6xl drop-shadow-md">{item.content}</span>
                    )}

                    {/* Desktop Controls (Visible only on selection and hover/desktop) */}
                    {selectedOverlayId === item.id && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteOverlay(item.id);
                          }}
                          className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Trash Zone (Visual cue when dragging) */}
              <AnimatePresence>
                {/* Can interpret drag location to delete, implemented via button for simplicity/accessibility */}
              </AnimatePresence>
            </div>
          )}

          {/* STEP 3: PUBLISH PREVIEW */}
          {step === "publish" && (
            <div className="w-full max-w-md px-6 flex flex-col gap-4">
              <div className="bg-white/10 rounded-2xl p-4">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Escribe una descripción..."
                  className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/50 resize-none text-lg"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {["work", "promo", "behind_scenes"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setStoryType(t as StoryType)}
                    className={cn(
                      "py-3 rounded-xl font-medium text-sm transition-all border",
                      storyType === t
                        ? "bg-white text-black border-white"
                        : "bg-black/40 text-white/70 border-white/10 hover:bg-white/10",
                    )}
                  >
                    {t === "work" ? "Trabajo" : t === "promo" ? "Promo" : "Detrás"}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep("edit")} className="flex-1 py-4 bg-white/10 rounded-xl font-medium">
                  Volver
                </button>
                <button
                  onClick={handlePublish}
                  disabled={isUploading}
                  className="flex-[2] py-4 bg-gradient-to-r from-blue-500 to-violet-600 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {isUploading ? <Sparkles className="animate-spin" /> : <Send />}
                  Publicar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* --- BOTTOM TOOLBAR (EDIT MODE) --- */}
        <AnimatePresence>
          {step === "edit" && !isEditingText && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              className="z-30 bg-black/80 backdrop-blur-xl border-t border-white/10 pb-6 safe-area-bottom"
            >
              {/* Contextual Sub-menus */}
              {activeTool === "filters" && (
                <div className="flex overflow-x-auto gap-4 p-4 scrollbar-hide">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFilter(f.id)}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className={cn(
                          "w-16 h-16 rounded-full border-2 overflow-hidden",
                          selectedFilter === f.id ? "border-pink-500" : "border-transparent",
                        )}
                      >
                        <img src={imageData!} className={cn("w-full h-full object-cover", f.class)} alt={f.name} />
                      </div>
                      <span className="text-xs font-medium text-white/80">{f.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeTool === "adjust" && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <Sun className="w-5 h-5 text-white/70" />
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={adjustments.brightness}
                      onChange={(e) => setAdjustments({ ...adjustments, brightness: Number(e.target.value) })}
                      className="flex-1 accent-white h-1 bg-white/20 rounded-full appearance-none"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Contrast className="w-5 h-5 text-white/70" />
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={adjustments.contrast}
                      onChange={(e) => setAdjustments({ ...adjustments, contrast: Number(e.target.value) })}
                      className="flex-1 accent-white h-1 bg-white/20 rounded-full appearance-none"
                    />
                  </div>
                </div>
              )}

              {activeTool === "stickers" && (
                <div className="grid grid-cols-7 gap-4 p-4 max-h-40 overflow-y-auto">
                  {STICKERS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => addSticker(s)}
                      className="text-3xl hover:scale-125 transition-transform"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Main Tabs */}
              <div className="flex justify-around pt-2 px-2">
                <button
                  onClick={() => setActiveTool(activeTool === "filters" ? "none" : "filters")}
                  className={cn(
                    "p-2 rounded-xl flex flex-col items-center gap-1",
                    activeTool === "filters" ? "text-white" : "text-white/50",
                  )}
                >
                  <Palette className="w-6 h-6" />
                  <span className="text-[10px]">Filtros</span>
                </button>
                <button
                  onClick={() => setActiveTool(activeTool === "adjust" ? "none" : "adjust")}
                  className={cn(
                    "p-2 rounded-xl flex flex-col items-center gap-1",
                    activeTool === "adjust" ? "text-white" : "text-white/50",
                  )}
                >
                  <Sun className="w-6 h-6" />
                  <span className="text-[10px]">Ajustes</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- TEXT EDITOR OVERLAY --- */}
        <AnimatePresence>
          {isEditingText && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-6"
            >
              <div className="w-full flex justify-between items-center absolute top-4 px-4">
                <button onClick={() => setIsEditingText(false)} className="text-white">
                  Cancelar
                </button>
                <button onClick={addText} className="text-white font-bold bg-white/20 px-4 py-2 rounded-full">
                  Listo
                </button>
              </div>

              <div className="flex-1 flex items-center w-full">
                <input
                  autoFocus
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Escribe algo..."
                  className={cn(
                    "w-full bg-transparent text-center text-4xl outline-none placeholder-white/30",
                    FONTS.find((f) => f.id === activeFont)?.class,
                  )}
                  style={{ color: activeColor }}
                />
              </div>

              <div className="w-full space-y-4 mb-8">
                {/* Fonts */}
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide justify-center">
                  {FONTS.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => setActiveFont(font.id)}
                      className={cn(
                        "px-4 py-2 rounded-full border text-sm whitespace-nowrap",
                        activeFont === font.id
                          ? "bg-white text-black border-white"
                          : "bg-black/50 text-white border-white/30",
                      )}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
                {/* Colors */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide justify-center">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setActiveColor(color)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2",
                        activeColor === color ? "border-white scale-110" : "border-transparent",
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
