import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ProvisionTenantAdminRequest = {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  email: string;
  name: string;
  password: string;
  sendWelcomeEmail?: boolean;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ProvisionTenantAdminRequest;
    const {
      tenantId,
      tenantName,
      tenantSlug,
      email,
      name,
      password,
      sendWelcomeEmail = true,
    } = body;

    if (!tenantId || !email || !password || !tenantName || !tenantSlug) {
      return new Response(
        JSON.stringify({ success: false, error: "Faltan campos obligatorios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Backend no configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify caller is superadmin (user-context client)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: isSuperadmin, error: isSuperadminError } = await userClient.rpc(
      "is_superadmin"
    );

    if (isSuperadminError || !isSuperadmin) {
      return new Response(JSON.stringify({ success: false, error: "Acceso denegado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client (admin operations)
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: created, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name || tenantName },
      });

    if (createUserError || !created?.user?.id) {
      const msg = createUserError?.message || "No se pudo crear el usuario";
      const status = msg.toLowerCase().includes("already") ? 409 : 500;
      return new Response(JSON.stringify({ success: false, error: msg }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = created.user.id;

    // Ensure profile exists
    await adminClient.from("profiles").upsert(
      {
        id: userId,
        email,
        full_name: name || tenantName,
      },
      { onConflict: "id" }
    );

    // Assign role + link to tenant
    const { error: roleError } = await adminClient.from("user_roles").insert({
      user_id: userId,
      role: "admin",
    });

    if (roleError) {
      return new Response(JSON.stringify({ success: false, error: roleError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: tenantAdminError } = await adminClient
      .from("tenant_admins")
      .insert({ tenant_id: tenantId, user_id: userId, is_owner: true });

    if (tenantAdminError) {
      return new Response(
        JSON.stringify({ success: false, error: tenantAdminError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send welcome email (optional)
    let emailSent = false;
    let emailError: string | null = null;

    if (sendWelcomeEmail) {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (!RESEND_API_KEY) {
        emailError = "RESEND_API_KEY no configurada";
      } else {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Lovable <onboarding@resend.dev>",
              to: [email],
              subject: `¡Bienvenido a ${tenantName}! - Tu cuenta de administrador`,
              html: `
                <h1>¡Bienvenido a ${tenantName}!</h1>
                <p>Hola ${name || tenantName}, tu cuenta de administrador está lista.</p>
                <h2>Credenciales:</h2>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Contraseña:</strong> ${password}</p>
                <p>Panel de administración: /admin/${tenantSlug}</p>
                <p>Web pública: /salon/${tenantSlug}</p>
                <p>⚠️ Te recomendamos cambiar tu contraseña después del primer inicio de sesión.</p>
              `,
            }),
          });

          if (!res.ok) {
            const t = await res.text();
            emailError = `Error enviando email: ${res.status} ${t}`;
          } else {
            emailSent = true;
          }
        } catch (e) {
          emailError = e instanceof Error ? e.message : "Error enviando email";
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        emailSent,
        emailError,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("provision-tenant-admin error:", e);
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : "Error desconocido",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
