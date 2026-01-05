import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const APP_URL = 'https://www.glowapp.app'

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email es requerido' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    // Always return success to prevent email enumeration
    if (!profile) {
      console.log('Password reset requested for non-existent email:', email)
      return new Response(
        JSON.stringify({ success: true, message: 'Si el email existe, recibirás un enlace de recuperación' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      )
    }

    // Check rate limit
    const { data: canReset } = await supabase.rpc('check_password_reset_rate_limit', { 
      user_email: email.toLowerCase() 
    })

    if (!canReset) {
      console.log('Rate limit exceeded for:', email)
      return new Response(
        JSON.stringify({ error: 'Demasiados intentos. Espera unas horas antes de intentar de nuevo.' }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      )
    }

    // Generate unique token
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Store token
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: profile.id,
        email: email.toLowerCase(),
        token,
        expires_at: expiresAt.toISOString()
      })

    if (insertError) {
      console.error('Error storing reset token:', insertError)
      throw new Error('Error al procesar la solicitud')
    }

    // Send email via send-email function
    const resetLink = `${APP_URL}/nueva-contrasena?token=${token}`
    
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        type: 'password-reset',
        to: email,
        data: {
          userName: profile.full_name || 'usuario',
          resetLink
        }
      })
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Error sending email:', errorData)
      throw new Error('Error al enviar el email')
    }

    console.log('Password reset email sent to:', email)

    return new Response(
      JSON.stringify({ success: true, message: 'Si el email existe, recibirás un enlace de recuperación' }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error("Error in request-password-reset:", error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    )
  }
})
