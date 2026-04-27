import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function formatDateSpanish(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDate();
  const months = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  return `${day} de ${months[date.getMonth()]}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);

    // Authenticate caller (admin/stylist of tenant)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = userData.user.id;

    const body = await req.json();
    const { waitlist_id, proposed_date, proposed_time, proposed_stylist_id } =
      body;

    if (!waitlist_id || !proposed_date || !proposed_time) {
      return new Response(
        JSON.stringify({
          error: "waitlist_id, proposed_date and proposed_time are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Load waitlist entry
    const { data: entry, error: entryErr } = await supabase
      .from("waitlist")
      .select("*")
      .eq("id", waitlist_id)
      .single();

    if (entryErr || !entry) {
      return new Response(JSON.stringify({ error: "Waitlist not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin/stylist of this tenant
    const { data: isAdmin } = await supabase
      .from("tenant_admins")
      .select("id")
      .eq("tenant_id", entry.tenant_id)
      .eq("user_id", callerId)
      .maybeSingle();

    const { data: isStylist } = await supabase
      .from("tenant_stylists")
      .select("id")
      .eq("tenant_id", entry.tenant_id)
      .eq("user_id", callerId)
      .eq("is_active", true)
      .maybeSingle();

    if (!isAdmin && !isStylist) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Tenant info
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name, slug")
      .eq("id", entry.tenant_id)
      .single();

    const tenantName = tenant?.name || "el salón";
    const tenantSlug = tenant?.slug || "";

    // Update waitlist as proposed (24h to accept)
    const proposedAt = new Date();
    const proposedExpires = new Date(proposedAt.getTime() + 24 * 60 * 60 * 1000);

    const { error: updErr } = await supabase
      .from("waitlist")
      .update({
        status: "proposed",
        proposed_date,
        proposed_time,
        proposed_stylist_id: proposed_stylist_id || null,
        proposed_at: proposedAt.toISOString(),
        proposed_expires_at: proposedExpires.toISOString(),
        notified_at: proposedAt.toISOString(),
      })
      .eq("id", waitlist_id);

    if (updErr) throw updErr;

    const formattedDate = formatDateSpanish(proposed_date);
    const timeShort = String(proposed_time).slice(0, 5);

    // If client has user account → push + chat message
    if (entry.user_id) {
      // Get or create conversation
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .eq("tenant_id", entry.tenant_id)
        .eq("user_id", entry.user_id)
        .maybeSingle();

      let conversationId = existingConv?.id;
      if (!conversationId) {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({ tenant_id: entry.tenant_id, user_id: entry.user_id })
          .select("id")
          .single();
        conversationId = newConv?.id;
      }

      if (conversationId) {
        await supabase.from("direct_messages").insert({
          conversation_id: conversationId,
          sender_id: entry.tenant_id,
          sender_type: "salon",
          content: `🎉 ¡Tenemos un hueco para ti!\n\n📅 ${formattedDate} a las ${timeShort}\n\nResponde aquí o entra en "Mis citas" para confirmar antes de 24h.`,
          message_type: "waitlist_proposal",
          metadata: {
            waitlist_id,
            proposed_date,
            proposed_time,
          },
        });

        // Bump conversation
        await supabase
          .from("conversations")
          .update({
            last_message_at: new Date().toISOString(),
            unread_count_user: 1,
          })
          .eq("id", conversationId);
      }

      // In-app notification
      await supabase.from("notifications").insert({
        user_id: entry.user_id,
        tenant_id: entry.tenant_id,
        type: "waitlist_proposal",
        title: "¡Hueco disponible para ti!",
        message: `${tenantName} te propone el ${formattedDate} a las ${timeShort}. Tienes 24h para confirmar.`,
        metadata: {
          waitlist_id,
          proposed_date,
          proposed_time,
        },
        action_url: "/mis-citas?tab=waitlist",
      });

      // Push notification (via existing function)
      try {
        await supabase.functions.invoke("send-push-notification", {
          body: {
            user_id: entry.user_id,
            title: "¡Hueco disponible! 🎉",
            body: `${tenantName} te propone el ${formattedDate} a las ${timeShort}`,
            data: { url: "/mis-citas?tab=waitlist", waitlist_id },
          },
        });
      } catch (pushErr) {
        console.error("Push notification failed:", pushErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        has_user: !!entry.user_id,
        client_phone: entry.client_phone,
        tenant_slug: tenantSlug,
        formatted_date: formattedDate,
        formatted_time: timeShort,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("propose-waitlist-slot error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
