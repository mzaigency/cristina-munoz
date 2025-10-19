import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, addDays, startOfWeek, endOfWeek } from "date-fns";
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
}

export const CalendarCRM = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCalendar, setSelectedCalendar] = useState<"all" | "cris" | "desi">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, [selectedCalendar, weekStart]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

      const { data, error } = await supabase.functions.invoke("list-calendar-events", {
        body: {
          calendarId: selectedCalendar,
          timeMin: weekStart.toISOString(),
          timeMax: addDays(weekEnd, 1).toISOString(),
        },
      });

      if (error) throw error;

      setEvents(data.events || []);
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

      <Tabs value={selectedCalendar} onValueChange={(v) => setSelectedCalendar(v as any)}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="cris">Cris</TabsTrigger>
          <TabsTrigger value="desi">Desi</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2 mb-4">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {weekDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayEvents = groupedEvents[dateKey] || [];

            return (
              <Card key={dateKey} className={format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "border-primary" : ""}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    {format(day, "EEEE d 'de' MMMM", { locale: es })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dayEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin citas</p>
                  ) : (
                    dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg border ${
                          event.stylist === "cris"
                            ? "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                            : "bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{event.summary}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(event.start.dateTime), "HH:mm")} -{" "}
                              {format(parseISO(event.end.dateTime), "HH:mm")}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">{event.stylist}</p>
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
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
                              className="h-6 w-6 p-0 text-destructive"
                              onClick={() => handleDeleteEvent(event)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
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
