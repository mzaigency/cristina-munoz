import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface RecentBooking {
  id: string;
  date: string;
  time: string;
  status: string;
  services: string[];
  hasReview: boolean;
}

/**
 * Devuelve la última cita del usuario en el tenant si terminó hace < 6 horas,
 * o es "no_show"/"cancelled" reciente. Ideal para post-visita.
 */
export function useRecentBooking(tenantId: string | undefined) {
  const { user } = useAuth();
  const [booking, setBooking] = useState<RecentBooking | null>(null);

  useEffect(() => {
    if (!user || !tenantId) return;
    let cancelled = false;

    (async () => {
      try {
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
        const { data, error } = await supabase
          .from("bookings")
          .select("id, booking_date, booking_time, status, services, created_at")
          .eq("tenant_id", tenantId)
          .eq("user_id", user.id)
          .in("status", ["completed", "confirmed"])
          .order("booking_date", { ascending: false })
          .limit(1);

        if (error || cancelled || !data?.[0]) return;

        const b = data[0] as any;
        const bookingDateTime = new Date(`${b.booking_date}T${b.booking_time || "00:00"}`);
        const now = new Date();
        // Debe haber pasado ya y como máximo hace 6h
        if (bookingDateTime > now) return;
        if (bookingDateTime < sixHoursAgo) return;

        // ¿Ya dejó reseña?
        const { data: reviewData } = await supabase
          .from("reviews")
          .select("id")
          .eq("booking_id", b.id)
          .maybeSingle();

        if (cancelled) return;

        const services = Array.isArray(b.services)
          ? b.services.map((s: any) => s?.name).filter(Boolean)
          : [];

        setBooking({
          id: b.id,
          date: b.booking_date,
          time: b.booking_time,
          status: b.status,
          services,
          hasReview: !!reviewData,
        });
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, tenantId]);

  return booking;
}
