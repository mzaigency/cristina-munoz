// Dynamic sitemap generator
// Runs at `npm run build` (build:sitemap step)
// Fetches active tenants from Supabase and generates entries for:
//   - Static public pages
//   - Directory category roots (e.g. /peluquerias)
//   - Directory category x city (only when tenants exist there)
//   - Each tenant landing (/{slug})
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = process.env.VITE_SITE_URL || "https://www.glowapp.app";
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const CATEGORY_SLUGS = ["peluquerias", "barberias", "estetica", "spa", "unas"];
// URL slug -> features.business_type stored in DB
const CATEGORY_TO_BT = {
  peluquerias: "peluqueria",
  barberias: "barberia",
  estetica: "estetica",
  spa: "spa",
  unas: "unas",
};

// Same normalization rule used by DirectoryLanding.tsx
const normalizeForUrl = (str) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");

const staticPages = [
  { url: "/", priority: "1.0", changefreq: "daily" },
  { url: "/negocios", priority: "0.9", changefreq: "weekly" },
  { url: "/auth", priority: "0.5", changefreq: "monthly" },
  { url: "/privacidad", priority: "0.3", changefreq: "yearly" },
  { url: "/terminos", priority: "0.3", changefreq: "yearly" },
];

async function buildEntries() {
  const entries = [...staticPages];

  // Always include category roots (5 entries — minor footprint, big intent coverage)
  for (const cat of CATEGORY_SLUGS) {
    entries.push({ url: `/${cat}`, priority: "0.8", changefreq: "weekly" });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[sitemap] Supabase env vars missing — skipping dynamic entries");
    return entries;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  // Use the public RPC (anon-safe) — direct SELECT is blocked by RLS
  const { data: tenants, error } = await supabase.rpc("get_public_tenants");

  if (error) {
    console.warn("[sitemap] Supabase RPC failed:", error.message);
    return entries;
  }

  // Tenant landings
  for (const t of tenants || []) {
    if (!t.slug) continue;
    entries.push({
      url: `/${t.slug}`,
      priority: "0.9",
      changefreq: "weekly",
      lastmod: t.updated_at ? t.updated_at.slice(0, 10) : undefined,
    });
  }

  // Category x city (only combos where >=1 active tenant of that type lives in that city)
  const seen = new Set();
  for (const t of tenants || []) {
    const bt = t.features?.business_type;
    if (!bt || !t.city) continue;
    const catSlug = Object.keys(CATEGORY_TO_BT).find(
      (k) => CATEGORY_TO_BT[k] === bt,
    );
    if (!catSlug) continue;
    const citySlug = normalizeForUrl(t.city);
    const key = `${catSlug}/${citySlug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({
      url: `/${catSlug}/${citySlug}`,
      priority: "0.7",
      changefreq: "weekly",
    });
  }

  return entries;
}

const entries = await buildEntries();

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((p) =>
    [
      `  <url>`,
      `    <loc>${SITE_URL}${p.url}</loc>`,
      p.lastmod ? `    <lastmod>${p.lastmod}</lastmod>` : null,
      `    <changefreq>${p.changefreq}</changefreq>`,
      `    <priority>${p.priority}</priority>`,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  )
  .join("\n")}
</urlset>`;

const outputPath = path.join(__dirname, "..", "public", "sitemap.xml");
fs.writeFileSync(outputPath, sitemap);
console.log(`[sitemap] generated ${entries.length} entries at public/sitemap.xml`);
