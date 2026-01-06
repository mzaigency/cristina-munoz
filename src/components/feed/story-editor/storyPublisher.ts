import { supabase } from "@/integrations/supabase/client";

interface FlattenOptions {
  imageData: string;
  width?: number;
  height?: number;
}

interface PublishOptions extends FlattenOptions {
  tenantId: string;
  caption?: string;
  videoBlob?: Blob;
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

// Flatten story to a single canvas
export async function flattenStoryLayers({
  imageData,
  width = 1080,
  height = 1920,
}: FlattenOptions): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  
  if (!ctx) throw new Error("Could not get canvas context");

  // Draw background image
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

// Upload story image to Supabase Storage
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

// Upload story video to Supabase Storage
export async function uploadStoryVideo(blob: Blob, tenantId: string): Promise<string> {
  const fileName = `${tenantId}/${Date.now()}-${Math.random().toString(36).substring(7)}.webm`;
  
  const { data, error } = await supabase.storage
    .from("story-videos")
    .upload(fileName, blob, {
      contentType: blob.type || "video/webm",
      cacheControl: "3600",
    });

  if (error) throw error;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("story-videos")
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// Create story record in database
export async function createStoryRecord(
  tenantId: string,
  imageUrl: string,
  storyType: "image" | "video" = "image",
  videoUrl?: string,
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
      video_url: videoUrl || null,
      caption: caption || null,
      story_type: storyType,
      expires_at: expiresAt.toISOString(),
      is_active: true,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

// Publish story with Fabric canvas
export async function publishStoryFromCanvas(
  canvasBlob: Blob,
  tenantId: string,
  caption?: string,
  videoBlob?: Blob
): Promise<{ storyId: string; imageUrl: string; videoUrl?: string }> {
  // Upload image to storage
  const imageUrl = await uploadStoryImage(canvasBlob, tenantId);
  
  // Upload video if present
  let videoUrl: string | undefined;
  if (videoBlob) {
    videoUrl = await uploadStoryVideo(videoBlob, tenantId);
  }
  
  // Create database record
  const storyType = videoBlob ? "video" : "image";
  const storyId = await createStoryRecord(tenantId, imageUrl, storyType, videoUrl, caption);
  
  return { storyId, imageUrl, videoUrl };
}

// Full publish flow for image stories (legacy)
export async function publishStory(
  options: PublishOptions
): Promise<{ storyId: string; imageUrl: string; videoUrl?: string }> {
  const { tenantId, caption, videoBlob } = options;
  
  // Flatten all layers for thumbnail
  const canvas = await flattenStoryLayers(options);
  
  // Convert to blob
  const imageBlob = await canvasToBlob(canvas);
  
  // Upload thumbnail/image to storage
  const imageUrl = await uploadStoryImage(imageBlob, tenantId);
  
  // Upload video if present
  let videoUrl: string | undefined;
  if (videoBlob) {
    videoUrl = await uploadStoryVideo(videoBlob, tenantId);
  }
  
  // Create database record
  const storyType = videoBlob ? "video" : "image";
  const storyId = await createStoryRecord(tenantId, imageUrl, storyType, videoUrl, caption);
  
  return { storyId, imageUrl, videoUrl };
}

// Download story as image (for local save)
export async function downloadStoryImage(imageData: string, filename: string): Promise<void> {
  const canvas = await flattenStoryLayers({ imageData });
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
