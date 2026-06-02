import { useEffect, useRef, useCallback } from "react";

/**
 * Auto-update silencioso.
 * - Detecta nueva versión vía /version.json.
 * - Recarga automáticamente cuando el usuario no está mirando (pestaña oculta)
 *   o lleva inactivo más de IDLE_RELOAD_MS sin interactuar.
 * - Nunca muestra prompt visible. Tras recargar, deja un flag en sessionStorage
 *   que el caller puede usar para enseñar un toast discreto.
 */

const VERSION_KEY = "app-version";
const JUST_UPDATED_KEY = "glowapp_just_updated";
const CHECK_INTERVAL = 5 * 60_000; // 5 min
const IDLE_RELOAD_MS = 60_000; // 60s sin interactuar → recarga
const REFOCUS_GRACE_MS = 2 * 60_000; // si volvió a la pestaña hace <2min, no recargar de golpe

async function clearAppCaches() {
  if (!("caches" in window)) return;
  const names = await caches.keys();
  await Promise.all(
    names
      .filter((name) =>
        ["workbox-precache", "static-resources", "html-cache", "images-cache"].some((prefix) =>
          name.includes(prefix),
        ),
      )
      .map((name) => caches.delete(name)),
  );
}

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
  const checking = useRef(false);
  const pendingVersion = useRef<string | null>(null);
  const reloadingFromServiceWorker = useRef(false);
  const lastInteraction = useRef<number>(Date.now());
  const lastVisible = useRef<number>(Date.now());
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshServiceWorker = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return;

    const activate = (worker?: ServiceWorker | null) => worker?.postMessage({ type: "SKIP_WAITING" });
    if (registration.waiting) {
      activate(registration.waiting);
      return;
    }

    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) activate(worker);
      });
    });

    await registration.update();
  }, []);

  const performReload = useCallback(async () => {
    const v = pendingVersion.current;
    if (!v) return;
    try {
      localStorage.setItem(VERSION_KEY, v);
      sessionStorage.setItem(JUST_UPDATED_KEY, "1");
      await clearAppCaches();
    } catch {}
    window.location.reload();
  }, []);

  const scheduleSilentReload = useCallback(() => {
    // Si la pestaña ya está oculta, recarga inmediata (no molesta a nadie).
    if (document.visibilityState === "hidden") {
      performReload();
      return;
    }
    // Si está visible: programa recarga cuando esté idle IDLE_RELOAD_MS.
    if (idleTimer.current) clearTimeout(idleTimer.current);
    const tick = () => {
      const idleFor = Date.now() - lastInteraction.current;
      const visibleFor = Date.now() - lastVisible.current;
      if (
        document.visibilityState === "hidden" ||
        (idleFor >= IDLE_RELOAD_MS && visibleFor >= REFOCUS_GRACE_MS)
      ) {
        performReload();
        return;
      }
      const remaining = Math.max(5_000, IDLE_RELOAD_MS - idleFor);
      idleTimer.current = setTimeout(tick, remaining);
    };
    idleTimer.current = setTimeout(tick, IDLE_RELOAD_MS);
  }, [performReload]);

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
        return;
      }

      if (serverVersion === localVersion) return;

      // Nueva versión real
      pendingVersion.current = serverVersion;
      await refreshServiceWorker();

      // PWA iOS standalone: recarga directa, ya estaba así
      if (isIOS() && isIOSStandalone()) {
        performReload();
        return;
      }

      scheduleSilentReload();
    } catch {
      // ignore network
    } finally {
      checking.current = false;
    }
  }, [performReload, refreshServiceWorker, scheduleSilentReload]);

  useEffect(() => {
    const bumpInteraction = () => {
      lastInteraction.current = Date.now();
    };
    const events: (keyof WindowEventMap)[] = ["mousemove", "touchstart", "keydown", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, bumpInteraction, { passive: true }));

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        lastVisible.current = Date.now();
        lastInteraction.current = Date.now();
        // Re-chequear si han pasado >5min
        checkVersion();
      } else if (pendingVersion.current) {
        // Oculto y hay update pendiente → recarga ya
        performReload();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const handleControllerChange = () => {
      if (reloadingFromServiceWorker.current) return;
      reloadingFromServiceWorker.current = true;
      try {
        sessionStorage.setItem(JUST_UPDATED_KEY, "1");
      } catch {}
      window.location.reload();
    };

    navigator.serviceWorker?.addEventListener("controllerchange", handleControllerChange);

    const swInitial = setTimeout(() => void refreshServiceWorker(), 1_500);
    const initial = setTimeout(checkVersion, 5_000);
    const interval = setInterval(checkVersion, CHECK_INTERVAL);

    return () => {
      events.forEach((e) => window.removeEventListener(e, bumpInteraction));
      document.removeEventListener("visibilitychange", handleVisibility);
      navigator.serviceWorker?.removeEventListener("controllerchange", handleControllerChange);
      clearTimeout(swInitial);
      clearTimeout(initial);
      clearInterval(interval);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [checkVersion, performReload, refreshServiceWorker]);

  // API legacy mantenida (no se usa) por si algún consumidor sobrevive
  return {
    updateAvailable: false,
    acceptUpdate: () => {},
    dismissUpdate: () => {},
  };
}

/** Llamar al boot para mostrar toast post-actualización si procede. */
export function consumeJustUpdatedFlag(): boolean {
  try {
    if (sessionStorage.getItem(JUST_UPDATED_KEY) === "1") {
      sessionStorage.removeItem(JUST_UPDATED_KEY);
      return true;
    }
  } catch {}
  return false;
}
