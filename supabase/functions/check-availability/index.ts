import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from 'https://esm.sh/zod@3.22.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema
const availabilityRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  stylist: z.enum(['cris', 'desi', 'any']).or(z.string()),
  totalDuration: z.number().int().min(0).max(960).optional(),
  tenant_id: z.string().uuid().optional()
});

interface AvailabilityRequest {
  date: string;
  stylist: string;
  totalDuration?: number;
  tenant_id?: string;
}

interface StylistHours {
  stylist_id: string;
  slug: string;
  is_working: boolean;
  start_time: string | null;
  end_time: string | null;
  break_start: string | null;
  break_end: string | null;
}

// Helper to get default tenant ID
async function getDefaultTenantId(supabase: any): Promise<string | null> {
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  
  return tenant?.id || null;
}

// Helper to get tenant stylists
async function getTenantStylists(supabase: any, tenantId: string): Promise<{ slug: string; id: string }[]> {
  const { data: stylists } = await supabase
    .from('tenant_stylists')
    .select('slug, id')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);
  
  return stylists || [];
}

// Helper to convert time string to minutes
function timeToMinutes(time: string | null): number {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

// Get stylist-specific hours for a day, falling back to tenant hours
async function getStylistHoursForDay(
  supabase: any, 
  stylistId: string, 
  stylistSlug: string,
  tenantId: string, 
  dayOfWeek: number
): Promise<StylistHours> {
  // First check stylist-specific hours
  const { data: stylistHours } = await supabase
    .from('stylist_business_hours')
    .select('*')
    .eq('stylist_id', stylistId)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle();

  if (stylistHours) {
    return {
      stylist_id: stylistId,
      slug: stylistSlug,
      is_working: stylistHours.is_working ?? true,
      start_time: stylistHours.start_time,
      end_time: stylistHours.end_time,
      break_start: stylistHours.break_start,
      break_end: stylistHours.break_end,
    };
  }

  // Fall back to tenant business hours
  const { data: tenantHours } = await supabase
    .from('tenant_business_hours')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle();

  if (tenantHours) {
    return {
      stylist_id: stylistId,
      slug: stylistSlug,
      is_working: tenantHours.is_open ?? true,
      start_time: tenantHours.open_time,
      end_time: tenantHours.close_time,
      break_start: tenantHours.break_start,
      break_end: tenantHours.break_end,
    };
  }

  // Default hours if nothing is configured
  const isWeekday = dayOfWeek >= 2 && dayOfWeek <= 5;
  const isSaturday = dayOfWeek === 6;
  
  return {
    stylist_id: stylistId,
    slug: stylistSlug,
    is_working: isWeekday || isSaturday,
    start_time: '09:00:00',
    end_time: isSaturday ? '14:00:00' : '19:00:00',
    break_start: isWeekday ? '13:00:00' : null,
    break_end: isWeekday ? '15:00:00' : null,
  };
}

// Get working ranges for a stylist
function getWorkingRanges(hours: StylistHours): Array<{ start: number; end: number }> {
  if (!hours.is_working) return [];

  const startMin = timeToMinutes(hours.start_time);
  const endMin = timeToMinutes(hours.end_time);
  const breakStartMin = hours.break_start ? timeToMinutes(hours.break_start) : null;
  const breakEndMin = hours.break_end ? timeToMinutes(hours.break_end) : null;

  if (breakStartMin !== null && breakEndMin !== null && breakStartMin > 0 && breakEndMin > 0) {
    return [
      { start: startMin, end: breakStartMin },
      { start: breakEndMin, end: endMin }
    ];
  }

  return [{ start: startMin, end: endMin }];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();
    
    // Validate input
    const validationResult = availabilityRequestSchema.safeParse(rawData);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data', 
          details: validationResult.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { date, stylist, totalDuration, tenant_id }: AvailabilityRequest = validationResult.data;
    console.log(`Checking availability for ${stylist} on ${date}${totalDuration ? ` (duration: ${totalDuration}min)` : ''}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determine tenant ID
    let tenantId: string | undefined = tenant_id;
    if (!tenantId) {
      const defaultTenant = await getDefaultTenantId(supabase);
      if (!defaultTenant) {
        throw new Error('No active tenant found');
      }
      tenantId = defaultTenant;
    }

    // Calculate day of week (0=Sunday, 1=Monday, etc.)
    const dateObj = new Date(date + 'T12:00:00Z');
    const dayOfWeek = dateObj.getUTCDay();

    // Determine which stylists to check
    const allStylists = await getTenantStylists(supabase, tenantId);
    let stylistsToCheck: { slug: string; id: string }[] = [];
    
    if (stylist === 'any') {
      stylistsToCheck = allStylists;
    } else {
      const found = allStylists.find(s => s.slug === stylist);
      if (found) {
        stylistsToCheck = [found];
      } else {
        // Fallback for old data without UUID
        stylistsToCheck = [{ slug: stylist, id: '' }];
      }
    }

    console.log(`Checking stylists: ${stylistsToCheck.map(s => s.slug).join(', ')}`);

    // Get working hours and bookings for each stylist
    const bookedSlotsByStylists: Record<string, Array<{ Hora: string; total_duration: number }>> = {};
    const stylistWorkingRanges: Record<string, Array<{ start: number; end: number }>> = {};

    for (const s of stylistsToCheck) {
      // Get working hours for this stylist
      const hours = await getStylistHoursForDay(supabase, s.id, s.slug, tenantId, dayOfWeek);
      stylistWorkingRanges[s.slug] = getWorkingRanges(hours);

      // If stylist is not working, block all slots
      if (!hours.is_working) {
        const slots: Array<{ Hora: string; total_duration: number }> = [];
        for (let hour = 0; hour < 24; hour++) {
          slots.push({ Hora: `${String(hour).padStart(2, '0')}:00:00`, total_duration: 60 });
        }
        bookedSlotsByStylists[s.slug] = slots;
        continue;
      }

      // Fetch bookings from database
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('Hora, total_duration, title')
        .eq('Fecha', date)
        .eq('stylist', s.slug)
        .eq('status', 'confirmed')
        .eq('tenant_id', tenantId);

      if (error) {
        console.error(`Error fetching bookings for ${s.slug}:`, error);
        continue;
      }

      const slots: Array<{ Hora: string; total_duration: number }> = [];

      for (const booking of bookings || []) {
        // Check if it's a vacation/blocked day
        const isVacation = booking.title?.includes('🌴 VACACIONES');
        
        if (isVacation) {
          // Block all hours
          for (let hour = 0; hour < 24; hour++) {
            slots.push({
              Hora: `${String(hour).padStart(2, '0')}:00:00`,
              total_duration: 60
            });
          }
        } else {
          slots.push({
            Hora: booking.Hora,
            total_duration: booking.total_duration || 60
          });
        }
      }

      // Add non-working hours as blocked slots
      const workingRanges = stylistWorkingRanges[s.slug];
      if (workingRanges.length > 0) {
        // Block time before first working range
        const firstStart = workingRanges[0].start;
        if (firstStart > 0) {
          for (let min = 0; min < firstStart; min += 30) {
            const hours = Math.floor(min / 60);
            const mins = min % 60;
            slots.push({
              Hora: `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`,
              total_duration: 30
            });
          }
        }

        // Block time between ranges (lunch break)
        for (let i = 0; i < workingRanges.length - 1; i++) {
          const gapStart = workingRanges[i].end;
          const gapEnd = workingRanges[i + 1].start;
          for (let min = gapStart; min < gapEnd; min += 30) {
            const hours = Math.floor(min / 60);
            const mins = min % 60;
            slots.push({
              Hora: `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`,
              total_duration: 30
            });
          }
        }

        // Block time after last working range
        const lastEnd = workingRanges[workingRanges.length - 1].end;
        for (let min = lastEnd; min < 24 * 60; min += 30) {
          const hours = Math.floor(min / 60);
          const mins = min % 60;
          slots.push({
            Hora: `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`,
            total_duration: 30
          });
        }
      }

      bookedSlotsByStylists[s.slug] = slots;
    }

    console.log(`Total booked slots by stylist:`, Object.fromEntries(
      Object.entries(bookedSlotsByStylists).map(([k, v]) => [k, v.length])
    ));

    // Determine final blocked slots based on stylist selection
    let finalBookedSlots: Array<{ Hora: string; total_duration: number }> = [];
    
    if (stylist === 'any') {
      // For "any" stylist, only block slots where ALL stylists are busy
      const stylistRanges: Record<string, Array<{ start: number; end: number }>> = {};
      
      for (const [s, slots] of Object.entries(bookedSlotsByStylists)) {
        stylistRanges[s] = slots.map(slot => {
          const [hours, minutes] = slot.Hora.split(':').map(Number);
          const start = hours * 60 + minutes;
          return { start, end: start + slot.total_duration };
        });
      }

      // Helper function to check if a stylist has availability
      const hasAvailability = (ranges: Array<{ start: number; end: number }>, startMinute: number, durationMinutes: number): boolean => {
        const endMinute = startMinute + durationMinutes;
        for (const range of ranges) {
          if (range.start < endMinute && range.end > startMinute) {
            return false;
          }
        }
        return true;
      };

      if (totalDuration) {
        // Check continuous availability for the total duration
        const blockedRanges: Array<{ start: number; end: number }> = [];
        
        for (let minute = 0; minute < 24 * 60; minute++) {
          let anyAvailable = false;
          
          for (const [s, ranges] of Object.entries(stylistRanges)) {
            if (hasAvailability(ranges, minute, totalDuration)) {
              anyAvailable = true;
              break;
            }
          }
          
          if (!anyAvailable) {
            const lastRange = blockedRanges[blockedRanges.length - 1];
            if (lastRange && lastRange.end === minute) {
              lastRange.end = minute + 1;
            } else {
              blockedRanges.push({ start: minute, end: minute + 1 });
            }
          }
        }
        
        // Convert ranges back to slots
        for (const range of blockedRanges) {
          const hours = Math.floor(range.start / 60);
          const minutes = range.start % 60;
          finalBookedSlots.push({
            Hora: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`,
            total_duration: range.end - range.start
          });
        }
      } else {
        // Original logic: block only when ALL stylists are busy
        const allStylistRanges = Object.values(stylistRanges);
        
        if (allStylistRanges.length > 0) {
          const blockedRanges: Array<{ start: number; end: number }> = [];
          
          for (let minute = 0; minute < 24 * 60; minute++) {
            const allBusy = allStylistRanges.every(ranges => 
              ranges.some(r => minute >= r.start && minute < r.end)
            );
            
            if (allBusy) {
              const lastRange = blockedRanges[blockedRanges.length - 1];
              if (lastRange && lastRange.end === minute) {
                lastRange.end = minute + 1;
              } else {
                blockedRanges.push({ start: minute, end: minute + 1 });
              }
            }
          }

          for (const range of blockedRanges) {
            const hours = Math.floor(range.start / 60);
            const minutes = range.start % 60;
            finalBookedSlots.push({
              Hora: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`,
              total_duration: range.end - range.start
            });
          }
        }
      }
    } else {
      // For specific stylist, return their booked slots
      finalBookedSlots = bookedSlotsByStylists[stylist] || [];
    }

    console.log(`Returning ${finalBookedSlots.length} blocked slots`);

    return new Response(
      JSON.stringify({ bookedSlots: finalBookedSlots }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, bookedSlots: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});