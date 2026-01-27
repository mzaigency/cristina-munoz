

# Plan: Cambiar URLs de Salones a `glowapp.app/{slug}`

## Objetivo

Cambiar la estructura de URLs de los salones de `/salon/{slug}` a `/{slug}` para tener URLs más limpias y memorables. Por ejemplo:
- **Antes**: `glowapp.app/salon/cristina-munoz`
- **Después**: `glowapp.app/cristina-munoz`

Esto es beneficioso tanto para SEO como para compartir y recordar URLs fácilmente.

---

## Estrategia de Implementación

Para evitar conflictos entre las rutas de la app y los slugs de los salones, implementaremos un sistema inteligente:

1. **Rutas reservadas primero**: Las rutas fijas de la app tienen prioridad
2. **Catch-all para salones**: Todo lo que no coincida con rutas fijas se trata como slug de salón
3. **Validación en base de datos**: Si el slug no existe, se redirige a 404

---

## Cambios Requeridos

### 1. Modificar Rutas (App.tsx)

Reorganizar las rutas para poner todas las rutas fijas primero y usar `/:slug` como catch-all al final:

```tsx
<Routes>
  {/* Rutas fijas (tienen prioridad) */}
  <Route path="/" element={<Index />} />
  <Route path="/auth" element={<Auth />} />
  <Route path="/admin" element={<Admin />} />
  <Route path="/admin/:adminSlug" element={<TenantAdmin />} />
  <Route path="/superadmin" element={<SuperAdmin />} />
  <Route path="/mis-citas" element={<MyBookings />} />
  <Route path="/perfil" element={<Profile />} />
  <Route path="/valoracion" element={<Review />} />
  <Route path="/mensajes" element={<Messages />} />
  <Route path="/onboarding" element={<BusinessOnboarding />} />
  <Route path="/onboarding/setup" element={<OnboardingSetup />} />
  <Route path="/para-negocios" element={<ForBusiness />} />
  <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
  <Route path="/nueva-contrasena" element={<ResetPassword />} />
  <Route path="/verify-email" element={<VerifyEmail />} />
  <Route path="/privacidad" element={<PrivacyPolicy />} />
  <Route path="/terminos" element={<TermsOfUse />} />
  
  {/* Catch-all para salones - DEBE IR AL FINAL */}
  <Route path="/:slug" element={<TenantLanding />} />
  
  {/* 404 para rutas que no coinciden */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

### 2. Actualizar Referencias en Todo el Código

Archivos a modificar (13 archivos, ~75 referencias):

| Archivo | Cambio |
|---------|--------|
| `src/components/feed/SalonCard.tsx` | `/salon/${slug}` → `/${slug}` |
| `src/components/feed/PremiumSalonCard.tsx` | `/salon/${slug}` → `/${slug}` |
| `src/components/feed/AISearchBar.tsx` | `/salon/${slug}` → `/${slug}` |
| `src/components/feed/StoriesCarousel.tsx` | `/salon/${slug}` → `/${slug}` |
| `src/components/admin/TenantSettings.tsx` | `/salon/${slug}` → `/${slug}` |
| `src/pages/TenantLanding.tsx` | Canonical URL y breadcrumbs |
| `src/pages/TenantAdmin.tsx` | Link a landing |
| `src/pages/OnboardingSetup.tsx` | Redirección post-setup |
| `src/pages/MyBookings.tsx` | Link a valorar |
| `src/components/superadmin/TenantsManager.tsx` | Abrir landing |
| `src/components/business-landing/FeaturesShowcase.tsx` | Texto promocional |
| `supabase/functions/provision-tenant-admin/index.ts` | Email de bienvenida |

### 3. Actualizar SEO y Sitemap

**TenantLanding.tsx:**
```tsx
<SEO
  canonicalUrl={`/${tenant.slug}`}
  breadcrumbs={[
    { name: "Inicio", url: "/" },
    { name: businessLabel, url: `/?category=${businessType || 'all'}` },
    { name: tenant.name, url: `/${tenant.slug}` }
  ]}
/>
```

**FeaturesShowcase.tsx (texto promocional):**
```tsx
benefits: ["Dominio personalizado (glowapp.app/tunombre)", ...]
```

### 4. Actualizar Sitemap y Robots.txt

**public/sitemap.xml** - Añadir los salones con la nueva estructura:
```xml
<url>
  <loc>https://www.glowapp.app/cristina-munoz</loc>
  <priority>0.8</priority>
</url>
```

**public/robots.txt** - Actualizar reglas:
```text
# Antes: Disallow: /salon/
# Ahora las URLs de salón están en raíz, permitir todo excepto rutas privadas
```

### 5. Redirección de URLs Antiguas (Opcional pero Recomendado)

Crear un redirect en `vercel.json` para mantener compatibilidad con URLs antiguas:

```json
{
  "redirects": [
    {
      "source": "/salon/:slug",
      "destination": "/:slug",
      "permanent": true
    }
  ]
}
```

---

## Consideraciones de Conflictos

Para evitar conflictos entre slugs de salón y rutas de la app:

**Lista de rutas reservadas que NO pueden usarse como slug:**
- `auth`, `admin`, `superadmin`
- `mis-citas`, `perfil`, `valoracion`, `mensajes`
- `onboarding`, `para-negocios`
- `recuperar-contrasena`, `nueva-contrasena`, `verify-email`
- `privacidad`, `terminos`

Si un negocio intenta usar uno de estos slugs, el sistema debería rechazarlo durante el onboarding.

---

## Flujo de Resolución de URLs

```text
Usuario visita: glowapp.app/cristina-munoz

1. React Router verifica rutas fijas → No coincide
2. Ruta /:slug captura "cristina-munoz"  
3. TenantLanding consulta base de datos
   - Si existe → Muestra landing del salón
   - Si no existe → Redirige a /404
```

---

## Detalles Técnicos

### Cambio en TenantLanding.tsx

La lógica actual ya funciona bien - solo necesitamos asegurar que el parámetro `slug` se obtenga correctamente:

```tsx
const { slug } = useParams<{ slug: string }>();

// La consulta a la base de datos no cambia
const { data: tenantData } = await supabase
  .rpc("get_public_tenant_by_slug", { _slug: slug });
```

### Validación de Slugs Reservados

Añadir validación en el onboarding para evitar conflictos:

```tsx
const RESERVED_SLUGS = [
  'auth', 'admin', 'superadmin', 'mis-citas', 'perfil', 
  'valoracion', 'mensajes', 'onboarding', 'para-negocios',
  'recuperar-contrasena', 'nueva-contrasena', 'verify-email',
  'privacidad', 'terminos', 'api', 'salon'
];

// Validar al crear tenant
if (RESERVED_SLUGS.includes(slug.toLowerCase())) {
  throw new Error("Este nombre no está disponible");
}
```

---

## Archivos Afectados (Resumen)

1. `src/App.tsx` - Reorganizar rutas
2. `src/pages/TenantLanding.tsx` - Actualizar SEO
3. `src/components/feed/SalonCard.tsx` - Links
4. `src/components/feed/PremiumSalonCard.tsx` - Links
5. `src/components/feed/AISearchBar.tsx` - Navegación
6. `src/components/feed/StoriesCarousel.tsx` - Links
7. `src/components/admin/TenantSettings.tsx` - Link externo
8. `src/pages/TenantAdmin.tsx` - Link a landing
9. `src/pages/OnboardingSetup.tsx` - Redirección
10. `src/pages/MyBookings.tsx` - Link a valorar
11. `src/components/superadmin/TenantsManager.tsx` - Abrir landing
12. `src/components/business-landing/FeaturesShowcase.tsx` - Texto
13. `supabase/functions/provision-tenant-admin/index.ts` - Email
14. `public/robots.txt` - Actualizar reglas
15. `vercel.json` - Añadir redirects

---

## Beneficios

- **URLs más limpias**: `glowapp.app/cristina-munoz` vs `glowapp.app/salon/cristina-munoz`
- **Mejor para compartir**: Más cortas y memorables
- **SEO mejorado**: URLs más directas y descriptivas
- **Compatibilidad**: Redirects 301 mantienen los links antiguos funcionando

