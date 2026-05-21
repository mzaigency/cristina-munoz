import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { es } from "date-fns/locale";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stylist, Service, TimeRange } from "@/types/booking";
import { useTenantBusinessHours } from "@/hooks/useTenantBusinessHours";
import { Loader2, Clock, Bell, User } from "lucide-react";
import {
  hasOverlap,
  getActiveWindows,
  formatDateToISO,
  timeStringToMinutes,
  minutesToTimeString,
} from "@/lib/booking-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface DateTimeSelectionProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  totalDuration: number;
  services: Service[];
  stylist: Stylist;
  tenantId?: string;
  onNext: (date: Date, time: string, resolvedStylist?: Stylist, skipAvailabilityCheck?: boolean) => void;
  onBack: () => void;
  isAdmin?: boolean;
}

/** Convierte los slots reservados de la API a rangos de tiempo */
function parseBookedSlotsToRanges(bookedSlots: Array<{ Hora: string; total_duration: number }>): TimeRange[] {
  return bookedSlots.map((booking) => {
    const startMinutes = timeStringToMinutes(booking.Hora.substring(0, 5));
    return {
      start: startMinutes,
      end: startMinutes + booking.total_duration,
    };
  });
}

export const DateTimeSelection = ({
  selectedDate,
  selectedTime,
  totalDuration,
  services,
  stylist,
  tenantId,
  onNext,
  onBack,
  isAdmin = false,
}: DateTimeSelectionProps) => {
  const [date, setDate] = useState<Date | undefined>(selectedDate || undefined);
  const [time, setTime] = useState<string | null>(selectedTime);
  const [customHour, setCustomHour] = useState<string>("");
  const [customMinute, setCustomMinute] = useState<string>("");
  const [bookedRanges, setBookedRanges] = useState<TimeRange[]>([]);
  const [fusedAvailableSlots, setFusedAvailableSlots] = useState<string[]>([]);
  const [slotToStylists, setSlotToStylists] = useState<Record<string, Array<{ slug: string; id: string; name: string; color?: string | null; avatar_url?: string | null }>>>({});
  const [selectedSlotStylist, setSelectedSlotStylist] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stylists, setStylists] = useState<Array<{ slug: string; id: string; name: string; color?: string | null; avatar_url?: string | null }>>([]);

  // Waitlist state
  const [showWaitlistDialog, setShowWaitlistDialog] = useState(false);
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistPhone, setWaitlistPhone] = useState("");
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);

  const { toast } = useToast();

  // Use tenant business hours
  const {
    loading: hoursLoading,
    generateBaseSlots,
    getBusinessHoursForDay,
    getClosedDays,
  } = useTenantBusinessHours(tenantId || "");

  // Fetch tenant stylists
  useEffect(() => {
    if (!tenantId) return;

    const fetchStylists = async () => {
      const { data } = await supabase
        .from("tenant_stylists")
        .select("id, slug, name, color, avatar_url")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);

      setStylists((data || []) as any);
    };

    fetchStylists();
  }, [tenantId]);

  // Calculate available slots using tenant business hours
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

    // Generate base slots from tenant hours
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
    if (!date || hoursLoading || !tenantId) return;

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
          const slotsMap: Record<string, Array<{ slug: string; id: string; name: string; color?: string | null; avatar_url?: string | null }>> = {};
          responses.forEach((response, idx) => {
            if (!response.error && response.data) {
              const slots = computeAvailableSlotsForStylist(date, response.data);
              slots.forEach((slot) => {
                if (!slotsMap[slot]) slotsMap[slot] = [];
                slotsMap[slot].push(stylists[idx]);
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
  }, [date, stylist, totalDuration, services, stylists, hoursLoading, tenantId]);

  // Generate available time slots for specific stylist
  const getAvailableTimeSlots = (selectedDate: Date | undefined): string[] => {
    if (!selectedDate) return [];
    return computeAvailableSlotsForStylist(selectedDate, {
      bookedSlots: bookedRanges.map((r) => ({
        Hora: minutesToTimeString(r.start) + ":00",
        total_duration: r.end - r.start,
      })),
    });
  };

  const timeSlots = stylist === "any" ? fusedAvailableSlots : getAvailableTimeSlots(date);

  // Update time when custom hour or minute changes
  useEffect(() => {
    if (customHour && customMinute) {
      const formattedTime = `${customHour.padStart(2, "0")}:${customMinute.padStart(2, "0")}`;
      setTime(formattedTime);
    }
  }, [customHour, customMinute]);

  const handleNext = async () => {
    if (!date || !time) return;

    // In admin mode with custom time, skip availability checks
    if (isAdmin && (customHour || customMinute)) {
      const defaultStylist = selectedSlotStylist || (stylists.length > 0 ? stylists[0].slug : "cris");
      onNext(date, time, (stylist === "any" ? defaultStylist : stylist) as Stylist, true);
      return;
    }

    if (stylist === "any") {
      const available = slotToStylists[time] || [];
      if (available.length === 1) {
        onNext(date, time, available[0].slug as Stylist);
        return;
      }
      if (selectedSlotStylist) {
        onNext(date, time, selectedSlotStylist as Stylist);
        return;
      }
      // Fallback: query availability for each stylist
      try {
        const dateStr = formatDateToISO(date);
        const selectedStartMinutes = timeStringToMinutes(time);
        const activeWindows = getActiveWindows(selectedStartMinutes, services);

        const availabilityResults = await Promise.all(
          stylists.map(async (s) => {
            const { data, error } = await supabase.functions.invoke("check-availability", {
              body: { date: dateStr, stylist: s.slug, tenant_id: tenantId },
            });
            if (error) return { slug: s.slug, available: false };
            const ranges = parseBookedSlotsToRanges(data?.bookedSlots || []);
            const isAvailable = !activeWindows.some((window) =>
              ranges.some((booking) => hasOverlap(window.start, window.end, booking.start, booking.end)),
            );
            return { slug: s.slug, available: isAvailable };
          }),
        );
        const availableStylist = availabilityResults.find((r) => r.available);
        if (availableStylist) onNext(date, time, availableStylist.slug as Stylist);
      } catch {
        return;
      }
    } else {
      onNext(date, time);
    }
  };

  // Handle waitlist submission
  const handleWaitlistSubmit = async () => {
    if (!waitlistName.trim() || !waitlistPhone.trim() || !date || !tenantId) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    setWaitlistSubmitting(true);
    try {
      const serviceNames = services.map((s) => s.name).join(", ");
      const preferredStylistId = stylist !== "any" ? stylists.find((s) => s.slug === stylist)?.id : null;

      const { error } = await supabase.from("waitlist").insert({
        tenant_id: tenantId,
        client_name: waitlistName.trim(),
        client_phone: waitlistPhone.trim(),
        preferred_date: format(date, "yyyy-MM-dd"),
        preferred_stylist_id: preferredStylistId,
        services: services.map((s) => ({ id: s.id, name: s.name })),
        notes: `Duración total: ${totalDuration} min`,
        status: "waiting",
        priority: 3,
      });

      if (error) throw error;

      toast({
        title: "¡Añadido a la lista de espera!",
        description: "Te avisaremos cuando haya disponibilidad para esta fecha",
      });

      setShowWaitlistDialog(false);
      setWaitlistName("");
      setWaitlistPhone("");
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

  // Get closed days from tenant business hours
  const closedDays = getClosedDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const disabledDays = [{ dayOfWeek: closedDays }, { before: today }];

  if (hoursLoading) {
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
          ) : (
            <>
              {isAdmin && (
                <div className="mb-4 space-y-3 p-4 bg-accent/20 rounded-lg border border-accent">
                  <label className="text-sm font-medium text-foreground">Hora personalizada (SIN RESTRICCIONES)</label>
                  <div className="flex gap-2 items-center">
                    <Select value={customHour} onValueChange={setCustomHour}>
                      <SelectTrigger className="w-[100px] transition-colors duration-200 hover:border-primary">
                        <SelectValue placeholder="Hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")).map((hour) => (
                          <SelectItem key={hour} value={hour}>
                            {hour}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-lg font-semibold">:</span>
                    <Select value={customMinute} onValueChange={setCustomMinute}>
                      <SelectTrigger className="w-[100px] transition-colors duration-200 hover:border-primary">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {["00", "15", "30", "45"].map((minute) => (
                          <SelectItem key={minute} value={minute}>
                            {minute}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selecciona cualquier hora. Esta opción permite agendar fuera de horarios predefinidos.
                  </p>
                </div>
              )}

              {timeSlots.length === 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border/50">
                    <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      {isAdmin
                        ? "No hay horarios predefinidos disponibles. Puedes usar el campo de hora personalizada arriba."
                        : "No hay horarios disponibles para este día. Todos los slots están reservados."}
                    </p>
                  </div>

                  {!isAdmin && (
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-primary/50 text-primary hover:bg-primary/10"
                      onClick={() => setShowWaitlistDialog(true)}
                    >
                      <Bell className="h-4 w-4" />
                      Añadirme a la lista de espera
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {isAdmin && <p className="text-sm text-muted-foreground mb-2">O selecciona un horario disponible:</p>}
                  {(() => {
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
                      <div className="space-y-4 max-h-[300px] overflow-y-auto">
                        {morningSlots.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2 font-medium">
                              ☀️ Mañana ({minutesToTimeString(hours.morningStart)} -{" "}
                              {minutesToTimeString(hours.morningEnd)})
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {morningSlots.map((slot) => {
                                const available = stylist === "any" ? slotToStylists[slot] || [] : [];
                                return (
                                  <Button
                                    key={slot}
                                    variant={time === slot && !customHour && !customMinute ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                      setTime(slot);
                                      setCustomHour("");
                                      setCustomMinute("");
                                      setSelectedSlotStylist(
                                        stylist === "any" && slotToStylists[slot]?.length === 1
                                          ? slotToStylists[slot][0].slug
                                          : null,
                                      );
                                    }}
                                    className={cn(
                                      "h-auto min-h-[2.5rem] transition-all duration-200 hover:shadow-md flex-col gap-0.5 py-1.5",
                                      time === slot && !customHour && !customMinute && "shadow-glow",
                                    )}
                                  >
                                    <span>{slot}</span>
                                    {stylist === "any" && available.length > 0 && (
                                      <span className="flex -space-x-1.5">
                                        {available.slice(0, 3).map((s) =>
                                          s.avatar_url ? (
                                            <img key={s.slug} src={s.avatar_url} alt={s.name} className="h-4 w-4 rounded-full border border-background object-cover" />
                                          ) : (
                                            <span key={s.slug} className="flex h-4 w-4 items-center justify-center rounded-full border border-background text-[8px] text-white" style={{ backgroundColor: s.color || "hsl(var(--primary))" }}>
                                              {s.name[0]}
                                            </span>
                                          ),
                                        )}
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
                              Descanso ({minutesToTimeString(hours.morningEnd)} -{" "}
                              {minutesToTimeString(hours.afternoonStart)})
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
                            <div className="grid grid-cols-3 gap-2">
                              {afternoonSlots.map((slot) => {
                                const available = stylist === "any" ? slotToStylists[slot] || [] : [];
                                return (
                                  <Button
                                    key={slot}
                                    variant={time === slot && !customHour && !customMinute ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                      setTime(slot);
                                      setCustomHour("");
                                      setCustomMinute("");
                                      setSelectedSlotStylist(
                                        stylist === "any" && slotToStylists[slot]?.length === 1
                                          ? slotToStylists[slot][0].slug
                                          : null,
                                      );
                                    }}
                                    className={cn(
                                      "h-auto min-h-[2.5rem] transition-all duration-200 hover:shadow-md flex-col gap-0.5 py-1.5",
                                      time === slot && !customHour && !customMinute && "shadow-glow",
                                    )}
                                  >
                                    <span>{slot}</span>
                                    {stylist === "any" && available.length > 0 && (
                                      <span className="flex -space-x-1.5">
                                        {available.slice(0, 3).map((s) =>
                                          s.avatar_url ? (
                                            <img key={s.slug} src={s.avatar_url} alt={s.name} className="h-4 w-4 rounded-full border border-background object-cover" />
                                          ) : (
                                            <span key={s.slug} className="flex h-4 w-4 items-center justify-center rounded-full border border-background text-[8px] text-white" style={{ backgroundColor: s.color || "hsl(var(--primary))" }}>
                                              {s.name[0]}
                                            </span>
                                          ),
                                        )}
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
                  })()}
                </>
              )}
            </>
          )}

          {/* Stylist picker when multiple are available for selected slot */}
          {stylist === "any" && time && !customHour && !customMinute && (slotToStylists[time]?.length || 0) > 1 && (
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
                        : "border-border hover:border-primary/50",
                    )}
                    onClick={() => setSelectedSlotStylist(s.slug)}
                  >
                    {s.avatar_url ? (
                      <img src={s.avatar_url} alt={s.name} className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 text-white text-sm" style={{ backgroundColor: s.color || "hsl(var(--primary))" }}>
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
              {(() => {
                const startMinutes = timeStringToMinutes(time);
                const endMinutes = startMinutes + totalDuration;
                const endTime = minutesToTimeString(endMinutes);
                return `Duración estimada: ${totalDuration} minutos (finaliza a las ${endTime})`;
              })()}
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
          disabled={
            !date ||
            !time ||
            (stylist === "any" && !customHour && !customMinute && (slotToStylists[time]?.length || 0) > 1 && !selectedSlotStylist)
          }
          data-guided-cta="true"
          className="transition-transform duration-200 hover:scale-105 disabled:scale-100"
        >
          Continuar
        </Button>
      </div>

      {/* Waitlist Dialog */}
      <Dialog open={showWaitlistDialog} onOpenChange={setShowWaitlistDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Lista de espera
            </DialogTitle>
            <DialogDescription>
              Te avisaremos cuando haya disponibilidad para el {date ? format(date, "d 'de' MMMM", { locale: es }) : ""}
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="waitlist-name">Nombre</Label>
              <Input
                id="waitlist-name"
                placeholder="Tu nombre"
                value={waitlistName}
                onChange={(e) => setWaitlistName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="waitlist-phone">Teléfono</Label>
              <Input
                id="waitlist-phone"
                placeholder="Tu teléfono"
                type="tel"
                value={waitlistPhone}
                onChange={(e) => setWaitlistPhone(e.target.value)}
              />
            </div>

            <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Servicios solicitados:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {services.map((s) => (
                  <li key={s.id}>{s.name}</li>
                ))}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWaitlistDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleWaitlistSubmit} disabled={waitlistSubmitting}>
              {waitlistSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                "Añadirme a la lista"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
