import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RotateCw, Check, X } from "lucide-react";

interface ImageCropperProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  aspectRatio?: number; // 1 for 1:1, 16/9 for 16:9, etc.
  onCropComplete: (croppedBlob: Blob) => void;
  outputSize?: number; // Output size in pixels (square for 1:1)
}

export const ImageCropper = ({
  open,
  onClose,
  imageSrc,
  aspectRatio = 1,
  onCropComplete,
  outputSize = 512,
}: ImageCropperProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load image
  useEffect(() => {
    if (!imageSrc || !open) return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      // Reset state
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    };
    img.src = imageSrc;
    
    return () => {
      setImageLoaded(false);
    };
  }, [imageSrc, open]);

  // Draw image on canvas
  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const containerSize = 300; // Preview size
    canvas.width = containerSize;
    canvas.height = containerSize / aspectRatio;

    // Clear canvas
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate scale to fit image
    const imgAspect = img.width / img.height;
    const canvasAspect = canvas.width / canvas.height;
    
    let drawWidth, drawHeight;
    if (imgAspect > canvasAspect) {
      drawHeight = canvas.height * zoom;
      drawWidth = drawHeight * imgAspect;
    } else {
      drawWidth = canvas.width * zoom;
      drawHeight = drawWidth / imgAspect;
    }

    // Center position
    const centerX = canvas.width / 2 + position.x;
    const centerY = canvas.height / 2 + position.y;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
  }, [zoom, rotation, position, aspectRatio, imageLoaded]);

  useEffect(() => {
    drawImage();
  }, [drawImage]);

  // Mouse/touch handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleCrop = async () => {
    const img = imageRef.current;
    if (!img) return;

    // Create output canvas at desired size
    const outputCanvas = document.createElement("canvas");
    const outputHeight = aspectRatio === 1 ? outputSize : outputSize / aspectRatio;
    outputCanvas.width = outputSize;
    outputCanvas.height = outputHeight;
    
    const ctx = outputCanvas.getContext("2d");
    if (!ctx) return;

    // Calculate scale factor from preview to output
    const scale = outputSize / 300;

    // Calculate image dimensions
    const imgAspect = img.width / img.height;
    const canvasAspect = outputCanvas.width / outputCanvas.height;
    
    let drawWidth, drawHeight;
    if (imgAspect > canvasAspect) {
      drawHeight = outputCanvas.height * zoom;
      drawWidth = drawHeight * imgAspect;
    } else {
      drawWidth = outputCanvas.width * zoom;
      drawHeight = drawWidth / imgAspect;
    }

    // Center position scaled
    const centerX = outputCanvas.width / 2 + position.x * scale;
    const centerY = outputCanvas.height / 2 + position.y * scale;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    // Convert to blob
    outputCanvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
          onClose();
        }
      },
      "image/jpeg",
      0.9
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recortar imagen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Canvas preview */}
          <div
            ref={containerRef}
            className="relative mx-auto overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted"style={{ width: 300, height: aspectRatio === 1 ? 300 : 300 / aspectRatio, cursor: isDragging ?"grabbing":"grab"
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setIsDragging(false)}
          >
            <canvas
              ref={canvasRef}
              className="pointer-events-none"
            />
            {/* Overlay grid */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border border-white/30" />
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
              <div className="absolute right-1/3 top-0 bottom-0 w-px bg-white/20" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
              <div className="absolute bottom-1/3 left-0 right-0 h-px bg-white/20" />
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Arrastra para mover la imagen
          </p>

          {/* Zoom control */}
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              min={0.5}
              max={3}
              step={0.1}
              onValueChange={([v]) => setZoom(v)}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Rotation */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRotation((r) => (r + 90) % 360)}
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Rotar 90°
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleCrop}>
            <Check className="h-4 w-4 mr-2" />
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
