import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROVISION-BUSINESS] ${step}${detailsStr}`);
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
      plan,
      skipStripe,
    } = body;

    logStep("Request body", { businessName, businessSlug, plan, skipStripe });

    // If skipStripe is true, verify user is superadmin
    if (skipStripe) {
      const { data: isSuperadmin } = await supabaseAdmin.rpc('is_superadmin');
      // Also check via direct query since RPC runs with user context
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
    
    if (skipStripe || plan === "demo") {
      // Demo mode: 7 days only
      subscriptionEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      // Normal mode: 30 days trial + plan duration
      const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      subscriptionEnd = plan === "annual" 
        ? new Date(trialEnd.getTime() + 365 * 24 * 60 * 60 * 1000)
        : new Date(trialEnd.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    // Create tenant
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
        subscription_plan: skipStripe ? "demo" : (plan === "annual" ? "annual" : "monthly"),
        subscription_expires_at: subscriptionEnd.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (tenantError) {
      logStep("Error creating tenant", { error: tenantError.message });
      throw new Error(`Error al crear el negocio: ${tenantError.message}`);
    }

    logStep("Tenant created", { tenantId: tenant.id });

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

    logStep("Business provisioned successfully", { tenantId: tenant.id, slug: tenant.slug });

    return new Response(JSON.stringify({ 
      success: true, 
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
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
