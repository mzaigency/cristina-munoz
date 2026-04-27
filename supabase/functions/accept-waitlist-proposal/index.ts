import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);

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

    const userId = userData.user.id;
    const { waitlist_id, action } = await req.json();

    if (!waitlist_id || !action) {
      return new Response(
        JSON.stringify({ error: "waitlist_id and action required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: entry, error: entryErr } = await supabase
      .from("waitlist")
      .select("*")
      .eq("id", waitlist_id)
      .single();

    if (entryErr || !entry) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (entry.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (entry.status !== "proposed") {
      return new Response(
        JSON.stringify({ error: "No hay propuesta activa" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check expiration
    if (
      entry.proposed_expires_at &&
      new Date(entry.proposed_expires_at) < new Date()
    ) {
      await supabase
        .from("waitlist")
        .update({ status: "waiting" })
        .eq("id", waitlist_id);
      return new Response(JSON.stringify({ error: "La propuesta ha expirado" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reject") {
      await supabase
        .from("waitlist")
        .update({
          status: "waiting",
          proposed_date: null,
          proposed_time: null,
          proposed_stylist_id: null,
          proposed_at: null,
          proposed_expires_at: null,
        })
        .eq("id", waitlist_id);

      // Notify salon admin
      const { data: admins } = await supabase
        .from("tenant_admins")
        .select("user_id")
        .eq("tenant_id", entry.tenant_id);

      if (admins && admins.length > 0) {
        const notifications = admins.map((a) => ({
          user_id: a.user_id,
          tenant_id: entry.tenant_id,
          type: "waitlist_rejected",
          title: "Propuesta rechazada",
          message: `${entry.client_name} ha rechazado el hueco propuesto. Sigue en lista de espera.`,
          metadata: { waitlist_id },
          action_url: "/admin?tab=waitlist",
        }));
        await supabase.from("notifications").insert(notifications);
      }

      return new Response(JSON.stringify({ success: true, action: "rejected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Accept → create booking
    const proposedDate = entry.proposed_date;
    const proposedTime = entry.proposed_time;
    const stylistId = entry.proposed_stylist_id;

    if (!proposedDate || !proposedTime) {
      return new Response(JSON.stringify({ error: "Propuesta inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve stylist slug
    let stylistSlug = "any";
    if (stylistId) {
      const { data: st } = await supabase
        .from("tenant_stylists")
        .select("slug")
        .eq("id", stylistId)
        .single();
      stylistSlug = st?.slug || "any";
    } else {
      const { data: anyStylist } = await supabase
        .from("tenant_stylists")
        .select("slug")
        .eq("tenant_id", entry.tenant_id)
        .eq("is_active", true)
        .limit(1)
        .single();
      stylistSlug = anyStylist?.slug || "any";
    }

    // Calculate duration
    let totalDuration = 60;
    const services = Array.isArray(entry.services) ? entry.services : [];
    if (services.length > 0) {
      totalDuration = services.reduce(
        (sum: number, s: any) =>
          sum + (s.duration || s.total_duration || s.duration_part1_active || 30),
        0
      );
    }

    // Verify slot still free (basic check)
    const { data: conflicts } = await supabase
      .from("bookings")
      .select("Hora, total_duration, stylist")
      .eq("tenant_id", entry.tenant_id)
      .eq("Fecha", proposedDate)
      .eq("status", "confirmed")
      .eq("stylist", stylistSlug);

    const proposedStart = timeToMinutes(String(proposedTime).slice(0, 5));
    const proposedEnd = proposedStart + totalDuration;
    const hasConflict = (conflicts || []).some((b: any) => {
      const bStart = timeToMinutes(b.Hora.slice(0, 5));
      const bEnd = bStart + (b.total_duration || 60);
      return proposedStart < bEnd && proposedEnd > bStart;
    });

    if (hasConflict) {
      return new Response(
        JSON.stringify({
          error: "El hueco ya no está disponible. Vuelve a esperar otro hueco.",
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Customer name from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", userId)
      .single();

    const customerName = profile?.full_name || entry.client_name || "Cliente";
    const customerPhone = profile?.phone || entry.client_phone || "";

    const endTime = minutesToTime(proposedEnd);

    const { data: booking, error: bookErr } = await supabase
      .from("bookings")
      .insert({
        tenant_id: entry.tenant_id,
        user_id: userId,
        customer_name: customerName,
        Telefono: customerPhone,
        Fecha: proposedDate,
        Hora: String(proposedTime).slice(0, 5),
        end_time: endTime,
        services,
        stylist: stylistSlug,
        total_duration: totalDuration,
        status: "confirmed",
        canal: "waitlist",
        notes: "Reserva desde lista de espera",
        skip_availability_check: true,
      })
      .select("id")
      .single();

    if (bookErr) throw bookErr;

    // Mark waitlist as booked
    await supabase
      .from("waitlist")
      .update({ status: "booked" })
      .eq("id", waitlist_id);

    // Notify salon admins
    const { data: admins } = await supabase
      .from("tenant_admins")
      .select("user_id")
      .eq("tenant_id", entry.tenant_id);

    if (admins && admins.length > 0) {
      const notifications = admins.map((a) => ({
        user_id: a.user_id,
        tenant_id: entry.tenant_id,
        type: "waitlist_accepted",
        title: "¡Reserva confirmada desde lista de espera!",
        message: `${customerName} ha aceptado el hueco del ${proposedDate} a las ${String(proposedTime).slice(0, 5)}.`,
        metadata: { waitlist_id, booking_id: booking.id },
        action_url: "/admin?tab=agenda",
      }));
      await supabase.from("notifications").insert(notifications);
    }

    return new Response(
      JSON.stringify({
        success: true,
        action: "accepted",
        booking_id: booking.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("accept-waitlist-proposal error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
