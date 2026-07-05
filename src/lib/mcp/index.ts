import { defineMcp } from "@lovable.dev/mcp-js";
import searchTenants from "./tools/search-tenants";
import getTenant from "./tools/get-tenant";
import getTenantReviews from "./tools/get-tenant-reviews";

export default defineMcp({
  name: "glowapp-mcp",
  title: "Glowapp",
  version: "0.1.0",
  instructions:
    "Public read-only tools for Glowapp — the social booking platform for beauty & wellness salons in Spain. Use `search_tenants` to discover salons (optionally by city), `get_tenant` to fetch a salon's public details by slug, and `get_tenant_reviews` to read recent reviews.",
  tools: [searchTenants, getTenant, getTenantReviews],
});
