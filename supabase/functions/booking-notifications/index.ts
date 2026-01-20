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
      skipped_by_prefs: 0,
      errors: [] as string[],
    };

    // ============================================
    // HELPER: Get user notification preferences
    // ============================================
    const getUserPreferences = async (userId: string) => {
      const { data } = await supabase
        .from("user_notification_preferences")
        .select("reminder_24h, reminder_2h, review_request")
        .eq("user_id", userId)
        .single();

      // Default to true if no preferences set
      return {
        reminder_24h: data?.reminder_24h ?? true,
        reminder_2h: data?.reminder_2h ?? true,
        review_request: data?.review_request ?? true,
      };
    };

    // ============================================
    // HELPER: Format date as dd/mm/yyyy
    // ============================================
    const formatDate = (dateStr: string): string => {
      const [year, month, day] = dateStr.split("-");
      return `${day}/${month}/${year}`;
    };

    // ============================================
    // HELPER: Format time as HH:MM
    // ============================================
    const formatTime = (timeStr: string): string => {
      if (!timeStr) return "";
      return timeStr.substring(0, 5);
    };

    // ============================================
    // HELPER: Format time for query
    // ============================================
    const formatTimeForQuery = (date: Date): string => {
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}:00`;
    };

    // ============================================
    // 1. RECORDATORIOS 24H ANTES
    // ============================================
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];

    const { data: bookings24h, error: error24h } = await supabase
      .from("bookings")
      .select(
        `
        id,
        user_id,
        customer_name,
        "Fecha",
        "Hora",
        tenant_id,
        tenants!inner(name)
      `,
      )
      .eq("Fecha", tomorrowDate)
      .eq("status", "confirmed")
      .is("reminder_sent", null)
      .not("customer_name", "ilike", "%BLOQUEADO%")
      .not("customer_name", "ilike", "%VACACIONES%");

    if (error24h) {
      console.error("Error fetching 24h bookings:", error24h);
      results.errors.push(`24h fetch: ${error24h.message}`);
    } else if (bookings24h && bookings24h.length > 0) {
      console.log(`Found ${bookings24h.length} bookings for 24h reminder`);

      for (const booking of bookings24h) {
        if (!booking.user_id) continue;

        // Check user preferences
        const prefs = await getUserPreferences(booking.user_id);
        if (!prefs.reminder_24h) {
          results.skipped_by_prefs++;
          continue;
        }

        const tenantName = (booking.tenants as any)?.name || "el salón";
        const formattedTime = formatTime(booking["Hora"]);

        try {
          await supabase.functions.invoke("send-push-notification", {
            body: {
              user_id: booking.user_id,
              title: "📅 Recordatorio de cita",
              body: `Mañana tienes cita en ${tenantName} a las ${formattedTime}`,
              data: { type: "reminder_24h", booking_id: booking.id },
            },
          });

          await supabase.from("bookings").update({ reminder_sent: now.toISOString() }).eq("id", booking.id);

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
      .select(
        `
        id,
        user_id,
        customer_name,
        "Fecha",
        "Hora",
        tenant_id,
        tenants!inner(name)
      `,
      )
      .eq("Fecha", todayDate)
      .eq("status", "confirmed")
      .is("reminder_2h_sent", null)
      .gte("Hora", timeFrom)
      .lte("Hora", timeTo)
      .not("customer_name", "ilike", "%BLOQUEADO%")
      .not("customer_name", "ilike", "%VACACIONES%");

    if (error2h) {
      console.error("Error fetching 2h bookings:", error2h);
      results.errors.push(`2h fetch: ${error2h.message}`);
    } else if (bookings2h && bookings2h.length > 0) {
      console.log(`Found ${bookings2h.length} bookings for 2h reminder`);

      for (const booking of bookings2h) {
        if (!booking.user_id) continue;

        // Check user preferences
        const prefs = await getUserPreferences(booking.user_id);
        if (!prefs.reminder_2h) {
          results.skipped_by_prefs++;
          continue;
        }

        const tenantName = (booking.tenants as any)?.name || "el salón";
        const formattedTime = formatTime(booking["Hora"]);

        try {
          await supabase.functions.invoke("send-push-notification", {
            body: {
              user_id: booking.user_id,
              title: "⏰ Tu cita es en 2 horas",
              body: `No olvides tu cita en ${tenantName} a las ${formattedTime}`,
              data: { type: "reminder_2h", booking_id: booking.id },
            },
          });

          await supabase.from("bookings").update({ reminder_2h_sent: now.toISOString() }).eq("id", booking.id);

          results.reminders_2h++;
        } catch (err) {
          console.error(`Error sending 2h reminder for booking ${booking.id}:`, err);
          results.errors.push(`2h send ${booking.id}: ${err}`);
        }
      }
    }

    // ============================================
    // 3. SOLICITUDES DE RESEÑA (2-3h después de la cita)
    // ============================================
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const reviewTimeFrom = formatTimeForQuery(threeHoursAgo);
    const reviewTimeTo = formatTimeForQuery(twoHoursAgo);

    const { data: completedBookings, error: errorReview } = await supabase
      .from("bookings")
      .select(
        `
        id,
        user_id,
        customer_name,
        "Fecha",
        "Hora",
        end_time,
        total_duration,
        tenant_id,
        tenants!inner(name, slug)
      `,
      )
      .eq("Fecha", todayDate)
      .in("status", ["confirmed", "completed"])
      .is("review_request_sent", null)
      .not("customer_name", "ilike", "%BLOQUEADO%")
      .not("customer_name", "ilike", "%VACACIONES%");

    if (errorReview) {
      console.error("Error fetching review bookings:", errorReview);
      results.errors.push(`review fetch: ${errorReview.message}`);
    } else if (completedBookings && completedBookings.length > 0) {
      for (const booking of completedBookings) {
        if (!booking.user_id) continue;

        // Calculate when booking ended
        const [hours, minutes] = booking["Hora"].split(":").map(Number);
        const bookingStart = new Date(booking["Fecha"]);
        bookingStart.setHours(hours, minutes, 0, 0);

        const duration = booking.total_duration || 60; // Default 1 hour
        const bookingEnd = new Date(bookingStart.getTime() + duration * 60 * 1000);

        const timeSinceEnd = now.getTime() - bookingEnd.getTime();
        const hoursSinceEnd = timeSinceEnd / (1000 * 60 * 60);

        // Only send if ended 2-3 hours ago
        if (hoursSinceEnd < 2 || hoursSinceEnd > 3) continue;

        // Check user preferences
        const prefs = await getUserPreferences(booking.user_id);
        if (!prefs.review_request) {
          results.skipped_by_prefs++;
          continue;
        }

        const tenantName = (booking.tenants as any)?.name || "el salón";
        const tenantSlug = (booking.tenants as any)?.slug || "";

        try {
          await supabase.functions.invoke("send-push-notification", {
            body: {
              user_id: booking.user_id,
              title: "⭐ ¿Qué tal tu experiencia?",
              body: `Cuéntanos cómo te fue en ${tenantName}`,
              data: {
                type: "review_request",
                booking_id: booking.id,
                tenant_slug: tenantSlug,
              },
            },
          });

          await supabase.from("bookings").update({ review_request_sent: now.toISOString() }).eq("id", booking.id);

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
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
