import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  name: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${email} (${name})`);

    // Aquí se enviaría el email con Resend cuando esté configurado
    // Por ahora solo registramos el evento
    const emailData = {
      to: email,
      name: name,
      subject: "¡Bienvenida a Cristina Muñoz Peluquería!",
      timestamp: new Date().toISOString(),
    };

    console.log("Welcome email prepared:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email preparado para envío",
        data: emailData 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
