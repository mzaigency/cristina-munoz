import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface TenantAvailability {
  tenantId: string;
  hasAvailability: boolean;
  availableSlots: number;
}

export function useTodayAvailability(tenantIds: string[]) {
  const [availabilityMap, setAvailabilityMap] = useState<Map<string, TenantAvailability>>(new Map());
  const [loading, setLoading] = useState(false);
  const [tenantsWithAvailability, setTenantsWithAvailability] = useState<string[]>([]);

  const checkAvailability = useCallback(async () => {
    if (tenantIds.length === 0) return;
    
    setLoading(true);
    const today = format(new Date(), "yyyy-MM-dd");
    const newMap = new Map<string, TenantAvailability>();
    const available: string[] = [];

    try {
      // Check availability for each tenant in parallel (batch of 5 to avoid rate limits)
      const batchSize = 5;
      for (let i = 0; i < tenantIds.length; i += batchSize) {
        const batch = tenantIds.slice(i, i + batchSize);
        
        const results = await Promise.all(
          batch.map(async (tenantId) => {
            try {
              const { data, error } = await supabase.functions.invoke("check-availability", {
                body: {
                  date: today,
                  stylist: "any",
                  tenant_id: tenantId,
                },
              });

              if (error) {
                console.error(`Error checking availability for ${tenantId}:`, error);
                return { tenantId, hasAvailability: false, availableSlots: 0 };
              }

              const bookedSlots = data?.bookedSlots || [];
              
              // Calculate available slots (working hours are typically 9:00-19:00 = 20 slots of 30min)
              // If less than 20 slots are booked, there's availability
              const currentHour = new Date().getHours();
              const currentMinutes = new Date().getMinutes();
              const currentTimeInMinutes = currentHour * 60 + currentMinutes;
              
              // Count future available slots (from now until end of day)
              const futureBookedSlots = bookedSlots.filter((slot: { Hora: string }) => {
                const [hours, minutes] = slot.Hora.split(":").map(Number);
                const slotTimeInMinutes = hours * 60 + minutes;
                return slotTimeInMinutes > currentTimeInMinutes;
              });

              // Estimate: if we have less than 15 future booked slots, there's likely availability
              // This is a heuristic since we're checking if stylist=any has gaps
              const hasAvailability = futureBookedSlots.length < 18;
              const availableSlots = Math.max(0, 20 - futureBookedSlots.length);

              return { tenantId, hasAvailability, availableSlots };
            } catch (err) {
              console.error(`Exception checking availability for ${tenantId}:`, err);
              return { tenantId, hasAvailability: false, availableSlots: 0 };
            }
          })
        );

        results.forEach((result) => {
          newMap.set(result.tenantId, result);
          if (result.hasAvailability) {
            available.push(result.tenantId);
          }
        });
      }

      setAvailabilityMap(newMap);
      setTenantsWithAvailability(available);
    } catch (err) {
      console.error("Error in checkAvailability:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantIds]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  return {
    availabilityMap,
    tenantsWithAvailability,
    loading,
    refetch: checkAvailability,
  };
}
