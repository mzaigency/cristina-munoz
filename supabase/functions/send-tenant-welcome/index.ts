import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
  tenantName: string;
  tenantSlug: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, tenantName, tenantSlug, password }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${email} for tenant ${tenantName}`);

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
          <p>Hola ${name}, tu cuenta de administrador está lista.</p>
          <h2>Credenciales:</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Contraseña:</strong> ${password}</p>
          <p>Accede al panel: /salon/${tenantSlug}/admin</p>
          <p>⚠️ Te recomendamos cambiar tu contraseña después del primer inicio de sesión.</p>
        `,
      }),
    });

    const data = await res.json();
    console.log("Email sent:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
