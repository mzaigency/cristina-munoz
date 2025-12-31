import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker update handler
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, dispatch event
            window.dispatchEvent(new CustomEvent('swUpdated'));
          }
        });
      }
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
