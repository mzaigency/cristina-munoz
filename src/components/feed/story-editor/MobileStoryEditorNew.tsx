import { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { GOOGLE_FONTS_URL, type OverlayItem } from "./types";
import { useGestureEngine } from "./useGestureEngine";
import { TopBarMinimal } from "./TopBarMinimal";
import { ToolsSidebar } from "./ToolsSidebar";
import { PublishBar } from "./PublishBar";
import { TrashZone } from "./TrashZone";
import { GuideLines } from "./GuideLines";
import { TextEditorNew, type TextConfig } from "./TextEditorNew";
import { DrawingCanvas } from "./DrawingCanvasNew";
import { StickerDrawer } from "./stickers/StickerDrawer";
import { publishStory, downloadStoryImage, publishVideoStory } from "./storyPublisher";

interface MobileStoryEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageData?: string;
  videoData?: string;
  tenantId: string;
  onSuccess: () => void;
}

export function MobileStoryEditorNew({
  isOpen,
  onClose,
  imageData,
  videoData,
  tenantId,
  onSuccess,
}: MobileStoryEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pipInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Overlays state
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [drawingDataUrl, setDrawingDataUrl] = useState<string | null>(null);
  
  // Video state
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  
  // Tools state
  const [activePanel, setActivePanel] = useState<"none" | "text" | "stickers" | "drawing">("none");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Editing existing item
  const [editingItem, setEditingItem] = useState<OverlayItem | null>(null);

  const isVideoMode = !!videoData;
  const isEditing = activePanel !== "none";

  // Toggle PiP image shape
  const handlePiPTap = useCallback((itemId: string) => {
    setOverlays(prev => prev.map(item => {
      if (item.id === itemId && item.type === "image") {
        const shapes: ("rect" | "circle" | "rounded")[] = ["rect", "circle", "rounded"];
        const currentIdx = shapes.indexOf(item.clipShape || "rect");
        const nextShape = shapes[(currentIdx + 1) % shapes.length];
        if (navigator.vibrate) navigator.vibrate(10);
        return { ...item, clipShape: nextShape };
      }
      return item;
    }));
  }, []);

  // Double tap to edit text - defined before useGestureEngine
  const handleDoubleTap = useCallback((item: OverlayItem) => {
    if (item.type === "text") {
      setEditingItem(item);
      setActivePanel("text");
    } else if (item.type === "image") {
      handlePiPTap(item.id);
    }
  }, [handlePiPTap]);
  
  // Gesture engine with double-tap support
  const { gestureState, handleTouchStart, handleTouchMove, handleTouchEnd } = useGestureEngine(
    containerRef,
    overlays,
    setOverlays,
    (id) => toast.success("Eliminado"),
    handleDoubleTap
  );

  // Toggle video playback
  const toggleVideoPlayback = useCallback(() => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  }, [isVideoPlaying]);

  // Add new text overlay
  const handleAddText = useCallback((text: string, config: TextConfig) => {
    if (editingItem) {
      // Update existing item
      setOverlays(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { ...item, content: text, ...config }
          : item
      ));
      setEditingItem(null);
    } else {
      // Add new item
      const newItem: OverlayItem = {
        id: Date.now().toString(),
        type: "text",
        content: text,
        x: 0.5,
        y: 0.5,
        scale: 1,
        rotation: 0,
        fontFamily: config.fontFamily,
        fontSize: config.fontSize,
        color: config.color,
        backgroundColor: config.backgroundColor,
        textAlign: config.textAlign,
      };
      setOverlays(prev => [...prev, newItem]);
    }
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
  }, [editingItem]);

  // Add sticker or widget
  const handleAddSticker = useCallback((sticker: string, type: "sticker" | "widget" = "sticker", config?: Record<string, any>) => {
    const newItem: OverlayItem = {
      id: Date.now().toString(),
      type: type,
      content: sticker,
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      widgetType: type === "widget" ? sticker : undefined,
      widgetConfig: config,
    };
    setOverlays(prev => [...prev, newItem]);
    if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
  }, []);

  // Add PiP image
  const handleAddPiPImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const newItem: OverlayItem = {
        id: Date.now().toString(),
        type: "image",
        content: dataUrl,
        x: 0.5,
        y: 0.5,
        scale: 1,
        rotation: 0,
        clipShape: "rounded",
      };
      setOverlays(prev => [...prev, newItem]);
      if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  // Save drawing
  const handleSaveDrawing = useCallback((dataUrl: string) => {
    setDrawingDataUrl(dataUrl);
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
  }, []);

  // Capture video frame
  const captureVideoFrame = useCallback((): string | null => {
    if (!videoRef.current) return null;
    
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1080;
    canvas.height = video.videoHeight || 1920;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.95);
  }, []);

  // Download story
  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      const baseImage = isVideoMode ? captureVideoFrame() : imageData;
      if (!baseImage) {
        toast.error("No se pudo capturar la imagen");
        return;
      }
      
      await downloadStoryImage({
        imageData: baseImage,
        overlays,
        drawingDataUrl,
      }, `historia-${Date.now()}.jpg`);
      
      toast.success("¡Imagen guardada!", { icon: "📷" });
      if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Error al guardar la imagen");
    } finally {
      setIsDownloading(false);
    }
  }, [imageData, isVideoMode, captureVideoFrame, overlays, drawingDataUrl]);

  // Publish story
  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
    
    try {
      if (isVideoMode && videoData) {
        const thumbnailImage = captureVideoFrame();
        if (!thumbnailImage) {
          toast.error("No se pudo capturar la miniatura del video");
          return;
        }
        
        await publishVideoStory(tenantId, videoData, thumbnailImage);
        toast.success("¡Video publicado!", { icon: "🎬" });
      } else {
        if (!imageData) {
          toast.error("No se pudo procesar la historia");
          return;
        }
        
        await publishStory({
          imageData,
          overlays,
          drawingDataUrl,
          tenantId,
        });
        toast.success("¡Historia publicada!", { icon: "🎉" });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Publish error:", error);
      toast.error("Error al publicar la historia");
    } finally {
      setIsPublishing(false);
    }
  }, [imageData, videoData, isVideoMode, captureVideoFrame, overlays, drawingDataUrl, tenantId, onSuccess, onClose]);

  // Get text overlay style
  const getTextStyle = useCallback((item: OverlayItem): React.CSSProperties => {
    const base: React.CSSProperties = {
      fontFamily: item.fontFamily,
      fontSize: `${item.fontSize || 32}px`,
      color: item.color,
      textAlign: item.textAlign,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      lineHeight: 1.3,
    };

    if (item.backgroundColor === "solid") {
      const isLight = item.color === "#FFFFFF" || item.color === "#FFCC00" || item.color === "#5AC8FA";
      return { 
        ...base, 
        backgroundColor: isLight ? "#000000" : "#FFFFFF", 
        padding: "8px 16px", 
        borderRadius: "8px" 
      };
    }
    if (item.backgroundColor === "translucent") {
      return { 
        ...base, 
        backgroundColor: "rgba(0,0,0,0.5)", 
        padding: "8px 16px", 
        borderRadius: "8px" 
      };
    }
    return { ...base, textShadow: "0 2px 10px rgba(0,0,0,0.8)" };
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <style>{`@import url('${GOOGLE_FONTS_URL}');`}</style>
      
      {/* Hidden file input for PiP */}
      <input
        ref={pipInputRef}
        type="file"
        accept="image/*"
        onChange={handleAddPiPImage}
        className="hidden"
      />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black flex flex-col overflow-hidden touch-none select-none"
        style={{ 
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)'
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background image or video - full screen */}
        <div 
          ref={containerRef}
          className="absolute inset-0"
        >
          {isVideoMode ? (
            <>
              <video
                ref={videoRef}
                src={videoData}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Video play/pause overlay */}
              <button
                onClick={toggleVideoPlayback}
                className="absolute inset-0 flex items-center justify-center z-5"
              >
                <AnimatePresence>
                  {!isVideoPlaying && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center"
                    >
                      <Play size={32} className="text-white ml-1" fill="white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </>
          ) : (
            <img
              src={imageData}
              alt="Story"
              className="w-full h-full object-cover"
              draggable={false}
            />
          )}
          
          {/* Drawing overlay */}
          {drawingDataUrl && (
            <img
              src={drawingDataUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
          )}

          {/* Guide lines */}
          <GuideLines 
            showHorizontal={gestureState.showCenterGuideH}
            showVertical={gestureState.showCenterGuideV}
            showLeftGuide={(gestureState as any).showLeftGuide}
            showRightGuide={(gestureState as any).showRightGuide}
            showTopGuide={(gestureState as any).showTopGuide}
            showBottomGuide={(gestureState as any).showBottomGuide}
          />

          {/* Overlay items */}
          {overlays.map((item) => (
            <motion.div
              key={item.id}
              className="absolute touch-none cursor-move"
              style={{
                left: `${item.x * 100}%`,
                top: `${item.y * 100}%`,
                transform: `translate(-50%, -50%) scale(${item.scale}) rotate(${item.rotation}deg)`,
                zIndex: gestureState.activeItemId === item.id ? 50 : 10,
              }}
              animate={{
                scale: gestureState.activeItemId === item.id && gestureState.isInTrashZone 
                  ? item.scale * (1 - gestureState.trashIntensity * 0.5)
                  : item.scale,
                opacity: gestureState.activeItemId === item.id && gestureState.trashIntensity > 0.5 
                  ? 0.5 
                  : 1,
              }}
              onTouchStart={(e) => handleTouchStart(e, item.id)}
              onDoubleClick={() => handleDoubleTap(item)}
            >
              {item.type === "text" && (
                <div 
                  className="max-w-[80vw] text-center"
                  style={getTextStyle(item)}
                >
                  {item.content}
                </div>
              )}
              
              {item.type === "sticker" && (
                <span className="text-6xl select-none">{item.content}</span>
              )}
              
              {item.type === "image" && (
                <div 
                  className={cn(
                    "w-32 h-32 overflow-hidden border-2 border-white/30 shadow-lg",
                    item.clipShape === "circle" && "rounded-full",
                    item.clipShape === "rounded" && "rounded-2xl",
                    item.clipShape === "rect" && "rounded-none",
                  )}
                >
                  <img 
                    src={item.content} 
                    alt="" 
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Top bar - only show when not editing */}
        <AnimatePresence>
          {!isEditing && (
            <TopBarMinimal
              onClose={onClose}
              onDownload={handleDownload}
              isDownloading={isDownloading}
            />
          )}
        </AnimatePresence>

        {/* Tools sidebar - right side */}
        <AnimatePresence>
          {!isEditing && !gestureState.isDragging && (
            <ToolsSidebar
              onOpenText={() => setActivePanel("text")}
              onOpenStickers={() => setActivePanel("stickers")}
              onOpenDrawing={() => setActivePanel("drawing")}
              onAddImage={() => pipInputRef.current?.click()}
            />
          )}
        </AnimatePresence>

        {/* Trash zone */}
        <TrashZone 
          visible={gestureState.isDragging}
          intensity={gestureState.trashIntensity}
        />

        {/* Video mode indicator */}
        {isVideoMode && !isEditing && (
          <div className="absolute bottom-28 left-4 z-30">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white/80 text-xs font-medium">Video</span>
            </div>
          </div>
        )}

        {/* Publish bar - Instagram style */}
        <AnimatePresence>
          {!isEditing && !gestureState.isDragging && (
            <PublishBar
              onPublish={handlePublish}
              isPublishing={isPublishing}
            />
          )}
        </AnimatePresence>

        {/* Text Editor Modal */}
        <AnimatePresence>
          {activePanel === "text" && (
            <TextEditorNew
              isOpen={true}
              onClose={() => {
                setActivePanel("none");
                setEditingItem(null);
              }}
              onSave={handleAddText}
              initialText={editingItem?.content}
              initialConfig={editingItem ? {
                fontFamily: editingItem.fontFamily,
                fontSize: editingItem.fontSize,
                color: editingItem.color,
                backgroundColor: editingItem.backgroundColor,
                textAlign: editingItem.textAlign,
              } : undefined}
            />
          )}
        </AnimatePresence>

        {/* Drawing Canvas Modal */}
        <AnimatePresence>
          {activePanel === "drawing" && (
            <DrawingCanvas
              isOpen={true}
              onClose={() => setActivePanel("none")}
              onSave={handleSaveDrawing}
              width={1080}
              height={1920}
              backgroundImage={isVideoMode ? captureVideoFrame() || "" : imageData || ""}
            />
          )}
        </AnimatePresence>

        {/* Sticker Drawer */}
        <AnimatePresence>
          {activePanel === "stickers" && (
            <StickerDrawer
              isOpen={true}
              onClose={() => setActivePanel("none")}
              onSelectEmoji={(emoji) => handleAddSticker(emoji, "sticker")}
              onSelectWidget={(type, config) => handleAddSticker(type, "widget", config)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
