import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.glowapp.app',
  appName: 'GlowApp',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#4361ee",
      showSpinner: false,
      androidSpinnerStyle: "small",
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#4361ee'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    Camera: {
      promptLabelPhoto: 'Seleccionar de la galería',
      promptLabelPicture: 'Hacer una foto'
    }
  }
};

export default config;
