import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendAndLogTemplateEmail } from '../_shared/transactional-email-templates/send-and-log.ts';

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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const results = {
      reminders_24h: 0,
      reminders_2h: 0,
      review_requests: 0,
      emails_sent: 0,
      skipped_by_prefs: 0,
      errors: [] as string[],
    };

    // ============================================
    // HELPER: Get user email (from profiles)
    // ============================================
    const getUserEmail = async (userId: string): Promise<string | null> => {
      const { data } = await supabase.from("profiles").select("email").eq("id", userId).single();
      return data?.email || null;
    };

    // ============================================
    // HELPER: Send reminder email via Resend
    // Falla en silencio (log) — el push nunca se bloquea por el email
    // ============================================
    const sendReminderEmail = async (opts: {
      to: string;
      customerName: string;
      tenantName: string;
      whenLabel: string; // "mañana" | "hoy"
      date: string;
      time: string;
    }): Promise<boolean> => {
      if (!resendApiKey) return false;
      const { to, customerName, tenantName, whenLabel, date, time } = opts;
      const html = `
        <div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
          <div style="background:linear-gradient(100deg,#22408C,#98329A);border-radius:16px;padding:28px 24px;text-align:center;">
            <p style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">Recordatorio de tu cita</p>
          </div>
          <div style="padding:24px 8px;color:#131520;font-size:15px;line-height:1.6;">
            <p>Hola ${customerName},</p>
            <p>Te recordamos que <strong>${whenLabel}</strong> tienes cita en <strong>${tenantName}</strong>:</p>
            <div style="background:#f5f6fa;border-radius:12px;padding:16px 20px;margin:16px 0;">
              <p style="margin:0;font-size:16px;"><strong>📅 ${date}</strong></p>
              <p style="margin:4px 0 0;font-size:16px;"><strong>🕐 ${time} h</strong></p>
            </div>
            <p>Si no puedes venir, reprograma o cancela desde tu cuenta — así liberas el hueco para otra persona.</p>
            <p style="text-align:center;margin:24px 0;">
              <a href="https://glowapp.app/mis-citas" style="background:linear-gradient(100deg,#22408C,#98329A);color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:12px;font-weight:600;display:inline-block;">Gestionar mi cita</a>
            </p>
            <p style="color:#676B7E;font-size:12px;text-align:center;margin-top:28px;">Enviado por Glowapp en nombre de ${tenantName}.</p>
          </div>
        </div>`;
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Glowapp <contacto@glowapp.app>",
            reply_to: "gglowapp@gmail.com",
            to: [to],
            subject: `📅 Recordatorio: cita ${whenLabel} a las ${time} en ${tenantName}`,
            html,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("Resend reminder email failed:", res.status, JSON.stringify(err));
          return false;
        }
        results.emails_sent++;
        return true;
      } catch (err) {
        console.error("Resend reminder email error:", err);
        return false;
      }
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
        services,
        compound_part,
        tenants!inner(name, logo_url, address, city, phone, google_maps_url)
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

        // Un servicio compuesto son dos filas (parte 1 y parte 2) de la MISMA
        // visita: solo se avisa por la primera, si no la clienta recibe dos
        // correos y dos avisos para la misma cita.
        if ((booking as any).compound_part === "part2") {
          await supabase.from("bookings").update({ reminder_sent: now.toISOString() }).eq("id", booking.id);
          continue;
        }

        // Check user preferences
        const prefs = await getUserPreferences(booking.user_id);
        if (!prefs.reminder_24h) {
          results.skipped_by_prefs++;
          continue;
        }

        const tenant = booking.tenants as any;
        const tenantName = tenant?.name || "el salón";
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

          const email = await getUserEmail(booking.user_id);
          if (email) {
            try {
              const servicesText = Array.isArray(booking.services)
                ? booking.services.map((s: any) => s?.name).filter(Boolean).join(", ")
                : "";
              await sendAndLogTemplateEmail("booking-reminder-24h", email, {
  idempotencyKey: `booking-reminder-24h-${booking.id}`,
  templateData: {
                    customerName: booking.customer_name || "",
                    tenantName,
                    tenantLogoUrl: tenant?.logo_url ?? null,
                    tenantAddress: tenant?.address ?? null,
                    tenantCity: tenant?.city ?? null,
                    tenantPhone: tenant?.phone ?? null,
                    mapsUrl: tenant?.google_maps_url ?? null,
                    date: formatDate(booking["Fecha"]),
                    time: formattedTime,
                    services: servicesText,
                    manageUrl: "https://glowapp.app/mis-citas",
                  },
});
              results.emails_sent++;
            } catch (emailErr) {
              console.error("Error sending 24h reminder email:", emailErr);
            }
          }

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
        compound_part,
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

        // Parte 2 de un servicio compuesto: misma visita, no se repite el aviso.
        if ((booking as any).compound_part === "part2") {
          await supabase.from("bookings").update({ reminder_2h_sent: now.toISOString() }).eq("id", booking.id);
          continue;
        }

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

          const email = await getUserEmail(booking.user_id);
          if (email) {
            await sendReminderEmail({
              to: email,
              customerName: booking.customer_name || "",
              tenantName,
              whenLabel: "hoy",
              date: formatDate(booking["Fecha"]),
              time: formattedTime,
            });
          }

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
