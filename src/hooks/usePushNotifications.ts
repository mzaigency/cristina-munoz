import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Firebase config — replace VAPID_KEY with your Web Push certificate from Firebase Console
const VAPID_KEY = "BH2_PIC9lM3oeV49itkKlddUbagkIq_FK80gqNZqHGQ5IRdjt41rkYQG34cPf_Gfd5bs-nZcr66BoGxgAAihrTg";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAL-OMCiWg0WwmoXRVGk8Fh8zGqHo4z27M",
  authDomain: "glowapp-8837d.firebaseapp.com",
  projectId: "glowapp-8837d",
  storageBucket: "glowapp-8837d.firebasestorage.app",
  messagingSenderId: "459863249000",
  appId: "1:459863249000:web:fef8028fe735f54193abdd",
};

type PermissionState = "default" | "granted" | "denied" | "unsupported";

export function usePushNotifications() {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const saveToken = useCallback(async (fcmToken: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("push_tokens").upsert(
        {
          user_id: user.id,
          token: fcmToken,
          platform: "web",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "token" }
      );

      if (error) {
        console.error("Error saving push token:", error);
      }
    } catch (err) {
      console.error("Error saving push token:", err);
    }
  }, []);

  useEffect(() => {
    const supported =
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setIsSupported(supported);

    if (supported) {
      const perm = Notification.permission as PermissionState;
      setPermission(perm);

      if (perm === "granted") {
        (async () => {
          try {
            const { initializeApp, getApps } = await import("firebase/app");
            const { getMessaging, getToken } = await import("firebase/messaging");
            const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];
            const messaging = getMessaging(app);
            const regs = await navigator.serviceWorker.getRegistrations();
            const fbReg = regs.find(r => r.active?.scriptURL?.includes("firebase-messaging-sw"));
            if (fbReg) {
              const fcmToken = await getToken(messaging, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: fbReg,
              });
              if (fcmToken) {
                setToken(fcmToken);
                await saveToken(fcmToken);
              }
            }
          } catch (err) {
            console.error("Error recovering FCM token:", err);
          }
        })();
      }
    } else {
      setPermission("unsupported");
    }
  }, [saveToken]);

  const removeToken = useCallback(async () => {
    if (!token) return;
    try {
      await supabase.from("push_tokens").delete().eq("token", token);
    } catch (err) {
      console.error("Error removing push token:", err);
    }
  }, [token]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);

      if (result !== "granted") {
        setLoading(false);
        return false;
      }

      // Dynamically import Firebase to keep bundle small
      const { initializeApp, getApps } = await import("firebase/app");
      const { getMessaging, getToken } = await import("firebase/messaging");

      // Initialize Firebase if not already
      const app =
        getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];
      const messaging = getMessaging(app);

      // Register the custom service worker
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

      // Get FCM token
      const fcmToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (fcmToken) {
        setToken(fcmToken);
        await saveToken(fcmToken);
        setLoading(false);
        return true;
      }

      setLoading(false);
      return false;
    } catch (error) {
      console.error("Error requesting push permission:", error);
      setLoading(false);
      return false;
    }
  }, [isSupported, saveToken]);

  const disablePush = useCallback(async () => {
    await removeToken();
    setToken(null);
  }, [removeToken]);

  return {
    permission,
    token,
    loading,
    isSupported,
    isEnabled: permission === "granted" && !!token,
    requestPermission,
    disablePush,
  };
}
