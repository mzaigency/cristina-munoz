import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Type,
  Sparkles,
  Trash2,
  ChevronRight,
  Send,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
  ChevronLeft,
  Image as ImageIcon,
  Camera,
  Sliders,
  PenTool,
  Wand2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/contexts/NavigationContext";
import { 
  TextStylePicker, 
  StickerPicker, 
  ImageAdjustments, 
  DrawingCanvas,
  generateFilterCSS,
  generateVignetteCSS 
} from "./story-creator";
import { 
  STORY_FONTS, 
  STORY_COLORS, 
  IMAGE_FILTERS, 
  TEXT_STYLES, 
  TEXT_GRADIENTS,
  IMAGE_ADJUSTMENTS 
} from "@/constants/story-assets";

// --- CONFIGURACIÓN Y ESTILOS ---
const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Bebas+Neue&family=Caveat:wght@700&family=Cinzel:wght@700&family=Dancing+Script:wght@700&family=Inter:wght@400;900&family=Merriweather:ital,wght@1,900&family=Permanent+Marker&family=Playfair+Display:ital,wght@1,600&family=Roboto+Mono:wght@500&family=Montserrat:wght@900&family=Oswald:wght@700&family=Pacifico&family=Lobster&family=Sacramento&family=Righteous&display=swap";

const FONTS = [
  { id: "modern", name: "Modern", family: "'Inter', sans-serif", class: "font-black tracking-tighter uppercase" },
  { id: "editorial", name: "Editorial", family: "'Playfair Display', serif", class: "italic font-semibold tracking-wide" },
  { id: "street", name: "Street", family: "'Permanent Marker', cursive", class: "font-normal" },
  { id: "poster", name: "Poster", family: "'Bebas Neue', sans-serif", class: "tracking-widest text-lg" },
  { id: "luxury", name: "Lujo", family: "'Cinzel', serif", class: "font-bold tracking-widest" },
  { id: "hand", name: "Firma", family: "'Caveat', cursive", class: "font-bold text-xl" },
  { id: "magazine", name: "Vogue", family: "'Abril Fatface', cursive", class: "font-normal tracking-wide" },
  { id: "script", name: "Elegante", family: "'Dancing Script', cursive", class: "font-bold" },
  { id: "tech", name: "Tech", family: "'Roboto Mono', monospace", class: "font-medium tracking-tight" },
  { id: "bold", name: "Bold", family: "'Merriweather', serif", class: "font-black" },
];

const COLORS = STORY_COLORS.slice(0, 12);

// --- TIPOS ---
interface OverlayItem {
  id: string;
  type: "text" | "sticker" | "drawing";
  content: string;
  fontFamily: string;
  color: string;
  align: "left" | "center" | "right";
  x: number;
  y: number;
  scale: number;
  rotation: number;
  isEditing: boolean;
  textStyle?: string;
  textGradient?: string | null;
}

// --- MATH UTILS FOR GESTURES ---
const getDistance = (p1: React.Touch, p2: React.Touch) => Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
const getAngle = (p1: React.Touch, p2: React.Touch) =>
  (Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX) * 180) / Math.PI;

interface StoryCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess: () => void;
}

export function StoryCreator({ isOpen, onClose, tenantId, onSuccess }: StoryCreatorProps) {
  // ESTADOS PRINCIPALES
  const [step, setStep] = useState<"capture" | "edit" | "publish">("capture");
  const [imageData, setImageData] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState("");

  // EDITOR STATE
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [history, setHistory] = useState<OverlayItem[][]>([]);
  const [activeFilter, setActiveFilter] = useState("none");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // HERRAMIENTAS
  const [showTools, setShowTools] = useState<"none" | "filters" | "stickers" | "adjustments" | "drawing" | "textStyles">("none");
  const [currentFont, setCurrentFont] = useState(FONTS[0].id);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [currentAlign, setCurrentAlign] = useState<"left" | "center" | "right">("center");
  
  // NUEVOS ESTADOS PREMIUM
  const [currentTextStyle, setCurrentTextStyle] = useState("normal");
  const [currentTextGradient, setCurrentTextGradient] = useState<string | null>(null);
  const [imageAdjustments, setImageAdjustments] = useState<Record<string, number>>(() => {
    const defaults: Record<string, number> = {};
    IMAGE_ADJUSTMENTS.forEach(adj => {
      defaults[adj.id] = adj.default;
    });
    return defaults;
  });
  const [drawingDataUrl, setDrawingDataUrl] = useState<string | null>(null);

  // REFS
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Variables para gestos
  const gestureRef = useRef({
    startX: 0,
    startY: 0,
    initialItemX: 0,
    initialItemY: 0,
    initialScale: 1,
    initialRotation: 0,
    startDist: 0,
    startAngle: 0,
    isMultiTouch: false,
  });

  const { setNavigationHidden } = useNavigation();

  useEffect(() => {
    setNavigationHidden(isOpen);
    if (!isOpen) {
      setStep("capture");
      setImageData(null);
      setOverlays([]);
      setHistory([]);
      setCaption("");
      setIsUploading(false);
      setActiveFilter("none");
      setDrawingDataUrl(null);
      setImageAdjustments(() => {
        const defaults: Record<string, number> = {};
        IMAGE_ADJUSTMENTS.forEach(adj => {
          defaults[adj.id] = adj.default;
        });
        return defaults;
      });
    }
  }, [isOpen]);

  // --- FUNCIONES AUXILIARES ---
  const updateOverlay = (id: string, updates: Partial<OverlayItem>) => {
    setOverlays((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };

  const addSticker = (sticker: string) => {
    const newSticker: OverlayItem = {
      id: Date.now().toString(),
      type: "sticker",
      content: sticker,
      fontFamily: "",
      color: "",
      align: "center",
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      isEditing: false,
    };
    saveToHistory();
    setOverlays([...overlays, newSticker]);
    setShowTools("none");
    
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const saveToHistory = () => {
    setHistory((prev) => [...prev.slice(-10), JSON.parse(JSON.stringify(overlays))]);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setOverlays(previousState);
      setHistory((prev) => prev.slice(0, -1));
      toast.success("Deshecho", { position: "top-center", duration: 1000 });
    } else {
      if (step === "edit") {
        setStep("capture");
        setImageData(null);
      }
    }
  };

  // --- GESTOS ---
  const handlePointerDown = (e: React.TouchEvent | React.MouseEvent, id: string) => {
    if (overlays.find((o) => o.id === id)?.isEditing) return;
    e.stopPropagation();

    saveToHistory();
    setSelectedId(id);
    setIsDragging(true);

    const item = overlays.find((o) => o.id === id);
    if (!item || !containerRef.current) return;

    if ("touches" in e && e.touches.length === 2) {
      gestureRef.current.isMultiTouch = true;
      gestureRef.current.startDist = getDistance(e.touches[0], e.touches[1]);
      gestureRef.current.startAngle = getAngle(e.touches[0], e.touches[1]);
      gestureRef.current.initialScale = item.scale;
      gestureRef.current.initialRotation = item.rotation;
    } else {
      const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      gestureRef.current.isMultiTouch = false;
      gestureRef.current.startX = clientX;
      gestureRef.current.startY = clientY;
      gestureRef.current.initialItemX = item.x;
      gestureRef.current.initialItemY = item.y;
    }
  };

  const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!selectedId || !isDragging || !containerRef.current) return;

    const container = containerRef.current.getBoundingClientRect();

    if ("touches" in e && e.touches.length === 2 && gestureRef.current.isMultiTouch) {
      e.preventDefault();
      const currentDist = getDistance(e.touches[0], e.touches[1]);
      const currentAngle = getAngle(e.touches[0], e.touches[1]);

      const scaleFactor = currentDist / gestureRef.current.startDist;
      const rotationDiff = currentAngle - gestureRef.current.startAngle;

      setOverlays((prev) =>
        prev.map((o) =>
          o.id === selectedId
            ? {
                ...o,
                scale: Math.max(0.5, Math.min(4, gestureRef.current.initialScale * scaleFactor)),
                rotation: gestureRef.current.initialRotation + rotationDiff,
              }
            : o,
        ),
      );
    } else if (!gestureRef.current.isMultiTouch) {
      const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      const deltaX = clientX - gestureRef.current.startX;
      const deltaY = clientY - gestureRef.current.startY;

      const deltaPercentX = deltaX / container.width;
      const deltaPercentY = deltaY / container.height;

      setOverlays((prev) =>
        prev.map((o) =>
          o.id === selectedId
            ? {
                ...o,
                x: gestureRef.current.initialItemX + deltaPercentX,
                y: gestureRef.current.initialItemY + deltaPercentY,
              }
            : o,
        ),
      );
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);

    if (selectedId && containerRef.current) {
      const item = overlays.find((o) => o.id === selectedId);
      if (item && item.y > 0.85) {
        setOverlays((prev) => prev.filter((o) => o.id !== selectedId));
        if (navigator.vibrate) navigator.vibrate(50);
        setSelectedId(null);
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest(".overlay-item")) return;

    if (showTools !== "none" || selectedId) {
      setShowTools("none");
      setSelectedId(null);
      return;
    }

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const newText: OverlayItem = {
      id: Date.now().toString(),
      type: "text",
      content: "",
      fontFamily: FONTS.find((f) => f.id === currentFont)?.family || FONTS[0].family,
      color: currentColor,
      align: currentAlign,
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
      scale: 1,
      rotation: 0,
      isEditing: true,
      textStyle: currentTextStyle,
      textGradient: currentTextGradient,
    };
    saveToHistory();
    setOverlays([...overlays, newText]);
    setSelectedId(newText.id);
  };

  // Generar estilos de texto
  const getTextStyles = (item: OverlayItem) => {
    const baseStyles: React.CSSProperties = {
      fontFamily: item.fontFamily,
      fontSize: "40px",
      textAlign: item.align,
    };

    // Aplicar degradado si existe
    if (item.textGradient) {
      const gradient = TEXT_GRADIENTS.find(g => g.id === item.textGradient);
      if (gradient) {
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, ${gradient.colors.join(", ")})`,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
        };
      }
    }

    // Aplicar estilo de texto
    const textStyleDef = TEXT_STYLES.find(s => s.id === item.textStyle);
    if (textStyleDef && item.textStyle !== "normal") {
      return {
        ...baseStyles,
        color: item.color,
        ...textStyleDef.css,
      };
    }

    return {
      ...baseStyles,
      color: item.color,
      textShadow: "0 2px 10px rgba(0,0,0,0.5)",
    };
  };

  // Generar filtro de imagen combinado
  const getCombinedImageFilter = () => {
    const parts: string[] = [];
    
    // Filtro preestablecido
    const filterDef = IMAGE_FILTERS.find(f => f.id === activeFilter);
    if (filterDef && filterDef.filter) {
      parts.push(filterDef.filter);
    }
    
    // Ajustes manuales
    const adjustmentFilter = generateFilterCSS(imageAdjustments);
    if (adjustmentFilter) {
      parts.push(adjustmentFilter);
    }
    
    return parts.join(" ") || "none";
  };

  const handlePublish = async () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      toast.success("¡Historia publicada!", { icon: "🎉" });
      onSuccess();
      onClose();
    }, 1500);
  };

  const handleDrawingSave = (dataUrl: string) => {
    setDrawingDataUrl(dataUrl);
    setShowTools("none");
    toast.success("Dibujo aplicado", { position: "top-center", duration: 1000 });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <style>{`@import url('${GOOGLE_FONTS_URL}');`}</style>
      <style>{`
        .glass-ios { background: rgba(30, 30, 30, 0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); }
        .no-select { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
        @keyframes glitch {
          0%, 100% { text-shadow: -2px 0 #FF3B5C, 2px 0 #3B82F6; }
          25% { text-shadow: 2px 0 #FF3B5C, -2px 0 #3B82F6; }
          50% { text-shadow: -2px 0 #3B82F6, 2px 0 #FF3B5C; }
          75% { text-shadow: 2px 0 #3B82F6, -2px 0 #FF3B5C; }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black text-white flex flex-col font-sans overflow-hidden touch-none no-select"
        onMouseUp={handlePointerUp}
        onTouchEnd={handlePointerUp}
        onMouseMove={(e) => isDragging && handlePointerMove(e)}
        onTouchMove={(e) => isDragging && handlePointerMove(e)}
      >
        {/* --- HEADER --- */}
        <div className="absolute top-0 w-full z-50 flex justify-between items-center p-4 pt-safe-top bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          {step === "capture" ? (
            <button
              onClick={onClose}
              className="pointer-events-auto p-3 glass-ios rounded-full active:scale-90 transition-transform"
            >
              <X size={24} />
            </button>
          ) : (
            <button
              onClick={handleUndo}
              className="pointer-events-auto p-3 glass-ios rounded-full active:scale-90 transition-transform"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {step === "edit" && !isDragging && (
            <button
              onClick={() => setStep("publish")}
              className="pointer-events-auto px-6 py-2.5 bg-gradient-to-r from-primary to-pink-500 text-white rounded-full font-bold shadow-xl active:scale-95 transition-transform flex items-center gap-2"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* --- MAIN STAGE --- */}
        <div className="flex-1 relative flex items-center justify-center bg-zinc-950">
          {/* 1. CAPTURE */}
          {step === "capture" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="text-center">
                <h2 className="text-4xl font-black uppercase tracking-tight bg-gradient-to-r from-white via-primary to-pink-500 bg-clip-text text-transparent">
                  Crear Historia
                </h2>
                <p className="text-white/50 mt-2">Comparte tu mejor momento</p>
              </div>
              
              <div className="flex gap-6">
                <label className="flex flex-col items-center gap-3 cursor-pointer group">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-28 h-28 rounded-3xl bg-gradient-to-br from-pink-500/20 to-primary/20 border border-white/10 flex items-center justify-center"
                  >
                    <Camera size={44} className="text-pink-500" />
                  </motion.div>
                  <span className="font-bold text-sm">Cámara</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setImageData(ev.target?.result as string);
                          setStep("edit");
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>

                <label className="flex flex-col items-center gap-3 cursor-pointer group">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-28 h-28 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center"
                  >
                    <ImageIcon size={44} className="text-blue-500" />
                  </motion.div>
                  <span className="font-bold text-sm">Galería</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setImageData(ev.target?.result as string);
                          setStep("edit");
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </motion.div>
          )}

          {/* 2. EDIT CANVAS */}
          {step === "edit" && imageData && (
            <div
              ref={containerRef}
              className="relative w-full h-full max-w-[500px] aspect-[9/16] bg-black shadow-2xl overflow-hidden"
              onClick={handleCanvasClick}
            >
              {/* Imagen base con filtros */}
              <img
                src={imageData}
                className="w-full h-full object-cover pointer-events-none transition-all duration-300"
                style={{ filter: getCombinedImageFilter() }}
              />
              
              {/* Viñeta overlay */}
              {imageAdjustments.vignette > 0 && (
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: generateVignetteCSS(imageAdjustments.vignette) }}
                />
              )}
              
              {/* Dibujo overlay */}
              {drawingDataUrl && (
                <img 
                  src={drawingDataUrl} 
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              )}

              {/* Overlays (texto y stickers) */}
              {overlays.map((item) => (
                <div
                  key={item.id}
                  className={cn("overlay-item absolute flex items-center justify-center", item.isEditing && "z-[100]")}
                  style={{
                    left: `${item.x * 100}%`,
                    top: `${item.y * 100}%`,
                    transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
                    cursor: "grab",
                    touchAction: "none",
                  }}
                  onMouseDown={(e) => handlePointerDown(e, item.id)}
                  onTouchStart={(e) => handlePointerDown(e, item.id)}
                >
                  <div
                    className={cn(
                      "relative transition-all duration-200",
                      isDragging && selectedId === item.id ? "opacity-80" : "opacity-100",
                      isDragging && selectedId === item.id && item.y > 0.8 && "scale-50 opacity-50 grayscale",
                    )}
                  >
                    {item.type === "text" ? (
                      item.isEditing ? (
                        <textarea
                          autoFocus
                          value={item.content}
                          onChange={(e) => updateOverlay(item.id, { content: e.target.value })}
                          onBlur={() => updateOverlay(item.id, { isEditing: false })}
                          className="bg-transparent outline-none resize-none overflow-hidden text-center min-w-[50px]"
                          placeholder="Escribe..."
                          style={getTextStyles(item) as React.CSSProperties}
                          ref={(el) => {
                            if (el) {
                              el.style.height = "auto";
                              el.style.height = el.scrollHeight + "px";
                            }
                          }}
                        />
                      ) : (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOverlay(item.id, { isEditing: true });
                          }}
                          className="whitespace-pre-wrap leading-tight"
                          style={getTextStyles(item) as React.CSSProperties}
                        >
                          {item.content || "Texto"}
                        </div>
                      )
                    ) : (
                      <div className="text-[80px] drop-shadow-xl">{item.content}</div>
                    )}
                  </div>
                </div>
              ))}

              {/* TRASH CAN */}
              <AnimatePresence>
                {isDragging && (
                  <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none z-50"
                  >
                    <div className="glass-ios w-16 h-16 rounded-full flex items-center justify-center text-red-500 border-red-500/30 shadow-[0_0_30px_rgba(255,0,0,0.2)]">
                      <Trash2 size={28} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 3. PUBLISH SCREEN */}
          {step === "publish" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md px-8"
            >
              <div className="text-center mb-8">
                <h3 className="text-3xl font-black bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
                  Listo para compartir
                </h3>
                <p className="text-white/50 mt-2">Tu historia llegará a todos tus seguidores</p>
              </div>
              
              <div className="glass-ios rounded-2xl p-4 mb-6">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Añade un comentario..."
                  className="w-full bg-transparent outline-none text-white text-lg placeholder:text-white/30 resize-none h-32"
                />
              </div>
              
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handlePublish}
                disabled={isUploading}
                className="w-full py-4 bg-gradient-to-r from-primary to-pink-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/25"
              >
                {isUploading ? <Sparkles className="animate-spin" /> : <Send />} 
                {isUploading ? "Publicando..." : "Publicar Historia"}
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* --- SIDEBAR TOOLS PREMIUM --- */}
        {step === "edit" && !isDragging && !overlays.some((o) => o.isEditing) && showTools === "none" && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40"
          >
            {[
              { icon: Type, tool: "text" as const, label: "Texto" },
              { icon: Wand2, tool: "textStyles" as const, label: "Estilos" },
              { icon: Sparkles, tool: "stickers" as const, label: "Stickers" },
              { icon: Palette, tool: "filters" as const, label: "Filtros" },
              { icon: Sliders, tool: "adjustments" as const, label: "Ajustes" },
              { icon: PenTool, tool: "drawing" as const, label: "Dibujar" },
            ].map(({ icon: Icon, tool, label }) => (
              <motion.button
                key={tool}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (tool === "text") {
                    handleCanvasClick(e as any);
                  } else {
                    setShowTools(tool);
                    setSelectedId(null);
                  }
                }}
                className="w-12 h-12 rounded-full glass-ios flex items-center justify-center shadow-lg transition-transform group relative"
              >
                <Icon size={22} />
                <span className="absolute left-full ml-2 px-2 py-1 bg-black/80 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* --- PANELES DE HERRAMIENTAS --- */}
        <AnimatePresence>
          {/* Filtros */}
          {showTools === "filters" && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="absolute bottom-0 left-0 right-0 glass-ios border-t border-white/10 p-6 rounded-t-[2rem] z-50 pb-safe"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Filtros</h3>
                <button onClick={() => setShowTools("none")} className="p-1.5 bg-white/10 rounded-full">
                  <X size={16} />
                </button>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {IMAGE_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className="flex flex-col items-center gap-2 group flex-shrink-0"
                  >
                    <div
                      className={cn(
                        "w-20 h-24 rounded-xl overflow-hidden border-2 transition-all",
                        activeFilter === f.id ? "border-primary scale-105" : "border-transparent opacity-70",
                      )}
                    >
                      <img src={imageData!} className="w-full h-full object-cover" style={{ filter: f.filter }} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">{f.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Stickers Premium */}
          {showTools === "stickers" && (
            <StickerPicker 
              onStickerSelect={addSticker}
              onClose={() => setShowTools("none")}
            />
          )}

          {/* Ajustes de Imagen */}
          {showTools === "adjustments" && (
            <ImageAdjustments
              adjustments={imageAdjustments}
              onAdjustmentsChange={setImageAdjustments}
              onClose={() => setShowTools("none")}
              onApply={() => setShowTools("none")}
            />
          )}

          {/* Estilos de Texto */}
          {showTools === "textStyles" && (
            <TextStylePicker
              selectedStyle={currentTextStyle}
              selectedGradient={currentTextGradient}
              currentColor={currentColor}
              onStyleChange={(style) => {
                setCurrentTextStyle(style);
                // Aplicar a texto seleccionado si existe
                if (selectedId) {
                  updateOverlay(selectedId, { textStyle: style });
                }
              }}
              onGradientChange={(gradient) => {
                setCurrentTextGradient(gradient);
                if (selectedId) {
                  updateOverlay(selectedId, { textGradient: gradient });
                }
              }}
              onClose={() => setShowTools("none")}
            />
          )}

          {/* Dibujo */}
          {showTools === "drawing" && containerRef.current && (
            <DrawingCanvas
              width={containerRef.current.offsetWidth * 2}
              height={containerRef.current.offsetHeight * 2}
              onSave={handleDrawingSave}
              onClose={() => setShowTools("none")}
            />
          )}

          {/* TEXT EDIT TOOLS */}
          {overlays.some((o) => o.isEditing) && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="absolute bottom-0 left-0 right-0 glass-ios p-4 z-[150] flex flex-col gap-4 pb-safe border-t border-white/10"
            >
              {/* Botón de estilos */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowTools("textStyles")}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-pink-500/20 border border-primary/30 text-sm font-medium flex items-center gap-2"
                >
                  <Wand2 size={16} />
                  Efectos de Texto
                </button>
              </div>

              {/* Fuentes */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide justify-start px-2">
                {FONTS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      const id = overlays.find((o) => o.isEditing)?.id;
                      if (id) updateOverlay(id, { fontFamily: f.family });
                      setCurrentFont(f.id);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap flex-shrink-0",
                      overlays.find((o) => o.isEditing)?.fontFamily === f.family
                        ? "bg-white text-black border-white"
                        : "border-white/20 text-white",
                    )}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              {/* Alineación y Colores */}
              <div className="flex items-center justify-between px-2">
                <div className="flex gap-1 bg-white/10 rounded-lg p-1">
                  {[
                    { icon: <AlignLeft size={16} />, value: "left" },
                    { icon: <AlignCenter size={16} />, value: "center" },
                    { icon: <AlignRight size={16} />, value: "right" },
                  ].map((b) => (
                    <button
                      key={b.value}
                      onClick={() => {
                        const id = overlays.find((o) => o.isEditing)?.id;
                        if (id) updateOverlay(id, { align: b.value as "left" | "center" | "right" });
                      }}
                      className={cn(
                        "p-2 rounded transition-colors",
                        overlays.find((o) => o.isEditing)?.align === b.value ? "bg-white text-black" : "text-white",
                      )}
                    >
                      {b.icon}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1.5 overflow-x-auto max-w-[180px] scrollbar-hide">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        const id = overlays.find((o) => o.isEditing)?.id;
                        if (id) updateOverlay(id, { color: c, textGradient: null });
                        setCurrentColor(c);
                        setCurrentTextGradient(null);
                      }}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 shrink-0 transition-transform",
                        overlays.find((o) => o.isEditing)?.color === c && !overlays.find((o) => o.isEditing)?.textGradient
                          ? "scale-110 border-white"
                          : "border-transparent",
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <button
                  onClick={() => {
                    const id = overlays.find((o) => o.isEditing)?.id;
                    if (id) updateOverlay(id, { isEditing: false });
                  }}
                  className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center active:scale-90"
                >
                  <Check size={20} strokeWidth={3} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
