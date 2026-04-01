import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch all active tenants with their slugs
    const { data: tenants, error } = await supabase
      .from("tenants")
      .select("slug, updated_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const baseUrl = "https://www.glowapp.app";
    const today = new Date().toISOString().split("T")[0];

    // Static pages
    const staticPages = [
      { url: "/", priority: "1.0", changefreq: "daily" },
      { url: "/para-negocios", priority: "0.9", changefreq: "weekly" },
      { url: "/auth", priority: "0.7", changefreq: "monthly" },
      { url: "/onboarding", priority: "0.8", changefreq: "monthly" },
      { url: "/privacidad", priority: "0.3", changefreq: "yearly" },
      { url: "/terminos", priority: "0.3", changefreq: "yearly" },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

    // Add static pages
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <xhtml:link rel="alternate" hreflang="es" href="${baseUrl}${page.url}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${page.url}"/>
  </url>
`;
    }

    // Add tenant/salon pages
    if (tenants) {
      for (const tenant of tenants) {
        const lastmod = tenant.updated_at
          ? new Date(tenant.updated_at).toISOString().split("T")[0]
          : today;

        xml += `  <url>
    <loc>${baseUrl}/${tenant.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err) {
    console.error("Sitemap generation error:", err);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      {
        headers: { "Content-Type": "application/xml" },
        status: 500,
      }
    );
  }
});
