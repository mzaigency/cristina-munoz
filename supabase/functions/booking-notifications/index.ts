import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const results = {
      reminders_24h: 0,
      reminders_2h: 0,
      review_requests: 0,
      errors: [] as string[],
    };

    // ============================================
    // 1. RECORDATORIOS 24H ANTES
    // ============================================
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];

    const { data: bookings24h, error: error24h } = await supabase
      .from("bookings")
      .select(`
        id,
        user_id,
        customer_name,
        "Fecha",
        "Hora",
        tenant_id,
        tenants!inner(name)
      `)
      .eq("Fecha", tomorrowDate)
      .eq("status", "confirmed")
      .eq("reminder_sent", false)
      .not("customer_name", "ilike", "%BLOQUEADO%")
      .not("customer_name", "ilike", "%VACACIONES%");

    if (error24h) {
      console.error("Error fetching 24h bookings:", error24h);
      results.errors.push(`24h fetch: ${error24h.message}`);
    } else if (bookings24h && bookings24h.length > 0) {
      for (const booking of bookings24h) {
        if (!booking.user_id) continue;

        const tenantName = (booking.tenants as any)?.name || "el salón";
        const formattedDate = formatDate(booking["Fecha"]);
        const formattedTime = formatTime(booking["Hora"]);

        try {
          // Enviar push notification
          await sendPushNotification(supabaseUrl, supabaseServiceKey, {
            user_id: booking.user_id,
            title: "📅 Recordatorio de cita",
            body: `Mañana tienes cita en ${tenantName} a las ${formattedTime}`,
            data: { type: "reminder_24h", booking_id: booking.id },
          });

          // Marcar como enviado
          await supabase
            .from("bookings")
            .update({ reminder_sent: true })
            .eq("id", booking.id);

          results.reminders_24h++;
        } catch (err) {
          console.error(`Error sending 24h reminder for booking ${booking.id}:`, err);
          results.errors.push(`24h send ${booking.id}: ${err}`);
        }
      }
    }

    // ============================================
    // 2. RECORDATORIOS 2H ANTES
    // ============================================
    const todayDate = now.toISOString().split("T")[0];
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const timeFrom = formatTimeForQuery(twoHoursLater);
    const timeTo = formatTimeForQuery(threeHoursLater);

    const { data: bookings2h, error: error2h } = await supabase
      .from("bookings")
      .select(`
        id,
        user_id,
        customer_name,
        "Fecha",
        "Hora",
        tenant_id,
        tenants!inner(name)
      `)
      .eq("Fecha", todayDate)
      .eq("status", "confirmed")
      .eq("reminder_2h_sent", false)
      .gte("Hora", timeFrom)
      .lte("Hora", timeTo)
      .not("customer_name", "ilike", "%BLOQUEADO%")
      .not("customer_name", "ilike", "%VACACIONES%");

    if (error2h) {
      console.error("Error fetching 2h bookings:", error2h);
      results.errors.push(`2h fetch: ${error2h.message}`);
    } else if (bookings2h && bookings2h.length > 0) {
      for (const booking of bookings2h) {
        if (!booking.user_id) continue;

        const tenantName = (booking.tenants as any)?.name || "el salón";
        const formattedTime = formatTime(booking["Hora"]);

        try {
          await sendPushNotification(supabaseUrl, supabaseServiceKey, {
            user_id: booking.user_id,
            title: "⏰ Tu cita es en 2 horas",
            body: `No olvides tu cita en ${tenantName} a las ${formattedTime}`,
            data: { type: "reminder_2h", booking_id: booking.id },
          });

          await supabase
            .from("bookings")
            .update({ reminder_2h_sent: true })
            .eq("id", booking.id);

          results.reminders_2h++;
        } catch (err) {
          console.error(`Error sending 2h reminder for booking ${booking.id}:`, err);
          results.errors.push(`2h send ${booking.id}: ${err}`);
        }
      }
    }

    // ============================================
    // 3. SOLICITUDES DE RESEÑA (2h después de la cita)
    // ============================================
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    const reviewTimeFrom = formatTimeForQuery(threeHoursAgo);
    const reviewTimeTo = formatTimeForQuery(twoHoursAgo);

    const { data: completedBookings, error: errorReview } = await supabase
      .from("bookings")
      .select(`
        id,
        user_id,
        customer_name,
        "Fecha",
        "Hora",
        end_time,
        tenant_id,
        tenants!inner(name, slug)
      `)
      .eq("Fecha", todayDate)
      .in("status", ["confirmed", "completed"])
      .eq("review_request_sent", false)
      .not("customer_name", "ilike", "%BLOQUEADO%")
      .not("customer_name", "ilike", "%VACACIONES%");

    if (errorReview) {
      console.error("Error fetching review bookings:", errorReview);
      results.errors.push(`review fetch: ${errorReview.message}`);
    } else if (completedBookings && completedBookings.length > 0) {
      for (const booking of completedBookings) {
        if (!booking.user_id) continue;

        // Calcular si la cita terminó hace ~2 horas
        const endTimeStr = booking.end_time || booking["Hora"];
        const bookingEndTime = parseTimeToDate(todayDate, endTimeStr);
        const timeSinceEnd = now.getTime() - bookingEndTime.getTime();
        const hoursSinceEnd = timeSinceEnd / (1000 * 60 * 60);

        // Solo enviar si terminó hace 2-3 horas
        if (hoursSinceEnd < 2 || hoursSinceEnd > 3) continue;

        const tenantName = (booking.tenants as any)?.name || "el salón";
        const tenantSlug = (booking.tenants as any)?.slug || "";

        try {
          await sendPushNotification(supabaseUrl, supabaseServiceKey, {
            user_id: booking.user_id,
            title: "⭐ ¿Qué tal tu experiencia?",
            body: `Cuéntanos cómo te fue en ${tenantName}`,
            data: { 
              type: "review", 
              booking_id: booking.id,
              tenant_slug: tenantSlug,
            },
          });

          await supabase
            .from("bookings")
            .update({ review_request_sent: true })
            .eq("id", booking.id);

          results.review_requests++;
        } catch (err) {
          console.error(`Error sending review request for booking ${booking.id}:`, err);
          results.errors.push(`review send ${booking.id}: ${err}`);
        }
      }
    }

    console.log("Booking notifications processed:", results);

    return new Response(JSON.stringify({ success: true, ...results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in booking-notifications:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function sendPushNotification(
  supabaseUrl: string,
  serviceKey: string,
  payload: { user_id: string; title: string; body: string; data?: Record<string, string> }
) {
  const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Push notification failed: ${errorText}`);
  }

  return response.json();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  // Asume formato HH:MM:SS o HH:MM
  return timeStr.substring(0, 5);
}

function formatTimeForQuery(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}:00`;
}

function parseTimeToDate(dateStr: string, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date(dateStr);
  date.setHours(hours, minutes, 0, 0);
  return date;
}
