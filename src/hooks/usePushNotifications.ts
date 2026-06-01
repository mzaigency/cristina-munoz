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

const FCM_SW_PATH = "/firebase-messaging-sw.js";
const FCM_SW_SCOPE = "/firebase-push-scope";
const FCM_TOKEN_CACHE_KEY = "fcm_push_token";

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

      // CRITICAL: Reclaim this FCM token from any other user that previously
      // logged in on this browser. The FCM token is unique per browser/device,
      // so if a stale row points to another user_id, push notifications meant
      // for that user would be delivered to whoever is currently logged in here.
      await supabase
        .from("push_tokens")
        .delete()
        .eq("token", fcmToken)
        .neq("user_id", user.id);

      const { error } = await supabase.from("push_tokens").upsert(
        {
          user_id: user.id,
          token: fcmToken,
          platform: "web",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,token" }
      );

      if (error) {
        console.error("Error saving push token:", error);
      }
    } catch (err) {
      console.error("Error saving push token:", err);
    }
  }, []);

  const getOrRegisterFcmServiceWorker = useCallback(async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    const existing = regs.find((r) => {
      const activeUrl = r.active?.scriptURL ?? r.waiting?.scriptURL ?? r.installing?.scriptURL ?? "";
      return activeUrl.includes("firebase-messaging-sw") || r.scope.includes(FCM_SW_SCOPE);
    });

    if (existing) return existing;

    return navigator.serviceWorker.register(FCM_SW_PATH, {
      scope: FCM_SW_SCOPE,
      updateViaCache: "none",
    });
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
        const cachedToken = localStorage.getItem(FCM_TOKEN_CACHE_KEY);
        if (cachedToken) {
          setToken(cachedToken);
        }

        (async () => {
          try {
            const { initializeApp, getApps } = await import("firebase/app");
            const { getMessaging, getToken } = await import("firebase/messaging");
            const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];
            const messaging = getMessaging(app);
            const fcmRegistration = await getOrRegisterFcmServiceWorker();

            const fcmToken = await getToken(messaging, {
              vapidKey: VAPID_KEY,
              serviceWorkerRegistration: fcmRegistration,
            });

            if (fcmToken) {
              setToken(fcmToken);
              localStorage.setItem(FCM_TOKEN_CACHE_KEY, fcmToken);
              await saveToken(fcmToken);
            }
          } catch (err) {
            console.error("Error recovering FCM token:", err);
          }
        })();
      }
    } else {
      setPermission("unsupported");
    }
  }, [getOrRegisterFcmServiceWorker, saveToken]);

  useEffect(() => {
    if (!token) return;

    const syncTokenWhenAuthenticated = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await saveToken(token);
      }
    };

    syncTokenWhenAuthenticated();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        // Detach the FCM token from the user that just logged out so the next
        // user on this browser does not keep receiving their push notifications.
        try {
          await supabase.from("push_tokens").delete().eq("token", token);
        } catch (err) {
          console.error("Error removing push token on sign out:", err);
        }
        try {
          localStorage.removeItem(FCM_TOKEN_CACHE_KEY);
        } catch {
          /* noop */
        }
        return;
      }
      if (session?.user?.id) {
        await saveToken(token);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [token, saveToken]);

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
      const registration = await getOrRegisterFcmServiceWorker();

      // Get FCM token
      const fcmToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (fcmToken) {
        setToken(fcmToken);
        localStorage.setItem(FCM_TOKEN_CACHE_KEY, fcmToken);
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
  }, [getOrRegisterFcmServiceWorker, isSupported, saveToken]);

  const disablePush = useCallback(async () => {
    await removeToken();
    setToken(null);
    localStorage.removeItem(FCM_TOKEN_CACHE_KEY);
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
