import { IMAGE_FILTERS, IMAGE_ADJUSTMENTS, generateFilterCSS, generateVignetteCSS } from "@/constants/story-assets";

interface OverlayItem {
  id: string;
  type: "text" | "sticker" | "drawing" | "widget";
  content: string;
  fontFamily: string;
  color: string;
  align: "left" | "center" | "right";
  x: number;
  y: number;
  scale: number;
  rotation: number;
  textStyle?: string;
  textGradient?: string | null;
  fontSize?: number;
  widgetType?: string;
  widgetConfig?: any;
}

interface StoryRenderOptions {
  imageData: string;
  overlays: OverlayItem[];
  activeFilter: string;
  imageAdjustments: Record<string, number>;
  drawingDataUrl: string | null;
  width?: number;
  height?: number;
  quality?: number;
}

/**
 * Renders all story layers into a single high-quality image
 */
export async function flattenStoryToImage(options: StoryRenderOptions): Promise<string> {
  const {
    imageData,
    overlays,
    activeFilter,
    imageAdjustments,
    drawingDataUrl,
    width = 1080,
    height = 1920,
    quality = 0.92,
  } = options;

  // Create offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  
  if (!ctx) {
    throw new Error("Could not create canvas context");
  }

  // 1. Draw base image with filters
  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Apply CSS filter to canvas context
      const filterDef = IMAGE_FILTERS.find(f => f.id === activeFilter);
      const filterCSS = filterDef?.filter || "";
      const adjustmentFilter = generateFilterCSS(imageAdjustments);
      const combinedFilter = [filterCSS, adjustmentFilter].filter(Boolean).join(" ");
      
      if (combinedFilter) {
        ctx.filter = combinedFilter;
      }
      
      // Draw image covering the canvas (object-fit: cover behavior)
      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (imgAspect > canvasAspect) {
        drawHeight = height;
        drawWidth = img.width * (height / img.height);
        offsetX = (width - drawWidth) / 2;
        offsetY = 0;
      } else {
        drawWidth = width;
        drawHeight = img.height * (width / img.width);
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      ctx.filter = "none";
      resolve();
    };
    img.onerror = reject;
    img.src = imageData;
  });

  // 2. Draw vignette if applied
  if (imageAdjustments.vignette > 0) {
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(1, `rgba(0, 0, 0, ${imageAdjustments.vignette / 100})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // 3. Draw drawing layer if exists
  if (drawingDataUrl) {
    await new Promise<void>((resolve, reject) => {
      const drawingImg = new Image();
      drawingImg.crossOrigin = "anonymous";
      drawingImg.onload = () => {
        ctx.drawImage(drawingImg, 0, 0, width, height);
        resolve();
      };
      drawingImg.onerror = reject;
      drawingImg.src = drawingDataUrl;
    });
  }

  // 4. Draw overlays (text, stickers, widgets)
  for (const overlay of overlays) {
    ctx.save();
    
    // Position and transform
    const x = overlay.x * width;
    const y = overlay.y * height;
    
    ctx.translate(x, y);
    ctx.rotate((overlay.rotation * Math.PI) / 180);
    ctx.scale(overlay.scale, overlay.scale);
    
    if (overlay.type === "text") {
      // Text rendering
      const fontSize = overlay.fontSize || 40;
      ctx.font = `bold ${fontSize}px ${overlay.fontFamily || "Inter"}`;
      ctx.textAlign = overlay.align;
      ctx.textBaseline = "middle";
      
      // Text shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      
      // Fill text
      ctx.fillStyle = overlay.color || "#ffffff";
      ctx.fillText(overlay.content || "Texto", 0, 0);
      
    } else if (overlay.type === "sticker") {
      // Sticker rendering (emoji)
      ctx.font = "80px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(overlay.content, 0, 0);
      
    } else if (overlay.type === "widget") {
      // Widget placeholder rendering
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
      ctx.shadowBlur = 20;
      
      const widgetWidth = 256;
      const widgetHeight = overlay.widgetType === "emoji_slider" ? 120 : 160;
      const radius = 16;
      
      // Rounded rectangle
      ctx.beginPath();
      ctx.roundRect(-widgetWidth / 2, -widgetHeight / 2, widgetWidth, widgetHeight, radius);
      ctx.fill();
      
      // Widget content
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#1a1a1a";
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.textAlign = "center";
      
      if (overlay.widgetType === "poll" && overlay.widgetConfig) {
        ctx.fillText(overlay.widgetConfig.question || "Encuesta", 0, -widgetHeight / 2 + 30);
        
        // Draw options
        const options = overlay.widgetConfig.options || [];
        options.forEach((opt: string, i: number) => {
          ctx.fillStyle = "#6366f1";
          ctx.beginPath();
          ctx.roundRect(-100, -20 + i * 35, 200, 28, 8);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "500 12px Inter, sans-serif";
          ctx.fillText(opt, 0, -6 + i * 35);
        });
        
      } else if (overlay.widgetType === "question" && overlay.widgetConfig) {
        ctx.fillText(overlay.widgetConfig.prompt || "Hazme una pregunta", 0, -widgetHeight / 2 + 30);
        
        // Draw input placeholder
        ctx.fillStyle = "#f0f0f0";
        ctx.beginPath();
        ctx.roundRect(-110, -10, 220, 60, 8);
        ctx.fill();
        ctx.fillStyle = "#999999";
        ctx.font = "400 12px Inter, sans-serif";
        ctx.fillText(overlay.widgetConfig.placeholder || "Escribe aquí...", 0, 20);
        
      } else if (overlay.widgetType === "emoji_slider" && overlay.widgetConfig) {
        ctx.fillText(overlay.widgetConfig.question || "¿Cuánto?", 0, -widgetHeight / 2 + 25);
        
        // Draw slider track
        ctx.fillStyle = "#e0e0e0";
        ctx.beginPath();
        ctx.roundRect(-100, 10, 200, 12, 6);
        ctx.fill();
        
        // Draw emoji
        ctx.font = "30px Arial";
        ctx.fillText(overlay.widgetConfig.emoji || "❤️", 0, 15);
      }
    }
    
    ctx.restore();
  }

  // 5. Export as data URL
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Downloads the flattened story as an image file
 */
export async function downloadStoryAsImage(
  options: StoryRenderOptions,
  filename: string = "historia.jpg"
): Promise<void> {
  const dataUrl = await flattenStoryToImage(options);
  
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Creates a blob from the flattened story for uploading
 */
export async function flattenStoryToBlob(
  options: StoryRenderOptions
): Promise<Blob> {
  const dataUrl = await flattenStoryToImage(options);
  
  // Convert data URL to blob
  const response = await fetch(dataUrl);
  return response.blob();
}
