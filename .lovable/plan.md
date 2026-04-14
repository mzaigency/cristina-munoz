

# Plan: Auto-actualización en iOS + Actualizar logo PWA

## Problema
En iOS, las PWAs no soportan Service Workers de la misma manera que Android/Chrome. Safari no dispara eventos `updatefound` ni `controllerchange` de forma fiable, por lo que el `UpdatePrompt` actual no funciona en iOS. Además, iOS cachea agresivamente los assets de la PWA (incluidos iconos).

## Solución

### 1. Sistema de versionado con auto-refresh para iOS
Crear un mecanismo de detección de versión que funcione sin depender del Service Worker:

- **Añadir un archivo `public/version.json`** con un hash/timestamp de la build actual
- **Crear un hook `useAppVersion`** que al abrir la app (y en cada `visibilitychange`) haga fetch a `/version.json?t=timestamp` (sin cache) y compare con la versión guardada en `localStorage`
- Si hay nueva versión → mostrar aviso o recargar automáticamente
- Esto funciona en iOS Safari, tanto en navegador como en modo standalone

### 2. Mejorar `UpdatePrompt.tsx`
- Integrar el nuevo hook de versión además del listener de SW existente
- Detectar iOS: si es iOS en modo standalone, hacer auto-reload silencioso (ya que el usuario no puede "actualizar" manualmente fácil)
- Si es iOS en navegador, mostrar el banner de actualización

### 3. Actualizar `vite.config.ts`
- Añadir un plugin inline que genere `version.json` en cada build con un hash único
- Actualizar `theme_color` del manifest de `#4361ee` a `#22408b` (nuevo color de marca)

### 4. Actualizar iconos PWA
Los iconos en `public/` (`icon-192.png`, `icon-512.png`, `icon-192-maskable.png`, `icon-512-maskable.png`, `apple-touch-icon.png`, `favicon.png`, `favicon.ico`) ya fueron actualizados previamente con los nuevos assets del zip. Si necesitan regenerarse, se sobreescribirán con los archivos correctos del zip subido.

## Archivos a modificar/crear
- **Crear**: `public/version.json`
- **Crear**: `src/hooks/useAppVersion.ts`
- **Modificar**: `src/components/pwa/UpdatePrompt.tsx` — integrar detección de versión + lógica iOS
- **Modificar**: `vite.config.ts` — plugin para generar version.json + actualizar theme_color
- **Modificar**: `src/App.tsx` — asegurar que UpdatePrompt está montado

## Detalle técnico: useAppVersion
```typescript
// Cada 30s (y en visibilitychange) hace fetch a /version.json
// Compara con localStorage('app-version')
// Si difiere → dispara callback o auto-reload
```

## Detalle técnico: iOS standalone auto-reload
En iOS standalone, no hay barra de navegación para recargar. El sistema detectará versión nueva y hará `window.location.reload()` automáticamente cuando el usuario vuelva a la app (visibilitychange → visible).

