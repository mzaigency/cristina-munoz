import { Capacitor } from '@capacitor/core';

export function usePlatform() {
  const platform = Capacitor.getPlatform(); // 'web' | 'ios' | 'android'
  const isNative = Capacitor.isNativePlatform();
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';
  const isWeb = platform === 'web';

  return { 
    platform, 
    isNative, 
    isIOS, 
    isAndroid, 
    isWeb 
  };
}
