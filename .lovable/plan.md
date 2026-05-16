## Cambios

### 1. Quitar WhatsApp de Marketing

- `src/components/admin/sections/MarketingSection.tsx`: eliminar la pestaña `whatsapp` del array `tabs`, su `TabsContent`, el import de `WhatsAppKit` y de `MessageCircle`, el fetch de `tenantName` (solo se usaba ahí) y el tipo `MarketingTab` queda como `"posts" | "qr"`.
- `src/components/admin/layout/AdminSubNav.tsx`: quitar el item `whatsapp` de `ADMIN_SUB_NAV.marketing`.
- `src/pages/TenantAdmin.tsx`: quitar `whatsapp` del `LEGACY_NAV_MAP` para que cualquier deep-link viejo redirija a `posts`.
- `WhatsAppKit.tsx` se deja en el repo por si se reutiliza luego.

### 2. Mejorar tarjetas QR — añadir formato A4 imprimible

Hoy el generador solo produce una tarjeta horizontal 1200×800. Añadimos un **selector de formato** con dos opciones, manteniendo todo lo demás (estilos, fuentes, branding):

- **Tarjeta** (actual, horizontal 1200×800, ideal redes/pantalla)
- **Cartel A4** (vertical 2480×3508 @ 300 DPI, ideal imprimir en mostrador)

#### Layout del cartel A4 (vertical)

```text
┌─────────────────────────────────────┐
│                                     │
│            [logo salón 180px]       │
│                                     │
│           RESERVA TU CITA           │   ← H1 grande (≈180-200px)
│                                     │
│          en {Nombre del Salón}      │   ← H2 (≈90px)
│                                     │
│          ──── accent ────           │
│                                     │
│       ┌─────────────────┐           │
│       │                 │           │
│       │                 │           │
│       │       QR        │           │   ← QR 1400px (centrado)
│       │                 │           │
│       │                 │           │
│       └─────────────────┘           │
│                                     │
│      Escanea con tu móvil           │   ← Sub (≈48px)
│                                     │
│     glowapp.app/{slug}              │   ← URL accent (≈50px)
│                                     │
│                                     │
│   ─────────────────────────────     │   ← separador sutil
│                                     │
│   Hecho con [Glowapp Letras.png]    │   ← footer (logo texto h≈80px)
│                                     │
└─────────────────────────────────────┘
```

- Márgenes seguros: 200px por lado (deja sangrado para impresión doméstica).
- Mantiene los 4 estilos actuales (Tu Salón / Elegante / Minimalista / Oscuro) — solo cambia disposición.
- QR con `errorCorrectionLevel: "H"` y tamaño 1400 px para que sea nítido al imprimir y escaneable a >1m.
- Footer: imagen `src/assets/Glowapp Letras.png` cargada como `<img>` (igual patrón que el logo del salón) y dibujada en canvas. Texto "Hecho con" en `sub` color, logo a la derecha, altura ~80px.
- Preview en pantalla: aspect-ratio `210/297` (A4) usando un `<div>` escalado con los mismos estilos del tema; igual que hoy con la versión horizontal.

#### Botones de acción

- **Descargar PNG**: filename `cartel-${slug}-A4.png` o `tarjeta-${slug}.png` según formato.
- **Descargar PDF (solo A4)**: nueva acción usando `jspdf` para generar un PDF A4 con la imagen embedida — facilita imprimir desde cualquier visor. *Si añadir jspdf incrementa el bundle más de lo deseado, se puede omitir y el PNG @ 300 DPI imprime perfecto desde el visor del SO.* Decisión: **omitir jspdf**; el PNG 2480×3508 se imprime perfecto como A4 desde cualquier sistema.
- **Compartir** se mantiene igual.

#### UI del selector de formato

Antes del selector de estilo, un toggle de 2 botones:

```
[ 🖼  Tarjeta ]  [ 📄  Cartel A4 ]
```

Pequeño, mobile-first, mismo patrón que el selector de estilo.

### Archivos

- **Editar**: `src/components/admin/sections/MarketingSection.tsx` (quitar whatsapp).
- **Editar**: `src/components/admin/layout/AdminSubNav.tsx` (quitar whatsapp).
- **Editar**: `src/pages/TenantAdmin.tsx` (LEGACY_NAV_MAP).
- **Editar**: `src/components/admin/content/QRCardGenerator.tsx` (formato A4, carga logo glowapp, preview vertical, branching del render).

### Fuera de alcance

- No tocar `WhatsAppKit.tsx` (queda inactivo pero disponible).
- No añadir nuevos templates de color; reutilizamos los 4 existentes en ambos formatos.
- No generar PDF nativo — el PNG @ 300 DPI cumple para impresión A4.
