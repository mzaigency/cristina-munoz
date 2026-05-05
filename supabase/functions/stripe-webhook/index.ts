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

// Price ID to plan slug mapping - update these with your actual Stripe price IDs
const PRICE_TO_PLAN: Record<string, string> = {
  // Monthly prices
  "price_starter_monthly": "starter",
  "price_pro_monthly": "pro",
  "price_business_monthly": "business",
  // Annual prices
  "price_starter_annual": "starter",
  "price_pro_annual": "pro",
  "price_business_annual": "business",
};

async function deactivateExcessResources(
  supabase: any,
  tenantId: string,
  resourceType: "stylists" | "services",
  newLimit: number
): Promise<number> {
  const tableName = resourceType === "stylists" ? "tenant_stylists" : "services";
  
  // Count current active resources
  const { count } = await supabase
    .from(tableName)
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_active", true);
  
  const currentCount = count || 0;
  
  if (currentCount <= newLimit) {
    logStep(`No deactivation needed for ${resourceType}`, { currentCount, newLimit });
    return 0;
  }
  
  const excess = currentCount - newLimit;
  logStep(`Deactivating excess ${resourceType}`, { currentCount, newLimit, excess });
  
  // Get the most recently created resources to deactivate
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
    logStep("Notification created");
  } catch (error) {
    logStep("Failed to create notification", { error });
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
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    let event: Stripe.Event;
    
    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Parse event without verification (for testing)
      event = JSON.parse(body);
      logStep("Processing event without signature verification");
    }
    
    logStep("Event type", { type: event.type });
    
    switch (event.type) {
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata?.tenant_id;
        const customerId = subscription.customer as string;
        
        logStep("Processing subscription change", { 
          subscriptionId: subscription.id, 
          tenantId,
          status: subscription.status 
        });
        
        if (!tenantId) {
          logStep("No tenant_id in metadata, trying to find by customer");
          
          // Try to find tenant by looking up the user via Stripe customer email
          const customer = await stripe.customers.retrieve(customerId);
          if (customer.deleted) {
            logStep("Customer was deleted");
            break;
          }
          
          const email = (customer as Stripe.Customer).email;
          if (!email) {
            logStep("No email found for customer");
            break;
          }
          
          // Find user by email
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .single();
          
          if (!profile) {
            logStep("No profile found for email", { email });
            break;
          }
          
          // Find tenant admin relationship
          const { data: tenantAdmin } = await supabase
            .from("tenant_admins")
            .select("tenant_id")
            .eq("user_id", profile.id)
            .eq("is_owner", true)
            .single();
          
          if (!tenantAdmin) {
            logStep("No tenant found for user", { userId: profile.id });
            break;
          }
          
          // Process with found tenant
          await processSubscriptionChange(supabase, stripe, subscription, tenantAdmin.tenant_id, profile.id);
          break;
        }
        
        // Find the owner of the tenant for notifications
        const { data: tenantAdmin } = await supabase
          .from("tenant_admins")
          .select("user_id")
          .eq("tenant_id", tenantId)
          .eq("is_owner", true)
          .single();
        
        await processSubscriptionChange(supabase, stripe, subscription, tenantId, tenantAdmin?.user_id);
        break;
      }
      
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { sessionId: session.id });

        const businessSlug = session.metadata?.business_slug;
        const planSlug = session.metadata?.plan_slug;
        const customerId = session.customer as string | null;
        const subscriptionId = session.subscription as string | null;

        if (businessSlug && planSlug && PLAN_CONFIG[planSlug]) {
          const config = PLAN_CONFIG[planSlug];
          let expiresAt: string | null = null;
          if (subscriptionId) {
            try {
              const sub = await stripe.subscriptions.retrieve(subscriptionId);
              if (sub.current_period_end) {
                expiresAt = new Date(sub.current_period_end * 1000).toISOString();
              }
            } catch (e) {
              logStep("Could not fetch subscription for expires_at", { error: String(e) });
            }
          }

          const updatePayload: Record<string, unknown> = {
            subscription_plan: planSlug,
            max_stylists: config.max_stylists,
            max_services: config.max_services,
            features: config.features,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          };
          if (expiresAt) updatePayload.subscription_expires_at = expiresAt;

          const { error: updErr } = await supabase
            .from("tenants")
            .update(updatePayload)
            .eq("slug", businessSlug);

          if (updErr) {
            logStep("Failed to sync tenant from checkout.session.completed", { error: updErr.message });
          } else {
            logStep("Tenant synced from checkout.session.completed", { businessSlug, planSlug });
          }
        }
        break;
      }
      
      default:
        logStep("Unhandled event type", { type: event.type });
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

async function processSubscriptionChange(
  supabase: any,
  stripe: Stripe,
  subscription: Stripe.Subscription,
  tenantId: string,
  userId?: string
) {
  logStep("Processing subscription change for tenant", { tenantId });
  
  // Handle subscription deleted/cancelled
  if (subscription.status === "canceled" || subscription.status === "unpaid") {
    logStep("Subscription cancelled or unpaid, downgrading to starter");
    
    const starterConfig = PLAN_CONFIG["starter"];
    
    // Deactivate excess resources
    const deactivatedStylists = await deactivateExcessResources(supabase, tenantId, "stylists", starterConfig.max_stylists);
    const deactivatedServices = await deactivateExcessResources(supabase, tenantId, "services", starterConfig.max_services);
    
    // Update tenant
    await supabase
      .from("tenants")
      .update({
        subscription_plan: "starter",
        max_stylists: starterConfig.max_stylists,
        max_services: starterConfig.max_services,
        features: starterConfig.features,
        subscription_expires_at: null,
      })
      .eq("id", tenantId);
    
    // Notify user
    if (userId && (deactivatedStylists > 0 || deactivatedServices > 0)) {
      await createNotification(
        supabase,
        tenantId,
        userId,
        "Plan actualizado",
        `Tu suscripción ha cambiado. Se han desactivado ${deactivatedStylists} profesional(es) y ${deactivatedServices} servicio(s) para ajustarse a los límites del plan gratuito.`
      );
    }
    
    return;
  }
  
  // Get the price ID from subscription
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) {
    logStep("No price ID found in subscription");
    return;
  }
  
  // Determine the plan from price ID or metadata
  let newPlanSlug = subscription.metadata?.plan_slug || PRICE_TO_PLAN[priceId];
  
  if (!newPlanSlug) {
    // Try to get plan from price metadata
    const price = await stripe.prices.retrieve(priceId);
    newPlanSlug = price.metadata?.plan_slug;
  }
  
  if (!newPlanSlug || !PLAN_CONFIG[newPlanSlug]) {
    logStep("Unknown plan", { priceId, newPlanSlug });
    return;
  }
  
  const planConfig = PLAN_CONFIG[newPlanSlug];
  logStep("Applying plan config", { newPlanSlug, planConfig });
  
  // Deactivate excess resources if downgrading
  const deactivatedStylists = await deactivateExcessResources(supabase, tenantId, "stylists", planConfig.max_stylists);
  const deactivatedServices = await deactivateExcessResources(supabase, tenantId, "services", planConfig.max_services);
  
  // Calculate subscription expiration
  const expiresAt = subscription.current_period_end 
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;
  
  // Update tenant
  await supabase
    .from("tenants")
    .update({
      subscription_plan: newPlanSlug,
      max_stylists: planConfig.max_stylists,
      max_services: planConfig.max_services,
      features: planConfig.features,
      subscription_expires_at: expiresAt,
    })
    .eq("id", tenantId);
  
  logStep("Tenant updated successfully");
  
  // Notify user about deactivations
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
