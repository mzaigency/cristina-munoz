import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Calendar as CalendarIcon, Ban, Search, X, Check, CheckCheck, GripVertical, Banknote, ShieldAlert, UserCircle, Sparkles, ChevronLeft, ChevronRight, Lock } from "lucide-react";
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
import { format, parseISO, addDays, startOfWeek, endOfWeek, isSameDay, addWeeks, addMonths, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AdminBookingFlow } from "./AdminBookingFlow";
import { QuickBookingSheet } from "./QuickBookingSheet";
import { useTenantBusinessHours } from "@/hooks/useTenantBusinessHours";

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
  skip_availability_check: boolean;
  reminder_sent: string | null;
}

interface LocalCalendarCRMProps {
  tenantId: string;
  stylists: Array<{ slug: string; name: string; color: string }>;
  onNavigateToCash?: () => void;
  onSelectClient?: (clientId: string) => void;
}

// Constante para escala visual - 2px por minuto = 120px por hora
const PIXELS_PER_MINUTE = 2;

export const LocalCalendarCRM = ({ tenantId, stylists, onNavigateToCash, onSelectClient }: LocalCalendarCRMProps) => {
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
  
  // Stylist filter
  const [selectedStylistFilter, setSelectedStylistFilter] = useState<string>("all");

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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteBooking, setPendingDeleteBooking] = useState<LocalBooking | null>(null);

  // Mobile action buttons state
  const [activeBookingActions, setActiveBookingActions] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Quick booking sheet (click on empty slot)
  const [quickBooking, setQuickBooking] = useState<{
    date: Date;
    time: string;
    stylistSlug: string;
  } | null>(null);

  // Client lookup state for edit dialog
  const [matchedClient, setMatchedClient] = useState<{ id: string; name: string; tags: string[]; total_visits: number; total_spent: number; last_visit_at: string | null; notes: string | null } | null>(null);
  const [clientLoading, setClientLoading] = useState(false);

  const { toast } = useToast();
  
  // Get tenant business hours
  const { businessHours, getBusinessHoursForDay, getClosedDays, getOverrideForDate } = useTenantBusinessHours(tenantId);

  // Lookup client when a booking is selected for editing
  useEffect(() => {
    if (!selectedBooking || !isEditDialogOpen) {
      setMatchedClient(null);
      return;
    }
    const lookup = async () => {
      setClientLoading(true);
      const name = selectedBooking.customer_name.trim().toLowerCase();
      const phone = selectedBooking.Telefono?.trim();

      let query = supabase
        .from("clients" as any)
        .select("id, name, tags, total_visits, total_spent, last_visit_at, notes")
        .eq("tenant_id", tenantId);

      // Try matching by phone first, then name
      const { data: byPhone } = phone
        ? await query.eq("phone", phone).limit(1)
        : { data: null };

      if (byPhone && byPhone.length > 0) {
        setMatchedClient(byPhone[0] as any);
      } else {
        const { data: byName } = await supabase
          .from("clients" as any)
          .select("id, name, tags, total_visits, total_spent, last_visit_at, notes")
          .eq("tenant_id", tenantId)
          .ilike("name", name)
          .limit(1);
        setMatchedClient(byName && byName.length > 0 ? (byName[0] as any) : null);
      }
      setClientLoading(false);
    };
    lookup();
  }, [selectedBooking?.id, isEditDialogOpen, tenantId]);

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [weekStart, tenantId]);

  const fetchBookings = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
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
      if (!silent) setLoading(false);
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
        .neq("compound_part", "part2")
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
    fetchBookings(true);
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
      fetchBookings(true);
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

    setPendingDeleteBooking(booking);
    setDeleteConfirmOpen(true);
  };

  const performBookingDeletion = async (booking: LocalBooking, cancelSeries: boolean) => {
    try {
      // Optimistic: remove from local state immediately to keep scroll stable
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));

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
      fetchBookings(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la cita",
        variant: "destructive",
      });
    } finally {
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

      // Para horas específicas: solo el día de inicio.
      // Para día/semana/mes/rango: iterar todos los días del intervalo.
      const datesToBlock =
        blockPeriod === "hours"
          ? [blockStartDate]
          : eachDayOfInterval({ start: blockStartDate, end: finalEndDate });

      // Agrupar el bloqueo para poder cancelarlo entero después
      const groupId = (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;

      const rows: any[] = [];
      for (const day of datesToBlock) {
        for (const stylist of stylistsToBlock) {
          rows.push({
            tenant_id: tenantId,
            customer_name: "BLOQUEADO",
            Telefono: "",
            Fecha: format(day, "yyyy-MM-dd"),
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
            recurrence_group_id: groupId,
          });
        }
      }

      const { error } = await supabase.from("bookings").insert(rows);
      if (error) throw error;

      toast({
        title: "Periodo bloqueado",
        description:
          blockPeriod === "hours"
            ? "Se han bloqueado las horas correctamente"
            : `Se han bloqueado ${datesToBlock.length} día${datesToBlock.length === 1 ? "" : "s"} correctamente`,
      });

      setIsBlockDialogOpen(false);
      setBlockStartDate(undefined);
      setBlockEndDate(undefined);
      setBlockPeriod("day");
      setBlockStylist("all");
      setBlockStartTime("09:00");
      setBlockEndTime("19:00");
      fetchBookings(true);
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

  const groupBookingsByDate = (bookingsList: LocalBooking[]) => {
    const grouped: Record<string, LocalBooking[]> = {};
    bookingsList.forEach((booking) => {
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
    const dayHours = getBusinessHoursForDay(dayOfWeek, dayDate);
    const override = getOverrideForDate(dayDate);

    if (dayHours.isClosed) {
      return { hours: [], startHour: 0, endHour: 0, breakStartMinutes: null, breakEndMinutes: null, isClosed: true, isSpecial: !!override };
    }

    // Calculate start and end hours from business hours
    let defaultStartHour = Math.floor(dayHours.morningStart / 60);
    let defaultEndHour =
      dayHours.afternoonEnd > 0
        ? Math.ceil(dayHours.afternoonEnd / 60)
        : Math.ceil(dayHours.morningEnd / 60);

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

    // Break times for this day - store in MINUTES for precise positioning
    const breakStartMinutes = dayHours.afternoonStart > 0 ? dayHours.morningEnd : null;
    const breakEndMinutes = dayHours.afternoonStart > 0 ? dayHours.afternoonStart : null;

    return { 
      hours, 
      startHour: actualStartHour, 
      endHour: actualEndHour, 
      breakStartMinutes, 
      breakEndMinutes, 
      isClosed: false,
      isSpecial: !!override,
      specialLabel: override ? `${dayHours.morningStart / 60 | 0}:${String(dayHours.morningStart % 60).padStart(2,'0')}–${Math.floor((dayHours.afternoonEnd || dayHours.morningEnd)/60)}:${String((dayHours.afternoonEnd || dayHours.morningEnd) % 60).padStart(2,'0')}` : null,
    };
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
    // Min visual height for legibility, but DO NOT use this for overlap detection
    const height = Math.max(durationMinutes * PIXELS_PER_MINUTE, 32);
    // visualEndMinutes kept for backwards compat but should not drive overlap grouping
    const visualEndMinutes = startMinutesFromStart + (height / PIXELS_PER_MINUTE);

    return { top, height, startMinutes: startMinutesFromStart, endMinutes: endMinutesFromStart, visualEndMinutes };
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

    // Find overlapping groups using REAL end times (not visual minHeight),
    // so a short 30min card doesn't falsely "overlap" with the next one
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

          // Compare with REAL end, not visual end
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
        column.forEach((booking) => {
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

      fetchBookings(true);
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
        fetchBookings(true);
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

  // Calculate today's summary
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const todayBookings = groupedBookings[todayKey] || [];
  const completedToday = todayBookings.filter(b => b.notes?.includes("[✓ COMPLETADA]")).length;
  const pendingToday = todayBookings.filter(b => !b.notes?.includes("[✓ COMPLETADA]") && !b.title?.includes("BLOQUEO") && !b.title?.includes("VACACIONES")).length;
  const nowHour = new Date().getHours();
  const nowMinutes = new Date().getMinutes();
  const nextBooking = todayBookings.find(b => {
    const [h, m] = b.Hora.split(":").map(Number);
    return (h > nowHour || (h === nowHour && m > nowMinutes)) && !b.notes?.includes("[✓ COMPLETADA]");
  });


  return (
    <div className="ag-root">

      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <button
            className="ag-ia-btn"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Sparkles style={{ width: 14, height: 14, color: "#4361ee" }} />
            Importar citas desde foto con IA
          </button>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="ag-btn ag-btn-ghost" onClick={() => setIsBlockDialogOpen(true)}>
            <Ban style={{ width: 16, height: 16 }} />
            <span className="ag-btn-tx">Bloquear</span>
          </button>
          <button
            className="ag-btn ag-btn-primary"
            onClick={() => setIsCreateDialogOpen(true)}
            data-tour-step="new-appointment"
          >
            <Plus style={{ width: 17, height: 17 }} />
            <span className="ag-btn-tx">Nueva cita</span>
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button className="ag-btn ag-btn-ghost" style={{ padding: "10px 13px" }}>
                <CalendarIcon style={{ width: 16, height: 16 }} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={weekStart} onSelect={handleJumpToDate} initialFocus weekStartsOn={1} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ── HERO DAY ─────────────────────────────────────────── */}
      {(() => {
        const activeKey = activeTab || format(weekDays.find(d => isSameDay(d, new Date())) || weekDays[0], "yyyy-MM-dd");
        const heroDay = weekDays.find(d => format(d, "yyyy-MM-dd") === activeKey) || weekDays[0];
        const heroDayBookings = groupedBookings[activeKey] || [];
        const heroSchedule = getScheduleForDay(heroDay);
        const heroCompleted = heroDayBookings.filter(b => b.notes?.includes("[✓ COMPLETADA]")).length;
        const heroPending = heroDayBookings.filter(b => !b.notes?.includes("[✓ COMPLETADA]") && !b.title?.includes("BLOQUEO") && !b.title?.includes("VACACIONES")).length;
        const heroTotal = heroCompleted + heroPending;
        const workMin = Math.max(1, stylists.length) * 660;
        const bookedMin = heroDayBookings.reduce((s, b) => s + (b.total_duration || 30), 0);
        const occPct = Math.min(1, bookedMin / workMin);
        const heroNext = heroDayBookings.find(b => {
          const [h, m] = b.Hora.split(":").map(Number);
          return (h > nowHour || (h === nowHour && m > nowMinutes)) && !b.notes?.includes("[✓ COMPLETADA]");
        });
        const R = 41, SW = 10, SIZE = 92;
        const circ = 2 * Math.PI * R;
        const offset = circ * (1 - occPct);
        return (
          <div className="gh">
            <div className="gh-glow" style={{ background: "radial-gradient(120% 140% at 88% -10%, color-mix(in oklab, #4361ee, transparent 78%), transparent 60%)" }} />
            <div className="gh-date">
              <span className="gh-weekday">{format(heroDay, "EEEE", { locale: es }).toUpperCase()}</span>
              <span className="gh-num">{format(heroDay, "d")}</span>
              <span className="gh-month">{format(heroDay, "MMMM yyyy", { locale: es })}</span>
            </div>
            {heroSchedule.isClosed ? (
              <div className="gh-closed">
                <Lock style={{ width: 20, height: 20 }} /> Salón cerrado
              </div>
            ) : (
              <>
                <div className="gh-ringwrap">
                  <div style={{ position: "relative", width: SIZE, height: SIZE, flexShrink: 0 }}>
                    <svg width={SIZE} height={SIZE}>
                      <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="oklch(0.93 0.01 265)" strokeWidth={SW} />
                      <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#4361ee" strokeWidth={SW}
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                        style={{ transition: "stroke-dashoffset .6s cubic-bezier(.3,.9,.3,1)" }}
                      />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span className="gh-ring-num">{heroTotal}</span>
                      <span className="gh-ring-lbl">citas</span>
                    </div>
                  </div>
                  <div className="gh-occ">
                    <span className="gh-occ-pct" style={{ color: "#4361ee" }}>{Math.round(occPct * 100)}%</span>
                    <span className="gh-occ-lbl">ocupación</span>
                  </div>
                </div>
                <div className="gh-stats">
                  <div className="gh-stat">
                    <span className="gh-stat-num">{heroCompleted}</span>
                    <span className="gh-stat-lbl"><span className="gh-stat-dot gh-dot-done" />completadas</span>
                  </div>
                  <div className="gh-stat">
                    <span className="gh-stat-num">{heroPending}</span>
                    <span className="gh-stat-lbl"><span className="gh-stat-dot" style={{ background: "#4361ee" }} />pendientes</span>
                  </div>
                </div>
                <div className="gh-next">
                  <span className="gh-next-lbl">Próxima cita</span>
                  {heroNext ? (
                    <>
                      <span className="gh-next-time" style={{ color: "#4361ee" }}>{heroNext.Hora.slice(0, 5)}</span>
                      <span className="gh-next-client">{heroNext.customer_name}</span>
                      <span className="gh-next-svc">
                        {Array.isArray(heroNext.services) ? (heroNext.services.map((s: any) => s.name || s).filter(Boolean)[0] || "Cita") : "Cita"}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: "oklch(0.62 0.015 265)", fontWeight: 600 }}>Sin más citas hoy</span>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ── WEEK SELECTOR ─────────────────────────────────────── */}
      <div className="wk">
        <div className="wk-top">
          <span className="wk-month">{format(weekStart, "MMMM yyyy", { locale: es })}</span>
          <button
            className="wk-today"
            style={{ color: "#4361ee" }}
            onClick={() => {
              setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
              setActiveTab(format(new Date(), "yyyy-MM-dd"));
            }}
          >
            <span className="wk-today-dot" style={{ background: "#4361ee" }} />
            Volver a hoy
          </button>
        </div>
        <div className="wk-row">
          <button className="wk-arrow" onClick={() => setWeekStart(addDays(weekStart, -7))} disabled={loading}>
            <ChevronLeft style={{ width: 20, height: 20 }} />
          </button>
          <div className="wk-days">
            {weekDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayBkgs = groupedBookings[dateKey] || [];
              const resolvedActiveKey = activeTab || format(weekDays.find(d => isSameDay(d, new Date())) || weekDays[0], "yyyy-MM-dd");
              const isOn = resolvedActiveKey === dateKey;
              const isToday = isSameDay(day, new Date());
              const schedule = getScheduleForDay(day);
              const isClosed = schedule.isClosed;
              const maxCount = Math.max(...weekDays.map(d => (groupedBookings[format(d, "yyyy-MM-dd")] || []).length), 1);
              const pct = dayBkgs.length / maxCount;
              return (
                <button
                  key={dateKey}
                  className={`wk-day${isOn ? " wk-on" : ""}${isClosed ? " wk-closed" : ""}`}
                  onClick={() => !isClosed && setActiveTab(dateKey)}
                  disabled={isClosed || loading}
                  style={isOn ? { background: "linear-gradient(160deg, #4361ee, #2b3fd4)", color: "#fff", borderColor: "transparent", boxShadow: "0 12px 28px -10px rgba(67,97,238,.45)", transform: "translateY(-2px)" } : undefined}
                >
                  <span className="wk-name">{format(day, "EEE", { locale: es }).toUpperCase()}</span>
                  <span className="wk-num">{format(day, "d")}</span>
                  {isToday && !isOn && <span className="wk-today-pip" style={{ background: "#4361ee" }} />}
                  {isClosed ? (
                    <span className="wk-closed-tag"><Ban style={{ width: 11, height: 11 }} /></span>
                  ) : (
                    <span className="wk-foot">
                      <span className="wk-bar">
                        <span className="wk-bar-fill" style={{ width: `${20 + pct * 80}%`, background: isOn ? "rgba(255,255,255,.9)" : "#4361ee" }} />
                      </span>
                      <span className="wk-count">{dayBkgs.length}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button className="wk-arrow" onClick={() => setWeekStart(addDays(weekStart, 7))} disabled={loading}>
            <ChevronRight style={{ width: 20, height: 20 }} />
          </button>
        </div>
      </div>

      {/* ── PROFESSIONAL TABS ─────────────────────────────────── */}
      {stylists.length > 1 && (
        <div className="ag-proftabs">
          {(() => {
            const activeKey = activeTab || format(weekDays.find(d => isSameDay(d, new Date())) || weekDays[0], "yyyy-MM-dd");
            const allCount = (groupedBookings[activeKey] || []).length;
            const isAllOn = selectedStylistFilter === "all";
            return (
              <button
                className={`ag-proftab${isAllOn ? " ag-proftab-on" : ""}`}
                onClick={() => setSelectedStylistFilter("all")}
                style={isAllOn ? { borderColor: "#4361ee", background: "#4361ee15", color: "#4361ee" } : undefined}
              >
                <span className="ag-proftab-dot" style={{ background: "#4361ee" }} />
                Todos
                <span className="ag-proftab-count" style={isAllOn ? { color: "#4361ee" } : undefined}>{allCount}</span>
              </button>
            );
          })()}
          {stylists.map(stylist => {
            const activeKey = activeTab || format(weekDays.find(d => isSameDay(d, new Date())) || weekDays[0], "yyyy-MM-dd");
            const count = (groupedBookings[activeKey] || []).filter(b => b.stylist === stylist.slug).length;
            const isOn = selectedStylistFilter === stylist.slug;
            return (
              <button
                key={stylist.slug}
                className={`ag-proftab${isOn ? " ag-proftab-on" : ""}`}
                onClick={() => setSelectedStylistFilter(stylist.slug)}
                style={isOn ? { borderColor: stylist.color, background: `${stylist.color}15`, color: stylist.color } : undefined}
              >
                <span className="ag-proftab-dot" style={{ background: stylist.color }} />
                {stylist.name}
                <span className="ag-proftab-count" style={isOn ? { color: stylist.color } : undefined}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── SEARCH ───────────────────────────────────────────── */}
      <div className="ag-search">
        <span className="ag-search-ic"><Search style={{ width: 17, height: 17 }} /></span>
        <input
          className="ag-search-in"
          placeholder="Buscar por nombre o teléfono…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
        />
        {isSearching && <Loader2 style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16 }} className="animate-spin" />}
        {searchQuery && !isSearching && (
          <button className="ag-search-clear" onClick={clearSearch}><X style={{ width: 14, height: 14 }} /></button>
        )}
      </div>

      {showSearchResults && searchResults.length > 0 && (
        <div style={{ border: "1px solid oklch(0.925 0.007 265)", borderRadius: 14, overflow: "hidden", maxHeight: 280, overflowY: "auto", background: "#fff", boxShadow: "0 10px 30px -16px rgba(20,22,40,.18)" }}>
          {searchResults.map(result => {
            const svcs = Array.isArray(result.services) ? result.services.map((s: any) => s.name || s).filter(Boolean) : [];
            return (
              <button key={result.id} onClick={() => handleSelectSearchResult(result)}
                style={{ width: "100%", textAlign: "left", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottom: "1px solid oklch(0.955 0.004 265)" }}
                className="hover:bg-gray-50 transition-colors"
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{result.customer_name}</p>
                  <p style={{ fontSize: 12, color: "oklch(0.62 0.015 265)" }}>{svcs[0]} · {result.Telefono}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#4361ee" }}>{result.Hora.slice(0, 5)}</p>
                  <p style={{ fontSize: 12, color: "oklch(0.62 0.015 265)" }}>{format(parseISO(result.Fecha), "d MMM", { locale: es })}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── CALENDAR GRID ─────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px 0" }}>
          <Loader2 style={{ width: 32, height: 32, color: "#4361ee" }} className="animate-spin" />
        </div>
      ) : (() => {
        const activeKey = activeTab || format(weekDays.find(d => isSameDay(d, new Date())) || weekDays[0], "yyyy-MM-dd");
        const activeDay = weekDays.find(d => format(d, "yyyy-MM-dd") === activeKey) || weekDays[0];
        const schedule = getScheduleForDay(activeDay);
        const isToday = isSameDay(activeDay, new Date());
        const dayBkgs = groupedBookings[activeKey] || [];
        const filteredStylists = stylists.filter(s => selectedStylistFilter === "all" || s.slug === selectedStylistFilter);

        if (schedule.isClosed) {
          return (
            <div className="ag-empty">
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
              <p style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>Salón cerrado</p>
              <p style={{ color: "oklch(0.62 0.015 265)", fontSize: 14 }}>{format(activeDay, "EEEE d MMMM", { locale: es })}</p>
            </div>
          );
        }

        if (filteredStylists.length === 0) {
          return (
            <div className="ag-empty">
              <p style={{ fontWeight: 700, fontSize: 15 }}>Sin estilistas activos</p>
            </div>
          );
        }

        const PPM = PIXELS_PER_MINUTE;
        const TOP_PAD = 12;
        const GUTTER = 58;
        const totalH = (schedule.endHour - schedule.startHour) * 60 * PPM + TOP_PAD * 2;

        const nowH = currentTime.getHours();
        const nowM = currentTime.getMinutes();
        const nowTopPx = (isToday && nowH >= schedule.startHour && nowH < schedule.endHour)
          ? (nowH - schedule.startHour) * 60 * PPM + nowM * PPM + TOP_PAD
          : null;

        const breakTopPx = schedule.breakStartMinutes !== null
          ? (schedule.breakStartMinutes - schedule.startHour * 60) * PPM + TOP_PAD
          : null;
        const breakH = (schedule.breakStartMinutes !== null && schedule.breakEndMinutes !== null)
          ? (schedule.breakEndMinutes - schedule.breakStartMinutes) * PPM
          : 0;

        const bookingsByStylist: Record<string, LocalBooking[]> = {};
        filteredStylists.forEach(s => {
          bookingsByStylist[s.slug] = dayBkgs.filter(b => b.stylist === s.slug);
        });

        if (schedule.isSpecial) {
          // Show special hours banner inline
        }

        return (
          <>
            {schedule.isSpecial && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 14, border: "1px solid rgba(245,158,11,.35)", background: "linear-gradient(to right, #fffbeb, #fef3c7)", padding: "10px 14px", marginBottom: 12 }}>
                <Sparkles style={{ width: 16, height: 16, color: "#d97706", flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>Horario especial</p>
                  <p style={{ fontSize: 11, color: "#b45309" }}>{schedule.isClosed ? "Cerrado por horario especial" : schedule.specialLabel}</p>
                </div>
              </div>
            )}

            <div className="ag-gridcard">
              <div className="ag-scroller" style={{ maxHeight: "66vh" }}>
                <div className="ag-grid" style={{ minWidth: "100%" }}>

                  {/* ── Sticky column headers ── */}
                  <div className="ag-head" style={{
                    display: "grid",
                    gridTemplateColumns: `${GUTTER}px repeat(${filteredStylists.length}, minmax(160px, 1fr))`,
                  }}>
                    <div className="ag-corner">HORA</div>
                    {filteredStylists.map(stylist => {
                      const sBkgs = bookingsByStylist[stylist.slug] || [];
                      const bookedMin2 = sBkgs.reduce((s, b) => s + (b.total_duration || 30), 0);
                      const workMin2 = Math.max(1, (schedule.endHour - schedule.startHour) * 60);
                      const util = Math.min(1, bookedMin2 / workMin2);
                      return (
                        <div key={stylist.slug} className="ag-colhead" style={{ background: `${stylist.color}12` }}>
                          <span className="ag-colhead-accent" style={{ background: stylist.color }} />
                          <span className="ag-colhead-av" style={{ background: `linear-gradient(140deg, ${stylist.color}, ${stylist.color}bb)` }}>
                            {stylist.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="ag-colhead-main">
                            <span className="ag-colhead-name" style={{ color: stylist.color }}>{stylist.name}</span>
                            <span className="ag-colhead-bar">
                              <span className="ag-colhead-fill" style={{ width: `${util * 100}%`, background: stylist.color }} />
                            </span>
                          </span>
                          <span className="ag-colhead-count" style={{ color: stylist.color, background: `${stylist.color}18` }}>
                            {sBkgs.length}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Body ── */}
                  <div className="ag-bodyrow" style={{
                    display: "grid",
                    gridTemplateColumns: `${GUTTER}px 1fr`,
                  }}>
                    {/* Hour gutter */}
                    <div className="ag-gutter" style={{ height: totalH, position: "sticky", left: 0, zIndex: 3, background: "#fff", borderRight: "1px solid oklch(0.925 0.007 265)" }}>
                      {Array.from({ length: schedule.endHour - schedule.startHour + 1 }, (_, i) => {
                        const h = schedule.startHour + i;
                        return (
                          <div key={h} className="ag-hour" style={{ top: i * 60 * PPM + TOP_PAD }}>
                            {String(h).padStart(2, "0")}:00
                          </div>
                        );
                      })}
                      {nowTopPx !== null && (
                        <div className="ag-now-bubble" style={{ top: nowTopPx }}>
                          {String(nowH).padStart(2, "0")}:{String(nowM).padStart(2, "0")}
                        </div>
                      )}
                    </div>

                    {/* Stylist columns area */}
                    <div style={{ position: "relative", display: "flex", height: totalH }}>
                      {filteredStylists.map((stylist, colIdx) => {
                        const sBkgs = bookingsByStylist[stylist.slug] || [];
                        const overlapLayout = calculateOverlapLayout(sBkgs, activeDay);
                        const isLast = colIdx === filteredStylists.length - 1;

                        return (
                          <div
                            key={stylist.slug}
                            className={`ag-col${isLast ? " ag-col-last" : ""}`}
                            style={{ flex: "1 1 0", minWidth: 160, height: totalH, position: "relative" }}
                            onDragOver={e => handleDragOverColumn(e, stylist.slug, schedule.startHour)}
                            onDragLeave={handleDragLeave}
                            onDrop={e => handleDropOnColumn(e, stylist.slug, schedule.startHour, activeKey)}
                          >
                            {/* Half-hour lines */}
                            {Array.from({ length: (schedule.endHour - schedule.startHour) * 2 + 1 }, (_, i) => {
                              const isHour = i % 2 === 0;
                              return (
                                <div key={i} style={{
                                  position: "absolute", left: 0, right: 0,
                                  top: i * 30 * PPM + TOP_PAD,
                                  borderTop: `1px solid ${isHour ? "oklch(0.925 0.007 265)" : "oklch(0.955 0.004 265)"}`,
                                  pointerEvents: "none",
                                }} />
                              );
                            })}

                            {/* Clickable time slots */}
                            {schedule.hours.map(hour => {
                              const openQuick = (mm: 0 | 30) => {
                                if (hour >= schedule.endHour) return;
                                const timeStr = `${String(hour).padStart(2, "0")}:${mm === 0 ? "00" : "30"}`;
                                setQuickBooking({ date: activeDay, time: timeStr, stylistSlug: stylist.slug });
                              };
                              const slotTop = (hour - schedule.startHour) * 60 * PPM + TOP_PAD;
                              return (
                                <div key={hour} style={{ position: "absolute", left: 0, right: 0, top: slotTop, height: 60 * PPM }}>
                                  <div style={{ position: "absolute", inset: "0 0 50% 0", cursor: "pointer" }}
                                    onClick={e => { if (!(e.target as HTMLElement).closest("[data-booking-id]")) openQuick(0); }} />
                                  <div style={{ position: "absolute", inset: "50% 0 0 0", cursor: "pointer", borderTop: "1px dashed oklch(0.955 0.004 265)" }}
                                    onClick={e => { if (!(e.target as HTMLElement).closest("[data-booking-id]")) openQuick(30); }} />
                                </div>
                              );
                            })}

                            {/* Break zone */}
                            {breakTopPx !== null && (
                              <div style={{
                                position: "absolute", left: 0, right: 0,
                                top: breakTopPx, height: breakH,
                                background: "repeating-linear-gradient(135deg, oklch(0.965 0.03 72) 0 11px, oklch(0.945 0.045 72) 11px 22px)",
                                pointerEvents: "none", zIndex: 0,
                              }} />
                            )}

                            {/* Drag drop indicator */}
                            {dragOverStylist === stylist.slug && dragOverTime && (() => {
                              const [dh, dm] = dragOverTime.split(":").map(Number);
                              const minFromStart = (dh - schedule.startHour) * 60 + dm;
                              const topDrag = minFromStart * PPM + TOP_PAD;
                              const hDrag = (draggedBooking?.total_duration || 30) * PPM;
                              return (
                                <div style={{
                                  position: "absolute", left: 2, right: 2,
                                  top: Math.max(0, topDrag), height: hDrag,
                                  borderRadius: 10, background: "#4361ee20",
                                  border: "2px dashed #4361ee80",
                                  pointerEvents: "none", zIndex: 40,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "#4361ee", background: "white", padding: "2px 8px", borderRadius: 6 }}>{dragOverTime}</span>
                                </div>
                              );
                            })()}

                            {/* Appointment cards */}
                            {sBkgs.map(booking => {
                              const pos = calculateBookingPosition(booking, activeDay);
                              const layout = overlapLayout[booking.id] || { left: "0%", width: "100%", zIndex: 1 };
                              const isCompleted = booking.notes?.includes("[✓ COMPLETADA]");
                              const isBlocked = booking.title?.includes("🔒 BLOQUEADO") || booking.title?.includes("🌴 VACACIONES");
                              const isHighlighted = highlightedBookingId === booking.id;
                              const isDragging = draggedBooking?.id === booking.id;
                              const isResizing2 = resizingBooking?.id === booking.id;
                              const bColor = isBlocked ? "#EF4444" : getStylistColor(booking.stylist);
                              const svcs2 = Array.isArray(booking.services) ? booking.services.map((s: any) => s.name || s).filter(Boolean) : [];
                              const firstSvc = svcs2[0] || "";
                              const startT = booking.Hora.slice(0, 5);
                              const endT = booking.end_time?.slice(0, 5) || "";
                              const bH = pos.height;
                              const isOneLine = bH < 46;
                              const isFull = bH >= 64;

                              return (
                                <div
                                  key={booking.id}
                                  data-booking-id={booking.id}
                                  draggable={!isBlocked && !isResizing2}
                                  onDragStart={e => handleDragStart(e, booking)}
                                  onDragEnd={handleDragEnd}
                                  className="group/card"
                                  style={{
                                    position: "absolute",
                                    top: pos.top + TOP_PAD,
                                    height: bH - 3,
                                    left: `calc(${layout.left} + 2px)`,
                                    width: `calc(${layout.width} - 4px)`,
                                    zIndex: isHighlighted ? 20 : layout.zIndex,
                                    borderRadius: 13,
                                    border: `1px solid ${isCompleted ? "transparent" : `${bColor}40`}`,
                                    background: isCompleted
                                      ? "oklch(0.975 0.004 260)"
                                      : isBlocked
                                        ? "#EF444410"
                                        : `linear-gradient(160deg, ${bColor}25, ${bColor}15)`,
                                    overflow: "hidden",
                                    cursor: isBlocked ? "default" : "grab",
                                    opacity: isDragging ? 0.4 : isCompleted ? 0.72 : 1,
                                    boxShadow: isHighlighted
                                      ? `0 0 0 2px #4361ee, 0 4px 12px -4px ${bColor}60`
                                      : `0 1px 2px rgba(20,22,40,.05)`,
                                    transition: "transform .13s, box-shadow .13s",
                                    outline: isResizing2 ? `2px solid #4361ee` : undefined,
                                  }}
                                  onClick={e => {
                                    if (!isBlocked && !isResizing2) {
                                      if (isMobile) {
                                        e.stopPropagation();
                                        if (activeBookingActions === booking.id) {
                                          setActiveBookingActions(null);
                                          setSelectedBooking(booking);
                                          setIsEditDialogOpen(true);
                                        } else {
                                          setActiveBookingActions(booking.id);
                                        }
                                      } else {
                                        setSelectedBooking(booking);
                                        setIsEditDialogOpen(true);
                                      }
                                    }
                                  }}
                                >
                                  {/* Left color bar */}
                                  <div style={{
                                    position: "absolute", left: 0, top: 0, bottom: 0, width: 5,
                                    background: `linear-gradient(180deg, ${bColor}, ${bColor}cc)`,
                                    borderRadius: "0 4px 4px 0",
                                  }} />

                                  {/* Content */}
                                  <div style={{
                                    paddingLeft: 14, paddingRight: 10,
                                    height: "100%",
                                    display: "flex", flexDirection: "column", gap: 2,
                                    ...(isOneLine
                                      ? { justifyContent: "center" }
                                      : { paddingTop: 6, paddingBottom: 6 }),
                                  }}>
                                    {isOneLine ? (
                                      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                                        <span style={{ fontSize: 11, fontWeight: 800, color: isCompleted ? "oklch(0.62 0.015 265)" : bColor, flexShrink: 0 }}>{startT}</span>
                                        {isCompleted && <Check style={{ width: 10, height: 10, color: "oklch(0.62 0.15 150)", flexShrink: 0 }} />}
                                        <span style={{ fontSize: 12.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, textDecoration: isCompleted ? "line-through" : "none" }}>
                                          {booking.customer_name}
                                        </span>
                                      </div>
                                    ) : (
                                      <>
                                        <span style={{ fontSize: 11, fontWeight: 800, color: isCompleted ? "oklch(0.62 0.015 265)" : bColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                          {startT}<span style={{ opacity: .55 }}>–</span>{endT}
                                          {isFull && <span style={{ color: "oklch(0.62 0.015 265)", fontWeight: 700 }}> · {booking.total_duration}min</span>}
                                        </span>
                                        <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: isCompleted ? "line-through" : "none" }}>
                                          {isCompleted && <span style={{ color: "oklch(0.62 0.15 150)", marginRight: 4 }}>✓</span>}
                                          {booking.customer_name}
                                        </span>
                                        {isFull && (
                                          <span style={{ fontSize: 12, fontWeight: 600, color: "oklch(0.45 0.02 265)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {isBlocked ? booking.title : firstSvc}
                                            {svcs2.length > 1 && <span style={{ opacity: .6 }}> +{svcs2.length - 1}</span>}
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </div>

                                  {/* Action buttons (hover on desktop, tap on mobile) */}
                                  {!isBlocked && (!isMobile || activeBookingActions === booking.id) && (
                                    <div className={cn(
                                      "absolute top-0.5 right-0.5 flex items-center gap-0.5 z-20 transition-opacity",
                                      isMobile ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"
                                    )}>
                                      <button
                                        onClick={e => { e.stopPropagation(); handleMarkCompleted(booking); if (isMobile) setActiveBookingActions(null); }}
                                        className={cn("p-1 rounded-md transition-all", isCompleted ? "bg-green-500 text-white" : "bg-foreground/10 text-foreground/60 hover:bg-green-500 hover:text-white")}
                                        title={isCompleted ? "Desmarcar" : "Completar"}
                                      ><Check style={{ width: 12, height: 12 }} /></button>
                                      {!isCompleted && onNavigateToCash && (
                                        <button
                                          onClick={e => {
                                            e.stopPropagation();
                                            sessionStorage.setItem("pendingChargeBooking", JSON.stringify({ id: booking.id, customer_name: booking.customer_name, stylist: booking.stylist, services: booking.services, fecha: booking.Fecha, hora: booking.Hora }));
                                            if (isMobile) setActiveBookingActions(null);
                                            onNavigateToCash();
                                          }}
                                          className="p-1 rounded-md bg-foreground/10 text-foreground/60 hover:bg-emerald-500 hover:text-white transition-all"
                                          title="Cobrar"
                                        ><Banknote style={{ width: 12, height: 12 }} /></button>
                                      )}
                                      <button
                                        onClick={e => { e.stopPropagation(); if (isMobile) setActiveBookingActions(null); handleDeleteBooking(booking); }}
                                        className="p-1 rounded-md bg-foreground/10 text-foreground/60 hover:bg-red-500 hover:text-white transition-all"
                                        title="Eliminar"
                                      ><Trash2 style={{ width: 12, height: 12 }} /></button>
                                    </div>
                                  )}

                                  {/* Unblock button */}
                                  {isBlocked && (
                                    <div className="absolute top-0.5 right-0.5 z-20">
                                      <button
                                        onClick={e => { e.stopPropagation(); handleDeleteBooking(booking); }}
                                        className="p-1 rounded-md bg-white/20 text-white hover:bg-white hover:text-red-600 transition-all"
                                        title="Desbloquear"
                                      ><Trash2 style={{ width: 12, height: 12 }} /></button>
                                    </div>
                                  )}

                                  {/* Resize handle */}
                                  {!isBlocked && (
                                    <div
                                      className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity z-10"
                                      onMouseDown={e => handleResizeStart(e, booking)}
                                    >
                                      <div className="w-8 h-0.5 rounded-full bg-foreground/20" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}

                      {/* Break label centered across all columns */}
                      {breakTopPx !== null && breakH > 0 && (
                        <div style={{
                          position: "absolute", left: 0, right: 0,
                          top: breakTopPx + breakH / 2,
                          display: "flex", justifyContent: "center",
                          transform: "translateY(-50%)",
                          pointerEvents: "none", zIndex: 2,
                        }}>
                          <span className="ag-break-pill">Descanso</span>
                        </div>
                      )}

                      {/* Current time red line */}
                      {nowTopPx !== null && (
                        <div style={{
                          position: "absolute", left: 0, right: 0,
                          top: nowTopPx,
                          borderTop: "2px solid #ef4444",
                          zIndex: 5, pointerEvents: "none",
                          boxShadow: "0 0 14px 1px rgba(239,68,68,.45)",
                        }}>
                          <span style={{ position: "absolute", left: -4, top: -4, width: 9, height: 9, borderRadius: "50%", background: "#ef4444", display: "block", boxShadow: "0 0 0 4px rgba(239,68,68,.25)" }} />
                          <span style={{ position: "absolute", left: 8, top: -9, background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: ".08em", borderRadius: 5, padding: "2px 6px" }}>AHORA</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-4xl max-h-[92vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Nueva Cita</DialogTitle>
          </DialogHeader>
          <AdminBookingFlow
            onComplete={handleBookingComplete}
            onCancel={() => setIsCreateDialogOpen(false)}
            tenantId={tenantId}
          />
        </DialogContent>
      </Dialog>

      {/* Quick Booking Sheet - opens on click on empty calendar slot */}
      {quickBooking && (
        <QuickBookingSheet
          open={!!quickBooking}
          onOpenChange={(open) => !open && setQuickBooking(null)}
          tenantId={tenantId}
          initialDate={quickBooking.date}
          initialTime={quickBooking.time}
          initialStylistSlug={quickBooking.stylistSlug}
          stylists={stylists}
          onCreated={() => {
            setQuickBooking(null);
            fetchBookings(true);
          }}
          onMoreOptions={() => {
            setQuickBooking(null);
            setIsCreateDialogOpen(true);
          }}
        />
      )}

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

              {/* Client Info Panel */}
              <div className="rounded-lg border border-border/60 p-3 space-y-2 bg-muted/30">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ficha de cliente</Label>
                {clientLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Buscando...
                  </div>
                ) : matchedClient ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{matchedClient.name}</span>
                      {matchedClient.tags?.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>Visitas: <span className="font-medium text-foreground">{matchedClient.total_visits || 0}</span></div>
                      <div>Gasto: <span className="font-medium text-foreground">{(matchedClient.total_spent || 0).toFixed(2)}€</span></div>
                    </div>
                    {matchedClient.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{matchedClient.notes}</p>
                    )}
                    {onSelectClient && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          setIsEditDialogOpen(false);
                          onSelectClient(matchedClient.id);
                        }}
                      >
                        <UserCircle className="h-3 w-3 mr-1" /> Ver ficha completa
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No se encontró un cliente registrado con este nombre</p>
                )}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta cita?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteBooking
                ? `Se eliminará la cita de ${pendingDeleteBooking.customer_name} (${pendingDeleteBooking.Hora?.slice(0, 5)}). Esta acción no se puede deshacer.`
                : "Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteConfirmOpen(false);
                setPendingDeleteBooking(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                const b = pendingDeleteBooking;
                setDeleteConfirmOpen(false);
                setPendingDeleteBooking(null);
                if (b) await performBookingDeletion(b, false);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
