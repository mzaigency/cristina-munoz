import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { Pen, Edit3, Highlighter, Sparkles, Undo, X, Check, Eraser, Trash2 } from "lucide-react";
import { STORY_COLORS, BRUSH_SIZES, BRUSH_TYPES } from "@/constants/story-assets";
import { cn } from "@/lib/utils";

interface DrawingCanvasProps {
  width: number;
  height: number;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

interface DrawingPath {
  points: { x: number; y: number }[];
  color: string;
  size: number;
  type: string;
  opacity: number;
}

const BRUSH_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Pen, Edit3, Highlighter, Sparkles
};

export const DrawingCanvas = ({ width, height, onSave, onClose }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#FFFFFF");
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[2]);
  const [brushType, setBrushType] = useState(BRUSH_TYPES[0]);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);
  const [isEraser, setIsEraser] = useState(false);

  // Obtener opacidad según tipo de brush
  const getBrushOpacity = useCallback(() => {
    switch (brushType.id) {
      case "highlighter":
        return 0.4;
      case "spray":
        return 0.6;
      default:
        return 1;
    }
  }, [brushType]);

  // Redibujar todo el canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redibujar todos los paths
    paths.forEach(path => {
      drawPath(ctx, path);
    });

    // Dibujar path actual
    if (currentPath) {
      drawPath(ctx, currentPath);
    }
  }, [paths, currentPath]);

  // Dibujar un path
  const drawPath = (ctx: CanvasRenderingContext2D, path: DrawingPath) => {
    if (path.points.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = path.color;
    ctx.lineWidth = path.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = path.opacity;

    // Efecto especial para spray
    if (path.type === "spray") {
      path.points.forEach(point => {
        for (let i = 0; i < 10; i++) {
          const offsetX = (Math.random() - 0.5) * path.size * 2;
          const offsetY = (Math.random() - 0.5) * path.size * 2;
          ctx.fillStyle = path.color;
          ctx.fillRect(point.x + offsetX, point.y + offsetY, 1, 1);
        }
      });
    } else {
      ctx.moveTo(path.points[0].x, path.points[0].y);
      
      for (let i = 1; i < path.points.length; i++) {
        const xc = (path.points[i].x + path.points[i - 1].x) / 2;
        const yc = (path.points[i].y + path.points[i - 1].y) / 2;
        ctx.quadraticCurveTo(path.points[i - 1].x, path.points[i - 1].y, xc, yc);
      }
      
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
  };

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

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

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
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
    
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || !currentPath) return;
    e.preventDefault();
    
    const pos = getPosition(e);
    
    setCurrentPath(prev => ({
      ...prev!,
      points: [...prev!.points, pos],
    }));
  };

  const endDrawing = () => {
    if (currentPath && currentPath.points.length > 1) {
      setPaths(prev => [...prev, currentPath]);
    }
    setCurrentPath(null);
    setIsDrawing(false);
  };

  const handleUndo = () => {
    setPaths(prev => prev.slice(0, -1));
    if (navigator.vibrate) {
      navigator.vibrate([10, 30, 10]);
    }
  };

  const handleClear = () => {
    setPaths([]);
    if (navigator.vibrate) {
      navigator.vibrate([20, 50, 20]);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
    
    if (navigator.vibrate) {
      navigator.vibrate([10, 50, 10, 50, 10]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col bg-black/90"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleUndo}
            disabled={paths.length === 0}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30"
          >
            <Undo className="w-5 h-5 text-white" />
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleClear}
            disabled={paths.length === 0}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30"
          >
            <Trash2 className="w-5 h-5 text-white" />
          </motion.button>
        </div>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
        >
          <Check className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
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
            cursor: isEraser ? "cell" : "crosshair"
          }}
        />
      </div>

      {/* Tools Panel */}
      <div className="p-4 space-y-3 bg-black/50">
        {/* Brush Types */}
        <div className="flex items-center gap-2 justify-center">
          {BRUSH_TYPES.map((type) => {
            const IconComponent = BRUSH_ICONS[type.icon];
            return (
              <motion.button
                key={type.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setBrushType(type);
                  setIsEraser(false);
                }}
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                  brushType.id === type.id && !isEraser
                    ? "bg-primary text-white"
                    : "bg-white/10 text-white/70"
                )}
              >
                {IconComponent && <IconComponent className="w-5 h-5" />}
              </motion.button>
            );
          })}
          
          {/* Eraser */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEraser(!isEraser)}
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
              isEraser ? "bg-red-500 text-white" : "bg-white/10 text-white/70"
            )}
          >
            <Eraser className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Brush Sizes */}
        <div className="flex items-center gap-2 justify-center">
          {BRUSH_SIZES.map((size) => (
            <motion.button
              key={size.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBrushSize(size)}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                brushSize.id === size.id ? "bg-white" : "bg-white/20"
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

        {/* Colors */}
        <div className="flex items-center gap-1.5 justify-center flex-wrap">
          {STORY_COLORS.slice(0, 12).map((color) => (
            <motion.button
              key={color}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setCurrentColor(color);
                setIsEraser(false);
              }}
              className={cn(
                "w-7 h-7 rounded-full transition-all border-2",
                currentColor === color && !isEraser
                  ? "border-white scale-110"
                  : "border-transparent"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
