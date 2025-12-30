import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Camera,
  Image as ImageIcon,
  Type,
  Sparkles,
  Download,
  Undo2,
  Trash2,
  Smile,
  Sun,
  ChevronRight,
  Send,
  Move,
  Maximize,
  RotateCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/contexts/NavigationContext";

// --- CONFIGURACIÓN Y DATOS ---

// Inyección de fuentes para asegurar variedad moderna
const FONT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@700&family=Lato:wght@400;900&family=Merriweather:ital,wght@1,700&family=Montserrat:wght@800&display=swap');
`;

const FILTERS = [
  { id: "none", name: "Normal", style: "" },
  { id: "vivid", name: "Vívido", style: "contrast(1.15) saturate(1.3)" },
  { id: "soft", name: "Suave", style: "brightness(1.1) contrast(0.9) saturate(0.9)" },
  { id: "vintage", name: "Vintage", style: "sepia(0.4) contrast(1.1) brightness(0.9) saturate(0.8)" },
  { id: "bnw", name: "B&N", style: "grayscale(1) contrast(1.1)" },
  { id: "warm", name: "Cálido", style: "sepia(0.15) contrast(1.05) hue-rotate(-5deg)" },
  { id: "cool", name: "Frío", style: "hue-rotate(10deg) contrast(1.1) saturate(0.9)" },
  { id: "dramatic", name: "Drama", style: "contrast(1.3) brightness(0.9) saturate(1.1)" },
  { id: "cinema", name: "Cine", style: "contrast(1.1) sepia(0.2) saturate(1.1) brightness(1.1)" },
];

const FONTS = [
  { id: "modern", name: "Impacto", family: "'Montserrat', sans-serif", class: "font-black tracking-tight" },
  { id: "hand", name: "Firma", family: "'Caveat', cursive", class: "font-bold" },
  { id: "serif", name: "Elegante", family: "'Merriweather', serif", class: "italic font-bold" },
  { id: "poster", name: "Póster", family: "'Bebas Neue', sans-serif", class: "tracking-wide" },
  { id: "clean", name: "Limpio", family: "'Lato', sans-serif", class: "font-bold" },
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

const STICKERS = ["🔥", "✨", "❤️", "💯", "🎉", "💇‍♀️", "💈", "✂️", "📍", "🏷️", "👑", "💅", "👀", "💬"];

// --- TIPOS ---

interface OverlayItem {
  id: string;
  type: "text" | "sticker";
  content: string;
  fontFamily?: string;
  color?: string;
  x: number; // Porcentaje 0-1
  y: number; // Porcentaje 0-1
  scale: number;
  rotation: number;
}

interface StoryCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess: () => void;
}

export function StoryCreator({ isOpen, onClose, tenantId, onSuccess }: StoryCreatorProps) {
  // Estados Principales
  const [step, setStep] = useState<"capture" | "edit" | "publish">("capture");
  const [imageData, setImageData] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Herramientas de Edición
  const [activeTool, setActiveTool] = useState<"none" | "filters" | "text" | "stickers">("none");
  const [activeFilter, setActiveFilter] = useState("none");
  const [textInput, setTextInput] = useState("");
  const [activeColor, setActiveColor] = useState("#FFFFFF");
  const [activeFont, setActiveFont] = useState(FONTS[0].id);

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
      setActiveFilter("none");
    }
  }, [isOpen]);

  // --- MANEJADORES ---

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

  // Añadir Texto
  const handleAddText = () => {
    if (!textInput.trim()) return;
    const fontConfig = FONTS.find((f) => f.id === activeFont);

    const newOverlay: OverlayItem = {
      id: Date.now().toString(),
      type: "text",
      content: textInput,
      fontFamily: fontConfig?.family,
      color: activeColor,
      x: 0.5,
      y: 0.5, // Centro
      scale: 1,
      rotation: 0,
    };

    setOverlays([...overlays, newOverlay]);
    setTextInput("");
    setActiveTool("none");
  };

  // Añadir Sticker
  const handleAddSticker = (emoji: string) => {
    const newOverlay: OverlayItem = {
      id: Date.now().toString(),
      type: "sticker",
      content: emoji,
      x: 0.5,
      y: 0.5,
      scale: 1.5,
      rotation: 0,
    };
    setOverlays([...overlays, newOverlay]);
    setActiveTool("none");
  };

  // Actualizar Overlay (Mover, Rotar, Escalar)
  const updateOverlay = (id: string, updates: Partial<OverlayItem>) => {
    setOverlays((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  // Borrar Overlay
  const deleteOverlay = (id: string) => {
    setOverlays((prev) => prev.filter((item) => item.id !== id));
    setSelectedId(null);
  };

  // Generar Imagen Final
  const generateFinalImage = async () => {
    if (!imageData || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    return new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Alta resolución (1080x1920 para Stories)
        canvas.width = 1080;
        canvas.height = 1920;

        // 1. Dibujar Fondo con Filtro
        const filterStyle = FILTERS.find((f) => f.id === activeFilter)?.style || "none";
        ctx.filter = filterStyle;

        // "Object-fit: cover" manual
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = canvas.width / 2 - (img.width / 2) * scale;
        const y = canvas.height / 2 - (img.height / 2) * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        ctx.filter = "none"; // Reset filtro para textos

        // 2. Dibujar Overlays
        overlays.forEach((item) => {
          ctx.save();
          // Convertir posición relativa (0-1) a píxeles
          ctx.translate(item.x * canvas.width, item.y * canvas.height);
          ctx.rotate((item.rotation * Math.PI) / 180);
          ctx.scale(item.scale, item.scale);

          if (item.type === "text") {
            ctx.font = `bold 50px ${item.fontFamily || "sans-serif"}`;
            ctx.fillStyle = item.color || "#FFF";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 10;
            ctx.fillText(item.content, 0, 0);
          } else {
            ctx.font = "80px serif"; // Emoji size base
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(item.content, 0, 0);
          }
          ctx.restore();
        });

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject("Error creando blob");
          },
          "image/jpeg",
          0.95,
        );
      };
      img.src = imageData;
    });
  };

  const handlePublish = async () => {
    setIsUploading(true);
    try {
      const blob = await generateFinalImage();
      if (!blob) throw new Error("No se pudo generar la imagen");

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
        story_type: "work", // Default
      });

      toast.success("¡Historia publicada!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
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
        className="fixed inset-0 z-[60] bg-black text-white flex flex-col font-sans"
      >
        <canvas ref={canvasRef} className="hidden" />

        {/* --- CABECERA --- */}
        <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-50">
          <button onClick={onClose} className="p-2 bg-white/10 backdrop-blur rounded-full">
            <X className="w-6 h-6" />
          </button>

          {step === "edit" && activeTool === "none" && (
            <button
              onClick={() => setStep("publish")}
              className="px-5 py-2 bg-white text-black rounded-full font-bold flex items-center gap-2 text-sm"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* --- CONTENIDO PRINCIPAL --- */}
        <div className="flex-1 relative flex items-center justify-center bg-zinc-900 overflow-hidden">
          {/* PASO 1: CAPTURA */}
          {step === "capture" && (
            <div className="flex flex-col gap-8 items-center text-center p-6">
              <div className="w-20 h-20 bg-gradient-to-tr from-pink-500 to-violet-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Crear Historia</h2>
                <p className="text-white/60 text-sm">Comparte tu trabajo con el mundo</p>
              </div>
              <div className="flex gap-4 w-full max-w-sm">
                <label className="flex-1 cursor-pointer group">
                  <div className="flex flex-col items-center gap-3 p-6 bg-white/5 border border-white/10 rounded-2xl group-hover:bg-white/10 transition-all">
                    <Camera className="w-8 h-8 text-pink-400" />
                    <span className="font-medium">Cámara</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <label className="flex-1 cursor-pointer group">
                  <div className="flex flex-col items-center gap-3 p-6 bg-white/5 border border-white/10 rounded-2xl group-hover:bg-white/10 transition-all">
                    <ImageIcon className="w-8 h-8 text-blue-400" />
                    <span className="font-medium">Galería</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* PASO 2: EDITOR */}
          {step === "edit" && imageData && (
            <div
              ref={containerRef}
              className="relative w-full h-full max-w-lg aspect-[9/16] bg-black shadow-2xl overflow-hidden"
              onClick={() => setSelectedId(null)}
            >
              {/* Imagen Base con Filtro */}
              <img
                src={imageData}
                alt="Base"
                className="w-full h-full object-cover pointer-events-none select-none transition-all duration-300"
                style={{ filter: FILTERS.find((f) => f.id === activeFilter)?.style }}
              />

              {/* Capa de Elementos Arrastrables */}
              {overlays.map((item) => {
                const isSelected = selectedId === item.id;
                return (
                  <motion.div
                    key={item.id}
                    drag
                    dragMomentum={false} // IMPORTANTE: Evita que "salga volando"
                    dragConstraints={containerRef} // IMPORTANTE: Mantiene dentro del contenedor
                    onDragStart={() => setSelectedId(item.id)}
                    onDragEnd={(_, info) => {
                      // Solo actualizamos la posición lógica al soltar
                      if (containerRef.current) {
                        const rect = containerRef.current.getBoundingClientRect();
                        // Calcular porcentaje relativo al contenedor
                        const x = (info.point.x - rect.left) / rect.width;
                        const y = (info.point.y - rect.top) / rect.height;
                        updateOverlay(item.id, { x, y });
                      }
                    }}
                    // Posición inicial usando CSS absoluto (motion lo maneja después con transforms)
                    style={{
                      position: "absolute",
                      left: `${item.x * 100}%`,
                      top: `${item.y * 100}%`,
                      touchAction: "none",
                    }}
                    className="absolute cursor-move z-20"
                  >
                    <div
                      className={cn(
                        "relative -translate-x-1/2 -translate-y-1/2 p-2 border-2 transition-all",
                        isSelected ? "border-white bg-black/20 rounded-lg" : "border-transparent",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(item.id);
                      }}
                    >
                      {/* Contenido */}
                      <div
                        style={{
                          transform: `scale(${item.scale}) rotate(${item.rotation}deg)`,
                          fontFamily: item.fontFamily,
                          color: item.color,
                        }}
                        className="whitespace-nowrap drop-shadow-lg"
                      >
                        {item.type === "text" ? (
                          <span className="text-3xl font-bold">{item.content}</span>
                        ) : (
                          <span className="text-6xl">{item.content}</span>
                        )}
                      </div>

                      {/* Controles del Elemento (Solo si seleccionado) */}
                      {isSelected && (
                        <>
                          <button
                            className="absolute -top-3 -right-3 bg-red-500 rounded-full p-1.5 shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteOverlay(item.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-white" />
                          </button>

                          {/* Controles Rápidos de Tamaño/Rotación */}
                          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 backdrop-blur rounded-full p-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOverlay(item.id, { scale: Math.max(0.5, item.scale - 0.1) });
                              }}
                              className="p-1 hover:bg-white/20 rounded-full"
                            >
                              <span className="text-xs font-bold">-</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOverlay(item.id, { rotation: item.rotation + 45 });
                              }}
                              className="p-1 hover:bg-white/20 rounded-full"
                            >
                              <RotateCw className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOverlay(item.id, { scale: Math.min(3, item.scale + 0.1) });
                              }}
                              className="p-1 hover:bg-white/20 rounded-full"
                            >
                              <Maximize className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* PASO 3: PUBLICAR */}
          {step === "publish" && (
            <div className="w-full max-w-md px-6 animate-in fade-in slide-in-from-bottom-10">
              <h3 className="text-xl font-bold mb-4">Detalles finales</h3>
              <div className="bg-zinc-800 rounded-2xl p-4 mb-6">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Escribe un pie de foto..."
                  className="w-full bg-transparent outline-none text-white resize-none text-lg placeholder:text-zinc-500"
                  rows={4}
                />
              </div>
              <button
                onClick={handlePublish}
                disabled={isUploading}
                className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {isUploading ? <Sparkles className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Publicar Historia
              </button>
              <button onClick={() => setStep("edit")} className="w-full py-4 text-zinc-400 font-medium mt-2">
                Volver a editar
              </button>
            </div>
          )}
        </div>

        {/* --- BARRA LATERAL FLOTANTE (MODERNA) --- */}
        {step === "edit" && activeTool === "none" && (
          <div className="absolute top-20 right-4 flex flex-col gap-4 z-40">
            <button
              onClick={() => setActiveTool("text")}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-lg"
            >
              <Type className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTool("stickers")}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-lg"
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTool("filters")}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-lg"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* --- PANELES DE HERRAMIENTAS (SLIDE UP) --- */}
        <AnimatePresence>
          {activeTool !== "none" && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="absolute bottom-0 left-0 right-0 bg-zinc-900 border-t border-white/10 p-6 rounded-t-3xl z-50 pb-safe"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg capitalize">
                  {activeTool === "text" ? "Añadir Texto" : activeTool === "filters" ? "Filtros" : "Stickers"}
                </h3>
                <button onClick={() => setActiveTool("none")}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* FILTROS */}
              {activeTool === "filters" && (
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setActiveFilter(f.id)}
                      className="flex flex-col gap-2 items-center"
                    >
                      <div
                        className={cn(
                          "w-16 h-20 rounded-lg overflow-hidden border-2",
                          activeFilter === f.id ? "border-pink-500" : "border-transparent",
                        )}
                      >
                        <img
                          src={imageData!}
                          className="w-full h-full object-cover"
                          style={{ filter: f.style }}
                          alt={f.name}
                        />
                      </div>
                      <span className="text-xs text-zinc-400">{f.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* TEXTO */}
              {activeTool === "text" && (
                <div className="space-y-4">
                  <input
                    autoFocus
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Escribe algo..."
                    className="w-full bg-zinc-800 p-3 rounded-xl outline-none text-white border border-zinc-700 focus:border-white transition-colors"
                  />
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {FONTS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setActiveFont(f.id)}
                        className={cn(
                          "px-4 py-2 rounded-lg border text-sm whitespace-nowrap",
                          activeFont === f.id ? "bg-white text-black border-white" : "border-zinc-700 text-zinc-400",
                        )}
                        style={{ fontFamily: f.family }}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setActiveColor(c)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 shrink-0",
                          activeColor === c ? "border-white scale-110" : "border-transparent",
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button onClick={handleAddText} className="w-full py-3 bg-white text-black rounded-xl font-bold">
                    Añadir Texto
                  </button>
                </div>
              )}

              {/* STICKERS */}
              {activeTool === "stickers" && (
                <div className="grid grid-cols-5 gap-4 max-h-48 overflow-y-auto">
                  {STICKERS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleAddSticker(s)}
                      className="text-4xl hover:scale-110 transition-transform p-2"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
