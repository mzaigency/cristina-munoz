import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface TenantAvailability {
  tenantId: string;
  hasAvailability: boolean;
  availableSlots: number;
}

// Working hours configuration (9:00 - 20:00 with 30-min slots)
const WORKING_START = 9 * 60; // 9:00 in minutes
const WORKING_END = 20 * 60; // 20:00 in minutes
const SLOT_DURATION = 30; // 30 minutes per slot

// Generate all possible time slots for a working day
function generateAllSlots(startMinutes: number, endMinutes: number): number[] {
  const slots: number[] = [];
  for (let min = startMinutes; min < endMinutes; min += SLOT_DURATION) {
    slots.push(min);
  }
  return slots;
}

// Convert "HH:MM:SS" to minutes since midnight
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function useTodayAvailability(tenantIds: string[]) {
  const [availabilityMap, setAvailabilityMap] = useState<Map<string, TenantAvailability>>(new Map());
  const [loading, setLoading] = useState(false);
  const [tenantsWithAvailability, setTenantsWithAvailability] = useState<string[]>([]);
  const [hasChecked, setHasChecked] = useState(false);

  const checkAvailability = useCallback(async () => {
    if (tenantIds.length === 0) return;
    
    setLoading(true);
    setHasChecked(true);
    const today = format(new Date(), "yyyy-MM-dd");
    const newMap = new Map<string, TenantAvailability>();
    const available: string[] = [];

    // Current time in minutes (rounded up to next 30-min slot)
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const nextSlotStart = Math.ceil(currentMinutes / SLOT_DURATION) * SLOT_DURATION;
    
    // If it's past working hours, no availability today
    if (nextSlotStart >= WORKING_END) {
      setAvailabilityMap(newMap);
      setTenantsWithAvailability([]);
      setLoading(false);
      return;
    }

    // Generate remaining slots for today (from now until closing)
    const remainingSlots = generateAllSlots(
      Math.max(nextSlotStart, WORKING_START), 
      WORKING_END
    );

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
              
              // Convert booked slots to a Set of blocked minute ranges
              const blockedMinutes = new Set<number>();
              bookedSlots.forEach((slot: { Hora: string; total_duration: number }) => {
                const startMin = timeToMinutes(slot.Hora);
                const duration = slot.total_duration || 30;
                // Mark all 30-min slots that overlap with this booking as blocked
                for (let min = startMin; min < startMin + duration; min += SLOT_DURATION) {
                  blockedMinutes.add(Math.floor(min / SLOT_DURATION) * SLOT_DURATION);
                }
              });

              // Count available slots (remaining slots that are NOT blocked)
              const availableSlotsCount = remainingSlots.filter(
                slotMin => !blockedMinutes.has(slotMin)
              ).length;

              // Has availability if there's at least 1 free slot today
              const hasAvailability = availableSlotsCount > 0;

              return { tenantId, hasAvailability, availableSlots: availableSlotsCount };
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

  return {
    availabilityMap,
    tenantsWithAvailability,
    loading,
    hasChecked,
    checkAvailability,
  };
}
