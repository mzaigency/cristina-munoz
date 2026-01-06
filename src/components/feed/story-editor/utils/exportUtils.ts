// Export utilities for the Story Editor

import type { Canvas as FabricCanvas } from 'fabric';
import { CANVAS_WIDTH, CANVAS_HEIGHT, EXPORT_SETTINGS } from './constants';

// Export canvas as JPEG - reset viewport to get full resolution
export async function exportAsJPG(canvas: FabricCanvas): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Save current viewport
      const currentVpt = canvas.viewportTransform?.slice() || [1, 0, 0, 1, 0, 0];
      
      // Reset to identity for export at full resolution
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      
      // Get the canvas element at full resolution
      const canvasElement = canvas.toCanvasElement(1, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        left: 0,
        top: 0,
      });

      // Restore viewport
      canvas.setViewportTransform(currentVpt as [number, number, number, number, number, number]);

      canvasElement.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create JPEG blob'));
          }
        },
        'image/jpeg',
        EXPORT_SETTINGS.jpgQuality
      );
    } catch (error) {
      reject(error);
    }
  });
}

// Export canvas as PNG (with transparency)
export async function exportAsPNG(canvas: FabricCanvas): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const canvasElement = canvas.toCanvasElement(1, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        left: 0,
        top: 0,
      });

      canvasElement.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create PNG blob'));
          }
        },
        'image/png',
        EXPORT_SETTINGS.pngQuality
      );
    } catch (error) {
      reject(error);
    }
  });
}

// Export canvas as JSON (for templates)
export function exportAsJSON(canvas: FabricCanvas): string {
  return JSON.stringify(canvas.toJSON());
}

// Import from JSON
export async function importFromJSON(canvas: FabricCanvas, json: string): Promise<void> {
  const data = JSON.parse(json);
  await canvas.loadFromJSON(data);
  canvas.renderAll();
}

// Download blob as file
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Download as JPG
export async function downloadAsJPG(canvas: FabricCanvas, filename: string = 'story.jpg'): Promise<void> {
  const blob = await exportAsJPG(canvas);
  downloadBlob(blob, filename);
}

// Download as PNG
export async function downloadAsPNG(canvas: FabricCanvas, filename: string = 'story.png'): Promise<void> {
  const blob = await exportAsPNG(canvas);
  downloadBlob(blob, filename);
}

// Get data URL from canvas
export function getDataURL(canvas: FabricCanvas, format: 'jpeg' | 'png' = 'jpeg'): string {
  return canvas.toDataURL({
    format,
    quality: format === 'jpeg' ? EXPORT_SETTINGS.jpgQuality : 1,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    multiplier: 1,
  });
}

// Compress image if needed
export async function compressIfNeeded(blob: Blob, maxSizeMB: number = EXPORT_SETTINGS.maxFileSizeMB): Promise<Blob> {
  const maxSize = maxSizeMB * 1024 * 1024;
  
  if (blob.size <= maxSize) {
    return blob;
  }

  // Need to compress - use canvas to reduce quality
  const img = new Image();
  const url = URL.createObjectURL(blob);
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      // Start with high quality and reduce until size is acceptable
      let quality = 0.9;
      const compress = () => {
        canvas.toBlob(
          (newBlob) => {
            if (!newBlob) {
              reject(new Error('Compression failed'));
              return;
            }
            
            if (newBlob.size <= maxSize || quality <= 0.3) {
              resolve(newBlob);
            } else {
              quality -= 0.1;
              compress();
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      compress();
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };
    
    img.src = url;
  });
}
