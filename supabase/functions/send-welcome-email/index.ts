const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  name: string;
  email: string;
}

const createWelcomeEmailHTML = (name: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenida a Cristina Muñoz Peluquería</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      
      <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 24px; line-height: 1.3;">
        ¡Bienvenida, ${name}!
      </h1>
      
      <p style="color: #404040; font-size: 16px; line-height: 1.6; margin: 16px 0;">
        Nos alegra que te hayas registrado en nuestra peluquería. 
        Estamos aquí para cuidar de tu belleza y bienestar.
      </p>
      
      <div style="margin: 32px 0; padding: 24px; background-color: #f9fafb; border-radius: 8px;">
        <p style="color: #404040; font-size: 16px; line-height: 1.6; margin: 16px 0;">
          <strong>¿Qué puedes hacer ahora?</strong>
        </p>
        <p style="color: #404040; font-size: 16px; line-height: 1.6; margin: 16px 0;">
          • Reservar tu primera cita online<br/>
          • Ver todos nuestros servicios<br/>
          • Gestionar tus citas desde tu perfil<br/>
          • Contactarnos por WhatsApp para cualquier consulta
        </p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="https://cristinamunozperruqueria.es" 
           style="background-color: #e91e63; border-radius: 8px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block; padding: 14px 32px;">
          Reservar tu cita
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

      <p style="color: #404040; font-size: 16px; line-height: 1.6; margin: 16px 0;">
        Si tienes alguna pregunta, no dudes en contactarnos:
      </p>
      
      <p style="color: #404040; font-size: 14px; line-height: 1.8; margin: 16px 0;">
        📞 <strong>Teléfono:</strong> +34 933 70 96 96<br/>
        📍 <strong>Dirección:</strong> C. de Jaume Piquet, 23, 08004 Barcelona<br/>
        💬 <strong>WhatsApp:</strong> Disponible en nuestra web
      </p>

      <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin-top: 48px; text-align: center;">
        <a href="https://cristinamunozperruqueria.es" style="color: #e91e63; text-decoration: none; font-weight: 600;">
          Cristina Muñoz Peluquería
        </a>
        <br/>
        Tu salón de confianza en Barcelona
      </p>
      
    </div>
  </div>
</body>
</html>
  `;
};

const sendEmailWithResend = async (
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; data?: any; error?: any }> => {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured');
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Cristina Muñoz Peluquería <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data };
    }

    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${email} (${name})`);

    const html = createWelcomeEmailHTML(name);

    const result = await sendEmailWithResend(
      email,
      '¡Bienvenida a Cristina Muñoz Peluquería!',
      html
    );

    if (!result.success) {
      console.error('Resend error:', result.error);
      throw new Error(result.error?.message || 'Error al enviar el email');
    }

    console.log('Email sent successfully:', result.data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email enviado correctamente",
        data: result.data 
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

Deno.serve(handler);
