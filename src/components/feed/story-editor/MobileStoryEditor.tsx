import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { GOOGLE_FONTS_URL, type OverlayItem } from "./types";
import { useGestureEngine } from "./useGestureEngine";
import { TopBar } from "./TopBar";
import { TrashZone } from "./TrashZone";
import { GuideLines } from "./GuideLines";
import { TextEditor, type TextConfig } from "./TextEditor";
import { DrawingCanvas } from "./DrawingCanvasNew";
import { StickerPicker } from "./StickerPickerNew";
import { publishStory, downloadStoryImage } from "./storyPublisher";

interface MobileStoryEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageData?: string;
  videoData?: string;
  tenantId: string;
  onSuccess: () => void;
}

export function MobileStoryEditor({
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
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Gesture engine
  const { gestureState, handleTouchStart, handleTouchMove, handleTouchEnd } = useGestureEngine(
    containerRef,
    overlays,
    setOverlays,
    (id) => toast.success("Eliminado")
  );

  const isVideoMode = !!videoData;

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

  const handleAddText = useCallback((text: string, config: TextConfig) => {
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
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
  }, []);

  const handleAddSticker = useCallback((sticker: string) => {
    const newItem: OverlayItem = {
      id: Date.now().toString(),
      type: "sticker",
      content: sticker,
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
    };
    setOverlays(prev => [...prev, newItem]);
  }, []);

  // Picture-in-Picture: Add image from gallery
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
        clipShape: "rect", // Default shape
      };
      setOverlays(prev => [...prev, newItem]);
      if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = "";
  }, []);

  // Toggle PiP image shape on tap
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

  const handleSaveDrawing = useCallback((dataUrl: string) => {
    setDrawingDataUrl(dataUrl);
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
  }, []);

  // Capture video frame for thumbnail/processing
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

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
    
    try {
      // For video mode, capture current frame as thumbnail
      const baseImage = isVideoMode ? captureVideoFrame() : imageData;
      if (!baseImage) {
        toast.error("No se pudo procesar la historia");
        return;
      }
      
      const { storyId, imageUrl } = await publishStory({
        imageData: baseImage,
        overlays,
        drawingDataUrl,
        tenantId,
        // TODO: Add video upload support when backend is ready
        // videoData: isVideoMode ? videoData : undefined,
      });
      
      console.log("Story published:", storyId, imageUrl);
      toast.success("¡Historia publicada!", { icon: "🎉" });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Publish error:", error);
      toast.error("Error al publicar la historia");
    } finally {
      setIsPublishing(false);
    }
  }, [imageData, isVideoMode, captureVideoFrame, overlays, drawingDataUrl, tenantId, onSuccess, onClose]);

  const getTextStyle = (item: OverlayItem): React.CSSProperties => {
    const base: React.CSSProperties = {
      fontFamily: item.fontFamily,
      fontSize: `${item.fontSize || 32}px`,
      color: item.color,
      textAlign: item.textAlign,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    };

    if (item.backgroundColor === "solid") {
      const isLight = item.color === "#FFFFFF" || item.color === "#FFCC00";
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
    return { ...base, textShadow: "0 2px 8px rgba(0,0,0,0.6)" };
  };

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
              onDoubleClick={() => item.type === "image" && handlePiPTap(item.id)}
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
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handlePiPTap(item.id);
                  }}
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
          {!showTextEditor && !showDrawingCanvas && (
            <TopBar
              onClose={onClose}
              onDownload={handleDownload}
              onOpenStickers={() => setShowStickerPicker(true)}
              onOpenDrawing={() => setShowDrawingCanvas(true)}
              onOpenText={() => setShowTextEditor(true)}
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
        {isVideoMode && !showTextEditor && !showDrawingCanvas && (
          <div className="absolute bottom-24 left-4 z-30">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white/80 text-xs font-medium">Video</span>
            </div>
          </div>
        )}

        {/* Publish button */}
        <AnimatePresence>
          {!showTextEditor && !showDrawingCanvas && !gestureState.isDragging && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-8 right-4 z-40"
            >
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="
                  flex items-center gap-2 px-6 py-3 rounded-full
                  bg-white text-black font-semibold
                  active:scale-95 transition-all
                  disabled:opacity-50
                "
              >
                <Send size={18} />
                {isPublishing ? "Publicando..." : "Publicar"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text Editor Modal */}
        <AnimatePresence>
          {showTextEditor && (
            <TextEditor
              isOpen={showTextEditor}
              onClose={() => setShowTextEditor(false)}
              onSave={handleAddText}
            />
          )}
        </AnimatePresence>

        {/* Drawing Canvas Modal */}
        <AnimatePresence>
          {showDrawingCanvas && (
            <DrawingCanvas
              isOpen={showDrawingCanvas}
              onClose={() => setShowDrawingCanvas(false)}
              onSave={handleSaveDrawing}
              width={1080}
              height={1920}
              backgroundImage={isVideoMode ? captureVideoFrame() || "" : imageData || ""}
            />
          )}
        </AnimatePresence>

        {/* Sticker Picker */}
        <AnimatePresence>
          {showStickerPicker && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[90]"
                onClick={() => setShowStickerPicker(false)}
              />
              <StickerPicker
                isOpen={showStickerPicker}
                onClose={() => setShowStickerPicker(false)}
                onSelect={handleAddSticker}
              />
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
