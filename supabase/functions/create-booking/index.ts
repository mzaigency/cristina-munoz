import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to normalize phone numbers
const normalizePhone = (phone: string): string => {
  return phone.replace(/[\s\-\(\)]/g, "").replace(/^(\+34)?/, "");
};

// Validation schemas
const serviceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.enum(["Simple", "Compuesto"]),
  duration_part1_active: z.number().int().min(0).max(480),
  duration_exposure_pause: z.number().int().min(0).max(480),
  duration_part2_active: z.number().int().min(0).max(480),
});

const recurrenceSchema = z
  .object({
    intervalValue: z.number().int().min(1).max(52),
    intervalUnit: z.enum(["days", "weeks", "months"]),
    occurrences: z.number().int().min(1).max(365),
  })
  .nullable()
  .optional();

const bookingRequestSchema = z
  .object({
    Fecha: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
      .optional(),
    Hora: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format")
      .optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
      .optional(),
    time: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format")
      .optional(),
    stylist: z.enum(["cris", "desi", "any"]).or(z.string()),
    services: z.array(serviceSchema).min(1).max(10),
    total_duration: z.number().int().min(1).max(960),
    customer_name: z.string().min(1).max(100).optional(),
    phone: z.union([z.string().min(9).max(15), z.literal("")]).optional(),
    user_id: z.string().uuid().nullable().optional(),
    skipAvailabilityCheck: z.boolean().optional(),
    tenant_id: z.string().uuid().optional(),
    canal: z.enum(["web", "crm", "whatsapp"]).optional(),
    recurrence: recurrenceSchema,
  })
  .refine((data) => (data.Fecha || data.date) && (data.Hora || data.time), {
    message: "Either Fecha/Hora or date/time must be provided",
  });

interface RecurrenceConfig {
  intervalValue: number;
  intervalUnit: "days" | "weeks" | "months";
  occurrences: number;
}

interface BookingRequest {
  Fecha?: string;
  Hora?: string;
  date?: string;
  time?: string;
  stylist: string;
  services: Array<{
    id: string;
    name: string;
    type: "Simple" | "Compuesto";
    duration_part1_active: number;
    duration_exposure_pause: number;
    duration_part2_active: number;
  }>;
  total_duration: number;
  user_id?: string | null;
  customer_name?: string;
  phone?: string;
  skipAvailabilityCheck?: boolean;
  tenant_id?: string;
  canal?: "web" | "crm" | "whatsapp";
  recurrence?: RecurrenceConfig | null;
}

// Helper function to get default tenant ID
async function getDefaultTenantId(supabase: any): Promise<string | null> {
  const { data: tenant } = await supabase.from("tenants").select("id").eq("is_active", true).limit(1).maybeSingle();

  return tenant?.id || null;
}

// Helper function to get n8n webhook URL from tenant integrations
async function getN8nWebhookUrl(supabase: any, tenantId: string): Promise<string | null> {
  const { data: integration } = await supabase
    .from("tenant_integrations")
    .select("settings, is_enabled")
    .eq("tenant_id", tenantId)
    .eq("integration_type", "n8n")
    .eq("is_enabled", true)
    .maybeSingle();

  if (integration?.settings?.webhook_url) {
    return integration.settings.webhook_url;
  }

  return Deno.env.get("N8N_WEBHOOK_URL") || null;
}

// Helper function to get stylist color
async function getStylistColor(supabase: any, tenantId: string, stylistSlug: string): Promise<string> {
  const { data: stylist } = await supabase
    .from("tenant_stylists")
    .select("color")
    .eq("tenant_id", tenantId)
    .eq("slug", stylistSlug)
    .maybeSingle();

  return stylist?.color || "#8B5CF6";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();

    // Validate input
    const validationResult = bookingRequestSchema.safeParse(rawData);
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.errors);
      return new Response(
        JSON.stringify({
          error: "Invalid input data",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const bookingData: BookingRequest = validationResult.data;
    console.log("Creating booking:", bookingData);

    // Support both date/time and Fecha/Hora formats
    const bookingDate = bookingData.date || bookingData.Fecha!;
    const bookingTime = bookingData.time || bookingData.Hora!;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determine tenant_id
    let tenantId: string | undefined = bookingData.tenant_id;
    if (!tenantId) {
      const defaultTenant = await getDefaultTenantId(supabase);
      if (!defaultTenant) {
        throw new Error("No active tenant found");
      }
      tenantId = defaultTenant;
    }
    console.log("Using tenant_id:", tenantId);

    // Check if tenant subscription is active
    const { data: tenantData, error: tenantError } = await supabase
      .from("tenants")
      .select("subscription_expires_at, is_active")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenantData) {
      throw new Error("Tenant not found");
    }

    if (!tenantData.is_active) {
      return new Response(JSON.stringify({ error: "Este negocio no está activo" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (tenantData.subscription_expires_at) {
      const expiresAt = new Date(tenantData.subscription_expires_at);
      if (expiresAt < new Date()) {
        return new Response(
          JSON.stringify({ error: "Este negocio tiene la suscripción expirada y no puede recibir reservas" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Services are reloaded from the current tenant instead of trusting the client payload.
    // This prevents creating bookings in one salon with service ids from another salon.
    const requestedServiceIds = [...new Set(bookingData.services.map((s) => s.id))];
    const { data: tenantServices, error: servicesError } = await supabase
      .from("services")
      .select("id, name, type, duration_part1_active, duration_exposure_pause, duration_part2_active, price")
      .eq("tenant_id", tenantId)
      .in("id", requestedServiceIds);

    if (servicesError) {
      console.error("Error validating tenant services:", servicesError);
      throw new Error("No se pudieron validar los servicios del negocio");
    }

    const tenantServicesById = new Map((tenantServices || []).map((s: any) => [s.id, s]));
    if (tenantServicesById.size !== requestedServiceIds.length) {
      return new Response(
        JSON.stringify({ error: "Algún servicio seleccionado no pertenece a este negocio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    bookingData.services = bookingData.services.map((s) => tenantServicesById.get(s.id) as any);
    bookingData.total_duration = bookingData.services.reduce(
      (sum, s) => sum + s.duration_part1_active + s.duration_exposure_pause + s.duration_part2_active,
      0,
    );

    // Get customer data - either from user profile or from direct input
    let customer_name: string;
    let customer_email: string | null = null;
    let customer_phone: string;

    if (bookingData.user_id) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", bookingData.user_id)
        .single();

      if (profileError || !profile) {
        console.error("Error fetching profile:", profileError);
        throw new Error("Could not fetch user profile");
      }

      customer_name = profile.full_name;
      customer_email = profile.email;
      customer_phone = profile.phone;
    } else {
      if (!bookingData.customer_name) {
        throw new Error("Customer name is required");
      }
      customer_name = bookingData.customer_name;
      customer_phone = bookingData.phone || "";
    }

    const normalizedPhone = normalizePhone(customer_phone);
    const [startHours, startMinutes] = bookingTime.split(":").map(Number);
    const currentMinutes = startHours * 60 + startMinutes;
    const endMinutesTotal = currentMinutes + bookingData.total_duration;

    // ----------- Helpers de validación (fuente única de verdad) -----------
    type Range = { start: number; end: number };
    const timeToMin = (t?: string | null): number | null => {
      if (!t) return null;
      const [h, m] = t.split(":").map(Number);
      return h * 60 + (m || 0);
    };

    // Construir ventanas activas del nuevo booking (los compuestos tienen pausa
    // durante la cual el estilista PUEDE atender a otro cliente).
    const buildActiveWindows = (): Range[] => {
      const windows: Range[] = [];
      let cursor = currentMinutes;
      for (const s of bookingData.services as Array<any>) {
        if (s.type === "Compuesto") {
          const p1 = Number(s.duration_part1_active) || 0;
          const pause = Number(s.duration_exposure_pause) || 0;
          const p2 = Number(s.duration_part2_active) || 0;
          if (p1 > 0) windows.push({ start: cursor, end: cursor + p1 });
          cursor += p1 + pause;
          if (p2 > 0) windows.push({ start: cursor, end: cursor + p2 });
          cursor += p2;
        } else {
          const d = Number((s as any).duration) || Number(s.duration_part1_active) || 0;
          if (d > 0) windows.push({ start: cursor, end: cursor + d });
          cursor += d;
        }
      }
      if (windows.length === 0) windows.push({ start: currentMinutes, end: endMinutesTotal });
      return windows;
    };

    const activeWindows = buildActiveWindows();

    // Cada ventana activa debe caber dentro de algún rango abierto
    const fitsInRanges = (openRanges: Range[]): boolean => {
      if (openRanges.length === 0) return false;
      return activeWindows.every((w) =>
        openRanges.some((r) => w.start >= r.start && w.end <= r.end),
      );
    };

    const computeRanges = (
      open: number | null,
      close: number | null,
      bStart: number | null,
      bEnd: number | null,
    ): Range[] => {
      if (open == null || close == null) return [];
      if (bStart != null && bEnd != null && bStart > open && bEnd < close) {
        return [
          { start: open, end: bStart },
          { start: bEnd, end: close },
        ];
      }
      return [{ start: open, end: close }];
    };

    // ----------- Cargar horarios del negocio (override temporada > semanal) -----------
    const { data: overrides } = await supabase
      .from("tenant_hours_overrides")
      .select("is_closed, open_time, close_time, break_start, break_end")
      .eq("tenant_id", tenantId)
      .lte("date_from", bookingDate)
      .gte("date_to", bookingDate)
      .limit(1);

    let businessOpenRanges: Range[] = [];
    let businessSource: "override" | "weekly" | "none" = "none";

    if (overrides && overrides.length > 0) {
      const ov = overrides[0];
      businessSource = "override";
      businessOpenRanges = ov.is_closed
        ? []
        : computeRanges(timeToMin(ov.open_time), timeToMin(ov.close_time), timeToMin(ov.break_start), timeToMin(ov.break_end));
    } else {
      const dow = new Date(bookingDate + "T12:00:00Z").getUTCDay();
      const { data: weekly } = await supabase
        .from("tenant_business_hours")
        .select("is_open, open_time, close_time, break_start, break_end")
        .eq("tenant_id", tenantId)
        .eq("day_of_week", dow)
        .maybeSingle();
      if (weekly) {
        businessSource = "weekly";
        businessOpenRanges = !weekly.is_open
          ? []
          : computeRanges(timeToMin(weekly.open_time), timeToMin(weekly.close_time), timeToMin(weekly.break_start), timeToMin(weekly.break_end));
      }
    }

    // Validar horario del negocio (no depende del estilista) — una sola vez
    if (!bookingData.skipAvailabilityCheck && businessSource !== "none" && !fitsInRanges(businessOpenRanges)) {
      return new Response(
        JSON.stringify({
          error: "El horario seleccionado está fuera del horario de atención",
          details: { source: businessSource },
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ----------- Validador por estilista (reutilizado para "any" y para slug concreto) -----------
    type StylistRow = { id: string; slug: string };

    const validateStylist = async (
      stylist: StylistRow,
    ): Promise<{ ok: true } | { ok: false; reason: string; label?: string }> => {
      // 1) Override personal del estilista (vacaciones / horario especial)
      const { data: sOverrides } = await supabase
        .from("stylist_hours_overrides")
        .select("is_closed, open_time, close_time, break_start, break_end, label")
        .eq("stylist_id", stylist.id)
        .lte("date_from", bookingDate)
        .gte("date_to", bookingDate)
        .limit(1);

      if (sOverrides && sOverrides.length > 0) {
        const sov = sOverrides[0];
        if (sov.is_closed) {
          return { ok: false, reason: "stylist_closed", label: sov.label || undefined };
        }
        const sRanges = computeRanges(
          timeToMin(sov.open_time),
          timeToMin(sov.close_time),
          timeToMin(sov.break_start),
          timeToMin(sov.break_end),
        );
        if (sRanges.length > 0 && !fitsInRanges(sRanges)) {
          return { ok: false, reason: "stylist_override" };
        }
      } else {
        // 2) Horario semanal específico del estilista (si existe)
        const dow = new Date(bookingDate + "T12:00:00Z").getUTCDay();
        const { data: sWeekly } = await supabase
          .from("stylist_business_hours")
          .select("is_working, start_time, end_time, break_start, break_end")
          .eq("stylist_id", stylist.id)
          .eq("day_of_week", dow)
          .maybeSingle();
        if (sWeekly) {
          if (!sWeekly.is_working) {
            return { ok: false, reason: "stylist_not_working" };
          }
          const sRanges = computeRanges(
            timeToMin(sWeekly.start_time),
            timeToMin(sWeekly.end_time),
            timeToMin(sWeekly.break_start),
            timeToMin(sWeekly.break_end),
          );
          if (sRanges.length > 0 && !fitsInRanges(sRanges)) {
            return { ok: false, reason: "stylist_weekly_outside" };
          }
        }
      }

      // 3) Conflicto con bookings existentes (usando active windows del nuevo)
      const { data: stylistBookings } = await supabase
        .from("bookings")
        .select("id, Hora, total_duration")
        .eq("Fecha", bookingDate)
        .eq("stylist", stylist.slug)
        .eq("status", "confirmed")
        .eq("tenant_id", tenantId);

      if (stylistBookings && stylistBookings.length > 0) {
        const hasConflict = stylistBookings.some((b: any) => {
          const [bStartH, bStartM] = b.Hora.split(":").map(Number);
          const bookingStart = bStartH * 60 + bStartM;
          const bookingEnd = bookingStart + (b.total_duration || 60);
          return activeWindows.some((w) => w.start < bookingEnd && w.end > bookingStart);
        });
        if (hasConflict) return { ok: false, reason: "conflict" };
      }

      return { ok: true };
    };

    // ----------- Resolver estilista real -----------
    let actualStylist = bookingData.stylist;
    let resolvedStylistRow: StylistRow | null = null;

    if (bookingData.stylist === "any") {
      const { data: stylists } = await supabase
        .from("tenant_stylists")
        .select("id, slug")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);

      if (!stylists || stylists.length === 0) {
        return new Response(
          JSON.stringify({ error: "No hay estilistas disponibles en este negocio" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (bookingData.skipAvailabilityCheck) {
        // En modo admin sin chequeo, simplemente coger el primero
        resolvedStylistRow = stylists[0] as StylistRow;
        actualStylist = stylists[0].slug;
      } else {
        for (const s of stylists as StylistRow[]) {
          const result = await validateStylist(s);
          if (result.ok) {
            resolvedStylistRow = s;
            actualStylist = s.slug;
            break;
          }
        }
        if (!resolvedStylistRow) {
          return new Response(
            JSON.stringify({
              error: "Ningún profesional está disponible para esa fecha y hora",
              details: { reason: "no_stylist_available" },
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }
    } else {
      // Estilista concreto: cargar fila por slug
      const { data: stylistRow } = await supabase
        .from("tenant_stylists")
        .select("id, slug")
        .eq("tenant_id", tenantId)
        .eq("slug", actualStylist)
        .maybeSingle();

      if (stylistRow) {
        resolvedStylistRow = stylistRow as StylistRow;
      }

      if (!bookingData.skipAvailabilityCheck && resolvedStylistRow) {
        const result = await validateStylist(resolvedStylistRow);
        if (!result.ok) {
          const msgByReason: Record<string, string> = {
            stylist_closed: `${actualStylist} no trabaja ese día${result.label ? ` (${result.label})` : ""}`,
            stylist_override: `${actualStylist} tiene un horario especial ese día y la hora está fuera`,
            stylist_not_working: `${actualStylist} no trabaja ese día`,
            stylist_weekly_outside: `${actualStylist} no atiende a esa hora`,
            conflict: `${actualStylist} ya tiene una cita en ese horario`,
          };
          return new Response(
            JSON.stringify({
              error: msgByReason[result.reason] || "El estilista no está disponible",
              details: { reason: result.reason, stylist: actualStylist },
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }
    }

    // ----------- Dedupe: mismo cliente con solapamiento real ese día -----------
    if (!bookingData.skipAvailabilityCheck && normalizedPhone && normalizedPhone.length >= 9) {
      const { data: sameDayBookings } = await supabase
        .from("bookings")
        .select("id, Hora, total_duration, Telefono")
        .eq("Fecha", bookingDate)
        .eq("status", "confirmed")
        .eq("tenant_id", tenantId);

      if (sameDayBookings && sameDayBookings.length > 0) {
        const duplicate = sameDayBookings.find((b: any) => {
          if (normalizePhone(b.Telefono || "") !== normalizedPhone) return false;
          const [bStartH, bStartM] = b.Hora.split(":").map(Number);
          const bookingStart = bStartH * 60 + bStartM;
          const bookingEnd = bookingStart + (b.total_duration || 60);
          return activeWindows.some((w) => w.start < bookingEnd && w.end > bookingStart);
        });
        if (duplicate) {
          return new Response(
            JSON.stringify({
              error: "Ya tienes una reserva que se solapa con ese horario",
              details: { existing_booking_id: (duplicate as any).id },
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }
    }

    // Separate services by type
    const simpleServices = bookingData.services.filter((s) => s.type === "Simple");
    const compoundServices = bookingData.services.filter((s) => s.type === "Compuesto");

    // Helper function to calculate end time
    const calculateEndTime = (startMinutes: number, durationMinutes: number): string => {
      const totalMinutes = startMinutes + durationMinutes;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
    };

    // Helper function to add interval to a date string
    const addIntervalToDate = (
      dateStr: string,
      intervalValue: number,
      intervalUnit: "days" | "weeks" | "months",
    ): string => {
      const date = new Date(dateStr + "T12:00:00Z"); // Use noon UTC to avoid timezone issues

      switch (intervalUnit) {
        case "days":
          date.setUTCDate(date.getUTCDate() + intervalValue);
          break;
        case "weeks":
          date.setUTCDate(date.getUTCDate() + intervalValue * 7);
          break;
        case "months":
          // Proper month addition that handles varying month lengths
          const originalDay = date.getUTCDate();
          date.setUTCMonth(date.getUTCMonth() + intervalValue);
          // Handle edge case: if original day was 31 and new month has fewer days
          // e.g., Jan 31 + 1 month = Feb 28/29, not Mar 2/3
          if (date.getUTCDate() !== originalDay) {
            // We overflowed to the next month, go back to last day of intended month
            date.setUTCDate(0);
          }
          break;
      }

      return date.toISOString().split("T")[0];
    };

    // Calculate recurrence dates
    const getRecurrenceDates = (): string[] => {
      if (!bookingData.recurrence) return [bookingDate];

      const dates: string[] = [];
      let currentDate = bookingDate;

      for (let i = 0; i < bookingData.recurrence.occurrences; i++) {
        dates.push(currentDate);
        currentDate = addIntervalToDate(
          currentDate,
          bookingData.recurrence.intervalValue,
          bookingData.recurrence.intervalUnit,
        );
      }

      return dates;
    };

    // Get stylist color for the booking
    const stylistColor = await getStylistColor(supabase, tenantId, actualStylist);

    const createdBookings: any[] = [];

    // Generate recurrence group ID if this is a recurring booking
    const recurrenceGroupId = bookingData.recurrence ? crypto.randomUUID() : null;
    const recurrencePattern = bookingData.recurrence
      ? {
          intervalValue: bookingData.recurrence.intervalValue,
          intervalUnit: bookingData.recurrence.intervalUnit,
          occurrences: bookingData.recurrence.occurrences,
        }
      : null;

    // Get all dates to create bookings for
    const bookingDates = getRecurrenceDates();
    console.log(`Creating ${bookingDates.length} bookings for dates:`, bookingDates);

    // Create bookings for each date
    for (const currentBookingDate of bookingDates) {
      let dateCurrentMinutes = currentMinutes;
      let mainBookingId: string | null = null;

      // Process simple services
      if (simpleServices.length > 0) {
        const simpleDuration = simpleServices.reduce((sum, s) => sum + s.duration_part1_active, 0);
        const startTime = `${String(Math.floor(dateCurrentMinutes / 60)).padStart(2, "0")}:${String(dateCurrentMinutes % 60).padStart(2, "0")}:00`;
        const endTime = calculateEndTime(dateCurrentMinutes, simpleDuration);

        const serviceNames = simpleServices.map((s) => s.name).join(", ");

        const bookingRecord = {
          tenant_id: tenantId,
          Fecha: currentBookingDate,
          Hora: startTime,
          end_time: endTime,
          stylist: actualStylist,
          customer_name: customer_name,
          Telefono: customer_phone,
          services: simpleServices,
          total_duration: simpleDuration,
          user_id: bookingData.user_id || null,
          skip_availability_check: bookingData.skipAvailabilityCheck || false,
          status: "confirmed",
          title: `${customer_name} - ${serviceNames}`,
          notes: null,
          color: stylistColor,
          canal: bookingData.canal || "web",
          recurrence_group_id: recurrenceGroupId,
          recurrence_pattern: recurrencePattern,
        };

        const { data: booking, error: bookingError } = await supabase
          .from("bookings")
          .insert(bookingRecord)
          .select()
          .single();

        if (bookingError) throw bookingError;

        createdBookings.push(booking);
        mainBookingId = booking.id;
        dateCurrentMinutes += simpleDuration;
      }

      // Process compound services
      for (const service of compoundServices) {
        // Part 1
        const part1Start = `${String(Math.floor(dateCurrentMinutes / 60)).padStart(2, "0")}:${String(dateCurrentMinutes % 60).padStart(2, "0")}:00`;
        const part1End = calculateEndTime(dateCurrentMinutes, service.duration_part1_active);

        const part1Record = {
          tenant_id: tenantId,
          Fecha: currentBookingDate,
          Hora: part1Start,
          end_time: part1End,
          stylist: actualStylist,
          customer_name: customer_name,
          Telefono: customer_phone,
          services: [service],
          total_duration: service.duration_part1_active,
          user_id: bookingData.user_id || null,
          is_part_of_compound: true,
          compound_part: "part1",
          related_booking_id: mainBookingId,
          skip_availability_check: bookingData.skipAvailabilityCheck || false,
          status: "confirmed",
          title: `${customer_name} - ${service.name} (Parte 1)`,
          notes: null,
          color: stylistColor,
          canal: bookingData.canal || "web",
          recurrence_group_id: recurrenceGroupId,
          recurrence_pattern: recurrencePattern,
        };

        const { data: part1Booking, error: part1Error } = await supabase
          .from("bookings")
          .insert(part1Record)
          .select()
          .single();

        if (part1Error) throw part1Error;

        createdBookings.push(part1Booking);
        if (!mainBookingId) mainBookingId = part1Booking.id;

        dateCurrentMinutes += service.duration_part1_active + service.duration_exposure_pause;

        // Part 2 if exists
        if (service.duration_part2_active > 0) {
          const part2Start = `${String(Math.floor(dateCurrentMinutes / 60)).padStart(2, "0")}:${String(dateCurrentMinutes % 60).padStart(2, "0")}:00`;
          const part2End = calculateEndTime(dateCurrentMinutes, service.duration_part2_active);

          const part2Record = {
            tenant_id: tenantId,
            Fecha: currentBookingDate,
            Hora: part2Start,
            end_time: part2End,
            stylist: actualStylist,
            customer_name: customer_name,
            Telefono: customer_phone,
            services: [service],
            total_duration: service.duration_part2_active,
            user_id: bookingData.user_id || null,
            is_part_of_compound: true,
            compound_part: "part2",
            related_booking_id: part1Booking.id,
            skip_availability_check: bookingData.skipAvailabilityCheck || false,
            status: "confirmed",
            title: `${customer_name} - ${service.name} (Parte 2)`,
            notes: null,
            color: stylistColor,
            canal: bookingData.canal || "web",
            recurrence_group_id: recurrenceGroupId,
            recurrence_pattern: recurrencePattern,
          };

          const { data: part2Booking, error: part2Error } = await supabase
            .from("bookings")
            .insert(part2Record)
            .select()
            .single();

          if (part2Error) throw part2Error;

          createdBookings.push(part2Booking);
          dateCurrentMinutes += service.duration_part2_active;
        }
      }
    }

    console.log("Created bookings:", createdBookings.length);

    // Mark any waitlist entries as booked for this user/phone and date
    if (bookingData.user_id || normalizedPhone) {
      try {
        let waitlistQuery = supabase
          .from("waitlist")
          .update({ status: "booked" })
          .eq("tenant_id", tenantId)
          .eq("status", "waiting");

        // Match by user_id or phone
        if (bookingData.user_id) {
          waitlistQuery = waitlistQuery.eq("user_id", bookingData.user_id);
        } else if (normalizedPhone) {
          // Match by phone - need to check if phone matches
          waitlistQuery = waitlistQuery.ilike("client_phone", `%${normalizedPhone}%`);
        }

        // Also match preferred date if it matches the booking date
        const { data: updatedWaitlist, error: waitlistError } = await waitlistQuery.or(
          `preferred_date.is.null,preferred_date.eq.${bookingDate}`,
        );

        if (waitlistError) {
          console.error("Error updating waitlist:", waitlistError);
        } else if (updatedWaitlist) {
          console.log("Marked waitlist entries as booked");
        }
      } catch (waitlistErr) {
        console.error("Error marking waitlist as booked:", waitlistErr);
      }
    }

    // Push notifications are used instead of internal messages

    // Send push notification to tenant admins for new booking (only for web/app bookings, not CRM)
    if (bookingData.canal !== "crm") {
      const [year, month, day] = [bookingDate.slice(0, 4), bookingDate.slice(5, 7), bookingDate.slice(8, 10)];
      const formattedDate = `${day}/${month}/${year}`;
      const serviceNames = bookingData.services.map((s) => s.name).join(", ");
      const servicePreview = serviceNames.length > 30 ? serviceNames.substring(0, 30) + "..." : serviceNames;

      // Notify admins
      try {
        const { data: tenantAdmins } = await supabase.from("tenant_admins").select("user_id").eq("tenant_id", tenantId);

        if (tenantAdmins && tenantAdmins.length > 0) {
          for (const admin of tenantAdmins) {
            await supabase.functions.invoke("send-push-notification", {
              body: {
                user_id: admin.user_id,
                title: "✨ Nueva reserva",
                body: `${customer_name} • ${formattedDate} ${bookingTime.slice(0, 5)}\n${servicePreview}`,
                data: {
                  type: "new_booking",
                  booking_id: createdBookings[0]?.id,
                  tenant_id: tenantId,
                },
              },
            });
          }
          console.log("Push notification sent to", tenantAdmins.length, "admin(s)");
        }
      } catch (pushError) {
        console.error("Error sending admin push notification:", pushError);
      }

      // Notify the user who made the booking
      if (bookingData.user_id) {
        try {
          // Get tenant name for the notification
          const { data: tenantData } = await supabase.from("tenants").select("name").eq("id", tenantId).single();

          const tenantName = tenantData?.name || "el salón";

          await supabase.functions.invoke("send-push-notification", {
            body: {
              user_id: bookingData.user_id,
              title: "✅ ¡Reserva confirmada!",
              body: `Tu cita en ${tenantName} el ${formattedDate} a las ${bookingTime.slice(0, 5)} está lista`,
              data: {
                type: "booking_confirmed",
                booking_id: createdBookings[0]?.id,
                tenant_id: tenantId,
              },
            },
          });
          console.log("Booking confirmation sent to user:", bookingData.user_id);
        } catch (userPushError) {
          console.error("Error sending user booking confirmation:", userPushError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookings: createdBookings,
        message: bookingData.recurrence
          ? `${createdBookings.length} recurring bookings created successfully`
          : "Booking created successfully",
        stylist: actualStylist,
        tenant_id: tenantId,
        recurrence_group_id: recurrenceGroupId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in create-booking:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
