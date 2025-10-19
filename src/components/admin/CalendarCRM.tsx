import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Edit2, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, addDays, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { AdminBookingFlow } from "./AdminBookingFlow";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  stylist: string;
  calendarId: string;
  completed?: boolean;
}

export const CalendarCRM = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, [weekStart]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

      const { data, error } = await supabase.functions.invoke("list-calendar-events", {
        body: {
          calendarId: "all",
          timeMin: weekStart.toISOString(),
          timeMax: addDays(weekEnd, 1).toISOString(),
        },
      });

      if (error) throw error;

      // Mark events as completed if they have the completed marker in description
      const eventsWithStatus = (data.events || []).map((event: CalendarEvent) => ({
        ...event,
        completed: event.description?.includes("[✓ COMPLETADA]") || false,
      }));

      setEvents(eventsWithStatus);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar los eventos",
        variant: "destructive",
      });
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
      setEvents(events.map(e => 
        e.id === event.id 
          ? { ...e, completed: !e.completed, description: updatedDescription }
          : e
      ));

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

  const groupEventsByDate = (events: CalendarEvent[]) => {
    const grouped: { [key: string]: CalendarEvent[] } = {};
    events.forEach((event) => {
      const date = format(parseISO(event.start.dateTime), "yyyy-MM-dd");
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(event);
    });
    return grouped;
  };

  const groupEventsByHour = (events: CalendarEvent[]) => {
    const grouped: { [hour: string]: { cris: CalendarEvent[], desi: CalendarEvent[] } } = {};
    
    // Initialize all hours from 9:00 to 21:00
    for (let hour = 9; hour <= 21; hour++) {
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      grouped[hourKey] = { cris: [], desi: [] };
    }
    
    events.forEach((event) => {
      const startTime = format(parseISO(event.start.dateTime), "HH:mm");
      const hour = startTime.split(':')[0];
      const hourKey = `${hour}:00`;
      
      if (grouped[hourKey]) {
        if (event.stylist === "cris") {
          grouped[hourKey].cris.push(event);
        } else {
          grouped[hourKey].desi.push(event);
        }
      }
    });
    
    return grouped;
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const groupedEvents = groupEventsByDate(events);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">CRM - Gestión de Citas</h2>
          <p className="text-muted-foreground">Gestiona los calendarios de Cris y Desi</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cita
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setWeekStart(addDays(weekStart, -7))}
          disabled={loading}
        >
          ← Semana anterior
        </Button>
        <Button
          variant="outline"
          onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          disabled={loading}
        >
          Hoy
        </Button>
        <Button
          variant="outline"
          onClick={() => setWeekStart(addDays(weekStart, 7))}
          disabled={loading}
        >
          Semana siguiente →
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {weekDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayEvents = groupedEvents[dateKey] || [];
            const crisEvents = dayEvents.filter((e) => e.stylist === "cris");
            const desiEvents = dayEvents.filter((e) => e.stylist === "desi");
            const isToday = isSameDay(day, new Date());

            return (
              <AccordionItem
                key={dateKey}
                value={dateKey}
                className={`border rounded-lg ${isToday ? "border-primary bg-primary/5" : ""}`}
              >
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold capitalize">
                        {format(day, "EEEE d 'de' MMMM", { locale: es })}
                      </h3>
                      {isToday && (
                        <Badge variant="default" className="text-xs">
                          Hoy
                        </Badge>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {dayEvents.length} {dayEvents.length === 1 ? "cita" : "citas"}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pt-4 pb-6">
                  {dayEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-8">Sin citas programadas</p>
                  ) : (
                    <div className="space-y-1">
                      {/* Header */}
                      <div className="grid grid-cols-[80px_1fr_1fr] gap-3 pb-2 border-b mb-3">
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

                      {/* Timeline */}
                      {Object.entries(groupEventsByHour(dayEvents)).map(([hour, { cris, desi }]) => {
                        if (cris.length === 0 && desi.length === 0) return null;
                        
                        return (
                          <div key={hour} className="grid grid-cols-[80px_1fr_1fr] gap-3 items-start py-2 border-b border-border/50">
                            <div className="text-sm font-medium text-muted-foreground pt-1">{hour}</div>
                            
                            {/* Cris column */}
                            <div className="space-y-2">
                              {cris.map((event) => (
                                <div
                                  key={event.id}
                                  className={`group relative bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-2 transition-all hover:shadow-sm ${
                                    event.completed ? "opacity-50" : ""
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <input
                                      type="checkbox"
                                      checked={event.completed || false}
                                      onChange={() => handleToggleCompleted(event)}
                                      className="mt-0.5 w-4 h-4 rounded border cursor-pointer accent-blue-500 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium leading-tight ${event.completed ? "line-through" : ""}`}>
                                        {event.summary}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {format(parseISO(event.start.dateTime), "HH:mm")} - {format(parseISO(event.end.dateTime), "HH:mm")}
                                      </p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
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
                                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                        onClick={() => handleDeleteEvent(event)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Desi column */}
                            <div className="space-y-2">
                              {desi.map((event) => (
                                <div
                                  key={event.id}
                                  className={`group relative bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-md p-2 transition-all hover:shadow-sm ${
                                    event.completed ? "opacity-50" : ""
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <input
                                      type="checkbox"
                                      checked={event.completed || false}
                                      onChange={() => handleToggleCompleted(event)}
                                      className="mt-0.5 w-4 h-4 rounded border cursor-pointer accent-purple-500 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium leading-tight ${event.completed ? "line-through" : ""}`}>
                                        {event.summary}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {format(parseISO(event.start.dateTime), "HH:mm")} - {format(parseISO(event.end.dateTime), "HH:mm")}
                                      </p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
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
                                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                        onClick={() => handleDeleteEvent(event)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Create Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Cita</DialogTitle>
            <DialogDescription>Crea una cita siguiendo los pasos</DialogDescription>
          </DialogHeader>
          <AdminBookingFlow
            onComplete={handleBookingComplete}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
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
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, summary: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={selectedEvent.description || ""}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Fecha</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={format(parseISO(selectedEvent.start.dateTime), "yyyy-MM-dd")}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    const startTime = format(parseISO(selectedEvent.start.dateTime), "HH:mm");
                    const endTime = format(parseISO(selectedEvent.end.dateTime), "HH:mm");
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
                    value={format(parseISO(selectedEvent.start.dateTime), "HH:mm")}
                    onChange={(e) => {
                      const date = format(parseISO(selectedEvent.start.dateTime), "yyyy-MM-dd");
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
                    value={format(parseISO(selectedEvent.end.dateTime), "HH:mm")}
                    onChange={(e) => {
                      const date = format(parseISO(selectedEvent.end.dateTime), "yyyy-MM-dd");
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
    </div>
  );
};
