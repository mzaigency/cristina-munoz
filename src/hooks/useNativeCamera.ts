import { useCallback } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface CaptureResult {
  dataUrl: string;
  format: 'jpeg' | 'png';
}

export function useNativeCamera() {
  const isNative = Capacitor.isNativePlatform();

  const capturePhoto = useCallback(async (): Promise<CaptureResult | null> => {
    if (!isNative) return null;

    try {
      const image = await Camera.getPhoto({
        quality: 95,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1080,
        height: 1920,
        correctOrientation: true,
      });

      if (image.dataUrl) {
        return {
          dataUrl: image.dataUrl,
          format: image.format === 'png' ? 'png' : 'jpeg',
        };
      }
      return null;
    } catch (error) {
      console.error('Native camera error:', error);
      return null;
    }
  }, [isNative]);

  const pickFromGallery = useCallback(async (): Promise<CaptureResult | null> => {
    if (!isNative) return null;

    try {
      const image = await Camera.getPhoto({
        quality: 95,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        width: 1080,
        height: 1920,
        correctOrientation: true,
      });

      if (image.dataUrl) {
        return {
          dataUrl: image.dataUrl,
          format: image.format === 'png' ? 'png' : 'jpeg',
        };
      }
      return null;
    } catch (error) {
      console.error('Gallery picker error:', error);
      return null;
    }
  }, [isNative]);

  const checkPermissions = useCallback(async () => {
    if (!isNative) return { camera: 'granted', photos: 'granted' };

    try {
      const status = await Camera.checkPermissions();
      return status;
    } catch {
      return { camera: 'denied', photos: 'denied' };
    }
  }, [isNative]);

  const requestPermissions = useCallback(async () => {
    if (!isNative) return { camera: 'granted', photos: 'granted' };

    try {
      const status = await Camera.requestPermissions();
      return status;
    } catch {
      return { camera: 'denied', photos: 'denied' };
    }
  }, [isNative]);

  return {
    isNative,
    capturePhoto,
    pickFromGallery,
    checkPermissions,
    requestPermissions,
  };
}
