import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-BUSINESS-CHECKOUT] ${step}${detailsStr}`);
};

// Price IDs for subscription plans - 3 tiers
const PRICE_IDS: Record<string, Record<string, string>> = {
  starter: { 
    monthly: "price_1SqgCKRte0Pe7Hk3Zo6Fj68s", 
    annual: "price_1SqgCaRte0Pe7Hk3SEcCaPqa" 
  },
  pro: { 
    monthly: "price_1THkYQRte0Pe7Hk3ilAOSf8h", 
    annual: "price_1SqgDfRte0Pe7Hk33GzDcpQv" 
  },
  business: { 
    monthly: "price_1SqgDiRte0Pe7Hk3pDqSXmuS", 
    annual: "price_1SqgDjRte0Pe7Hk3SVdRX7PI" 
  },
};

// Plan limits
const PLAN_LIMITS: Record<string, { max_stylists: number; max_services: number }> = {
  starter: { max_stylists: 1, max_services: 15 },
  pro: { max_stylists: 3, max_services: 50 },
  business: { max_stylists: 999, max_services: 999 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { planSlug = "starter", billingCycle = "monthly", businessName, businessSlug } = await req.json();
    logStep("Request body parsed", { planSlug, billingCycle, businessName, businessSlug });

    if (!PRICE_IDS[planSlug]) {
      throw new Error(`Invalid plan: ${planSlug}. Must be 'starter', 'pro', or 'business'`);
    }

    if (!["monthly", "annual"].includes(billingCycle)) {
      throw new Error("Invalid billing cycle. Must be 'monthly' or 'annual'");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const priceId = PRICE_IDS[planSlug][billingCycle];
    const limits = PLAN_LIMITS[planSlug];
    logStep("Using price", { priceId, planSlug, billingCycle, limits });

    // Create checkout session with trial period
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 30, // 1 month free trial
        metadata: {
          business_name: businessName,
          business_slug: businessSlug,
          user_id: user.id,
          plan_slug: planSlug,
        },
      },
      metadata: {
        business_name: businessName,
        business_slug: businessSlug,
        user_id: user.id,
        plan_slug: planSlug,
        billing_cycle: billingCycle,
        max_stylists: String(limits.max_stylists),
        max_services: String(limits.max_services),
      },
      success_url: `${req.headers.get("origin")}/onboarding/setup?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/onboarding?canceled=true`,
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
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
