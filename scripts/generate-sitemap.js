// Simple sitemap generator script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = process.env.VITE_SITE_URL || 'https://cristina-munoz.lovable.app';

const pages = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/para-negocios', priority: '0.9', changefreq: 'weekly' },
  { url: '/politica-privacidad', priority: '0.3', changefreq: 'yearly' },
  { url: '/terminos-uso', priority: '0.3', changefreq: 'yearly' },
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <priority>${page.priority}</priority>
    <changefreq>${page.changefreq}</changefreq>
  </url>`).join('\n')}
</urlset>`;

const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
fs.writeFileSync(outputPath, sitemap);
console.log('Sitemap generated successfully at public/sitemap.xml');
