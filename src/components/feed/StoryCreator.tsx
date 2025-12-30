import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useAnimation, PanInfo } from "motion/react";
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
  Maximize2,
  RotateCw,
  Move,
  Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/contexts/NavigationContext";

// --- CONFIGURACIÓN ESTÉTICA ---
const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@700&family=Inter:wght@400;800&family=Merriweather:ital,wght@1,700&family=Playfair+Display:ital,wght@1,600&display=swap";

const FONTS = [
  { id: "modern", name: "Moderno", family: "'Inter', sans-serif", style: "font-extrabold tracking-tighter uppercase" },
  { id: "hand", name: "Manuscrito", family: "'Caveat', cursive", style: "font-bold tracking-wide" },
  { id: "serif", name: "Editorial", family: "'Playfair Display', serif", style: "italic font-semibold" },
  { id: "poster", name: "Impacto", family: "'Bebas Neue', sans-serif", style: "tracking-widest" },
  { id: "classic", name: "Clásico", family: "'Merriweather', serif", style: "font-bold" },
];

const FILTERS = [
  { id: "none", name: "Normal", css: "none" },
  { id: "vivid", name: "Vivid", css: "contrast(1.15) saturate(1.3)" },
  { id: "noir", name: "Noir", css: "grayscale(1) contrast(1.2) brightness(0.9)" },
  { id: "warm", name: "Golden", css: "sepia(0.2) contrast(1.05) saturate(1.1)" },
  { id: "cool", name: "Ocean", css: "hue-rotate(10deg) contrast(1.1) saturate(0.9)" },
  { id: "dramatic", name: "Drama", css: "contrast(1.4) brightness(0.9) saturate(0.8)" },
  { id: "vintage", name: "1980", css: "sepia(0.4) contrast(1.1) brightness(0.9) saturate(0.8)" },
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
const STICKERS = ["🔥", "✨", "❤️", "💯", "🎉", "💇‍♀️", "💈", "✂️", "📍", "👑", "💅", "👀", "💬", "⚡️", "🌴"];

// --- TIPOS ---
interface OverlayItem {
  id: string;
  type: "text" | "sticker";
  content: string;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  align: "left" | "center" | "right";
  x: number; // Porcentaje 0-1
  y: number; // Porcentaje 0-1
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

// --- UTILS ---
const triggerHaptic = (style: "light" | "medium" | "heavy" = "medium") => {
  if (navigator.vibrate) navigator.vibrate(style === "heavy" ? 50 : style === "medium" ? 20 : 10);
};

// --- COMPONENTE PRINCIPAL ---
export function StoryCreator({ isOpen, onClose, tenantId, onSuccess }: StoryCreatorProps) {
  // ESTADOS PRINCIPALES
  const [step, setStep] = useState<"capture" | "edit" | "publish">("capture");
  const [imageData, setImageData] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // ESTADOS DEL EDITOR
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("none");
  const [isDragging, setIsDragging] = useState(false);
  const [deleteZoneActive, setDeleteZoneActive] = useState(false);
  const [showTools, setShowTools] = useState<"none" | "filters" | "stickers">("none");

  // PREFERENCIAS DE TEXTO (Memoria)
  const [lastFont, setLastFont] = useState(FONTS[0].id);
  const [lastColor, setLastColor] = useState(COLORS[0]);
  const [lastAlign, setLastAlign] = useState<"left" | "center" | "right">("center");

  // REFS
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { setNavigationHidden } = useNavigation();

  useEffect(() => {
    setNavigationHidden(isOpen);
    if (!isOpen) {
      // Reset total al cerrar
      setStep("capture");
      setImageData(null);
      setOverlays([]);
      setCaption("");
      setActiveFilter("none");
      setSelectedId(null);
    }
  }, [isOpen]);

  // --- LOGICA DE ARCHIVOS ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error("Imagen demasiado grande (Máx 15MB)");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageData(ev.target?.result as string);
        setStep("edit");
      };
      reader.readAsDataURL(file);
    }
  };

  // --- LOGICA DE EDICIÓN ---

  // Click en lienzo vacío -> Crear Texto
  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest(".overlay-item")) return;
    if (selectedId) {
      setSelectedId(null); // Deseleccionar
      setShowTools("none");
      return;
    }

    // Crear nuevo texto
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

    // Posición relativa 0-1
    const x = Math.max(0.1, Math.min(0.9, (clientX - rect.left) / rect.width));
    const y = Math.max(0.1, Math.min(0.9, (clientY - rect.top) / rect.height));

    const newText: OverlayItem = {
      id: Date.now().toString(),
      type: "text",
      content: "",
      fontFamily: FONTS.find((f) => f.id === lastFont)?.family || FONTS[0].family,
      color: lastColor,
      align: lastAlign,
      x,
      y,
      scale: 1,
      rotation: 0,
      isEditing: true, // Nace editando
    };

    setOverlays([...overlays, newText]);
    setSelectedId(newText.id);
  };

  const addSticker = (emoji: string) => {
    const newSticker: OverlayItem = {
      id: Date.now().toString(),
      type: "sticker",
      content: emoji,
      fontFamily: "Arial",
      color: "#000",
      align: "center",
      x: 0.5,
      y: 0.5,
      scale: 1.5,
      rotation: 0,
      isEditing: false,
    };
    setOverlays([...overlays, newSticker]);
    setSelectedId(newSticker.id);
    setShowTools("none");
    triggerHaptic();
  };

  const updateOverlay = (id: string, updates: Partial<OverlayItem>) => {
    setOverlays((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };

  const removeOverlay = (id: string) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
    setSelectedId(null);
    setDeleteZoneActive(false);
    triggerHaptic("heavy");
  };

  // --- EXPORTACIÓN ---
  const generateFinalImage = async () => {
    if (!imageData || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    return new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Renderizado HD (Story Ratio)
        canvas.width = 1080;
        canvas.height = 1920;

        // 1. Filtros y Fondo
        const activeFilterObj = FILTERS.find((f) => f.id === activeFilter);
        ctx.filter = activeFilterObj?.css || "none";

        // "Object-cover" manual
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = canvas.width / 2 - (img.width / 2) * scale;
        const y = canvas.height / 2 - (img.height / 2) * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        ctx.filter = "none"; // Limpiar filtros para overlays

        // 2. Overlays
        overlays.forEach((item) => {
          if (!item.content.trim()) return;
          ctx.save();

          // Transformaciones
          ctx.translate(item.x * canvas.width, item.y * canvas.height);
          ctx.rotate((item.rotation * Math.PI) / 180);
          ctx.scale(item.scale, item.scale);

          if (item.type === "text") {
            ctx.font = `bold 50px ${item.fontFamily}`;
            ctx.fillStyle = item.color;
            ctx.textAlign = item.align;
            ctx.textBaseline = "middle";
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 10;

            // Render multi-linea
            const lines = item.content.split("\n");
            const lineHeight = 60;
            lines.forEach((line, i) => {
              const offset = (i - (lines.length - 1) / 2) * lineHeight;
              ctx.fillText(line, 0, offset);
            });
          } else {
            ctx.font = "80px serif"; // Emoji
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(item.content, 0, 0);
          }
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
      if (!blob) throw new Error("Error al generar imagen");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

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

      toast.success("¡Historia publicada!", {
        description: "Ya está visible para tus clientes",
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Error al publicar la historia");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* CSS Inyectado para fuentes y estilos premium */}
      <style>{GOOGLE_FONTS_URL}</style>
      <style>{`
        .glass-panel {
          background: rgba(20, 20, 20, 0.6);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        .text-shadow { text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
      `}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black text-white flex flex-col font-sans select-none overflow-hidden touch-none"
      >
        <canvas ref={canvasRef} className="hidden" />

        {/* --- TOP BAR (Minimalista) --- */}
        <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-4 pt- safe-area-top pointer-events-none">
          <button
            onClick={onClose}
            className="pointer-events-auto p-2.5 glass-panel rounded-full active:scale-95 transition-transform"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {step === "edit" && !isDragging && (
            <button
              onClick={() => setStep("publish")}
              className="pointer-events-auto px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 transition-transform flex items-center gap-1.5"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* --- MAIN STAGE --- */}
        <div className="flex-1 relative flex items-center justify-center bg-zinc-950 overflow-hidden">
          {/* 1. CAPTURE MODE */}
          {step === "capture" && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-col gap-10 items-center p-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">
                  Crear Historia
                </h2>
                <p className="text-white/40 font-medium">Comparte tu arte con el mundo</p>
              </div>

              <div className="flex gap-6 w-full max-w-sm justify-center">
                <label className="flex flex-col items-center gap-4 group cursor-pointer active:scale-95 transition-transform">
                  <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-rose-500/20 ring-4 ring-black">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <span className="font-semibold tracking-wide text-sm text-white/90">Cámara</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>

                <label className="flex flex-col items-center gap-4 group cursor-pointer active:scale-95 transition-transform">
                  <div className="w-24 h-24 rounded-[2rem] glass-panel flex items-center justify-center shadow-2xl ring-4 ring-black">
                    <ImageIcon className="w-10 h-10 text-white" />
                  </div>
                  <span className="font-semibold tracking-wide text-sm text-white/90">Galería</span>
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

          {/* 2. EDIT MODE */}
          {step === "edit" && imageData && (
            <div
              ref={containerRef}
              className="relative w-full h-full max-w-[500px] aspect-[9/16] bg-black shadow-2xl overflow-hidden cursor-text"
              onClick={handleCanvasClick}
            >
              {/* Imagen Base */}
              <img
                src={imageData}
                className="w-full h-full object-cover pointer-events-none transition-all duration-500 ease-out"
                style={{ filter: FILTERS.find((f) => f.id === activeFilter)?.css }}
                alt="Story Base"
              />

              {/* OVERLAYS */}
              {overlays.map((item) => (
                <DraggableItem
                  key={item.id}
                  item={item}
                  containerRef={containerRef}
                  isSelected={selectedId === item.id}
                  onSelect={() => {
                    setSelectedId(item.id);
                    setShowTools("none");
                  }}
                  onUpdate={(updates) => updateOverlay(item.id, updates)}
                  onDragStateChange={(dragging) => {
                    setIsDragging(dragging);
                    setDeleteZoneActive(dragging);
                    if (dragging) setSelectedId(item.id);
                  }}
                  onDelete={() => removeOverlay(item.id)}
                />
              ))}

              {/* TRASH ZONE (Magnetic) */}
              <AnimatePresence>
                {deleteZoneActive && (
                  <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="absolute bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-none"
                  >
                    <div className="glass-panel px-8 py-4 rounded-full flex items-center gap-3 text-red-500 shadow-xl border-red-500/20">
                      <Trash2 className="w-6 h-6 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-widest">Soltar para eliminar</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 3. PUBLISH MODE */}
          {step === "publish" && (
            <div className="w-full max-w-md px-8 animate-in slide-in-from-right fade-in duration-500">
              <h3 className="text-2xl font-bold mb-6">Últimos retoques</h3>
              <div className="glass-panel rounded-3xl p-1 mb-8">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Añade un comentario..."
                  className="w-full bg-transparent outline-none text-white text-lg placeholder:text-white/30 resize-none font-medium p-4 h-32"
                />
              </div>

              <button
                onClick={handlePublish}
                disabled={isUploading}
                className="w-full py-5 bg-white text-black rounded-3xl font-extrabold text-lg flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 transition-all disabled:opacity-50"
              >
                {isUploading ? <Sparkles className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                Compartir Historia
              </button>

              <button onClick={() => setStep("edit")} className="w-full py-4 text-white/50 font-medium text-sm mt-2">
                Volver a editar
              </button>
            </div>
          )}
        </div>

        {/* --- LEFT SIDEBAR (Floating Tools) --- */}
        {step === "edit" && !isDragging && !overlays.some((o) => o.isEditing) && (
          <motion.div
            initial={{ x: -100 }}
            animate={{ x: 0 }}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-40"
          >
            {/* Botón Texto */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCanvasClick(e as any);
              }}
              className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform hover:bg-white/10"
            >
              <Type className="w-6 h-6" />
            </button>

            {/* Botón Stickers */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTools("stickers");
                setSelectedId(null);
              }}
              className={cn(
                "w-12 h-12 rounded-full glass-panel flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform hover:bg-white/10",
                showTools === "stickers" && "bg-white text-black hover:bg-white",
              )}
            >
              <Sparkles className="w-6 h-6" />
            </button>

            {/* Botón Filtros */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTools("filters");
                setSelectedId(null);
              }}
              className={cn(
                "w-12 h-12 rounded-full glass-panel flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform hover:bg-white/10",
                showTools === "filters" && "bg-white text-black hover:bg-white",
              )}
            >
              <Palette className="w-6 h-6" />
            </button>
          </motion.div>
        )}

        {/* --- BOTTOM SHEETS (Tools) --- */}
        <AnimatePresence>
          {/* TEXT EDITOR PROPERTIES (Cuando un texto está seleccionado o editándose) */}
          {(overlays.some((o) => o.isEditing) ||
            (selectedId && overlays.find((o) => o.id === selectedId)?.type === "text")) && (
            <ToolPanel
              title="Editar Texto"
              onClose={() => {
                /* Auto-handled by blur */
              }}
            >
              <div className="flex flex-col gap-4">
                {/* Fuentes */}
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                  {FONTS.map((f) => {
                    const currentOverlay =
                      overlays.find((o) => o.id === selectedId) || overlays.find((o) => o.isEditing);
                    const isActive = currentOverlay?.fontFamily === f.family;
                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          setLastFont(f.id);
                          if (currentOverlay) updateOverlay(currentOverlay.id, { fontFamily: f.family });
                        }}
                        className={cn(
                          "px-4 py-2 rounded-full border text-sm whitespace-nowrap transition-all",
                          isActive ? "bg-white text-black border-white" : "border-white/20 text-white/70",
                        )}
                        style={{ fontFamily: f.family }}
                      >
                        {f.name}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  {/* Alineación */}
                  <div className="flex bg-white/10 rounded-lg p-1">
                    {[
                      { i: <AlignLeft size={18} />, v: "left" },
                      { i: <AlignCenter size={18} />, v: "center" },
                      { i: <AlignRight size={18} />, v: "right" },
                    ].map((btn) => (
                      <button
                        key={btn.v}
                        onClick={() => {
                          setLastAlign(btn.v as any);
                          const current =
                            overlays.find((o) => o.id === selectedId) || overlays.find((o) => o.isEditing);
                          if (current) updateOverlay(current.id, { align: btn.v as any });
                        }}
                        className={cn(
                          "p-2 rounded-md",
                          (overlays.find((o) => o.id === selectedId)?.align || lastAlign) === btn.v
                            ? "bg-white/20 text-white"
                            : "text-white/50",
                        )}
                      >
                        {btn.i}
                      </button>
                    ))}
                  </div>

                  {/* Colores */}
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide max-w-[200px] px-2">
                    {COLORS.map((c) => {
                      const current = overlays.find((o) => o.id === selectedId) || overlays.find((o) => o.isEditing);
                      const isActive = (current?.color || lastColor) === c;
                      return (
                        <button
                          key={c}
                          onClick={() => {
                            setLastColor(c);
                            if (current) updateOverlay(current.id, { color: c });
                          }}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 shrink-0 transition-transform",
                            isActive ? "border-white scale-110" : "border-transparent scale-90",
                          )}
                          style={{ backgroundColor: c }}
                        />
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setSelectedId(null)}
                    className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center active:scale-90"
                  >
                    <Check size={20} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </ToolPanel>
          )}

          {/* STICKERS PANEL */}
          {showTools === "stickers" && (
            <ToolPanel title="Stickers" onClose={() => setShowTools("none")}>
              <div className="grid grid-cols-5 gap-4">
                {STICKERS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => addSticker(s)}
                    className="text-4xl hover:scale-110 transition-transform active:scale-95 p-2"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </ToolPanel>
          )}

          {/* FILTERS PANEL */}
          {showTools === "filters" && (
            <ToolPanel title="Filtros" onClose={() => setShowTools("none")}>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className="flex flex-col gap-2 items-center group"
                  >
                    <div
                      className={cn(
                        "w-20 h-24 rounded-xl overflow-hidden border-2 transition-all",
                        activeFilter === f.id
                          ? "border-white scale-105"
                          : "border-transparent opacity-70 group-hover:opacity-100",
                      )}
                    >
                      <img
                        src={imageData!}
                        className="w-full h-full object-cover"
                        style={{ filter: f.css }}
                        alt={f.name}
                      />
                    </div>
                    <span className="text-xs font-medium tracking-wide text-white/80 uppercase">{f.name}</span>
                  </button>
                ))}
              </div>
            </ToolPanel>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

// --- SUB-COMPONENTES OPTIMIZADOS ---

// Panel Inferior Reutilizable
const ToolPanel = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <motion.div
    initial={{ y: "100%" }}
    animate={{ y: 0 }}
    exit={{ y: "100%" }}
    className="absolute bottom-0 left-0 right-0 glass-panel border-t border-white/10 p-6 rounded-t-[2rem] z-50 pb-safe"
  >
    <div className="flex justify-between items-center mb-6">
      <h3 className="font-bold text-lg">{title}</h3>
      <button onClick={onClose} className="bg-white/10 p-1 rounded-full">
        <X size={16} />
      </button>
    </div>
    {children}
  </motion.div>
);

// Elemento Draggable Inteligente
function DraggableItem({
  item,
  containerRef,
  isSelected,
  onSelect,
  onUpdate,
  onDragStateChange,
  onDelete,
}: {
  item: OverlayItem;
  containerRef: React.RefObject<HTMLDivElement>;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<OverlayItem>) => void;
  onDragStateChange: (isDragging: boolean) => void;
  onDelete: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize para Textarea
  useEffect(() => {
    if (item.isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
      textareaRef.current.focus();
    }
  }, [item.content, item.isEditing]);

  return (
    <motion.div
      drag={!item.isEditing}
      dragMomentum={false} // CRITICO: Evita saltos
      dragElastic={0} // CRITICO: Arrastre 1:1
      dragConstraints={containerRef}
      onDragStart={() => onDragStateChange(true)}
      onDragEnd={(_, info) => {
        onDragStateChange(false);
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          // Detectar Papelera (Bottom 15%)
          if (info.point.y > rect.bottom - rect.height * 0.15) {
            onDelete();
            return;
          }
          // Guardar nueva posición
          const x = (info.point.x - rect.left) / rect.width;
          const y = (info.point.y - rect.top) / rect.height;
          onUpdate({ x, y });
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{
        position: "absolute",
        left: `${item.x * 100}%`,
        top: `${item.y * 100}%`,
        x: "-50%",
        y: "-50%",
        rotate: item.rotation,
        scale: item.scale,
        zIndex: isSelected || item.isEditing ? 50 : 10,
        touchAction: "none",
      }}
      className="absolute group flex items-center justify-center"
    >
      <div
        className={cn(
          "relative transition-all duration-200",
          isSelected &&
            !item.isEditing &&
            "ring-2 ring-white ring-offset-2 ring-offset-black/50 rounded-lg p-2 bg-black/20",
        )}
      >
        {item.isEditing ? (
          <textarea
            ref={textareaRef}
            value={item.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            onBlur={() => onUpdate({ isEditing: false })}
            className="bg-transparent outline-none resize-none overflow-hidden leading-tight min-w-[50px]"
            placeholder="Escribe..."
            style={{
              fontFamily: item.fontFamily,
              color: item.color,
              fontSize: "40px",
              textAlign: item.align,
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}
          />
        ) : (
          <div
            onClick={() => {
              if (item.type === "text") onUpdate({ isEditing: true });
            }}
            className="whitespace-pre-wrap leading-tight select-none"
            style={{
              fontFamily: item.fontFamily,
              color: item.color,
              fontSize: item.type === "sticker" ? "80px" : "40px",
              textAlign: item.align,
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            {item.content || <span className="opacity-50">Escribe...</span>}
          </div>
        )}

        {/* CONTROLES DE TRANSFORMACIÓN (Solo cuando está seleccionado y NO editando) */}
        {isSelected && !item.isEditing && (
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-4 glass-panel rounded-full p-2 animate-in fade-in zoom-in duration-200">
            <button
              className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full active:bg-white text-white active:text-black transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({ rotation: item.rotation - 45 });
                triggerHaptic();
              }}
            >
              <RotateCw className="-scale-x-100 w-4 h-4" />
            </button>

            <button
              className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full active:bg-white text-white active:text-black transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({ scale: Math.max(0.5, item.scale - 0.2) });
                triggerHaptic();
              }}
            >
              <span className="text-xl leading-none mb-1">-</span>
            </button>

            <button
              className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full active:bg-white text-white active:text-black transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({ scale: Math.min(3, item.scale + 0.2) });
                triggerHaptic();
              }}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
