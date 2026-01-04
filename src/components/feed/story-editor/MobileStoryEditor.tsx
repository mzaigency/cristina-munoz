import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send } from "lucide-react";
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

interface MobileStoryEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageData: string;
  tenantId: string;
  onPublish: (imageUrl: string) => Promise<void>;
}

export function MobileStoryEditor({
  isOpen,
  onClose,
  imageData,
  tenantId,
  onPublish,
}: MobileStoryEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Overlays state
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [drawingDataUrl, setDrawingDataUrl] = useState<string | null>(null);
  
  // Tools state
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Gesture engine
  const { gestureState, handleTouchStart, handleTouchMove, handleTouchEnd } = useGestureEngine(
    containerRef,
    overlays,
    setOverlays,
    (id) => toast.success("Eliminado")
  );

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

  const handleSaveDrawing = useCallback((dataUrl: string) => {
    setDrawingDataUrl(dataUrl);
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
  }, []);

  const handleDownload = useCallback(async () => {
    // TODO: Flatten and download image
    toast.success("Imagen guardada");
    if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
  }, []);

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      // TODO: Flatten all layers into single image and upload
      await onPublish(imageData);
      toast.success("¡Historia publicada!", { icon: "🎉" });
      onClose();
    } catch (error) {
      toast.error("Error al publicar");
    } finally {
      setIsPublishing(false);
    }
  }, [imageData, onPublish, onClose]);

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
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black flex flex-col overflow-hidden touch-none select-none"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background image - full screen */}
        <div 
          ref={containerRef}
          className="absolute inset-0"
        >
          <img
            src={imageData}
            alt="Story"
            className="w-full h-full object-cover"
            draggable={false}
          />
          
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
                    "w-32 h-32 overflow-hidden",
                    item.clipShape === "circle" && "rounded-full",
                    item.clipShape === "rounded" && "rounded-2xl",
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
          {!showTextEditor && !showDrawingCanvas && (
            <TopBar
              onClose={onClose}
              onDownload={handleDownload}
              onOpenStickers={() => setShowStickerPicker(true)}
              onOpenDrawing={() => setShowDrawingCanvas(true)}
              onOpenText={() => setShowTextEditor(true)}
            />
          )}
        </AnimatePresence>

        {/* Trash zone */}
        <TrashZone 
          visible={gestureState.isDragging}
          intensity={gestureState.trashIntensity}
        />

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
              backgroundImage={imageData}
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
