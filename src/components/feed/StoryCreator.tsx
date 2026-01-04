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
  AlertCircle,
  LayoutGrid,
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
  GuideLines,
  TrashZone,
  generateFilterCSS,
  generateVignetteCSS 
} from "./story-creator";
import {
  WidgetPicker,
  PollWidget,
  QuestionBoxWidget,
  EmojiSliderWidget,
  type WidgetType
} from "./story-creator/widgets";
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
  type: "text" | "sticker" | "drawing" | "widget";
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
  textAnimation?: string;
  fontSize?: number;
  widgetType?: WidgetType;
  widgetConfig?: any;
}

// --- MATH UTILS ---
const getDistance = (p1: React.Touch, p2: React.Touch) => Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
const getAngle = (p1: React.Touch, p2: React.Touch) =>
  (Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX) * 180) / Math.PI;

// Snap-to-center thresholds
const SNAP_THRESHOLD = 0.035; // 3.5% of container
const SNAP_FRICTION = 0.5;
const TRASH_ZONE_START = 0.82;
const TRASH_ZONE_DELETE = 0.92;

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
  const [showTools, setShowTools] = useState<"none" | "filters" | "stickers" | "adjustments" | "drawing" | "textStyles" | "widgets">("none");
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [currentFont, setCurrentFont] = useState(FONTS[0].id);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [currentAlign, setCurrentAlign] = useState<"left" | "center" | "right">("center");
  
  // PREMIUM
  const [currentTextStyle, setCurrentTextStyle] = useState("normal");
  const [currentTextGradient, setCurrentTextGradient] = useState<string | null>(null);
  const [currentTextAnimation, setCurrentTextAnimation] = useState("none");
  const [currentFontSize, setCurrentFontSize] = useState(40);
  const [imageAdjustments, setImageAdjustments] = useState<Record<string, number>>(() => {
    const defaults: Record<string, number> = {};
    IMAGE_ADJUSTMENTS.forEach(adj => {
      defaults[adj.id] = adj.default;
    });
    return defaults;
  });
  const [drawingDataUrl, setDrawingDataUrl] = useState<string | null>(null);

  // UX STATES
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<"back" | "close" | null>(null);

  // REFS
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const textEditTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editingTextRef = useRef<HTMLTextAreaElement | null>(null);

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
    lastSnapH: false,
    lastSnapV: false,
    lastHapticTime: 0,
  });
  
  // Guide lines state
  const [showCenterGuideH, setShowCenterGuideH] = useState(false);
  const [showCenterGuideV, setShowCenterGuideV] = useState(false);
  const [trashZoneIntensity, setTrashZoneIntensity] = useState(0);

  const { setNavigationHidden } = useNavigation();

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return overlays.length > 0 || 
           drawingDataUrl !== null || 
           activeFilter !== "none" ||
           Object.entries(imageAdjustments).some(([key, value]) => {
             const defaultValue = IMAGE_ADJUSTMENTS.find(a => a.id === key)?.default ?? 0;
             return value !== defaultValue;
           });
  }, [overlays, drawingDataUrl, activeFilter, imageAdjustments]);

  // Visual Viewport API for keyboard handling
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;
      
      // Calculate keyboard height
      const keyboardH = window.innerHeight - viewport.height;
      setKeyboardHeight(keyboardH > 100 ? keyboardH : 0);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  // Start camera with proper 9:16 aspect ratio and 1x zoom
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Request camera with proper constraints for 9:16 aspect ratio
      const constraints: MediaStreamConstraints = {
        video: { 
          facingMode,
          aspectRatio: { ideal: 9/16 },
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Try to set zoom to 1x if supported
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities?.();
        if (capabilities && 'zoom' in capabilities) {
          try {
            await videoTrack.applyConstraints({
              advanced: [{ zoom: 1.0 } as any]
            });
          } catch (e) {
            // Zoom constraint not supported, continue without it
            console.log("Zoom constraint not supported");
          }
        }
      }
      
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
    
    const video = videoRef.current;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // Calculate 9:16 crop from center
    const targetAspect = 9 / 16;
    const videoAspect = videoWidth / videoHeight;
    
    let cropWidth: number, cropHeight: number, cropX: number, cropY: number;
    
    if (videoAspect > targetAspect) {
      // Video is wider - crop sides
      cropHeight = videoHeight;
      cropWidth = videoHeight * targetAspect;
      cropX = (videoWidth - cropWidth) / 2;
      cropY = 0;
    } else {
      // Video is taller - crop top/bottom
      cropWidth = videoWidth;
      cropHeight = videoWidth / targetAspect;
      cropX = 0;
      cropY = (videoHeight - cropHeight) / 2;
    }
    
    const canvas = document.createElement("canvas");
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Flip horizontal if front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    } else {
      ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    }
    
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setImageData(dataUrl);
    stopCamera();
    setStep("edit");
    
    // Haptic feedback - double pulse for capture
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
  }, [cameraReady, facingMode, stopCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    if (navigator.vibrate) navigator.vibrate(15);
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
      setShowDiscardDialog(false);
      setPendingAction(null);
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (textEditTimeoutRef.current) {
        clearTimeout(textEditTimeoutRef.current);
      }
    };
  }, []);

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
    // Don't close the panel - let user add more stickers
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
  };

  const addWidget = (widgetType: WidgetType) => {
    let defaultConfig: any = {};
    
    switch (widgetType) {
      case "poll":
        defaultConfig = { question: "", options: ["Sí", "No"] };
        break;
      case "question":
        defaultConfig = { prompt: "", placeholder: "Escribe tu respuesta..." };
        break;
      case "emoji_slider":
        defaultConfig = { question: "", emoji: "❤️" };
        break;
    }

    const newWidget: OverlayItem = {
      id: Date.now().toString(),
      type: "widget",
      content: "",
      fontFamily: "",
      color: "",
      align: "center",
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      isEditing: true,
      widgetType,
      widgetConfig: defaultConfig,
    };
    
    saveToHistory();
    setOverlays([...overlays, newWidget]);
    setSelectedId(newWidget.id);
    setShowWidgetPicker(false);
    if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
  };

  const updateWidgetConfig = (id: string, config: any) => {
    updateOverlay(id, { widgetConfig: config });
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

  const confirmDiscard = () => {
    setShowDiscardDialog(false);
    if (pendingAction === "back") {
      if (step === "edit") {
        setStep("camera");
        setImageData(null);
        setOverlays([]);
        setHistory([]);
        setDrawingDataUrl(null);
        setActiveFilter("none");
        setImageAdjustments(() => {
          const defaults: Record<string, number> = {};
          IMAGE_ADJUSTMENTS.forEach(adj => {
            defaults[adj.id] = adj.default;
          });
          return defaults;
        });
      }
    } else if (pendingAction === "close") {
      onClose();
    }
    setPendingAction(null);
  };

  const handleBack = () => {
    if (step === "publish") {
      setStep("edit");
    } else if (step === "edit") {
      // Check for unsaved changes
      if (hasUnsavedChanges()) {
        setPendingAction("back");
        setShowDiscardDialog(true);
        if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
      } else {
        setStep("camera");
        setImageData(null);
      }
    } else {
      onClose();
    }
  };

  // --- GESTOS CON SNAP-TO-CENTER ---
  const haptic = useCallback((pattern: number | number[], minInterval = 50) => {
    const now = Date.now();
    if (now - gestureRef.current.lastHapticTime < minInterval) return;
    gestureRef.current.lastHapticTime = now;
    if (navigator.vibrate) navigator.vibrate(pattern);
  }, []);

  const handlePointerDown = (e: React.TouchEvent | React.MouseEvent, id: string) => {
    const item = overlays.find((o) => o.id === id);
    if (item?.isEditing) return;
    e.stopPropagation();

    saveToHistory();
    setSelectedId(id);
    setIsDragging(true);

    if (!item || !containerRef.current) return;

    const g = gestureRef.current;
    g.lastSnapH = false;
    g.lastSnapV = false;

    if ("touches" in e && e.touches.length === 2) {
      g.isMultiTouch = true;
      g.startDist = getDistance(e.touches[0], e.touches[1]);
      g.startAngle = getAngle(e.touches[0], e.touches[1]);
      g.initialScale = item.scale;
      g.initialRotation = item.rotation;
      // Also track position for pan during pinch
      const mid = { 
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2 
      };
      g.startX = mid.x;
      g.startY = mid.y;
      g.initialItemX = item.x;
      g.initialItemY = item.y;
    } else {
      const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      g.isMultiTouch = false;
      g.startX = clientX;
      g.startY = clientY;
      g.initialItemX = item.x;
      g.initialItemY = item.y;
      g.initialScale = item.scale;
      g.initialRotation = item.rotation;
    }
    
    haptic(5);
  };

  const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!selectedId || !isDragging || !containerRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const g = gestureRef.current;

    if ("touches" in e && e.touches.length === 2 && g.isMultiTouch) {
      e.preventDefault();
      const currentDist = getDistance(e.touches[0], e.touches[1]);
      const currentAngle = getAngle(e.touches[0], e.touches[1]);

      const scaleFactor = currentDist / g.startDist;
      const rotationDiff = currentAngle - g.startAngle;
      
      const newScale = Math.max(0.3, Math.min(5, g.initialScale * scaleFactor));
      const newRotation = g.initialRotation + rotationDiff;

      // Pan during pinch
      const mid = { 
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2 
      };
      const deltaX = (mid.x - g.startX) / container.width;
      const deltaY = (mid.y - g.startY) / container.height;
      const newX = g.initialItemX + deltaX;
      const newY = g.initialItemY + deltaY;

      // Haptic at scale limits
      if (newScale <= 0.31 || newScale >= 4.99) {
        haptic(15);
      }

      setOverlays((prev) =>
        prev.map((o) =>
          o.id === selectedId
            ? { ...o, scale: newScale, rotation: newRotation, x: newX, y: newY }
            : o,
        ),
      );
    } else if (!g.isMultiTouch) {
      const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      const deltaX = clientX - g.startX;
      const deltaY = clientY - g.startY;

      let rawX = g.initialItemX + deltaX / container.width;
      let rawY = g.initialItemY + deltaY / container.height;

      // Snap-to-center logic
      const distFromCenterH = Math.abs(rawX - 0.5);
      const distFromCenterV = Math.abs(rawY - 0.5);

      const snapH = distFromCenterH < SNAP_THRESHOLD;
      const snapV = distFromCenterV < SNAP_THRESHOLD;

      let finalX = rawX;
      let finalY = rawY;

      // Apply magnetic snap with smooth friction
      if (snapH) {
        const friction = 1 - (1 - distFromCenterH / SNAP_THRESHOLD) * SNAP_FRICTION;
        finalX = 0.5 + (rawX - 0.5) * friction;
        if (!g.lastSnapH) {
          haptic(12);
          g.lastSnapH = true;
        }
      } else {
        g.lastSnapH = false;
      }

      if (snapV) {
        const friction = 1 - (1 - distFromCenterV / SNAP_THRESHOLD) * SNAP_FRICTION;
        finalY = 0.5 + (rawY - 0.5) * friction;
        if (!g.lastSnapV) {
          haptic(12);
          g.lastSnapV = true;
        }
      } else {
        g.lastSnapV = false;
      }

      // Update guide lines visibility
      setShowCenterGuideH(snapH);
      setShowCenterGuideV(snapV);

      // Trash zone intensity
      const isInTrash = finalY > TRASH_ZONE_START;
      const intensity = isInTrash 
        ? Math.min(1, (finalY - TRASH_ZONE_START) / (TRASH_ZONE_DELETE - TRASH_ZONE_START))
        : 0;
      setTrashZoneIntensity(intensity);

      // Progressive haptic for trash zone
      if (isInTrash && intensity > 0.5) {
        haptic(Math.floor(10 + intensity * 25), 100);
      }

      setOverlays((prev) =>
        prev.map((o) =>
          o.id === selectedId
            ? { ...o, x: finalX, y: finalY }
            : o,
        ),
      );
    }
  };

  const handlePointerUp = () => {
    // Reset guides
    setShowCenterGuideH(false);
    setShowCenterGuideV(false);
    setTrashZoneIntensity(0);
    setIsDragging(false);

    if (selectedId && containerRef.current) {
      const item = overlays.find((o) => o.id === selectedId);
      // Delete if in trash zone
      if (item && item.y > TRASH_ZONE_DELETE) {
        setOverlays((prev) => prev.filter((o) => o.id !== selectedId));
        haptic([30, 50, 30, 50, 30]);
        setSelectedId(null);
        toast.success("Eliminado", { duration: 1500 });
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest(".overlay-item")) return;
    if ((e.target as HTMLElement).closest(".tool-panel")) return;

    // Only deselect if not interacting with tools - don't close panels!
    if (showTools !== "none") {
      // Just deselect the item, but keep the panel open
      setSelectedId(null);
      return;
    }

    if (selectedId) {
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
    if (navigator.vibrate) navigator.vibrate(10);
  };

  // Protected blur handler with delay
  const handleTextBlur = (id: string) => {
    // Clear any existing timeout
    if (textEditTimeoutRef.current) {
      clearTimeout(textEditTimeoutRef.current);
    }
    
    // Delay the blur to allow for accidental taps
    textEditTimeoutRef.current = setTimeout(() => {
      const item = overlays.find(o => o.id === id);
      if (item && item.content.trim() === "") {
        // Remove empty text overlays
        setOverlays(prev => prev.filter(o => o.id !== id));
      } else {
        updateOverlay(id, { isEditing: false });
        // Confirmation haptic
        if (navigator.vibrate) navigator.vibrate([8, 20, 8]);
      }
    }, 200);
  };

  // Cancel blur when user taps inside text area again
  const handleTextFocus = () => {
    if (textEditTimeoutRef.current) {
      clearTimeout(textEditTimeoutRef.current);
    }
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
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageData(ev.target?.result as string);
        stopCamera();
        setStep("edit");
        if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
      };
      reader.readAsDataURL(file);
    }
  };

  const closeToolPanel = useCallback(() => {
    setShowTools("none");
    if (navigator.vibrate) navigator.vibrate(8);
  }, []);

  if (!isOpen) return null;

  const isEditing = overlays.some((o) => o.isEditing);
  const showSidebar = step === "edit" && !isDragging && !isEditing;
  
  // Calculate bottom padding based on keyboard
  const bottomPadding = keyboardHeight > 0 ? keyboardHeight : 0;

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
        .scroll-snap-x { scroll-snap-type: x mandatory; }
        .scroll-snap-center { scroll-snap-align: center; }
        .scroll-fade-right::after {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 40px;
          background: linear-gradient(to right, transparent, rgba(0,0,0,0.4));
          pointer-events: none;
        }
        .editing-ring {
          animation: editing-pulse 1.5s ease-in-out infinite;
        }
        @keyframes editing-pulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(255,255,255,0.3); }
          50% { box-shadow: 0 0 0 4px rgba(255,255,255,0.6); }
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
        {/* === DISCARD DIALOG === */}
        <AnimatePresence>
          {showDiscardDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm"
              onClick={() => {
                setShowDiscardDialog(false);
                setPendingAction(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-zinc-900 rounded-3xl p-6 mx-6 max-w-sm w-full shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <AlertCircle size={24} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">¿Descartar cambios?</h3>
                    <p className="text-sm text-white/60">Perderás todos los cambios</p>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowDiscardDialog(false);
                      setPendingAction(null);
                      if (navigator.vibrate) navigator.vibrate(8);
                    }}
                    className="flex-1 py-3 rounded-2xl bg-white/10 font-semibold text-white transition-colors active:bg-white/20"
                  >
                    Seguir editando
                  </button>
                  <button
                    onClick={() => {
                      confirmDiscard();
                      if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
                    }}
                    className="flex-1 py-3 rounded-2xl bg-red-500 font-semibold text-white transition-colors active:bg-red-600"
                  >
                    Descartar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === HEADER === */}
        <motion.header 
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="absolute top-0 left-0 right-0 z-50 safe-top"
        >
          <div className="flex justify-between items-center p-4">
            {/* Botón Atrás/Cerrar con indicador de cambios */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleBack}
              className="glass-button w-11 h-11 rounded-full flex items-center justify-center relative"
            >
              {step === "camera" ? <X size={22} /> : <ChevronLeft size={24} />}
              {/* Indicator for unsaved changes */}
              {step === "edit" && hasUnsavedChanges() && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full" />
              )}
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

              {/* Siguiente - Solo en edit and no text editing active */}
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
          
          {/* CAMERA VIEW - Fixed 9:16 aspect ratio container */}
          {step === "camera" && (
            <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center">
              {/* 9:16 container */}
              <div className="relative w-full h-full max-w-[100vh*9/16] flex items-center justify-center">
                {/* Video feed - object-contain to prevent zoom */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={cn(
                    "w-full h-full object-contain bg-black",
                    facingMode === "user" && "scale-x-[-1]"
                  )}
                />
                
                {/* Frame guide overlay - optional visible frame */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-4 border border-white/10 rounded-2xl" />
                </div>
              </div>
              
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
                  
                  {/* Gallery button - Bottom left - Larger touch target */}
                  <motion.label
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    whileTap={{ scale: 0.92 }}
                    className="cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-2xl glass-button flex items-center justify-center overflow-hidden min-w-[56px] min-h-[56px]">
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

              {/* CENTER GUIDE LINES */}
              <GuideLines showHorizontal={showCenterGuideH} showVertical={showCenterGuideV} />

              {/* Overlays */}
              {overlays.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn(
                    "overlay-item absolute flex items-center justify-center",
                    item.isEditing && "z-[100]"
                  )}
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
                      isDragging && selectedId === item.id && trashZoneIntensity > 0.3 && "scale-75 opacity-60",
                      isDragging && selectedId === item.id && trashZoneIntensity > 0.7 && "scale-50 opacity-40 grayscale",
                      item.isEditing && "editing-ring rounded-lg p-2"
                    )}
                  >
                    {item.type === "text" ? (
                      item.isEditing ? (
                        <textarea
                          ref={editingTextRef}
                          autoFocus
                          value={item.content}
                          onChange={(e) => updateOverlay(item.id, { content: e.target.value })}
                          onBlur={() => handleTextBlur(item.id)}
                          onFocus={handleTextFocus}
                          className="bg-transparent outline-none resize-none overflow-hidden text-center min-w-[50px]"
                          placeholder="Escribe..."
                          style={{
                            ...getTextStyles(item) as React.CSSProperties,
                            // Move text area up when keyboard is open
                            transform: keyboardHeight > 0 ? `translateY(-${Math.min(keyboardHeight / 3, 100)}px)` : undefined,
                          }}
                          onInput={(e) => {
                            const el = e.target as HTMLTextAreaElement;
                            el.style.height = "auto";
                            el.style.height = el.scrollHeight + "px";
                          }}
                        />
                      ) : (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOverlay(item.id, { isEditing: true });
                            if (navigator.vibrate) navigator.vibrate(8);
                          }}
                          className="whitespace-pre-wrap leading-tight"
                          style={getTextStyles(item) as React.CSSProperties}
                        >
                          {item.content || "Texto"}
                        </div>
                      )
                    ) : item.type === "widget" ? (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!item.isEditing) {
                            updateOverlay(item.id, { isEditing: true });
                            setSelectedId(item.id);
                          }
                        }}
                      >
                        {item.widgetType === "poll" && (
                          <PollWidget
                            config={item.widgetConfig}
                            onConfigChange={(config) => updateWidgetConfig(item.id, config)}
                            isEditing={item.isEditing}
                          />
                        )}
                        {item.widgetType === "question" && (
                          <QuestionBoxWidget
                            config={item.widgetConfig}
                            onConfigChange={(config) => updateWidgetConfig(item.id, config)}
                            isEditing={item.isEditing}
                          />
                        )}
                        {item.widgetType === "emoji_slider" && (
                          <EmojiSliderWidget
                            config={item.widgetConfig}
                            onConfigChange={(config) => updateWidgetConfig(item.id, config)}
                            isEditing={item.isEditing}
                          />
                        )}
                      </div>
                    ) : item.type === "sticker" ? (
                      <div className="text-[80px] drop-shadow-xl">{item.content}</div>
                    ) : null}
                  </div>
                </motion.div>
              ))}

              {/* TRASH ZONE - Premium animated */}
              <TrashZone isVisible={isDragging} intensity={trashZoneIntensity} />
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
                { icon: Type, tool: "text" as const, label: "Texto", active: false },
                { icon: Wand2, tool: "textStyles" as const, label: "Estilos", active: showTools === "textStyles" },
                { icon: Sparkles, tool: "stickers" as const, label: "Stickers", active: showTools === "stickers" },
                { icon: LayoutGrid, tool: "widgets" as const, label: "Widgets", active: showWidgetPicker || overlays.some(o => o.type === "widget") },
                { icon: Palette, tool: "filters" as const, label: "Filtros", active: showTools === "filters" || activeFilter !== "none" },
                { icon: Sliders, tool: "adjustments" as const, label: "Ajustes", active: showTools === "adjustments" },
                { icon: PenTool, tool: "drawing" as const, label: "Dibujar", active: showTools === "drawing" || drawingDataUrl !== null },
              ].map(({ icon: Icon, tool, label, active }, index) => (
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
                    } else if (tool === "widgets") {
                      setShowWidgetPicker(true);
                    } else {
                      setShowTools(tool);
                      setSelectedId(null);
                    }
                    if (navigator.vibrate) navigator.vibrate(8);
                  }}
                  className={cn(
                    "w-12 h-12 rounded-2xl glass-button flex items-center justify-center group relative",
                    active && "ring-2 ring-white/50"
                  )}
                >
                  <Icon size={20} className="text-white/90" />
                  
                  {/* Active indicator */}
                  {active && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                  
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
              className="tool-panel absolute bottom-0 left-0 right-0 glass-premium border-t border-white/5 rounded-t-3xl z-50 safe-bottom"
              style={{ paddingBottom: bottomPadding }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-semibold text-lg">Filtros</h3>
                  <button 
                    onClick={closeToolPanel} 
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide scroll-snap-x relative scroll-fade-right">
                  {IMAGE_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setActiveFilter(f.id);
                        if (navigator.vibrate) navigator.vibrate(10);
                      }}
                      className="flex flex-col items-center gap-2 flex-shrink-0 scroll-snap-center"
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
            <div className="tool-panel" onClick={(e) => e.stopPropagation()}>
              <StickerPicker 
                onStickerSelect={addSticker}
                onClose={closeToolPanel}
              />
            </div>
          )}

          {/* Adjustments */}
          {showTools === "adjustments" && (
            <div className="tool-panel" onClick={(e) => e.stopPropagation()}>
              <ImageAdjustments
                adjustments={imageAdjustments}
                onAdjustmentsChange={setImageAdjustments}
                onClose={closeToolPanel}
                onApply={closeToolPanel}
              />
            </div>
          )}

          {/* Text Styles */}
          {showTools === "textStyles" && (
            <div className="tool-panel" onClick={(e) => e.stopPropagation()}>
              <TextStylePicker
                selectedStyle={currentTextStyle}
                selectedGradient={currentTextGradient}
                selectedAnimation={currentTextAnimation}
                currentColor={currentColor}
                fontSize={currentFontSize}
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
                onAnimationChange={(animation) => {
                  setCurrentTextAnimation(animation);
                  if (selectedId) {
                    updateOverlay(selectedId, { textAnimation: animation });
                  }
                }}
                onFontSizeChange={(size) => {
                  setCurrentFontSize(size);
                  if (selectedId) {
                    updateOverlay(selectedId, { fontSize: size });
                  }
                }}
                onClose={closeToolPanel}
              />
            </div>
          )}

          {/* Drawing */}
          {showTools === "drawing" && containerRef.current && (
            <div className="tool-panel" onClick={(e) => e.stopPropagation()}>
              <DrawingCanvas
                width={containerRef.current.offsetWidth * 2}
                height={containerRef.current.offsetHeight * 2}
                onSave={handleDrawingSave}
                onClose={closeToolPanel}
              />
            </div>
          )}

          {/* Text Edit Tools - with keyboard awareness */}
          {isEditing && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="absolute bottom-0 left-0 right-0 glass-premium p-4 z-[150] flex flex-col gap-4 border-t border-white/5"
              style={{ 
                paddingBottom: `calc(${Math.max(bottomPadding, 16)}px + env(safe-area-inset-bottom, 0px))`,
                // Reduce height when keyboard is open
                maxHeight: keyboardHeight > 0 ? '180px' : undefined,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Botón efectos - hidden when keyboard is very tall */}
              {keyboardHeight < 300 && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowTools("textStyles")}
                    className="px-4 py-2 rounded-full bg-white/10 text-sm font-medium flex items-center gap-2 active:bg-white/20 transition-colors"
                  >
                    <Wand2 size={16} />
                    Efectos de Texto
                  </button>
                </div>
              )}

              {/* Fuentes - with scroll snap */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1 scroll-snap-x relative">
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
                      "px-4 py-2 rounded-full text-xs font-medium border transition-all whitespace-nowrap flex-shrink-0 scroll-snap-center min-h-[40px]",
                      overlays.find((o) => o.isEditing)?.fontFamily === f.family
                        ? "bg-white text-black border-white"
                        : "border-white/20 text-white/70 active:bg-white/10",
                    )}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              {/* Alineación y Colores - improved touch targets */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-1 bg-white/10 rounded-xl p-1">
                  {[
                    { icon: <AlignLeft size={18} />, value: "left" },
                    { icon: <AlignCenter size={18} />, value: "center" },
                    { icon: <AlignRight size={18} />, value: "right" },
                  ].map((b) => (
                    <button
                      key={b.value}
                      onClick={() => {
                        const id = overlays.find((o) => o.isEditing)?.id;
                        if (id) updateOverlay(id, { align: b.value as "left" | "center" | "right" });
                        if (navigator.vibrate) navigator.vibrate(5);
                      }}
                      className={cn(
                        "p-2.5 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center",
                        overlays.find((o) => o.isEditing)?.align === b.value ? "bg-white text-black" : "text-white/60 active:bg-white/10",
                      )}
                    >
                      {b.icon}
                    </button>
                  ))}
                </div>

                {/* Colors with larger touch targets */}
                <div className="flex gap-2 overflow-x-auto flex-1 max-w-[220px] scrollbar-hide scroll-snap-x">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        const id = overlays.find((o) => o.isEditing)?.id;
                        if (id) updateOverlay(id, { color: c, textGradient: null });
                        setCurrentColor(c);
                        setCurrentTextGradient(null);
                        if (navigator.vibrate) navigator.vibrate(8);
                      }}
                      className={cn(
                        "w-10 h-10 rounded-full shrink-0 transition-transform ring-2 ring-offset-2 ring-offset-black scroll-snap-center",
                        overlays.find((o) => o.isEditing)?.color === c && !overlays.find((o) => o.isEditing)?.textGradient
                          ? "scale-110 ring-white"
                          : "ring-transparent",
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                {/* Done button - larger */}
                <button
                  onClick={() => {
                    const id = overlays.find((o) => o.isEditing)?.id;
                    if (id) updateOverlay(id, { isEditing: false });
                    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
                  }}
                  className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center active:bg-white/80 transition-colors"
                >
                  <Check size={22} strokeWidth={3} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Widget Picker Modal */}
        <WidgetPicker
          isOpen={showWidgetPicker}
          onClose={() => setShowWidgetPicker(false)}
          onSelectWidget={addWidget}
        />

        {/* Widget Edit Confirm Button */}
        <AnimatePresence>
          {overlays.some(o => o.type === "widget" && o.isEditing) && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100] safe-bottom"
            >
              <button
                onClick={() => {
                  const widgetId = overlays.find(o => o.type === "widget" && o.isEditing)?.id;
                  if (widgetId) {
                    updateOverlay(widgetId, { isEditing: false });
                    setSelectedId(null);
                  }
                  if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
                }}
                className="px-6 py-3 bg-white text-black rounded-full font-semibold flex items-center gap-2 shadow-xl"
              >
                <Check size={20} />
                Confirmar Widget
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
