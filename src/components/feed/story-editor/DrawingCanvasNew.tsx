import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Undo2, Check, Pipette } from "lucide-react";
import { COLOR_OPTIONS, type DrawingPath } from "./types";

interface DrawingCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  width: number;
  height: number;
  backgroundImage?: string;
}

// Catmull-Rom spline smoothing
function smoothPath(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length < 3) return points;
  
  const result: { x: number; y: number }[] = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[Math.min(points.length - 1, i + 1)];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    
    for (let t = 0; t <= 1; t += 0.1) {
      const t2 = t * t;
      const t3 = t2 * t;
      
      const x = 0.5 * (
        2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      );
      
      const y = 0.5 * (
        2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      );
      
      result.push({ x, y });
    }
  }
  
  return result;
}

export function DrawingCanvas({
  isOpen,
  onClose,
  onSave,
  width,
  height,
  backgroundImage,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);
  const [brushType, setBrushType] = useState<"pen" | "neon" | "eraser">("pen");
  const [brushSize, setBrushSize] = useState(8);
  const [selectedColor, setSelectedColor] = useState("#FFFFFF");
  const [isEyedropping, setIsEyedropping] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all paths
    [...paths, currentPath].filter(Boolean).forEach((path) => {
      if (!path || path.points.length < 2) return;

      const smoothedPoints = smoothPath(path.points);
      
      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (path.type === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = path.size * 2;
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else if (path.type === "neon") {
        ctx.globalCompositeOperation = "source-over";
        ctx.lineWidth = path.size;
        ctx.strokeStyle = path.color;
        ctx.shadowColor = path.color;
        ctx.shadowBlur = 20;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.lineWidth = path.size;
        ctx.strokeStyle = path.color;
        ctx.shadowBlur = 0;
      }

      ctx.moveTo(smoothedPoints[0].x, smoothedPoints[0].y);
      for (let i = 1; i < smoothedPoints.length; i++) {
        ctx.lineTo(smoothedPoints[i].x, smoothedPoints[i].y);
      }
      ctx.stroke();

      // Reset shadow for next path
      ctx.shadowBlur = 0;
    });

    ctx.globalCompositeOperation = "source-over";
  }, [paths, currentPath]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getCanvasPosition = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    const pos = getCanvasPosition(e);
    if (!pos) return;

    if (isEyedropping) {
      // Pick color from canvas or background
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const pixel = ctx.getImageData(pos.x, pos.y, 1, 1).data;
          const hex = `#${[pixel[0], pixel[1], pixel[2]].map(x => x.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
          setSelectedColor(hex);
        }
      }
      setIsEyedropping(false);
      return;
    }

    setIsDrawing(true);
    setCurrentPath({
      points: [pos],
      color: selectedColor,
      size: brushSize,
      type: brushType,
      opacity: 1,
    });
  };

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || !currentPath) return;
    e.preventDefault();

    const pos = getCanvasPosition(e);
    if (!pos) return;

    setCurrentPath((prev) => prev ? {
      ...prev,
      points: [...prev.points, pos],
    } : null);
  };

  const handleEnd = () => {
    if (currentPath && currentPath.points.length > 1) {
      setPaths((prev) => [...prev, currentPath]);
    }
    setCurrentPath(null);
    setIsDrawing(false);
  };

  const handleUndo = () => {
    setPaths((prev) => prev.slice(0, -1));
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL("image/png"));
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),16px)] pb-3">
        <button
          onClick={onClose}
          className="text-white text-lg font-medium"
        >
          Cancelar
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleUndo}
            disabled={paths.length === 0}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30"
          >
            <Undo2 size={20} className="text-white" />
          </button>
          
          <button
            onClick={handleSave}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
          >
            <Check size={22} className="text-black" />
          </button>
        </div>
      </div>

      {/* Brush type selector */}
      <div className="px-4 pb-3 flex justify-center gap-2">
        {(["pen", "neon", "eraser"] as const).map((type) => (
          <button
            key={type}
            onClick={() => {
              setBrushType(type);
              if (navigator.vibrate) navigator.vibrate(10);
            }}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all
              ${brushType === type ? "bg-white text-black" : "bg-white/10 text-white"}
            `}
          >
            {type === "pen" ? "Plumón" : type === "neon" ? "Neón" : "Borrador"}
          </button>
        ))}
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {/* Background image */}
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
          />
        )}

        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="touch-none"
          style={{
            width: "100%",
            height: "auto",
            maxHeight: "100%",
            aspectRatio: `${width}/${height}`,
          }}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
        />
      </div>

      {/* Bottom controls */}
      <div className="px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        {/* Brush size slider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-4 h-4 rounded-full bg-white/30" />
          <input
            type="range"
            min="2"
            max="30"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="flex-1"
          />
          <div className="w-8 h-8 rounded-full bg-white/30" />
        </div>

        {/* Color palette with eyedropper */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsEyedropping(!isEyedropping);
              if (navigator.vibrate) navigator.vibrate(10);
            }}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${isEyedropping ? "bg-white" : "bg-white/10"}
            `}
          >
            <Pipette size={20} className={isEyedropping ? "text-black" : "text-white"} />
          </button>

          <div className="flex-1 flex gap-3 overflow-x-auto scrollbar-hide">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedColor(c.color);
                  if (navigator.vibrate) navigator.vibrate(10);
                }}
                className={`
                  flex-shrink-0 w-8 h-8 rounded-full transition-all
                  ${selectedColor === c.color ? "ring-2 ring-white ring-offset-2 ring-offset-black" : ""}
                `}
                style={{ backgroundColor: c.color }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
