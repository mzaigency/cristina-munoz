import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationRequest {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firebaseServerKey = Deno.env.get("FIREBASE_SERVER_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, title, body, data }: PushNotificationRequest = await req.json();

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, title, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's push tokens
    const { data: tokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("token, platform")
      .eq("user_id", user_id);

    if (tokensError) {
      console.error("Error fetching tokens:", tokensError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch push tokens" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log("No push tokens found for user:", user_id);
      return new Response(
        JSON.stringify({ message: "No push tokens registered for this user", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If Firebase is not configured, just log and return
    if (!firebaseServerKey) {
      console.log("Firebase not configured. Would send to tokens:", tokens.length);
      return new Response(
        JSON.stringify({ 
          message: "Push notifications not configured (missing FIREBASE_SERVER_KEY)", 
          tokens_found: tokens.length 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send to each token via FCM
    const results = await Promise.allSettled(
      tokens.map(async ({ token, platform }) => {
        const message = {
          to: token,
          notification: {
            title,
            body,
            sound: "default",
            badge: 1,
          },
          data: {
            ...data,
            click_action: "FLUTTER_NOTIFICATION_CLICK",
          },
          // iOS specific
          apns: {
            payload: {
              aps: {
                sound: "default",
                badge: 1,
              },
            },
          },
          // Android specific
          android: {
            priority: "high",
            notification: {
              sound: "default",
              channelId: "default",
            },
          },
        };

        const response = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `key=${firebaseServerKey}`,
          },
          body: JSON.stringify(message),
        });

        const result = await response.json();
        
        // Handle invalid tokens (unregistered devices)
        if (result.failure === 1 && result.results?.[0]?.error === "NotRegistered") {
          // Remove invalid token
          await supabase
            .from("push_tokens")
            .delete()
            .eq("token", token);
          console.log("Removed invalid token:", token.substring(0, 20));
        }

        return { token: token.substring(0, 20), platform, result };
      })
    );

    const successful = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

    console.log(`Push notifications sent: ${successful} success, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        message: "Push notifications processed",
        sent: successful,
        failed,
        details: results
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-push-notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
