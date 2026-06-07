// Submits sitemap.xml to Google Search Console via the Lovable connector gateway.
// Can be invoked manually or by a scheduled cron job.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_search_console";
const SITE_URL = "https://www.glowapp.app/";
const SITEMAP_URL = "https://www.glowapp.app/sitemap.xml";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GSC_API_KEY = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!GSC_API_KEY) {
    return new Response(JSON.stringify({ error: "GOOGLE_SEARCH_CONSOLE_API_KEY missing" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const headers = {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": GSC_API_KEY,
  };

  const encSite = encodeURIComponent(SITE_URL);
  const encMap = encodeURIComponent(SITEMAP_URL);

  try {
    // 1) Ping sitemap (refresh) — also "warms" Google to re-fetch robots.txt
    const submitRes = await fetch(
      `${GATEWAY_URL}/webmasters/v3/sites/${encSite}/sitemaps/${encMap}`,
      { method: "PUT", headers },
    );

    // 2) Read back state
    const getRes = await fetch(
      `${GATEWAY_URL}/webmasters/v3/sites/${encSite}/sitemaps/${encMap}`,
      { method: "GET", headers },
    );
    const sitemapInfo = getRes.ok ? await getRes.json() : { status: getRes.status };

    return new Response(JSON.stringify({
      ok: submitRes.ok,
      submit_status: submitRes.status,
      sitemap: sitemapInfo,
      submitted_at: new Date().toISOString(),
    }), {
      status: submitRes.ok ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
