import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { es } from "date-fns/locale";
import { format } from "date-fns";
import { Service, TimeRange } from "@/types/booking";
import { useTenantBusinessHours } from "@/hooks/useTenantBusinessHours";
import { Loader2, Clock, Bell } from "lucide-react";
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
interface TenantStylist {
  id: string;
  name: string;
  slug: string;
  color: string | null;
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
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function formatDateToISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function hasOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
  return start1 < end2 && start2 < end1;
}

function getActiveWindows(startMin: number, services: Service[]): TimeRange[] {
  const windows: TimeRange[] = [];
  let currentTime = startMin;

  for (const service of services) {
    if (service.type === 'Compuesto') {
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
  return bookedSlots.map(booking => {
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
  const [loading, setLoading] = useState(false);
  const [stylistsLoading, setStylistsLoading] = useState(true);
  
  // Waitlist state
  const [showWaitlistDialog, setShowWaitlistDialog] = useState(false);
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistPhone, setWaitlistPhone] = useState("");
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  
  // User authentication state
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; phone: string } | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  
  const { toast } = useToast();

  const { businessHours, loading: hoursLoading, generateBaseSlots, getBusinessHoursForDay, getClosedDays } = useTenantBusinessHours(tenantId);

  // Fetch current user profile
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", user.id)
            .single();
          
          if (profile) {
            setCurrentUser({
              id: user.id,
              name: profile.full_name || "",
              phone: profile.phone || ""
            });
            // Pre-fill waitlist fields
            setWaitlistName(profile.full_name || "");
            setWaitlistPhone(profile.phone || "");
          }
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
          .select("id, name, slug, color")
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
    bookedData: { bookedSlots?: Array<{ Hora: string; total_duration: number }> }
  ): string[] => {
    const ranges = parseBookedSlotsToRanges(bookedData?.bookedSlots || []);
    const dayOfWeek = selectedDate.getDay();
    const hours = getBusinessHoursForDay(dayOfWeek);

    if (hours.isClosed) return [];

    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const currentMinutes = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : 0;

    // Generate base slots
    const slotsSet = generateBaseSlots(dayOfWeek);

    // Add flexible slots after existing bookings
    ranges.forEach(booking => {
      const endTime = booking.end;
      const inMorning = endTime >= hours.morningStart && endTime < hours.morningEnd;
      const inAfternoon = endTime >= hours.afternoonStart && endTime < hours.afternoonEnd;
      if (inMorning || inAfternoon) {
        slotsSet.add(endTime);
      }
    });

    // Convert to sorted array
    const allSlots = Array.from(slotsSet).sort((a, b) => a - b).map(minutesToTimeString);

    // Filter available slots
    return allSlots.filter(slot => {
      const startMinutes = timeStringToMinutes(slot);
      const endMinutes = startMinutes + totalDuration;

      if (isToday && startMinutes <= currentMinutes) return false;

      const inMorning = startMinutes >= hours.morningStart && startMinutes < hours.morningEnd;
      const inAfternoon = startMinutes >= hours.afternoonStart && startMinutes < hours.afternoonEnd;

      if (inMorning && endMinutes > hours.morningEnd) return false;
      if (inAfternoon && endMinutes > hours.afternoonEnd) return false;

      // Check overlap with bookings
      const activeWindows = getActiveWindows(startMinutes, services);
      for (const window of activeWindows) {
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
    if (!date || stylistsLoading || hoursLoading) return;

    const fetchBookedSlots = async () => {
      setLoading(true);
      try {
        const dateStr = formatDateToISO(date);

        if (stylist === 'any' && stylists.length > 0) {
          // Fetch all stylists and merge availability
          const responses = await Promise.all(
            stylists.map(s => 
              supabase.functions.invoke('check-availability', {
                body: { date: dateStr, stylist: s.slug, totalDuration, tenant_id: tenantId },
              })
            )
          );

          // Merge all available slots
          const allSlotsSet = new Set<string>();
          responses.forEach((response, index) => {
            if (!response.error && response.data) {
              const slots = computeAvailableSlotsForStylist(date, response.data);
              slots.forEach(slot => allSlotsSet.add(slot));
            }
          });

          const mergedSlots = Array.from(allSlotsSet).sort();
          setFusedAvailableSlots(mergedSlots);
          setBookedRanges([]);
        } else {
          // Regular handling for specific stylist
          const { data, error } = await supabase.functions.invoke('check-availability', {
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
    bookedRanges.forEach(booking => {
      const endTime = booking.end;
      const inMorning = endTime >= hours.morningStart && endTime < hours.morningEnd;
      const inAfternoon = endTime >= hours.afternoonStart && endTime < hours.afternoonEnd;
      if (inMorning || inAfternoon) {
        slotsSet.add(endTime);
      }
    });

    const allSlots = Array.from(slotsSet).sort((a, b) => a - b).map(minutesToTimeString);

    return allSlots.filter(slot => {
      const startMinutes = timeStringToMinutes(slot);
      const endMinutes = startMinutes + totalDuration;

      if (isToday && startMinutes <= currentMinutes) return false;

      const inMorning = startMinutes >= hours.morningStart && startMinutes < hours.morningEnd;
      const inAfternoon = startMinutes >= hours.afternoonStart && startMinutes < hours.afternoonEnd;

      if (inMorning && endMinutes > hours.morningEnd) return false;
      if (inAfternoon && endMinutes > hours.afternoonEnd) return false;

      const activeWindows = getActiveWindows(startMinutes, services);
      for (const window of activeWindows) {
        for (const booking of bookedRanges) {
          if (hasOverlap(window.start, window.end, booking.start, booking.end)) {
            return false;
          }
        }
      }

      return true;
    });
  };

  const timeSlots = stylist === 'any' ? fusedAvailableSlots : getAvailableTimeSlots(date);

  const handleNext = async () => {
    if (!date || !time) return;

    // If stylist is 'any', determine which specific stylist is available
    if (stylist === 'any' && stylists.length > 0) {
      try {
        const dateStr = formatDateToISO(date);
        const selectedStartMinutes = timeStringToMinutes(time);
        const activeWindows = getActiveWindows(selectedStartMinutes, services);

        // Check each stylist's availability
        const availabilityResults = await Promise.all(
          stylists.map(async (s) => {
            const { data, error } = await supabase.functions.invoke('check-availability', {
              body: { date: dateStr, stylist: s.slug, tenant_id: tenantId },
            });

            if (error) return { slug: s.slug, available: false };

            const ranges = parseBookedSlotsToRanges(data?.bookedSlots || []);
            const isAvailable = !activeWindows.some(window => 
              ranges.some(booking => hasOverlap(window.start, window.end, booking.start, booking.end))
            );

            return { slug: s.slug, available: isAvailable };
          })
        );

        // Find first available stylist
        const availableStylist = availabilityResults.find(r => r.available);
        if (availableStylist) {
          onNext(date, time, availableStylist.slug);
        }
      } catch {
        return;
      }
    } else {
      onNext(date, time);
    }
  };

  // Handle waitlist submission
  const handleWaitlistSubmit = async () => {
    if (!waitlistName.trim() || !waitlistPhone.trim() || !date) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    setWaitlistSubmitting(true);
    try {
      const preferredStylistId = stylist !== 'any' 
        ? stylists.find(s => s.slug === stylist)?.id 
        : null;

      const { error } = await supabase
        .from("waitlist")
        .insert({
          tenant_id: tenantId,
          client_name: waitlistName.trim(),
          client_phone: waitlistPhone.trim(),
          preferred_date: format(date, "yyyy-MM-dd"),
          preferred_stylist_id: preferredStylistId,
          services: services.map(s => ({ id: s.id, name: s.name })),
          notes: `Duración total: ${totalDuration} min`,
          status: "waiting",
          priority: 3
        });

      if (error) throw error;

      toast({
        title: "¡Añadido a la lista de espera!",
        description: "Te avisaremos cuando haya disponibilidad para esta fecha"
      });
      
      setShowWaitlistDialog(false);
      setWaitlistName("");
      setWaitlistPhone("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo añadir a la lista de espera",
        variant: "destructive"
      });
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  // Get closed days for calendar disabling
  const closedDays = getClosedDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const disabledDays = [
    { dayOfWeek: closedDays },
    { before: today },
  ];

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
            <p className="text-sm text-muted-foreground">
              Primero selecciona una fecha
            </p>
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
              const morningSlots = timeSlots.filter(slot => {
                const minutes = timeStringToMinutes(slot);
                return minutes < hours.morningEnd;
              });
              const afternoonSlots = timeSlots.filter(slot => {
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
                        {morningSlots.map((slot) => (
                          <Button
                            key={slot}
                            variant={time === slot ? "default" : "outline"}
                            size="default"
                            onClick={() => setTime(slot)}
                            className={cn(
                              "h-11 text-sm font-medium transition-all duration-200 hover:shadow-md touch-manipulation",
                              time === slot && "shadow-glow"
                            )}
                          >
                            {slot}
                          </Button>
                        ))}
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
                        🌙 Tarde ({minutesToTimeString(hours.afternoonStart)} - {minutesToTimeString(hours.afternoonEnd)})
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {afternoonSlots.map((slot) => (
                          <Button
                            key={slot}
                            variant={time === slot ? "default" : "outline"}
                            size="default"
                            onClick={() => setTime(slot)}
                            className={cn(
                              "h-11 text-sm font-medium transition-all duration-200 hover:shadow-md touch-manipulation",
                              time === slot && "shadow-glow"
                            )}
                          >
                            {slot}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}
          {date && time && (
            <p className="mt-4 text-xs text-muted-foreground">
              Duración estimada: {totalDuration} minutos (finaliza a las {minutesToTimeString(timeStringToMinutes(time) + totalDuration)})
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
          disabled={!date || !time}
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
              Te avisaremos cuando haya disponibilidad para {date ? format(date, "d 'de' MMMM", { locale: es }) : "esta fecha"}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {currentUser && currentUser.name && currentUser.phone ? (
              // Usuario logueado con datos completos - mostrar resumen
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm font-medium text-foreground mb-2">Tus datos:</p>
                <p className="text-sm text-muted-foreground">{currentUser.name}</p>
                <p className="text-sm text-muted-foreground">{currentUser.phone}</p>
              </div>
            ) : (
              // Usuario no logueado o sin datos - mostrar formulario
              <>
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
                    type="tel"
                    placeholder="600 123 456"
                    value={waitlistPhone}
                    onChange={(e) => setWaitlistPhone(e.target.value)}
                  />
                </div>
              </>
            )}
            
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-1">Servicios solicitados:</p>
              <p>{services.map(s => s.name).join(", ")}</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowWaitlistDialog(false)}
              disabled={waitlistSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleWaitlistSubmit}
              disabled={waitlistSubmitting || !waitlistName.trim() || !waitlistPhone.trim()}
            >
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
