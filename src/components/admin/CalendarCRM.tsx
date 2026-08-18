import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Edit2, ChevronDown, Calendar as CalendarIcon, Ban, Search, X, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format, parseISO, addDays, startOfWeek, endOfWeek, isSameDay, addWeeks, addMonths, endOfDay, startOfDay, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminBookingFlow } from "./AdminBookingFlow";
interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  stylist: string;
  calendarId: string;
  completed?: boolean;
  skipAvailabilityCheck?: boolean;
}

export const CalendarCRM = () => {
  const isMobile = useIsMobile();
  const hourRowHeight = isMobile ? 80 : 104;

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), {
    weekStartsOn: 1
  }));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<string>("");
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    customer_name: string;
    Telefono: string;
    Fecha: string;
    Hora: string;
    stylist: string;
    services: any;
    google_calendar_event_id?: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  useEffect(() => {
    // Este efecto actualiza la hora cada 60 segundos.
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1 minuto

    // Función de limpieza para detener el temporizador.
    return () => clearInterval(timerId);
  }, []); // El array vacío [] asegura que esto se ejecute solo una vez.
  const [blockStartDate, setBlockStartDate] = useState<Date | undefined>(undefined);
  const [blockEndDate, setBlockEndDate] = useState<Date | undefined>(undefined);
  const [blockPeriod, setBlockPeriod] = useState<"day" | "week" | "month" | "hours">("day");
  const [blockStylist, setBlockStylist] = useState<"cris" | "desi" | "both">("both");
  const [blockStartTime, setBlockStartTime] = useState<string>("09:00");
  const [blockEndTime, setBlockEndTime] = useState<string>("19:00");
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [pendingCompletionEvent, setPendingCompletionEvent] = useState<CalendarEvent | null>(null);
  const {
    toast
  } = useToast();

  // Search appointments
  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      toast({
        title: "Búsqueda inválida",
        description: "Introduce al menos 2 caracteres para buscar",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSearching(true);
      const query = searchQuery.trim().toLowerCase();
      
      // Search in bookings table
      const { data, error } = await supabase
        .from("bookings")
        .select("id, customer_name, Telefono, Fecha, Hora, stylist, services, google_calendar_event_id")
        .or(`customer_name.ilike.%${query}%,Telefono.ilike.%${query}%`)
        .eq("status", "confirmed")
        .gte("Fecha", format(new Date(), "yyyy-MM-dd"))
        .order("Fecha", { ascending: true })
        .order("Hora", { ascending: true })
        .limit(20);
      
      if (error) throw error;
      
      setSearchResults(data || []);
      setShowSearchResults(true);
      
      if (!data || data.length === 0) {
        toast({
          title: "Sin resultados",
          description: "No se encontraron citas con esos datos"
        });
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Error en la búsqueda",
        description: error.message || "No se pudo realizar la búsqueda",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: typeof searchResults[0]) => {
    // Jump to the exact date of the selected appointment
    const appointmentDate = parseISO(result.Fecha);
    const dateKey = format(appointmentDate, "yyyy-MM-dd");
    setWeekStart(startOfWeek(appointmentDate, { weekStartsOn: 1 }));
    setActiveTab(dateKey);
    setShowSearchResults(false);
    setSearchQuery("");
    
    // Set highlighted booking for visual feedback and scroll
    if (result.google_calendar_event_id) {
      setHighlightedBookingId(result.google_calendar_event_id);
      
      // Scroll to the event after a delay to allow render
      setTimeout(() => {
        const eventElement = document.querySelector(`[data-event-id="${result.google_calendar_event_id}"]`);
        if (eventElement) {
          eventElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
      
      // Clear highlight after 5 seconds
      setTimeout(() => {
        setHighlightedBookingId(null);
      }, 5000);
    }
    
    toast({
      title: "Cita encontrada",
      description: `${result.customer_name} - ${format(appointmentDate, "d MMM yyyy", { locale: es })}`
    });
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Helper function to safely format date times
  const safeFormatDateTime = (dateTime: string | undefined, formatStr: string): string => {
    if (!dateTime) return "N/A";
    try {
      return format(parseISO(dateTime), formatStr);
    } catch (error) {
      console.error("Error formatting dateTime:", dateTime, error);
      return "N/A";
    }
  };
  useEffect(() => {
    fetchEvents();
  }, [weekStart]);
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const weekEnd = endOfWeek(weekStart, {
        weekStartsOn: 1
      });
      const {
        data,
        error
      } = await supabase.functions.invoke("list-calendar-events", {
        body: {
          calendarId: "all",
          timeMin: weekStart.toISOString(),
          timeMax: addDays(weekEnd, 1).toISOString()
        }
      });
      if (error) {
        console.error("Error fetching events:", error);
        throw error;
      }

      // Fetch bookings with skip_availability_check flag for this week
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("google_calendar_event_id, skip_availability_check")
        .gte("Fecha", format(weekStart, "yyyy-MM-dd"))
        .lte("Fecha", format(addDays(weekEnd, 1), "yyyy-MM-dd"))
        .eq("skip_availability_check", true);

      // Create a set of event IDs that have skip_availability_check
      const skipCheckEventIds = new Set(
        (bookingsData || [])
          .filter(b => b.google_calendar_event_id)
          .map(b => b.google_calendar_event_id)
      );

      // Mark events as completed if they have the completed marker in description
      const eventsWithStatus = (data?.events || []).map((event: CalendarEvent) => ({
        ...event,
        completed: event.description?.includes("[✓ COMPLETADA]") || false,
        skipAvailabilityCheck: skipCheckEventIds.has(event.id)
      }));
      setEvents(eventsWithStatus);
    } catch (error: any) {
      console.error("Error in fetchEvents:", error);
      toast({
        title: "Error",
        description: error.message || "Error al cargar los eventos",
        variant: "destructive"
      });
      // Reset events to avoid blank page
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };
  const handleBookingComplete = () => {
    setIsCreateDialogOpen(false);
    fetchEvents();
  };
  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;
    try {
      setLoading(true);
      const {
        error
      } = await supabase.functions.invoke("update-calendar-event", {
        body: {
          eventId: selectedEvent.id,
          calendarId: selectedEvent.calendarId,
          summary: selectedEvent.summary,
          description: selectedEvent.description,
          start: selectedEvent.start.dateTime,
          end: selectedEvent.end.dateTime
        }
      });
      if (error) throw error;
      toast({
        title: "Cita actualizada",
        description: "Los cambios se han guardado correctamente"
      });
      setIsEditDialogOpen(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la cita",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleToggleCompleted = async (event: CalendarEvent) => {
    try {
      // Si está marcando como completada, mostrar el diálogo
      if (!event.completed) {
        setPendingCompletionEvent(event);
        setCompletionDialogOpen(true);
        return;
      }

      // Si está desmarcando como completada, actualizar directamente
      const updatedDescription = (event.description || "").replace("[✓ COMPLETADA] ", "");
      const {
        error
      } = await supabase.functions.invoke("update-calendar-event", {
        body: {
          eventId: event.id,
          calendarId: event.calendarId,
          summary: event.summary,
          description: updatedDescription,
          start: event.start.dateTime,
          end: event.end.dateTime
        }
      });
      if (error) throw error;

      // Update local state
      setEvents(events.map(e => e.id === event.id ? {
        ...e,
        completed: false,
        description: updatedDescription
      } : e));
      toast({
        title: "Cita desmarcada",
        description: "La cita se ha desmarcado"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la cita",
        variant: "destructive"
      });
    }
  };
  const handleSendReviewMessage = async () => {
    if (!pendingCompletionEvent) return;
    try {
      // Obtener los datos de la reserva desde la tabla bookings
      const {
        data: booking,
        error: bookingError
      } = await supabase.from("bookings").select("customer_name, Telefono, Fecha, Hora, stylist, services, google_calendar_event_id").eq("google_calendar_event_id", pendingCompletionEvent.id).single();
      if (bookingError) {
        console.error("Error fetching booking:", bookingError);
        // Continuar marcando como completada aunque falle el webhook
      }

      // Marcar como completada
      const updatedDescription = `[✓ COMPLETADA] ${pendingCompletionEvent.description || ""}`;
      const {
        error
      } = await supabase.functions.invoke("update-calendar-event", {
        body: {
          eventId: pendingCompletionEvent.id,
          calendarId: pendingCompletionEvent.calendarId,
          summary: pendingCompletionEvent.summary,
          description: updatedDescription,
          start: pendingCompletionEvent.start.dateTime,
          end: pendingCompletionEvent.end.dateTime
        }
      });
      if (error) throw error;

      // Update local state
      setEvents(events.map(e => e.id === pendingCompletionEvent.id ? {
        ...e,
        completed: true,
        description: updatedDescription
      } : e));

      // Enviar webhook de valoración si tenemos los datos
      if (booking) {
        try {
          const {
            error: webhookError
          } = await supabase.functions.invoke("webhook-valoracion", {
            body: {
              customerName: booking.customer_name,
              phone: booking.Telefono,
              date: booking.Fecha,
              time: booking.Hora,
              stylist: booking.stylist,
              services: Array.isArray(booking.services) ? booking.services.map((s: any) => s.name) : [],
              googleCalendarEventId: booking.google_calendar_event_id
            }
          });
          if (webhookError) {
            console.error("Error sending review webhook:", webhookError);
          }
        } catch (webhookError) {
          console.error("Error invoking webhook:", webhookError);
        }
      }
      toast({
        title: "Cita completada",
        description: booking ? "¡Cliente atendido! Mensaje de valoración enviado" : "¡Cliente atendido!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al completar la cita",
        variant: "destructive"
      });
    } finally {
      setCompletionDialogOpen(false);
      setPendingCompletionEvent(null);
    }
  };
  const handleCancelCompletion = async () => {
    if (!pendingCompletionEvent) return;
    try {
      // Solo actualizar el estado sin enviar mensaje
      const updatedDescription = `[✓ COMPLETADA] ${pendingCompletionEvent.description || ""}`;
      const {
        error
      } = await supabase.functions.invoke("update-calendar-event", {
        body: {
          eventId: pendingCompletionEvent.id,
          calendarId: pendingCompletionEvent.calendarId,
          summary: pendingCompletionEvent.summary,
          description: updatedDescription,
          start: pendingCompletionEvent.start.dateTime,
          end: pendingCompletionEvent.end.dateTime
        }
      });
      if (error) throw error;

      // Update local state
      setEvents(events.map(e => e.id === pendingCompletionEvent.id ? {
        ...e,
        completed: true,
        description: updatedDescription
      } : e));
      toast({
        title: "Cita completada",
        description: "¡Cliente atendido!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al completar la cita",
        variant: "destructive"
      });
    } finally {
      setCompletionDialogOpen(false);
      setPendingCompletionEvent(null);
    }
  };
  const handleDeleteEvent = async (event: CalendarEvent) => {
    if (!confirm("¿Estás segura de que quieres eliminar esta cita?")) return;
    try {
      setLoading(true);
      const {
        error
      } = await supabase.functions.invoke("delete-calendar-event", {
        body: {
          eventId: event.id,
          calendarId: event.calendarId
        }
      });
      if (error) throw error;
      toast({
        title: "Cita eliminada",
        description: "La cita se ha eliminado del calendario"
      });
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la cita",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleBlockPeriod = async () => {
    if (!blockStartDate) {
      toast({
        title: "Error",
        description: "Debes seleccionar una fecha de inicio",
        variant: "destructive"
      });
      return;
    }
    let endDate = blockStartDate;
    if (blockPeriod === "week") {
      endDate = addWeeks(blockStartDate, 1);
    } else if (blockPeriod === "month") {
      endDate = addMonths(blockStartDate, 1);
    }
    const finalEndDate = blockEndDate || endDate;
    try {
      setLoading(true);
      const calendars = blockStylist === "both" ? ["cris", "desi"] : [blockStylist];

      // Format dates in local timezone to avoid timezone conversion issues
      const formatDateForCalendar = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}T00:00:00`;
      };
      const formatEndDateForCalendar = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}T23:59:59`;
      };
      const formatDateTimeForCalendar = (date: Date, time: string) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}T${time}:00`;
      };
      for (const stylist of calendars) {
        if (blockPeriod === "hours") {
          // Bloquear solo horas específicas
          const {
            error
          } = await supabase.functions.invoke("create-calendar-event", {
            body: {
              stylist: stylist,
              summary: `🔒 BLOQUEADO - ${stylist.toUpperCase()}`,
              description: "Periodo bloqueado - Horas específicas",
              start: formatDateTimeForCalendar(blockStartDate, blockStartTime),
              end: formatDateTimeForCalendar(blockStartDate, blockEndTime),
              allDay: false
            }
          });
          if (error) throw error;
        } else {
          // Bloquear día/semana/mes completo
          const {
            error
          } = await supabase.functions.invoke("create-calendar-event", {
            body: {
              stylist: stylist,
              summary: `🌴 VACACIONES - ${stylist.toUpperCase()}`,
              description: "Periodo bloqueado - Vacaciones",
              start: formatDateForCalendar(blockStartDate),
              end: formatEndDateForCalendar(finalEndDate),
              allDay: true
            }
          });
          if (error) throw error;
        }
      }
      toast({
        title: "Periodo bloqueado",
        description: blockPeriod === "hours" ? "Se han bloqueado las horas correctamente" : `Se ha bloqueado el periodo de vacaciones correctamente`
      });
      setIsBlockDialogOpen(false);
      setBlockStartDate(undefined);
      setBlockEndDate(undefined);
      setBlockPeriod("day");
      setBlockStylist("both");
      setBlockStartTime("09:00");
      setBlockEndTime("19:00");
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al bloquear el periodo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleJumpToDate = (date: Date | undefined) => {
    if (date) {
      const dateKey = format(date, "yyyy-MM-dd");
      setWeekStart(startOfWeek(date, {
        weekStartsOn: 1
      }));
      setActiveTab(dateKey);
    }
  };

  // Devuelve todas las fechas bloqueadas por vacaciones (solo días completos)
  const getBlockedDates = () => {
    const blockedDates: Date[] = [];
    
    events.forEach(event => {
      const isBlockingEvent = event.summary?.includes("🌴 VACACIONES");
      if (!isBlockingEvent) return;

      try {
        const startStr = event.start.dateTime || (event.start as any).date;
        const endStr = event.end.dateTime || (event.end as any).date || startStr;
        if (!startStr || !endStr) return;

        const eventStart = startOfDay(parseISO(startStr));
        let eventEnd = parseISO(endStr);

        // Si es evento de día completo (solo fecha) y el final es distinto al inicio,
        // Google lo trata como exclusivo -> restamos 1 día al final efectivo.
        const isAllDayRange = startStr.length === 10 && endStr.length === 10 && startStr !== endStr;
        if (isAllDayRange) {
          eventEnd = addDays(eventEnd, -1);
        }

        const eventEndDay = endOfDay(eventEnd);
        
        let currentDate = new Date(eventStart);
        while (currentDate <= eventEndDay) {
          blockedDates.push(new Date(currentDate));
          currentDate = addDays(currentDate, 1);
        }
      } catch (error) {
        console.error("Error parsing event dates:", error, event);
      }
    });
    
    return blockedDates;
  };
  const groupEventsByDate = (events: CalendarEvent[]) => {
    const grouped: Record<string, CalendarEvent[]> = {};
    events.forEach(event => {
      if (!event.start?.dateTime) return;
      const date = format(parseISO(event.start.dateTime), "yyyy-MM-dd");
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });
    return grouped;
  };

  // Detect overlapping events and calculate positioning
  interface EventPosition {
    event: CalendarEvent;
    column: number;
    totalColumns: number;
  }
  function detectOverlaps(events: CalendarEvent[]): EventPosition[] {
    if (events.length === 0) return [];

    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime());
    const positions: EventPosition[] = [];
    const groups: CalendarEvent[][] = [];

    // Group overlapping events
    sortedEvents.forEach(event => {
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);

      // Find a group where this event overlaps with at least one event
      let foundGroup = false;
      for (const group of groups) {
        const overlaps = group.some(groupEvent => {
          const groupStart = new Date(groupEvent.start.dateTime);
          const groupEnd = new Date(groupEvent.end.dateTime);
          return eventStart < groupEnd && eventEnd > groupStart;
        });
        if (overlaps) {
          group.push(event);
          foundGroup = true;
          break;
        }
      }
      if (!foundGroup) {
        groups.push([event]);
      }
    });

    // Assign positions within each group
    groups.forEach(group => {
      const totalColumns = Math.min(group.length, 2); // Maximum 2 columns
      group.forEach((event, index) => {
        positions.push({
          event,
          column: index % totalColumns,
          totalColumns
        });
      });
    });
    return positions;
  }
  const getScheduleForDay = (dayDate: Date) => {
    const dayOfWeek = dayDate.getDay();
    const isSaturday = dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;

    if (isSunday) {
      return {
        hours: [],
        startHour: 0,
        endHour: 0,
      };
    }

    // Horarios por defecto
    let defaultStartHour = 9;
    let defaultEndHour = 19;

    if (isSaturday) {
      defaultStartHour = 8;
      defaultEndHour = 13;
    }

    // Buscar citas para este día directamente desde "events"
    const dayEvents = events.filter((event) => {
      if (!event.start?.dateTime) return false;
      try {
        const eventDate = parseISO(event.start.dateTime);
        return isSameDay(eventDate, dayDate);
      } catch {
        return false;
      }
    });

    let actualStartHour = defaultStartHour;
    let actualEndHour = defaultEndHour;

    if (dayEvents.length > 0) {
      dayEvents.forEach((event) => {
        if (event.start?.dateTime && event.end?.dateTime) {
          const startTime = parseISO(event.start.dateTime);
          const endTime = parseISO(event.end.dateTime);
          const eventStartHour = startTime.getHours();
          const eventEndHour = endTime.getHours() + (endTime.getMinutes() > 0 ? 1 : 0);

          actualStartHour = Math.min(actualStartHour, eventStartHour);
          actualEndHour = Math.max(actualEndHour, eventEndHour);
        }
      });
    }

    const hours = Array.from({ length: actualEndHour - actualStartHour }, (_, i) => actualStartHour + i);

    return {
      hours,
      startHour: actualStartHour,
      endHour: actualEndHour,
    };
  };
  const calculateEventPosition = (event: CalendarEvent, dayDate: Date) => {
    const schedule = getScheduleForDay(dayDate);
    if (!event.start?.dateTime || !event.end?.dateTime) return null;

    try {
      const startTime = parseISO(event.start.dateTime);
      const endTime = parseISO(event.end.dateTime);

      const startMinutesFromStart =
        (startTime.getHours() - schedule.startHour) * 60 + startTime.getMinutes();
      const endMinutesFromStart =
        (endTime.getHours() - schedule.startHour) * 60 + endTime.getMinutes();
      const durationMinutes = endMinutesFromStart - startMinutesFromStart;

      // Use the same hour row height as the UI to prevent 1px drift
      const top = (startMinutesFromStart / 60) * hourRowHeight;
      const height = (durationMinutes / 60) * hourRowHeight;

      return { top, height };
    } catch (error) {
      console.error("Error calculating event position:", error);
      return null;
    }
  };
  const weekDays = Array.from({
    length: 7
  }, (_, i) => addDays(weekStart, i));
  const groupedEvents = groupEventsByDate(events);
  return <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">CRM - Gestión de Citas</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cita
          </Button>
          <Button variant="secondary" onClick={() => setIsBlockDialogOpen(true)}>
            <Ban className="h-4 w-4 mr-2" />
            Bloquear Periodo
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <Card className="p-4">
        <div className="flex flex-col gap-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar cita por nombre o teléfono
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar por nombre, teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pr-8"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          
          {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="mt-2 border rounded-md divide-y max-h-80 overflow-y-auto">
              {searchResults.map((result) => {
                const servicesList = Array.isArray(result.services) 
                  ? result.services.map((s: any) => s.name || s).filter(Boolean)
                  : [];
                
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelectSearchResult(result)}
                    className="w-full text-left p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{result.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{result.Telefono}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">
                          {format(parseISO(result.Fecha), "d MMM yyyy", { locale: es })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {result.Hora.slice(0, 5)} - {result.stylist}
                        </p>
                      </div>
                    </div>
                    {servicesList.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {servicesList.map((serviceName: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {serviceName}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2 md:flex-wrap">
        <div className="flex gap-1 md:gap-2">
          <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, -7))} disabled={loading} size="sm" className="flex-1 md:flex-initial">
            ←
          </Button>
          <Button variant="outline" onClick={() => setWeekStart(startOfWeek(new Date(), {
          weekStartsOn: 1
        }))} disabled={loading} size="sm" className="flex-1 md:flex-initial border-primary rounded-sm">Hoy</Button>
          <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, 7))} disabled={loading} size="sm" className="flex-1 md:flex-initial">
            →
          </Button>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full md:w-auto">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Ir a fecha
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={weekStart} onSelect={handleJumpToDate} initialFocus className="pointer-events-auto" weekStartsOn={1} />
          </PopoverContent>
        </Popover>
      </div>

      {loading ? <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div> : <Tabs value={activeTab || format(weekDays.find(day => isSameDay(day, new Date())) || weekDays[0], "yyyy-MM-dd")} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap md:flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {weekDays.map(day => {
          const dateKey = format(day, "yyyy-MM-dd");
          // Contar eventos que se solapan con este día (no solo los que empiezan ese día)
          const dayEvents = events.filter(e => {
            const startStr = e.start.dateTime || (e.start as any).date;
            const endStr = e.end.dateTime || (e.end as any).date || startStr;
            if (!startStr || !endStr) return false;
            try {
              const start = startOfDay(parseISO(startStr));
              let end = parseISO(endStr);

              // Ajuste para eventos de día completo: fin exclusivo -> restamos 1 día
              const isAllDayRange = startStr.length === 10 && endStr.length === 10 && startStr !== endStr;
              if (isAllDayRange) {
                end = addDays(end, -1);
              }

              const endDay = endOfDay(end);
              return day >= start && day <= endDay;
            } catch {
              return false;
            }
          });
          const isToday = isSameDay(day, new Date());
          // Día bloqueado entero si algún evento de VACACIONES se solapa con el día
          const hasFullBlock = dayEvents.some(e =>
            e.summary?.includes("🌴 VACACIONES")
          );
          return <TabsTrigger key={dateKey} value={dateKey} className={cn("flex-col items-start gap-1 data-[state=active]:bg-background px-2 md:px-4 py-2 min-w-[100px] md:min-w-[140px]", isToday && "border-primary")}>
                  <div className="flex items-center gap-1 md:gap-2 w-full">
                    <span className="text-xs md:text-sm font-semibold capitalize">{format(day, "EEE d MMM", {
                  locale: es
                })}</span>
                    {isToday && <Badge variant="default" className="text-[9px] md:text-xs h-3.5 px-1 md:h-5 md:px-2">
                        Hoy
                      </Badge>}
                    {hasFullBlock && (
                      <Ban className="h-3 w-3 text-destructive" />
                    )}
                  </div>
                  <span className="text-[10px] md:text-xs text-muted-foreground">
                    {dayEvents.length} {dayEvents.length === 1 ? "cita" : "citas"}
                  </span>
                </TabsTrigger>;
        })}
          </TabsList>

          {weekDays.map(day => {
        const dateKey = format(day, "yyyy-MM-dd");
        const dayEvents = groupedEvents[dateKey] || [];
        const schedule = getScheduleForDay(day);
        const crisEvents = dayEvents.filter(e => e.stylist === "cris");
        const desiEvents = dayEvents.filter(e => e.stylist === "desi");
        return <TabsContent key={dateKey} value={dateKey} className="mt-4">
                <Card>
                  <CardContent className="p-2 md:p-6">
                    {schedule.hours.length === 0 ? <p className="text-sm text-muted-foreground italic text-center py-8">Cerrado los domingos</p> : <div className="overflow-x-auto">
                        {/* Header - OUTSIDE the relative timeline container */}
                        <div className="grid grid-cols-[50px_1fr_1fr] md:grid-cols-[80px_1fr_1fr] gap-1 md:gap-3 pb-2 border-b mb-3 min-w-[320px]">
                          <div className="text-[10px] md:text-xs font-semibold text-muted-foreground">HORA</div>
                          <div className="flex items-center gap-1 md:gap-2">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[var(--gp-info)]" />
                            <span className="text-[10px] md:text-xs font-semibold">CRIS</span>
                          </div>
                          <div className="flex items-center gap-1 md:gap-2">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[var(--gp-purple)]" />
                            <span className="text-[10px] md:text-xs font-semibold">DESI</span>
                          </div>
                        </div>

                        {/* Timeline Grid - relative container starts here */}
                        <div className="relative grid grid-cols-[50px_1fr_1fr] md:grid-cols-[80px_1fr_1fr] gap-1 md:gap-3 min-w-[320px]">
                          {/* Hours column */}
                          <div>
                            {schedule.hours.map(hour => <div key={hour} className="h-[80px] md:h-[104px] border-t border-border/30 flex items-start pt-1">
                                <span className="text-[10px] md:text-sm font-medium text-muted-foreground">
                                  {hour.toString().padStart(2, "0")}:00
                                </span>
                              </div>)}
                          </div>

                          {/* Cris column */}
                          <div className="relative border-l border-border/30">
                            {/* Filas de la cuadrícula */}
                            {schedule.hours.map(hour => <div key={hour} className="h-[80px] md:h-[104px] border-t border-border/30"></div>)}

                            {/* Zona de Descanso */}
                            {(() => {
                      const dayOfWeek = day.getDay();
                      const isTuesdayToFriday = dayOfWeek >= 2 && dayOfWeek <= 5;
                      if (isTuesdayToFriday) {
                        const breakStartMinutes = (12 - schedule.startHour) * 60 + 30; // Empieza a las 12:30
                        const breakDurationMinutes = 150; // 2.5 horas de duración (acaba a las 15:00)
                        const top = (breakStartMinutes / 60) * hourRowHeight;
                        const height = (breakDurationMinutes / 60) * hourRowHeight;
                        return <div className="absolute inset-x-0 bg-[var(--gp-chip)]  z-0 flex items-center justify-center pointer-events-none" style={{
                          top: `${top}px`,
                          height: `${height}px`
                        }}>
                                    <span className="text-[8px] md:text-[10px] font-medium text-[var(--gp-ink2)]  bg-background/80 px-1 md:px-2 py-0.5 rounded">
                                      Descanso
                                    </span>
                                  </div>;
                      }
                      return null;
                    })()}

                            {/* Events positioned absolutely with overlap detection */}
                            {(() => {
                      const positions = detectOverlaps(crisEvents);
                      return positions.map(({
                        event,
                        column,
                        totalColumns
                      }) => {
                        const position = calculateEventPosition(event, day);
                        if (!position) return null;
                        const widthPercentage = 100 / totalColumns;
                        const leftPercentage = column * widthPercentage;
                        const isHighlighted = highlightedBookingId === event.id;
                        return <div key={event.id} data-event-id={event.id} className={`absolute group bg-[var(--gp-info-soft)]  border border-[var(--gp-info-soft)]  rounded-md p-1 md:p-2 transition-all hover:shadow-md hover:z-20 overflow-hidden ${event.completed ? "opacity-50" : ""} ${isHighlighted ? "ring-4 ring-primary ring-offset-2 animate-pulse z-30" : ""}`} style={{
                          top: `${position.top}px`,
                          height: `${position.height}px`,
                          left: `${leftPercentage}%`,
                          width: `${widthPercentage - 2}%`
                        }}>
                                    {/* Contenido de la cita... */}
                                    <div className="flex items-start gap-1 md:gap-2 h-full">
                                      <input type="checkbox" checked={event.completed || false} onChange={() => handleToggleCompleted(event)} className="mt-0.5 w-3 h-3 md:w-4 md:h-4 rounded border cursor-pointer accent-blue-500 flex-shrink-0" />
                                      <div className="flex-1 min-w-0 overflow-hidden">
                                        <p className={`text-[10px] md:text-xs font-medium leading-tight truncate ${event.completed ? "line-through" : ""}`}>
                                          {event.skipAvailabilityCheck && (
                                            <span title="Cita sin restricciones">
                                              <AlertTriangle className="inline-block h-3 w-3 mr-0.5 text-[var(--gp-warn)]" />
                                            </span>
                                          )}
                                          {event.summary}
                                        </p>
                                        <p className="text-[8px] md:text-[10px] text-muted-foreground mt-0.5">
                                          {safeFormatDateTime(event.start?.dateTime, "HH:mm")} -{" "}
                                          {safeFormatDateTime(event.end?.dateTime, "HH:mm")}
                                        </p>
                                      </div>
                                      <div className="flex gap-0.5 md:gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        <Button size="sm" variant="ghost" className="h-4 w-4 md:h-5 md:w-5 p-0" onClick={() => {
                                setSelectedEvent(event);
                                setIsEditDialogOpen(true);
                              }}>
                                          <Edit2 className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-4 w-4 md:h-5 md:w-5 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteEvent(event)}>
                                          <Trash2 className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>;
                      });
                    })()}
                          </div>

                          {/* Desi column */}
                          <div className="relative border-l border-border/30">
                            {/* Filas de la cuadrícula */}
                            {schedule.hours.map(hour => <div key={hour} className="h-[80px] md:h-[104px] border-t border-border/30"></div>)}

                            {/* Zona de Descanso */}
                            {(() => {
                      const dayOfWeek = day.getDay();
                      const isTuesdayToFriday = dayOfWeek >= 2 && dayOfWeek <= 5;
                      if (isTuesdayToFriday) {
                        const breakStartMinutes = (12 - schedule.startHour) * 60 + 30; // Empieza a las 12:30
                        const breakDurationMinutes = 150; // 2.5 horas de duración (acaba a las 15:00)
                        const top = (breakStartMinutes / 60) * hourRowHeight;
                        const height = (breakDurationMinutes / 60) * hourRowHeight;
                        return <div className="absolute inset-x-0 bg-[var(--gp-chip)]  z-0 flex items-center justify-center pointer-events-none" style={{
                          top: `${top}px`,
                          height: `${height}px`
                        }}>
                                    <span className="text-[8px] md:text-[10px] font-medium text-[var(--gp-ink2)]  bg-background/80 px-1 md:px-2 py-0.5 rounded">
                                      Descanso
                                    </span>
                                  </div>;
                      }
                      return null;
                    })()}

                            {/* Events positioned absolutely with overlap detection */}
                            {(() => {
                      const positions = detectOverlaps(desiEvents);
                      return positions.map(({
                        event,
                        column,
                        totalColumns
                      }) => {
                        const position = calculateEventPosition(event, day);
                        if (!position) return null;
                        const widthPercentage = 100 / totalColumns;
                        const leftPercentage = column * widthPercentage;
                        const isHighlighted = highlightedBookingId === event.id;
                        return <div key={event.id} data-event-id={event.id} className={`absolute group bg-[var(--gp-purple-soft)]  border border-[var(--gp-purple-soft)]  rounded-md p-1 md:p-2 transition-all hover:shadow-md hover:z-20 overflow-hidden ${event.completed ? "opacity-50" : ""} ${isHighlighted ? "ring-4 ring-primary ring-offset-2 animate-pulse z-30" : ""}`} style={{
                          top: `${position.top}px`,
                          height: `${position.height}px`,
                          left: `${leftPercentage}%`,
                          width: `${widthPercentage - 2}%`
                        }}>
                                    {/* Contenido de la cita... */}
                                    <div className="flex items-start gap-1 md:gap-2 h-full">
                                      <input type="checkbox" checked={event.completed || false} onChange={() => handleToggleCompleted(event)} className="mt-0.5 w-3 h-3 md:w-4 md:h-4 rounded border cursor-pointer accent-purple-500 flex-shrink-0" />
                                      <div className="flex-1 min-w-0 overflow-hidden">
                                        <p className={`text-[10px] md:text-xs font-medium leading-tight truncate ${event.completed ? "line-through" : ""}`}>
                                          {event.skipAvailabilityCheck && (
                                            <span title="Cita sin restricciones">
                                              <AlertTriangle className="inline-block h-3 w-3 mr-0.5 text-[var(--gp-warn)]" />
                                            </span>
                                          )}
                                          {event.summary}
                                        </p>
                                        <p className="text-[8px] md:text-[10px] text-muted-foreground mt-0.5">
                                          {safeFormatDateTime(event.start?.dateTime, "HH:mm")} -{" "}
                                          {safeFormatDateTime(event.end?.dateTime, "HH:mm")}
                                        </p>
                                      </div>
                                      <div className="flex gap-0.5 md:gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        <Button size="sm" variant="ghost" className="h-4 w-4 md:h-5 md:w-5 p-0" onClick={() => {
                                setSelectedEvent(event);
                                setIsEditDialogOpen(true);
                              }}>
                                          <Edit2 className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-4 w-4 md:h-5 md:w-5 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteEvent(event)}>
                                          <Trash2 className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>;
                      });
                    })()}
                          </div>
                        </div>
                      </div>}
                  </CardContent>
                </Card>
              </TabsContent>;
      })}
        </Tabs>}

      {/* Create Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Cita</DialogTitle>
            <DialogDescription>Crea una cita siguiendo los pasos</DialogDescription>
          </DialogHeader>
          <AdminBookingFlow onComplete={handleBookingComplete} onCancel={() => setIsCreateDialogOpen(false)} tenantId="" />
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      {selectedEvent && <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Cita</DialogTitle>
              <DialogDescription>Modifica los detalles de la cita</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-summary">Título</Label>
                <Input id="edit-summary" value={selectedEvent.summary} onChange={e => setSelectedEvent({
              ...selectedEvent,
              summary: e.target.value
            })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea id="edit-description" value={selectedEvent.description || ""} onChange={e => setSelectedEvent({
              ...selectedEvent,
              description: e.target.value
            })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Fecha</Label>
                <Input id="edit-date" type="date" value={safeFormatDateTime(selectedEvent.start?.dateTime, "yyyy-MM-dd")} onChange={e => {
              const newDate = e.target.value;
              const startTime = safeFormatDateTime(selectedEvent.start?.dateTime, "HH:mm");
              const endTime = safeFormatDateTime(selectedEvent.end?.dateTime, "HH:mm");
              setSelectedEvent({
                ...selectedEvent,
                start: {
                  ...selectedEvent.start,
                  dateTime: `${newDate}T${startTime}:00`
                },
                end: {
                  ...selectedEvent.end,
                  dateTime: `${newDate}T${endTime}:00`
                }
              });
            }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startTime">Hora inicio</Label>
                  <Input id="edit-startTime" type="time" value={safeFormatDateTime(selectedEvent.start?.dateTime, "HH:mm")} onChange={e => {
                const date = safeFormatDateTime(selectedEvent.start?.dateTime, "yyyy-MM-dd");
                setSelectedEvent({
                  ...selectedEvent,
                  start: {
                    ...selectedEvent.start,
                    dateTime: `${date}T${e.target.value}:00`
                  }
                });
              }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endTime">Hora fin</Label>
                  <Input id="edit-endTime" type="time" value={safeFormatDateTime(selectedEvent.end?.dateTime, "HH:mm")} onChange={e => {
                const date = safeFormatDateTime(selectedEvent.end?.dateTime, "yyyy-MM-dd");
                setSelectedEvent({
                  ...selectedEvent,
                  end: {
                    ...selectedEvent.end,
                    dateTime: `${date}T${e.target.value}:00`
                  }
                });
              }} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateEvent} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>}

      {/* Block Period Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bloquear Periodo de Vacaciones</DialogTitle>
            <DialogDescription>Selecciona el periodo y la peluquera para bloquear el calendario</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de periodo</Label>
              <RadioGroup value={blockPeriod} onValueChange={(value: any) => setBlockPeriod(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hours" id="hours" />
                  <Label htmlFor="hours" className="font-normal cursor-pointer">
                    Horas
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="day" id="day" />
                  <Label htmlFor="day" className="font-normal cursor-pointer">
                    Día
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="week" id="week" />
                  <Label htmlFor="week" className="font-normal cursor-pointer">
                    Semana
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="month" id="month" />
                  <Label htmlFor="month" className="font-normal cursor-pointer">
                    Mes
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Peluquera</Label>
              <RadioGroup value={blockStylist} onValueChange={(value: any) => setBlockStylist(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="font-normal cursor-pointer">
                    Ambas
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cris" id="cris-block" />
                  <Label htmlFor="cris-block" className="font-normal cursor-pointer">
                    Cris
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="desi" id="desi-block" />
                  <Label htmlFor="desi-block" className="font-normal cursor-pointer">
                    Desi
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Fecha{blockPeriod === "hours" ? "" : " de inicio"}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !blockStartDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {blockStartDate ? format(blockStartDate, "PPP", {
                    locale: es
                  }) : "Selecciona una fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    mode="single" 
                    selected={blockStartDate} 
                    onSelect={setBlockStartDate} 
                    initialFocus 
                    className="pointer-events-auto" 
                    weekStartsOn={1}
                    modifiers={{
                      blocked: getBlockedDates()
                    }}
                    modifiersClassNames={{
                      blocked: "relative after:content-['🔒'] after:absolute after:top-0 after:right-0 after:text-[8px] after:leading-none"
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {blockPeriod === "hours" && <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="block-startTime">Hora inicio</Label>
                  <Input id="block-startTime" type="time" value={blockStartTime} onChange={e => setBlockStartTime(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block-endTime">Hora fin</Label>
                  <Input id="block-endTime" type="time" value={blockEndTime} onChange={e => setBlockEndTime(e.target.value)} />
                </div>
              </div>}

            {blockPeriod === "day" && <div className="space-y-2">
                <Label>Fecha de fin (opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !blockEndDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {blockEndDate ? format(blockEndDate, "PPP", {
                    locale: es
                  }) : "Mismo día que inicio"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar 
                      mode="single" 
                      selected={blockEndDate} 
                      onSelect={setBlockEndDate} 
                      disabled={date => blockStartDate ? date < blockStartDate : false} 
                      initialFocus 
                      className="pointer-events-auto" 
                      weekStartsOn={1}
                      modifiers={{
                        blocked: getBlockedDates()
                      }}
                      modifiersClassNames={{
                        blocked: "relative after:content-['🔒'] after:absolute after:top-0 after:right-0 after:text-[8px] after:leading-none"
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>}

            {blockStartDate && <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {blockPeriod === "hours" && <p>
                    Se bloquearán las horas de {blockStartTime} a {blockEndTime} el día{" "}
                    {format(blockStartDate, "PPP", {
                locale: es
              })}
                  </p>}
                {blockPeriod === "day" && !blockEndDate && <p>
                    Se bloqueará el día:{" "}
                    {format(blockStartDate, "PPP", {
                locale: es
              })}
                  </p>}
                {blockPeriod === "day" && blockEndDate && <p>
                    Se bloqueará desde{" "}
                    {format(blockStartDate, "PPP", {
                locale: es
              })}{" "}
                    hasta{" "}
                    {format(blockEndDate, "PPP", {
                locale: es
              })}
                  </p>}
                {blockPeriod === "week" && <p>
                    Se bloqueará la semana del{" "}
                    {format(blockStartDate, "PPP", {
                locale: es
              })}{" "}
                    al{" "}
                    {format(addWeeks(blockStartDate, 1), "PPP", {
                locale: es
              })}
                  </p>}
                {blockPeriod === "month" && <p>
                    Se bloqueará el mes del{" "}
                    {format(blockStartDate, "PPP", {
                locale: es
              })}{" "}
                    al{" "}
                    {format(addMonths(blockStartDate, 1), "PPP", {
                locale: es
              })}
                  </p>}
              </div>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBlockPeriod} disabled={!blockStartDate}>
              Bloquear Periodo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={completionDialogOpen} onOpenChange={setCompletionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cita Completada</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Deseas enviar un mensaje de valoración al cliente?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelCompletion}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSendReviewMessage} className="bg-[#8B4513] hover:bg-[#6B3410] text-white">
              Enviar mensaje
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};