

# Plan Maestro SEO — GlowApp

## Objetivo
Que GlowApp aparezca en Google para cualquier busqueda de belleza en Espana: tanto genericas ("peluqueria cerca de mi") como locales ("peluqueria santpedor") como por nombre de salon ("Cristina Munoz peluqueria").

## Estado actual
- Structured data en `index.html`: WebApplication, Organization, WebSite+SearchAction — bien
- SEO dinamico por salon en `TenantLanding.tsx` con LocalBusiness schema — basico
- Sitemap dinamico con edge function — solo salones individuales + paginas estaticas
- robots.txt bien configurado
- Solo hay 1 tenant activo: Cristina Munoz (Santpedor, peluqueria)

## Problema
No existen paginas indexables de categoria/ciudad. Si buscas "peluqueria santpedor", Google no tiene una pagina de GlowApp que responda a eso. Solo existe `/cristina-munoz` que puede no asociarse con la busqueda.

---

## Cambios

### 1. Nueva pagina: `src/pages/DirectoryLanding.tsx`

Componente que sirve como directorio SEO. Recibe `category` y opcionalmente `city` de la URL.

- Mapea slugs URL a `business_type` en BD: `peluquerias` → `peluqueria`, `barberias` → `barberia`, `estetica` → `estetica`, `spa` → `spa`, `unas` → `unas`
- Fetch tenants activos filtrando por `features->>'business_type'` y opcionalmente por `city` (case-insensitive, normalizado sin tildes)
- H1 dinamico optimizado: "Peluquerias en Santpedor - Reserva Online | GlowApp"
- Meta description unica por combinacion categoria+ciudad
- Schema `CollectionPage` + `ItemList` con cada salon como `ListItem`
- Listado de salones con card (nombre, ciudad, valoracion, link a `/{slug}`)
- Si no hay resultados: mensaje amable + CTA para registrar salon
- Mobile-first, safe areas respetadas
- Links internos: cada salon enlaza a `/{slug}`, breadcrumbs de navegacion

### 2. Actualizar `src/App.tsx` — Nuevas rutas

Anadir ANTES del catch-all `/:slug`:
```text
/peluquerias            → DirectoryLanding (category="peluquerias")
/peluquerias/:city      → DirectoryLanding (category="peluquerias", city param)
/barberias              → DirectoryLanding
/barberias/:city        → DirectoryLanding
/estetica               → DirectoryLanding
/estetica/:city         → DirectoryLanding
/spa                    → DirectoryLanding
/spa/:city              → DirectoryLanding
/unas                   → DirectoryLanding
/unas/:city             → DirectoryLanding
```

### 3. Actualizar `src/components/SEO.tsx`

Anadir soporte para nuevos schemas:
- `itemList` prop — genera `CollectionPage` + `ItemList` structured data
- Cada item incluye `name`, `url`, `image`, `position`

### 4. Mejorar structured data en `src/pages/TenantLanding.tsx`

Pasar de un schema `LocalBusiness` basico a uno completo:
- `hasOfferCatalog` con servicios reales del salon (fetch de tabla `services`)
- Top 3 reviews individuales como schema `Review` (no solo aggregateRating)
- `openingHoursSpecification` con horarios reales de `business_hours`
- `sameAs` con redes sociales del salon (instagram, facebook, tiktok)
- `hasMap` con `google_maps_url` del salon

### 5. Actualizar `supabase/functions/generate-sitemap/index.ts`

Fetch adicional: ciudades unicas agrupadas por business_type de tenants activos.

Generar URLs de directorio dinamicamente:
```text
/peluquerias              (si hay >= 1 peluqueria)
/peluquerias/santpedor    (si hay peluqueria en Santpedor)
/barberias                (si hay >= 1 barberia)
... etc
```

Query: `SELECT DISTINCT lower(city) as city, features->>'business_type' as type FROM tenants WHERE is_active = true AND city IS NOT NULL`

Prioridades sitemap:
- `/` → 1.0
- `/peluquerias`, `/barberias`... → 0.9
- `/peluquerias/santpedor`... → 0.85
- `/{salon-slug}` → 0.8

Anadir `<image:image>` con `logo_url` de cada salon en sus URLs individuales.

### 6. Actualizar `index.html`

Anadir schema `SoftwareApplication` apuntando a Play Store (cuando este disponible) para reforzar presencia de marca en busquedas de "GlowApp".

### 7. Actualizar `public/robots.txt`

Las nuevas rutas de directorio ya estan permitidas por defecto (no hay Disallow para `/peluquerias`, etc.). No se necesitan cambios, pero verificaremos.

---

## Archivos

| Archivo | Accion |
|---|---|
| `src/pages/DirectoryLanding.tsx` | Crear — directorio SEO dinamico |
| `src/App.tsx` | Anadir 10 rutas de directorio |
| `src/components/SEO.tsx` | Anadir soporte ItemList/CollectionPage |
| `src/pages/TenantLanding.tsx` | Mejorar structured data (servicios, reviews, horarios, redes) |
| `supabase/functions/generate-sitemap/index.ts` | Generar URLs de directorio + imagenes |
| `index.html` | Anadir SoftwareApplication schema |

## Resultado esperado

- "peluqueria santpedor" → `glowapp.app/peluquerias/santpedor` con link a Cristina Munoz
- "peluquerias cerca de mi" → `glowapp.app/peluquerias` con listado
- "Cristina Munoz peluqueria" → `glowapp.app/cristina-munoz` con rich snippet (estrellas, horario, servicios)
- "reservar peluqueria online" → `glowapp.app` con sitelinks
- Cada nuevo salon registrado aparece automaticamente en su directorio de ciudad sin tocar codigo

