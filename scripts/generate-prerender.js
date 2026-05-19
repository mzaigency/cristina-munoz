/**
 * Post-build prerender: generates dist/{slug}/index.html for all active tenants
 * and category pages with SEO meta tags injected into the base Vite HTML.
 *
 * This solves the React SPA indexing problem: Google crawls the static HTML
 * (with correct meta tags, title, description, schema.org) before JS executes.
 * React then hydrates normally on the client side.
 *
 * Run order: npm run build:sitemap && vite build && npm run build:prerender
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");

const SITE_URL = process.env.VITE_SITE_URL || "https://www.glowapp.app";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY;

const CATEGORIES = [
  {
    slug: "peluquerias",
    label: "Peluquerías",
    btId: "peluqueria",
    desc: "Descubre las mejores peluquerías cerca de ti. Reserva cita online al instante para cortes, coloración, mechas y más.",
  },
  {
    slug: "barberias",
    label: "Barberías",
    btId: "barberia",
    desc: "Encuentra barberías cerca de ti. Reserva online para cortes masculinos, afeitado clásico y arreglo de barba.",
  },
  {
    slug: "estetica",
    label: "Centros de Estética",
    btId: "estetica",
    desc: "Centros de estética cerca de ti. Reserva online para limpiezas faciales, tratamientos corporales y rejuvenecimiento.",
  },
  {
    slug: "spa",
    label: "Spas",
    btId: "spa",
    desc: "Spas y centros de bienestar cerca de ti. Reserva online para masajes relajantes, aromaterapia y circuito spa.",
  },
  {
    slug: "unas",
    label: "Centros de Uñas",
    btId: "unas",
    desc: "Centros de uñas cerca de ti. Reserva online para manicura, pedicura, uñas de gel y nail art.",
  },
  {
    slug: "salones-belleza",
    label: "Salones de Belleza",
    btId: "salon_belleza",
    desc: "Salones de belleza cerca de ti. Servicios integrales: maquillaje, tratamientos, depilación, manicura y más.",
  },
  {
    slug: "fisioterapia",
    label: "Fisioterapia",
    btId: "fisioterapia",
    desc: "Centros de fisioterapia cerca de ti. Reserva online para rehabilitación, masaje terapéutico y punción seca.",
  },
];

const BT_TO_CAT = Object.fromEntries(CATEGORIES.map((c) => [c.btId, c]));

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function injectMeta(baseHtml, { title, description, image, url, ldJson }) {
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="GlowApp" />`,
    `<meta property="og:locale" content="es_ES" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `<script type="application/ld+json">${JSON.stringify(ldJson)}</script>`,
  ].join("\n    ");

  // Replace existing <title> block with our full set of tags
  return baseHtml.replace(/<title>[^<]*<\/title>/, tags);
}

function normalizeCity(city) {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-");
}

function prettifyCity(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function writePage(filePath, html) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html, "utf-8");
}

function buildCategoryMeta(cat, citySlug = null) {
  const cityDisplay = citySlug ? prettifyCity(citySlug) : null;
  const url = citySlug
    ? `${SITE_URL}/${cat.slug}/${citySlug}`
    : `${SITE_URL}/${cat.slug}`;
  const title = cityDisplay
    ? `${cat.label} en ${cityDisplay} | GlowApp`
    : `${cat.label} cerca de ti | GlowApp`;
  const description = cityDisplay
    ? `Encuentra y reserva en ${cat.label.toLowerCase()} de ${cityDisplay}. Cita online al instante. Opiniones verificadas. GlowApp.`
    : cat.desc;

  const ldJson = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url,
    publisher: {
      "@type": "Organization",
      name: "GlowApp",
      url: SITE_URL,
    },
  };

  return { title, description, image: `${SITE_URL}/og-image.png`, url, ldJson };
}

function buildTenantMeta(tenant) {
  const name = tenant.name || "Salón";
  const city = tenant.city || "";
  const btLabel = tenant.features?.business_type_label || "Salón de belleza";
  const description =
    tenant.description ||
    tenant.tagline ||
    `Reserva cita en ${name}${city ? ` en ${city}` : ""} online al instante. Servicios de ${btLabel.toLowerCase()}.`;
  const title = city
    ? `${name} - ${btLabel} en ${city} | GlowApp`
    : `${name} - ${btLabel} | GlowApp`;
  const image =
    tenant.hero_image_url ||
    tenant.logo_url ||
    `${SITE_URL}/og-image.png`;
  const url = `${SITE_URL}/${tenant.slug}`;

  const ldJson = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name,
    description,
    url,
    image,
    ...(city && {
      address: {
        "@type": "PostalAddress",
        addressLocality: city,
        addressCountry: "ES",
      },
    }),
    ...(tenant.phone && { telephone: tenant.phone }),
    ...(tenant.address && { streetAddress: tenant.address }),
  };

  return { title, description, image, url, ldJson };
}

async function main() {
  if (!fs.existsSync(DIST)) {
    console.error("[prerender] dist/ not found — run vite build first");
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(path.join(DIST, "index.html"), "utf-8");
  let total = 0;

  // 1. Category root pages
  for (const cat of CATEGORIES) {
    const meta = buildCategoryMeta(cat);
    const html = injectMeta(baseHtml, meta);
    writePage(path.join(DIST, cat.slug, "index.html"), html);
    total++;
  }
  console.log(`[prerender] ${CATEGORIES.length} category root pages`);

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[prerender] Supabase env missing — skipping tenant + city pages");
    console.log(`[prerender] total: ${total} pages`);
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: tenants, error } = await supabase.rpc("get_public_tenants");

  if (error) {
    console.warn("[prerender] Supabase RPC error:", error.message);
    console.log(`[prerender] total: ${total} pages`);
    return;
  }

  // 2. Tenant landing pages
  let tenantCount = 0;
  for (const tenant of tenants || []) {
    if (!tenant.slug) continue;
    const meta = buildTenantMeta(tenant);
    const html = injectMeta(baseHtml, meta);
    writePage(path.join(DIST, tenant.slug, "index.html"), html);
    tenantCount++;
    total++;
  }
  console.log(`[prerender] ${tenantCount} tenant pages`);

  // 3. Category x city pages
  const seen = new Set();
  let cityCount = 0;
  for (const tenant of tenants || []) {
    const bt = tenant.features?.business_type;
    if (!bt || !tenant.city) continue;
    const cat = BT_TO_CAT[bt];
    if (!cat) continue;
    const citySlug = normalizeCity(tenant.city);
    const key = `${cat.slug}/${citySlug}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const meta = buildCategoryMeta(cat, citySlug);
    const html = injectMeta(baseHtml, meta);
    writePage(path.join(DIST, cat.slug, citySlug, "index.html"), html);
    cityCount++;
    total++;
  }
  console.log(`[prerender] ${cityCount} category+city pages`);
  console.log(`[prerender] total: ${total} pages generated`);
}

main().catch((err) => {
  console.error("[prerender] fatal:", err);
  process.exit(1);
});
