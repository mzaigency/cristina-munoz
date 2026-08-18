import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WaitlistEntry {
  id: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  user_id: string | null;
  preferred_date: string | null;
  preferred_time_start: string | null;
  preferred_time_end: string | null;
  preferred_stylist_id: string | null;
  services: any[];
  tenant_id: string;
}

interface BookedSlot {
  Hora: string;
  total_duration: number;
  stylist: string;
}

function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function formatDateSpanish(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${day} de ${months[date.getMonth()]}`;
}

async function getOrCreateConversation(
  supabase: any, 
  tenantId: string, 
  userId: string
): Promise<string | null> {
  try {
    // Check if conversation already exists
    const { data: existing, error: fetchError } = await supabase
      .from("conversations")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching conversation:", fetchError);
      return null;
    }

    if (existing) {
      return existing.id;
    }

    // Create new conversation
    const { data: newConvo, error: createError } = await supabase
      .from("conversations")
      .insert({
        tenant_id: tenantId,
        user_id: userId,
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Error creating conversation:", createError);
      return null;
    }

    return newConvo.id;
  } catch (err) {
    console.error("Error in getOrCreateConversation:", err);
    return null;
  }
}

async function sendDirectMessage(
  supabase: any,
  conversationId: string,
  tenantId: string,
  message: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("direct_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: tenantId,
        sender_type: "salon",
        content: message,
        message_type: "waitlist_availability",
      });

    if (error) {
      console.error("Error sending direct message:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error in sendDirectMessage:", err);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { tenant_id, date } = await req.json();
    console.log(`Checking waitlist availability for tenant ${tenant_id} on ${date}`);

    if (!tenant_id || !date) {
      return new Response(
        JSON.stringify({ error: "tenant_id and date are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tenant name for the message
    const { data: tenantData } = await supabase
      .from("tenants")
      .select("name, slug, logo_url")
      .eq("id", tenant_id)
      .single();

    const tenantName = tenantData?.name || "el salón";
    const tenantSlug = tenantData?.slug || "";

    // Get waitlist entries for this tenant that match the date
    const { data: waitlistEntries, error: waitlistError } = await supabase
      .from("waitlist")
      .select("*")
      .eq("tenant_id", tenant_id)
      .eq("status", "waiting")
      .or(`preferred_date.is.null,preferred_date.eq.${date}`)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });

    if (waitlistError) throw waitlistError;
    
    console.log(`Found ${waitlistEntries?.length || 0} waitlist entries`);
    
    if (!waitlistEntries || waitlistEntries.length === 0) {
      return new Response(
        JSON.stringify({ message: "No waitlist entries to check", notified: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get business hours for the day
    const dayOfWeek = new Date(date).getDay();
    const { data: businessHours } = await supabase
      .from("tenant_business_hours")
      .select("*")
      .eq("tenant_id", tenant_id)
      .eq("day_of_week", dayOfWeek)
      .single();

    if (!businessHours || !businessHours.is_open) {
      return new Response(
        JSON.stringify({ message: "Business is closed on this day", notified: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all bookings for this date
    const { data: bookings } = await supabase
      .from("bookings")
      .select("Hora, total_duration, stylist")
      .eq("tenant_id", tenant_id)
      .eq("Fecha", date)
      .eq("status", "confirmed");

    const bookedSlots: BookedSlot[] = bookings || [];

    // Get active stylists
    const { data: stylists } = await supabase
      .from("tenant_stylists")
      .select("id, slug, name")
      .eq("tenant_id", tenant_id)
      .eq("is_active", true);

    if (!stylists || stylists.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active stylists", notified: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate available slots
    const openTime = timeStringToMinutes(businessHours.open_time || "09:00");
    const closeTime = timeStringToMinutes(businessHours.close_time || "20:00");
    const slotInterval = 15; // 15 minute slots

    const notifiedEntries: string[] = [];
    const messagesDelivered: string[] = [];

    for (const entry of waitlistEntries as WaitlistEntry[]) {
      // Estimate duration from services or use default
      let estimatedDuration = 60;
      if (entry.services && Array.isArray(entry.services)) {
        estimatedDuration = entry.services.reduce((sum: number, s: any) => {
          return sum + (s.duration || s.duration_part1_active || 30);
        }, 0);
      }

      // Check each stylist for availability
      const preferredStylistId = entry.preferred_stylist_id;
      const stylistsToCheck = preferredStylistId 
        ? stylists.filter(s => s.id === preferredStylistId)
        : stylists;

      let foundSlot = false;
      let availableSlotTime = "";
      let availableStylistId: string | null = null;


      for (const stylist of stylistsToCheck) {
        // Get bookings for this stylist
        const stylistBookings = bookedSlots.filter(b => b.stylist === stylist.slug);
        
        // Check each time slot
        for (let slotStart = openTime; slotStart + estimatedDuration <= closeTime; slotStart += slotInterval) {
          const slotEnd = slotStart + estimatedDuration;
          
          // Check time preference
          if (entry.preferred_time_start) {
            const prefStart = timeStringToMinutes(entry.preferred_time_start);
            if (slotStart < prefStart) continue;
          }
          if (entry.preferred_time_end) {
            const prefEnd = timeStringToMinutes(entry.preferred_time_end);
            if (slotEnd > prefEnd) continue;
          }

          // Check for conflicts
          let hasConflict = false;
          for (const booking of stylistBookings) {
            const bookingStart = timeStringToMinutes(booking.Hora.substring(0, 5));
            const bookingEnd = bookingStart + booking.total_duration;
            
            if (slotStart < bookingEnd && slotEnd > bookingStart) {
              hasConflict = true;
              break;
            }
          }

          if (!hasConflict) {
            foundSlot = true;
            availableSlotTime = minutesToTimeString(slotStart);
            availableStylistId = stylist.id;
            break;
          }
        }

        if (foundSlot) break;
      }

      // If we found a slot, notify the client
      if (foundSlot) {
        console.log(`Found slot for ${entry.client_name} at ${availableSlotTime}`);

        // Reservamos el hueco para esta clienta durante 2h con un enlace único:
        // así el botón del email confirma de verdad en un clic.
        const proposalToken =
          crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
        const proposedExpires = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

        await supabase
          .from("waitlist")
          .update({
            status: "proposed",
            proposed_date: date,
            proposed_time: availableSlotTime,
            proposed_stylist_id: availableStylistId,
            proposed_at: new Date().toISOString(),
            proposed_expires_at: proposedExpires,
            proposal_token: proposalToken,
            notified_at: new Date().toISOString(),
          })
          .eq("id", entry.id);

        const confirmUrl = `https://glowapp.app/lista-espera/${proposalToken}`;



        // If user has an account, send direct message
        if (entry.user_id) {
          const conversationId = await getOrCreateConversation(supabase, tenant_id, entry.user_id);
          
          if (conversationId) {
            const formattedDate = formatDateSpanish(date);
            const message = `📢 ¡Buenas noticias!\n\nHay disponibilidad el ${formattedDate} a las ${availableSlotTime} para tu solicitud en lista de espera.\n\nTe lo guardamos 2 horas: confírmalo aquí 👉 ${confirmUrl}`;
            
            const sent = await sendDirectMessage(supabase, conversationId, tenant_id, message);
            if (sent) {
              messagesDelivered.push(entry.id);
              console.log(`Direct message sent to user ${entry.user_id}`);
            }
          }

          // Also create in-app notification for the user
          await supabase.from("notifications").insert({
            user_id: entry.user_id,
            tenant_id: tenant_id,
            type: "waitlist_availability",
            title: "¡Hueco disponible!",
            message: `Hay disponibilidad en ${tenantName} el ${formatDateSpanish(date)} a las ${availableSlotTime}. ¡Reserva antes de que lo ocupen!`,
            metadata: { 
              waitlist_id: entry.id, 
              available_time: availableSlotTime,
              date: date
            },
            action_url: `/lista-espera/${proposalToken}`
          });
        }

        // Email de hueco disponible
        try {
          let email: string | null = entry.client_email;
          if (!email && entry.user_id) {
            const { data: authUser } = await supabase.auth.admin.getUserById(entry.user_id);
            email = authUser?.user?.email ?? null;
          }
          if (email) {
            const serviceNames = Array.isArray(entry.services)
              ? entry.services.map((s: any) => s.name).filter(Boolean).join(", ")
              : "";
            await supabase.functions.invoke("send-transactional-email", {
              body: {
                templateName: "waitlist-slot-available",
                recipientEmail: email,
                idempotencyKey: `waitlist-slot-${entry.id}-${date}-${availableSlotTime}`,
                templateData: {
                  customerName: entry.client_name || "Hola",
                  tenantName,
                  tenantLogoUrl: (tenantData as any)?.logo_url ?? null,
                  date: formatDateSpanish(date),
                  time: availableSlotTime,
                  services: serviceNames,
                  acceptUrl: confirmUrl,
                },
              },
            });
            console.log("Waitlist email sent to", email);
          }
        } catch (mailErr) {
          console.error("Error sending waitlist email:", mailErr);
        }

        // Create notification for admin
        const { data: adminData } = await supabase
          .from("tenant_admins")
          .select("user_id")
          .eq("tenant_id", tenant_id)
          .eq("is_owner", true)
          .single();

        if (adminData?.user_id) {
          await supabase.from("notifications").insert({
            user_id: adminData.user_id,
            tenant_id: tenant_id,
            type: "waitlist_availability",
            title: "¡Hueco disponible!",
            message: `Hay un hueco disponible para ${entry.client_name} el ${formatDateSpanish(date)} a las ${availableSlotTime}. ${entry.user_id ? 'Se le ha enviado un mensaje.' : `Contacta al ${entry.client_phone || 'cliente'}.`}`,
            metadata: { 
              waitlist_id: entry.id, 
              available_time: availableSlotTime,
              client_phone: entry.client_phone,
              has_user_account: !!entry.user_id
            },
            action_url: "/admin?tab=waitlist"
          });
        }

        notifiedEntries.push(entry.id);
      }
    }

    console.log(`Notified ${notifiedEntries.length} entries, ${messagesDelivered.length} messages delivered`);

    return new Response(
      JSON.stringify({ 
        message: `Checked ${waitlistEntries.length} entries, notified ${notifiedEntries.length}`,
        notified: notifiedEntries,
        messages_delivered: messagesDelivered
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error checking waitlist availability:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
