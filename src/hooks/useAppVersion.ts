import { useEffect, useRef, useState, useCallback } from "react";

const VERSION_KEY = "app-version";
const PENDING_VERSION_KEY = `${VERSION_KEY}-pending`;
const DISMISSED_VERSION_KEY = `${VERSION_KEY}-dismissed`;
const CHECK_INTERVAL = 30_000; // 30s

function isIOSStandalone(): boolean {
  return (
    ("standalone" in navigator && (navigator as any).standalone === true) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

function isIOS(): boolean {
  return /iP(hone|od|ad)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function useAppVersion() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const checking = useRef(false);

  const checkVersion = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;

    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return;

      const data = await res.json();
      const serverVersion = data.version || data.buildTime;

      if (!serverVersion) return;

      const localVersion = localStorage.getItem(VERSION_KEY);
      const dismissedVersion = localStorage.getItem(DISMISSED_VERSION_KEY);

      if (!localVersion) {
        // First visit — store current version
        localStorage.setItem(VERSION_KEY, serverVersion);
        localStorage.removeItem(PENDING_VERSION_KEY);
        localStorage.removeItem(DISMISSED_VERSION_KEY);
        return;
      }

      if (serverVersion === localVersion) {
        setUpdateAvailable(false);
        localStorage.removeItem(PENDING_VERSION_KEY);
        localStorage.removeItem(DISMISSED_VERSION_KEY);
        return;
      }

      if (serverVersion !== localVersion) {
        localStorage.setItem(PENDING_VERSION_KEY, serverVersion);

        // New version detected
        if (isIOS() && isIOSStandalone()) {
          // iOS standalone: auto-reload silently
          localStorage.setItem(VERSION_KEY, serverVersion);
          localStorage.removeItem(PENDING_VERSION_KEY);
          localStorage.removeItem(DISMISSED_VERSION_KEY);
          window.location.reload();
          return;
        }

        if (dismissedVersion === serverVersion) {
          setUpdateAvailable(false);
          return;
        }

        setUpdateAvailable(true);
      }
    } catch {
      // Network error — ignore
    } finally {
      checking.current = false;
    }
  }, []);

  const acceptUpdate = useCallback(() => {
    try {
      const serverVersion = localStorage.getItem(PENDING_VERSION_KEY);
      if (serverVersion) localStorage.setItem(VERSION_KEY, serverVersion);
      localStorage.removeItem(PENDING_VERSION_KEY);
      localStorage.removeItem(DISMISSED_VERSION_KEY);
    } catch {}
    window.location.reload();
  }, []);

  const dismissUpdate = useCallback(() => {
    try {
      const serverVersion = localStorage.getItem(PENDING_VERSION_KEY);
      if (serverVersion) localStorage.setItem(DISMISSED_VERSION_KEY, serverVersion);
    } catch {}
    setUpdateAvailable(false);
  }, []);

  useEffect(() => {
    // Initial check after short delay
    const timeout = setTimeout(checkVersion, 3000);

    // Periodic check
    const interval = setInterval(checkVersion, CHECK_INTERVAL);

    // Check on visibility change (user comes back to app)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkVersion();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [checkVersion]);

  return { updateAvailable, acceptUpdate, dismissUpdate };
}
