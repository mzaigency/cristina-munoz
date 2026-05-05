import { useEffect, useRef, useState, useCallback } from "react";

const VERSION_KEY = "app-version";
const PENDING_VERSION_KEY = `${VERSION_KEY}-pending`;
const DISMISSED_VERSION_KEY = `${VERSION_KEY}-dismissed`;
const DISMISSED_AT_KEY = `${VERSION_KEY}-dismissed-at`;
const CHECK_INTERVAL = 5 * 60_000; // 5 min
const DISMISS_COOLDOWN = 6 * 60 * 60_000; // 6h

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

      if (!localVersion) {
        localStorage.setItem(VERSION_KEY, serverVersion);
        localStorage.removeItem(PENDING_VERSION_KEY);
        localStorage.removeItem(DISMISSED_VERSION_KEY);
        localStorage.removeItem(DISMISSED_AT_KEY);
        return;
      }

      if (serverVersion === localVersion) {
        setUpdateAvailable(false);
        localStorage.removeItem(PENDING_VERSION_KEY);
        localStorage.removeItem(DISMISSED_VERSION_KEY);
        localStorage.removeItem(DISMISSED_AT_KEY);
        return;
      }

      // Nueva versión detectada
      localStorage.setItem(PENDING_VERSION_KEY, serverVersion);

      if (isIOS() && isIOSStandalone()) {
        localStorage.setItem(VERSION_KEY, serverVersion);
        localStorage.removeItem(PENDING_VERSION_KEY);
        localStorage.removeItem(DISMISSED_VERSION_KEY);
        localStorage.removeItem(DISMISSED_AT_KEY);
        window.location.reload();
        return;
      }

      // Cooldown: si ya descartó esta misma versión hace menos de 6h, no mostrar
      const dismissedVersion = localStorage.getItem(DISMISSED_VERSION_KEY);
      const dismissedAt = parseInt(localStorage.getItem(DISMISSED_AT_KEY) || "0", 10);
      if (
        dismissedVersion === serverVersion &&
        dismissedAt &&
        Date.now() - dismissedAt < DISMISS_COOLDOWN
      ) {
        setUpdateAvailable(false);
        return;
      }

      setUpdateAvailable(true);
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
      localStorage.removeItem(DISMISSED_AT_KEY);
    } catch {}
    window.location.reload();
  }, []);

  const dismissUpdate = useCallback(() => {
    try {
      const serverVersion = localStorage.getItem(PENDING_VERSION_KEY);
      if (serverVersion) {
        localStorage.setItem(DISMISSED_VERSION_KEY, serverVersion);
        localStorage.setItem(DISMISSED_AT_KEY, Date.now().toString());
      }
    } catch {}
    setUpdateAvailable(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(checkVersion, 5000);
    const interval = setInterval(checkVersion, CHECK_INTERVAL);

    // Solo chequear al volver a foco si pasaron >5 min desde el último check
    let lastCheck = Date.now();
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && Date.now() - lastCheck > CHECK_INTERVAL) {
        lastCheck = Date.now();
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
