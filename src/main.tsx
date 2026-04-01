import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const isFirebaseMessagingWorker = (scriptUrl?: string | null) =>
  !!scriptUrl && scriptUrl.includes("firebase-messaging-sw");

const isAppPwaWorker = (scriptUrl?: string | null) =>
  !!scriptUrl && (scriptUrl.includes("/sw.js") || scriptUrl.includes("workbox"));

// Guard: unregister SW in iframes / preview hosts
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

// Register service worker update handler
if ('serviceWorker' in navigator && !isPreviewHost && !isInIframe) {
  navigator.serviceWorker.ready.then((registration) => {
    const activeScript =
      registration.active?.scriptURL ??
      registration.waiting?.scriptURL ??
      registration.installing?.scriptURL;

    if (!isAppPwaWorker(activeScript)) return;

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        if (isFirebaseMessagingWorker(newWorker.scriptURL)) return;
        if (!isAppPwaWorker(newWorker.scriptURL)) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('swUpdated'));
          }
        });
      }
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
