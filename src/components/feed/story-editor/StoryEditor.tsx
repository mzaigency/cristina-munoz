import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas } from 'fabric';
import { motion, AnimatePresence } from 'motion/react';
import { FabricCanvas, addTextToCanvas, addShapeToCanvas, addStickerToCanvas } from './canvas/FabricCanvas';
import { TopBar } from './toolbar/TopBar';
import { BottomToolbar } from './toolbar/BottomToolbar';
import { TextPanel } from './panels/TextPanel';
import { ShapesPanel } from './panels/ShapesPanel';
import { StickersPanel } from './panels/StickersPanel';
import { FiltersPanel } from './panels/FiltersPanel';
import { LayersPanel } from './panels/LayersPanel';
import { WidgetsPanel } from './panels/WidgetsPanel';
import { useEditorStore } from './store/useEditorStore';
import { exportAsJPG } from './utils/exportUtils';
import { publishStoryFromCanvas } from './storyPublisher';
import { toast } from 'sonner';
import type { ShapeType, WidgetType } from './store/types';

interface StoryEditorProps {
  isOpen: boolean;
  onClose: () => void;
  backgroundImage: string;
  tenantId: string;
  onSuccess: () => void;
}

export function StoryEditor({
  isOpen,
  onClose,
  backgroundImage,
  tenantId,
  onSuccess,
}: StoryEditorProps) {
  const canvasRef = useRef<Canvas | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const { 
    initWithBackground, 
    reset, 
    addElement,
    setActivePanel,
  } = useEditorStore();

  // Initialize editor with background
  useEffect(() => {
    if (isOpen && backgroundImage) {
      initWithBackground(backgroundImage);
    }
  }, [isOpen, backgroundImage, initWithBackground]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleCanvasReady = useCallback((canvas: Canvas) => {
    canvasRef.current = canvas;
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    // TODO: Save draft
    toast.success('Historia guardada');
  };

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    
    try {
      const blob = await exportAsJPG(canvasRef.current);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `story-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Historia descargada');
    } catch (error) {
      toast.error('Error al descargar');
    }
  };

  const handlePublish = async () => {
    if (!canvasRef.current) return;
    
    setIsPublishing(true);
    try {
      const blob = await exportAsJPG(canvasRef.current);
      await publishStoryFromCanvas(blob, tenantId);
      toast.success('¡Historia publicada!');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Error al publicar');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAddText = (text: string, options: any) => {
    if (!canvasRef.current) return;
    const obj = addTextToCanvas(canvasRef.current, text, options);
    addElement({
      type: 'text',
      name: 'Texto',
      x: obj.left || 0,
      y: obj.top || 0,
      width: obj.getScaledWidth(),
      height: obj.getScaledHeight(),
      rotation: 0,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      locked: false,
      visible: true,
      properties: options,
    });
  };

  const handleAddShape = (shapeType: ShapeType, options: any) => {
    if (!canvasRef.current) return;
    const obj = addShapeToCanvas(canvasRef.current, shapeType, options);
    addElement({
      type: 'shape',
      name: `Forma ${shapeType}`,
      x: obj.left || 0,
      y: obj.top || 0,
      width: obj.getScaledWidth(),
      height: obj.getScaledHeight(),
      rotation: 0,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      locked: false,
      visible: true,
      properties: { shapeType, ...options },
    });
  };

  const handleAddSticker = (emoji: string) => {
    if (!canvasRef.current) return;
    const obj = addStickerToCanvas(canvasRef.current, emoji);
    addElement({
      type: 'sticker',
      name: emoji,
      x: obj.left || 0,
      y: obj.top || 0,
      width: obj.getScaledWidth(),
      height: obj.getScaledHeight(),
      rotation: 0,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      locked: false,
      visible: true,
      properties: { emoji },
    });
  };

  const handleAddWidget = (widgetType: WidgetType, config: any) => {
    // Widgets se añaden como stickers especiales por ahora
    handleAddSticker('📊');
    toast.info('Widget añadido - próximamente interactivo');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black flex flex-col"
      >
        {/* Top Bar */}
        <TopBar
          onClose={handleClose}
          onSave={handleSave}
          onDownload={handleDownload}
          onPublish={handlePublish}
          isPublishing={isPublishing}
        />

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <FabricCanvas
            backgroundImage={backgroundImage}
            onReady={handleCanvasReady}
          />
        </div>

        {/* Bottom Toolbar */}
        <BottomToolbar />

        {/* Panels */}
        <TextPanel onAddText={handleAddText} />
        <ShapesPanel onAddShape={handleAddShape} />
        <StickersPanel onAddSticker={handleAddSticker} />
        <FiltersPanel />
        <LayersPanel />
        <WidgetsPanel onAddWidget={handleAddWidget} />
      </motion.div>
    </AnimatePresence>
  );
}
