import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, AlignLeft, AlignCenter, AlignRight, Palette, Pipette } from "lucide-react";

export interface TextConfig {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: "none" | "solid" | "translucent";
  textAlign: "left" | "center" | "right";
  fontStyle: string;
}

interface TextEditorNewProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string, config: TextConfig) => void;
  initialText?: string;
  initialConfig?: Partial<TextConfig>;
}

// Instagram-inspired fonts
const FONTS = [
  { id: "classic", name: "Clásica", family: "'Inter', sans-serif", preview: "Aa", weight: "400" },
  { id: "modern", name: "Moderna", family: "'Bebas Neue', sans-serif", preview: "Aa", weight: "400" },
  { id: "strong", name: "Fuerte", family: "'Anton', sans-serif", preview: "Aa", weight: "400" },
  { id: "neon", name: "Neón", family: "'Righteous', cursive", preview: "Aa", weight: "400" },
  { id: "typewriter", name: "Máquina", family: "'Roboto Mono', monospace", preview: "Aa", weight: "500" },
  { id: "elegant", name: "Elegante", family: "'Playfair Display', serif", preview: "Aa", weight: "400" },
  { id: "comic", name: "Diversión", family: "'Fredoka', sans-serif", preview: "Aa", weight: "500" },
  { id: "handwritten", name: "Escrita", family: "'Caveat', cursive", preview: "Aa", weight: "600" },
  { id: "bold", name: "Bold", family: "'Inter', sans-serif", preview: "Aa", weight: "900" },
];

const COLORS = [
  "#FFFFFF", "#000000", "#FF3B5C", "#FF9500", "#FFCC00",
  "#34C759", "#5AC8FA", "#007AFF", "#AF52DE", "#FF2D92",
  "#8B5CF6", "#14B8A6", "#F97316", "#EF4444", "#A855F7",
];

const BG_STYLES: ("none" | "solid" | "translucent")[] = ["none", "solid", "translucent"];
const ALIGN_OPTIONS: ("left" | "center" | "right")[] = ["left", "center", "right"];

// Google Fonts URL
const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Bebas+Neue&family=Anton&family=Righteous&family=Roboto+Mono:wght@400;500&family=Playfair+Display:wght@400;700&family=Fredoka:wght@400;500&family=Caveat:wght@600&display=swap";

export function TextEditorNew({
  isOpen,
  onClose,
  onSave,
  initialText = "",
  initialConfig,
}: TextEditorNewProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(initialText);
  const [selectedFont, setSelectedFont] = useState(initialConfig?.fontFamily || FONTS[0].family);
  const [fontSize, setFontSize] = useState(initialConfig?.fontSize || 32);
  const [color, setColor] = useState(initialConfig?.color || "#FFFFFF");
  const [bgStyle, setBgStyle] = useState<"none" | "solid" | "translucent">(initialConfig?.backgroundColor || "none");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">(initialConfig?.textAlign || "center");
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSave = useCallback(() => {
    if (!text.trim()) {
      onClose();
      return;
    }
    const font = FONTS.find(f => f.family === selectedFont) || FONTS[0];
    onSave(text.trim(), {
      fontFamily: selectedFont,
      fontSize,
      color,
      backgroundColor: bgStyle,
      textAlign,
      fontStyle: font.weight,
    });
    setText("");
    onClose();
  }, [text, selectedFont, fontSize, color, bgStyle, textAlign, onSave, onClose]);

  const toggleBgStyle = () => {
    const currentIdx = BG_STYLES.indexOf(bgStyle);
    setBgStyle(BG_STYLES[(currentIdx + 1) % BG_STYLES.length]);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const toggleAlign = () => {
    const currentIdx = ALIGN_OPTIONS.indexOf(textAlign);
    setTextAlign(ALIGN_OPTIONS[(currentIdx + 1) % ALIGN_OPTIONS.length]);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const AlignIcon = textAlign === "left" ? AlignLeft : textAlign === "right" ? AlignRight : AlignCenter;

  const getPreviewStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      fontFamily: selectedFont,
      fontSize: `${fontSize}px`,
      color,
      textAlign,
      lineHeight: 1.3,
    };

    if (bgStyle === "solid") {
      const isLight = color === "#FFFFFF" || color === "#FFCC00" || color === "#5AC8FA";
      return { ...base, backgroundColor: isLight ? "#000000" : "#FFFFFF", padding: "8px 16px", borderRadius: "8px" };
    }
    if (bgStyle === "translucent") {
      return { ...base, backgroundColor: "rgba(0,0,0,0.5)", padding: "8px 16px", borderRadius: "8px" };
    }
    return { ...base, textShadow: "0 2px 10px rgba(0,0,0,0.8)" };
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`@import url('${GOOGLE_FONTS_URL}');`}</style>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-xl flex flex-col"
        style={{ 
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 active:scale-90 transition-transform"
          >
            <X size={22} className="text-white" />
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleAlign}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 active:scale-90 transition-transform"
            >
              <AlignIcon size={20} className="text-white" />
            </button>

            <button
              onClick={toggleBgStyle}
              className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform ${
                bgStyle === "none" ? "bg-white/10" : bgStyle === "solid" ? "bg-white" : "bg-white/50"
              }`}
            >
              <Palette size={20} className={bgStyle === "solid" ? "text-black" : "text-white"} />
            </button>

            <button
              onClick={handleSave}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-primary active:scale-90 transition-transform"
            >
              <Check size={22} className="text-white" />
            </button>
          </div>
        </div>

        {/* Font size slider - vertical on left */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
          <div className="h-48 w-8 bg-white/10 rounded-full relative flex items-center justify-center">
            <input
              type="range"
              min="18"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="h-40 w-8 appearance-none cursor-pointer bg-transparent [writing-mode:vertical-lr] [direction:rtl]
                [&::-webkit-slider-runnable-track]:w-1 [&::-webkit-slider-runnable-track]:bg-white/30 [&::-webkit-slider-runnable-track]:rounded-full
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
            />
          </div>
          <span className="text-white/60 text-xs mt-2">{fontSize}</span>
        </div>

        {/* Main text input area */}
        <div className="flex-1 flex items-center justify-center px-16">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe algo..."
            rows={4}
            className="w-full bg-transparent border-none outline-none resize-none text-center placeholder:text-white/30"
            style={getPreviewStyle()}
          />
        </div>

        {/* Color picker */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {/* Eyedropper */}
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Pipette size={16} className="text-white" />
            </button>

            {/* Colors */}
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  if (navigator.vibrate) navigator.vibrate(10);
                }}
                className={`flex-shrink-0 w-8 h-8 rounded-full border-2 transition-transform ${
                  color === c ? "scale-110 border-white" : "border-white/30"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Font selector - horizontal scroll */}
        <div className="px-4 pb-6">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {FONTS.map((font) => (
              <button
                key={font.id}
                onClick={() => {
                  setSelectedFont(font.family);
                  if (navigator.vibrate) navigator.vibrate(10);
                }}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                  selectedFont === font.family 
                    ? "bg-white text-black" 
                    : "bg-white/10 text-white"
                }`}
              >
                <span 
                  className="text-xl" 
                  style={{ fontFamily: font.family, fontWeight: font.weight }}
                >
                  {font.preview}
                </span>
                <span className="text-[10px] opacity-70">{font.name}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}
