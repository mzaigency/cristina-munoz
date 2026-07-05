import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "search_tenants",
  title: "Search salons",
  description:
    "Search publicly listed salons on Glowapp. Optionally filter by city (case-insensitive substring). Returns basic public info: name, slug, city, tagline.",
  inputSchema: {
    city: z
      .string()
      .optional()
      .describe("Optional city filter (case-insensitive substring match)."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Max results to return. Default 20."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ city, limit }) => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.rpc("get_public_tenants");
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }

    let rows = (data ?? []) as Array<{
      name: string;
      slug: string;
      city: string | null;
      tagline: string | null;
      description: string | null;
    }>;
    if (city) {
      const needle = city.toLowerCase();
      rows = rows.filter((r) => (r.city ?? "").toLowerCase().includes(needle));
    }
    rows = rows.slice(0, limit ?? 20);

    const summary = rows
      .map((r) => `- ${r.name} (/${r.slug})${r.city ? ` — ${r.city}` : ""}${r.tagline ? `: ${r.tagline}` : ""}`)
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: rows.length
            ? `Found ${rows.length} salon(s):\n${summary}`
            : "No salons found.",
        },
      ],
      structuredContent: { count: rows.length, tenants: rows },
    };
  },
});
