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
  Images,
  Sliders,
  PenTool,
  Wand2,
  Undo2,
  Zap,
  RotateCcw,
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

// --- GOOGLE FONTS ---
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

// --- MATH UTILS ---
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
  // ESTADOS
  const [step, setStep] = useState<"camera" | "edit" | "publish">("camera");
  const [imageData, setImageData] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

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
  
  // PREMIUM
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Gestos
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

  // Iniciar cámara cuando se abre
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        },
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraReady(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !cameraReady) return;
    
    const canvas = document.createElement("canvas");
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Flip horizontal si es cámara frontal
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setImageData(dataUrl);
    stopCamera();
    setStep("edit");
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(30);
  }, [cameraReady, facingMode, stopCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  }, []);

  // Efectos
  useEffect(() => {
    setNavigationHidden(isOpen);
    
    if (isOpen && step === "camera" && !imageData) {
      startCamera();
    }
    
    if (!isOpen) {
      stopCamera();
      setStep("camera");
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
  }, [isOpen, step, imageData, startCamera, stopCamera, setNavigationHidden]);

  useEffect(() => {
    if (step === "camera" && isOpen && !imageData) {
      startCamera();
    }
  }, [facingMode, step, isOpen, imageData, startCamera]);

  // --- FUNCIONES ---
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
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  const handleBack = () => {
    if (step === "publish") {
      setStep("edit");
    } else if (step === "edit") {
      setStep("camera");
      setImageData(null);
      setOverlays([]);
      setHistory([]);
      setDrawingDataUrl(null);
    } else {
      onClose();
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

  const getTextStyles = (item: OverlayItem) => {
    const baseStyles: React.CSSProperties = {
      fontFamily: item.fontFamily,
      fontSize: "40px",
      textAlign: item.align,
    };

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

  const getCombinedImageFilter = () => {
    const parts: string[] = [];
    
    const filterDef = IMAGE_FILTERS.find(f => f.id === activeFilter);
    if (filterDef && filterDef.filter) {
      parts.push(filterDef.filter);
    }
    
    const adjustmentFilter = generateFilterCSS(imageAdjustments);
    if (adjustmentFilter) {
      parts.push(adjustmentFilter);
    }
    
    return parts.join(" ") || "none";
  };

  const handlePublish = async () => {
    setIsUploading(true);
    if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
    
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
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageData(ev.target?.result as string);
        stopCamera();
        setStep("edit");
        if (navigator.vibrate) navigator.vibrate(20);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  const isEditing = overlays.some((o) => o.isEditing);
  const showSidebar = step === "edit" && !isDragging && !isEditing && showTools === "none";

  return (
    <AnimatePresence>
      <style>{`@import url('${GOOGLE_FONTS_URL}');`}</style>
      <style>{`
        .glass-premium { 
          background: rgba(0, 0, 0, 0.4); 
          backdrop-filter: blur(24px); 
          -webkit-backdrop-filter: blur(24px); 
        }
        .glass-button { 
          background: rgba(255, 255, 255, 0.12); 
          backdrop-filter: blur(16px); 
          -webkit-backdrop-filter: blur(16px); 
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-button:active { 
          transform: scale(0.92); 
          background: rgba(255, 255, 255, 0.18);
        }
        .no-select { 
          -webkit-user-select: none; 
          user-select: none; 
          -webkit-touch-callout: none; 
        }
        .safe-top { padding-top: env(safe-area-inset-top, 20px); }
        .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 20px); }
        @keyframes glitch {
          0%, 100% { text-shadow: -2px 0 #FF3B5C, 2px 0 #3B82F6; }
          25% { text-shadow: 2px 0 #FF3B5C, -2px 0 #3B82F6; }
          50% { text-shadow: -2px 0 #3B82F6, 2px 0 #FF3B5C; }
          75% { text-shadow: 2px 0 #3B82F6, -2px 0 #FF3B5C; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black text-white flex flex-col overflow-hidden touch-none no-select"
        onMouseUp={handlePointerUp}
        onTouchEnd={handlePointerUp}
        onMouseMove={(e) => isDragging && handlePointerMove(e)}
        onTouchMove={(e) => isDragging && handlePointerMove(e)}
      >
        {/* === HEADER === */}
        <motion.header 
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="absolute top-0 left-0 right-0 z-50 safe-top"
        >
          <div className="flex justify-between items-center p-4">
            {/* Botón Atrás/Cerrar */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleBack}
              className="glass-button w-11 h-11 rounded-full flex items-center justify-center"
            >
              {step === "camera" ? <X size={22} /> : <ChevronLeft size={24} />}
            </motion.button>

            {/* Botones de acción derecha */}
            <div className="flex items-center gap-3">
              {/* Undo - Solo en edit */}
              {step === "edit" && history.length > 0 && !isDragging && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleUndo}
                  className="glass-button w-11 h-11 rounded-full flex items-center justify-center"
                >
                  <Undo2 size={20} />
                </motion.button>
              )}

              {/* Flip camera - Solo en camera */}
              {step === "camera" && cameraReady && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={switchCamera}
                  className="glass-button w-11 h-11 rounded-full flex items-center justify-center"
                >
                  <RotateCcw size={20} />
                </motion.button>
              )}

              {/* Siguiente - Solo en edit */}
              {step === "edit" && !isDragging && !isEditing && (
                <motion.button
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep("publish")}
                  className="h-11 px-5 bg-white text-black rounded-full font-semibold text-sm flex items-center gap-2 shadow-lg shadow-white/20"
                >
                  Siguiente
                  <ChevronRight size={18} />
                </motion.button>
              )}
            </div>
          </div>
        </motion.header>

        {/* === MAIN CONTENT === */}
        <div className="flex-1 relative flex items-center justify-center">
          
          {/* CAMERA VIEW */}
          {step === "camera" && (
            <div className="absolute inset-0 bg-zinc-950">
              {/* Video feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "absolute inset-0 w-full h-full object-cover",
                  facingMode === "user" && "scale-x-[-1]"
                )}
              />
              
              {/* Loading state */}
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
                  <div className="flex flex-col items-center gap-4">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
                    />
                    <p className="text-white/50 text-sm">Iniciando cámara...</p>
                  </div>
                </div>
              )}

              {/* Bottom controls */}
              <div className="absolute bottom-0 left-0 right-0 safe-bottom">
                <div className="flex items-end justify-between px-6 pb-8">
                  
                  {/* Gallery button - Bottom left */}
                  <motion.label
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    whileTap={{ scale: 0.92 }}
                    className="cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-2xl glass-button flex items-center justify-center overflow-hidden">
                      <Images size={24} className="text-white/90" />
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleGallerySelect}
                      className="hidden"
                    />
                  </motion.label>

                  {/* Capture button - Center */}
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={capturePhoto}
                    disabled={!cameraReady}
                    className="relative group"
                  >
                    {/* Outer ring */}
                    <div className="w-20 h-20 rounded-full border-[3px] border-white/80 flex items-center justify-center">
                      {/* Inner circle */}
                      <div className="w-16 h-16 rounded-full bg-white group-active:bg-white/70 transition-colors" />
                    </div>
                    {/* Pulse animation when ready */}
                    {cameraReady && (
                      <div 
                        className="absolute inset-0 rounded-full border-2 border-white/40"
                        style={{ animation: "pulse-ring 2s ease-in-out infinite" }}
                      />
                    )}
                  </motion.button>

                  {/* Spacer for symmetry */}
                  <div className="w-14 h-14" />
                </div>
              </div>
            </div>
          )}

          {/* EDIT VIEW */}
          {step === "edit" && imageData && (
            <div
              ref={containerRef}
              className="relative w-full h-full max-w-[500px] aspect-[9/16] bg-black shadow-2xl overflow-hidden"
              onClick={handleCanvasClick}
            >
              {/* Imagen con filtros */}
              <img
                src={imageData}
                className="w-full h-full object-cover pointer-events-none transition-all duration-300"
                style={{ filter: getCombinedImageFilter() }}
              />
              
              {/* Viñeta */}
              {imageAdjustments.vignette > 0 && (
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: generateVignetteCSS(imageAdjustments.vignette) }}
                />
              )}
              
              {/* Dibujo */}
              {drawingDataUrl && (
                <img 
                  src={drawingDataUrl} 
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              )}

              {/* Overlays */}
              {overlays.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
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
                </motion.div>
              ))}

              {/* Trash zone */}
              <AnimatePresence>
                {isDragging && (
                  <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none z-50"
                  >
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200",
                      selectedId && overlays.find(o => o.id === selectedId)?.y && overlays.find(o => o.id === selectedId)!.y > 0.8
                        ? "bg-red-500/90 scale-125"
                        : "glass-button text-red-400"
                    )}>
                      <Trash2 size={26} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* PUBLISH VIEW */}
          {step === "publish" && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md px-6"
            >
              {/* Preview */}
              <div className="relative w-40 h-72 mx-auto mb-8 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                {imageData && (
                  <img 
                    src={imageData} 
                    className="w-full h-full object-cover"
                    style={{ filter: getCombinedImageFilter() }}
                  />
                )}
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold">Listo para compartir</h3>
                <p className="text-white/50 text-sm mt-1">Tu historia llegará a todos</p>
              </div>
              
              <div className="glass-button rounded-2xl p-4 mb-6">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Añade un comentario..."
                  className="w-full bg-transparent outline-none text-white placeholder:text-white/30 resize-none h-24 text-sm"
                />
              </div>
              
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handlePublish}
                disabled={isUploading}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    >
                      <Sparkles size={20} />
                    </motion.div>
                    Publicando...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Publicar Historia
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* === SIDEBAR TOOLS === */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-40"
            >
              {[
                { icon: Type, tool: "text" as const, label: "Texto" },
                { icon: Wand2, tool: "textStyles" as const, label: "Estilos" },
                { icon: Sparkles, tool: "stickers" as const, label: "Stickers" },
                { icon: Palette, tool: "filters" as const, label: "Filtros" },
                { icon: Sliders, tool: "adjustments" as const, label: "Ajustes" },
                { icon: PenTool, tool: "drawing" as const, label: "Dibujar" },
              ].map(({ icon: Icon, tool, label }, index) => (
                <motion.button
                  key={tool}
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.08, x: 4 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tool === "text") {
                      handleCanvasClick(e as any);
                    } else {
                      setShowTools(tool);
                      setSelectedId(null);
                    }
                    if (navigator.vibrate) navigator.vibrate(8);
                  }}
                  className="w-12 h-12 rounded-2xl glass-button flex items-center justify-center group"
                >
                  <Icon size={20} className="text-white/90" />
                  
                  {/* Tooltip */}
                  <motion.span 
                    initial={{ opacity: 0, x: -4 }}
                    whileHover={{ opacity: 1, x: 0 }}
                    className="absolute left-full ml-3 px-3 py-1.5 bg-black/90 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none"
                  >
                    {label}
                  </motion.span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* === TOOL PANELS === */}
        <AnimatePresence>
          {/* Filters */}
          {showTools === "filters" && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              className="absolute bottom-0 left-0 right-0 glass-premium border-t border-white/5 rounded-t-3xl z-50 safe-bottom"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-semibold text-lg">Filtros</h3>
                  <button 
                    onClick={() => setShowTools("none")} 
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
                  {IMAGE_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setActiveFilter(f.id);
                        if (navigator.vibrate) navigator.vibrate(10);
                      }}
                      className="flex flex-col items-center gap-2 flex-shrink-0"
                    >
                      <div
                        className={cn(
                          "w-20 h-28 rounded-xl overflow-hidden border-2 transition-all",
                          activeFilter === f.id ? "border-white scale-105" : "border-transparent opacity-60",
                        )}
                      >
                        <img src={imageData!} className="w-full h-full object-cover" style={{ filter: f.filter }} />
                      </div>
                      <span className="text-[11px] font-medium text-white/70">{f.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Stickers */}
          {showTools === "stickers" && (
            <StickerPicker 
              onStickerSelect={addSticker}
              onClose={() => setShowTools("none")}
            />
          )}

          {/* Adjustments */}
          {showTools === "adjustments" && (
            <ImageAdjustments
              adjustments={imageAdjustments}
              onAdjustmentsChange={setImageAdjustments}
              onClose={() => setShowTools("none")}
              onApply={() => setShowTools("none")}
            />
          )}

          {/* Text Styles */}
          {showTools === "textStyles" && (
            <TextStylePicker
              selectedStyle={currentTextStyle}
              selectedGradient={currentTextGradient}
              currentColor={currentColor}
              onStyleChange={(style) => {
                setCurrentTextStyle(style);
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

          {/* Drawing */}
          {showTools === "drawing" && containerRef.current && (
            <DrawingCanvas
              width={containerRef.current.offsetWidth * 2}
              height={containerRef.current.offsetHeight * 2}
              onSave={handleDrawingSave}
              onClose={() => setShowTools("none")}
            />
          )}

          {/* Text Edit Tools */}
          {isEditing && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="absolute bottom-0 left-0 right-0 glass-premium p-4 z-[150] flex flex-col gap-4 safe-bottom border-t border-white/5"
            >
              {/* Botón efectos */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowTools("textStyles")}
                  className="px-4 py-2 rounded-full bg-white/10 text-sm font-medium flex items-center gap-2"
                >
                  <Wand2 size={16} />
                  Efectos de Texto
                </button>
              </div>

              {/* Fuentes */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1">
                {FONTS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      const id = overlays.find((o) => o.isEditing)?.id;
                      if (id) updateOverlay(id, { fontFamily: f.family });
                      setCurrentFont(f.id);
                      if (navigator.vibrate) navigator.vibrate(8);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap flex-shrink-0",
                      overlays.find((o) => o.isEditing)?.fontFamily === f.family
                        ? "bg-white text-black border-white"
                        : "border-white/20 text-white/70",
                    )}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              {/* Alineación y Colores */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-1 bg-white/10 rounded-xl p-1">
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
                        "p-2 rounded-lg transition-colors",
                        overlays.find((o) => o.isEditing)?.align === b.value ? "bg-white text-black" : "text-white/60",
                      )}
                    >
                      {b.icon}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1.5 overflow-x-auto flex-1 max-w-[200px] scrollbar-hide">
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
                        "w-7 h-7 rounded-full shrink-0 transition-transform ring-2 ring-offset-2 ring-offset-black",
                        overlays.find((o) => o.isEditing)?.color === c && !overlays.find((o) => o.isEditing)?.textGradient
                          ? "scale-110 ring-white"
                          : "ring-transparent",
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <button
                  onClick={() => {
                    const id = overlays.find((o) => o.isEditing)?.id;
                    if (id) updateOverlay(id, { isEditing: false });
                    if (navigator.vibrate) navigator.vibrate(15);
                  }}
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center"
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
