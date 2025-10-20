import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string;

const createRecoveryEmailHTML = (recoveryLink: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperar contraseña</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Recuperar contraseña</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hola,</h2>
                  <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                    Aquí tienes el link para cambiar tu contraseña en Cristina Muñoz Peluquería.
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${recoveryLink}" style="background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%); border-radius: 8px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block; padding: 14px 32px;">
                      Cambiar mi contraseña
                    </a>
                  </div>
                  <div style="background-color: #f9f9f9; border-left: 4px solid #8B5CF6; padding: 15px; margin: 30px 0;">
                    <p style="color: #666666; margin: 0; font-size: 14px;">
                      <strong>Importante:</strong> Este enlace es válido por 60 minutos. Si no solicitaste este cambio, ignora este email.
                    </p>
                  </div>
                  <p style="color: #666666; line-height: 1.6; margin: 20px 0 0 0; font-size: 16px;">
                    Un saludo,<br>
                    <strong style="color: #333333;">Cristina Muñoz Peluquería</strong>
                  </p>
                </td>
              </tr>
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

// Función para enviar email con Gmail
async function sendEmailViaGmail(to: string, subject: string, html: string): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  const response = await fetch(`${supabaseUrl}/functions/v1/send-email-gmail`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to, subject, html }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Error llamando a send-email-gmail: ${JSON.stringify(error)}`);
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  
  try {
    const wh = new Webhook(hookSecret);
    const data = wh.verify(payload, headers) as {
      user: { email: string };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
      };
    };

    const { user, email_data } = data;
    const { token_hash, redirect_to, email_action_type } = email_data;

    console.log(`Processing ${email_action_type} email for ${user.email}`);

    // Solo personalizamos emails de recuperación
    if (email_action_type === 'recovery') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const recoveryLink = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=recovery&redirect_to=${redirect_to}`;
      
      const html = createRecoveryEmailHTML(recoveryLink);
      
      // Enviar con Gmail en lugar de devolver JSON
      await sendEmailViaGmail(
        user.email,
        'Recupera tu contraseña - Cristina Muñoz Peluquería',
        html
      );
      
      console.log(`Email de recuperación enviado via Gmail a ${user.email}`);
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Para otros tipos de email, dejamos que Supabase use su plantilla por defecto
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in email hook:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
