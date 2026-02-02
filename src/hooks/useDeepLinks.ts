import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para manejar deep links en iOS/Android (Capacitor)
 * Intercepta callbacks de autenticación cuando la app se abre desde una URL externa
 */
export const useDeepLinks = () => {
  useEffect(() => {
    // Solo ejecutar en plataformas nativas
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleAppUrlOpen = async ({ url }: { url: string }) => {
      console.log('Deep link received:', url);

      try {
        // Manejar callbacks de autenticación OAuth
        if (url.includes('access_token') || url.includes('code=') || url.includes('error=')) {
          // Extraer fragmento de hash si existe
          const hashIndex = url.indexOf('#');
          if (hashIndex !== -1) {
            const hash = url.substring(hashIndex + 1);
            const params = new URLSearchParams(hash);
            
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            
            if (accessToken && refreshToken) {
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (error) {
                console.error('Error setting session from deep link:', error);
              } else {
                console.log('Session set successfully from deep link');
              }
              return;
            }
          }

          // Manejar código de autorización (PKCE flow)
          const urlObj = new URL(url);
          const code = urlObj.searchParams.get('code');
          
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error('Error exchanging code for session:', error);
            } else {
              console.log('Session exchanged successfully from deep link');
            }
            return;
          }

          // Manejar errores de OAuth
          const error = urlObj.searchParams.get('error');
          const errorDescription = urlObj.searchParams.get('error_description');
          if (error) {
            console.error('OAuth error:', error, errorDescription);
          }
        }

        // Manejar otros deep links (navegación interna)
        const path = url.replace(/^.*:\/\/[^/]+/, '');
        if (path && path !== '/') {
          // Navegar a la ruta si es necesario
          window.location.href = path;
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
      }
    };

    // Registrar listener para URLs de app
    CapacitorApp.addListener('appUrlOpen', handleAppUrlOpen);

    // Cleanup
    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, []);
};
