import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        // Ignore firebase messaging SW — it's not a PWA update
        if (newWorker.scriptURL?.includes('firebase-messaging-sw')) return;
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
