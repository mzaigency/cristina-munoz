import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROVISION-BUSINESS] ${step}${detailsStr}`);
};

// Plan limits and features
const PLAN_CONFIG: Record<string, {
  max_stylists: number;
  max_services: number;
  features: Record<string, boolean>;
}> = {
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
    max_stylists: 999,
    max_services: 999,
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const body = await req.json();
    const { 
      businessName, 
      businessSlug, 
      phone,
      email,
      address,
      city,
      primaryColor,
      secondaryColor,
      tagline,
      description,
      planSlug: rawPlanSlug = "starter",
      billingCycle,
      sessionId,
      skipStripe,
    } = body;

    logStep("Request body", { businessName, businessSlug, planSlug: rawPlanSlug, billingCycle, sessionId, skipStripe });

    let planSlug = rawPlanSlug;
    let stripeCustomerId: string | null = null;
    let stripeSubscriptionId: string | null = null;
    let subscriptionEndOverride: Date | null = null;

    // If we have a Stripe checkout session, verify against Stripe and use the
    // *real* plan from the metadata (defense against tampered planSlug)
    if (sessionId && !skipStripe) {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        try {
          const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
          const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ["subscription"],
          });
          logStep("Stripe session retrieved", { 
            id: checkoutSession.id, 
            status: checkoutSession.status,
            metadataPlan: checkoutSession.metadata?.plan_slug,
          });

          const verifiedPlan = checkoutSession.metadata?.plan_slug;
          if (verifiedPlan && PLAN_CONFIG[verifiedPlan]) {
            planSlug = verifiedPlan;
            logStep("Plan verified from Stripe metadata", { planSlug });
          }

          stripeCustomerId = (checkoutSession.customer as string) || null;
          const sub = checkoutSession.subscription as Stripe.Subscription | null;
          if (sub && typeof sub === "object") {
            stripeSubscriptionId = sub.id;
            if (sub.current_period_end) {
              subscriptionEndOverride = new Date(sub.current_period_end * 1000);
            }
          }
        } catch (stripeErr) {
          logStep("Warning: failed to verify Stripe session", { 
            error: stripeErr instanceof Error ? stripeErr.message : String(stripeErr),
          });
          // Don't fail provisioning — fall back to the planSlug provided by the client.
        }
      }
    }

    // Validate plan
    const validPlanSlug = PLAN_CONFIG[planSlug] ? planSlug : "starter";
    const planConfig = PLAN_CONFIG[validPlanSlug];

    // If skipStripe is true, verify user is superadmin
    if (skipStripe) {
      const { data: roleCheck } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "superadmin")
        .maybeSingle();
      
      if (!roleCheck) {
        throw new Error("Solo superadmins pueden crear salones en modo demo");
      }
      logStep("Superadmin verified for demo mode");
    }

    // Check if slug is available
    const { data: existingTenant } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", businessSlug)
      .single();

    if (existingTenant) {
      throw new Error("Este nombre de salón ya está en uso. Por favor elige otro.");
    }

    // Calculate subscription expiration
    const now = new Date();
    let subscriptionEnd: Date;
    
    if (skipStripe) {
      // Demo mode: 7 days only
      subscriptionEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (subscriptionEndOverride) {
      subscriptionEnd = subscriptionEndOverride;
    } else {
      // Normal mode: 30 days trial
      subscriptionEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    // Create tenant with plan limits
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        name: businessName,
        slug: businessSlug,
        phone: phone || null,
        email: email || user.email,
        address: address || null,
        city: city || null,
        primary_color: primaryColor || "#8B5CF6",
        secondary_color: secondaryColor || "#D946EF",
        tagline: tagline || null,
        description: description || null,
        subscription_plan: validPlanSlug,
        subscription_expires_at: subscriptionEnd.toISOString(),
        max_stylists: planConfig.max_stylists,
        max_services: planConfig.max_services,
        features: planConfig.features,
        is_active: false,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
      })
      .select()
      .single();

    if (tenantError) {
      logStep("Error creating tenant", { error: tenantError.message });
      throw new Error(`Error al crear el negocio: ${tenantError.message}`);
    }

    logStep("Tenant created", { tenantId: tenant.id, planSlug: validPlanSlug });

    // Assign admin role to user
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: user.id,
        role: "admin",
      });

    if (roleError && !roleError.message.includes("duplicate")) {
      logStep("Warning: Could not assign admin role", { error: roleError.message });
    }

    // Create tenant admin relationship
    const { error: adminError } = await supabaseAdmin
      .from("tenant_admins")
      .insert({
        tenant_id: tenant.id,
        user_id: user.id,
        is_owner: true,
      });

    if (adminError) {
      logStep("Error creating tenant admin", { error: adminError.message });
      throw new Error(`Error al asignar administrador: ${adminError.message}`);
    }

    logStep("Tenant admin created");

    // Create default business hours (Monday to Saturday)
    const defaultHours = [];
    for (let day = 1; day <= 6; day++) {
      defaultHours.push({
        tenant_id: tenant.id,
        day_of_week: day,
        is_open: true,
        open_time: "09:00",
        close_time: "20:00",
        break_start: "14:00",
        break_end: "16:00",
      });
    }
    // Sunday closed
    defaultHours.push({
      tenant_id: tenant.id,
      day_of_week: 0,
      is_open: false,
      open_time: null,
      close_time: null,
      break_start: null,
      break_end: null,
    });

    const { error: hoursError } = await supabaseAdmin
      .from("tenant_business_hours")
      .insert(defaultHours);

    if (hoursError) {
      logStep("Warning: Could not create default hours", { error: hoursError.message });
    }

    logStep("Business provisioned successfully", { 
      tenantId: tenant.id, 
      slug: tenant.slug,
      plan: validPlanSlug,
      maxStylists: planConfig.max_stylists,
      maxServices: planConfig.max_services,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        subscription_plan: validPlanSlug,
        max_stylists: planConfig.max_stylists,
        max_services: planConfig.max_services,
      }
    }), {
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
