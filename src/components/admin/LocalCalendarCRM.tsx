import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Calendar as CalendarIcon, Ban, Search, X, Check, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format, parseISO, addDays, startOfWeek, endOfWeek, isSameDay, addWeeks, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AdminBookingFlow } from "./AdminBookingFlow";
import { BUSINESS_HOURS } from "@/constants/business";

interface LocalBooking {
  id: string;
  customer_name: string;
  Telefono: string;
  Fecha: string;
  Hora: string;
  end_time: string | null;
  stylist: string;
  services: any;
  total_duration: number;
  status: string;
  title: string | null;
  notes: string | null;
  color: string | null;
  tenant_id: string | null;
  recurrence_group_id: string | null;
  recurrence_pattern: any | null;
}

interface LocalCalendarCRMProps {
  tenantId: string;
  stylists: Array<{ slug: string; name: string; color: string }>;
}

// Constante para escala visual - 2px por minuto = 120px por hora
const PIXELS_PER_MINUTE = 2;

export const LocalCalendarCRM = ({ tenantId, stylists }: LocalCalendarCRMProps) => {
  const [bookings, setBookings] = useState<LocalBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<LocalBooking | null>(null);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<string>("");
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);

  // Drag & Drop state
  const [draggedBooking, setDraggedBooking] = useState<LocalBooking | null>(null);
  const [dragOverStylist, setDragOverStylist] = useState<string | null>(null);
  const [dragOverTime, setDragOverTime] = useState<string | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);

  // Resize state
  const [resizingBooking, setResizingBooking] = useState<LocalBooking | null>(null);
  const [resizeStartY, setResizeStartY] = useState<number>(0);
  const [resizeOriginalDuration, setResizeOriginalDuration] = useState<number>(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocalBooking[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Block period state
  const [blockStartDate, setBlockStartDate] = useState<Date | undefined>(undefined);
  const [blockEndDate, setBlockEndDate] = useState<Date | undefined>(undefined);
  const [blockPeriod, setBlockPeriod] = useState<"day" | "week" | "month" | "hours">("day");
  const [blockStylist, setBlockStylist] = useState<string>("all");
  const [blockStartTime, setBlockStartTime] = useState<string>("09:00");
  const [blockEndTime, setBlockEndTime] = useState<string>("19:00");

  // Completion dialog
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [pendingCompletionBooking, setPendingCompletionBooking] = useState<LocalBooking | null>(null);

  // Series cancellation dialog
  const [seriesCancelDialogOpen, setSeriesCancelDialogOpen] = useState(false);
  const [pendingCancelBooking, setPendingCancelBooking] = useState<LocalBooking | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [weekStart, tenantId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("tenant_id", tenantId)
        .gte("Fecha", format(weekStart, "yyyy-MM-dd"))
        .lte("Fecha", format(addDays(weekEnd, 1), "yyyy-MM-dd"))
        .eq("status", "confirmed")
        .order("Hora", { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: error.message || "Error al cargar las citas",
        variant: "destructive",
      });
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      toast({
        title: "Búsqueda inválida",
        description: "Introduce al menos 2 caracteres para buscar",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSearching(true);
      const query = searchQuery.trim().toLowerCase();

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("tenant_id", tenantId)
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
          description: "No se encontraron citas con esos datos",
        });
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Error en la búsqueda",
        description: error.message || "No se pudo realizar la búsqueda",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: LocalBooking) => {
    const appointmentDate = parseISO(result.Fecha);
    const dateKey = format(appointmentDate, "yyyy-MM-dd");
    setWeekStart(startOfWeek(appointmentDate, { weekStartsOn: 1 }));
    setActiveTab(dateKey);
    setShowSearchResults(false);
    setSearchQuery("");
    setHighlightedBookingId(result.id);

    setTimeout(() => {
      const eventElement = document.querySelector(`[data-booking-id="${result.id}"]`);
      if (eventElement) {
        eventElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 300);

    setTimeout(() => {
      setHighlightedBookingId(null);
    }, 5000);

    toast({
      title: "Cita encontrada",
      description: `${result.customer_name} - ${format(appointmentDate, "d MMM yyyy", { locale: es })}`,
    });
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleBookingComplete = () => {
    setIsCreateDialogOpen(false);
    fetchBookings();
  };

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;
    try {
      setLoading(true);

      const { error } = await supabase
        .from("bookings")
        .update({
          title: selectedBooking.title,
          notes: selectedBooking.notes,
        })
        .eq("id", selectedBooking.id);

      if (error) throw error;

      toast({
        title: "Cita actualizada",
        description: "Los cambios se han guardado correctamente",
      });
      setIsEditDialogOpen(false);
      setSelectedBooking(null);
      fetchBookings();
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

  const handleMarkCompleted = async (booking: LocalBooking) => {
    const isAlreadyCompleted = booking.notes?.includes("[✓ COMPLETADA]");

    if (!isAlreadyCompleted) {
      setPendingCompletionBooking(booking);
      setCompletionDialogOpen(true);
      return;
    }

    // Unmark as completed
    try {
      const updatedNotes = (booking.notes || "").replace("[✓ COMPLETADA] ", "");
      const { error } = await supabase.from("bookings").update({ notes: updatedNotes }).eq("id", booking.id);

      if (error) throw error;

      setBookings(bookings.map((b) => (b.id === booking.id ? { ...b, notes: updatedNotes } : b)));

      toast({
        title: "Cita desmarcada",
        description: "La cita se ha desmarcado",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la cita",
        variant: "destructive",
      });
    }
  };

  const handleConfirmCompletion = async (sendReviewMessage: boolean) => {
    if (!pendingCompletionBooking) return;

    try {
      const updatedNotes = `[✓ COMPLETADA] ${pendingCompletionBooking.notes || ""}`;
      const { error } = await supabase
        .from("bookings")
        .update({ notes: updatedNotes })
        .eq("id", pendingCompletionBooking.id);

      if (error) throw error;

      setBookings(bookings.map((b) => (b.id === pendingCompletionBooking.id ? { ...b, notes: updatedNotes } : b)));

      if (sendReviewMessage) {
        try {
          await supabase.functions.invoke("webhook-valoracion", {
            body: {
              customerName: pendingCompletionBooking.customer_name,
              phone: pendingCompletionBooking.Telefono,
              date: pendingCompletionBooking.Fecha,
              time: pendingCompletionBooking.Hora,
              stylist: pendingCompletionBooking.stylist,
              services: Array.isArray(pendingCompletionBooking.services)
                ? pendingCompletionBooking.services.map((s: any) => s.name)
                : [],
              tenant_id: tenantId,
            },
          });
        } catch (webhookError) {
          console.error("Error invoking webhook:", webhookError);
        }
      }

      toast({
        title: "Cita completada",
        description: sendReviewMessage ? "¡Cliente atendido! Mensaje de valoración enviado" : "¡Cliente atendido!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al completar la cita",
        variant: "destructive",
      });
    } finally {
      setCompletionDialogOpen(false);
      setPendingCompletionBooking(null);
    }
  };

  const handleDeleteBooking = async (booking: LocalBooking) => {
    // If booking is part of a recurring series, show special dialog
    if (booking.recurrence_group_id) {
      setPendingCancelBooking(booking);
      setSeriesCancelDialogOpen(true);
      return;
    }

    if (!confirm("¿Estás segura de que quieres eliminar esta cita?")) return;

    await performBookingDeletion(booking, false);
  };

  const performBookingDeletion = async (booking: LocalBooking, cancelSeries: boolean) => {
    try {
      setLoading(true);

      // Call cancel-booking function which handles all cleanup
      const { error } = await supabase.functions.invoke("cancel-booking", {
        body: {
          bookingId: booking.id,
          user: "admin",
          tenant_id: tenantId,
          cancelSeries,
        },
      });

      if (error) throw error;

      toast({
        title: cancelSeries ? "Serie cancelada" : "Cita eliminada",
        description: cancelSeries
          ? "Todas las citas futuras de la serie han sido canceladas"
          : "La cita se ha eliminado correctamente",
      });
      fetchBookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la cita",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setSeriesCancelDialogOpen(false);
      setPendingCancelBooking(null);
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
      const stylistsToBlock = blockStylist === "all" ? stylists.map((s) => s.slug) : [blockStylist];

      for (const stylist of stylistsToBlock) {
        const bookingData = {
          tenant_id: tenantId,
          customer_name: "BLOQUEADO",
          Telefono: "",
          Fecha: format(blockStartDate, "yyyy-MM-dd"),
          Hora: blockPeriod === "hours" ? blockStartTime : "00:00",
          end_time: blockPeriod === "hours" ? blockEndTime : "23:59",
          stylist: stylist,
          services: [],
          total_duration:
            blockPeriod === "hours"
              ? (parseInt(blockEndTime.split(":")[0]) - parseInt(blockStartTime.split(":")[0])) * 60
              : 24 * 60,
          status: "confirmed",
          title:
            blockPeriod === "hours"
              ? `🔒 BLOQUEADO - ${stylist.toUpperCase()}`
              : `🌴 VACACIONES - ${stylist.toUpperCase()}`,
          notes: blockPeriod === "hours" ? "Periodo bloqueado - Horas específicas" : "Periodo bloqueado - Vacaciones",
          color: "#EF4444",
          canal: "crm",
        };

        const { error } = await supabase.from("bookings").insert(bookingData);

        if (error) throw error;
      }

      toast({
        title: "Periodo bloqueado",
        description:
          blockPeriod === "hours"
            ? "Se han bloqueado las horas correctamente"
            : "Se ha bloqueado el periodo de vacaciones correctamente",
      });

      setIsBlockDialogOpen(false);
      setBlockStartDate(undefined);
      setBlockEndDate(undefined);
      setBlockPeriod("day");
      setBlockStylist("all");
      setBlockStartTime("09:00");
      setBlockEndTime("19:00");
      fetchBookings();
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
      const dateKey = format(date, "yyyy-MM-dd");
      setWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
      setActiveTab(dateKey);
    }
  };

  const groupBookingsByDate = (bookings: LocalBooking[]) => {
    const grouped: Record<string, LocalBooking[]> = {};
    bookings.forEach((booking) => {
      const date = booking.Fecha;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(booking);
    });
    return grouped;
  };

  const getStylistColor = (stylistSlug: string) => {
    const stylist = stylists.find((s) => s.slug === stylistSlug);
    return stylist?.color || "#8B5CF6";
  };

  const getScheduleForDay = (dayDate: Date) => {
    const dayOfWeek = dayDate.getDay();
    const businessHours = BUSINESS_HOURS[dayOfWeek];

    if (businessHours.isClosed) {
      return { hours: [], startHour: 0, endHour: 0, breakStart: null, breakEnd: null };
    }

    // Calculate start and end hours from business hours
    let defaultStartHour = Math.floor(businessHours.morningStart / 60);
    let defaultEndHour =
      businessHours.afternoonEnd > 0
        ? Math.ceil(businessHours.afternoonEnd / 60)
        : Math.ceil(businessHours.morningEnd / 60);

    const dayBookings = bookings.filter((b) => b.Fecha === format(dayDate, "yyyy-MM-dd"));

    let actualStartHour = defaultStartHour;
    let actualEndHour = defaultEndHour;

    if (dayBookings.length > 0) {
      dayBookings.forEach((booking) => {
        const [startH] = booking.Hora.split(":").map(Number);
        const endTime = booking.end_time || booking.Hora;
        const [endH, endM] = endTime.split(":").map(Number);
        const endHour = endM > 0 ? endH + 1 : endH;

        actualStartHour = Math.min(actualStartHour, startH);
        actualEndHour = Math.max(actualEndHour, endHour);
      });
    }

    const hours = Array.from({ length: actualEndHour - actualStartHour }, (_, i) => actualStartHour + i);

    // Break times for this day
    const breakStart = businessHours.afternoonStart > 0 ? Math.floor(businessHours.morningEnd / 60) : null;
    const breakEnd = businessHours.afternoonStart > 0 ? Math.floor(businessHours.afternoonStart / 60) : null;

    return { hours, startHour: actualStartHour, endHour: actualEndHour, breakStart, breakEnd };
  };

  const calculateBookingPosition = (booking: LocalBooking, dayDate: Date) => {
    const schedule = getScheduleForDay(dayDate);
    const [startH, startM] = booking.Hora.split(":").map(Number);
    const endTime = booking.end_time || booking.Hora;
    const [endH, endM] = endTime.split(":").map(Number);

    const startMinutesFromStart = (startH - schedule.startHour) * 60 + startM;
    const endMinutesFromStart = (endH - schedule.startHour) * 60 + endM;
    const durationMinutes = endMinutesFromStart - startMinutesFromStart;

    const top = startMinutesFromStart * PIXELS_PER_MINUTE;
    const height = Math.max(durationMinutes * PIXELS_PER_MINUTE, 40);

    return { top, height, startMinutes: startMinutesFromStart, endMinutes: endMinutesFromStart };
  };

  // Calculate overlapping bookings layout
  const calculateOverlapLayout = (stylistBookings: LocalBooking[], dayDate: Date) => {
    if (!stylistBookings.length) return {};

    const layout: Record<string, { left: string; width: string; zIndex: number }> = {};

    // Sort by start time
    const sorted = [...stylistBookings].sort((a, b) => {
      const aPos = calculateBookingPosition(a, dayDate);
      const bPos = calculateBookingPosition(b, dayDate);
      return aPos.startMinutes - bPos.startMinutes;
    });

    // Find overlapping groups
    const groups: LocalBooking[][] = [];
    let currentGroup: LocalBooking[] = [];
    let groupEnd = 0;

    sorted.forEach((booking) => {
      const pos = calculateBookingPosition(booking, dayDate);

      if (currentGroup.length === 0 || pos.startMinutes < groupEnd) {
        currentGroup.push(booking);
        groupEnd = Math.max(groupEnd, pos.endMinutes);
      } else {
        if (currentGroup.length > 0) groups.push([...currentGroup]);
        currentGroup = [booking];
        groupEnd = pos.endMinutes;
      }
    });
    if (currentGroup.length > 0) groups.push(currentGroup);

    // Assign positions within each group
    groups.forEach((group) => {
      const columns: LocalBooking[][] = [];

      group.forEach((booking) => {
        const pos = calculateBookingPosition(booking, dayDate);
        let placed = false;

        for (let i = 0; i < columns.length; i++) {
          const lastInColumn = columns[i][columns[i].length - 1];
          const lastPos = calculateBookingPosition(lastInColumn, dayDate);

          if (pos.startMinutes >= lastPos.endMinutes) {
            columns[i].push(booking);
            placed = true;
            break;
          }
        }

        if (!placed) {
          columns.push([booking]);
        }
      });

      const totalColumns = columns.length;
      columns.forEach((column, colIndex) => {
        column.forEach((booking, idx) => {
          layout[booking.id] = {
            left: `${(colIndex / totalColumns) * 100}%`,
            width: `${(1 / totalColumns) * 100 - 1}%`,
            zIndex: colIndex + 1,
          };
        });
      });
    });

    return layout;
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, booking: LocalBooking) => {
    if (booking.title?.includes("🔒 BLOQUEADO") || booking.title?.includes("🌴 VACACIONES")) return;
    setDraggedBooking(booking);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", booking.id);
  };

  const handleDragOverColumn = (e: React.DragEvent, stylistSlug: string, startHour: number) => {
    e.preventDefault();
    if (!draggedBooking) return;

    // Calculate exact time from mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const minutesFromColumnStart = relativeY / PIXELS_PER_MINUTE;
    const totalMinutes = startHour * 60 + minutesFromColumnStart;

    // Snap to 15-minute intervals
    const snappedMinutes = Math.round(totalMinutes / 15) * 15;
    const hour = Math.floor(snappedMinutes / 60);
    const minute = snappedMinutes % 60;

    setDragOverStylist(stylistSlug);
    const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    setDragOverTime(timeStr);
  };

  const handleDragLeave = () => {
    setDragOverStylist(null);
    setDragOverTime(null);
  };

  const handleDropOnColumn = async (
    e: React.DragEvent,
    targetStylist: string,
    startHour: number,
    targetDate: string,
  ) => {
    e.preventDefault();
    if (!draggedBooking) return;

    // Calculate exact time from mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const minutesFromColumnStart = relativeY / PIXELS_PER_MINUTE;
    const totalMinutes = startHour * 60 + minutesFromColumnStart;

    // Snap to 15-minute intervals
    const snappedMinutes = Math.round(totalMinutes / 15) * 15;
    const targetHour = Math.floor(snappedMinutes / 60);
    const targetMinute = snappedMinutes % 60;

    const newTime = `${String(targetHour).padStart(2, "0")}:${String(targetMinute).padStart(2, "0")}`;

    // Calculate new end time
    const durationMinutes = draggedBooking.total_duration;
    const newEndMinutes = snappedMinutes + durationMinutes;
    const newEndHour = Math.floor(newEndMinutes / 60);
    const newEndMin = newEndMinutes % 60;
    const newEndTime = `${String(newEndHour).padStart(2, "0")}:${String(newEndMin).padStart(2, "0")}`;

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          stylist: targetStylist,
          Hora: newTime,
          end_time: newEndTime,
          Fecha: targetDate,
        })
        .eq("id", draggedBooking.id);

      if (error) throw error;

      toast({
        title: "Cita movida",
        description: `${draggedBooking.customer_name} → ${stylists.find((s) => s.slug === targetStylist)?.name} a las ${newTime}`,
      });

      fetchBookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo mover la cita",
        variant: "destructive",
      });
    } finally {
      setDraggedBooking(null);
      setDragOverStylist(null);
      setDragOverTime(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedBooking(null);
    setDragOverStylist(null);
    setDragOverTime(null);
  };

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, booking: LocalBooking) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingBooking(booking);
    setResizeStartY(e.clientY);
    setResizeOriginalDuration(booking.total_duration);
  };

  useEffect(() => {
    if (!resizingBooking) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizeStartY;
      const deltaMinutes = Math.round(deltaY / PIXELS_PER_MINUTE / 15) * 15; // Snap to 15min
      const newDuration = Math.max(15, resizeOriginalDuration + deltaMinutes);

      // Calculate new end_time for visual feedback
      const [startH, startM] = resizingBooking.Hora.split(":").map(Number);
      const newEndMinutes = startH * 60 + startM + newDuration;
      const newEndHour = Math.floor(newEndMinutes / 60);
      const newEndMin = newEndMinutes % 60;
      const newEndTime = `${String(newEndHour).padStart(2, "0")}:${String(newEndMin).padStart(2, "0")}`;

      // Update locally for visual feedback
      setBookings((prev) =>
        prev.map((b) =>
          b.id === resizingBooking.id ? { ...b, total_duration: newDuration, end_time: newEndTime } : b,
        ),
      );
    };

    const handleMouseUp = async () => {
      if (!resizingBooking) return;

      const booking = bookings.find((b) => b.id === resizingBooking.id);
      if (!booking) return;

      const [startH, startM] = booking.Hora.split(":").map(Number);
      const newEndMinutes = startH * 60 + startM + booking.total_duration;
      const newEndHour = Math.floor(newEndMinutes / 60);
      const newEndMin = newEndMinutes % 60;
      const newEndTime = `${String(newEndHour).padStart(2, "0")}:${String(newEndMin).padStart(2, "0")}`;

      try {
        const { error } = await supabase
          .from("bookings")
          .update({
            total_duration: booking.total_duration,
            end_time: newEndTime,
          })
          .eq("id", booking.id);

        if (error) throw error;

        toast({
          title: "Duración actualizada",
          description: `${booking.customer_name}: ${booking.total_duration} minutos`,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo actualizar",
          variant: "destructive",
        });
        fetchBookings();
      }

      setResizingBooking(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingBooking, resizeStartY, resizeOriginalDuration, bookings]);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const groupedBookings = groupBookingsByDate(bookings);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Gestión de Citas</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Sistema local</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => setIsCreateDialogOpen(true)} className="flex-1" size="sm" data-tour-step="new-appointment">
            <Plus className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Nueva </span>Cita
          </Button>
          <Button variant="secondary" onClick={() => setIsBlockDialogOpen(true)} className="flex-1" size="sm">
            <Ban className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Bloquear</span>
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <Card className="p-3 md:p-4">
        <div className="flex flex-col gap-2 md:gap-3">
          <Label className="text-xs md:text-sm font-medium flex items-center gap-2">
            <Search className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Buscar cita
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Nombre o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pr-8 text-sm h-9"
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
            <Button onClick={handleSearch} disabled={isSearching} size="sm" className="h-9 px-3">
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {showSearchResults && searchResults.length > 0 && (
            <div className="mt-2 border rounded-md divide-y max-h-60 md:max-h-80 overflow-y-auto">
              {searchResults.map((result) => {
                const servicesList = Array.isArray(result.services)
                  ? result.services.map((s: any) => s.name || s).filter(Boolean)
                  : [];

                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelectSearchResult(result)}
                    className="w-full text-left p-2.5 md:p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5 md:mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{result.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{result.Telefono}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs md:text-sm font-medium">
                          {format(parseISO(result.Fecha), "d MMM", { locale: es })}
                        </p>
                        <p className="text-[10px] md:text-xs text-muted-foreground">{result.Hora.slice(0, 5)}</p>
                      </div>
                    </div>
                    {servicesList.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {servicesList.slice(0, 2).map((serviceName: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-[10px] md:text-xs">
                            {serviceName}
                          </Badge>
                        ))}
                        {servicesList.length > 2 && (
                          <Badge variant="secondary" className="text-[10px] md:text-xs">
                            +{servicesList.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-1.5 md:gap-2">
          <Button
            variant="outline"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            disabled={loading}
            size="sm"
            className="flex-1 h-9"
          >
            ←
          </Button>
          <Button
            variant="outline"
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            disabled={loading}
            size="sm"
            className="flex-1 h-9 border-primary"
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            disabled={loading}
            size="sm"
            className="flex-1 h-9"
          >
            →
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-2.5">
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={weekStart} onSelect={handleJumpToDate} initialFocus weekStartsOn={1} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Calendar View */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs
          value={activeTab || format(weekDays.find((day) => isSameDay(day, new Date())) || weekDays[0], "yyyy-MM-dd")}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto gap-0.5 md:gap-1 bg-muted/50 p-0.5 md:p-1">
            {weekDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayBookings = groupedBookings[dateKey] || [];
              const isToday = isSameDay(day, new Date());
              const hasFullBlock = dayBookings.some((b) => b.title?.includes("🌴 VACACIONES"));

              return (
                <TabsTrigger
                  key={dateKey}
                  value={dateKey}
                  className={cn(
                    "flex-col items-center gap-0.5 data-[state=active]:bg-background px-1.5 md:px-4 py-1.5 md:py-2 min-w-[52px] md:min-w-[100px]",
                    isToday && "border-primary",
                  )}
                >
                  <div className="flex flex-col md:flex-row items-center gap-0.5 md:gap-2 w-full">
                    <span className="text-[10px] md:text-sm font-semibold capitalize">
                      {format(day, "EEE", { locale: es })}
                    </span>
                    <span className="text-sm md:text-base font-bold">{format(day, "d")}</span>
                    {isToday && (
                      <Badge variant="default" className="text-[8px] md:text-xs h-3 px-1 md:h-5 md:px-2 hidden md:flex">
                        Hoy
                      </Badge>
                    )}
                    {hasFullBlock && <Ban className="h-2.5 w-2.5 md:h-3 md:w-3 text-destructive" />}
                  </div>
                  <span className="text-[9px] md:text-xs text-muted-foreground">{dayBookings.length} citas</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {weekDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayBookings = groupedBookings[dateKey] || [];
            const schedule = getScheduleForDay(day);

            // Group by stylist
            const bookingsByStylist: Record<string, LocalBooking[]> = {};
            stylists.forEach((s) => {
              bookingsByStylist[s.slug] = dayBookings.filter((b) => b.stylist === s.slug);
            });

            return (
              <TabsContent key={dateKey} value={dateKey} className="mt-3 md:mt-4">
                <Card>
                  <CardContent className="p-2 md:p-6">
                    {schedule.hours.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <p>Día cerrado</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto -mx-2 px-2 md:mx-0 md:px-0">
                        {/* Header */}
                        <div className="flex gap-2 md:gap-4 pb-2 md:pb-3 border-b border-border/40 min-w-max">
                          <div className="w-10 md:w-16 shrink-0 text-[9px] md:text-xs font-semibold text-muted-foreground">
                            HORA
                          </div>

                          <div className="flex-1 flex gap-2 md:gap-4">
                            {stylists.map((stylist) => (
                              <div
                                key={stylist.slug}
                                className="flex-1 min-w-[100px] md:min-w-[180px] text-center font-semibold text-xs md:text-sm py-1.5 md:py-2 rounded-lg shadow-sm"
                                style={{
                                  backgroundColor: `${stylist.color}15`,
                                  color: stylist.color,
                                  borderBottom: `2px solid ${stylist.color}`,
                                }}
                              >
                                {stylist.name}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="flex gap-2 md:gap-4 pt-2 md:pt-3 min-w-max">
                          {/* Time column */}
                          <div className="w-10 md:w-16 shrink-0">
                            {schedule.hours.map((hour) => {
                              const isBreakHour =
                                schedule.breakStart !== null &&
                                schedule.breakEnd !== null &&
                                hour >= schedule.breakStart &&
                                hour < schedule.breakEnd;

                              return (
                                <div
                                  key={hour}
                                  className={cn(
                                    "h-[120px] text-[10px] md:text-sm text-muted-foreground border-b border-border/30 flex items-start pt-1",
                                    isBreakHour && "bg-muted/30",
                                  )}
                                >
                                  <span className="font-medium">{String(hour).padStart(2, "0")}:00</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Stylists columns */}
                          <div className="flex-1 flex gap-2 md:gap-4">
                            {stylists.map((stylist) => (
                              <div key={stylist.slug} className="flex-1 min-w-[100px] md:min-w-[180px]">
                                <div
                                  className="relative rounded-lg overflow-hidden"
                                  style={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}
                                  onDragOver={(e) => handleDragOverColumn(e, stylist.slug, schedule.startHour)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDropOnColumn(e, stylist.slug, schedule.startHour, dateKey)}
                                >
                                  {/* Hour grid lines with break indication */}
                                  {schedule.hours.map((hour, idx) => {
                                    const isBreakHour =
                                      schedule.breakStart !== null &&
                                      schedule.breakEnd !== null &&
                                      hour >= schedule.breakStart &&
                                      hour < schedule.breakEnd;

                                    return (
                                      <div
                                        key={hour}
                                        className={cn(
                                          "h-[120px] border-b border-border/20 relative pointer-events-none",
                                          isBreakHour && "bg-amber-500/5",
                                        )}
                                      >
                                        {/* Half-hour line */}
                                        <div className="absolute top-[60px] left-0 right-0 border-t border-dashed border-border/15" />

                                        {/* Break time indicator */}
                                        {isBreakHour && idx === schedule.breakStart && (
                                          <div className="absolute inset-x-0 top-0 flex items-center justify-center">
                                            <span className="text-[10px] text-amber-600/60 bg-amber-100/50 px-2 py-0.5 rounded-b-md">
                                              Descanso
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}

                                  {/* Drop indicator - shows exact time where booking will land */}
                                  {dragOverStylist === stylist.slug &&
                                    dragOverTime &&
                                    (() => {
                                      const [h, m] = dragOverTime.split(":").map(Number);
                                      const minutesFromStart = (h - schedule.startHour) * 60 + m;
                                      const topPosition = minutesFromStart * PIXELS_PER_MINUTE;
                                      const height = (draggedBooking?.total_duration || 30) * PIXELS_PER_MINUTE;

                                      return (
                                        <div
                                          className="absolute left-1 right-1 rounded-lg bg-primary/20 border-2 border-dashed border-primary/60 pointer-events-none z-40 flex items-center justify-center"
                                          style={{ top: Math.max(0, topPosition), height }}
                                        >
                                          <span className="text-xs font-semibold text-primary bg-background/80 px-2 py-0.5 rounded">
                                            {dragOverTime}
                                          </span>
                                        </div>
                                      );
                                    })()}

                                  {/* Current time indicator - only show on today */}
                                  {isSameDay(day, new Date()) &&
                                    (() => {
                                      const now = currentTime;
                                      const currentHour = now.getHours();
                                      const currentMinute = now.getMinutes();

                                      // Check if current time is within schedule
                                      if (currentHour >= schedule.startHour && currentHour < schedule.endHour) {
                                        const minutesFromStart =
                                          (currentHour - schedule.startHour) * 60 + currentMinute;
                                        const topPosition = minutesFromStart * PIXELS_PER_MINUTE;

                                        return (
                                          <div
                                            className="absolute left-0 right-0 z-50 pointer-events-none flex items-center"
                                            style={{ top: topPosition }}
                                          >
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 shadow-sm" />
                                            <div className="flex-1 h-0.5 bg-red-500 shadow-sm" />
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}

                                  {/* Render bookings - iOS style with overlap handling */}
                                  {(() => {
                                    const stylistBookings = bookingsByStylist[stylist.slug] || [];
                                    const overlapLayout = calculateOverlapLayout(stylistBookings, day);

                                    return stylistBookings.map((booking) => {
                                      const pos = calculateBookingPosition(booking, day);
                                      const isCompleted = booking.notes?.includes("[✓ COMPLETADA]");
                                      const isBlocked =
                                        booking.title?.includes("🔒 BLOQUEADO") ||
                                        booking.title?.includes("🌴 VACACIONES");
                                      const isHighlighted = highlightedBookingId === booking.id;
                                      const isDragging = draggedBooking?.id === booking.id;
                                      const isResizing = resizingBooking?.id === booking.id;
                                      const layout = overlapLayout[booking.id] || {
                                        left: "0%",
                                        width: "100%",
                                        zIndex: 1,
                                      };

                                      // Get services - compact display
                                      const servicesList = Array.isArray(booking.services)
                                        ? booking.services.map((s: any) => s.name || s).filter(Boolean)
                                        : [];
                                      const firstService = servicesList[0] || "Sin servicio";

                                      const bookingColor = isBlocked ? "#EF4444" : getStylistColor(booking.stylist);
                                      const isCompact = pos.height < 60;

                                      return (
                                        <div
                                          key={booking.id}
                                          data-booking-id={booking.id}
                                          draggable={!isBlocked && !isResizing}
                                          onDragStart={(e) => handleDragStart(e, booking)}
                                          onDragEnd={handleDragEnd}
                                          className={cn(
                                            "absolute rounded-lg overflow-hidden transition-all duration-150",
                                            "shadow-sm hover:shadow-lg hover:z-30",
                                            !isBlocked && "cursor-grab active:cursor-grabbing",
                                            isCompleted && "opacity-70",
                                            isHighlighted && "ring-2 ring-primary ring-offset-1 animate-pulse",
                                            isDragging && "opacity-50 scale-95",
                                            isResizing && "z-40 ring-2 ring-primary",
                                          )}
                                          style={{
                                            top: pos.top,
                                            height: pos.height,
                                            left: `calc(${layout.left} + 2px)`,
                                            width: `calc(${layout.width} - 4px)`,
                                            zIndex: layout.zIndex,
                                            backgroundColor: isBlocked ? "#FEE2E2" : `${bookingColor}15`,
                                            borderLeft: `3px solid ${bookingColor}`,
                                          }}
                                          onClick={() => {
                                            if (!isBlocked && !isResizing) {
                                              setSelectedBooking(booking);
                                              setIsEditDialogOpen(true);
                                            }
                                          }}
                                        >
                                          {/* Content - always visible, adaptive layout */}
                                          <div
                                            className={cn(
                                              "h-full flex flex-col px-2 py-1",
                                              isCompact ? "justify-center" : "justify-between",
                                            )}
                                          >
                                            {isCompact ? (
                                              // Ultra compact: single line with all info + actions
                                              <div className="flex items-center gap-1 min-w-0">
                                                {isCompleted && <Check className="h-3 w-3 text-green-600 shrink-0" />}
                                                <span className="font-semibold text-xs truncate text-foreground">
                                                  {booking.customer_name}
                                                </span>
                                                <span className="text-[10px] truncate" style={{ color: bookingColor }}>
                                                  · {firstService}
                                                </span>
                                                <div className="flex gap-0.5 ml-auto shrink-0">
                                                  {!isBlocked && (
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkCompleted(booking);
                                                      }}
                                                      className={cn(
                                                        "p-0.5 rounded transition-colors",
                                                        isCompleted
                                                          ? "bg-green-100 text-green-600"
                                                          : "text-muted-foreground hover:text-green-600",
                                                      )}
                                                      title={isCompleted ? "Desmarcar" : "Marcar completada"}
                                                    >
                                                      <Check className="h-3 w-3" />
                                                    </button>
                                                  )}
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleDeleteBooking(booking);
                                                    }}
                                                    className="p-0.5 rounded text-muted-foreground hover:text-red-600 transition-colors"
                                                    title={isBlocked ? "Eliminar bloqueo" : "Eliminar"}
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </button>
                                                </div>
                                              </div>
                                            ) : (
                                              // Normal/expanded layout
                                              <>
                                                <div className="min-w-0">
                                                  <div className="flex items-center gap-1">
                                                    {isCompleted && (
                                                      <Check className="h-3 w-3 text-green-600 shrink-0" />
                                                    )}
                                                    <p className="font-semibold text-sm truncate text-foreground leading-tight">
                                                      {booking.customer_name}
                                                    </p>
                                                    {!isBlocked && (
                                                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 ml-auto" />
                                                    )}
                                                  </div>
                                                  <p
                                                    className="text-xs font-medium truncate"
                                                    style={{ color: bookingColor }}
                                                  >
                                                    {isBlocked ? booking.title : firstService}
                                                    {servicesList.length > 1 && ` +${servicesList.length - 1}`}
                                                  </p>
                                                  {pos.height >= 80 && (
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                                      {booking.Hora.slice(0, 5)} - {booking.end_time?.slice(0, 5) || ""}{" "}
                                                      · {booking.total_duration}min
                                                    </p>
                                                  )}
                                                </div>

                                                {/* Actions - always visible */}
                                                <div className="flex gap-1 mt-1">
                                                  {!isBlocked && (
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkCompleted(booking);
                                                      }}
                                                      className={cn(
                                                        "p-1 rounded transition-colors",
                                                        isCompleted
                                                          ? "bg-green-100 text-green-600"
                                                          : "bg-muted/50 text-muted-foreground hover:bg-green-50 hover:text-green-600",
                                                      )}
                                                      title={isCompleted ? "Desmarcar" : "Marcar completada"}
                                                    >
                                                      <Check className="h-3 w-3" />
                                                    </button>
                                                  )}
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleDeleteBooking(booking);
                                                    }}
                                                    className="p-1 rounded bg-muted/50 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                                                    title={isBlocked ? "Eliminar bloqueo" : "Eliminar"}
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </button>
                                                </div>
                                              </>
                                            )}
                                          </div>

                                          {/* Resize handle */}
                                          {!isBlocked && (
                                            <div
                                              className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex items-center justify-center hover:bg-muted/50 group"
                                              onMouseDown={(e) => handleResizeStart(e, booking)}
                                            >
                                              <div className="w-8 h-1 rounded-full bg-muted-foreground/30 group-hover:bg-primary/50 transition-colors" />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                            ))}
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Cita</DialogTitle>
          </DialogHeader>
          <AdminBookingFlow
            onComplete={handleBookingComplete}
            onCancel={() => setIsCreateDialogOpen(false)}
            tenantId={tenantId}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cita</DialogTitle>
            <DialogDescription>
              {selectedBooking?.customer_name} - {selectedBooking?.Fecha} {selectedBooking?.Hora?.slice(0, 5)}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={selectedBooking.title || ""}
                  onChange={(e) => setSelectedBooking({ ...selectedBooking, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea
                  value={selectedBooking.notes?.replace("[✓ COMPLETADA] ", "") || ""}
                  onChange={(e) =>
                    setSelectedBooking({
                      ...selectedBooking,
                      notes: selectedBooking.notes?.includes("[✓ COMPLETADA]")
                        ? `[✓ COMPLETADA] ${e.target.value}`
                        : e.target.value,
                    })
                  }
                  rows={4}
                />
              </div>
              <div>
                <Label>Servicios</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Array.isArray(selectedBooking.services) &&
                    selectedBooking.services.map((s: any, i: number) => (
                      <Badge key={i} variant="secondary">
                        {s.name || s}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateBooking}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Period Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear Periodo</DialogTitle>
            <DialogDescription>Bloquea un periodo para vacaciones o horas específicas</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de bloqueo</Label>
              <RadioGroup value={blockPeriod} onValueChange={(v) => setBlockPeriod(v as any)} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hours" id="hours" />
                  <Label htmlFor="hours">Horas específicas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="day" id="day" />
                  <Label htmlFor="day">Día completo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="week" id="week" />
                  <Label htmlFor="week">Semana</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="month" id="month" />
                  <Label htmlFor="month">Mes</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Estilista</Label>
              <RadioGroup value={blockStylist} onValueChange={setBlockStylist} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all-stylists" />
                  <Label htmlFor="all-stylists">Todos</Label>
                </div>
                {stylists.map((s) => (
                  <div key={s.slug} className="flex items-center space-x-2">
                    <RadioGroupItem value={s.slug} id={s.slug} />
                    <Label htmlFor={s.slug}>{s.name}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label>Fecha inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start mt-1">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {blockStartDate ? format(blockStartDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={blockStartDate} onSelect={setBlockStartDate} weekStartsOn={1} />
                </PopoverContent>
              </Popover>
            </div>

            {blockPeriod === "hours" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hora inicio</Label>
                  <Input type="time" value={blockStartTime} onChange={(e) => setBlockStartTime(e.target.value)} />
                </div>
                <div>
                  <Label>Hora fin</Label>
                  <Input type="time" value={blockEndTime} onChange={(e) => setBlockEndTime(e.target.value)} />
                </div>
              </div>
            )}

            {(blockPeriod === "week" || blockPeriod === "month") && (
              <div>
                <Label>Fecha fin (opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start mt-1">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {blockEndDate ? format(blockEndDate, "PPP", { locale: es }) : "Fecha automática"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={blockEndDate} onSelect={setBlockEndDate} weekStartsOn={1} />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBlockPeriod} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Bloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completion Confirmation Dialog */}
      <AlertDialog open={completionDialogOpen} onOpenChange={setCompletionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar cita como completada?</AlertDialogTitle>
            <AlertDialogDescription>¿Deseas enviar un mensaje de valoración al cliente?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setCompletionDialogOpen(false);
                setPendingCompletionBooking(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <Button variant="outline" onClick={() => handleConfirmCompletion(false)}>
              Solo completar
            </Button>
            <AlertDialogAction onClick={() => handleConfirmCompletion(true)}>
              Completar y enviar mensaje
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Series Cancellation Dialog */}
      <AlertDialog open={seriesCancelDialogOpen} onOpenChange={setSeriesCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cita recurrente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta cita forma parte de una serie recurrente. ¿Qué deseas hacer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel
              onClick={() => {
                setSeriesCancelDialogOpen(false);
                setPendingCancelBooking(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => pendingCancelBooking && performBookingDeletion(pendingCancelBooking, false)}
            >
              Solo esta cita
            </Button>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => pendingCancelBooking && performBookingDeletion(pendingCancelBooking, true)}
            >
              Toda la serie futura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
