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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the JWT token from the request header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    console.log("Authenticated user:", user.id);

    // Check if user has admin or stylist role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "stylist", "superadmin"]);

    const isAdminOrStylist = roleData && roleData.length > 0;
    console.log("User is admin/stylist:", isAdminOrStylist);

    const requestBody = await req.json();
    const {
      bookingId,
      bookingIds,
      user: cancelUser = "client",
      tenant_id: requestTenantId,
      cancelSeries = false,
    } = requestBody;

    // Handle both single and multiple bookings
    const idsToCancel = bookingIds || [bookingId];
    console.log("Cancelling bookings:", { idsToCancel });

    console.log("cancelSeries:", cancelSeries);

    // Get all booking details before deleting
    const { data: bookings, error: fetchError } = await supabase.from("bookings").select("*").in("id", idsToCancel);

    if (fetchError || !bookings || bookings.length === 0) {
      console.error("Error fetching bookings:", fetchError);
      throw new Error("Bookings not found");
    }

    // Determine tenant_id from the first booking
    const tenantId = requestTenantId || bookings[0].tenant_id;
    console.log("Using tenant_id:", tenantId);

    // Verify ownership: user must own all bookings OR be admin/stylist
    if (!isAdminOrStylist) {
      const unauthorizedBookings = bookings.filter((booking) => booking.user_id !== user.id);
      if (unauthorizedBookings.length > 0) {
        return new Response(JSON.stringify({ error: "No tienes permiso para cancelar esta cita" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }
    }

    console.log("Authorization verified, proceeding with cancellation");

    // Collect all related bookings (compound services) - search BOTH directions
    // Direction 1: bookings that the cancelled ones point to
    const relatedBookingIds = bookings
      .filter((b) => b.is_part_of_compound && b.related_booking_id)
      .map((b) => b.related_booking_id)
      .filter(Boolean);

    let relatedBookings: any[] = [];
    if (relatedBookingIds.length > 0) {
      const { data: related } = await supabase.from("bookings").select("*").in("id", relatedBookingIds);
      relatedBookings = related || [];
    }

    // Direction 2: bookings that point TO the cancelled ones (e.g. part2 pointing to part1)
    const { data: reverseRelated } = await supabase
      .from("bookings")
      .select("*")
      .in("related_booking_id", idsToCancel);
    if (reverseRelated && reverseRelated.length > 0) {
      relatedBookings = [...relatedBookings, ...reverseRelated];
    }
    console.log("Found related bookings (both directions):", relatedBookings.length);

    // If cancelSeries is true, get all future bookings in the same recurrence group
    let seriesBookings: any[] = [];
    const recurrenceGroupId = bookings[0]?.recurrence_group_id;

    if (cancelSeries && recurrenceGroupId) {
      console.log("Cancelling entire series with recurrence_group_id:", recurrenceGroupId);
      const today = new Date().toISOString().split("T")[0];

      const { data: futureSeriesBookings } = await supabase
        .from("bookings")
        .select("*")
        .eq("recurrence_group_id", recurrenceGroupId)
        .gte("Fecha", today)
        .eq("status", "confirmed");

      seriesBookings = futureSeriesBookings || [];
      console.log("Found", seriesBookings.length, "future bookings in series");

      // Also get related bookings for all series bookings
      const seriesRelatedIds = seriesBookings
        .filter((b) => b.is_part_of_compound && b.related_booking_id)
        .map((b) => b.related_booking_id)
        .filter(Boolean);

      if (seriesRelatedIds.length > 0) {
        const { data: seriesRelated } = await supabase.from("bookings").select("*").in("id", seriesRelatedIds);
        relatedBookings = [...relatedBookings, ...(seriesRelated || [])];
      }
    }

    const allBookings = [...bookings, ...relatedBookings, ...seriesBookings];
    // Remove duplicates by id
    const uniqueBookings = allBookings.filter(
      (booking, index, self) => index === self.findIndex((b) => b.id === booking.id),
    );
    const allBookingIds = uniqueBookings.map((b) => b.id);

    // Break foreign key relationships
    await supabase.from("bookings").update({ related_booking_id: null }).in("id", allBookingIds);

    // Delete all bookings from database
    const { error: deleteError } = await supabase.from("bookings").delete().in("id", allBookingIds);

    if (deleteError) {
      console.error("Error deleting bookings:", deleteError);
      throw deleteError;
    }

    console.log("Booking(s) cancelled successfully");

    // Push notifications are used instead of internal messages

    // Check waitlist for availability after cancellation
    try {
      for (const booking of bookings) {
        if (booking.Fecha && booking.tenant_id) {
          // Invoke check-waitlist-availability for each cancelled date
          const functionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/check-waitlist-availability`;
          await fetch(functionUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              tenant_id: booking.tenant_id,
              date: booking.Fecha,
            }),
          });
          console.log("Checked waitlist availability for date:", booking.Fecha);
        }
      }
    } catch (waitlistError) {
      console.error("Error checking waitlist:", waitlistError);
      // Don't fail the cancellation if waitlist check fails
    }

    // Send push notification to tenant admins when CLIENT cancels
    // Use the 'user' param from request body to determine who initiated the cancellation
    const isCancelledByClient = cancelUser === "client";
    console.log("Cancellation notification check:", {
      cancelUser,
      isCancelledByClient,
      bookingsCount: bookings.length,
    });

    if (isCancelledByClient && bookings.length > 0) {
      try {
        const booking = bookings[0];
        console.log("Booking to notify about:", {
          customer_name: booking.customer_name,
          Fecha: booking.Fecha,
          tenantId,
        });
        const { data: tenantAdmins } = await supabase.from("tenant_admins").select("user_id").eq("tenant_id", tenantId);

        if (tenantAdmins && tenantAdmins.length > 0) {
          const dateStr = booking.Fecha.toString();
          const [year, month, day] = dateStr.split("-");
          const formattedDate = `${day}/${month}/${year}`;
          const formattedTime = booking.Hora.slice(0, 5);

          for (const admin of tenantAdmins) {
            await supabase.functions.invoke("send-push-notification", {
              body: {
                user_id: admin.user_id,
                title: "🚫 Cita cancelada",
                body: `${booking.customer_name} canceló su cita del ${formattedDate} a las ${formattedTime}`,
                data: {
                  type: "client_cancellation",
                  tenant_id: tenantId,
                },
              },
            });
          }
          console.log("Cancellation push sent to", tenantAdmins.length, "admin(s)");
        }
      } catch (pushError) {
        console.error("Error sending cancellation push to admin:", pushError);
      }
    }

    // Email de cancelación a la clienta
    try {
      const booking = bookings[0];
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("name, slug, logo_url, phone")
        .eq("id", tenantId)
        .maybeSingle();

      let email: string | null = null;
      if (booking.user_id) {
        const { data: authUser } = await supabase.auth.admin.getUserById(booking.user_id);
        email = authUser?.user?.email ?? null;
      }
      if (!email && booking.Telefono) {
        const { data: clientRow } = await supabase
          .from("clients")
          .select("email")
          .eq("tenant_id", tenantId)
          .eq("phone", booking.Telefono)
          .maybeSingle();
        email = clientRow?.email ?? null;
      }

      if (email) {
        const [y, m, d] = booking.Fecha.toString().split("-");
        const services = Array.isArray(booking.services)
          ? booking.services.map((s: any) => s.name).filter(Boolean).join(", ")
          : "";

        await sendAndLogTemplateEmail("booking-cancelled", email, {
  idempotencyKey: `booking-cancelled-${booking.id}`,
  templateData: {
              customerName: booking.customer_name || "Hola",
              tenantName: tenantData?.name || "el salón",
              tenantLogoUrl: tenantData?.logo_url ?? null,
              tenantPhone: tenantData?.phone ?? null,
              date: `${d}/${m}/${y}`,
              time: booking.Hora?.slice(0, 5) ?? "",
              services,
              cancelledBy: isCancelledByClient ? "cliente" : "salon",
              rebookUrl: tenantData?.slug ? `https://glowapp.app/${tenantData.slug}` : "https://glowapp.app",
            },
});
        console.log("Cancellation email sent");
      }
    } catch (mailErr) {
      console.error("Error sending cancellation email:", mailErr);
    }

    return new Response(JSON.stringify({ success: true, message: "Booking cancelled successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in cancel-booking function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
