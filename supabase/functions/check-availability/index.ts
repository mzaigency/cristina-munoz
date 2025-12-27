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
async function getTenantStylists(supabase: any, tenantId: string): Promise<string[]> {
  const { data: stylists } = await supabase
    .from('tenant_stylists')
    .select('slug')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);
  
  return stylists?.map((s: any) => s.slug) || [];
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

    // Determine which stylists to check
    let stylistsToCheck: string[] = [];
    if (stylist === 'any') {
      stylistsToCheck = await getTenantStylists(supabase, tenantId);
    } else {
      stylistsToCheck = [stylist];
    }

    console.log(`Checking stylists: ${stylistsToCheck.join(', ')}`);

    // Fetch bookings from database for each stylist
    const bookedSlotsByStylists: Record<string, Array<{ Hora: string; total_duration: number }>> = {};

    for (const s of stylistsToCheck) {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('Hora, total_duration, title')
        .eq('Fecha', date)
        .eq('stylist', s)
        .eq('status', 'confirmed')
        .eq('tenant_id', tenantId);

      if (error) {
        console.error(`Error fetching bookings for ${s}:`, error);
        continue;
      }

      const slots: Array<{ Hora: string; total_duration: number }> = [];

      for (const booking of bookings || []) {
        // Check if it's a vacation/blocked day
        const isVacation = booking.title?.includes('🌴 VACACIONES');
        
        if (isVacation) {
          // Block all business hours
          for (let hour = 8; hour <= 20; hour++) {
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

      bookedSlotsByStylists[s] = slots;
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
