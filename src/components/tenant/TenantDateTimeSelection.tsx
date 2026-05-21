import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { es } from "date-fns/locale";
import { format } from "date-fns";
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
}: TenantDateTimeSelectionProps) => {
  const [date, setDate] = useState<Date | undefined>(selectedDate || undefined);
  const [time, setTime] = useState<string | null>(selectedTime);
  const [stylists, setStylists] = useState<TenantStylist[]>([]);
  const [bookedRanges, setBookedRanges] = useState<TimeRange[]>([]);
  const [fusedAvailableSlots, setFusedAvailableSlots] = useState<string[]>([]);
  const [slotToStylists, setSlotToStylists] = useState<Record<string, TenantStylist[]>>({});
  const [selectedSlotStylist, setSelectedSlotStylist] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stylistsLoading, setStylistsLoading] = useState(true);

  // Waitlist state
  const [showWaitlistDialog, setShowWaitlistDialog] = useState(false);
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);

  // User authentication state
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const { toast } = useToast();

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

          // Merge all available slots and track which stylists are available per slot
          const slotsMap: Record<string, TenantStylist[]> = {};
          responses.forEach((response, index) => {
            if (!response.error && response.data) {
              const slots = computeAvailableSlotsForStylist(date, response.data);
              slots.forEach((slot) => {
                if (!slotsMap[slot]) slotsMap[slot] = [];
                slotsMap[slot].push(stylists[index]);
              });
            }
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

          if (error) {
            setBookedRanges([]);
            return;
          }

          const ranges = parseBookedSlotsToRanges(data?.bookedSlots || []);
          setBookedRanges(ranges);
          setFusedAvailableSlots([]);
        }
      } catch {
        setBookedRanges([]);
        setFusedAvailableSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookedSlots();
  }, [date, stylist, totalDuration, services, stylists, stylistsLoading, hoursLoading, tenantId]);

  // Generate available time slots for specific stylist
  const getAvailableTimeSlots = (selectedDate: Date | undefined): string[] => {
    if (!selectedDate) return [];

    const dayOfWeek = selectedDate.getDay();
    const hours = getBusinessHoursForDay(dayOfWeek);

    if (hours.isClosed) return [];

    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const currentMinutes = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : 0;

    // Generate base slots
    const slotsSet = generateBaseSlots(dayOfWeek);

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

  const timeSlots = stylist === "any" ? fusedAvailableSlots : getAvailableTimeSlots(date);

  const handleTimeSelect = (slot: string) => {
    setTime(slot);
    setSelectedSlotStylist(null);
    
    // If "any" and only 1 stylist available at this slot, auto-assign
    if (stylist === "any" && slotToStylists[slot]?.length === 1) {
      setSelectedSlotStylist(slotToStylists[slot][0].slug);
    }
  };

  const handleNext = async () => {
    if (!date || !time) return;

    if (stylist === "any") {
      const available = slotToStylists[time] || [];
      if (available.length === 1) {
        onNext(date, time, available[0].slug);
      } else if (selectedSlotStylist) {
        onNext(date, time, selectedSlotStylist);
      }
    } else {
      onNext(date, time);
    }
  };

  // Handle waitlist submission
  const handleWaitlistSubmit = async () => {
    if (!currentUser || !date) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para unirte a la lista de espera",
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
        title: "¡Te avisaremos! 🔔",
        description:
          "Estás en la lista de espera. Si surge un hueco, te llegará un aviso para confirmarlo con un toque.",
      });

      setShowWaitlistDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo añadir a la lista de espera",
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
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-4 font-semibold text-foreground">Selecciona una fecha</h3>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={disabledDays}
            weekStartsOn={1}
            locale={es}
            className={cn("rounded-md border pointer-events-auto")}
          />
        </div>

        <div>
          <h3 className="mb-4 font-semibold text-foreground">Selecciona una hora</h3>
          {!date ? (
            <p className="text-sm text-muted-foreground">Primero selecciona una fecha</p>
          ) : loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando horarios disponibles...
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border/50">
                <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">
                  No hay horarios disponibles para este día. Todos los slots están reservados.
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2 border-primary/50 text-primary hover:bg-primary/10"
                onClick={() => setShowWaitlistDialog(true)}
              >
                <Bell className="h-4 w-4" />
                Añadirme a la lista de espera
              </Button>
            </div>
          ) : (
            (() => {
              const dayOfWeek = date.getDay();
              const hours = getBusinessHoursForDay(dayOfWeek);
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
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {morningSlots.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 font-medium">
                        ☀️ Mañana ({minutesToTimeString(hours.morningStart)} - {minutesToTimeString(hours.morningEnd)})
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
                                "h-auto min-h-[2.75rem] text-sm font-medium transition-all duration-200 hover:shadow-md touch-manipulation flex-col gap-0.5 py-1.5",
                                time === slot && "shadow-glow",
                              )}
                            >
                              <span>{slot}</span>
                              {stylist === "any" && available.length > 0 && (
                                <span className="flex -space-x-1.5 mt-0.5">
                                  {available.slice(0, 3).map((s) => (
                                    s.avatar_url ? (
                                      <img key={s.slug} src={s.avatar_url} alt={s.name} className="h-4 w-4 rounded-full border border-background object-cover" />
                                    ) : (
                                      <span key={s.slug} className="flex h-4 w-4 items-center justify-center rounded-full border border-background text-[8px] text-white" style={{ backgroundColor: s.color || 'hsl(var(--primary))' }}>
                                        {s.name[0]}
                                      </span>
                                    )
                                  ))}
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
                      <span className="text-xs text-muted-foreground px-2">
                        Descanso ({minutesToTimeString(hours.morningEnd)} - {minutesToTimeString(hours.afternoonStart)})
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}

                  {afternoonSlots.length > 0 && hasAfternoon && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 font-medium">
                        🌙 Tarde ({minutesToTimeString(hours.afternoonStart)} -{" "}
                        {minutesToTimeString(hours.afternoonEnd)})
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
                                "h-auto min-h-[2.75rem] text-sm font-medium transition-all duration-200 hover:shadow-md touch-manipulation flex-col gap-0.5 py-1.5",
                                time === slot && "shadow-glow",
                              )}
                            >
                              <span>{slot}</span>
                              {stylist === "any" && available.length > 0 && (
                                <span className="flex -space-x-1.5 mt-0.5">
                                  {available.slice(0, 3).map((s) => (
                                    s.avatar_url ? (
                                      <img key={s.slug} src={s.avatar_url} alt={s.name} className="h-4 w-4 rounded-full border border-background object-cover" />
                                    ) : (
                                      <span key={s.slug} className="flex h-4 w-4 items-center justify-center rounded-full border border-background text-[8px] text-white" style={{ backgroundColor: s.color || 'hsl(var(--primary))' }}>
                                        {s.name[0]}
                                      </span>
                                    )
                                  ))}
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
          {/* Stylist picker when multiple are available for selected slot */}
          {stylist === "any" && time && (slotToStylists[time]?.length || 0) > 1 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-foreground">¿Con quién prefieres?</p>
              <div className="grid grid-cols-2 gap-2">
                {slotToStylists[time].map((s) => (
                  <Card
                    key={s.slug}
                    className={cn(
                      "cursor-pointer border-2 p-3 flex items-center gap-3 transition-all touch-manipulation",
                      selectedSlotStylist === s.slug
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
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
                    <span className="text-sm font-medium text-foreground truncate">{s.name}</span>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {date && time && (
            <p className="mt-4 text-xs text-muted-foreground">
              Duración estimada: {totalDuration} minutos (finaliza a las{" "}
              {minutesToTimeString(timeStringToMinutes(time) + totalDuration)})
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="transition-transform duration-200 hover:scale-105">
          Volver
        </Button>
        <Button
          onClick={handleNext}
          disabled={!date || !time || (stylist === "any" && time && (slotToStylists[time]?.length || 0) > 1 && !selectedSlotStylist)}
          className="transition-transform duration-200 hover:scale-105 disabled:scale-100"
        >
          Continuar
        </Button>
      </div>

      {/* Waitlist Dialog */}
      <Dialog open={showWaitlistDialog} onOpenChange={setShowWaitlistDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Lista de espera
            </DialogTitle>
            <DialogDescription>
              Te notificaremos dentro de la app cuando haya disponibilidad para{" "}
              {date ? format(date, "d 'de' MMMM", { locale: es }) : "esta fecha"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {currentUser ? (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm font-medium text-foreground mb-1">Te añadiremos como:</p>
                <p className="text-sm text-muted-foreground">{currentUser.name}</p>
              </div>
            ) : (
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-sm text-destructive">Debes iniciar sesión para unirte a la lista de espera</p>
              </div>
            )}

            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-1">Servicios solicitados:</p>
              <p>{services.map((s) => s.name).join(", ")}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWaitlistDialog(false)} disabled={waitlistSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleWaitlistSubmit} disabled={waitlistSubmitting || !currentUser}>
              {waitlistSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Añadiendo...
                </>
              ) : (
                "Añadir a lista de espera"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantDateTimeSelection;
