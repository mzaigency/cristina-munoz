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
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenida a Cristina Muñoz Peluquería</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">¡Bienvenida!</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hola ${name},</h2>
                  <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                    ¡Gracias por unirte a Cristina Muñoz Peluquería! Estamos encantadas de tenerte con nosotros.
                  </p>
                  <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                    Ahora puedes reservar tus citas online y gestionarlas fácilmente desde tu cuenta.
                  </p>
                  
                  <div style="background-color: #f9f9f9; border-left: 4px solid #8B5CF6; padding: 15px; margin: 20px 0;">
                    <p style="color: #666666; margin: 0; font-size: 14px;">
                      <strong>¿Necesitas ayuda?</strong><br>
                      Contáctanos en: <a href="tel:+34933709696" style="color: #8B5CF6; text-decoration: none;">933 70 96 96</a>
                    </p>
                  </div>
                  
                  <p style="color: #666666; line-height: 1.6; margin: 20px 0 0 0; font-size: 16px;">
                    Un saludo,<br>
                    <strong style="color: #333333;">Cristina Muñoz</strong>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                  <p style="color: #999999; margin: 0; font-size: 12px;">
                    © 2024 Cristina Muñoz Peluquería. Todos los derechos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
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
