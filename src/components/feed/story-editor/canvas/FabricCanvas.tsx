import { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, FabricImage, Rect, Circle, Textbox, FabricObject, Triangle, Line, Shadow } from 'fabric';
import { useEditorStore } from '../store/useEditorStore';
import { CANVAS_WIDTH, CANVAS_HEIGHT, SAFE_ZONE } from '../utils/constants';
import { loadFont } from '../utils/fontLoader';
import { TrashZone } from '../components/TrashZone';
import { useHaptic } from '@/hooks/useHaptic';
import type { EditorElement, ShapeType } from '../store/types';

interface FabricCanvasProps {
  backgroundImage: string;
  onReady?: (canvas: Canvas) => void;
}

export function FabricCanvas({ backgroundImage, onReady }: FabricCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const draggedObjectRef = useRef<FabricObject | null>(null);
  const haptic = useHaptic();

  const {
    selectedElementId,
    showSafeZones,
    zoom,
    selectElement,
    updateElement,
    deleteElement,
    saveToHistory,
  } = useEditorStore();

  // Handle delete when dropped on trash
  const handleTrashDrop = useCallback(() => {
    if (draggedObjectRef.current && selectedElementId) {
      const canvas = fabricRef.current;
      if (canvas) {
        canvas.remove(draggedObjectRef.current);
        deleteElement(selectedElementId);
        haptic.success();
      }
    }
    setIsDragging(false);
    setIsOverTrash(false);
    draggedObjectRef.current = null;
  }, [selectedElementId, deleteElement, haptic]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#000000',
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      enableRetinaScaling: true,
      allowTouchScrolling: false,
    });

    // Configure object controls (iOS style - minimalist and clean)
    FabricObject.prototype.set({
      cornerColor: '#FFFFFF',
      cornerStrokeColor: 'rgba(0, 122, 255, 0.8)',
      cornerSize: 16,
      transparentCorners: false,
      cornerStyle: 'circle',
      borderColor: 'rgba(0, 122, 255, 0.6)',
      borderScaleFactor: 1.5,
      padding: 12,
      rotatingPointOffset: 50,
      lockScalingFlip: true,
    });

    // Custom control styling for iOS feel
    FabricObject.prototype.set({
      borderDashArray: [0],
      borderOpacityWhenMoving: 0.4,
    });

    fabricRef.current = canvas;
    onReady?.(canvas);

    // Event handlers
    canvas.on('selection:created', (e) => {
      const selected = e.selected?.[0];
      if (selected?.get('id')) {
        selectElement(selected.get('id') as string);
        haptic.selection();
      }
    });

    canvas.on('selection:updated', (e) => {
      const selected = e.selected?.[0];
      if (selected?.get('id')) {
        selectElement(selected.get('id') as string);
        haptic.selection();
      }
    });

    canvas.on('selection:cleared', () => {
      selectElement(null);
    });

    // Drag start - show trash zone
    canvas.on('object:moving', (e) => {
      const obj = e.target;
      if (!obj) return;

      // First move triggers drag start
      if (!draggedObjectRef.current && obj) {
        setIsDragging(true);
        draggedObjectRef.current = obj;
        haptic.light();
      }

      // Check if over trash zone (bottom 20% of canvas)
      const objCenterY = (obj.top || 0) + (obj.getScaledHeight() / 2);
      const normalizedY = objCenterY / CANVAS_HEIGHT;
      
      const nowOverTrash = normalizedY > 0.8;
      
      setIsOverTrash((prev) => {
        if (nowOverTrash !== prev) {
          if (nowOverTrash) {
            haptic.warning();
          }
        }
        return nowOverTrash;
      });

      // Update store
      if (obj.get('id')) {
        updateElement(obj.get('id') as string, {
          x: obj.left || 0,
          y: obj.top || 0,
        });
      }
    });

    canvas.on('object:modified', (e) => {
      const obj = e.target;
      
      // Normal modification
      if (obj?.get('id')) {
        updateElement(obj.get('id') as string, {
          x: obj.left || 0,
          y: obj.top || 0,
          width: obj.getScaledWidth(),
          height: obj.getScaledHeight(),
          rotation: obj.angle || 0,
          scaleX: obj.scaleX || 1,
          scaleY: obj.scaleY || 1,
        });
        saveToHistory();
      }

      setIsDragging(false);
      draggedObjectRef.current = null;
    });

    canvas.on('object:scaling', (e) => {
      const obj = e.target;
      if (obj?.get('id')) {
        updateElement(obj.get('id') as string, {
          scaleX: obj.scaleX || 1,
          scaleY: obj.scaleY || 1,
          width: obj.getScaledWidth(),
          height: obj.getScaledHeight(),
        });
      }
    });

    canvas.on('object:rotating', (e) => {
      const obj = e.target;
      if (obj?.get('id')) {
        updateElement(obj.get('id') as string, {
          rotation: obj.angle || 0,
        });
      }
      haptic.light();
    });

    // Touch-optimized: Double tap to edit text
    let lastTap = 0;
    canvas.on('mouse:down', (e) => {
      const now = Date.now();
      if (now - lastTap < 300 && e.target instanceof Textbox) {
        e.target.enterEditing();
        e.target.selectAll();
        haptic.light();
      }
      lastTap = now;
    });

    // Cancel drag on touch end without move
    canvas.on('mouse:up', () => {
      setIsDragging(false);
      draggedObjectRef.current = null;
    });

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Handle trash drop when isOverTrash changes and dragging ends
  useEffect(() => {
    if (!isDragging && isOverTrash && draggedObjectRef.current) {
      handleTrashDrop();
    }
  }, [isDragging, isOverTrash, handleTrashDrop]);

  // Load background image
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !backgroundImage) return;

    FabricImage.fromURL(backgroundImage, { crossOrigin: 'anonymous' }).then((img) => {
      // Scale to cover canvas
      const scaleX = CANVAS_WIDTH / img.width!;
      const scaleY = CANVAS_HEIGHT / img.height!;
      const imgScale = Math.max(scaleX, scaleY);

      img.set({
        scaleX: imgScale,
        scaleY: imgScale,
        left: (CANVAS_WIDTH - img.width! * imgScale) / 2,
        top: (CANVAS_HEIGHT - img.height! * imgScale) / 2,
        selectable: false,
        evented: false,
        excludeFromExport: false,
      });

      canvas.backgroundImage = img;
      canvas.renderAll();
    });
  }, [backgroundImage]);

  // Calculate responsive scale
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      const scaleX = containerWidth / CANVAS_WIDTH;
      const scaleY = containerHeight / CANVAS_HEIGHT;
      const newScale = Math.min(scaleX, scaleY) * zoom;
      
      setScale(newScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [zoom]);

  // Draw safe zones overlay
  const renderSafeZones = () => {
    if (!showSafeZones) return null;

    return (
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `scale(${scale})`, 
          transformOrigin: 'top left' 
        }}
      >
        {/* Top safe zone */}
        <div 
          className="absolute left-0 right-0 top-0 bg-red-500/5 border-b border-dashed border-red-500/20"
          style={{ height: SAFE_ZONE.top }}
        />
        {/* Bottom safe zone */}
        <div 
          className="absolute left-0 right-0 bottom-0 bg-red-500/5 border-t border-dashed border-red-500/20"
          style={{ height: SAFE_ZONE.bottom }}
        />
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black"
    >
      <div 
        className="relative"
        style={{
          width: CANVAS_WIDTH * scale,
          height: CANVAS_HEIGHT * scale,
        }}
      >
        <canvas
          ref={canvasRef}
          className="touch-none"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
        {renderSafeZones()}
      </div>

      {/* Trash Zone */}
      <TrashZone
        isVisible={isDragging}
        isHovering={isOverTrash}
        onDrop={handleTrashDrop}
      />
    </div>
  );
}

// Helper function to add text to canvas
export function addTextToCanvas(
  canvas: Canvas,
  text: string,
  options: Partial<EditorElement['properties']> = {}
): FabricObject {
  const fontFamily = options.fontFamily || 'Inter';
  
  loadFont(fontFamily);

  const textbox = new Textbox(text, {
    left: CANVAS_WIDTH / 2,
    top: CANVAS_HEIGHT / 2,
    originX: 'center',
    originY: 'center',
    fontFamily,
    fontSize: options.fontSize || 56,
    fontWeight: options.fontWeight || 600,
    fill: options.fill || '#FFFFFF',
    textAlign: options.textAlign || 'center',
    width: 800,
    editable: true,
    shadow: options.textShadow 
      ? new Shadow({
          color: options.textShadow.color,
          blur: options.textShadow.blur,
          offsetX: options.textShadow.offsetX,
          offsetY: options.textShadow.offsetY,
        }) 
      : new Shadow({
          color: 'rgba(0,0,0,0.4)',
          blur: 12,
          offsetX: 0,
          offsetY: 4,
        }),
    charSpacing: 20,
  });

  const id = `text_${Date.now()}`;
  textbox.set('id', id);

  canvas.add(textbox);
  canvas.setActiveObject(textbox);
  canvas.renderAll();

  return textbox;
}

// Helper function to add shape to canvas
export function addShapeToCanvas(
  canvas: Canvas,
  shapeType: ShapeType,
  options: Partial<EditorElement['properties']> = {}
): FabricObject {
  let shape: FabricObject;
  const fillColor = options.fillColor || '#FFFFFF';
  const strokeColor = options.strokeColor || 'transparent';
  const strokeWidth = options.strokeWidth || 0;

  const baseOptions = {
    left: CANVAS_WIDTH / 2,
    top: CANVAS_HEIGHT / 2,
    originX: 'center' as const,
    originY: 'center' as const,
    fill: fillColor,
    stroke: strokeColor,
    strokeWidth,
  };

  switch (shapeType) {
    case 'circle':
      shape = new Circle({
        ...baseOptions,
        radius: 100,
      });
      break;
    case 'triangle':
      shape = new Triangle({
        ...baseOptions,
        width: 200,
        height: 200,
      });
      break;
    case 'line':
      shape = new Line([0, 0, 300, 0], {
        ...baseOptions,
        stroke: fillColor,
        strokeWidth: 4,
      });
      break;
    case 'rect':
    default:
      shape = new Rect({
        ...baseOptions,
        width: 200,
        height: 200,
        rx: options.borderRadius || 16,
        ry: options.borderRadius || 16,
      });
      break;
  }

  const id = `shape_${Date.now()}`;
  shape.set('id', id);

  canvas.add(shape);
  canvas.setActiveObject(shape);
  canvas.renderAll();

  return shape;
}

// Helper function to add emoji/sticker to canvas
export function addStickerToCanvas(
  canvas: Canvas,
  emoji: string
): FabricObject {
  const text = new Textbox(emoji, {
    left: CANVAS_WIDTH / 2,
    top: CANVAS_HEIGHT / 2,
    originX: 'center',
    originY: 'center',
    fontSize: 100,
    fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
    editable: false,
  });

  const id = `sticker_${Date.now()}`;
  text.set('id', id);

  canvas.add(text);
  canvas.setActiveObject(text);
  canvas.renderAll();

  return text;
}

// Helper function to add image to canvas
export async function addImageToCanvas(
  canvas: Canvas,
  imageUrl: string
): Promise<FabricObject> {
  const img = await FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' });
  
  const maxSize = 400;
  const imgScale = Math.min(maxSize / img.width!, maxSize / img.height!);
  
  img.set({
    left: CANVAS_WIDTH / 2,
    top: CANVAS_HEIGHT / 2,
    originX: 'center',
    originY: 'center',
    scaleX: imgScale,
    scaleY: imgScale,
  });

  const id = `image_${Date.now()}`;
  img.set('id', id);

  canvas.add(img);
  canvas.setActiveObject(img);
  canvas.renderAll();

  return img;
}
