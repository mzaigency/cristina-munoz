import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "motion/react";
import {
  X,
  Type,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  ChevronRight,
  Send,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/contexts/NavigationContext";

// --- ESTILOS & FUENTES ---
const FONT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;800&family=Caveat:wght@700&family=Playfair+Display:ital,wght@1,700&family=Bebas+Neue&display=swap');
  
  .ios-blur {
    background: rgba(30, 30, 30, 0.65);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

const FONTS = [
  { id: "modern", name: "Modern", family: "'Inter', sans-serif", class: "font-extrabold tracking-tight" },
  { id: "poster", name: "Poster", family: "'Bebas Neue', sans-serif", class: "tracking-wide" },
  { id: "hand", name: "Hand", family: "'Caveat', cursive", class: "font-bold" },
  { id: "serif", name: "Editorial", family: "'Playfair Display', serif", class: "italic font-bold" },
];

const COLORS = [
  "#FFFFFF",
  "#000000",
  "#FF3B30",
  "#FF9500",
  "#FFCC00",
  "#34C759",
  "#007AFF",
  "#AF52DE",
  "#FF2D55",
  "#5AC8FA",
];

const FILTERS = [
  { id: "none", name: "Normal", style: "" },
  { id: "vivid", name: "Vivid", style: "contrast(1.1) saturate(1.3)" },
  { id: "warm", name: "Warm", style: "sepia(0.2) contrast(1.05)" },
  { id: "cool", name: "Cool", style: "hue-rotate(180deg) sepia(0.1) saturate(0.9)" },
  { id: "bw", name: "Mono", style: "grayscale(1) contrast(1.2)" },
];

// --- TYPES ---
interface OverlayItem {
  id: string;
  type: "text" | "sticker";
  content: string;
  fontFamily: string;
  color: string;
  align: "left" | "center" | "right";
  x: number;
  y: number;
  scale: number;
  rotation: number;
  isEditing?: boolean;
}

interface StoryCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess: () => void;
}

// --- COMPONENTE PRINCIPAL ---
export function StoryCreator({ isOpen, onClose, tenantId, onSuccess }: StoryCreatorProps) {
  // Estados Globales
  const [step, setStep] = useState<"capture" | "edit" | "publish">("capture");
  const [imageData, setImageData] = useState<string | null>(null);

  // Estados de Edición
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [activeFilter, setActiveFilter] = useState("none");
  const [isDragging, setIsDragging] = useState(false);
  const [deleteZoneActive, setDeleteZoneActive] = useState(false);

  // Estado de Texto Activo (Propiedades globales del editor actual)
  const [currentFont, setCurrentFont] = useState(FONTS[0].id);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [currentAlign, setCurrentAlign] = useState<"left" | "center" | "right">("center");

  // Publicación
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { setNavigationHidden } = useNavigation();

  useEffect(() => {
    setNavigationHidden(isOpen);
    if (!isOpen) {
      setStep("capture");
      setImageData(null);
      setOverlays([]);
      setCaption("");
    }
  }, [isOpen]);

  // --- LOGICA DE GESTOS E INTERACCIÓN ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageData(ev.target?.result as string);
        setStep("edit");
      };
      reader.readAsDataURL(file);
    }
  };

  // Crear texto al tocar la pantalla
  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Si estamos arrastrando o tocando un elemento existente, no hacemos nada
    if ((e.target as HTMLElement).closest(".overlay-item")) return;
    if (isDragging) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    const newText: OverlayItem = {
      id: Date.now().toString(),
      type: "text",
      content: "",
      fontFamily: FONTS.find((f) => f.id === currentFont)?.family || "sans-serif",
      color: currentColor,
      align: currentAlign,
      x,
      y,
      scale: 1,
      rotation: 0,
      isEditing: true, // Nace en modo edición
    };

    setOverlays([...overlays, newText]);
  };

  const updateOverlay = (id: string, updates: Partial<OverlayItem>) => {
    setOverlays((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };

  const removeOverlay = (id: string) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
    setDeleteZoneActive(false);
    // Haptic feedback simple
    if (navigator.vibrate) navigator.vibrate(50);
  };

  // --- GENERACIÓN DE IMAGEN FINAL ---
  const generateFinalImage = async () => {
    if (!imageData || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    return new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        canvas.width = 1080;
        canvas.height = 1920;

        // Filtros y Fondo
        const filterStyle = FILTERS.find((f) => f.id === activeFilter)?.style || "none";
        ctx.filter = filterStyle;

        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = canvas.width / 2 - (img.width / 2) * scale;
        const y = canvas.height / 2 - (img.height / 2) * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        ctx.filter = "none";

        // Elementos
        overlays.forEach((item) => {
          if (!item.content.trim()) return;
          ctx.save();
          ctx.translate(item.x * canvas.width, item.y * canvas.height);
          ctx.rotate((item.rotation * Math.PI) / 180);
          ctx.scale(item.scale, item.scale);

          ctx.font = `bold 50px ${item.fontFamily}`;
          ctx.fillStyle = item.color;
          ctx.textAlign = item.align;
          ctx.textBaseline = "middle";

          // Sombra suave para legibilidad
          ctx.shadowColor = "rgba(0,0,0,0.3)";
          ctx.shadowBlur = 10;
          ctx.shadowOffsetY = 2;

          // Manejo de saltos de línea básico
          const lines = item.content.split("\n");
          const lineHeight = 60;
          lines.forEach((line, i) => {
            const offset = (i - (lines.length - 1) / 2) * lineHeight;
            ctx.fillText(line, 0, offset);
          });

          ctx.restore();
        });

        canvas.toBlob((blob) => (blob ? resolve(blob) : reject()), "image/jpeg", 0.95);
      };
      img.src = imageData;
    });
  };

  const handlePublish = async () => {
    setIsUploading(true);
    try {
      const blob = await generateFinalImage();
      if (!blob) throw new Error("Error generando imagen");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const fileName = `${tenantId}/${Date.now()}.jpg`;
      const { error: uploadErr } = await supabase.storage.from("story-images").upload(fileName, blob);
      if (uploadErr) throw uploadErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from("story-images").getPublicUrl(fileName);

      await supabase.from("salon_stories").insert({
        tenant_id: tenantId,
        image_url: publicUrl,
        caption,
        created_by: user.id,
        story_type: "work",
      });

      toast.success("¡Historia publicada!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Error al publicar");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <style>{FONT_STYLES}</style>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black text-white flex flex-col font-sans select-none overflow-hidden"
      >
        <canvas ref={canvasRef} className="hidden" />

        {/* --- HEADER --- */}
        <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center p-4 pt- safe-area-top bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <button
            onClick={onClose}
            className="pointer-events-auto p-2 bg-black/20 backdrop-blur-md rounded-full active:scale-95 transition-transform"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {step === "edit" && (
            <button
              onClick={() => setStep("publish")}
              className="pointer-events-auto px-5 py-2 bg-white text-black rounded-full font-bold text-sm shadow-lg active:scale-95 transition-transform flex items-center gap-1"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 relative bg-neutral-900 flex items-center justify-center overflow-hidden">
          {/* STEP 1: CAPTURE */}
          {step === "capture" && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-col gap-8 items-center"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Crear Historia</h2>
                <p className="text-white/50">Captura el momento</p>
              </div>

              <div className="flex gap-6">
                <label className="flex flex-col items-center gap-3 group cursor-pointer">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <span className="font-medium text-sm">Cámara</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>

                <label className="flex flex-col items-center gap-3 group cursor-pointer">
                  <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md shadow-lg group-active:scale-95 transition-transform">
                    <ImageIcon className="w-8 h-8 text-white" />
                  </div>
                  <span className="font-medium text-sm">Galería</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </motion.div>
          )}

          {/* STEP 2: EDITOR */}
          {step === "edit" && imageData && (
            <div
              ref={containerRef}
              className="relative w-full h-full max-w-lg aspect-[9/16] bg-black shadow-2xl overflow-hidden cursor-text"
              onClick={handleCanvasClick}
            >
              <img
                src={imageData}
                className="w-full h-full object-cover pointer-events-none"
                style={{ filter: FILTERS.find((f) => f.id === activeFilter)?.style }}
                alt="Story"
              />

              {/* OVERLAYS */}
              {overlays.map((item) => (
                <DraggableOverlay
                  key={item.id}
                  item={item}
                  containerRef={containerRef}
                  onUpdate={updateOverlay}
                  onDelete={() => removeOverlay(item.id)}
                  onDragStart={() => {
                    setIsDragging(true);
                    setDeleteZoneActive(true);
                  }}
                  onDragEnd={() => {
                    setIsDragging(false);
                    setDeleteZoneActive(false);
                  }}
                  isActive={item.isEditing}
                />
              ))}

              {/* TRASH ZONE */}
              <AnimatePresence>
                {deleteZoneActive && (
                  <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="absolute bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none"
                  >
                    <div className="ios-blur px-6 py-3 rounded-full border border-white/10 flex items-center gap-2 text-red-500">
                      <Trash2 className="w-6 h-6" />
                      <span className="text-xs font-bold uppercase tracking-widest">Eliminar</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* STEP 3: PUBLISH */}
          {step === "publish" && (
            <div className="w-full max-w-md px-6 animate-in slide-in-from-right fade-in duration-300">
              <h3 className="text-xl font-bold mb-6">Detalles</h3>
              <div className="ios-blur rounded-2xl p-4 mb-6 border border-white/10">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Escribe un pie de foto..."
                  className="w-full bg-transparent outline-none text-white text-lg placeholder:text-white/30 resize-none font-medium"
                  rows={4}
                />
              </div>

              <button
                onClick={handlePublish}
                disabled={isUploading}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all disabled:opacity-50"
              >
                {isUploading ? <Sparkles className="animate-spin" /> : <Send />}
                Compartir Historia
              </button>
            </div>
          )}
        </div>

        {/* --- LEFT TASKBAR (Modern & Minimalist) --- */}
        {step === "edit" && !isDragging && overlays.every((o) => !o.isEditing) && (
          <motion.div
            initial={{ x: -50 }}
            animate={{ x: 0 }}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-40"
          >
            {/* Filter Toggle */}
            <div className="relative group">
              <button className="w-12 h-12 rounded-full ios-blur border border-white/10 flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform">
                <Palette className="w-6 h-6" />
              </button>
              {/* Popover Filters */}
              <div className="absolute left-14 top-0 bg-black/80 backdrop-blur-xl rounded-2xl p-2 flex gap-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all origin-left scale-90 group-hover:scale-100 w-[200px] overflow-x-auto scrollbar-hide">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={cn(
                      "w-10 h-10 rounded-full border-2 flex-shrink-0 bg-gray-500",
                      activeFilter === f.id ? "border-white" : "border-transparent",
                    )}
                    style={{ filter: f.style, backgroundImage: `url(${imageData})`, backgroundSize: "cover" }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCanvasClick(e as any);
              }}
              className="w-12 h-12 rounded-full ios-blur border border-white/10 flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
            >
              <Type className="w-6 h-6" />
            </button>
          </motion.div>
        )}

        {/* --- TEXT EDITOR TOOLBAR (When Typing) --- */}
        <AnimatePresence>
          {overlays.some((o) => o.isEditing) && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="absolute bottom-0 left-0 right-0 ios-blur border-t border-white/10 p-4 z-50 flex flex-col gap-4 pb-safe"
            >
              {/* Fonts */}
              <div className="flex gap-4 overflow-x-auto scrollbar-hide justify-center">
                {FONTS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setCurrentFont(f.id);
                      updateOverlay(overlays.find((o) => o.isEditing)!.id, { fontFamily: f.family });
                    }}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap",
                      (overlays.find((o) => o.isEditing)?.fontFamily || currentFont) === f.family
                        ? "bg-white text-black border-white"
                        : "border-white/20 text-white",
                    )}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center px-4">
                {/* Alignment */}
                <div className="flex gap-2 bg-black/20 rounded-lg p-1">
                  {[
                    { i: <AlignLeft className="w-4 h-4" />, v: "left" },
                    { i: <AlignCenter className="w-4 h-4" />, v: "center" },
                    { i: <AlignRight className="w-4 h-4" />, v: "right" },
                  ].map((btn) => (
                    <button
                      key={btn.v}
                      onClick={() => {
                        setCurrentAlign(btn.v as any);
                        updateOverlay(overlays.find((o) => o.isEditing)!.id, { align: btn.v as any });
                      }}
                      className={cn(
                        "p-2 rounded-md transition-colors",
                        (overlays.find((o) => o.isEditing)?.align || currentAlign) === btn.v
                          ? "bg-white/20"
                          : "hover:bg-white/10",
                      )}
                    >
                      {btn.i}
                    </button>
                  ))}
                </div>

                {/* Colors */}
                <div className="flex gap-3 overflow-x-auto scrollbar-hide max-w-[200px]">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCurrentColor(c);
                        updateOverlay(overlays.find((o) => o.isEditing)!.id, { color: c });
                      }}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 flex-shrink-0 transition-transform",
                        (overlays.find((o) => o.isEditing)?.color || currentColor) === c
                          ? "border-white scale-110"
                          : "border-transparent",
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <button
                  onClick={() => updateOverlay(overlays.find((o) => o.isEditing)!.id, { isEditing: false })}
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

// --- SUB-COMPONENTE: ELEMENTO ARRASTRABLE INTELIGENTE ---
function DraggableOverlay({
  item,
  containerRef,
  onUpdate,
  onDelete,
  onDragStart,
  onDragEnd,
  isActive,
}: {
  item: OverlayItem;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<OverlayItem>) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isActive?: boolean;
}) {
  const controls = useAnimation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (isActive && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
      textareaRef.current.focus();
    }
  }, [item.content, isActive]);

  // Gestos manuales para rotación/escala en móvil (simulado)
  // Nota: Framer Motion 'drag' maneja el movimiento.
  // Para rotación a dos dedos en web se requiere librerías pesadas como react-use-gesture.
  // Aquí usamos una implementación simple: Click para editar, Drag para mover.

  return (
    <motion.div
      drag={!isActive}
      dragMomentum={false} // Evita el "snap back" elástico extraño
      dragElastic={0} // Movimiento 1:1 estricto
      dragConstraints={containerRef}
      whileDrag={{ scale: 1.1, cursor: "grabbing" }}
      onDragStart={onDragStart}
      onDragEnd={(_, info) => {
        onDragEnd();
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();

          // Detección de Papelera (Bottom 15% of screen)
          const dropY = info.point.y;
          const trashThreshold = rect.bottom - rect.height * 0.15;

          if (dropY > trashThreshold) {
            onDelete();
            return;
          }

          // Guardar posición normalizada
          const x = (info.point.x - rect.left) / rect.width;
          const y = (info.point.y - rect.top) / rect.height;
          onUpdate(item.id, { x, y });
        }
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: isActive ? 1 : item.scale, opacity: 1, rotate: item.rotation }}
      style={{
        position: "absolute",
        left: `${item.x * 100}%`,
        top: `${item.y * 100}%`,
        x: "-50%",
        y: "-50%", // Centrado perfecto en el punto de anclaje
        touchAction: "none",
        zIndex: isActive ? 50 : 10,
      }}
      className="absolute flex items-center justify-center group"
    >
      {isActive ? (
        <div className="min-w-[100px] max-w-[300px] relative">
          <textarea
            ref={textareaRef}
            value={item.content}
            onChange={(e) => onUpdate(item.id, { content: e.target.value })}
            className="w-full bg-transparent outline-none resize-none overflow-hidden text-center leading-tight placeholder:text-white/50"
            placeholder="Escribe..."
            style={{
              fontFamily: item.fontFamily,
              color: item.color,
              fontSize: "40px",
              textAlign: item.align,
            }}
          />
          {/* Ring sutil para indicar foco */}
          <div className="absolute -inset-4 border-2 border-white/30 rounded-xl pointer-events-none" />
        </div>
      ) : (
        <div onClick={() => onUpdate(item.id, { isEditing: true })} className="relative px-2 py-1">
          <span
            className="whitespace-pre-wrap leading-tight drop-shadow-xl"
            style={{
              fontFamily: item.fontFamily,
              color: item.color,
              fontSize: "40px",
              textAlign: item.align,
              display: "block",
            }}
          >
            {item.content || "Toca para escribir"}
          </span>
        </div>
      )}
    </motion.div>
  );
}
