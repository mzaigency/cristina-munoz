import { useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface PushNotificationData {
  title?: string;
  body?: string;
  action_url?: string;
  [key: string]: unknown;
}

export function usePushNotifications() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const initialized = useRef(false);

  const registerToken = useCallback(async (token: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
      
      // Upsert the token
      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token,
          platform,
          device_id: token.substring(0, 20), // Use part of token as device ID
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,token'
        });

      if (error) throw error;
      console.log('Push token registered successfully');
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  }, []);

  const unregisterToken = useCallback(async (token: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('token', token);

      if (error) throw error;
      console.log('Push token unregistered');
    } catch (error) {
      console.error('Error unregistering push token:', error);
    }
  }, []);

  const handleNotificationReceived = useCallback((notification: PushNotificationData) => {
    // Show in-app toast when notification received while app is open
    toast({
      title: notification.title || 'Nueva notificación',
      description: notification.body || '',
    });
  }, [toast]);

  const handleNotificationTapped = useCallback((notification: PushNotificationData) => {
    // Navigate to the action URL when notification is tapped
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  }, [navigate]);

  const initializePushNotifications = useCallback(async () => {
    if (initialized.current) return;
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Dynamic import to avoid issues on web
      const { PushNotifications } = await import('@capacitor/push-notifications');

      // Request permission
      const permStatus = await PushNotifications.requestPermissions();
      
      if (permStatus.receive === 'granted') {
        // Register for push notifications
        await PushNotifications.register();
      } else {
        console.log('Push notification permission denied');
        return;
      }

      // Listen for registration success
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token:', token.value);
        registerToken(token.value);
      });

      // Listen for registration errors
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error.error);
      });

      // Listen for push notifications received
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification);
        handleNotificationReceived({
          title: notification.title,
          body: notification.body,
          ...notification.data
        });
      });

      // Listen for notification action performed (tapped)
      PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
        console.log('Push notification action performed:', event);
        handleNotificationTapped({
          title: event.notification.title,
          body: event.notification.body,
          ...event.notification.data
        });
      });

      initialized.current = true;
      console.log('Push notifications initialized');
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }, [registerToken, handleNotificationReceived, handleNotificationTapped]);

  // Initialize on mount for native platforms
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      initializePushNotifications();
    }
  }, [initializePushNotifications]);

  // Listen for auth changes to register/unregister tokens
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!Capacitor.isNativePlatform()) return;

      if (event === 'SIGNED_IN' && session) {
        // Re-register token on sign in
        initializePushNotifications();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initializePushNotifications]);

  return {
    initializePushNotifications,
    registerToken,
    unregisterToken
  };
}
