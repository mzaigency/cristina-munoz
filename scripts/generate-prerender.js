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

function injectMeta(baseHtml, { title, description, image, url, ldJson }, bodyContent = "") {
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
  let html = baseHtml.replace(/<title>[^<]*<\/title>/, tags);

  // Inject visible SEO content inside <div id="root"> for crawlers.
  // React wipes #root contents during hydration, so users never see this — only Googlebot does on initial fetch.
  if (bodyContent) {
    html = html.replace(
      /<div id="root">\s*<\/div>/,
      `<div id="root"><div data-seo-prerender style="position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;">${bodyContent}</div></div>`,
    );
  }

  return html;
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

const DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_NAMES_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function buildTenantMeta(tenant, extras = {}) {
  const { services = [], reviewStats = null, hours = [] } = extras;
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

  const openingHoursSpec = hours
    .filter((h) => h.is_open && h.open_time && h.close_time)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAY_NAMES_EN[h.day_of_week],
      opens: h.open_time,
      closes: h.close_time,
    }));

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
        ...(tenant.address && { streetAddress: tenant.address }),
        addressLocality: city,
        ...(tenant.postal_code && { postalCode: tenant.postal_code }),
        addressCountry: tenant.country || "ES",
      },
    }),
    ...(tenant.phone && { telephone: tenant.phone }),
    ...(tenant.email && { email: tenant.email }),
    ...(services.length > 0 && {
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Servicios",
        itemListElement: services.map((s) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: s.name },
          ...(s.price != null && { price: s.price, priceCurrency: "EUR" }),
        })),
      },
    }),
    ...(reviewStats && reviewStats.count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: reviewStats.avg,
        reviewCount: reviewStats.count,
        bestRating: 5,
      },
    }),
    ...(openingHoursSpec.length > 0 && { openingHoursSpecification: openingHoursSpec }),
    ...(tenant.google_maps_url && { hasMap: tenant.google_maps_url }),
    sameAs: [tenant.instagram_url, tenant.facebook_url, tenant.tiktok_url].filter(Boolean),
  };

  return { title, description, image, url, ldJson };
}

function buildTenantBody(tenant, extras = {}) {
  const { services = [], reviewStats = null, hours = [] } = extras;
  const name = escapeHtml(tenant.name || "Salón");
  const city = tenant.city || "";
  const btLabel = tenant.features?.business_type_label || "Salón de belleza";
  const headline = city
    ? `${name} — ${escapeHtml(btLabel)} en ${escapeHtml(city)}`
    : `${name} — ${escapeHtml(btLabel)}`;
  const description = escapeHtml(
    tenant.description ||
      tenant.tagline ||
      `${btLabel} profesional${city ? ` en ${city}` : ""}. Reserva tu cita online al instante.`,
  );

  const bt = tenant.features?.business_type;
  const catSlug = bt ? BT_TO_CAT[bt]?.slug : null;
  const breadcrumb = `
    <nav aria-label="Migas de pan">
      <ol>
        <li><a href="/">GlowApp</a></li>
        ${catSlug ? `<li><a href="/${catSlug}">${escapeHtml(btLabel)}</a></li>` : ""}
        <li>${name}</li>
      </ol>
    </nav>`;

  const servicesHtml = services.length
    ? `<section><h2>Servicios de ${name}</h2><ul>${services
        .slice(0, 20)
        .map((s) => `<li>${escapeHtml(s.name)}${s.price != null ? ` — ${s.price} €` : ""}</li>`)
        .join("")}</ul></section>`
    : "";

  const hoursHtml = hours.filter((h) => h.is_open).length
    ? `<section><h2>Horario</h2><ul>${hours
        .map((h) =>
          h.is_open && h.open_time && h.close_time
            ? `<li>${DAY_NAMES_ES[h.day_of_week]}: ${h.open_time} – ${h.close_time}</li>`
            : `<li>${DAY_NAMES_ES[h.day_of_week]}: Cerrado</li>`,
        )
        .join("")}</ul></section>`
    : "";

  const contactHtml = `
    <section>
      <h2>Cómo reservar en ${name}</h2>
      <p>Reserva tu cita online en ${name} en menos de 30 segundos. Elige servicio, profesional y horario disponible, y recibe la confirmación al instante.</p>
      ${tenant.address ? `<p><strong>Dirección:</strong> ${escapeHtml(tenant.address)}${city ? `, ${escapeHtml(city)}` : ""}${tenant.postal_code ? ` (${escapeHtml(tenant.postal_code)})` : ""}</p>` : ""}
      ${tenant.phone ? `<p><strong>Teléfono:</strong> <a href="tel:${escapeHtml(tenant.phone)}">${escapeHtml(tenant.phone)}</a></p>` : ""}
      ${tenant.email ? `<p><strong>Email:</strong> <a href="mailto:${escapeHtml(tenant.email)}">${escapeHtml(tenant.email)}</a></p>` : ""}
    </section>`;

  const ratingHtml = reviewStats && reviewStats.count > 0
    ? `<section><h2>Valoraciones de clientes</h2><p>${name} tiene una valoración media de <strong>${reviewStats.avg} / 5</strong> basada en ${reviewStats.count} opiniones verificadas.</p></section>`
    : "";

  const faqHtml = `
    <section>
      <h2>Preguntas frecuentes</h2>
      <h3>¿Cómo reservo cita en ${name}?</h3>
      <p>Selecciona el servicio que necesitas, elige fecha y hora, y confirma. Recibirás un recordatorio automático.</p>
      <h3>¿Puedo cancelar o cambiar la cita?</h3>
      <p>Sí, puedes gestionar tu cita desde tu perfil o el enlace del email de confirmación.</p>
      <h3>¿Dónde está ${name}?</h3>
      <p>${tenant.address ? `${escapeHtml(tenant.address)}, ` : ""}${city ? escapeHtml(city) : "Consulta la ubicación en la página de reserva"}.</p>
    </section>`;

  return `
    <header>
      ${breadcrumb}
      <h1>${headline}</h1>
      <p>${description}</p>
      <p><a href="#reserva">Reservar cita online</a></p>
    </header>
    ${servicesHtml}
    ${contactHtml}
    ${hoursHtml}
    ${ratingHtml}
    ${faqHtml}
  `.replace(/\s+/g, " ").trim();
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

  // 1b. Static SEO landings (competitor comparisons + blog)
  const STATIC_LANDINGS = [
    {
      path: "alternativa-a-booksy",
      title: "Alternativa a Booksy en España | Glowapp",
      description: "Glowapp es la alternativa a Booksy para salones que quieren ser dueños de su cliente: sin comisión por reserva, primer mes gratis y soporte en español.",
      type: "WebPage",
    },
    {
      path: "alternativa-a-treatwell",
      title: "Alternativa a Treatwell en España | Glowapp",
      description: "Cambia Treatwell por Glowapp: 0% de comisión por reserva, tu web profesional con dominio propio y soporte humano en español. Primer mes gratis.",
      type: "WebPage",
    },
    {
      path: "alternativa-a-fresha",
      title: "Alternativa a Fresha en España | Glowapp",
      description: "Glowapp es la alternativa transparente a Fresha: precio plano en euros, sin comisiones por cobro, web propia y soporte en español. Primer mes gratis.",
      type: "WebPage",
    },
    {
      path: "blog",
      title: "Blog Glowapp | Recursos para salones de belleza",
      description: "Guías, comparativas y consejos prácticos para digitalizar tu peluquería, barbería o centro de estética en España.",
      type: "Blog",
    },
    {
      path: "blog/como-digitalizar-tu-peluqueria-en-2026",
      title: "Cómo digitalizar tu peluquería en 2026 | Blog Glowapp",
      description: "Guía completa para digitalizar una peluquería en España: reservas online, agenda, caja, fichas de cliente y marketing en WhatsApp. Sin tecnicismos.",
      type: "Article",
      datePublished: "2026-06-10",
    },
    {
      path: "blog/mejor-software-reservas-salon-belleza-espana",
      title: "Mejor software de reservas para salones en España (2026) | Glowapp",
      description: "Comparativa honesta de plataformas de reservas para salones en España: Booksy, Treatwell, Fresha y Glowapp. Precios reales, comisiones y casos de uso.",
      type: "Article",
      datePublished: "2026-06-08",
    },
    {
      path: "blog/como-reducir-ausencias-citas-salon",
      title: "Cómo reducir las ausencias en tu salón de belleza | Glowapp",
      description: "5 tácticas probadas para reducir las ausencias y citas perdidas en tu salón: recordatorios por WhatsApp, depósitos, lista de espera y políticas claras.",
      type: "Article",
      datePublished: "2026-06-05",
    },
  ];

  for (const page of STATIC_LANDINGS) {
    const url = `${SITE_URL}/${page.path}`;
    const ldJson = {
      "@context": "https://schema.org",
      "@type": page.type,
      name: page.title,
      headline: page.title,
      description: page.description,
      url,
      ...(page.datePublished && {
        datePublished: page.datePublished,
        dateModified: page.datePublished,
        author: { "@type": "Organization", name: "Glowapp" },
      }),
      publisher: { "@type": "Organization", name: "Glowapp", url: SITE_URL },
    };
    const meta = {
      title: page.title,
      description: page.description,
      image: `${SITE_URL}/og-image.png`,
      url,
      ldJson,
    };
    const body = `<h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.description)}</p>`;
    const html = injectMeta(baseHtml, meta, body);
    writePage(path.join(DIST, ...page.path.split("/"), "index.html"), html);
    total++;
  }
  console.log(`[prerender] ${STATIC_LANDINGS.length} static SEO landings (competitors + blog)`);

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

  // 2. Tenant landing pages — enriched with services / reviews / hours
  let tenantCount = 0;
  for (const tenant of tenants || []) {
    if (!tenant.slug || !tenant.id) continue;

    const [servicesRes, reviewsRes, hoursRes] = await Promise.all([
      supabase
        .from("services")
        .select("name, price")
        .eq("tenant_id", tenant.id)
        .order("sort_order", { ascending: true })
        .limit(20),
      supabase
        .from("reviews")
        .select("rating")
        .eq("tenant_id", tenant.id)
        .eq("approved", true)
        .limit(500),
      supabase
        .from("tenant_business_hours")
        .select("day_of_week, is_open, open_time, close_time")
        .eq("tenant_id", tenant.id)
        .order("day_of_week", { ascending: true }),
    ]);

    const services = servicesRes.data || [];
    const hours = hoursRes.data || [];
    const reviews = reviewsRes.data || [];
    const reviewStats = reviews.length
      ? {
          avg: Math.round((reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length) * 10) / 10,
          count: reviews.length,
        }
      : null;

    const extras = { services, reviewStats, hours };
    const meta = buildTenantMeta(tenant, extras);
    const body = buildTenantBody(tenant, extras);
    const html = injectMeta(baseHtml, meta, body);
    writePage(path.join(DIST, tenant.slug, "index.html"), html);
    tenantCount++;
    total++;
  }
  console.log(`[prerender] ${tenantCount} tenant pages (enriched)`);


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
