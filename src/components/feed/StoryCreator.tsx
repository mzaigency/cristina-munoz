import React, { useState, useRef, useEffect } from "react";
import { Type, Sparkles, Palette, Smile, Heart, Star, Sun, Moon, Coffee, Music, Camera, Trash2 } from "lucide-react";

const StoryEditor = () => {
  const [bgImage, setBgImage] = useState(null);
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [filter, setFilter] = useState("none");
  const [showDeleteZone, setShowDeleteZone] = useState(false);
  const [isNearDelete, setIsNearDelete] = useState(false);
  const [editingText, setEditingText] = useState(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const filters = [
    { name: "Original", value: "none", style: {} },
    { name: "B&W", value: "grayscale", style: { filter: "grayscale(100%)" } },
    { name: "Sepia", value: "sepia", style: { filter: "sepia(100%)" } },
    { name: "Vintage", value: "vintage", style: { filter: "sepia(50%) contrast(110%)" } },
    { name: "Cálido", value: "warm", style: { filter: "saturate(130%) brightness(105%)" } },
    { name: "Frío", value: "cool", style: { filter: "hue-rotate(180deg) saturate(120%)" } },
    { name: "Dramático", value: "dramatic", style: { filter: "contrast(140%) brightness(90%)" } },
    { name: "Suave", value: "soft", style: { filter: "brightness(110%) contrast(90%)" } },
  ];

  const fonts = [
    "Inter",
    "SF Pro Display",
    "Helvetica Neue",
    "Arial",
    "Georgia",
    "Courier New",
    "Times New Roman",
    "Verdana",
    "Comic Sans MS",
    "Impact",
    "Trebuchet MS",
    "Palatino",
  ];

  const stickers = [
    { icon: Smile, color: "#FFD700" },
    { icon: Heart, color: "#FF69B4" },
    { icon: Star, color: "#FFA500" },
    { icon: Sun, color: "#FFD700" },
    { icon: Moon, color: "#B0C4DE" },
    { icon: Coffee, color: "#8B4513" },
    { icon: Music, color: "#9370DB" },
    { icon: Camera, color: "#FF6347" },
  ];

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (
        canvasRef.current &&
        canvasRef.current.contains(e.target) &&
        !e.target.closest(".element") &&
        !e.target.closest(".toolbar") &&
        !e.target.closest(".edit-panel") &&
        !e.target.closest(".filter-bar") &&
        !editingText &&
        bgImage
      ) {
        const rect = canvasRef.current.getBoundingClientRect();
        addTextElement(e.clientX - rect.left, e.clientY - rect.top);
      }
    };

    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [bgImage, editingText]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setBgImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const addTextElement = (x, y) => {
    const newElement = {
      id: Date.now(),
      type: "text",
      content: "Toca para editar",
      x: x || 200,
      y: y || 200,
      rotation: 0,
      scale: 1,
      color: "#FFFFFF",
      font: "SF Pro Display",
      fontSize: 32,
    };
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
    setEditingText(newElement.id);
  };

  const addStickerElement = (StickerIcon, color) => {
    const newElement = {
      id: Date.now(),
      type: "sticker",
      icon: StickerIcon,
      color: color,
      x: 200,
      y: 200,
      rotation: 0,
      scale: 1,
    };
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  const handleMouseDown = (e, id) => {
    if (e.target.tagName === "INPUT") return;

    e.stopPropagation();
    setSelectedId(id);
    setIsDragging(true);
    setShowDeleteZone(true);

    const element = elements.find((el) => el.id === id);
    const rect = canvasRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left - element.x,
      y: e.clientY - rect.top - element.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedId) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - canvasRect.left - dragStart.x;
    const newY = e.clientY - canvasRect.top - dragStart.y;

    setElements(elements.map((el) => (el.id === selectedId ? { ...el, x: newX, y: newY } : el)));

    const deleteZoneY = canvasRect.height - 100;
    const deleteZoneCenterX = canvasRect.width / 2;
    const distance = Math.sqrt(Math.pow(newX - deleteZoneCenterX, 2) + Math.pow(newY - deleteZoneY, 2));
    setIsNearDelete(distance < 80);
  };

  const handleMouseUp = () => {
    if (isNearDelete && selectedId) {
      setElements(elements.filter((el) => el.id !== selectedId));
      setSelectedId(null);
    }
    setIsDragging(false);
    setShowDeleteZone(false);
    setIsNearDelete(false);
  };

  const handleWheel = (e, id) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;

    if (e.shiftKey) {
      setElements(elements.map((el) => (el.id === id ? { ...el, rotation: el.rotation + delta * 100 } : el)));
    } else {
      setElements(elements.map((el) => (el.id === id ? { ...el, scale: Math.max(0.1, el.scale + delta) } : el)));
    }
  };

  const updateTextContent = (id, value) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, content: value } : el)));
  };

  const updateElementProperty = (id, property, value) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, [property]: value } : el)));
  };

  const selectedElement = elements.find((el) => el.id === selectedId);

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

      {/* Toolbar - Izquierda Centro */}
      <div className="toolbar absolute left-6 top-1/2 -translate-y-1/2 z-20">
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-3 shadow-2xl border border-white/20">
          <div className="flex flex-col gap-3">
            <button
              onClick={() => fileInputRef.current.click()}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-xl group"
              title="Subir imagen"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>

            <div className="h-px bg-white/20 my-1" />

            <button
              onClick={() => addTextElement()}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-300"
              title="Añadir texto"
            >
              <Type className="w-6 h-6 text-white" />
            </button>

            <div className="h-px bg-white/20 my-1" />

            {stickers.slice(0, 4).map((sticker, idx) => (
              <button
                key={idx}
                onClick={() => addStickerElement(sticker.icon, sticker.color)}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-300"
              >
                <sticker.icon className="w-6 h-6" style={{ color: sticker.color }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas Principal */}
      <div
        ref={canvasRef}
        className="w-full h-full relative"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {bgImage ? (
          <div className="w-full h-full relative">
            <img
              src={bgImage}
              alt="Background"
              className="w-full h-full object-cover"
              style={filters.find((f) => f.value === filter)?.style}
            />

            {elements.map((element) => (
              <div
                key={element.id}
                className={`element absolute cursor-move transition-transform ${
                  selectedId === element.id ? "z-10" : "z-5"
                }`}
                style={{
                  left: `${element.x}px`,
                  top: `${element.y}px`,
                  transform: `translate(-50%, -50%) rotate(${element.rotation}deg) scale(${element.scale})`,
                  filter: selectedId === element.id ? "drop-shadow(0 0 20px rgba(255,255,255,0.5))" : "none",
                }}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
                onWheel={(e) => handleWheel(e, element.id)}
              >
                {element.type === "text" ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={element.content}
                      onChange={(e) => updateTextContent(element.id, e.target.value)}
                      className="bg-transparent border-none outline-none text-center min-w-[200px] px-2"
                      style={{
                        color: element.color,
                        fontFamily: element.font,
                        fontSize: `${element.fontSize}px`,
                        fontWeight: "bold",
                        textShadow: "2px 2px 8px rgba(0,0,0,0.7)",
                      }}
                      autoFocus={editingText === element.id}
                      onBlur={() => setEditingText(null)}
                    />
                  </div>
                ) : (
                  <element.icon className="w-16 h-16" style={{ color: element.color }} />
                )}
              </div>
            ))}

            {showDeleteZone && (
              <div
                className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-300 ${
                  isNearDelete ? "scale-125" : "scale-100"
                }`}
              >
                <div
                  className={`p-6 rounded-full backdrop-blur-2xl transition-all duration-300 ${
                    isNearDelete
                      ? "bg-red-500/40 border-2 border-red-500 animate-pulse"
                      : "bg-white/10 border-2 border-white/30"
                  }`}
                >
                  <Trash2 className={`w-8 h-8 transition-colors ${isNearDelete ? "text-white" : "text-white/60"}`} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-20 h-20 text-white/30 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-white/50 text-lg">Toca el icono de imagen para comenzar</p>
            </div>
          </div>
        )}
      </div>

      {selectedElement && (
        <div className="edit-panel absolute right-6 top-1/2 -translate-y-1/2 z-20">
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/20 w-72">
            <h3 className="text-white font-semibold mb-4 text-lg">Editar</h3>

            {selectedElement.type === "text" && (
              <div className="space-y-4">
                <div>
                  <label className="text-white/70 text-sm mb-2 block">Color</label>
                  <input
                    type="color"
                    value={selectedElement.color}
                    onChange={(e) => updateElementProperty(selectedId, "color", e.target.value)}
                    className="w-full h-12 rounded-xl cursor-pointer bg-transparent"
                  />
                </div>

                <div>
                  <label className="text-white/70 text-sm mb-2 block">Fuente</label>
                  <select
                    value={selectedElement.font}
                    onChange={(e) => updateElementProperty(selectedId, "font", e.target.value)}
                    className="w-full bg-white/10 text-white rounded-xl p-3 outline-none border border-white/20"
                  >
                    {fonts.map((font) => (
                      <option key={font} value={font} className="bg-gray-900">
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-white/70 text-sm mb-2 block">Tamaño: {selectedElement.fontSize}px</label>
                  <input
                    type="range"
                    min="16"
                    max="120"
                    value={selectedElement.fontSize}
                    onChange={(e) => updateElementProperty(selectedId, "fontSize", parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {selectedElement.type === "sticker" && (
              <div>
                <label className="text-white/70 text-sm mb-2 block">Color</label>
                <input
                  type="color"
                  value={selectedElement.color}
                  onChange={(e) => updateElementProperty(selectedId, "color", e.target.value)}
                  className="w-full h-12 rounded-xl cursor-pointer"
                />
              </div>
            )}

            <div className="mt-4 p-3 bg-white/5 rounded-xl">
              <p className="text-white/50 text-xs">💡 Scroll: escalar</p>
              <p className="text-white/50 text-xs">💡 Shift+Scroll: rotar</p>
              <p className="text-white/50 text-xs">💡 Arrastra a la papelera</p>
            </div>
          </div>
        </div>
      )}

      {bgImage && (
        <div className="filter-bar absolute top-6 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl px-4 py-3 shadow-2xl border border-white/20">
            <div className="flex gap-3">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    filter === f.value ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryEditor;
