import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, Textbox, FabricObject, FabricImage, Shadow } from 'fabric';
import { motion, AnimatePresence } from 'motion/react';
import { X, Undo2, Redo2, Download, ChevronRight, Type, Smile, Sparkles, Palette } from 'lucide-react';
import { useEditorStore } from './store/useEditorStore';
import { exportAsJPG } from './utils/exportUtils';
import { publishStoryFromCanvas } from './storyPublisher';
import { loadFont } from './utils/fontLoader';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './utils/constants';
import { toast } from 'sonner';
import { useHaptic } from '@/hooks/useHaptic';
import { TrashZone } from './components/TrashZone';

// Filter presets - Instagram style
const FILTERS = [
  { id: 'none', name: 'Normal', filter: '' },
  { id: 'clarendon', name: 'Clarendon', filter: 'contrast(1.2) saturate(1.35)' },
  { id: 'gingham', name: 'Gingham', filter: 'brightness(1.05) hue-rotate(-10deg)' },
  { id: 'moon', name: 'Moon', filter: 'grayscale(1) contrast(1.1) brightness(1.1)' },
  { id: 'lark', name: 'Lark', filter: 'contrast(0.9) saturate(1.25) brightness(1.1)' },
  { id: 'reyes', name: 'Reyes', filter: 'sepia(0.22) contrast(0.85) brightness(1.1) saturate(0.75)' },
  { id: 'juno', name: 'Juno', filter: 'saturate(1.4) contrast(1.15) brightness(1.1)' },
  { id: 'slumber', name: 'Slumber', filter: 'saturate(0.66) brightness(1.05) sepia(0.1)' },
];

// Font options
const FONTS = [
  'Inter', 'Playfair Display', 'Bebas Neue', 'Dancing Script', 'Roboto Mono', 'Pacifico'
];

// Color palette
const COLORS = [
  '#FFFFFF', '#000000', '#FF3B30', '#FF9500', '#FFCC00', 
  '#34C759', '#5AC8FA', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55'
];

// Stickers/Emojis
const STICKERS = ['❤️', '🔥', '✨', '💯', '🎉', '😍', '🙌', '💪', '⭐', '🌟', '💕', '🎊'];

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [scale, setScale] = useState(1);
  const [activeFilter, setActiveFilter] = useState('none');
  const [activePanel, setActivePanel] = useState<'none' | 'text' | 'stickers' | 'filters' | 'colors'>('none');
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [editingText, setEditingText] = useState('');
  const [textStyle, setTextStyle] = useState({ font: 'Inter', color: '#FFFFFF', size: 56 });
  const [isDragging, setIsDragging] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const draggedObjectRef = useRef<FabricObject | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const haptic = useHaptic();

  const { initWithBackground, reset, undo, redo, canUndo, canRedo, saveToHistory } = useEditorStore();

  // Initialize editor with background
  useEffect(() => {
    if (isOpen && backgroundImage) {
      initWithBackground(backgroundImage);
    }
  }, [isOpen, backgroundImage, initWithBackground]);

  // Calculate responsive scale
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const scaleX = containerWidth / CANVAS_WIDTH;
      const scaleY = containerHeight / CANVAS_HEIGHT;
      const newScale = Math.min(scaleX, scaleY, 1); // Max 1 to not upscale
      setScale(newScale);
      
      // Update Fabric canvas viewport transform for proper scaling
      if (fabricRef.current) {
        fabricRef.current.setDimensions({
          width: CANVAS_WIDTH * newScale,
          height: CANVAS_HEIGHT * newScale,
        });
        fabricRef.current.setViewportTransform([newScale, 0, 0, newScale, 0, 0]);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [isOpen]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !isOpen) return;
    if (fabricRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: 'transparent',
      selection: true,
      preserveObjectStacking: true,
      allowTouchScrolling: false,
    });

    // Minimal iOS-style controls
    FabricObject.prototype.set({
      cornerColor: '#FFFFFF',
      cornerStrokeColor: 'rgba(255,255,255,0.8)',
      cornerSize: 12,
      transparentCorners: false,
      cornerStyle: 'circle',
      borderColor: 'rgba(255,255,255,0.5)',
      borderScaleFactor: 1,
      padding: 8,
      rotatingPointOffset: 40,
      lockScalingFlip: true,
      borderDashArray: [0],
    });

    fabricRef.current = canvas;

    // Touch/Mouse events for drag to delete
    canvas.on('object:moving', (e) => {
      const obj = e.target;
      if (!obj) return;

      if (!draggedObjectRef.current) {
        setIsDragging(true);
        draggedObjectRef.current = obj;
        haptic.light();
      }

      // Check if over trash zone
      const objCenterY = (obj.top || 0) + (obj.getScaledHeight() / 2);
      const normalizedY = objCenterY / CANVAS_HEIGHT;
      const nowOverTrash = normalizedY > 0.85;

      setIsOverTrash((prev) => {
        if (nowOverTrash !== prev && nowOverTrash) haptic.warning();
        return nowOverTrash;
      });
    });

    canvas.on('object:modified', (e) => {
      const obj = e.target;
      if (isOverTrash && obj) {
        canvas.remove(obj);
        haptic.success();
      }
      setIsDragging(false);
      setIsOverTrash(false);
      draggedObjectRef.current = null;
      saveToHistory();
    });

    canvas.on('mouse:up', () => {
      if (isOverTrash && draggedObjectRef.current) {
        canvas.remove(draggedObjectRef.current);
        haptic.success();
      }
      setIsDragging(false);
      draggedObjectRef.current = null;
    });

    // Double tap to edit text
    let lastTap = 0;
    canvas.on('mouse:down', (e) => {
      const now = Date.now();
      if (now - lastTap < 300 && e.target instanceof Textbox) {
        e.target.enterEditing();
        haptic.light();
      }
      lastTap = now;
    });

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [isOpen, haptic, isOverTrash, saveToHistory]);

  // Load background into Fabric (for export/publish) and apply scale
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !backgroundImage || !isOpen) return;

    FabricImage.fromURL(backgroundImage, { crossOrigin: 'anonymous' })
      .then((img) => {
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
        });

        canvas.backgroundColor = 'transparent';
        canvas.backgroundImage = img;
        
        // Apply current scale
        canvas.setDimensions({
          width: CANVAS_WIDTH * scale,
          height: CANVAS_HEIGHT * scale,
        });
        canvas.setViewportTransform([scale, 0, 0, scale, 0, 0]);
        canvas.requestRenderAll();
      })
      .catch((err) => {
        console.error('Error loading story background:', err);
      });
  }, [backgroundImage, isOpen, scale]);

  // Handle canvas tap - open text editor
  const handleCanvasTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).tagName === 'CANVAS') {
      const canvas = fabricRef.current;
      if (canvas && !canvas.getActiveObject()) {
        setIsTextEditing(true);
        setEditingText('');
        setTimeout(() => inputRef.current?.focus(), 100);
        haptic.light();
      }
    }
  }, [haptic]);

  // Add text to canvas
  const addText = useCallback(() => {
    if (!editingText.trim() || !fabricRef.current) return;

    loadFont(textStyle.font);

    const textbox = new Textbox(editingText, {
      left: CANVAS_WIDTH / 2,
      top: CANVAS_HEIGHT / 2,
      originX: 'center',
      originY: 'center',
      fontFamily: textStyle.font,
      fontSize: textStyle.size,
      fill: textStyle.color,
      textAlign: 'center',
      width: 800,
      editable: true,
      shadow: new Shadow({
        color: 'rgba(0,0,0,0.5)',
        blur: 20,
        offsetX: 0,
        offsetY: 4,
      }),
    });

    fabricRef.current.add(textbox);
    fabricRef.current.setActiveObject(textbox);
    fabricRef.current.renderAll();
    saveToHistory();

    setIsTextEditing(false);
    setEditingText('');
    haptic.success();
  }, [editingText, textStyle, saveToHistory, haptic]);

  // Add sticker
  const addSticker = useCallback((emoji: string) => {
    if (!fabricRef.current) return;

    const text = new Textbox(emoji, {
      left: CANVAS_WIDTH / 2,
      top: CANVAS_HEIGHT / 2,
      originX: 'center',
      originY: 'center',
      fontSize: 100,
      fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif',
      editable: false,
    });

    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    fabricRef.current.renderAll();
    saveToHistory();
    setActivePanel('none');
    haptic.success();
  }, [saveToHistory, haptic]);

  // Apply filter
  const applyFilter = useCallback((filterId: string) => {
    setActiveFilter(filterId);
    haptic.light();
  }, [haptic]);

  // Publish
  const handlePublish = async () => {
    if (!fabricRef.current) return;

    setIsPublishing(true);
    try {
      const blob = await exportAsJPG(fabricRef.current);
      await publishStoryFromCanvas(blob, tenantId);
      toast.success('¡Historia publicada!');
      onSuccess();
      reset();
      onClose();
    } catch (error) {
      toast.error('Error al publicar');
    } finally {
      setIsPublishing(false);
    }
  };

  // Download
  const handleDownload = async () => {
    if (!fabricRef.current) return;
    try {
      const blob = await exportAsJPG(fabricRef.current);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `story-${Date.now()}.jpg`;
      link.click();
      URL.revokeObjectURL(url);
      haptic.success();
    } catch {
      toast.error('Error al descargar');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const getFilterStyle = () => {
    const filter = FILTERS.find(f => f.id === activeFilter);
    return filter?.filter || '';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black"
      >
        {/* Canvas Area - Full Screen */}
        <div
          ref={containerRef}
          className="absolute inset-0 flex items-center justify-center"
          onClick={handleCanvasTap}
          onTouchEnd={handleCanvasTap}
        >
          {/* Canvas Container */}
          <div
            className="relative overflow-hidden"
            style={{
              width: CANVAS_WIDTH * scale,
              height: CANVAS_HEIGHT * scale,
              filter: getFilterStyle(),
            }}
          >
            {/* Background image as fallback while Fabric loads */}
            <img
              src={backgroundImage}
              alt="Foto para editar"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
              loading="eager"
              decoding="async"
            />

            {/* Fabric canvas for editing - on top */}
            <canvas
              ref={canvasRef}
              className="touch-none block absolute inset-0 z-10"
              style={{
                width: CANVAS_WIDTH * scale,
                height: CANVAS_HEIGHT * scale,
              }}
            />
          </div>

          {/* Trash Zone */}
          <TrashZone
            isVisible={isDragging}
            isHovering={isOverTrash}
            onDrop={() => {}}
          />
        </div>

        {/* Top Bar - Fixed */}
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 z-50"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
        >
          {/* Close */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center"
          >
            <X size={22} className="text-white" />
          </motion.button>

          {/* Undo/Redo */}
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-xl rounded-full p-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { haptic.light(); undo(); }}
              disabled={!canUndo()}
              className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30"
            >
              <Undo2 size={18} className="text-white" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { haptic.light(); redo(); }}
              disabled={!canRedo()}
              className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30"
            >
              <Redo2 size={18} className="text-white" />
            </motion.button>
          </div>

          {/* Download */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleDownload}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center"
          >
            <Download size={18} className="text-white" />
          </motion.button>
        </div>

        {/* Right Sidebar - Vertical Tools - Positioned safely */}
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-40"
        >
          {[
            { id: 'text', icon: Type },
            { id: 'stickers', icon: Smile },
            { id: 'filters', icon: Sparkles },
            { id: 'colors', icon: Palette },
          ].map((tool) => (
            <motion.button
              key={tool.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                haptic.light();
                if (tool.id === 'text') {
                  setIsTextEditing(true);
                  setTimeout(() => inputRef.current?.focus(), 100);
                } else {
                  setActivePanel(activePanel === tool.id as any ? 'none' : tool.id as any);
                }
              }}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                activePanel === tool.id
                  ? 'bg-white text-black'
                  : 'bg-black/50 backdrop-blur-xl text-white'
              }`}
            >
              <tool.icon size={20} />
            </motion.button>
          ))}
        </div>

        {/* Publish Button - Bottom Center */}
        <div
          className="absolute bottom-0 left-0 right-0 flex justify-center pb-4 z-50"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handlePublish}
            disabled={isPublishing}
            className="h-11 px-8 rounded-full bg-white flex items-center gap-2 shadow-2xl"
          >
            {isPublishing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full"
              />
            ) : (
              <>
                <span className="text-black font-semibold text-sm">Publicar</span>
                <ChevronRight size={18} className="text-black" />
              </>
            )}
          </motion.button>
        </div>

        {/* Text Editor Overlay */}
        <AnimatePresence>
          {isTextEditing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-[300] px-6"
              style={{
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}
            >
              {/* Close text editor */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsTextEditing(false)}
                className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                style={{ marginTop: 'env(safe-area-inset-top)' }}
              >
                <X size={24} className="text-white" />
              </motion.button>

              {/* Done button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={addText}
                className="absolute top-4 right-4 px-5 h-10 rounded-full bg-white flex items-center justify-center"
                style={{ marginTop: 'env(safe-area-inset-top)' }}
              >
                <span className="text-black font-semibold text-sm">Listo</span>
              </motion.button>

              {/* Live Preview Text */}
              <div
                className="w-full max-w-lg text-center mb-8"
                style={{
                  fontFamily: textStyle.font,
                  fontSize: `${textStyle.size * 0.5}px`,
                  color: textStyle.color,
                  textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  minHeight: '60px',
                }}
              >
                {editingText || 'Escribe algo...'}
              </div>

              {/* Text Input */}
              <input
                ref={inputRef}
                type="text"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addText()}
                placeholder="Escribe aquí..."
                className="w-full max-w-lg bg-transparent border-b-2 border-white/30 text-white text-center text-xl py-3 outline-none placeholder:text-white/40"
                autoFocus
              />

              {/* Font Selector */}
              <div className="flex gap-2 mt-8 overflow-x-auto pb-4 w-full max-w-lg justify-center">
                {FONTS.map((font) => (
                  <motion.button
                    key={font}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setTextStyle(s => ({ ...s, font }));
                      loadFont(font);
                      haptic.light();
                    }}
                    className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                      textStyle.font === font
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white'
                    }`}
                    style={{ fontFamily: font }}
                  >
                    {font.split(' ')[0]}
                  </motion.button>
                ))}
              </div>

              {/* Color Selector */}
              <div className="flex gap-3 mt-4">
                {COLORS.slice(0, 8).map((color) => (
                  <motion.button
                    key={color}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setTextStyle(s => ({ ...s, color }));
                      haptic.light();
                    }}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      textStyle.color === color ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stickers Panel */}
        <AnimatePresence>
          {activePanel === 'stickers' && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl rounded-t-3xl z-[250] p-6"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
            >
              <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-6" />
              <div className="grid grid-cols-6 gap-4 max-w-sm mx-auto">
                {STICKERS.map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => addSticker(emoji)}
                    className="text-4xl p-2 rounded-xl active:bg-white/10 transition-colors"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters Panel */}
        <AnimatePresence>
          {activePanel === 'filters' && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl rounded-t-3xl z-[250] p-6"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
            >
              <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-6" />
              <div className="flex gap-4 overflow-x-auto pb-2">
                {FILTERS.map((filter) => (
                  <motion.button
                    key={filter.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => applyFilter(filter.id)}
                    className="flex flex-col items-center gap-2 min-w-[70px]"
                  >
                    <div
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        activeFilter === filter.id ? 'border-white' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={backgroundImage}
                        alt={filter.name}
                        className="w-full h-full object-cover"
                        style={{ filter: filter.filter }}
                      />
                    </div>
                    <span className={`text-xs ${
                      activeFilter === filter.id ? 'text-white font-semibold' : 'text-white/60'
                    }`}>
                      {filter.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Colors Panel */}
        <AnimatePresence>
          {activePanel === 'colors' && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl rounded-t-3xl z-[250] p-6"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
            >
              <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-6" />
              <p className="text-white/60 text-center text-sm mb-4">Selecciona un elemento y elige un color</p>
              <div className="flex justify-center gap-3 flex-wrap max-w-xs mx-auto">
                {COLORS.map((color) => (
                  <motion.button
                    key={color}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      const canvas = fabricRef.current;
                      const active = canvas?.getActiveObject();
                      if (active && 'set' in active) {
                        active.set('fill', color);
                        canvas?.renderAll();
                        saveToHistory();
                        haptic.light();
                      }
                    }}
                    className="w-10 h-10 rounded-full border-2 border-white/20"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}