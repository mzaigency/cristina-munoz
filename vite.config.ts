import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

function versionJsonPlugin(): Plugin {
  return {
    name: "version-json",
    writeBundle() {
      const version = Date.now().toString(36);
      const content = JSON.stringify({ version, buildTime: new Date().toISOString() });
      fs.writeFileSync(path.resolve(__dirname, "dist/version.json"), content);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-motion": ["motion"],
          "vendor-carousel": ["embla-carousel-react"],
          "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-popover", "@radix-ui/react-select"],
          "vendor-query": ["@tanstack/react-query"],
        },
      },
    },
    target: "esnext",
    minify: "esbuild",
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    versionJsonPlugin(),
      registerType: "prompt",
      injectRegister: "script-defer",
      devOptions: {
        enabled: false,
      },
      includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "GlowApp",
        short_name: "GlowApp",
        description: "La red social de belleza. Descubre salones, reserva citas y conecta con profesionales.",
        theme_color: "#22408b",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/favicon.ico",
            type: "image/x-icon",
            sizes: "16x16 32x32",
          },
          {
            src: "/icon-192.png",
            type: "image/png",
            sizes: "192x192",
          },
          {
            src: "/icon-512.png",
            type: "image/png",
            sizes: "512x512",
          },
          {
            src: "/icon-192-maskable.png",
            type: "image/png",
            sizes: "192x192",
            purpose: "maskable",
          },
          {
            src: "/icon-512-maskable.png",
            type: "image/png",
            sizes: "512x512",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      globIgnores: ["**/firebase-messaging-sw.js"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: "/offline.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/~oauth/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "static-resources",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
