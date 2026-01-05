import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TenantBusinessHours {
  morningStart: number;
  morningEnd: number;
  afternoonStart: number;
  afternoonEnd: number;
  isClosed: boolean;
}

interface TenantBusinessHoursRecord {
  day_of_week: number;
  is_open: boolean | null;
  open_time: string | null;
  close_time: string | null;
  break_start: string | null;
  break_end: string | null;
}

const SLOT_INTERVAL = 30;

function timeToMinutes(time: string | null): number {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

function parseBusinessHours(record: TenantBusinessHoursRecord): TenantBusinessHours {
  if (!record.is_open) {
    return {
      morningStart: 0,
      morningEnd: 0,
      afternoonStart: 0,
      afternoonEnd: 0,
      isClosed: true,
    };
  }

  const openTime = timeToMinutes(record.open_time);
  const closeTime = timeToMinutes(record.close_time);
  const breakStart = record.break_start ? timeToMinutes(record.break_start) : null;
  const breakEnd = record.break_end ? timeToMinutes(record.break_end) : null;

  // If there's a break, split into morning and afternoon
  if (breakStart !== null && breakEnd !== null && breakStart > 0 && breakEnd > 0) {
    return {
      morningStart: openTime,
      morningEnd: breakStart,
      afternoonStart: breakEnd,
      afternoonEnd: closeTime,
      isClosed: false,
    };
  }

  // No break - treat as all morning hours
  return {
    morningStart: openTime,
    morningEnd: closeTime,
    afternoonStart: 0,
    afternoonEnd: 0,
    isClosed: false,
  };
}

// Default business hours for when no tenant hours are configured
const DEFAULT_HOURS: Record<number, TenantBusinessHours> = {
  0: { morningStart: 0, morningEnd: 0, afternoonStart: 0, afternoonEnd: 0, isClosed: true },
  1: { morningStart: 0, morningEnd: 0, afternoonStart: 0, afternoonEnd: 0, isClosed: true },
  2: { morningStart: 9 * 60, morningEnd: 13 * 60, afternoonStart: 15 * 60, afternoonEnd: 19 * 60, isClosed: false },
  3: { morningStart: 9 * 60, morningEnd: 13 * 60, afternoonStart: 15 * 60, afternoonEnd: 19 * 60, isClosed: false },
  4: { morningStart: 9 * 60, morningEnd: 13 * 60, afternoonStart: 15 * 60, afternoonEnd: 19 * 60, isClosed: false },
  5: { morningStart: 9 * 60, morningEnd: 13 * 60, afternoonStart: 15 * 60, afternoonEnd: 19 * 60, isClosed: false },
  6: { morningStart: 9 * 60, morningEnd: 14 * 60, afternoonStart: 0, afternoonEnd: 0, isClosed: false },
};

export function useTenantBusinessHours(tenantId: string) {
  const [businessHours, setBusinessHours] = useState<Record<number, TenantBusinessHours> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinessHours = async () => {
      if (!tenantId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("tenant_business_hours")
          .select("day_of_week, is_open, open_time, close_time, break_start, break_end")
          .eq("tenant_id", tenantId);

        if (error) {
          console.error("Error fetching business hours:", error);
          setBusinessHours(DEFAULT_HOURS);
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          // Start with defaults for all days
          const hoursMap: Record<number, TenantBusinessHours> = { ...DEFAULT_HOURS };
          
          // Override with tenant-specific hours
          data.forEach((record) => {
            const parsed = parseBusinessHours(record as TenantBusinessHoursRecord);
            hoursMap[record.day_of_week] = parsed;
          });

          setBusinessHours(hoursMap);
        } else {
          // No tenant hours configured, use defaults
          setBusinessHours(DEFAULT_HOURS);
        }
      } catch (error) {
        console.error("Error fetching business hours:", error);
        setBusinessHours(DEFAULT_HOURS);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessHours();
  }, [tenantId]);

  // Get effective hours (use loaded hours or defaults)
  const effectiveHours = businessHours || DEFAULT_HOURS;

  // Generate available slots for a given day
  const generateBaseSlots = (dayOfWeek: number): Set<number> => {
    const hours = effectiveHours[dayOfWeek] || DEFAULT_HOURS[dayOfWeek];
    const slotsSet = new Set<number>();

    if (hours.isClosed) return slotsSet;

    // Morning slots
    if (hours.morningEnd > 0) {
      for (let minutes = hours.morningStart; minutes < hours.morningEnd; minutes += SLOT_INTERVAL) {
        slotsSet.add(minutes);
      }
    }

    // Afternoon slots
    if (hours.afternoonEnd > 0) {
      for (let minutes = hours.afternoonStart; minutes < hours.afternoonEnd; minutes += SLOT_INTERVAL) {
        slotsSet.add(minutes);
      }
    }

    return slotsSet;
  };

  const getBusinessHoursForDay = (dayOfWeek: number): TenantBusinessHours => {
    return effectiveHours[dayOfWeek] || DEFAULT_HOURS[dayOfWeek];
  };

  // Get closed days for calendar
  const getClosedDays = (): number[] => {
    return Object.entries(effectiveHours)
      .filter(([_, hours]) => hours.isClosed)
      .map(([day]) => parseInt(day));
  };

  return {
    businessHours: effectiveHours,
    loading,
    generateBaseSlots,
    getBusinessHoursForDay,
    getClosedDays,
  };
}
