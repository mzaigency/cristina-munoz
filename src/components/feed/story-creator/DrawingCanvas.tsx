import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Pen, Edit3, Highlighter, Sparkles, Undo, X, Check, Eraser, Trash2,
  ArrowRight, Pipette, Minus, Plus, Zap
} from "lucide-react";
import { STORY_COLORS, BRUSH_SIZES, BRUSH_TYPES } from "@/constants/story-assets";
import { cn } from "@/lib/utils";

interface DrawingCanvasProps {
  width: number;
  height: number;
  backgroundImage?: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

interface DrawingPath {
  points: { x: number; y: number; pressure?: number }[];
  color: string;
  size: number;
  type: string;
  opacity: number;
}

// Extended brush types with new effects
const EXTENDED_BRUSH_TYPES = [
  { id: "pen", name: "Bolígrafo", icon: Pen },
  { id: "marker", name: "Marcador", icon: Edit3 },
  { id: "highlighter", name: "Subrayador", icon: Highlighter },
  { id: "neon", name: "Neón", icon: Zap },
  { id: "arrow", name: "Flecha", icon: ArrowRight },
  { id: "spray", name: "Spray", icon: Sparkles },
];

// Catmull-Rom spline for smooth curves
const getCatmullRomPoint = (
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
) => {
  const t2 = t * t;
  const t3 = t2 * t;
  
  return {
    x: 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    ),
    y: 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    )
  };
};

// Smooth a path using Catmull-Rom splines
const smoothPath = (points: { x: number; y: number }[], segments: number = 8): { x: number; y: number }[] => {
  if (points.length < 4) return points;
  
  const smoothed: { x: number; y: number }[] = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[Math.min(points.length - 1, i + 1)];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    
    for (let j = 0; j < segments; j++) {
      const t = j / segments;
      smoothed.push(getCatmullRomPoint(p0, p1, p2, p3, t));
    }
  }
  
  smoothed.push(points[points.length - 1]);
  return smoothed;
};

export const DrawingCanvas = ({ width, height, backgroundImage, onSave, onClose }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#FFFFFF");
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[2]);
  const [brushType, setBrushType] = useState(EXTENDED_BRUSH_TYPES[0]);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);
  const [isEraser, setIsEraser] = useState(false);
  const [showEyedropper, setShowEyedropper] = useState(false);
  const [eyedropperPos, setEyedropperPos] = useState({ x: 0, y: 0 });
  const [previewColor, setPreviewColor] = useState<string | null>(null);

  // Get opacity based on brush type
  const getBrushOpacity = useCallback(() => {
    switch (brushType.id) {
      case "highlighter":
        return 0.35;
      case "spray":
        return 0.5;
      case "neon":
        return 1;
      default:
        return 1;
    }
  }, [brushType]);

  // Draw a single path with effects
  const drawPath = useCallback((ctx: CanvasRenderingContext2D, path: DrawingPath) => {
    if (path.points.length < 2) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = path.opacity;

    const smoothedPoints = path.type !== "spray" ? smoothPath(path.points) : path.points;

    switch (path.type) {
      case "neon":
        // Outer glow layers
        for (let i = 4; i >= 0; i--) {
          ctx.beginPath();
          ctx.strokeStyle = path.color;
          ctx.lineWidth = path.size + i * 8;
          ctx.globalAlpha = 0.1 - i * 0.015;
          ctx.filter = `blur(${4 + i * 3}px)`;
          
          ctx.moveTo(smoothedPoints[0].x, smoothedPoints[0].y);
          for (let j = 1; j < smoothedPoints.length; j++) {
            ctx.lineTo(smoothedPoints[j].x, smoothedPoints[j].y);
          }
          ctx.stroke();
        }
        
        // Core white line
        ctx.filter = "none";
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = path.size * 0.6;
        ctx.shadowColor = path.color;
        ctx.shadowBlur = 15;
        
        ctx.moveTo(smoothedPoints[0].x, smoothedPoints[0].y);
        for (let j = 1; j < smoothedPoints.length; j++) {
          ctx.lineTo(smoothedPoints[j].x, smoothedPoints[j].y);
        }
        ctx.stroke();
        break;

      case "arrow":
        // Draw smooth line
        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.size;
        
        ctx.moveTo(smoothedPoints[0].x, smoothedPoints[0].y);
        for (let j = 1; j < smoothedPoints.length; j++) {
          ctx.lineTo(smoothedPoints[j].x, smoothedPoints[j].y);
        }
        ctx.stroke();

        // Draw arrowhead at end
        if (path.points.length >= 2) {
          const lastIdx = path.points.length - 1;
          const secondLastIdx = Math.max(0, lastIdx - 3);
          const angle = Math.atan2(
            path.points[lastIdx].y - path.points[secondLastIdx].y,
            path.points[lastIdx].x - path.points[secondLastIdx].x
          );
          
          const arrowLength = path.size * 3;
          const arrowWidth = path.size * 2;
          const tipX = path.points[lastIdx].x;
          const tipY = path.points[lastIdx].y;
          
          ctx.beginPath();
          ctx.fillStyle = path.color;
          ctx.moveTo(tipX, tipY);
          ctx.lineTo(
            tipX - arrowLength * Math.cos(angle - Math.PI / 6),
            tipY - arrowLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            tipX - arrowLength * Math.cos(angle + Math.PI / 6),
            tipY - arrowLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
        }
        break;

      case "spray":
        path.points.forEach(point => {
          for (let i = 0; i < 15; i++) {
            const offsetX = (Math.random() - 0.5) * path.size * 3;
            const offsetY = (Math.random() - 0.5) * path.size * 3;
            const size = Math.random() * 2 + 0.5;
            ctx.beginPath();
            ctx.fillStyle = path.color;
            ctx.globalAlpha = Math.random() * 0.5 + 0.2;
            ctx.arc(point.x + offsetX, point.y + offsetY, size, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        break;

      case "highlighter":
        ctx.globalCompositeOperation = "multiply";
        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.size * 2;
        
        ctx.moveTo(smoothedPoints[0].x, smoothedPoints[0].y);
        for (let j = 1; j < smoothedPoints.length; j++) {
          ctx.lineTo(smoothedPoints[j].x, smoothedPoints[j].y);
        }
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
        break;

      case "eraser":
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = path.size;
        
        ctx.moveTo(smoothedPoints[0].x, smoothedPoints[0].y);
        for (let j = 1; j < smoothedPoints.length; j++) {
          ctx.lineTo(smoothedPoints[j].x, smoothedPoints[j].y);
        }
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
        break;

      default:
        // Standard pen/marker
        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.size;
        
        ctx.moveTo(smoothedPoints[0].x, smoothedPoints[0].y);
        for (let j = 1; j < smoothedPoints.length; j++) {
          ctx.lineTo(smoothedPoints[j].x, smoothedPoints[j].y);
        }
        ctx.stroke();
    }

    ctx.restore();
  }, []);

  // Redraw entire canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    paths.forEach(path => {
      drawPath(ctx, path);
    });

    if (currentPath) {
      drawPath(ctx, currentPath);
    }
  }, [paths, currentPath, drawPath]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Load background image for eyedropper
  useEffect(() => {
    if (!backgroundImage || !bgCanvasRef.current) return;
    
    const canvas = bgCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = backgroundImage;
  }, [backgroundImage]);

  const getPosition = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Eyedropper - pick color from background
  const pickColor = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    
    const ctx = bgCanvas.getContext("2d");
    if (!ctx) return;

    const rect = bgCanvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    const scaleX = bgCanvas.width / rect.width;
    const scaleY = bgCanvas.height / rect.height;
    
    const x = Math.floor((clientX - rect.left) * scaleX);
    const y = Math.floor((clientY - rect.top) * scaleY);

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const color = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
      setPreviewColor(color);
      setEyedropperPos({ x: clientX, y: clientY });
    } catch {
      // CORS issue - ignore
    }
  }, []);

  const confirmEyedropper = () => {
    if (previewColor) {
      setCurrentColor(previewColor);
      if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
    }
    setShowEyedropper(false);
    setPreviewColor(null);
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    if (showEyedropper) {
      pickColor(e);
      return;
    }

    e.preventDefault();
    const pos = getPosition(e);
    
    const newPath: DrawingPath = {
      points: [pos],
      color: isEraser ? "#000000" : currentColor,
      size: isEraser ? brushSize.size * 3 : brushSize.size,
      type: isEraser ? "eraser" : brushType.id,
      opacity: isEraser ? 1 : getBrushOpacity(),
    };
    
    setCurrentPath(newPath);
    setIsDrawing(true);
    
    if (navigator.vibrate) navigator.vibrate(8);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (showEyedropper) {
      pickColor(e);
      return;
    }

    if (!isDrawing || !currentPath) return;
    e.preventDefault();
    
    const pos = getPosition(e);
    
    // Add some smoothing by checking distance from last point
    const lastPoint = currentPath.points[currentPath.points.length - 1];
    const dist = Math.hypot(pos.x - lastPoint.x, pos.y - lastPoint.y);
    
    // Only add point if moved enough (reduces jaggedness)
    if (dist > 2) {
      setCurrentPath(prev => ({
        ...prev!,
        points: [...prev!.points, pos],
      }));
    }
  };

  const endDrawing = () => {
    if (showEyedropper) {
      confirmEyedropper();
      return;
    }

    if (currentPath && currentPath.points.length > 1) {
      setPaths(prev => [...prev, currentPath]);
    }
    setCurrentPath(null);
    setIsDrawing(false);
  };

  const handleUndo = () => {
    setPaths(prev => prev.slice(0, -1));
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
  };

  const handleClear = () => {
    setPaths([]);
    if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
    
    if (navigator.vibrate) navigator.vibrate([10, 50, 10, 50, 10]);
  };

  const adjustBrushSize = (delta: number) => {
    const currentIndex = BRUSH_SIZES.findIndex(s => s.id === brushSize.id);
    const newIndex = Math.max(0, Math.min(BRUSH_SIZES.length - 1, currentIndex + delta));
    setBrushSize(BRUSH_SIZES[newIndex]);
    if (navigator.vibrate) navigator.vibrate(5);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col bg-black/95"
    >
      {/* Hidden canvas for eyedropper */}
      <canvas ref={bgCanvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between p-4 shrink-0">
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        
        <div className="flex items-center gap-2">
          {/* Eyedropper */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowEyedropper(!showEyedropper);
              setIsEraser(false);
              if (navigator.vibrate) navigator.vibrate(10);
            }}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all",
              showEyedropper ? "bg-primary text-white" : "bg-white/10 text-white/70"
            )}
          >
            <Pipette className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleUndo}
            disabled={paths.length === 0}
            className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30"
          >
            <Undo className="w-5 h-5 text-white" />
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleClear}
            disabled={paths.length === 0}
            className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30"
          >
            <Trash2 className="w-5 h-5 text-white" />
          </motion.button>
        </div>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          className="w-11 h-11 rounded-full bg-primary flex items-center justify-center"
        >
          <Check className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        <canvas
          ref={canvasRef}
          width={width || 1080}
          height={height || 1920}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className="max-w-full max-h-full object-contain touch-none"
          style={{ 
            width: "100%", 
            height: "auto",
            cursor: showEyedropper ? "crosshair" : isEraser ? "cell" : "crosshair"
          }}
        />

        {/* Eyedropper preview */}
        <AnimatePresence>
          {showEyedropper && previewColor && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="fixed pointer-events-none z-50"
              style={{ 
                left: eyedropperPos.x - 30,
                top: eyedropperPos.y - 80,
              }}
            >
              <div 
                className="w-16 h-16 rounded-full border-4 border-white shadow-xl"
                style={{ backgroundColor: previewColor }}
              />
              <div className="text-center text-white text-xs mt-2 font-mono bg-black/50 px-2 py-1 rounded">
                {previewColor}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Eyedropper instruction */}
        {showEyedropper && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 rounded-full text-sm text-white"
          >
            Toca para seleccionar color
          </motion.div>
        )}
      </div>

      {/* Tools Panel */}
      <div className="p-4 space-y-3 bg-black/60 backdrop-blur-xl shrink-0">
        {/* Brush Types */}
        <div className="flex items-center gap-1.5 justify-center overflow-x-auto scrollbar-hide">
          {EXTENDED_BRUSH_TYPES.map((type) => {
            const IconComponent = type.icon;
            return (
              <motion.button
                key={type.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setBrushType(type);
                  setIsEraser(false);
                  setShowEyedropper(false);
                  if (navigator.vibrate) navigator.vibrate(8);
                }}
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0",
                  brushType.id === type.id && !isEraser && !showEyedropper
                    ? "bg-primary text-white"
                    : "bg-white/10 text-white/70"
                )}
              >
                <IconComponent className="w-5 h-5" />
              </motion.button>
            );
          })}
          
          {/* Eraser */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsEraser(!isEraser);
              setShowEyedropper(false);
              if (navigator.vibrate) navigator.vibrate(8);
            }}
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0",
              isEraser ? "bg-red-500 text-white" : "bg-white/10 text-white/70"
            )}
          >
            <Eraser className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Brush Size - with +/- buttons */}
        <div className="flex items-center justify-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => adjustBrushSize(-1)}
            disabled={brushSize.id === BRUSH_SIZES[0].id}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30"
          >
            <Minus className="w-4 h-4 text-white" />
          </motion.button>

          <div className="flex items-center gap-2">
            {BRUSH_SIZES.map((size) => (
              <motion.button
                key={size.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setBrushSize(size)}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                  brushSize.id === size.id ? "bg-white" : "bg-white/15"
                )}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: Math.min(size.size, 20),
                    height: Math.min(size.size, 20),
                    backgroundColor: brushSize.id === size.id ? currentColor : "white",
                  }}
                />
              </motion.button>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => adjustBrushSize(1)}
            disabled={brushSize.id === BRUSH_SIZES[BRUSH_SIZES.length - 1].id}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30"
          >
            <Plus className="w-4 h-4 text-white" />
          </motion.button>
        </div>

        {/* Colors */}
        <div className="flex items-center gap-2 justify-center flex-wrap">
          {STORY_COLORS.slice(0, 14).map((color) => (
            <motion.button
              key={color}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setCurrentColor(color);
                setIsEraser(false);
                setShowEyedropper(false);
                if (navigator.vibrate) navigator.vibrate(5);
              }}
              className={cn(
                "w-8 h-8 rounded-full transition-all border-2",
                currentColor === color && !isEraser && !showEyedropper
                  ? "border-white scale-110 shadow-lg"
                  : "border-transparent"
              )}
              style={{ 
                backgroundColor: color,
                boxShadow: currentColor === color ? `0 0 12px ${color}` : undefined
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
