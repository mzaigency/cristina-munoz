import { supabase } from "@/integrations/supabase/client";
import type { OverlayItem } from "./types";

interface FlattenOptions {
  imageData: string;
  overlays: OverlayItem[];
  drawingDataUrl: string | null;
  width?: number;
  height?: number;
}

// Load an image from URL/dataURL
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Flatten all story layers into a single canvas
export async function flattenStoryLayers({
  imageData,
  overlays,
  drawingDataUrl,
  width = 1080,
  height = 1920,
}: FlattenOptions): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  
  if (!ctx) throw new Error("Could not get canvas context");

  // 1. Draw background image
  const bgImage = await loadImage(imageData);
  
  // Calculate cover fit
  const imgAspect = bgImage.width / bgImage.height;
  const canvasAspect = width / height;
  
  let drawWidth: number, drawHeight: number, drawX: number, drawY: number;
  
  if (imgAspect > canvasAspect) {
    drawHeight = height;
    drawWidth = height * imgAspect;
    drawX = (width - drawWidth) / 2;
    drawY = 0;
  } else {
    drawWidth = width;
    drawHeight = width / imgAspect;
    drawX = 0;
    drawY = (height - drawHeight) / 2;
  }
  
  ctx.drawImage(bgImage, drawX, drawY, drawWidth, drawHeight);

  // 2. Draw drawing layer
  if (drawingDataUrl) {
    const drawingImage = await loadImage(drawingDataUrl);
    ctx.drawImage(drawingImage, 0, 0, width, height);
  }

  // 3. Draw overlays (text, stickers, images)
  for (const item of overlays) {
    const x = item.x * width;
    const y = item.y * height;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((item.rotation * Math.PI) / 180);
    ctx.scale(item.scale, item.scale);

    if (item.type === "text" && item.content) {
      // Text rendering
      const fontSize = item.fontSize || 32;
      ctx.font = `${fontSize}px ${item.fontFamily || "Inter"}`;
      ctx.textAlign = (item.textAlign as CanvasTextAlign) || "center";
      ctx.textBaseline = "middle";

      // Background styles
      if (item.backgroundColor === "solid" || item.backgroundColor === "translucent") {
        const metrics = ctx.measureText(item.content);
        const textWidth = metrics.width;
        const textHeight = fontSize * 1.4;
        const padding = 16;

        if (item.backgroundColor === "solid") {
          const isLight = item.color === "#FFFFFF" || item.color === "#FFCC00";
          ctx.fillStyle = isLight ? "#000000" : "#FFFFFF";
        } else {
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        }

        ctx.beginPath();
        ctx.roundRect(
          -textWidth / 2 - padding,
          -textHeight / 2 - padding / 2,
          textWidth + padding * 2,
          textHeight + padding,
          8
        );
        ctx.fill();
      }

      // Text shadow for normal text
      if (item.backgroundColor === "none") {
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
      }

      ctx.fillStyle = item.color || "#FFFFFF";
      ctx.fillText(item.content, 0, 0);
    } else if (item.type === "sticker" && item.content) {
      // Emoji/sticker rendering
      ctx.font = "64px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(item.content, 0, 0);
    } else if (item.type === "image" && item.content) {
      // Picture-in-picture rendering
      try {
        const pipImage = await loadImage(item.content);
        const size = 150; // Base size
        
        ctx.save();
        
        // Apply clip shape
        if (item.clipShape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
          ctx.clip();
        } else if (item.clipShape === "rounded") {
          ctx.beginPath();
          ctx.roundRect(-size / 2, -size / 2, size, size, 20);
          ctx.clip();
        }
        
        // Draw the image centered
        ctx.drawImage(pipImage, -size / 2, -size / 2, size, size);
        ctx.restore();
      } catch (e) {
        console.error("Error loading PiP image:", e);
      }
    }

    ctx.restore();
  }

  return canvas;
}

// Convert canvas to blob
export function canvasToBlob(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob"));
      },
      "image/jpeg",
      quality
    );
  });
}

// Upload story to Supabase Storage
export async function uploadStoryImage(blob: Blob, tenantId: string): Promise<string> {
  const fileName = `${tenantId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
  
  const { data, error } = await supabase.storage
    .from("story-images")
    .upload(fileName, blob, {
      contentType: "image/jpeg",
      cacheControl: "3600",
    });

  if (error) throw error;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("story-images")
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// Create story record in database
export async function createStoryRecord(
  tenantId: string,
  imageUrl: string,
  caption?: string
): Promise<string> {
  // Story expires after 24 hours
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const { data, error } = await supabase
    .from("salon_stories")
    .insert({
      tenant_id: tenantId,
      image_url: imageUrl,
      caption: caption || null,
      story_type: "image",
      expires_at: expiresAt.toISOString(),
      is_active: true,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

// Full publish flow
export async function publishStory(
  options: FlattenOptions & { tenantId: string; caption?: string }
): Promise<{ storyId: string; imageUrl: string }> {
  // 1. Flatten all layers
  const canvas = await flattenStoryLayers(options);
  
  // 2. Convert to blob
  const blob = await canvasToBlob(canvas);
  
  // 3. Upload to storage
  const imageUrl = await uploadStoryImage(blob, options.tenantId);
  
  // 4. Create database record
  const storyId = await createStoryRecord(options.tenantId, imageUrl, options.caption);
  
  return { storyId, imageUrl };
}

// Download story as image (for local save)
export async function downloadStoryImage(options: FlattenOptions, filename: string): Promise<void> {
  const canvas = await flattenStoryLayers(options);
  const blob = await canvasToBlob(canvas);
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
