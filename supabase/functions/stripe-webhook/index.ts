import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Plan configuration with limits
const PLAN_CONFIG: Record<string, { max_stylists: number; max_services: number; features: Record<string, boolean> }> = {
  starter: {
    max_stylists: 1,
    max_services: 15,
    features: {
      stories: true,
      messages: true,
      cash_register: false,
      commissions: false,
      advanced_analytics: false,
      pdf_reports: false,
      promotions: false,
      packages: false,
      monthly_goals: false,
      waitlist: false,
    },
  },
  pro: {
    max_stylists: 3,
    max_services: 50,
    features: {
      stories: true,
      messages: true,
      cash_register: true,
      commissions: false,
      advanced_analytics: true,
      pdf_reports: true,
      promotions: true,
      packages: true,
      monthly_goals: false,
      waitlist: false,
    },
  },
  business: {
    max_stylists: 10,
    max_services: 100,
    features: {
      stories: true,
      messages: true,
      cash_register: true,
      commissions: true,
      advanced_analytics: true,
      pdf_reports: true,
      promotions: true,
      packages: true,
      monthly_goals: true,
      waitlist: true,
    },
  },
};

// REAL Stripe Price IDs (kept in sync with create-business-checkout & upgrade-subscription)
const PRICE_TO_PLAN: Record<string, string> = {
  // starter
  "price_1SqgCKRte0Pe7Hk3Zo6Fj68s": "starter", // monthly
  "price_1SqgCaRte0Pe7Hk3SEcCaPqa": "starter", // annual
  // pro
  "price_1THkYQRte0Pe7Hk3ilAOSf8h": "pro",     // monthly
  "price_1SqgDfRte0Pe7Hk33GzDcpQv": "pro",     // annual
  "price_1TTi3RRte0Pe7Hk3J0ZYSWmg": "pro",     // legacy monthly (Montserrat etc.)
  // business
  "price_1SqgDiRte0Pe7Hk3pDqSXmuS": "business", // monthly
  "price_1SqgDjRte0Pe7Hk3SVdRX7PI": "business", // annual
};

/**
 * Extract the current_period_end from a subscription.
 * Stripe API 2025-08-27.basil moved this field from the subscription root
 * to each subscription item.
 */
function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): number | null {
  const anySub = subscription as any;
  if (typeof anySub.current_period_end === "number") return anySub.current_period_end;
  const item = subscription.items?.data?.[0] as any;
  if (item && typeof item.current_period_end === "number") return item.current_period_end;
  return null;
}

async function deactivateExcessResources(
  supabase: any,
  tenantId: string,
  resourceType: "stylists" | "services",
  newLimit: number
): Promise<number> {
  const tableName = resourceType === "stylists" ? "tenant_stylists" : "services";
  const { count } = await supabase
    .from(tableName)
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  const currentCount = count || 0;
  if (currentCount <= newLimit) return 0;

  const excess = currentCount - newLimit;
  const { data: resourcesToDeactivate } = await supabase
    .from(tableName)
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(excess);

  if (resourcesToDeactivate?.length) {
    await supabase
      .from(tableName)
      .update({ is_active: false })
      .in("id", resourcesToDeactivate.map((r: any) => r.id));
    logStep(`Deactivated ${resourcesToDeactivate.length} ${resourceType}`);
  }
  return resourcesToDeactivate?.length || 0;
}

async function createNotification(
  supabase: any,
  tenantId: string,
  userId: string,
  title: string,
  message: string
) {
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      tenant_id: tenantId,
      type: "plan_change",
      title,
      message,
    });
  } catch (error) {
    logStep("Failed to create notification", { error });
  }
}

/** Resolve tenantId + ownerUserId from subscription metadata OR from customer email fallback. */
async function resolveTenantContext(
  supabase: any,
  stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<{ tenantId: string | null; userId: string | null }> {
  // 1. tenant_id directly in metadata
  const metaTenantId = subscription.metadata?.tenant_id;
  if (metaTenantId) {
    const { data: ta } = await supabase
      .from("tenant_admins")
      .select("user_id")
      .eq("tenant_id", metaTenantId)
      .eq("is_owner", true)
      .maybeSingle();
    return { tenantId: metaTenantId, userId: ta?.user_id ?? null };
  }

  // 2. business_slug in metadata
  const metaSlug = subscription.metadata?.business_slug;
  if (metaSlug) {
    const { data: t } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", metaSlug)
      .maybeSingle();
    if (t?.id) {
      const { data: ta } = await supabase
        .from("tenant_admins")
        .select("user_id")
        .eq("tenant_id", t.id)
        .eq("is_owner", true)
        .maybeSingle();
      return { tenantId: t.id, userId: ta?.user_id ?? null };
    }
  }

  // 3. Look up by customer email → profile → tenant_admin
  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    if ((customer as any).deleted) return { tenantId: null, userId: null };
    const email = (customer as Stripe.Customer).email;
    if (!email) return { tenantId: null, userId: null };

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (!profile) return { tenantId: null, userId: null };

    const { data: ta } = await supabase
      .from("tenant_admins")
      .select("tenant_id, user_id")
      .eq("user_id", profile.id)
      .eq("is_owner", true)
      .maybeSingle();
    if (!ta) return { tenantId: null, userId: profile.id };
    return { tenantId: ta.tenant_id, userId: ta.user_id };
  } catch (e) {
    logStep("resolveTenantContext error", { error: String(e) });
    return { tenantId: null, userId: null };
  }
}

async function processSubscriptionChange(
  supabase: any,
  stripe: Stripe,
  subscription: Stripe.Subscription,
  tenantId: string,
  userId?: string | null
) {
  logStep("processSubscriptionChange", {
    tenantId,
    status: subscription.status,
    subId: subscription.id,
  });

  // ===== Cancellation / unpaid → downgrade to starter =====
  if (subscription.status === "canceled" || subscription.status === "unpaid") {
    const starterConfig = PLAN_CONFIG["starter"];
    const deactivatedStylists = await deactivateExcessResources(supabase, tenantId, "stylists", starterConfig.max_stylists);
    const deactivatedServices = await deactivateExcessResources(supabase, tenantId, "services", starterConfig.max_services);

    await supabase
      .from("tenants")
      .update({
        subscription_plan: "starter",
        max_stylists: starterConfig.max_stylists,
        max_services: starterConfig.max_services,
        features: starterConfig.features,
        subscription_expires_at: null,
        stripe_subscription_id: null,
      })
      .eq("id", tenantId);

    if (userId) {
      await createNotification(
        supabase,
        tenantId,
        userId,
        "Suscripción cancelada",
        `Tu suscripción se ha cancelado. Has vuelto al plan gratuito. Se han desactivado ${deactivatedStylists} profesional(es) y ${deactivatedServices} servicio(s) para ajustarse a los nuevos límites.`
      );
    }
    return;
  }

  // ===== Active / trialing / past_due / incomplete → sync plan + period =====
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) {
    logStep("No price ID in subscription items");
    return;
  }

  let newPlanSlug = subscription.metadata?.plan_slug || PRICE_TO_PLAN[priceId];
  if (!newPlanSlug) {
    try {
      const price = await stripe.prices.retrieve(priceId);
      newPlanSlug = (price.metadata as any)?.plan_slug;
    } catch (e) {
      logStep("Could not retrieve price", { priceId, error: String(e) });
    }
  }
  if (!newPlanSlug || !PLAN_CONFIG[newPlanSlug]) {
    logStep("Unknown plan, aborting", { priceId, newPlanSlug });
    return;
  }

  const planConfig = PLAN_CONFIG[newPlanSlug];

  // Deactivate excess resources if downgrading
  const deactivatedStylists = await deactivateExcessResources(supabase, tenantId, "stylists", planConfig.max_stylists);
  const deactivatedServices = await deactivateExcessResources(supabase, tenantId, "services", planConfig.max_services);

  // Period end → robust extraction
  const periodEnd = getSubscriptionPeriodEnd(subscription);
  const expiresAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

  const updatePayload: Record<string, unknown> = {
    subscription_plan: newPlanSlug,
    max_stylists: planConfig.max_stylists,
    max_services: planConfig.max_services,
    features: planConfig.features,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    is_active: true,
  };
  if (expiresAt) updatePayload.subscription_expires_at = expiresAt;

  const { error: updErr } = await supabase
    .from("tenants")
    .update(updatePayload)
    .eq("id", tenantId);

  if (updErr) {
    logStep("Tenant update failed", { error: updErr.message });
    return;
  }

  logStep("Tenant synced", { tenantId, newPlanSlug, expiresAt, status: subscription.status });

  // Send tenant welcome email on first activation (idempotent via email_send_log check)
  try {
    await maybeSendTenantWelcome(supabase, tenantId);
  } catch (e) {
    logStep("welcome email dispatch failed", { error: String(e) });
  }

  if (userId && (deactivatedStylists > 0 || deactivatedServices > 0)) {
    await createNotification(
      supabase,
      tenantId,
      userId,
      "Plan actualizado",
      `Tu plan ha cambiado a ${newPlanSlug}. Se han desactivado ${deactivatedStylists} profesional(es) y ${deactivatedServices} servicio(s) para ajustarse a los nuevos límites.`
    );
  }
}

async function maybeSendTenantWelcome(supabase: any, tenantId: string) {
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, slug, email, logo_url")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant?.email) {
    logStep("welcome: tenant has no email, skipping", { tenantId });
    return;
  }

  // Idempotency: only send once per tenant email
  const { data: prior } = await supabase
    .from("email_send_log")
    .select("id")
    .eq("template_name", "tenant-welcome")
    .eq("recipient_email", tenant.email)
    .limit(1)
    .maybeSingle();

  if (prior) {
    logStep("welcome: already sent, skipping", { tenantId });
    return;
  }

  // Try to fetch owner name from profile
  let ownerName = tenant.name || "Hola";
  const { data: adminRow } = await supabase
    .from("tenant_admins")
    .select("user_id")
    .eq("tenant_id", tenantId)
    .eq("is_owner", true)
    .maybeSingle();
  if (adminRow?.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, first_name")
      .eq("id", adminRow.user_id)
      .maybeSingle();
    ownerName = profile?.first_name || (profile?.full_name || "").split(" ")[0] || ownerName;
  }

  const { error: invokeError } = await supabase.functions.invoke("send-transactional-email", {
    body: {
      templateName: "tenant-welcome",
      recipientEmail: tenant.email,
      idempotencyKey: `tenant-welcome-${tenantId}`,
      templateData: {
        ownerName,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        tenantLogoUrl: tenant.logo_url || null,
        adminUrl: "https://glowapp.app/admin",
        publicUrl: tenant.slug ? `https://glowapp.app/${tenant.slug}` : undefined,
      },
    },
  });

  if (invokeError) {
    logStep("welcome: invoke error", { error: invokeError.message });
  } else {
    logStep("welcome email queued", { tenantId, email: tenant.email });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;
    if (webhookSecret && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      } catch (err) {
        logStep("Signature verification failed", { error: String(err) });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      event = JSON.parse(body);
      logStep("Processing event WITHOUT signature verification (dev mode)");
    }

    logStep("Event type", { type: event.type });

    switch (event.type) {
      // ----- Subscription lifecycle (created, trial→active, plan change, renewal, cancel) -----
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const ctx = await resolveTenantContext(supabase, stripe, subscription);
        if (!ctx.tenantId) {
          logStep("Could not resolve tenant for subscription", { subId: subscription.id });
          break;
        }
        await processSubscriptionChange(supabase, stripe, subscription, ctx.tenantId, ctx.userId);
        break;
      }

      // ----- Checkout completed: first-time seed of customer_id + subscription_id -----
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { sessionId: session.id });

        const businessSlug = session.metadata?.business_slug;
        const tenantIdMeta = session.metadata?.tenant_id;
        const planSlug = session.metadata?.plan_slug;
        const customerId = session.customer as string | null;
        const subscriptionId = session.subscription as string | null;

        if (!subscriptionId) {
          logStep("Checkout has no subscription, skipping");
          break;
        }

        // Re-fetch subscription so we have items + period_end
        let sub: Stripe.Subscription | null = null;
        try {
          sub = await stripe.subscriptions.retrieve(subscriptionId);
        } catch (e) {
          logStep("Could not retrieve subscription", { error: String(e) });
        }

        // Find tenant by id → slug → fallback via subscription
        let tenantId: string | null = tenantIdMeta || null;
        if (!tenantId && businessSlug) {
          const { data: t } = await supabase
            .from("tenants").select("id").eq("slug", businessSlug).maybeSingle();
          tenantId = t?.id ?? null;
        }
        if (!tenantId && sub) {
          const ctx = await resolveTenantContext(supabase, stripe, sub);
          tenantId = ctx.tenantId;
        }

        if (!tenantId) {
          logStep("Tenant not found yet (likely created later in onboarding)", { businessSlug });
          break;
        }

        if (sub) {
          await processSubscriptionChange(supabase, stripe, sub, tenantId, session.metadata?.user_id ?? null);
        } else if (planSlug && PLAN_CONFIG[planSlug]) {
          // Minimal fallback if subscription retrieval failed
          const config = PLAN_CONFIG[planSlug];
          await supabase
            .from("tenants")
            .update({
              subscription_plan: planSlug,
              max_stylists: config.max_stylists,
              max_services: config.max_services,
              features: config.features,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              is_active: true,
            })
            .eq("id", tenantId);
        }
        break;
      }

      // ----- Renewal payment succeeded: safety net to extend period -----
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string | null;
        if (!subscriptionId) break;
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const ctx = await resolveTenantContext(supabase, stripe, sub);
          if (ctx.tenantId) {
            await processSubscriptionChange(supabase, stripe, sub, ctx.tenantId, ctx.userId);
          }
        } catch (e) {
          logStep("invoice.payment_succeeded handler error", { error: String(e) });
        }
        break;
      }

      // ----- Renewal payment failed: notify owner, keep access until period_end -----
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string | null;
        if (!subscriptionId) break;
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const ctx = await resolveTenantContext(supabase, stripe, sub);
          if (ctx.tenantId && ctx.userId) {
            await createNotification(
              supabase,
              ctx.tenantId,
              ctx.userId,
              "Pago fallido",
              "No hemos podido cobrar tu suscripción. Por favor, actualiza tu método de pago para no perder acceso."
            );
          }
        } catch (e) {
          logStep("invoice.payment_failed handler error", { error: String(e) });
        }
        break;
      }

      default:
        logStep("Unhandled event", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
