import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "get_tenant_reviews",
  title: "Get salon reviews",
  description: "Get recent approved reviews for a salon by its slug.",
  inputSchema: {
    slug: z.string().trim().min(1).describe("Salon slug."),
    limit: z.number().int().min(1).max(20).optional().describe("Max reviews. Default 6."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug, limit }) => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: tenantRows, error: tErr } = await supabase.rpc("get_public_tenant_by_slug", { _slug: slug });
    if (tErr) return { content: [{ type: "text", text: `Error: ${tErr.message}` }], isError: true };
    const tenant = Array.isArray(tenantRows) ? tenantRows[0] : tenantRows;
    if (!tenant) return { content: [{ type: "text", text: `Salon '${slug}' not found.` }], isError: true };

    const { data, error } = await supabase.rpc("get_tenant_reviews", {
      p_tenant_id: tenant.id,
      p_limit: limit ?? 6,
    });
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };

    const rows = (data ?? []) as Array<{ rating: number; comment: string | null; reviewer_name: string }>;
    const summary = rows
      .map((r) => `★${r.rating} — ${r.reviewer_name}: ${r.comment ?? ""}`)
      .join("\n");

    return {
      content: [{ type: "text", text: rows.length ? summary : "No reviews yet." }],
      structuredContent: { count: rows.length, reviews: rows },
    };
  },
});
