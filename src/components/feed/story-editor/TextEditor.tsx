import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Check, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { FONT_OPTIONS, COLOR_OPTIONS } from "./types";

interface TextEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string, config: TextConfig) => void;
  initialText?: string;
  initialConfig?: Partial<TextConfig>;
}

export interface TextConfig {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: "none" | "solid" | "translucent";
  textAlign: "left" | "center" | "right";
}

export function TextEditor({ 
  isOpen, 
  onClose, 
  onSave, 
  initialText = "",
  initialConfig 
}: TextEditorProps) {
  const [text, setText] = useState(initialText);
  const [selectedFont, setSelectedFont] = useState(initialConfig?.fontFamily || FONT_OPTIONS[0].family);
  const [fontSize, setFontSize] = useState(initialConfig?.fontSize || 32);
  const [selectedColor, setSelectedColor] = useState(initialConfig?.color || "#FFFFFF");
  const [bgStyle, setBgStyle] = useState<"none" | "solid" | "translucent">(initialConfig?.backgroundColor || "none");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">(initialConfig?.textAlign || "center");
  
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSave = () => {
    if (text.trim()) {
      onSave(text, {
        fontFamily: selectedFont,
        fontSize,
        color: selectedColor,
        backgroundColor: bgStyle,
        textAlign,
      });
    }
    onClose();
  };

  const toggleBgStyle = () => {
    const styles: ("none" | "solid" | "translucent")[] = ["none", "solid", "translucent"];
    const idx = styles.indexOf(bgStyle);
    setBgStyle(styles[(idx + 1) % styles.length]);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const toggleAlign = () => {
    const aligns: ("left" | "center" | "right")[] = ["left", "center", "right"];
    const idx = aligns.indexOf(textAlign);
    setTextAlign(aligns[(idx + 1) % aligns.length]);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const getTextContainerStyle = () => {
    const base: React.CSSProperties = {
      fontFamily: selectedFont,
      fontSize: `${fontSize}px`,
      color: selectedColor,
      textAlign,
    };

    if (bgStyle === "solid") {
      const isLight = selectedColor === "#FFFFFF" || selectedColor === "#FFCC00";
      return { ...base, backgroundColor: isLight ? "#000000" : "#FFFFFF", padding: "8px 16px", borderRadius: "8px" };
    }
    if (bgStyle === "translucent") {
      return { ...base, backgroundColor: "rgba(0,0,0,0.5)", padding: "8px 16px", borderRadius: "8px" };
    }
    return { ...base, textShadow: "0 2px 8px rgba(0,0,0,0.6)" };
  };

  const AlignIcon = textAlign === "left" ? AlignLeft : textAlign === "right" ? AlignRight : AlignCenter;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),16px)] pb-3">
        <button
          onClick={toggleAlign}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90"
        >
          <AlignIcon size={20} className="text-white" />
        </button>

        <button
          onClick={toggleBgStyle}
          className="px-3 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90"
        >
          <span className="text-sm font-medium text-white">
            {bgStyle === "none" ? "A" : bgStyle === "solid" ? "A" : "A"}
          </span>
          <div 
            className="ml-2 w-5 h-5 rounded border-2 border-white"
            style={{ 
              backgroundColor: bgStyle === "none" ? "transparent" : bgStyle === "solid" ? "white" : "rgba(255,255,255,0.4)" 
            }}
          />
        </button>

        <button
          onClick={handleSave}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center active:scale-90"
        >
          <Check size={22} className="text-black" />
        </button>
      </div>

      {/* Font size slider - vertical on left */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 h-52 flex flex-col items-center z-20">
        <span className="text-xs text-white/60 mb-2 font-medium">{fontSize}</span>
        <div className="relative h-44 w-8 flex items-center justify-center">
          <div className="absolute h-full w-1 bg-white/20 rounded-full" />
          <input
            type="range"
            min="16"
            max="72"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="h-44 w-8 appearance-none bg-transparent cursor-pointer touch-pan-y"
            style={{
              writingMode: "vertical-lr",
              direction: "rtl",
            }}
          />
        </div>
      </div>

      {/* Text input area */}
      <div className="flex-1 flex items-center justify-center px-12">
        <div style={getTextContainerStyle()} className="max-w-full">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe aquí..."
            className="w-full bg-transparent border-none outline-none resize-none text-center placeholder:text-white/30"
            style={{
              fontFamily: "inherit",
              fontSize: "inherit",
              color: "inherit",
              textAlign: "inherit",
              minWidth: "200px",
              maxWidth: "100%",
            }}
            rows={3}
          />
        </div>
      </div>

      {/* Font selector - horizontal scroll */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {FONT_OPTIONS.map((font) => (
            <button
              key={font.id}
              onClick={() => {
                setSelectedFont(font.family);
                if (navigator.vibrate) navigator.vibrate(10);
              }}
              className={`
                flex-shrink-0 px-4 py-2 rounded-full transition-all
                ${selectedFont === font.family 
                  ? "bg-white text-black" 
                  : "bg-white/10 text-white"
                }
              `}
              style={{ fontFamily: font.family }}
            >
              {font.name}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div className="px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
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
    </motion.div>
  );
}
