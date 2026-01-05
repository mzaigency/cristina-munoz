import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WaitlistEntry {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
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

    if (!tenant_id || !date) {
      return new Response(
        JSON.stringify({ error: "tenant_id and date are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
            break;
          }
        }

        if (foundSlot) break;
      }

      // If we found a slot, notify the client
      if (foundSlot) {
        // Update waitlist entry status
        await supabase
          .from("waitlist")
          .update({ 
            status: "notified", 
            notified_at: new Date().toISOString() 
          })
          .eq("id", entry.id);

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
            message: `Hay un hueco disponible para ${entry.client_name} el ${date} a las ${availableSlotTime}. Se le ha notificado automáticamente.`,
            metadata: { 
              waitlist_id: entry.id, 
              available_time: availableSlotTime,
              client_phone: entry.client_phone
            },
            action_url: "/admin?tab=waitlist"
          });
        }

        notifiedEntries.push(entry.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Checked ${waitlistEntries.length} entries, notified ${notifiedEntries.length}`,
        notified: notifiedEntries 
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