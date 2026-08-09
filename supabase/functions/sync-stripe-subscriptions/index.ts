import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, lovable-context",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[SYNC-STRIPE-SUBS] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

function getPeriodEnd(sub: any): number | null {
  return (
    sub?.current_period_end ??
    sub?.items?.data?.[0]?.current_period_end ??
    sub?.trial_end ??
    sub?.cancel_at ??
    null
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { data: tenants, error } = await supabase
      .from("tenants")
      .select("id, name, slug, stripe_subscription_id, stripe_customer_id, subscription_expires_at, is_active")
      .or("stripe_subscription_id.not.is.null,stripe_customer_id.not.is.null");

    if (error) throw new Error(`Tenants query failed: ${error.message}`);

    logStep("Tenants to check", { count: tenants?.length ?? 0 });

    const results: Array<Record<string, unknown>> = [];

    for (const tenant of tenants ?? []) {
      try {
        let sub: any = null;

        if (tenant.stripe_subscription_id) {
          try {
            sub = await stripe.subscriptions.retrieve(tenant.stripe_subscription_id);
          } catch (_e) {
            sub = null;
          }
        }

        if (!sub && tenant.stripe_customer_id) {
          const list = await stripe.subscriptions.list({
            customer: tenant.stripe_customer_id,
            status: "all",
            limit: 10,
          });
          sub =
            list.data.find((s) => ["active", "trialing", "past_due"].includes(s.status)) ??
            list.data[0] ??
            null;
        }

        if (!sub) {
          results.push({ tenant: tenant.slug, action: "no_subscription_found" });
          continue;
        }

        const periodEnd = getPeriodEnd(sub);
        const expiresAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
        const activeStatus = ["active", "trialing", "past_due"].includes(sub.status);

        const payload: Record<string, unknown> = {
          stripe_subscription_id: sub.id,
          stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
        };
        if (expiresAt) payload.subscription_expires_at = expiresAt;

        // Only auto-deactivate when Stripe says the subscription is really over
        if (["canceled", "unpaid", "incomplete_expired"].includes(sub.status)) {
          payload.is_active = false;
        } else if (activeStatus && tenant.is_active === false) {
          payload.is_active = true;
        }

        const changed =
          (expiresAt && expiresAt !== tenant.subscription_expires_at) ||
          payload.is_active !== undefined ||
          sub.id !== tenant.stripe_subscription_id;

        if (!changed) {
          results.push({ tenant: tenant.slug, action: "in_sync" });
          continue;
        }

        const { error: updErr } = await supabase.from("tenants").update(payload).eq("id", tenant.id);
        if (updErr) throw new Error(updErr.message);

        results.push({
          tenant: tenant.slug,
          action: "updated",
          status: sub.status,
          from: tenant.subscription_expires_at,
          to: expiresAt,
        });
        logStep("Tenant synced", { tenant: tenant.slug, status: sub.status, expiresAt });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        logStep("Tenant sync failed", { tenant: tenant.slug, error: msg });
        results.push({ tenant: tenant.slug, action: "error", error: msg });
      }
    }

    const updated = results.filter((r) => r.action === "updated").length;
    logStep("Done", { total: results.length, updated });

    return new Response(JSON.stringify({ ok: true, total: results.length, updated, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
