import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_TO_PLAN: Record<string, string> = {
  "price_1SqgCKRte0Pe7Hk3Zo6Fj68s": "starter",
  "price_1SqgCaRte0Pe7Hk3SEcCaPqa": "starter",
  "price_1THkYQRte0Pe7Hk3ilAOSf8h": "pro",
  "price_1SqgDfRte0Pe7Hk33GzDcpQv": "pro",
  "price_1TTi3RRte0Pe7Hk3J0ZYSWmg": "pro",
  "price_1SqgDiRte0Pe7Hk3pDqSXmuS": "business",
  "price_1SqgDjRte0Pe7Hk3SVdRX7PI": "business",
};

const PLAN_CONFIG: Record<string, { max_stylists: number; max_services: number; features: Record<string, boolean> }> = {
  starter: {
    max_stylists: 1,
    max_services: 15,
    features: { stories: true, messages: true, cash_register: false, commissions: false, advanced_analytics: false, pdf_reports: false, promotions: false, packages: false, monthly_goals: false, waitlist: false },
  },
  pro: {
    max_stylists: 3,
    max_services: 50,
    features: { stories: true, messages: true, cash_register: true, commissions: false, advanced_analytics: true, pdf_reports: true, promotions: true, packages: true, monthly_goals: false, waitlist: false },
  },
  business: {
    max_stylists: 10,
    max_services: 100,
    features: { stories: true, messages: true, cash_register: true, commissions: true, advanced_analytics: true, pdf_reports: true, promotions: true, packages: true, monthly_goals: true, waitlist: true },
  },
};

const ACCESS_STATUSES = ["active", "trialing", "past_due"];

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

async function readBody(req: Request): Promise<{ tenantId?: string }> {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return {};
    return await req.json();
  } catch {
    return {};
  }
}

async function canReadTenant(supabase: any, userId: string, tenantId: string) {
  const { data: superadmin } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "superadmin")
    .maybeSingle();
  if (superadmin) return true;

  const { data: admin } = await supabase
    .from("tenant_admins")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  if (admin) return true;

  const { data: stylist } = await supabase
    .from("tenant_stylists")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  return !!stylist;
}

function getPeriodEnd(subscription: any): number | null {
  if (typeof subscription.current_period_end === "number") return subscription.current_period_end;
  const itemEnd = subscription.items?.data?.[0]?.current_period_end;
  return typeof itemEnd === "number" ? itemEnd : null;
}

function pickRelevantSubscription(subscriptions: Stripe.Subscription[]) {
  return subscriptions.find((sub) => ACCESS_STATUSES.includes(sub.status)) || subscriptions[0] || null;
}

async function syncTenant(supabase: any, tenantId: string, subscription: any, customerId: string, planSlug: string | null, subscriptionEnd: string | null) {
  if (["canceled", "unpaid"].includes(subscription.status)) {
    const config = PLAN_CONFIG.starter;
    await supabase
      .from("tenants")
      .update({
        subscription_plan: "starter",
        max_stylists: config.max_stylists,
        max_services: config.max_services,
        features: config.features,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        subscription_expires_at: subscriptionEnd || new Date().toISOString(),
      })
      .eq("id", tenantId);
    return;
  }

  if (!planSlug || !PLAN_CONFIG[planSlug]) return;
  const config = PLAN_CONFIG[planSlug];
  const payload: Record<string, unknown> = {
    subscription_plan: planSlug,
    max_stylists: config.max_stylists,
    max_services: config.max_services,
    features: config.features,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    is_active: true,
  };
  if (subscriptionEnd) payload.subscription_expires_at = subscriptionEnd;

  await supabase.from("tenants").update(payload).eq("id", tenantId);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { tenantId } = await readBody(req);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let customerId: string | null = null;
    let tenantPlan: string | null = null;

    if (tenantId) {
      const allowed = await canReadTenant(supabaseClient, user.id, tenantId);
      if (!allowed) return json({ error: "forbidden" }, 403);

      const { data: tenant, error: tenantError } = await supabaseClient
        .from("tenants")
        .select("stripe_customer_id, stripe_subscription_id, subscription_plan")
        .eq("id", tenantId)
        .maybeSingle();
      if (tenantError) throw tenantError;
      customerId = tenant?.stripe_customer_id || null;
      tenantPlan = tenant?.subscription_plan || null;

      if (tenant?.stripe_subscription_id) {
        try {
          const subscription = await stripe.subscriptions.retrieve(tenant.stripe_subscription_id);
          customerId = (subscription.customer as string) || customerId;
          return await buildSubscriptionResponse(supabaseClient, stripe, subscription, customerId, tenantId, tenantPlan);
        } catch (error) {
          logStep("Could not retrieve tenant subscription, falling back", { error: String(error) });
        }
      }
    }

    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = customers.data[0]?.id || null;
    }

    if (!customerId) {
      logStep("No customer found");
      return json({ subscribed: false, has_customer: false, has_subscription: false, plan: null, plan_slug: tenantPlan, subscription_end: null, trial_end: null, cancel_at_period_end: false });
    }

    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
    const subscription = pickRelevantSubscription(subscriptions.data);

    if (!subscription) {
      logStep("No subscription found", { customerId });
      return json({ subscribed: false, has_customer: true, has_subscription: false, plan: null, plan_slug: tenantPlan, subscription_end: null, trial_end: null, cancel_at_period_end: false });
    }

    return await buildSubscriptionResponse(supabaseClient, stripe, subscription, customerId, tenantId, tenantPlan);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return json({ error: errorMessage }, 500);
  }
});

async function buildSubscriptionResponse(
  supabase: any,
  stripe: Stripe,
  subscription: Stripe.Subscription,
  customerId: string,
  tenantId?: string,
  tenantPlan?: string | null,
) {
  const anySub = subscription as any;
  const priceId = subscription.items.data[0]?.price?.id || null;
  const interval = subscription.items.data[0]?.price?.recurring?.interval;
  const billingPlan = interval === "year" ? "annual" : interval === "month" ? "monthly" : null;
  let planSlug = (priceId && PRICE_TO_PLAN[priceId]) || subscription.metadata?.plan_slug || tenantPlan || null;

  if ((!planSlug || !PLAN_CONFIG[planSlug]) && priceId) {
    try {
      const price = await stripe.prices.retrieve(priceId);
      planSlug = (price.metadata as any)?.plan_slug || planSlug;
    } catch (error) {
      logStep("Could not retrieve price metadata", { priceId, error: String(error) });
    }
  }

  const periodEndUnix = getPeriodEnd(anySub);
  const subscriptionEnd = periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null;
  const trialEnd = anySub.trial_end ? new Date(anySub.trial_end * 1000).toISOString() : null;
  const subscribed = ACCESS_STATUSES.includes(subscription.status);

  if (tenantId) await syncTenant(supabase, tenantId, anySub, customerId, planSlug, subscriptionEnd);

  logStep("Subscription resolved", { status: subscription.status, planSlug, subscriptionEnd, cancelAtPeriodEnd: anySub.cancel_at_period_end });

  return json({
    subscribed,
    has_customer: true,
    has_subscription: true,
    status: subscription.status,
    plan: billingPlan,
    plan_slug: planSlug,
    price_id: priceId,
    subscription_end: subscriptionEnd,
    trial_end: trialEnd,
    cancel_at_period_end: !!anySub.cancel_at_period_end,
  });
}
