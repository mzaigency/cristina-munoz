import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeo de planes a price IDs de Stripe
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

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPGRADE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { tenantId, planSlug, billingCycle = "monthly" } = await req.json();
    logStep("Request body parsed", { tenantId, planSlug, billingCycle });

    if (!tenantId || !planSlug) {
      throw new Error("Missing required fields: tenantId and planSlug");
    }

    if (!PRICE_IDS[planSlug]) {
      throw new Error(`Invalid plan: ${planSlug}`);
    }

    const priceId = PRICE_IDS[planSlug][billingCycle];
    if (!priceId) {
      throw new Error(`Invalid billing cycle: ${billingCycle}`);
    }
    logStep("Price ID resolved", { priceId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Buscar cliente existente
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    // Crear sesión de checkout
    const origin = req.headers.get("origin") || "https://cristina-munoz.lovable.app";
    
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
      success_url: `${origin}/admin?upgrade=success&plan=${planSlug}`,
      cancel_url: `${origin}/admin?upgrade=canceled`,
      metadata: {
        tenant_id: tenantId,
        user_id: user.id,
        plan_slug: planSlug,
        billing_cycle: billingCycle,
      },
      subscription_data: {
        metadata: {
          tenant_id: tenantId,
          plan_slug: planSlug,
        },
      },
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
