import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Edit2, ChevronDown, Calendar as CalendarIcon, Ban } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  format,
  parseISO,
  addDays,
  startOfWeek,
  endOfWeek,
  isSameDay,
  addWeeks,
  addMonths,
  endOfDay,
  startOfDay,
  differenceInMinutes,
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AdminBookingFlow } from "./AdminBookingFlow";
interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  stylist: string;
  calendarId: string;
  completed?: boolean;
}
export const CalendarCRM = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [weekStart, setWeekStart] = useState(
    startOfWeek(new Date(), {
      weekStartsOn: 1,
    }),
  );
  const [currentTime, setCurrentTime] = useState(new Date());

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
  const [blockPeriod, setBlockPeriod] = useState<"day" | "week" | "month">("day");
  const [blockStylist, setBlockStylist] = useState<"cris" | "desi" | "both">("both");
  const { toast } = useToast();

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
        weekStartsOn: 1,
      });
      const { data, error } = await supabase.functions.invoke("list-calendar-events", {
        body: {
          calendarId: "all",
          timeMin: weekStart.toISOString(),
          timeMax: addDays(weekEnd, 1).toISOString(),
        },
      });
      if (error) {
        console.error("Error fetching events:", error);
        throw error;
      }

      // Mark events as completed if they have the completed marker in description
      const eventsWithStatus = (data?.events || []).map((event: CalendarEvent) => ({
        ...event,
        completed: event.description?.includes("[✓ COMPLETADA]") || false,
      }));
      setEvents(eventsWithStatus);
    } catch (error: any) {
      console.error("Error in fetchEvents:", error);
      toast({
        title: "Error",
        description: error.message || "Error al cargar los eventos",
        variant: "destructive",
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
      const { error } = await supabase.functions.invoke("update-calendar-event", {
        body: {
          eventId: selectedEvent.id,
          calendarId: selectedEvent.calendarId,
          summary: selectedEvent.summary,
          description: selectedEvent.description,
          start: selectedEvent.start.dateTime,
          end: selectedEvent.end.dateTime,
        },
      });
      if (error) throw error;
      toast({
        title: "Cita actualizada",
        description: "Los cambios se han guardado correctamente",
      });
      setIsEditDialogOpen(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la cita",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleToggleCompleted = async (event: CalendarEvent) => {
    try {
      const updatedDescription = event.completed
        ? (event.description || "").replace("[✓ COMPLETADA] ", "")
        : `[✓ COMPLETADA] ${event.description || ""}`;
      const { error } = await supabase.functions.invoke("update-calendar-event", {
        body: {
          eventId: event.id,
          calendarId: event.calendarId,
          summary: event.summary,
          description: updatedDescription,
          start: event.start.dateTime,
          end: event.end.dateTime,
        },
      });
      if (error) throw error;

      // Update local state
      setEvents(
        events.map((e) =>
          e.id === event.id
            ? {
                ...e,
                completed: !e.completed,
                description: updatedDescription,
              }
            : e,
        ),
      );
      toast({
        title: event.completed ? "Cita desmarcada" : "Cita completada",
        description: event.completed ? "La cita se ha desmarcado" : "¡Cliente atendido!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la cita",
        variant: "destructive",
      });
    }
  };
  const handleDeleteEvent = async (event: CalendarEvent) => {
    if (!confirm("¿Estás segura de que quieres eliminar esta cita?")) return;
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke("delete-calendar-event", {
        body: {
          eventId: event.id,
          calendarId: event.calendarId,
        },
      });
      if (error) throw error;
      toast({
        title: "Cita eliminada",
        description: "La cita se ha eliminado del calendario",
      });
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la cita",
        variant: "destructive",
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
        variant: "destructive",
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
      for (const stylist of calendars) {
        const { error } = await supabase.functions.invoke("create-calendar-event", {
          body: {
            stylist: stylist,
            summary: `🌴 VACACIONES - ${stylist.toUpperCase()}`,
            description: "Periodo bloqueado - Vacaciones",
            start: formatDateForCalendar(blockStartDate),
            end: formatEndDateForCalendar(finalEndDate),
            allDay: true,
          },
        });
        if (error) throw error;
      }
      toast({
        title: "Periodo bloqueado",
        description: `Se ha bloqueado el periodo de vacaciones correctamente`,
      });
      setIsBlockDialogOpen(false);
      setBlockStartDate(undefined);
      setBlockEndDate(undefined);
      setBlockPeriod("day");
      setBlockStylist("both");
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al bloquear el periodo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleJumpToDate = (date: Date | undefined) => {
    if (date) {
      setWeekStart(
        startOfWeek(date, {
          weekStartsOn: 1,
        }),
      );
    }
  };
  const groupEventsByDate = (events: CalendarEvent[]) => {
    const grouped: Record<string, CalendarEvent[]> = {};
    events.forEach((event) => {
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
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime(),
    );

    const positions: EventPosition[] = [];
    const groups: CalendarEvent[][] = [];

    // Group overlapping events
    sortedEvents.forEach((event) => {
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);

      // Find a group where this event overlaps with at least one event
      let foundGroup = false;
      for (const group of groups) {
        const overlaps = group.some((groupEvent) => {
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
    groups.forEach((group) => {
      const totalColumns = Math.min(group.length, 2); // Maximum 2 columns
      group.forEach((event, index) => {
        positions.push({
          event,
          column: index % totalColumns,
          totalColumns,
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
      return { hours: [], startHour: 0, endHour: 0 };
    }

    if (isSaturday) {
      // Sábado: 8:00 a 13:00
      return {
        hours: Array.from({ length: 6 }, (_, i) => 8 + i),
        startHour: 8,
        endHour: 13,
      };
    }

    // Martes a viernes: 9:00 a 19:00 (con descanso 14:00-16:00)
    return {
      hours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
      startHour: 9,
      endHour: 19,
    };
  };

  const calculateEventPosition = (event: CalendarEvent, dayDate: Date) => {
    const schedule = getScheduleForDay(dayDate);
    if (!event.start?.dateTime || !event.end?.dateTime) return null;

    try {
      const startTime = parseISO(event.start.dateTime);
      const endTime = parseISO(event.end.dateTime);

      const startHour = startTime.getHours();
      const startMinute = startTime.getMinutes();
      const endHour = endTime.getHours();
      const endMinute = endTime.getMinutes();

      // Calculate position from schedule start
      const startMinutesFromStart = (startHour - schedule.startHour) * 60 + startMinute;
      const endMinutesFromStart = (endHour - schedule.startHour) * 60 + endMinute;
      const durationMinutes = endMinutesFromStart - startMinutesFromStart;

      // Each hour is 80px tall
      const pixelsPerMinute = 104 / 60;
      const top = startMinutesFromStart * pixelsPerMinute;
      const height = durationMinutes * pixelsPerMinute;

      return { top, height };
    } catch (error) {
      console.error("Error calculating event position:", error);
      return null;
    }
  };

  const weekDays = Array.from(
    {
      length: 7,
    },
    (_, i) => addDays(weekStart, i),
  );
  const groupedEvents = groupEventsByDate(events);
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">CRM - Gestión de Citas🗓️</h2>
          <p className="text-muted-foreground">Gestiona los calendarios de Cris y Desi</p>
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

      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, -7))} disabled={loading}>
          ← Semana anterior
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            setWeekStart(
              startOfWeek(new Date(), {
                weekStartsOn: 1,
              }),
            )
          }
          disabled={loading}
        >
          Hoy
        </Button>
        <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, 7))} disabled={loading}>
          Semana siguiente →
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Ir a fecha
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={weekStart}
              onSelect={handleJumpToDate}
              initialFocus
              className="pointer-events-auto"
              weekStartsOn={1}
            />
          </PopoverContent>
        </Popover>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs
          defaultValue={format(weekDays.find((day) => isSameDay(day, new Date())) || weekDays[0], "yyyy-MM-dd")}
          className="w-full"
        >
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {weekDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayEvents = groupedEvents[dateKey] || [];
              const isToday = isSameDay(day, new Date());
              return (
                <TabsTrigger
                  key={dateKey}
                  value={dateKey}
                  className={cn(
                    "flex-col items-start gap-1 data-[state=active]:bg-background px-4 py-2 min-w-[140px]",
                    isToday && "border-primary",
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-sm font-semibold capitalize">{format(day, "EEE d MMM", { locale: es })}</span>
                    {isToday && (
                      <Badge variant="default" className="text-xs h-5">
                        Hoy
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {dayEvents.length} {dayEvents.length === 1 ? "cita" : "citas"}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {weekDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayEvents = groupedEvents[dateKey] || [];
            const schedule = getScheduleForDay(day);
            const crisEvents = dayEvents.filter((e) => e.stylist === "cris");
            const desiEvents = dayEvents.filter((e) => e.stylist === "desi");

            return (
              <TabsContent key={dateKey} value={dateKey} className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    {schedule.hours.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic text-center py-8">Cerrado los domingos</p>
                    ) : (
                      <div className="relative">
                        {/* Header */}
                        <div className="grid grid-cols-[80px_1fr_1fr] gap-3 pb-2 border-b mb-3 sticky top-0 bg-background z-10">
                          <div className="text-xs font-semibold text-muted-foreground">HORA</div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-xs font-semibold">CRIS</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                            <span className="text-xs font-semibold">DESI</span>
                          </div>
                        </div>

                       {/* Hours column */}
                        <div className="relative">
                          {schedule.hours.map((hour) => {
                            // No se necesita ninguna lógica aquí dentro
                            return (
                              <div
                                key={hour}
                                className="h-[104px] border-b border-border/30 flex items-start pt-1"
                              >
                                <span className="text-sm font-medium text-muted-foreground">
                                  {hour.toString().padStart(2, "0")}:00
                                </span>
                              </div>
                            );
                          })}
                        </div>
                              );
                            })}
                          </div>

                          {/* Cris column */}
                          <div className="relative border-l border-border/30">
                            {schedule.hours.map((hour) => {
                              <div key={hour} className="h-[104px] border-b border-border/30" />
                              const dayOfWeek = day.getDay();
                              const isTuesdayToFriday = dayOfWeek >= 2 && dayOfWeek <= 5;
                              const isBreakTime = isTuesdayToFriday && (hour === 12 || hour === 13 || hour === 14);
                              return (
                                <div
                                  key={hour}
                                  className={`h-20 border-b border-border/30 relative ${
                                    isBreakTime ? "bg-gray-200/40 dark:bg-gray-700/20" : ""
                                  }`}
                                >
                                  {isBreakTime && hour === 13 && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-background/80 px-2 py-0.5 rounded">
                                        Descanso
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {/* Events positioned absolutely with overlap detection */}
                            {(() => {
                              const positions = detectOverlaps(crisEvents);
                              return positions.map(({ event, column, totalColumns }) => {
                                const position = calculateEventPosition(event, day);
                                if (!position) return null;

                                const widthPercentage = 100 / totalColumns;
                                const leftPercentage = column * widthPercentage;

                                return (
                                  <div
                                    key={event.id}
                                    className={`absolute group bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-2 transition-all hover:shadow-md hover:z-20 overflow-hidden ${
                                      event.completed ? "opacity-50" : ""
                                    }`}
                                    style={{
                                      top: `${position.top}px`,
                                      height: `${Math.max(position.height, 40)}px`,
                                      left: `${leftPercentage}%`,
                                      width: `${widthPercentage - 2}%`,
                                    }}
                                  >
                                    <div className="flex items-start gap-2 h-full">
                                      <input
                                        type="checkbox"
                                        checked={event.completed || false}
                                        onChange={() => handleToggleCompleted(event)}
                                        className="mt-0.5 w-4 h-4 rounded border cursor-pointer accent-blue-500 flex-shrink-0"
                                      />
                                      <div className="flex-1 min-w-0 overflow-hidden">
                                        <p
                                          className={`text-xs font-medium leading-tight truncate ${
                                            event.completed ? "line-through" : ""
                                          }`}
                                        >
                                          {event.summary}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                          {safeFormatDateTime(event.start?.dateTime, "HH:mm")} -{" "}
                                          {safeFormatDateTime(event.end?.dateTime, "HH:mm")}
                                        </p>
                                      </div>
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-5 w-5 p-0"
                                          onClick={() => {
                                            setSelectedEvent(event);
                                            setIsEditDialogOpen(true);
                                          }}
                                        >
                                          <Edit2 className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                                          onClick={() => handleDeleteEvent(event)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>

                          {/* Desi column */}
                          <div className="relative border-l border-border/30">
                            {schedule.hours.map((hour) => {
                              <div key={hour} className="h-[104px] border-b border-border/30" />
                              const dayOfWeek = day.getDay();
                              const isTuesdayToFriday = dayOfWeek >= 2 && dayOfWeek <= 5;
                              const isBreakTime = isTuesdayToFriday && (hour === 12 || hour === 13 || hour === 14);
                              return (
                                <div
                                  key={hour}
                                  className={`h-20 border-b border-border/30 relative ${
                                    isBreakTime ? "bg-gray-200/40 dark:bg-gray-700/20" : ""
                                  }`}
                                >
                                  {isBreakTime && hour === 13 && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-background/80 px-2 py-0.5 rounded">
                                        Descanso
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {/* Events positioned absolutely with overlap detection */}
                            {(() => {
                              const positions = detectOverlaps(desiEvents);
                              return positions.map(({ event, column, totalColumns }) => {
                                const position = calculateEventPosition(event, day);
                                if (!position) return null;

                                const widthPercentage = 100 / totalColumns;
                                const leftPercentage = column * widthPercentage;

                                return (
                                  <div
                                    key={event.id}
                                    className={`absolute group bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-md p-2 transition-all hover:shadow-md hover:z-20 overflow-hidden ${
                                      event.completed ? "opacity-50" : ""
                                    }`}
                                    style={{
                                      top: `${position.top}px`,
                                      height: `${Math.max(position.height, 40)}px`,
                                      left: `${leftPercentage}%`,
                                      width: `${widthPercentage - 2}%`,
                                    }}
                                  >
                                    <div className="flex items-start gap-2 h-full">
                                      <input
                                        type="checkbox"
                                        checked={event.completed || false}
                                        onChange={() => handleToggleCompleted(event)}
                                        className="mt-0.5 w-4 h-4 rounded border cursor-pointer accent-purple-500 flex-shrink-0"
                                      />
                                      <div className="flex-1 min-w-0 overflow-hidden">
                                        <p
                                          className={`text-xs font-medium leading-tight truncate ${
                                            event.completed ? "line-through" : ""
                                          }`}
                                        >
                                          {event.summary}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                          {safeFormatDateTime(event.start?.dateTime, "HH:mm")} -{" "}
                                          {safeFormatDateTime(event.end?.dateTime, "HH:mm")}
                                        </p>
                                      </div>
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-5 w-5 p-0"
                                          onClick={() => {
                                            setSelectedEvent(event);
                                            setIsEditDialogOpen(true);
                                          }}
                                        >
                                          <Edit2 className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                                          onClick={() => handleDeleteEvent(event)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {/* Create Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Cita</DialogTitle>
            <DialogDescription>Crea una cita siguiendo los pasos</DialogDescription>
          </DialogHeader>
          <AdminBookingFlow onComplete={handleBookingComplete} onCancel={() => setIsCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      {selectedEvent && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Cita</DialogTitle>
              <DialogDescription>Modifica los detalles de la cita</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-summary">Título</Label>
                <Input
                  id="edit-summary"
                  value={selectedEvent.summary}
                  onChange={(e) =>
                    setSelectedEvent({
                      ...selectedEvent,
                      summary: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={selectedEvent.description || ""}
                  onChange={(e) =>
                    setSelectedEvent({
                      ...selectedEvent,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Fecha</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={safeFormatDateTime(selectedEvent.start?.dateTime, "yyyy-MM-dd")}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    const startTime = safeFormatDateTime(selectedEvent.start?.dateTime, "HH:mm");
                    const endTime = safeFormatDateTime(selectedEvent.end?.dateTime, "HH:mm");
                    setSelectedEvent({
                      ...selectedEvent,
                      start: {
                        ...selectedEvent.start,
                        dateTime: `${newDate}T${startTime}:00`,
                      },
                      end: {
                        ...selectedEvent.end,
                        dateTime: `${newDate}T${endTime}:00`,
                      },
                    });
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startTime">Hora inicio</Label>
                  <Input
                    id="edit-startTime"
                    type="time"
                    value={safeFormatDateTime(selectedEvent.start?.dateTime, "HH:mm")}
                    onChange={(e) => {
                      const date = safeFormatDateTime(selectedEvent.start?.dateTime, "yyyy-MM-dd");
                      setSelectedEvent({
                        ...selectedEvent,
                        start: {
                          ...selectedEvent.start,
                          dateTime: `${date}T${e.target.value}:00`,
                        },
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endTime">Hora fin</Label>
                  <Input
                    id="edit-endTime"
                    type="time"
                    value={safeFormatDateTime(selectedEvent.end?.dateTime, "HH:mm")}
                    onChange={(e) => {
                      const date = safeFormatDateTime(selectedEvent.end?.dateTime, "yyyy-MM-dd");
                      setSelectedEvent({
                        ...selectedEvent,
                        end: {
                          ...selectedEvent.end,
                          dateTime: `${date}T${e.target.value}:00`,
                        },
                      });
                    }}
                  />
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
        </Dialog>
      )}

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
              <Label>Fecha de inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !blockStartDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {blockStartDate
                      ? format(blockStartDate, "PPP", {
                          locale: es,
                        })
                      : "Selecciona una fecha"}
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
                  />
                </PopoverContent>
              </Popover>
            </div>

            {blockPeriod === "day" && (
              <div className="space-y-2">
                <Label>Fecha de fin (opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !blockEndDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {blockEndDate
                        ? format(blockEndDate, "PPP", {
                            locale: es,
                          })
                        : "Mismo día que inicio"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={blockEndDate}
                      onSelect={setBlockEndDate}
                      disabled={(date) => (blockStartDate ? date < blockStartDate : false)}
                      initialFocus
                      className="pointer-events-auto"
                      weekStartsOn={1}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {blockStartDate && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {blockPeriod === "day" && !blockEndDate && (
                  <p>
                    Se bloqueará el día:{" "}
                    {format(blockStartDate, "PPP", {
                      locale: es,
                    })}
                  </p>
                )}
                {blockPeriod === "day" && blockEndDate && (
                  <p>
                    Se bloqueará desde{" "}
                    {format(blockStartDate, "PPP", {
                      locale: es,
                    })}{" "}
                    hasta{" "}
                    {format(blockEndDate, "PPP", {
                      locale: es,
                    })}
                  </p>
                )}
                {blockPeriod === "week" && (
                  <p>
                    Se bloqueará la semana del{" "}
                    {format(blockStartDate, "PPP", {
                      locale: es,
                    })}{" "}
                    al{" "}
                    {format(addWeeks(blockStartDate, 1), "PPP", {
                      locale: es,
                    })}
                  </p>
                )}
                {blockPeriod === "month" && (
                  <p>
                    Se bloqueará el mes del{" "}
                    {format(blockStartDate, "PPP", {
                      locale: es,
                    })}{" "}
                    al{" "}
                    {format(addMonths(blockStartDate, 1), "PPP", {
                      locale: es,
                    })}
                  </p>
                )}
              </div>
            )}
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
    </div>
  );
};
