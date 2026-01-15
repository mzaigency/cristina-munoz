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

interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

// Generate JWT for Google OAuth2
async function createJWT(serviceAccount: ServiceAccount): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: serviceAccount.token_uri,
    iat: now,
    exp: now + 3600, // 1 hour
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signatureInput = `${headerB64}.${payloadB64}`;

  // Import the private key
  const pemContents = serviceAccount.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${signatureInput}.${signatureB64}`;
}

// Get OAuth2 access token from Google
async function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  const jwt = await createJWT(serviceAccount);

  const response = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firebaseServiceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");

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
    if (!firebaseServiceAccountJson) {
      console.log("Firebase not configured. Would send to tokens:", tokens.length);
      return new Response(
        JSON.stringify({ 
          message: "Push notifications not configured (missing FIREBASE_SERVICE_ACCOUNT)", 
          tokens_found: tokens.length 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse service account JSON
    let serviceAccount: ServiceAccount;
    try {
      serviceAccount = JSON.parse(firebaseServiceAccountJson);
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", e);
      return new Response(
        JSON.stringify({ error: "Invalid FIREBASE_SERVICE_ACCOUNT JSON" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get OAuth2 access token
    let accessToken: string;
    try {
      accessToken = await getAccessToken(serviceAccount);
    } catch (e) {
      console.error("Failed to get access token:", e);
      return new Response(
        JSON.stringify({ error: "Failed to authenticate with Firebase" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;

    // Send to each token via FCM v1 API
    const results = await Promise.allSettled(
      tokens.map(async ({ token, platform }) => {
        const message: Record<string, unknown> = {
          message: {
            token: token,
            notification: {
              title,
              body,
            },
            data: {
              ...data,
              click_action: "FLUTTER_NOTIFICATION_CLICK",
            },
          },
        };

        // Add platform-specific configuration
        if (platform === "android") {
          (message.message as Record<string, unknown>).android = {
            priority: "high",
            notification: {
              sound: "default",
              channel_id: "default",
            },
          };
        } else if (platform === "ios") {
          (message.message as Record<string, unknown>).apns = {
            payload: {
              aps: {
                sound: "default",
                badge: 1,
              },
            },
          };
        }

        const response = await fetch(fcmUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify(message),
        });

        const result = await response.json();
        
        // Handle invalid tokens (unregistered devices)
        if (!response.ok) {
          const errorCode = result.error?.details?.[0]?.errorCode;
          if (errorCode === "UNREGISTERED" || errorCode === "INVALID_ARGUMENT") {
            // Remove invalid token
            await supabase
              .from("push_tokens")
              .delete()
              .eq("token", token);
            console.log("Removed invalid token:", token.substring(0, 20));
          }
          throw new Error(result.error?.message || "FCM request failed");
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
