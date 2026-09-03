import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { es, ca } from "date-fns/locale";
import { format } from "date-fns";
import { useT, useTenantLang } from "@/lib/tenantI18n";
import { Service, TimeRange } from "@/types/booking";
import { useTenantBusinessHours } from "@/hooks/useTenantBusinessHours";
import { Loader2, Clock, Bell, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
interface TenantStylist {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  avatar_url: string | null;
}

interface TenantDateTimeSelectionProps {
  tenantId: string;
  selectedDate: Date | null;
  selectedTime: string | null;
  totalDuration: number;
  services: Service[];
  stylist: string; // stylist slug or "any"
  onNext: (date: Date, time: string, resolvedStylist?: string) => void;
  onBack: () => void;
  onChange?: (date: Date | null, time: string | null, resolvedStylist?: string) => void;
  hideFooter?: boolean;
}

// Utility functions
function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

function formatDateToISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function hasOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
  return start1 < end2 && start2 < end1;
}

function getActiveWindows(startMin: number, services: Service[]): TimeRange[] {
  const windows: TimeRange[] = [];
  let currentTime = startMin;

  for (const service of services) {
    if (service.type === "Compuesto") {
      windows.push({ start: currentTime, end: currentTime + service.duration_part1_active });
      currentTime += service.duration_part1_active + service.duration_exposure_pause;
      windows.push({ start: currentTime, end: currentTime + service.duration_part2_active });
      currentTime += service.duration_part2_active;
    } else {
      windows.push({ start: currentTime, end: currentTime + service.duration });
      currentTime += service.duration;
    }
  }

  return windows;
}

function parseBookedSlotsToRanges(bookedSlots: Array<{ Hora: string; total_duration: number }>): TimeRange[] {
  return bookedSlots.map((booking) => {
    const startMinutes = timeStringToMinutes(booking.Hora.substring(0, 5));
    return { start: startMinutes, end: startMinutes + booking.total_duration };
  });
}

export const TenantDateTimeSelection = ({
  tenantId,
  selectedDate,
  selectedTime,
  totalDuration,
  services,
  stylist,
  onNext,
  onBack,
  onChange,
  hideFooter = false,
}: TenantDateTimeSelectionProps) => {
  const [date, setDate] = useState<Date | undefined>(selectedDate || undefined);
  const [time, setTime] = useState<string | null>(selectedTime);
  const timesRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [stylists, setStylists] = useState<TenantStylist[]>([]);
  const [bookedRanges, setBookedRanges] = useState<TimeRange[]>([]);
  const [fusedAvailableSlots, setFusedAvailableSlots] = useState<string[]>([]);
  const [slotToStylists, setSlotToStylists] = useState<Record<string, TenantStylist[]>>({});
  const [selectedSlotStylist, setSelectedSlotStylist] = useState<string | null>(null);

  // Synchronize selection changes with parent
  useEffect(() => {
    onChange?.(date || null, time || null, selectedSlotStylist || undefined);
  }, [date, time, selectedSlotStylist]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const [stylistsLoading, setStylistsLoading] = useState(true);

  // Waitlist state
  const [showWaitlistDialog, setShowWaitlistDialog] = useState(false);
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);

  // User authentication state
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const { toast } = useToast();
  const t = useT();
  const tenantLang = useTenantLang();
  const dfLocale = tenantLang === "ca" ? ca : es;

  const {
    businessHours,
    loading: hoursLoading,
    generateBaseSlots,
    getBusinessHoursForDay,
    getClosedDays,
  } = useTenantBusinessHours(tenantId);

  // Fetch current user profile
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

          setCurrentUser({
            id: user.id,
            name: profile?.full_name || user.email || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setUserLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);
  // Fetch tenant stylists
  useEffect(() => {
    const fetchStylists = async () => {
      try {
        const { data, error } = await supabase
          .from("tenant_stylists")
          .select("id, name, slug, color, avatar_url")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (error) throw error;
        setStylists(data || []);
      } catch (error) {
        console.error("Error fetching stylists:", error);
      } finally {
        setStylistsLoading(false);
      }
    };

    if (tenantId) {
      fetchStylists();
    }
  }, [tenantId]);

  // Calculate available slots for a specific stylist
  const computeAvailableSlotsForStylist = (
    selectedDate: Date,
    bookedData: { bookedSlots?: Array<{ Hora: string; total_duration: number }> },
  ): string[] => {
    const ranges = parseBookedSlotsToRanges(bookedData?.bookedSlots || []);
    const dayOfWeek = selectedDate.getDay();
    const hours = getBusinessHoursForDay(dayOfWeek, selectedDate);

    if (hours.isClosed) return [];

    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const currentMinutes = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : 0;

    // Generate base slots
    const slotsSet = generateBaseSlots(dayOfWeek, selectedDate);

    // Add flexible slots after existing bookings
    ranges.forEach((booking) => {
      const endTime = booking.end;
      const inMorning = endTime >= hours.morningStart && endTime < hours.morningEnd;
      const inAfternoon = endTime >= hours.afternoonStart && endTime < hours.afternoonEnd;
      if (inMorning || inAfternoon) {
        slotsSet.add(endTime);
      }
    });

    // Convert to sorted array
    const allSlots = Array.from(slotsSet)
      .sort((a, b) => a - b)
      .map(minutesToTimeString);

    // Filter available slots
    return allSlots.filter((slot) => {
      const startMinutes = timeStringToMinutes(slot);
      const endMinutes = startMinutes + totalDuration;

      if (isToday && startMinutes <= currentMinutes) return false;

      const inMorning = startMinutes >= hours.morningStart && startMinutes < hours.morningEnd;
      const inAfternoon = startMinutes >= hours.afternoonStart && startMinutes < hours.afternoonEnd;

      if (inMorning && endMinutes > hours.morningEnd) return false;
      if (inAfternoon && endMinutes > hours.afternoonEnd) return false;

      // Calcular las ventanas activas para verificar cada una
      const activeWindows = getActiveWindows(startMinutes, services);

      // Para servicios compuestos, verificar que CADA ventana activa esté dentro del horario
      // Esto es importante porque la parte 2 podría caer después del cierre
      for (const window of activeWindows) {
        const windowInMorning = window.start >= hours.morningStart && window.start < hours.morningEnd;
        const windowInAfternoon = window.start >= hours.afternoonStart && window.start < hours.afternoonEnd;

        // Si la ventana comienza en el periodo de mañana, debe terminar antes del cierre de mañana
        if (windowInMorning && window.end > hours.morningEnd) return false;
        // Si la ventana comienza en el periodo de tarde, debe terminar antes del cierre de tarde
        if (windowInAfternoon && window.end > hours.afternoonEnd) return false;
        // Si la ventana no está ni en mañana ni en tarde (ej: durante la pausa o fuera de horario), no es válida
        if (!windowInMorning && !windowInAfternoon) return false;

        // Check overlap with bookings
        for (const booking of ranges) {
          if (hasOverlap(window.start, window.end, booking.start, booking.end)) {
            return false;
          }
        }
      }

      return true;
    });
  };

  // Fetch booked appointments when date changes
  useEffect(() => {
    if (!date || stylistsLoading || hoursLoading || !tenantId) return;

    const fetchBookedSlots = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const dateStr = formatDateToISO(date);

        if (stylist === "any" && stylists.length > 0) {
          // Fetch all stylists and merge availability
          const responses = await Promise.all(
            stylists.map((s) =>
              supabase.functions.invoke("check-availability", {
                body: { date: dateStr, stylist: s.slug, totalDuration, tenant_id: tenantId },
              }),
            ),
          );

          // Fallar en cerrado: si alguna respuesta falla no podemos fiarnos de
          // la disponibilidad mostrada. Mejor pedir reintento que ofrecer
          // huecos que luego el servidor rechazará al confirmar.
          if (responses.some((r) => r.error || !r.data)) {
            setFusedAvailableSlots([]);
            setSlotToStylists({});
            setBookedRanges([]);
            setLoadError(true);
            return;
          }

          // Merge all available slots and track which stylists are available per slot
          const slotsMap: Record<string, TenantStylist[]> = {};
          responses.forEach((response, index) => {
            const slots = computeAvailableSlotsForStylist(date, response.data);
            slots.forEach((slot) => {
              if (!slotsMap[slot]) slotsMap[slot] = [];
              slotsMap[slot].push(stylists[index]);
            });
          });

          const mergedSlots = Object.keys(slotsMap).sort();
          setFusedAvailableSlots(mergedSlots);
          setSlotToStylists(slotsMap);
          setBookedRanges([]);
        } else {
          // Regular handling for specific stylist
          const { data, error } = await supabase.functions.invoke("check-availability", {
            body: { date: dateStr, stylist, totalDuration, tenant_id: tenantId },
          });

          if (error || !data) {
            // Fallar en cerrado: sin datos no hay huecos que ofrecer
            setBookedRanges([]);
            setFusedAvailableSlots([]);
            setLoadError(true);
            return;
          }

          const ranges = parseBookedSlotsToRanges(data?.bookedSlots || []);
          setBookedRanges(ranges);
          setFusedAvailableSlots([]);
        }
      } catch {
        setBookedRanges([]);
        setFusedAvailableSlots([]);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBookedSlots();
  }, [date, stylist, totalDuration, services, stylists, stylistsLoading, hoursLoading, tenantId, retryTick]);

  // Generate available time slots for specific stylist
  const getAvailableTimeSlots = (selectedDate: Date | undefined): string[] => {
    if (!selectedDate) return [];

    const dayOfWeek = selectedDate.getDay();
    const hours = getBusinessHoursForDay(dayOfWeek, selectedDate);

    if (hours.isClosed) return [];

    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const currentMinutes = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : 0;

    // Generate base slots
    const slotsSet = generateBaseSlots(dayOfWeek, selectedDate);

    // Add flexible slots after bookings
    bookedRanges.forEach((booking) => {
      const endTime = booking.end;
      const inMorning = endTime >= hours.morningStart && endTime < hours.morningEnd;
      const inAfternoon = endTime >= hours.afternoonStart && endTime < hours.afternoonEnd;
      if (inMorning || inAfternoon) {
        slotsSet.add(endTime);
      }
    });

    const allSlots = Array.from(slotsSet)
      .sort((a, b) => a - b)
      .map(minutesToTimeString);

    return allSlots.filter((slot) => {
      const startMinutes = timeStringToMinutes(slot);
      const endMinutes = startMinutes + totalDuration;

      if (isToday && startMinutes <= currentMinutes) return false;

      const inMorning = startMinutes >= hours.morningStart && startMinutes < hours.morningEnd;
      const inAfternoon = startMinutes >= hours.afternoonStart && startMinutes < hours.afternoonEnd;

      if (inMorning && endMinutes > hours.morningEnd) return false;
      if (inAfternoon && endMinutes > hours.afternoonEnd) return false;

      // Calcular las ventanas activas para verificar cada una
      const activeWindows = getActiveWindows(startMinutes, services);

      // Para servicios compuestos, verificar que CADA ventana activa esté dentro del horario
      // Esto es importante porque la parte 2 podría caer después del cierre
      for (const window of activeWindows) {
        const windowInMorning = window.start >= hours.morningStart && window.start < hours.morningEnd;
        const windowInAfternoon = window.start >= hours.afternoonStart && window.start < hours.afternoonEnd;

        // Si la ventana comienza en el periodo de mañana, debe terminar antes del cierre de mañana
        if (windowInMorning && window.end > hours.morningEnd) return false;
        // Si la ventana comienza en el periodo de tarde, debe terminar antes del cierre de tarde
        if (windowInAfternoon && window.end > hours.afternoonEnd) return false;
        // Si la ventana no está ni en mañana ni en tarde (ej: durante la pausa o fuera de horario), no es válida
        if (!windowInMorning && !windowInAfternoon) return false;

        // Check overlap with bookings
        for (const booking of bookedRanges) {
          if (hasOverlap(window.start, window.end, booking.start, booking.end)) {
            return false;
          }
        }
      }

      return true;
    });
  };

  // Con error de carga nunca ofrecer huecos: bookedRanges vacío haría parecer
  // el día entero libre (fallo en abierto).
  const timeSlots = loadError ? [] : stylist === "any" ? fusedAvailableSlots : getAvailableTimeSlots(date);

  const handleTimeSelect = (slot: string) => {
    setTime(slot);

    // Auto-assign the first available stylist so the user is never blocked!
    if (stylist === "any") {
      const available = slotToStylists[slot] || [];
      if (available.length > 0) {
        setSelectedSlotStylist(available[0].slug);
      }
    }
  };

  // Autoscroll: al elegir fecha, acompaña suavemente a las horas disponibles
  useEffect(() => {
    if (!date) return;
    const id = setTimeout(
      () => timesRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
      120,
    );
    return () => clearTimeout(id);
  }, [date]);

  const handleNext = async () => {
    if (!date || !time) return;

    if (stylist === "any") {
      const available = slotToStylists[time] || [];
      const resolved = selectedSlotStylist || available[0]?.slug;
      onNext(date, time, resolved);
    } else {
      onNext(date, time);
    }
  };

  // Handle waitlist submission
  const handleWaitlistSubmit = async () => {
    if (!currentUser || !date) {
      toast({
        title: "Error",
        description: t("booking.waitlistLoginRequired"),
        variant: "destructive",
      });
      return;
    }

    const nameToUse = (currentUser.name || "").trim() || "Usuario";

    setWaitlistSubmitting(true);
    try {
      const preferredStylistId = stylist !== "any" ? stylists.find((s) => s.slug === stylist)?.id : null;

      const { data: inserted, error } = await supabase
        .from("waitlist" as any)
        .insert({
          tenant_id: tenantId,
          user_id: currentUser.id,
          client_name: nameToUse,
          client_phone: null,
          preferred_date: format(date, "yyyy-MM-dd"),
          preferred_stylist_id: preferredStylistId,
          services: services.map((s: any) => ({
            id: s.id,
            name: s.name,
            duration:
              s.duration ||
              (s.duration_part1_active || 0) +
                (s.duration_exposure_pause || 0) +
                (s.duration_part2_active || 0),
          })),
          notes: `Duración: ${totalDuration} min`,
          status: "waiting",
          priority: 3,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Notify salon admin so they can act on it
      try {
        const { data: admins } = await supabase
          .from("tenant_admins")
          .select("user_id")
          .eq("tenant_id", tenantId);
        if (admins && admins.length > 0) {
          const dateStr = format(date, "d 'de' MMMM", { locale: es });
          await supabase.from("notifications").insert(
            admins.map((a: any) => ({
              user_id: a.user_id,
              tenant_id: tenantId,
              type: "waitlist_new",
              title: "Nueva clienta en lista de espera",
              message: `${nameToUse} se ha apuntado para ${dateStr}. Proponle un hueco si puedes.`,
              metadata: { waitlist_id: (inserted as any)?.id },
              action_url: "/admin?tab=agenda",
            }))
          );
        }
      } catch (notifyErr) {
        console.error("Could not notify admin:", notifyErr);
      }

      toast({
        title: t("booking.waitlistSuccessTitle"),
        description: t("booking.waitlistSuccessDesc"),
      });

      setShowWaitlistDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || t("booking.waitlistError"),
        variant: "destructive",
      });
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  // Get closed days for calendar disabling
  const closedDays = getClosedDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const disabledDays = [{ dayOfWeek: closedDays }, { before: today }];

  if (stylistsLoading || hoursLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:gap-8 md:grid-cols-[1fr_1.25fr] items-start">
        <div className="bg-neutral-50/60 p-4 sm:p-5 rounded-2xl border border-neutral-200/80">
          <h3 className="mb-3 font-semibold text-sm font-body text-neutral-600">
            {t("booking.selectDate")}
          </h3>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={disabledDays}
            weekStartsOn={1}
            locale={dfLocale}
            className={cn("w-full bg-white rounded-xl border border-neutral-200/80 shadow-xs p-3")}
          />
        </div>

        <div ref={timesRef} className="scroll-mt-4 bg-neutral-50/60 p-4 sm:p-5 rounded-2xl border border-neutral-200/80">
          <h3 className="mb-3 font-semibold text-sm font-body text-neutral-600">
            {t("booking.selectTime")}
          </h3>
          {!date ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t("booking.firstSelectDate")}</p>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {t("booking.loadingAvailable")}
            </div>
          ) : loadError ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <Clock className="h-5 w-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{t("booking.loadError")}</p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setRetryTick((n) => n + 1)}>
                {t("booking.retry")}
              </Button>
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border/50">
                <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">
                  {t("booking.noSlotsDay")}
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2 border-primary/50 text-primary hover:bg-primary/10"
                onClick={() => setShowWaitlistDialog(true)}
              >
                <Bell className="h-4 w-4" />
                {t("booking.addMeWaitlist")}
              </Button>
            </div>
          ) : (
            (() => {
              const dayOfWeek = date.getDay();
              const hours = getBusinessHoursForDay(dayOfWeek, date);
              const hasAfternoon = hours.afternoonStart > 0 && hours.afternoonEnd > 0;

              // Split slots into morning and afternoon
              const morningSlots = timeSlots.filter((slot) => {
                const minutes = timeStringToMinutes(slot);
                return minutes < hours.morningEnd;
              });
              const afternoonSlots = timeSlots.filter((slot) => {
                const minutes = timeStringToMinutes(slot);
                return minutes >= hours.afternoonStart;
              });

              return (
                <div className="space-y-4 max-h-[340px] md:max-h-none md:overflow-visible overflow-y-auto pr-1">
                  {morningSlots.length > 0 && (
                    <div>
                      <p className="text-xs text-neutral-600 mb-2 font-semibold flex items-center gap-1.5">
                        ☀️ <span>{t("booking.morning")}</span>
                        <span className="text-neutral-400 font-normal">({minutesToTimeString(hours.morningStart)} - {minutesToTimeString(hours.morningEnd)})</span>
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {morningSlots.map((slot) => {
                          const available = stylist === "any" ? slotToStylists[slot] || [] : [];
                          return (
                            <Button
                              key={slot}
                              variant={time === slot ? "default" : "outline"}
                              size="default"
                              onClick={() => handleTimeSelect(slot)}
                              className={cn(
                                "h-auto min-h-[48px] py-1.5 px-2 text-center flex flex-col items-center justify-center transition-all duration-150 touch-manipulation rounded-xl",
                                time === slot
                                  ? "shadow-md ring-2 ring-primary ring-offset-1 font-bold"
                                  : "border-neutral-200/90 text-neutral-800 hover:border-primary/50 hover:bg-neutral-50",
                              )}
                            >
                              <span className="text-[14.5px] font-bold leading-tight">{slot}</span>
                              {stylist === "any" && available.length > 0 && (
                                <span className={cn(
                                  "text-[11px] font-medium leading-tight truncate max-w-full mt-0.5",
                                  time === slot ? "text-primary-foreground/95 font-semibold" : "text-neutral-500"
                                )}>
                                  {available.length === 1 ? available[0].name : "2 disponibles"}
                                </span>
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {hasAfternoon && morningSlots.length > 0 && afternoonSlots.length > 0 && (
                    <div className="flex items-center gap-2 py-1">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground px-2 font-medium">
                        {t("booking.breakLabel")} ({minutesToTimeString(hours.morningEnd)} - {minutesToTimeString(hours.afternoonStart)})
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}

                  {afternoonSlots.length > 0 && hasAfternoon && (
                    <div>
                      <p className="text-xs text-neutral-600 mb-2 font-semibold flex items-center gap-1.5">
                        🌙 <span>{t("booking.afternoon")}</span>
                        <span className="text-neutral-400 font-normal">({minutesToTimeString(hours.afternoonStart)} - {minutesToTimeString(hours.afternoonEnd)})</span>
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {afternoonSlots.map((slot) => {
                          const available = stylist === "any" ? slotToStylists[slot] || [] : [];
                          return (
                            <Button
                              key={slot}
                              variant={time === slot ? "default" : "outline"}
                              size="default"
                              onClick={() => handleTimeSelect(slot)}
                              className={cn(
                                "h-auto min-h-[48px] py-1.5 px-2 text-center flex flex-col items-center justify-center transition-all duration-150 touch-manipulation rounded-xl",
                                time === slot
                                  ? "shadow-md ring-2 ring-primary ring-offset-1 font-bold"
                                  : "border-neutral-200/90 text-neutral-800 hover:border-primary/50 hover:bg-neutral-50",
                              )}
                            >
                              <span className="text-[14.5px] font-bold leading-tight">{slot}</span>
                              {stylist === "any" && available.length > 0 && (
                                <span className={cn(
                                  "text-[11px] font-medium leading-tight truncate max-w-full mt-0.5",
                                  time === slot ? "text-primary-foreground/95 font-semibold" : "text-neutral-500"
                                )}>
                                  {available.length === 1 ? available[0].name : "2 disponibles"}
                                </span>
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}
          {/* Stylist card when time is selected */}
          {stylist === "any" && time && (slotToStylists[time]?.length || 0) >= 1 && (
            <div className="mt-4 space-y-2.5 p-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-200/70">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-neutral-900">
                  {slotToStylists[time].length > 1 ? t("booking.whoPrefer") : "Profesional para este horario"}
                </p>
                <span className="text-xs text-neutral-500 font-medium">
                  {slotToStylists[time].length > 1 ? "(Toca para elegir estilista)" : "Asignada a esta hora"}
                </span>
              </div>
              <div className={cn("grid gap-2.5", slotToStylists[time].length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                {slotToStylists[time].map((s) => (
                  <Card
                    key={s.slug}
                    className={cn(
                      "cursor-pointer border-2 p-3 flex items-center gap-3 transition-all touch-manipulation rounded-xl shadow-xs",
                      selectedSlotStylist === s.slug
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-neutral-200 bg-white hover:border-primary/40"
                    )}
                    onClick={() => setSelectedSlotStylist(s.slug)}
                  >
                    {s.avatar_url ? (
                      <img src={s.avatar_url} alt={s.name} className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 text-white text-sm" style={{ backgroundColor: s.color || 'hsl(var(--primary))' }}>
                        <User className="h-4 w-4" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-[13.5px] font-semibold text-neutral-900 truncate block">{s.name}</span>
                      <span className="text-[11px] font-medium text-primary block leading-tight">
                        {slotToStylists[time].length > 1
                          ? (selectedSlotStylist === s.slug ? "Seleccionada" : "Tocar para elegir")
                          : "Profesional asignada"}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {date && time && (
            <p className="mt-4 text-xs text-muted-foreground">
              {t("booking.estimatedDuration", { min: totalDuration, end: minutesToTimeString(timeStringToMinutes(time) + totalDuration) })}
            </p>
          )}
        </div>
      </div>

      {!hideFooter && (
        <div ref={footerRef} className="mt-6 pt-4 border-t border-neutral-200 flex justify-between items-center scroll-mt-4">
          <Button variant="outline" onClick={onBack} className="h-11 px-5 rounded-xl font-medium transition-transform duration-200 hover:scale-105">
            {t("booking.back")}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!date || !time}
            className="h-11 px-6 rounded-xl font-semibold transition-transform duration-200 hover:scale-105 disabled:scale-100 shadow-sm"
          >
            {t("booking.continue")}
          </Button>
        </div>
      )}

      {/* Waitlist Dialog */}
      <Dialog open={showWaitlistDialog} onOpenChange={setShowWaitlistDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              {t("booking.waitlistTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("booking.waitlistNotify", { date: date ? format(date, "d 'de' MMMM", { locale: dfLocale }) : t("booking.thisDate") })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {currentUser ? (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm font-medium text-foreground mb-1">{t("booking.addYouAs")}</p>
                <p className="text-sm text-muted-foreground">{currentUser.name}</p>
              </div>
            ) : (
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-sm text-destructive">{t("booking.waitlistLoginRequired")}</p>
              </div>
            )}

            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-1">{t("booking.requestedServices")}</p>
              <p>{services.map((s) => s.name).join(", ")}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWaitlistDialog(false)} disabled={waitlistSubmitting}>
              {t("booking.cancel")}
            </Button>
            <Button onClick={handleWaitlistSubmit} disabled={waitlistSubmitting || !currentUser}>
              {waitlistSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("booking.adding")}
                </>
              ) : (
                t("booking.waitlistAdd")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantDateTimeSelection;
