import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "get_tenant",
  title: "Get salon details",
  description:
    "Get public details of a salon by its slug (e.g. 'cristina-munoz'). Returns name, city, address, phone, description, tagline, and social links.",
  inputSchema: {
    slug: z.string().trim().min(1).describe("Salon slug, e.g. 'cristina-munoz'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }) => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.rpc("get_public_tenant_by_slug", { _slug: slug });
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    const tenant = Array.isArray(data) ? data[0] : data;
    if (!tenant) {
      return { content: [{ type: "text", text: `Salon '${slug}' not found or not active.` }], isError: true };
    }

    return {
      content: [
        {
          type: "text",
          text: `${tenant.name} — ${tenant.city ?? ""}\n${tenant.tagline ?? ""}\n${tenant.description ?? ""}\nPhone: ${tenant.phone ?? "n/a"}\nAddress: ${tenant.address ?? "n/a"}\nInstagram: ${tenant.instagram_url ?? "n/a"}\nBook: https://glowapp.app/${tenant.slug}`,
        },
      ],
      structuredContent: { tenant },
    };
  },
});
