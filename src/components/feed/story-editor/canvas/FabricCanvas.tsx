import { useRef, useEffect, useState } from 'react';
import { Canvas, FabricImage, Rect, Circle, Textbox, FabricObject, Triangle, Line, Shadow } from 'fabric';
import { useEditorStore } from '../store/useEditorStore';
import { CANVAS_WIDTH, CANVAS_HEIGHT, SAFE_ZONE } from '../utils/constants';
import { loadFont } from '../utils/fontLoader';
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

  const {
    elements,
    selectedElementId,
    showSafeZones,
    zoom,
    selectElement,
    updateElement,
    saveToHistory,
  } = useEditorStore();

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
    });

    // Configure object controls (iOS style)
    FabricObject.prototype.set({
      cornerColor: '#FFFFFF',
      cornerStrokeColor: '#007AFF',
      cornerSize: 14,
      transparentCorners: false,
      cornerStyle: 'circle',
      borderColor: '#007AFF',
      borderScaleFactor: 2,
      padding: 10,
    });

    fabricRef.current = canvas;
    onReady?.(canvas);

    // Event handlers
    canvas.on('selection:created', (e) => {
      const selected = e.selected?.[0];
      if (selected?.get('id')) {
        selectElement(selected.get('id') as string);
      }
    });

    canvas.on('selection:updated', (e) => {
      const selected = e.selected?.[0];
      if (selected?.get('id')) {
        selectElement(selected.get('id') as string);
      }
    });

    canvas.on('selection:cleared', () => {
      selectElement(null);
    });

    canvas.on('object:modified', (e) => {
      const obj = e.target;
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
    });

    canvas.on('object:moving', (e) => {
      const obj = e.target;
      if (obj?.get('id')) {
        updateElement(obj.get('id') as string, {
          x: obj.left || 0,
          y: obj.top || 0,
        });
      }
    });

    // Double click to edit text
    canvas.on('mouse:dblclick', (e) => {
      const target = e.target;
      if (target && target instanceof Textbox) {
        target.enterEditing();
        target.selectAll();
      }
    });

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Load background image
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !backgroundImage) return;

    FabricImage.fromURL(backgroundImage, { crossOrigin: 'anonymous' }).then((img) => {
      // Scale to cover canvas
      const scaleX = CANVAS_WIDTH / img.width!;
      const scaleY = CANVAS_HEIGHT / img.height!;
      const scale = Math.max(scaleX, scaleY);

      img.set({
        scaleX: scale,
        scaleY: scale,
        left: (CANVAS_WIDTH - img.width! * scale) / 2,
        top: (CANVAS_HEIGHT - img.height! * scale) / 2,
        selectable: false,
        evented: false,
        excludeFromExport: false,
      });

      // Set as background
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
      
      // Calculate scale to fit container while maintaining aspect ratio
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
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        {/* Top safe zone */}
        <div 
          className="absolute left-0 right-0 top-0 bg-red-500/10 border-b border-dashed border-red-500/30"
          style={{ height: SAFE_ZONE.top }}
        />
        {/* Bottom safe zone */}
        <div 
          className="absolute left-0 right-0 bottom-0 bg-red-500/10 border-t border-dashed border-red-500/30"
          style={{ height: SAFE_ZONE.bottom }}
        />
        {/* Left safe zone */}
        <div 
          className="absolute left-0 top-0 bottom-0 bg-red-500/10 border-r border-dashed border-red-500/30"
          style={{ width: SAFE_ZONE.left }}
        />
        {/* Right safe zone */}
        <div 
          className="absolute right-0 top-0 bottom-0 bg-red-500/10 border-l border-dashed border-red-500/30"
          style={{ width: SAFE_ZONE.right }}
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
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
        {renderSafeZones()}
      </div>
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
  
  // Ensure font is loaded
  loadFont(fontFamily);

  const textbox = new Textbox(text, {
    left: CANVAS_WIDTH / 2,
    top: CANVAS_HEIGHT / 2,
    originX: 'center',
    originY: 'center',
    fontFamily,
    fontSize: options.fontSize || 48,
    fontWeight: options.fontWeight || 400,
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
          color: 'rgba(0,0,0,0.5)',
          blur: 8,
          offsetX: 0,
          offsetY: 2,
        }),
  });

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
        rx: options.borderRadius || 0,
        ry: options.borderRadius || 0,
      });
      break;
  }

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
    fontSize: 80,
    fontFamily: 'Arial',
    editable: false,
  });

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
  
  // Scale to reasonable size
  const maxSize = 400;
  const scale = Math.min(maxSize / img.width!, maxSize / img.height!);
  
  img.set({
    left: CANVAS_WIDTH / 2,
    top: CANVAS_HEIGHT / 2,
    originX: 'center',
    originY: 'center',
    scaleX: scale,
    scaleY: scale,
  });

  canvas.add(img);
  canvas.setActiveObject(img);
  canvas.renderAll();

  return img;
}
