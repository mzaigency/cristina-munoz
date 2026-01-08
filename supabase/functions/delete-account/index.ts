// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create client with user's token to verify identity
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Usuario no autenticado')
    }

    // Create admin client to delete user
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Delete user data from related tables first
    // This will cascade delete related data
    await supabaseAdmin.from('profiles').delete().eq('id', user.id)
    await supabaseAdmin.from('favorites').delete().eq('user_id', user.id)
    await supabaseAdmin.from('follows').delete().eq('follower_id', user.id)
    await supabaseAdmin.from('bookings').delete().eq('user_id', user.id)
    await supabaseAdmin.from('reviews').delete().eq('user_id', user.id)
    await supabaseAdmin.from('notifications').delete().eq('user_id', user.id)
    await supabaseAdmin.from('post_likes').delete().eq('user_id', user.id)
    await supabaseAdmin.from('post_comments').delete().eq('user_id', user.id)

    // Delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      throw new Error('Error al eliminar la cuenta')
    }

    console.log(`User ${user.id} deleted successfully`)

    return new Response(
      JSON.stringify({ success: true, message: 'Cuenta eliminada correctamente' }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error("Error in delete-account:", error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  }
})
