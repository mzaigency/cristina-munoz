import { useState, useEffect, useRef, useCallback } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { busyMinutes, toMinutesOfDay } from "@/lib/agendaOccupancy";
import { STYLIST_FALLBACK } from "@/lib/chartColors";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { AgendaDayTimeline, type StylistAbsenceInfo } from "./AgendaDayTimeline";
import { AgendaWeekBoard, type WeekBooking, type WeekDay } from "./AgendaWeekBoard";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import {
  Loader2,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Ban,
  Search,
  X,
  Check,
  CheckCheck,
  GripVertical,
  Banknote,
  ShieldAlert,
  UserCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Lock,
  Phone,
  MessageCircle,
  Pencil,
  Wallet,
  Clock,
  CalendarOff,
} from "lucide-react";
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
  eachDayOfInterval,
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AdminBookingFlow } from "./AdminBookingFlow";
import { QuickBookingSheet } from "./QuickBookingSheet";
import { useTenantBusinessHours } from "@/hooks/useTenantBusinessHours";
import { fetchBookingGroup, shiftBookingGroup, validateShiftedBookingGroup } from "@/lib/bookingGroup";

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
  canal: string | null;
}

interface LocalCalendarCRMProps {
  tenantId: string;
  stylists: Array<{ id?: string; slug: string; name: string; color: string }>;
  onNavigateToCash?: () => void;
  onSelectClient?: (clientId: string) => void;
  /** Contenido opcional alineado a la izquierda de la fila de acciones (p. ej. botón de importar) */
  topLeftSlot?: React.ReactNode;
  /** "dia" = timeline de un día; "semana" = tablero de 7 columnas */
  view?: "dia" | "semana";
}

// Constante para escala visual - 2px por minuto = 120px por hora
const PIXELS_PER_MINUTE = 2;

const BLOCK_PERIODS = [
  { value: "hours", label: "Horas" },
  { value: "day", label: "Día" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
] as const;

export const LocalCalendarCRM = ({ tenantId, stylists, onNavigateToCash, onSelectClient, topLeftSlot, view = "dia" }: LocalCalendarCRMProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [bookings, setBookings] = useState<LocalBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<LocalBooking | null>(null);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<string>("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [weekCalendarOpen, setWeekCalendarOpen] = useState(false);
  /** El buscador se pliega tras el icono: se usa a ratos, no cada día. */
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);
  const [stylistAbsences, setStylistAbsences] = useState<StylistAbsenceInfo[]>([]);

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

  // Quitar bloqueo (día completo o franja de horas)
  const [unblockTarget, setUnblockTarget] = useState<LocalBooking | null>(null);
  /** cuántos bloqueos quedan del mismo grupo (de hoy en adelante) */
  const [unblockGroupCount, setUnblockGroupCount] = useState(1);
  const [unblocking, setUnblocking] = useState(false);

  // Series cancellation dialog
  const [seriesCancelDialogOpen, setSeriesCancelDialogOpen] = useState(false);
  const [pendingCancelBooking, setPendingCancelBooking] = useState<LocalBooking | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteBooking, setPendingDeleteBooking] = useState<LocalBooking | null>(null);

  // Mobile action buttons state
  const [activeBookingActions, setActiveBookingActions] = useState<string | null>(null);

  // Booking detail sheet
  const [detailBooking, setDetailBooking] = useState<LocalBooking | null>(null);

  // Quick payment sheet
  const [paySheetBooking, setPaySheetBooking] = useState<LocalBooking | null>(null);
  const [payMethod, setPayMethod] = useState<"cash" | "card">("cash");
  const [paying, setPaying] = useState(false);
  const [customTotal, setCustomTotal] = useState<string>("");
  const [editingTotal, setEditingTotal] = useState(false);
  const isMobile = useIsMobile();

  // Quick booking sheet (click on empty slot)
  const [quickBooking, setQuickBooking] = useState<{
    date: Date;
    time: string;
    stylistSlug: string;
  } | null>(null);

  // Client lookup state for edit dialog
  const [matchedClient, setMatchedClient] = useState<{
    id: string;
    name: string;
    tags: string[];
    total_visits: number;
    total_spent: number;
    last_visit_at: string | null;
    notes: string | null;
  } | null>(null);
  const [clientLoading, setClientLoading] = useState(false);

  const { toast } = useToast();

  // Get tenant business hours
  const { businessHours, getBusinessHoursForDay, getClosedDays, getOverrideForDate } = useTenantBusinessHours(tenantId);

  const isBlockedBooking = (b: LocalBooking) =>
    b.title === "Bloqueado" ||
    b.customer_name === "Bloqueado" ||
    b.customer_name === "BLOQUEADO" ||
    !!b.title?.includes("BLOQUEADO") ||
    !!b.title?.includes("VACACIONES");

  const isFullDayBlocked = (b: LocalBooking) => {
    if (!isBlockedBooking(b)) return false;
    const h = (b.Hora || "").slice(0, 5);
    const e = (b.end_time || "").slice(0, 5);
    return h === "00:00" && (e === "23:59" || e === "24:00" || e === "00:00");
  };

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

      const query = supabase
        .from("clients" as any)
        .select("id, name, tags, total_visits, total_spent, last_visit_at, notes")
        .eq("tenant_id", tenantId);

      // Try matching by phone first, then name
      const { data: byPhone } = phone ? await query.eq("phone", phone).limit(1) : { data: null };

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

  // Al abrir (o volver a hoy), el grid arranca en la hora actual, no a las 09:00.
  // Reintenta unos frames: el scroller no es desplazable hasta que el grid pinta completo.
  useEffect(() => {
    if (loading) return;
    let attempts = 0;
    let id = 0;
    const tryScroll = () => {
      const scroller = scrollerRef.current;
      const line = scroller?.querySelector<HTMLElement>("[data-now-line]");
      if (scroller && line && scroller.scrollHeight > scroller.clientHeight) {
        const offset =
          line.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
        scroller.scrollTop = Math.max(0, offset - 150);
        return;
      }
      if (!line && attempts > 3) return; // día sin línea de "ahora" (no es hoy / fuera de horario)
      if (attempts++ < 24) id = requestAnimationFrame(tryScroll);
    };
    id = requestAnimationFrame(tryScroll);
    return () => cancelAnimationFrame(id);
  }, [loading, activeTab]);

  // El día seleccionado de la tira semanal se mantiene a la vista (móvil: scroll horizontal)
  useEffect(() => {
    document
      .querySelector(".wk-days .wk-on")
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "auto" });
  }, [activeTab, weekStart]);

  useEffect(() => {
    fetchBookings();
  }, [weekStart, tenantId]);

  const fetchAbsences = useCallback(async () => {
    if (!tenantId) return;
    try {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const startDateStr = format(weekStart, "yyyy-MM-dd");
      const endDateStr = format(addDays(weekEnd, 1), "yyyy-MM-dd");

      const [overridesRes, salonOverridesRes, stylistsRes] = await Promise.all([
        supabase
          .from("stylist_hours_overrides")
          .select("id, stylist_id, date_from, date_to, is_closed, label, open_time, close_time")
          .lte("date_from", endDateStr)
          .gte("date_to", startDateStr),
        supabase
          .from("tenant_hours_overrides")
          .select("id, date_from, date_to, is_closed, label, open_time, close_time")
          .eq("tenant_id", tenantId)
          .lte("date_from", endDateStr)
          .gte("date_to", startDateStr),
        supabase
          .from("tenant_stylists")
          .select("id, slug, name")
          .eq("tenant_id", tenantId),
      ]);

      const idToSlug = new Map<string, string>();
      const allStylistSlugs: string[] = [];
      (stylistsRes.data ?? []).forEach((s: any) => {
        idToSlug.set(s.id, s.slug);
        allStylistSlugs.push(s.slug);
      });

      stylists.forEach((st: any) => {
        if (st.id && !idToSlug.has(st.id)) {
          idToSlug.set(st.id, st.slug);
        }
        if (!allStylistSlugs.includes(st.slug)) {
          allStylistSlugs.push(st.slug);
        }
      });

      const list: StylistAbsenceInfo[] = [];

      // Overrides de estilistas
      ((overridesRes.data ?? []) as any[]).forEach((r) => {
        const slug = idToSlug.get(r.stylist_id);
        if (slug) {
          list.push({
            id: r.id,
            stylist_slug: slug,
            date_from: r.date_from,
            date_to: r.date_to,
            is_closed: !!r.is_closed,
            label: r.label,
            open_time: r.open_time,
            close_time: r.close_time,
          });
        }
      });

      // Overrides generales del salón (festivos, cierres) -> aplicar a todos los estilistas
      ((salonOverridesRes.data ?? []) as any[]).forEach((sr) => {
        if (sr.is_closed) {
          allStylistSlugs.forEach((slug) => {
            list.push({
              id: `salon-${sr.id}-${slug}`,
              stylist_slug: slug,
              date_from: sr.date_from,
              date_to: sr.date_to,
              is_closed: true,
              label: sr.label || "Cierre del salón",
              open_time: sr.open_time,
              close_time: sr.close_time,
            });
          });
        }
      });

      setStylistAbsences(list);
    } catch (err) {
      console.error("Error fetching absences:", err);
    }
  }, [weekStart, tenantId, stylists]);

  useEffect(() => {
    fetchAbsences();

    // Supabase Realtime channel para actualización inmediata de ausencias
    const channel = supabase
      .channel(`calendar-absences-${tenantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stylist_hours_overrides" },
        () => fetchAbsences(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tenant_hours_overrides" },
        () => fetchAbsences(),
      )
      .subscribe();

    const onFocus = () => {
      fetchAbsences();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchAbsences, tenantId]);




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

    try {
      // Obtener info de servicio compuesto (no está en LocalBooking)
      const { data: meta } = await supabase
        .from("bookings")
        .select("id, compound_part, related_booking_id, notes")
        .eq("id", booking.id)
        .maybeSingle();

      // Buscar la cita hermana (parte 1 o 2) si es compuesta
      const siblingIds: string[] = [];
      if (meta?.related_booking_id) {
        siblingIds.push(meta.related_booking_id);
      } else if (meta?.compound_part) {
        const { data: sibling } = await supabase
          .from("bookings")
          .select("id, notes")
          .eq("related_booking_id", booking.id)
          .maybeSingle();
        if (sibling?.id) siblingIds.push(sibling.id);
      }

      const toggleNotes = (current: string | null) => {
        const has = current?.includes("[✓ COMPLETADA]");
        return isAlreadyCompleted
          ? (current || "").replace("[✓ COMPLETADA] ", "")
          : has
            ? current || ""
            : `[✓ COMPLETADA] ${current || ""}`;
      };

      const updatedNotes = toggleNotes(booking.notes);

      const ids = [booking.id, ...siblingIds];
      // Actualizar cada cita con sus propias notas (puede que difieran)
      await Promise.all(
        ids.map(async (id) => {
          if (id === booking.id) {
            return supabase.from("bookings").update({ notes: updatedNotes }).eq("id", id);
          }
          const { data: row } = await supabase.from("bookings").select("notes").eq("id", id).maybeSingle();
          return supabase
            .from("bookings")
            .update({ notes: toggleNotes(row?.notes ?? null) })
            .eq("id", id);
        }),
      );

      setBookings(bookings.map((b) => (ids.includes(b.id) ? { ...b, notes: toggleNotes(b.notes) } : b)));

      toast({
        title: isAlreadyCompleted ? "Cita desmarcada" : "Cita completada",
        description: siblingIds.length
          ? isAlreadyCompleted
            ? "Ambas partes desmarcadas"
            : "¡Servicio completo atendido!"
          : isAlreadyCompleted
            ? "La cita se ha desmarcado"
            : "¡Cliente atendido!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la cita",
        variant: "destructive",
      });
    }
  };

  const computeBookingTotal = (b: LocalBooking) => {
    if (!Array.isArray(b.services)) return 0;
    return (b.services as any[]).reduce((sum, s) => sum + (Number(s?.price) || 0) * (Number(s?.quantity) || 1), 0);
  };

  const handleQuickCharge = async () => {
    if (!paySheetBooking) return;
    setPaying(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const parsedCustom = parseFloat(customTotal);
      const total =
        customTotal !== "" && !isNaN(parsedCustom) && parsedCustom >= 0
          ? parsedCustom
          : computeBookingTotal(paySheetBooking);
      const services = Array.isArray(paySheetBooking.services)
        ? (paySheetBooking.services as any[]).map((s: any) => ({
            id: s?.id ?? null,
            name: s?.name ?? String(s ?? ""),
            price: Number(s?.price) || 0,
            quantity: Number(s?.quantity) || 1,
            total: (Number(s?.price) || 0) * (Number(s?.quantity) || 1),
            type: s?.type ?? "service",
          }))
        : [];

      const { error } = await supabase.from("transactions").insert({
        stylist: paySheetBooking.stylist,
        stylist_id: null,
        customer_name: paySheetBooking.customer_name || "Cliente",
        services: services as any,
        subtotal: total,
        discount: 0,
        total,
        tip_amount: 0,
        payment_method: payMethod,
        payment_details: {},
        created_by: user.id,
        tenant_id: tenantId,
        booking_id: paySheetBooking.id,
      } as never);
      if (error) throw error;

      const today = new Date().toLocaleDateString("es-ES");
      const newNotes = `[✓ COMPLETADA] [💳 COBRADA] ${today}`;
      await supabase.from("bookings").update({ notes: newNotes }).eq("id", paySheetBooking.id);

      setBookings(bookings.map((b) => (b.id === paySheetBooking.id ? { ...b, notes: newNotes } : b)));

      toast({
        title: "Cobro registrado",
        description: `${total.toFixed(2)}€ · ${paySheetBooking.customer_name}`,
      });
      setPaySheetBooking(null);
      setDetailBooking(null);
    } catch (error: any) {
      toast({
        title: "Error al cobrar",
        description: error?.message || "Inténtalo de nuevo",
        variant: "destructive",
      });
    } finally {
      setPaying(false);
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

  // ── Deshacer (Ctrl/⌘+Z y botón en el aviso) ──────────────────────────────
  // Pila de acciones reversibles de la agenda: mover, redimensionar y quitar
  // bloqueos. Cada entrada sabe cómo volver al estado anterior.
  const undoStack = useRef<Array<{ label: string; run: () => Promise<void> }>>([]);

  const pushUndo = (entry: { label: string; run: () => Promise<void> }) => {
    undoStack.current.push(entry);
    if (undoStack.current.length > 25) undoStack.current.shift();
  };

  const runUndo = async () => {
    const entry = undoStack.current.pop();
    if (!entry) {
      toast({ title: "Nada que deshacer" });
      return;
    }
    try {
      await entry.run();
      toast({ title: "Deshecho", description: entry.label });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo deshacer",
        variant: "destructive",
      });
      fetchBookings(true);
    }
  };

  // El listener de teclado vive con [] pero necesita la versión actual
  const runUndoRef = useRef(runUndo);
  runUndoRef.current = runUndo;

  const undoToastAction = () => (
    <ToastAction altText="Deshacer" onClick={() => runUndoRef.current()}>
      Deshacer
    </ToastAction>
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.key.toLowerCase() !== "z") return;
      const el = e.target as HTMLElement | null;
      // No secuestrar el deshacer nativo mientras se escribe
      if (
        el &&
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
      )
        return;
      e.preventDefault();
      runUndoRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Quitar bloqueo: abre el diálogo y mira cuántos hermanos quedan del mismo grupo
  const openUnblock = async (booking: LocalBooking) => {
    setUnblockTarget(booking);
    setUnblockGroupCount(1);
    if (!booking.recurrence_group_id) return;
    const { count, error } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("recurrence_group_id", booking.recurrence_group_id)
      .gte("Fecha", format(new Date(), "yyyy-MM-dd"));
    if (!error && count) setUnblockGroupCount(count);
  };

  const performUnblock = async (whole: boolean) => {
    const booking = unblockTarget;
    if (!booking) return;
    setUnblocking(true);

    const groupId = booking.recurrence_group_id;
    // Pintado optimista: el bloqueo desaparece del calendario al instante
    setBookings((prev) =>
      prev.filter((b) =>
        whole && groupId ? b.recurrence_group_id !== groupId : b.id !== booking.id,
      ),
    );

    try {
      const today = format(new Date(), "yyyy-MM-dd");

      // Guardamos las filas antes de borrarlas para poder deshacer
      const selectQuery = supabase.from("bookings").select("*").eq("tenant_id", tenantId);
      const { data: removedRows } =
        whole && groupId
          ? await selectQuery.eq("recurrence_group_id", groupId).gte("Fecha", today)
          : await selectQuery.eq("id", booking.id);

      // Los bloqueos son filas de `bookings` sin cliente: se borran directamente,
      // sin pasar por `cancel-booking` (que es para citas reales con avisos).
      const query = supabase.from("bookings").delete().eq("tenant_id", tenantId);
      const { error } =
        whole && groupId
          ? await query.eq("recurrence_group_id", groupId).gte("Fecha", today)
          : await query.eq("id", booking.id);

      if (error) throw error;

      if (removedRows?.length) {
        pushUndo({
          label: `${removedRows.length} bloqueo${removedRows.length === 1 ? "" : "s"} restaurado${removedRows.length === 1 ? "" : "s"}`,
          run: async () => {
            const { error: insertError } = await supabase
              .from("bookings")
              .insert(removedRows as any);
            if (insertError) throw insertError;
            fetchBookings(true);
          },
        });
      }

      toast({
        title: "Bloqueo quitado",
        description:
          whole && groupId
            ? `Se han liberado ${unblockGroupCount} bloqueo${unblockGroupCount === 1 ? "" : "s"}`
            : isFullDayBlocked(booking)
              ? `${format(parseISO(booking.Fecha), "d 'de' MMMM", { locale: es })} liberado`
              : `${booking.Hora?.slice(0, 5)}–${booking.end_time?.slice(0, 5)} liberado`,
        duration: 6000,
        action: undoToastAction(),
      });
      fetchBookings(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo quitar el bloqueo",
        variant: "destructive",
      });
      fetchBookings(true);
    } finally {
      setUnblocking(false);
      setUnblockTarget(null);
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
        blockPeriod === "hours" ? [blockStartDate] : eachDayOfInterval({ start: blockStartDate, end: finalEndDate });

      // Agrupar el bloqueo para poder cancelarlo entero después
      const groupId = (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;

      const rows: any[] = [];
      for (const day of datesToBlock) {
        for (const stylist of stylistsToBlock) {
          rows.push({
            tenant_id: tenantId,
            customer_name: "Bloqueado",
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
            title: "Bloqueado",
            notes: "Periodo bloqueado",
            color: "oklch(0.72 0.01 265)",
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
    return stylist?.color || STYLIST_FALLBACK;
  };

  const getScheduleForDay = (dayDate: Date) => {
    const dayOfWeek = dayDate.getDay();
    const dayHours = getBusinessHoursForDay(dayOfWeek, dayDate);
    const override = getOverrideForDate(dayDate);

    if (dayHours.isClosed) {
      return {
        hours: [],
        startHour: 0,
        endHour: 0,
        breakStartMinutes: null,
        breakEndMinutes: null,
        isClosed: true,
        isSpecial: !!override,
      };
    }

    // Calculate start and end hours from business hours
    const defaultStartHour = Math.floor(dayHours.morningStart / 60);
    const defaultEndHour =
      dayHours.afternoonEnd > 0 ? Math.ceil(dayHours.afternoonEnd / 60) : Math.ceil(dayHours.morningEnd / 60);

    const dayBookings = bookings.filter((b) => b.Fecha === format(dayDate, "yyyy-MM-dd"));

    let actualStartHour = defaultStartHour;
    let actualEndHour = defaultEndHour;

    if (dayBookings.length > 0) {
      dayBookings.forEach((booking) => {
        if (isFullDayBlocked(booking)) return;
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
      specialLabel: override
        ? `${(dayHours.morningStart / 60) | 0}:${String(dayHours.morningStart % 60).padStart(2, "0")}–${Math.floor((dayHours.afternoonEnd || dayHours.morningEnd) / 60)}:${String((dayHours.afternoonEnd || dayHours.morningEnd) % 60).padStart(2, "0")}`
        : null,
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
    const visualEndMinutes = startMinutesFromStart + height / PIXELS_PER_MINUTE;

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
    if (
      booking.title === "Bloqueado" ||
      booking.customer_name === "Bloqueado" ||
      booking.customer_name === "BLOQUEADO" ||
      booking.title?.includes("BLOQUEADO") ||
      booking.title?.includes("VACACIONES")
    )
      return;
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

    try {
      const group = await fetchBookingGroup(draggedBooking.id);
      const shifted = shiftBookingGroup(group, draggedBooking.id, targetDate, newTime, targetStylist);
      await validateShiftedBookingGroup(shifted, tenantId, { onlyRealBookings: true });

      const updates = await Promise.all(
        shifted.map((part) =>
          supabase
          .from("bookings")
          .update({
            stylist: targetStylist,
            Fecha: part.nextDate,
            Hora: part.nextTime,
            end_time: part.nextEndTime,
            reminder_sent: null,
            reminder_2h_sent: null,
          })
          .eq("id", part.id),
        ),
      );
      const updateError = updates.find((result) => result.error)?.error;
      if (updateError) throw updateError;

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

  // Actualiza una cita con pintado optimista (la agenda no parpadea)
  const applyBookingUpdate = async (bookingId: string, fields: Record<string, any>) => {
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, ...fields } : b)));
    const { error } = await supabase.from("bookings").update(fields).eq("id", bookingId);
    if (error) throw error;
    fetchBookings(true);
  };

  // Timeline (móvil + escritorio): mover cita arrastrando
  const handleTimelineMove = async (
    booking: LocalBooking,
    targetStylist: string,
    newTime: string,
  ) => {
    const [h, m] = newTime.split(":").map(Number);
    const endMinutes = h * 60 + m + (booking.total_duration || 30);
    const newEndTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

    const before = {
      stylist: booking.stylist,
      Hora: booking.Hora,
      end_time: booking.end_time,
    };

    try {
      await applyBookingUpdate(booking.id, {
        stylist: targetStylist,
        Hora: newTime,
        end_time: newEndTime,
      });

      pushUndo({
        label: `${booking.customer_name} vuelve a las ${before.Hora?.slice(0, 5)}`,
        run: () => applyBookingUpdate(booking.id, before),
      });

      toast({
        title: "Cita movida",
        description: `${booking.customer_name} → ${stylists.find((s) => s.slug === targetStylist)?.name || targetStylist} a las ${newTime}`,
        duration: 6000,
        action: undoToastAction(),
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo mover la cita",
        variant: "destructive",
      });
      fetchBookings(true);
    }
  };

  // Tablero semanal: mover cita a otro día y/u hora
  const handleWeekMove = async (
    booking: LocalBooking,
    dateKey: string,
    newTime: string,
    stylistSlug?: string,
  ) => {
    const [h, m] = newTime.split(":").map(Number);
    const endMinutes = h * 60 + m + (booking.total_duration || 30);
    const newEndTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

    const before = {
      Fecha: booking.Fecha,
      Hora: booking.Hora,
      end_time: booking.end_time,
      stylist: booking.stylist,
    };

    try {
      await applyBookingUpdate(booking.id, {
        Fecha: dateKey,
        Hora: newTime,
        end_time: newEndTime,
        // en "Todas" cada día se parte en calles: arrastrar de calle cambia de profesional
        stylist: stylistSlug || booking.stylist,
      });

      pushUndo({
        label: `${booking.customer_name} vuelve al ${format(parseISO(before.Fecha), "d MMM", { locale: es })} a las ${before.Hora?.slice(0, 5)}`,
        run: () => applyBookingUpdate(booking.id, before),
      });

      toast({
        title: "Cita movida",
        description: `${booking.customer_name} → ${format(parseISO(dateKey), "EEEE d", { locale: es })} a las ${newTime}`,
        duration: 6000,
        action: undoToastAction(),
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo mover la cita",
        variant: "destructive",
      });
      fetchBookings(true);
    }
  };

  // Timeline: cambiar duración estirando el borde inferior
  const handleTimelineResize = async (booking: LocalBooking, newDuration: number) => {
    const [h, m] = booking.Hora.split(":").map(Number);
    const endMinutes = h * 60 + m + newDuration;
    const newEndTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

    const before = {
      total_duration: booking.total_duration,
      end_time: booking.end_time,
    };

    try {
      await applyBookingUpdate(booking.id, {
        total_duration: newDuration,
        end_time: newEndTime,
      });

      pushUndo({
        label: `${booking.customer_name} vuelve a ${before.total_duration} min`,
        run: () => applyBookingUpdate(booking.id, before),
      });

      toast({
        title: "Duración actualizada",
        description: `${booking.customer_name}: ${newDuration} minutos`,
        duration: 6000,
        action: undoToastAction(),
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar",
        variant: "destructive",
      });
      fetchBookings(true);
    }
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

  const handleBackToToday = () => {
    const today = new Date();
    setWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
    setActiveTab(format(today, "yyyy-MM-dd"));
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const groupedBookings = groupBookingsByDate(bookings);

  // Calculate today's summary
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const todayBookings = groupedBookings[todayKey] || [];
  const completedToday = todayBookings.filter((b) => b.notes?.includes("[✓ COMPLETADA]")).length;
  const pendingToday = todayBookings.filter(
    (b) =>
      !b.notes?.includes("[✓ COMPLETADA]") &&
      b.title !== "Bloqueado" &&
      b.customer_name !== "Bloqueado" &&
      b.customer_name !== "BLOQUEADO" &&
      !b.title?.includes("BLOQUEADO") &&
      !b.title?.includes("VACACIONES"),
  ).length;
  const nowHour = new Date().getHours();
  const nowMinutes = new Date().getMinutes();
  const nextBooking = todayBookings.find((b) => {
    const [h, m] = b.Hora.split(":").map(Number);
    return (h > nowHour || (h === nowHour && m > nowMinutes)) && !b.notes?.includes("[✓ COMPLETADA]");
  });

  return (
    <div className="ag-root">
      {/* ── CABECERA ─────────────────────────────────────────────────────────
          Dos filas. Antes eran ocho bloques y la agenda no se veía sin scroll.
          Las tres cifras salen de un único cálculo (horario real del día y sin
          contar bloqueos); el grid ya no pinta su propia línea de resumen, así
          no puede volver a haber dos ocupaciones distintas en pantalla.
          ──────────────────────────────────────────────────────────────────── */}
      {view === "dia" && (() => {
        const activeKey =
          activeTab || format(weekDays.find((d) => isSameDay(d, new Date())) || weekDays[0], "yyyy-MM-dd");
        const day = weekDays.find((d) => format(d, "yyyy-MM-dd") === activeKey) || weekDays[0];
        const sched = getScheduleForDay(day);
        const dayBookings = groupedBookings[activeKey] || [];
        const appts = dayBookings.filter((b) => !isBlockedBooking(b));
        const workMin = sched.isClosed ? 0 : Math.max(0, (sched.endHour - sched.startHour) * 60);
        const capacity = workMin * Math.max(1, stylists.length);
        // Por profesional y luego se suma: dentro de un carril los solapes
        // se cuentan una vez, pero dos profesionales a la vez sí son dos huecos.
        const busy = stylists.reduce((total, st) => {
          const suyas = appts.filter((b) => b.stylist === st.slug);
          return (
            total +
            busyMinutes(
              suyas.map((b) => {
                const start = toMinutesOfDay(b.Hora);
                const end = b.end_time ? toMinutesOfDay(b.end_time) : start + (b.total_duration || 30);
                return { start, end: Math.max(end, start + 15) };
              }),
            )
          );
        }, 0);
        const occ = capacity > 0 ? Math.min(100, Math.round((busy / capacity) * 100)) : 0;
        const libres = capacity > 0 ? Math.max(0, Math.round((capacity - busy) / 30)) : 0;
        const isToday = isSameDay(day, new Date());

        return (
          <div className="ag-dayhead">
            {/* fila 1: día, métricas y acciones */}
            <div className="ag-dayhead-row">
              <div
                className="ag-date cursor-pointer group select-none transition-opacity hover:opacity-85"
                onClick={() => setCalendarOpen(true)}
                title="Elegir cualquier fecha en el calendario"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setCalendarOpen(true);
                  }
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="ag-date-d glow-hide-sm group-hover:text-[var(--glow-brand)] transition-colors">
                    {format(day, "EEEE d", { locale: es })}
                  </span>
                  <span className="ag-date-d glow-show-sm group-hover:text-[var(--glow-brand)] transition-colors">
                    {format(day, "EEE d", { locale: es })}
                  </span>
                  <CalendarIcon className="w-3.5 h-3.5 text-[var(--glow-ink-3)] group-hover:text-[var(--glow-brand)] transition-colors opacity-70 group-hover:opacity-100" />
                </div>
                <span className="ag-date-m glow-hide-sm">{format(day, "MMMM yyyy", { locale: es })}</span>
                <span className="ag-date-m glow-show-sm">{format(day, "MMM", { locale: es })}</span>
              </div>

              {sched.isClosed ? (
                <span className="glow-badge glow-badge--danger">
                  <Lock style={{ width: 11, height: 11 }} /> Salón cerrado
                </span>
              ) : (
                sched.isSpecial && (
                  <span className="glow-badge glow-badge--warn">
                    <Sparkles style={{ width: 11, height: 11 }} /> Horario especial · {sched.startHour}:00–{sched.endHour}:00
                  </span>
                )
              )}

              {!sched.isClosed && (
                <div className="ag-metrics" role="group" aria-label="Resumen del día">
                  <div className="ag-metric">
                    <span className="ag-metric-v">{appts.length}</span>
                    <span className="ag-metric-l">{appts.length === 1 ? "cita" : "citas"}</span>
                  </div>
                  <div className="ag-metric">
                    <span className="ag-metric-v">{occ}%</span>
                    <span className="ag-metric-l">ocupación</span>
                  </div>
                  <div className="ag-metric">
                    <span className="ag-metric-v">{libres}</span>
                    <span className="ag-metric-l">{libres === 1 ? "hueco" : "huecos"}</span>
                  </div>
                </div>
              )}

              <div className="ag-dayhead-acts">
                <button
                  className={`glow-icon-btn${searchOpen ? "" : " glow-icon-btn--ghost"}`}
                  aria-label="Buscar cita"
                  aria-expanded={searchOpen}
                  onClick={() => setSearchOpen((v) => !v)}
                >
                  <Search style={{ width: 15, height: 15 }} />
                </button>
                {!isToday && (
                  <button className="glow-btn glow-btn--sm" onClick={handleBackToToday}>
                    Hoy
                  </button>
                )}
                <button className="glow-btn glow-btn--sm" onClick={() => setIsBlockDialogOpen(true)}>
                  <Ban style={{ width: 13, height: 13 }} />
                  <span className="glow-hide-sm">Bloquear</span>
                </button>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="glow-btn glow-btn--sm"
                      aria-label="Abrir calendario para elegir fecha"
                      title="Elegir cualquier día en el calendario"
                    >
                      <CalendarIcon style={{ width: 13, height: 13 }} />
                      <span className="glow-hide-sm">Calendario</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-auto p-3 shadow-xl rounded-2xl border border-[var(--glow-line)]">
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 230 }}>
                      {topLeftSlot}
                      {topLeftSlot && <div style={{ borderTop: "1px solid var(--glow-line-soft)", margin: "2px 0" }} />}
                      <div className="flex items-center justify-between px-1 pb-1">
                        <span className="text-xs font-bold text-[var(--glow-ink)]">Elegir fecha</span>
                        {!isToday && (
                          <button
                            type="button"
                            onClick={() => {
                              handleBackToToday();
                              setCalendarOpen(false);
                            }}
                            className="text-xs font-semibold text-[var(--glow-brand)] hover:underline"
                          >
                            Ir a hoy
                          </button>
                        )}
                      </div>
                      <Calendar
                        mode="single"
                        selected={day}
                        onSelect={(d) => {
                          if (d) {
                            handleJumpToDate(d);
                            setCalendarOpen(false);
                          }
                        }}
                        initialFocus
                        weekStartsOn={1}
                        locale={es}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* fila 2: semana y profesionales */}
            <div className="ag-dayhead-row">
              <button
                className="ag-wk-arrow"
                aria-label="Semana anterior"
                onClick={() => setWeekStart(addDays(weekStart, -7))}
                disabled={loading}
              >
                <ChevronLeft style={{ width: 15, height: 15 }} />
              </button>

              <LayoutGroup id="agenda-week-strip">
                <div className="ag-week">
                  {weekDays.map((d) => {
                    const key = format(d, "yyyy-MM-dd");
                    const isOn = key === activeKey;
                    const dSched = getScheduleForDay(d);
                    const n = (groupedBookings[key] || []).filter((b) => !isBlockedBooking(b)).length;
                    const hasStylistAbsence =
                      selectedStylistFilter !== "all"
                        ? stylistAbsences.some(
                            (a) =>
                              a.stylist_slug === selectedStylistFilter &&
                              a.is_closed &&
                              a.date_from <= key &&
                              a.date_to >= key,
                          )
                        : false;
                    const anyStylistAbsent =
                      stylists.length > 0 &&
                      stylistAbsences.some(
                        (a) => a.is_closed && a.date_from <= key && a.date_to >= key,
                      );
                    return (
                      <button
                        key={key}
                        className={`ag-wd${isOn ? " on" : ""}${dSched.isClosed ? " closed" : ""}`}
                        onClick={() => setActiveTab(key)}
                        aria-current={isOn ? "date" : undefined}
                      >
                        {isOn && (
                          <motion.div
                            layoutId={`agActiveDayPill-${format(weekStart, "yyyy-MM-dd")}`}
                            className="ag-wd-pill"
                            transition={{
                              type: "spring",
                              stiffness: 480,
                              damping: 34,
                              mass: 0.8,
                            }}
                          />
                        )}
                        <span className="ag-wd-n">{format(d, "EEE", { locale: es })}</span>
                        <span className="ag-wd-d">{format(d, "d")}</span>
                        <span className="ag-wd-c">{dSched.isClosed ? "—" : hasStylistAbsence ? "🌴" : n || "—"}</span>
                        {isSameDay(d, new Date()) && !isOn && <span className="ag-wd-today" />}
                        {!isOn && !hasStylistAbsence && anyStylistAbsent && (
                          <span
                            style={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              backgroundColor: "#f59e0b",
                            }}
                            title="Hay ausencias registradas este día"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </LayoutGroup>

              <button
                className="ag-wk-arrow"
                aria-label="Semana siguiente"
                onClick={() => setWeekStart(addDays(weekStart, 7))}
                disabled={loading}
              >
                <ChevronRight style={{ width: 15, height: 15 }} />
              </button>

              {stylists.length > 1 && (
                <div className="ag-profs">
                  <button
                    className={`glow-chip${selectedStylistFilter === "all" ? " glow-chip--on" : ""}`}
                    onClick={() => setSelectedStylistFilter("all")}
                  >
                    Todas <b className="ag-prof-n">{appts.length}</b>
                  </button>
                  {stylists.map((s) => {
                    const n = appts.filter((b) => b.stylist === s.slug).length;
                    const on = selectedStylistFilter === s.slug;
                    return (
                      <button
                        key={s.slug}
                        className={`glow-chip${on ? " glow-chip--on" : ""}`}
                        onClick={() => setSelectedStylistFilter(on ? "all" : s.slug)}
                      >
                        <span className="ag-prof-dot" style={{ background: s.color }} />
                        {s.name} <b className="ag-prof-n">{n}</b>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* buscador: plegado tras el icono */}
            {searchOpen && (
              <div className="ag-search">
                <span className="ag-search-ic">
                  <Search style={{ width: 15, height: 15 }} />
                </span>
                <input
                  className="ag-search-in"
                  autoFocus
                  placeholder="Buscar por nombre o teléfono…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                    if (e.key === "Escape") { clearSearch(); setSearchOpen(false); }
                  }}
                />
                {isSearching && <Loader2 className="glow-spinner-sm" style={{ marginRight: 10 }} />}
                {searchQuery && !isSearching && (
                  <button className="ag-search-clear" onClick={clearSearch} aria-label="Limpiar búsqueda">
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {showSearchResults && searchResults.length > 0 && (
        <div
          style={{
            border: "1px solid oklch(0.925 0.007 265)",
            borderRadius: 14,
            overflow: "hidden",
            maxHeight: 280,
            overflowY: "auto",
            background: "#fff",
            boxShadow: "0 10px 30px -16px rgba(20,22,40,.18)",
          }}
        >
          {searchResults.map((result) => {
            const svcs = Array.isArray(result.services)
              ? result.services.map((s: any) => s.name || s).filter(Boolean)
              : [];
            return (
              <button
                key={result.id}
                onClick={() => handleSelectSearchResult(result)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  borderBottom: "1px solid oklch(0.955 0.004 265)",
                }}
                className="hover:bg-chip transition-colors"
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{result.customer_name}</p>
                  <p style={{ fontSize: 12, color: "oklch(0.62 0.015 265)" }}>
                    {svcs[0]} · {result.Telefono}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "var(--glow-brand)" }}>{result.Hora.slice(0, 5)}</p>
                  <p style={{ fontSize: 12, color: "oklch(0.62 0.015 265)" }}>
                    {format(parseISO(result.Fecha), "d MMM", { locale: es })}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── WEEK NAV (vista semana) ───────────────────────────── */}
      {view === "semana" && (() => {
        // Métricas de la semana con la misma fórmula que el día: horario real
        // de cada jornada, sin bloqueos y fusionando los solapes.
        let citas = 0, ocupado = 0, capacidad = 0;
        weekDays.forEach((d) => {
          const key = format(d, "yyyy-MM-dd");
          const sch = getScheduleForDay(d);
          if (sch.isClosed) return;
          const min = Math.max(0, (sch.endHour - sch.startHour) * 60);
          capacidad += min * Math.max(1, stylists.length);
          const dayAppts = (groupedBookings[key] || []).filter((b) => !isBlockedBooking(b));
          citas += dayAppts.length;
          stylists.forEach((st) => {
            ocupado += busyMinutes(
              dayAppts
                .filter((b) => b.stylist === st.slug)
                .map((b) => {
                  const st0 = toMinutesOfDay(b.Hora);
                  const en = b.end_time ? toMinutesOfDay(b.end_time) : st0 + (b.total_duration || 30);
                  return { start: st0, end: Math.max(en, st0 + 15) };
                }),
            );
          });
        });
        const occ = capacidad > 0 ? Math.min(100, Math.round((ocupado / capacidad) * 100)) : 0;
        const estaSemana = isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }));

        return (
          <div className="ag-dayhead">
            <div className="ag-dayhead-row">
              <div
                className="ag-date cursor-pointer group select-none transition-opacity hover:opacity-85"
                onClick={() => setWeekCalendarOpen(true)}
                title="Elegir cualquier semana en el calendario"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setWeekCalendarOpen(true);
                  }
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="ag-date-d group-hover:text-[var(--glow-brand)] transition-colors">
                    {format(weekStart, "d MMM", { locale: es })} – {format(addDays(weekStart, 6), "d MMM", { locale: es })}
                  </span>
                  <CalendarIcon className="w-3.5 h-3.5 text-[var(--glow-ink-3)] group-hover:text-[var(--glow-brand)] transition-colors opacity-70 group-hover:opacity-100" />
                </div>
                <span className="ag-date-m">{format(weekStart, "yyyy", { locale: es })}</span>
              </div>

              <div className="ag-metrics" role="group" aria-label="Resumen de la semana">
                <div className="ag-metric">
                  <span className="ag-metric-v">{citas}</span>
                  <span className="ag-metric-l">{citas === 1 ? "cita" : "citas"}</span>
                </div>
                <div className="ag-metric">
                  <span className="ag-metric-v">{occ}%</span>
                  <span className="ag-metric-l">ocupación</span>
                </div>
              </div>

              <div className="ag-dayhead-acts">
                <button
                  className="ag-wk-arrow"
                  aria-label="Semana anterior"
                  onClick={() => setWeekStart(addDays(weekStart, -7))}
                  disabled={loading}
                >
                  <ChevronLeft style={{ width: 15, height: 15 }} />
                </button>
                {!estaSemana && (
                  <button
                    className="glow-btn glow-btn--sm"
                    onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                  >
                    Esta semana
                  </button>
                )}
                <button
                  className="ag-wk-arrow"
                  aria-label="Semana siguiente"
                  onClick={() => setWeekStart(addDays(weekStart, 7))}
                  disabled={loading}
                >
                  <ChevronRight style={{ width: 15, height: 15 }} />
                </button>
                <Popover open={weekCalendarOpen} onOpenChange={setWeekCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="glow-btn glow-btn--sm"
                      aria-label="Abrir calendario para elegir semana"
                      title="Elegir cualquier semana en el calendario"
                    >
                      <CalendarIcon style={{ width: 13, height: 13 }} />
                      <span className="glow-hide-sm">Calendario</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-auto p-3 shadow-xl rounded-2xl border border-[var(--glow-line)]">
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 230 }}>
                      <div className="flex items-center justify-between px-1 pb-1">
                        <span className="text-xs font-bold text-[var(--glow-ink)]">Elegir semana</span>
                        {!estaSemana && (
                          <button
                            type="button"
                            onClick={() => {
                              setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
                              setWeekCalendarOpen(false);
                            }}
                            className="text-xs font-semibold text-[var(--glow-brand)] hover:underline"
                          >
                            Esta semana
                          </button>
                        )}
                      </div>
                      <Calendar
                        mode="single"
                        selected={weekStart}
                        onSelect={(d) => {
                          if (d) {
                            setWeekStart(startOfWeek(d, { weekStartsOn: 1 }));
                            setWeekCalendarOpen(false);
                          }
                        }}
                        initialFocus
                        weekStartsOn={1}
                        locale={es}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {stylists.length > 1 && (
              <div className="ag-dayhead-row">
                <div className="ag-profs" style={{ paddingLeft: 0, marginLeft: 0, borderLeft: "none" }}>
                  <button
                    className={`glow-chip${selectedStylistFilter === "all" ? " glow-chip--on" : ""}`}
                    onClick={() => setSelectedStylistFilter("all")}
                  >
                    Todas
                  </button>
                  {stylists.map((st) => {
                    const on = selectedStylistFilter === st.slug;
                    return (
                      <button
                        key={st.slug}
                        className={`glow-chip${on ? " glow-chip--on" : ""}`}
                        onClick={() => setSelectedStylistFilter(on ? "all" : st.slug)}
                      >
                        <span className="ag-prof-dot" style={{ background: st.color }} />
                        {st.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── WEEK BOARD ────────────────────────────────────────── */}
      {view === "semana" && !loading && (() => {
        const weekDaysMeta: WeekDay[] = weekDays.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const sch = getScheduleForDay(d);
          return {
            key,
            label: format(d, "EEE", { locale: es }).toUpperCase(),
            dayNum: format(d, "d"),
            isToday: isSameDay(d, new Date()),
            closed: sch.isClosed,
            startMin: sch.startHour * 60,
            endMin: sch.endHour * 60,
            breakStart: sch.breakStartMinutes,
            breakEnd: sch.breakEndMinutes,
          };
        });

        const open = weekDaysMeta.filter((d) => !d.closed);
        if (open.length === 0) {
          return (
            <div className="ag-empty">
              <p style={{ fontWeight: 700, fontSize: 15 }}>Salón cerrado toda la semana</p>
            </div>
          );
        }
        const startHour = Math.min(...open.map((d) => d.startMin)) / 60;
        const endHour = Math.max(...open.map((d) => d.endMin)) / 60;

        const weekBookings = bookings.filter(
          (b) => selectedStylistFilter === "all" || b.stylist === selectedStylistFilter,
        ) as unknown as WeekBooking[];

        return (
          <div className="-mx-3 min-[920px]:mx-0 relative z-0 isolate">
            <AgendaWeekBoard
              bookings={weekBookings}
              days={weekDaysMeta}
              stylists={stylists}
              splitByStylist={selectedStylistFilter === "all"}
              startHour={startHour}
              endHour={endHour}
              nowMinutes={currentTime.getHours() * 60 + currentTime.getMinutes()}
              onSelect={(b) => setDetailBooking(b as unknown as LocalBooking)}
              isBlocked={(b) => isBlockedBooking(b as unknown as LocalBooking)}
              isFullDayBlocked={(b) => isFullDayBlocked(b as unknown as LocalBooking)}
              onQuickCreate={(dateKey, time, stylistSlug) =>
                setQuickBooking({
                  date: parseISO(dateKey),
                  time,
                  stylistSlug:
                    stylistSlug ||
                    (selectedStylistFilter !== "all"
                      ? selectedStylistFilter
                      : stylists[0]?.slug || "any"),
                })
              }
              onMove={(b, dateKey, time, stylistSlug) =>
                handleWeekMove(b as unknown as LocalBooking, dateKey, time, stylistSlug)
              }
              onResize={(b, duration) =>
                handleTimelineResize(b as unknown as LocalBooking, duration)
              }
              onUnblock={(b) => openUnblock(b as unknown as LocalBooking)}
              absences={stylistAbsences}
            />
          </div>
        );
      })()}

      {/* ── CALENDAR GRID (vista día) ─────────────────────────── */}
      {view === "dia" && (
        loading ? (
        <div className="ag-gridcard ag-skel" aria-hidden>
          <div className="ag-skel-head">
            <span className="ag-skel-pill" style={{ width: 42 }} />
            <span className="ag-skel-pill" style={{ width: 130 }} />
            <span className="ag-skel-pill" style={{ width: 130 }} />
          </div>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="ag-skel-row">
              <span className="ag-skel-pill" style={{ width: 34 }} />
              <span className="ag-skel-block" style={{ width: `${[62, 38, 74, 30, 52, 44][i]}%`, marginLeft: i % 2 ? "18%" : 0 }} />
            </div>
          ))}
        </div>
      ) : (
        (() => {
          const activeKey =
            activeTab || format(weekDays.find((d) => isSameDay(d, new Date())) || weekDays[0], "yyyy-MM-dd");
          const activeDay = weekDays.find((d) => format(d, "yyyy-MM-dd") === activeKey) || weekDays[0];
          const schedule = getScheduleForDay(activeDay);
          const isToday = isSameDay(activeDay, new Date());
          const dayBkgs = groupedBookings[activeKey] || [];
          const filteredStylists = stylists.filter(
            (s) => selectedStylistFilter === "all" || s.slug === selectedStylistFilter,
          );

          if (schedule.isClosed) {
            return (
              <div className="ag-empty">
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
                <p style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>Salón cerrado</p>
                <p style={{ color: "oklch(0.62 0.015 265)", fontSize: 14 }}>
                  {format(activeDay, "EEEE d MMMM", { locale: es })}
                </p>
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
          const TOP_PAD = 24;
          const GUTTER = 58;
          const totalH = (schedule.endHour - schedule.startHour) * 60 * PPM + TOP_PAD * 2;

          const nowH = currentTime.getHours();
          const nowM = currentTime.getMinutes();
          const nowTopPx =
            isToday && nowH >= schedule.startHour && nowH < schedule.endHour
              ? (nowH - schedule.startHour) * 60 * PPM + nowM * PPM + TOP_PAD
              : null;

          const breakTopPx =
            schedule.breakStartMinutes !== null
              ? (schedule.breakStartMinutes - schedule.startHour * 60) * PPM + TOP_PAD
              : null;
          const breakH =
            schedule.breakStartMinutes !== null && schedule.breakEndMinutes !== null
              ? (schedule.breakEndMinutes - schedule.breakStartMinutes) * PPM
              : 0;

          const bookingsByStylist: Record<string, LocalBooking[]> = {};
          const fullDayBlocksByStylist: Record<string, LocalBooking[]> = {};
          filteredStylists.forEach((s) => {
            const all = dayBkgs.filter((b) => b.stylist === s.slug);
            bookingsByStylist[s.slug] = all.filter((b) => !isFullDayBlocked(b));
            fullDayBlocksByStylist[s.slug] = all.filter((b) => isFullDayBlocked(b));
          });

          return (
            <>

              {/* Agenda (móvil y desktop): raíles por profesional, suelta sobre el fondo.
                  `isolate` crea stacking context: lo sticky de dentro no puede taparse con el chrome. */}
              <div className="-mx-3 min-[920px]:mx-0 relative z-0 isolate">
                  <AgendaDayTimeline
                      bookings={dayBkgs}
                      stylists={filteredStylists}
                      startHour={schedule.startHour}
                      endHour={schedule.endHour}
                      isToday={isToday}
                      nowMinutes={nowHour * 60 + nowMinutes}
                      onSelect={(b) => setDetailBooking(b as LocalBooking)}
                      isBlocked={(b) => isBlockedBooking(b as LocalBooking)}
                      isFullDayBlocked={(b) => isFullDayBlocked(b as LocalBooking)}
                      breakStart={schedule.breakStartMinutes}
                      breakEnd={schedule.breakEndMinutes}
                      onQuickCreate={(stylistSlug, time) =>
                        setQuickBooking({ date: activeDay, time, stylistSlug })
                      }
                      onMove={(b, stylistSlug, time) =>
                        handleTimelineMove(b as LocalBooking, stylistSlug, time)
                      }
                      onResize={(b, duration) =>
                        handleTimelineResize(b as LocalBooking, duration)
                      }
                      onUnblock={(b) => openUnblock(b as LocalBooking)}
                      absences={stylistAbsences}
                      activeDateKey={activeKey}
                />
              </div>

              <div
                className="ag-gridcard ag-day-in"
                key={activeKey}
                style={{
                  borderRadius: "20px",
                  overflow: "hidden",
                  border: "1px solid oklch(0.925 0.007 265)",
                  boxShadow: "0 10px 40px -16px rgba(20, 22, 40, 0.08)",
                  background: "var(--glow-surface)",
                  position: "relative",
                  display: "none", // grid clásico retirado: la agenda usa el timeline en todos los tamaños
                }}
              >
                {dayBkgs.length === 0 && (
                  <div className="ag-free-hint">
                    {isToday ? "Hoy lo tienes libre" : "Día sin citas"} — toca un hueco para apuntar una
                  </div>
                )}
                <div className="ag-scroller" ref={scrollerRef}>
                  <div className="ag-grid" style={{ minWidth: "100%" }}>
                    {/* ── Sticky column headers ── */}
                    <div
                      className="ag-head"
                      style={{
                        display: "grid",
                        gridTemplateColumns: `${GUTTER}px repeat(${filteredStylists.length}, minmax(160px, 1fr))`,
                        position: "sticky",
                        top: 0,
                        zIndex: 40,
                        background: "var(--glow-surface)",
                        borderBottom: "1px solid oklch(0.925 0.007 265)",
                      }}
                    >
                      <div
                        className="ag-corner"
                        style={{ position: "sticky", left: 0, zIndex: 45, background: "var(--glow-surface)" }}
                      >
                        HORA
                      </div>
                      {filteredStylists.map((stylist) => {
                        const sBkgs = bookingsByStylist[stylist.slug] || [];
                        const bookedMin2 = sBkgs.reduce((s, b) => s + (b.total_duration || 30), 0);
                        const workMin2 = Math.max(1, (schedule.endHour - schedule.startHour) * 60);
                        const util = Math.min(1, bookedMin2 / workMin2);
                        return (
                          <div key={stylist.slug} className="ag-colhead" style={{ background: `${stylist.color}12` }}>
                            <span className="ag-colhead-accent" style={{ background: stylist.color }} />
                            <span
                              className="ag-colhead-av"
                              style={{ background: `linear-gradient(140deg, ${stylist.color}, ${stylist.color}bb)` }}
                            >
                              {stylist.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="ag-colhead-main">
                              <span className="ag-colhead-name" style={{ color: stylist.color }}>
                                {stylist.name}
                              </span>
                              <span className="ag-colhead-bar">
                                <span
                                  className="ag-colhead-fill"
                                  style={{ width: `${util * 100}%`, background: stylist.color }}
                                />
                              </span>
                            </span>
                            <span
                              className="ag-colhead-count"
                              style={{ color: stylist.color, background: `${stylist.color}18` }}
                            >
                              {sBkgs.length}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* ── Body ── */}
                    <div
                      className="ag-bodyrow"
                      style={{
                        display: "grid",
                        gridTemplateColumns: `${GUTTER}px 1fr`,
                      }}
                    >
                      {/* Hour gutter */}
                      <div
                        className="ag-gutter"
                        style={{
                          height: totalH,
                          position: "sticky",
                          left: 0,
                          zIndex: 3,
                          background: "#fff",
                          borderRight: "1px solid oklch(0.925 0.007 265)",
                        }}
                      >
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
                          const activeDayKey = format(activeDay, "yyyy-MM-dd");
                          const absence = stylistAbsences.find(
                            (a) =>
                              a.stylist_slug === stylist.slug &&
                              a.is_closed &&
                              a.date_from <= activeDayKey &&
                              a.date_to >= activeDayKey,
                          );

                          return (
                            <div
                              key={stylist.slug}
                              className={`ag-col${isLast ? " ag-col-last" : ""}`}
                              style={{
                                flex: "1 1 0",
                                minWidth: 160,
                                height: totalH,
                                position: "relative",
                                ["--stylist-c" as string]: stylist.color,
                              }}
                              onDragOver={(e) => handleDragOverColumn(e, stylist.slug, schedule.startHour)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDropOnColumn(e, stylist.slug, schedule.startHour, activeKey)}
                            >
                              {/* Half-hour lines */}
                              {Array.from({ length: (schedule.endHour - schedule.startHour) * 2 + 1 }, (_, i) => {
                                const isHour = i % 2 === 0;
                                return (
                                  <div
                                    key={i}
                                    style={{
                                      position: "absolute",
                                      left: 0,
                                      right: 0,
                                      top: i * 30 * PPM + TOP_PAD,
                                      borderTop: `1px solid ${isHour ? "oklch(0.925 0.007 265)" : "oklch(0.955 0.004 265)"}`,
                                      pointerEvents: "none",
                                    }}
                                  />
                                );
                              })}

                              {/* Clickable time slots */}
                              {schedule.hours.map((hour) => {
                                const openQuick = (mm: 0 | 30) => {
                                  if (hour >= schedule.endHour) return;
                                  const timeStr = `${String(hour).padStart(2, "0")}:${mm === 0 ? "00" : "30"}`;
                                  setQuickBooking({ date: activeDay, time: timeStr, stylistSlug: stylist.slug });
                                };
                                const slotTop = (hour - schedule.startHour) * 60 * PPM + TOP_PAD;
                                const hh = String(hour).padStart(2, "0");
                                return (
                                  <div
                                    key={hour}
                                    style={{ position: "absolute", left: 0, right: 0, top: slotTop, height: 60 * PPM }}
                                  >
                                    <div
                                      className="ag-slot-half ag-slot-half-top"
                                      data-time={`${hh}:00`}
                                      onClick={(e) => {
                                        if (!(e.target as HTMLElement).closest("[data-booking-id]")) openQuick(0);
                                      }}
                                    />
                                    <div
                                      className="ag-slot-half ag-slot-half-bot"
                                      data-time={`${hh}:30`}
                                      onClick={(e) => {
                                        if (!(e.target as HTMLElement).closest("[data-booking-id]")) openQuick(30);
                                      }}
                                    />
                                  </div>
                                );
                              })}

                              {/* Break zone */}
                              {breakTopPx !== null && (
                                <div
                                  style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    top: breakTopPx,
                                    height: breakH,
                                    background:
                                      "repeating-linear-gradient(135deg, oklch(0.965 0.03 72) 0 11px, oklch(0.945 0.045 72) 11px 22px)",
                                    pointerEvents: "none",
                                    zIndex: 0,
                                  }}
                                />
                              )}

                              {/* Drag drop indicator */}
                              {dragOverStylist === stylist.slug &&
                                dragOverTime &&
                                (() => {
                                  const [dh, dm] = dragOverTime.split(":").map(Number);
                                  const minFromStart = (dh - schedule.startHour) * 60 + dm;
                                  const topDrag = minFromStart * PPM + TOP_PAD;
                                  const hDrag = (draggedBooking?.total_duration || 30) * PPM;
                                  return (
                                    <div
                                      style={{
                                        position: "absolute",
                                        left: 2,
                                        right: 2,
                                        top: Math.max(0, topDrag),
                                        height: hDrag,
                                        borderRadius: 10,
                                        background: "rgb(var(--glow-brand-rgb) / .125)",
                                        border: "2px dashed rgb(var(--glow-brand-rgb) / .5)",
                                        pointerEvents: "none",
                                        zIndex: 40,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: 12,
                                          fontWeight: 700,
                                          color: "var(--glow-brand)",
                                          background: "white",
                                          padding: "2px 8px",
                                          borderRadius: 6,
                                        }}
                                      >
                                        {dragOverTime}
                                      </span>
                                    </div>
                                  );
                                })()}

                              {/* Stylist absence overlay */}
                              {absence && (
                                <div
                                  style={{
                                    position: "absolute",
                                    inset: 0,
                                    zIndex: 30,
                                    background:
                                      "repeating-linear-gradient(135deg, rgba(153,50,154,0.08) 0 12px, rgba(34,64,139,0.08) 12px 24px), rgba(255,255,255,0.55)",
                                    backdropFilter: "blur(2px)",
                                    WebkitBackdropFilter: "blur(2px)",
                                    border: `1.5px dashed ${stylist.color}80`,
                                    borderRadius: 12,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    padding: 16,
                                    textAlign: "center",
                                    pointerEvents: "auto",
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  title={absence.label || "Ausencia"}
                                >
                                  <div
                                    style={{
                                      width: 42,
                                      height: 42,
                                      borderRadius: "50%",
                                      background: `linear-gradient(140deg, ${stylist.color}, ${stylist.color}cc)`,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      boxShadow: `0 6px 18px -8px ${stylist.color}99`,
                                    }}
                                  >
                                    <CalendarOff style={{ width: 20, height: 20, color: "#fff" }} />
                                  </div>
                                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--glow-ink)", letterSpacing: 0.2 }}>
                                    No trabaja hoy
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: stylist.color,
                                      background: `${stylist.color}18`,
                                      padding: "4px 10px",
                                      borderRadius: 999,
                                      maxWidth: "90%",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {absence.label || "Ausencia"}
                                  </div>
                                  {absence.date_from !== absence.date_to && (
                                    <div style={{ fontSize: 10, color: "oklch(0.5 0.015 265)", fontWeight: 600 }}>
                                      {format(parseISO(absence.date_from), "d MMM", { locale: es })} –{" "}
                                      {format(parseISO(absence.date_to), "d MMM", { locale: es })}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Full-day blocked banner */}
                              {(fullDayBlocksByStylist[stylist.slug] || []).length > 0 && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: TOP_PAD,
                                    left: 2,
                                    right: 2,
                                    zIndex: 3,
                                    borderRadius: 9,
                                    border: "1.5px dashed oklch(0.78 0.05 25)",
                                    background: "oklch(0.97 0.018 25)",
                                    padding: "5px 8px 5px 10px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 7,
                                  }}
                                >
                                  <Lock style={{ width: 11, height: 11, color: "var(--glow-danger-ink)", flexShrink: 0 }} />
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--glow-danger-ink)", flex: 1 }}>
                                    Bloqueado
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const fb = (fullDayBlocksByStylist[stylist.slug] || [])[0];
                                      if (fb) handleDeleteBooking(fb);
                                    }}
                                    className="p-1 rounded-md bg-glow-danger/5 text-glow-danger-ink hover:bg-glow-danger/10 hover:text-glow-danger-ink transition-all"
                                    title="Desbloquear"
                                  >
                                    <Trash2 style={{ width: 11, height: 11 }} />
                                  </button>
                                </div>
                              )}

                              {/* Appointment cards */}
                              {sBkgs.map((booking) => {
                                const pos = calculateBookingPosition(booking, activeDay);
                                const layout = overlapLayout[booking.id] || { left: "0%", width: "100%", zIndex: 1 };
                                const isCompleted = booking.notes?.includes("[✓ COMPLETADA]");
                                const isBlocked = isBlockedBooking(booking);
                                const isFullDay = false;
                                const isHighlighted = highlightedBookingId === booking.id;
                                const isDragging = draggedBooking?.id === booking.id;
                                const isResizing2 = resizingBooking?.id === booking.id;
                                const bColor = isBlocked ? "oklch(0.68 0.01 265)" : getStylistColor(booking.stylist);
                                const svcs2 = Array.isArray(booking.services)
                                  ? booking.services.map((s: any) => s.name || s).filter(Boolean)
                                  : [];
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
                                    onDragStart={(e) => handleDragStart(e, booking)}
                                    onDragEnd={handleDragEnd}
                                    className="group/card"
                                    style={{
                                      position: "absolute",
                                      top: isFullDay ? TOP_PAD : pos.top + TOP_PAD,
                                      height: isFullDay ? totalH - TOP_PAD * 2 - 3 : bH - 3,
                                      left: `calc(${layout.left} + 2px)`,
                                      width: `calc(${layout.width} - 4px)`,
                                      zIndex: isFullDay ? 0 : isHighlighted ? 20 : layout.zIndex,
                                      borderRadius: 13,
                                      border: isBlocked
                                        ? `1.5px dashed oklch(0.78 0.01 265)`
                                        : `1px solid ${isCompleted ? "transparent" : `${bColor}40`}`,
                                      background: isBlocked
                                        ? "oklch(0.97 0.003 265)"
                                        : isCompleted
                                          ? "oklch(0.975 0.004 260)"
                                          : `linear-gradient(160deg, ${bColor}25, ${bColor}15)`,
                                      overflow: "hidden",
                                      cursor: isBlocked ? "default" : "grab",
                                      opacity: isDragging ? 0.4 : isCompleted ? 0.72 : 1,
                                      boxShadow: isHighlighted
                                        ? `0 0 0 2px var(--glow-brand), 0 4px 12px -4px ${bColor}60`
                                        : `0 1px 2px rgba(20,22,40,.05)`,
                                      transition: "transform .13s, box-shadow .13s",
                                      outline: isResizing2 ? `2px solid var(--glow-brand)` : undefined,
                                      // Los bloqueos dejan pasar hover/click a los slots de cita rápida
                                      pointerEvents: isBlocked ? "none" : undefined,
                                    }}
                                    onClick={(e) => {
                                      if (!isBlocked && !isResizing2) {
                                        e.stopPropagation();
                                        setDetailBooking(booking);
                                        if (isMobile) setActiveBookingActions(null);
                                      }
                                    }}
                                  >
                                    {/* Left color bar */}
                                    <div
                                      style={{
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: 5,
                                        background: `linear-gradient(180deg, ${bColor}, ${bColor}cc)`,
                                        borderRadius: "0 4px 4px 0",
                                      }}
                                    />

                                    {/* Content */}
                                    <div
                                      style={{
                                        paddingLeft: 14,
                                        paddingRight: 10,
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 2,
                                        ...(isBlocked
                                          ? {
                                              justifyContent: "center",
                                              alignItems: isFullDay ? "center" : undefined,
                                              paddingLeft: isFullDay ? 10 : 14,
                                            }
                                          : isOneLine
                                            ? { justifyContent: "center" }
                                            : { paddingTop: 6, paddingBottom: 6 }),
                                      }}
                                    >
                                      {isBlocked ? (
                                        isFullDay ? (
                                          <>
                                            <span
                                              style={{
                                                fontSize: 13,
                                                fontWeight: 800,
                                                color: "oklch(0.48 0.012 265)",
                                                letterSpacing: "-.01em",
                                              }}
                                            >
                                              Bloqueado
                                            </span>
                                            <span
                                              style={{ fontSize: 11, fontWeight: 600, color: "oklch(0.62 0.01 265)" }}
                                            >
                                              Día completo
                                            </span>
                                          </>
                                        ) : isOneLine ? (
                                          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                            <span
                                              style={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                color: "oklch(0.62 0.01 265)",
                                                flexShrink: 0,
                                              }}
                                            >
                                              {startT}
                                            </span>
                                            <span
                                              style={{
                                                fontSize: 12,
                                                fontWeight: 700,
                                                color: "oklch(0.50 0.012 265)",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                              }}
                                            >
                                              Bloqueado
                                            </span>
                                          </div>
                                        ) : (
                                          <>
                                            <span
                                              style={{ fontSize: 11, fontWeight: 700, color: "oklch(0.62 0.01 265)" }}
                                            >
                                              {startT}–{endT}
                                            </span>
                                            <span
                                              style={{ fontSize: 13, fontWeight: 700, color: "oklch(0.48 0.012 265)" }}
                                            >
                                              Bloqueado
                                            </span>
                                          </>
                                        )
                                      ) : isOneLine ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                                          <span
                                            style={{
                                              fontSize: 11,
                                              fontWeight: 800,
                                              color: isCompleted ? "oklch(0.62 0.015 265)" : bColor,
                                              flexShrink: 0,
                                            }}
                                          >
                                            {startT}
                                          </span>
                                          {isCompleted && (
                                            <Check
                                              style={{
                                                width: 10,
                                                height: 10,
                                                color: "oklch(0.62 0.15 150)",
                                                flexShrink: 0,
                                              }}
                                            />
                                          )}
                                          <span
                                            style={{
                                              fontSize: 12.5,
                                              fontWeight: 700,
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                              minWidth: 0,
                                              textDecoration: isCompleted ? "line-through" : "none",
                                            }}
                                          >
                                            {booking.customer_name}
                                          </span>
                                        </div>
                                      ) : (
                                        <>
                                          <span
                                            style={{
                                              fontSize: 11,
                                              fontWeight: 800,
                                              color: isCompleted ? "oklch(0.62 0.015 265)" : bColor,
                                              whiteSpace: "nowrap",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                            }}
                                          >
                                            {startT}
                                            <span style={{ opacity: 0.55 }}>–</span>
                                            {endT}
                                            {isFull && (
                                              <span style={{ color: "oklch(0.62 0.015 265)", fontWeight: 700 }}>
                                                {" "}
                                                · {booking.total_duration}min
                                              </span>
                                            )}
                                          </span>
                                          <span
                                            style={{
                                              fontSize: 13,
                                              fontWeight: 700,
                                              whiteSpace: "nowrap",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              textDecoration: isCompleted ? "line-through" : "none",
                                            }}
                                          >
                                            {isCompleted && (
                                              <span style={{ color: "oklch(0.62 0.15 150)", marginRight: 4 }}>✓</span>
                                            )}
                                            {booking.customer_name}
                                          </span>
                                          {isFull && (
                                            <span
                                              style={{
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: "oklch(0.45 0.02 265)",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                              }}
                                            >
                                              {firstSvc}
                                              {svcs2.length > 1 && (
                                                <span style={{ opacity: 0.6 }}> +{svcs2.length - 1}</span>
                                              )}
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </div>

                                    {/* Action buttons (hover on desktop, tap on mobile) */}
                                    {!isBlocked && (!isMobile || activeBookingActions === booking.id) && (
                                      <div
                                        className={cn(
                                          "absolute top-0.5 right-0.5 flex items-center gap-0.5 z-20 transition-opacity",
                                          isMobile ? "opacity-100" : "opacity-0 group-hover/card:opacity-100",
                                        )}
                                      >
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkCompleted(booking);
                                            if (isMobile) setActiveBookingActions(null);
                                          }}
                                          className={cn(
                                            "p-1 rounded-md transition-all",
                                            isCompleted
                                              ? "bg-glow-ok text-white"
                                              : "bg-foreground/10 text-on-surface/60 hover:bg-glow-ok hover:text-white",
                                          )}
                                          title={isCompleted ? "Desmarcar" : "Completar"}
                                        >
                                          <Check style={{ width: 12, height: 12 }} />
                                        </button>
                                        {!isCompleted && onNavigateToCash && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              sessionStorage.setItem(
                                                "pendingChargeBooking",
                                                JSON.stringify({
                                                  id: booking.id,
                                                  customer_name: booking.customer_name,
                                                  stylist: booking.stylist,
                                                  services: booking.services,
                                                  fecha: booking.Fecha,
                                                  hora: booking.Hora,
                                                }),
                                              );
                                              if (isMobile) setActiveBookingActions(null);
                                              onNavigateToCash();
                                            }}
                                            className="p-1 rounded-md bg-foreground/10 text-on-surface/60 hover:bg-glow-ok hover:text-white transition-all"
                                            title="Cobrar"
                                          >
                                            <Banknote style={{ width: 12, height: 12 }} />
                                          </button>
                                        )}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (isMobile) setActiveBookingActions(null);
                                            handleDeleteBooking(booking);
                                          }}
                                          className="p-1 rounded-md bg-foreground/10 text-on-surface/60 hover:bg-glow-danger hover:text-white transition-all"
                                          title="Eliminar"
                                        >
                                          <Trash2 style={{ width: 12, height: 12 }} />
                                        </button>
                                      </div>
                                    )}

                                    {/* Unblock button */}
                                    {isBlocked && (
                                      <div className="absolute top-0.5 right-0.5 z-20" style={{ pointerEvents: "auto" }}>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteBooking(booking);
                                          }}
                                          className="p-1 rounded-md bg-surface-container-high text-outline hover:bg-glow-danger/10 hover:text-glow-danger-ink transition-all"
                                          title="Desbloquear"
                                        >
                                          <Trash2 style={{ width: 12, height: 12 }} />
                                        </button>
                                      </div>
                                    )}

                                    {/* Skip availability indicator */}
                                    {!isBlocked && booking.skip_availability_check && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          bottom: 3,
                                          left: 7,
                                          zIndex: 5,
                                          pointerEvents: "none",
                                        }}
                                      >
                                        <ShieldAlert style={{ width: 10, height: 10, color: "oklch(0.60 0.15 65)" }} />
                                      </div>
                                    )}

                                    {/* Resize handle */}
                                    {!isBlocked && (
                                      <div
                                        className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity z-10"
                                        onMouseDown={(e) => handleResizeStart(e, booking)}
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
                          <div
                            style={{
                              position: "absolute",
                              left: 0,
                              right: 0,
                              top: breakTopPx + breakH / 2,
                              display: "flex",
                              justifyContent: "center",
                              transform: "translateY(-50%)",
                              pointerEvents: "none",
                              zIndex: 2,
                            }}
                          >
                            <span className="ag-break-pill">Descanso</span>
                          </div>
                        )}

                        {/* Current time red line */}
                        {nowTopPx !== null && (
                          <div
                            data-now-line
                            style={{
                              position: "absolute",
                              left: 0,
                              right: 0,
                              top: nowTopPx,
                              borderTop: "2px solid var(--glow-danger)",
                              zIndex: 5,
                              pointerEvents: "none",
                              boxShadow: "0 0 14px 1px rgba(239,68,68,.45)",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: -4,
                                top: -4,
                                width: 9,
                                height: 9,
                                borderRadius: "50%",
                                background: "var(--glow-danger)",
                                display: "block",
                                boxShadow: "0 0 0 4px rgba(239,68,68,.25)",
                              }}
                            />
                            <span
                              style={{
                                position: "absolute",
                                left: 8,
                                top: -9,
                                background: "var(--glow-danger)",
                                color: "#fff",
                                fontSize: 9,
                                fontWeight: 800,
                                letterSpacing: ".08em",
                                borderRadius: 5,
                                padding: "2px 6px",
                              }}
                            >
                              AHORA
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          );
        })()
        )
      )}

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
                <label>Título</label>
                <input className="glow-input"
                  value={selectedBooking.title || ""}
                  onChange={(e) => setSelectedBooking({ ...selectedBooking, title: e.target.value })}
                />
              </div>
              <div>
                <label>Notas</label>
                <textarea className="glow-input"
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
                <label>Servicios</label>
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
                <label className="text-xs font-semibold text-outline uppercase tracking-wide">
                  Ficha de cliente
                </label>
                {clientLoading ? (
                  <div className="flex items-center gap-2 text-sm text-outline">
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
                    <div className="grid grid-cols-2 gap-2 text-xs text-outline">
                      <div>
                        Visitas: <span className="font-medium text-on-surface">{matchedClient.total_visits || 0}</span>
                      </div>
                      <div>
                        Gasto:{" "}
                        <span className="font-medium text-on-surface">
                          {(matchedClient.total_spent || 0).toFixed(2)}€
                        </span>
                      </div>
                    </div>
                    {matchedClient.notes && (
                      <p className="text-xs text-outline line-clamp-2">{matchedClient.notes}</p>
                    )}
                    {onSelectClient && (
                      <button className="glow-btn glow-btn--sm glow-btn--block text-xs"
                        onClick={() => {
                          setIsEditDialogOpen(false);
                          onSelectClient(matchedClient.id);
                        }}
                      >
                        <UserCircle className="h-3 w-3 mr-1" /> Ver ficha completa
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-outline">No se encontró un cliente registrado con este nombre</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <button className="glow-btn" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </button>
            <button className="glow-btn glow-btn--primary" onClick={handleUpdateBooking}>Guardar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Period Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent className="p-0 overflow-hidden gap-0 max-w-md">
          <div className="ag-blocks-h">
            <span className="ag-blocks-ic"><Ban style={{ width: 14, height: 14 }} /></span>
            <div>
              <div className="ag-blocks-t">Bloquear agenda</div>
              <div className="ag-blocks-s">Nadie podrá reservar en ese hueco</div>
            </div>
          </div>

          <div className="glow-form" style={{ padding: 16 }}>
            <div className="glow-field">
              <label>Cuánto</label>
              <div className="glow-toolbar" style={{ marginBottom: 0 }}>
                {BLOCK_PERIODS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    className={`glow-chip${blockPeriod === p.value ? " glow-chip--on" : ""}`}
                    onClick={() => setBlockPeriod(p.value as typeof blockPeriod)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="glow-field">
              <label>Quién</label>
              <div className="glow-toolbar" style={{ marginBottom: 0 }}>
                <button
                  type="button"
                  className={`glow-chip${blockStylist === "all" ? " glow-chip--on" : ""}`}
                  onClick={() => setBlockStylist("all")}
                >
                  Todo el equipo
                </button>
                {stylists.map((st) => (
                  <button
                    key={st.slug}
                    type="button"
                    className={`glow-chip${blockStylist === st.slug ? " glow-chip--on" : ""}`}
                    onClick={() => setBlockStylist(st.slug)}
                  >
                    <span className="ag-prof-dot" style={{ background: st.color }} />
                    {st.name}
                  </button>
                ))}
              </div>
            </div>

            <div className={blockPeriod === "hours" ? "glow-form-grid" : undefined}>
              <div className="glow-field">
                <label>{blockPeriod === "hours" ? "Día" : "Desde"}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="glow-input" style={{ textAlign: "left", cursor: "pointer" }}>
                      {blockStartDate
                        ? format(blockStartDate, "d 'de' MMMM", { locale: es })
                        : "Elegir fecha"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={blockStartDate} onSelect={setBlockStartDate} weekStartsOn={1} />
                  </PopoverContent>
                </Popover>
              </div>

              {blockPeriod === "hours" && (
                <div className="glow-form-grid" style={{ gridColumn: "1 / -1" }}>
                  <div className="glow-field">
                    <label>Desde las</label>
                    <input
                      className="glow-input"
                      type="time"
                      value={blockStartTime}
                      onChange={(e) => setBlockStartTime(e.target.value)}
                    />
                  </div>
                  <div className="glow-field">
                    <label>Hasta las</label>
                    <input
                      className="glow-input"
                      type="time"
                      value={blockEndTime}
                      onChange={(e) => setBlockEndTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {(blockPeriod === "week" || blockPeriod === "month") && (
              <div className="glow-field">
                <label>Hasta</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="glow-input" style={{ textAlign: "left", cursor: "pointer" }}>
                      {blockEndDate
                        ? format(blockEndDate, "d 'de' MMMM", { locale: es })
                        : `Automático (${blockPeriod === "week" ? "7 días" : "1 mes"})`}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={blockEndDate} onSelect={setBlockEndDate} weekStartsOn={1} />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Qué va a pasar, en una frase, antes de confirmar */}
            <div className="ag-block-sum">
              <Ban style={{ width: 13, height: 13, flexShrink: 0 }} />
              <span>
                {blockStylist === "all"
                  ? "Todo el equipo"
                  : stylists.find((st) => st.slug === blockStylist)?.name ?? "El equipo"}
                {blockPeriod === "hours"
                  ? ` · ${blockStartTime}–${blockEndTime}`
                  : blockPeriod === "day"
                    ? " · el día entero"
                    : blockPeriod === "week"
                      ? " · toda la semana"
                      : " · todo el mes"}
                {blockStartDate ? ` · desde el ${format(blockStartDate, "d MMM", { locale: es })}` : ""}
              </span>
            </div>
          </div>

          <DialogFooter style={{ padding: "0 16px 16px" }}>
            <button className="glow-btn" onClick={() => setIsBlockDialogOpen(false)}>
              Cancelar
            </button>
            <button className="glow-btn glow-btn--primary" onClick={handleBlockPeriod} disabled={loading}>
              {loading ? <Loader2 className="glow-spinner-sm" /> : <Ban style={{ width: 14, height: 14 }} />}
              Bloquear
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <button className="glow-btn"
              onClick={() => pendingCancelBooking && performBookingDeletion(pendingCancelBooking, false)}
            >
              Solo esta cita
            </button>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => pendingCancelBooking && performBookingDeletion(pendingCancelBooking, true)}
            >
              Toda la serie futura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Booking detail sheet */}
      {detailBooking &&
        (() => {
          const isCompleted = detailBooking.notes?.includes("[✓ COMPLETADA]");
          const cleanNotes = (detailBooking.notes || "").replace("[✓ COMPLETADA] ", "").trim();
          const stylistColor = getStylistColor(detailBooking.stylist);
          const stylistName = stylists.find((s) => s.slug === detailBooking.stylist)?.name || detailBooking.stylist;
          const phone = (detailBooking.Telefono || "").trim();
          const phoneClean = phone.replace(/\s|-/g, "");
          const initial = (detailBooking.customer_name || "?").trim().charAt(0).toUpperCase();
          return (
            <div className="ag-detail-wrap" onClick={() => setDetailBooking(null)}>
              <div className="ag-detail-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="ag-sheet-grip" aria-hidden />
                <div className="ag-detail-grip" />
                <button className="ag-detail-close" onClick={() => setDetailBooking(null)} aria-label="Cerrar">
                  <X style={{ width: 16, height: 16 }} />
                </button>

                {/* Status pill */}
                {isCompleted && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11.5,
                      fontWeight: 800,
                      color: "oklch(0.42 0.13 150)",
                      background: "oklch(0.95 0.04 150)",
                      padding: "4px 10px",
                      borderRadius: 99,
                      marginBottom: 10,
                      letterSpacing: ".02em",
                    }}
                  >
                    <Check style={{ width: 12, height: 12 }} />
                    COMPLETADA
                  </div>
                )}

                {/* Time hero */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 34,
                      fontWeight: 800,
                      letterSpacing: "-.04em",
                      color: "var(--ag-ink)",
                      lineHeight: 1,
                    }}
                  >
                    {detailBooking.Hora?.slice(0, 5)}
                  </span>
                  {detailBooking.end_time && (
                    <span style={{ fontSize: 17, fontWeight: 700, color: "var(--ag-muted)" }}>
                      – {detailBooking.end_time.slice(0, 5)}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 18,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ag-muted)",
                  }}
                >
                  <span style={{ textTransform: "capitalize" }}>
                    {format(parseISO(detailBooking.Fecha), "EEEE d 'de' MMMM", { locale: es })}
                  </span>
                  {detailBooking.total_duration > 0 && (
                    <>
                      <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--ag-muted)" }} />
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Clock style={{ width: 12, height: 12 }} />
                        {detailBooking.total_duration} min
                      </span>
                    </>
                  )}
                </div>

                {/* Client card */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 14,
                    padding: "12px 14px",
                    background: "var(--ag-chip)",
                    borderRadius: 16,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 13,
                      background: `linear-gradient(150deg, ${stylistColor}, color-mix(in oklab, ${stylistColor}, #000 25%))`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: 17,
                      letterSpacing: "-.02em",
                    }}
                  >
                    {initial}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        letterSpacing: "-.01em",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {detailBooking.customer_name}
                    </div>
                    {phone && (
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--ag-muted)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {phone}
                      </div>
                    )}
                  </div>
                  {phone && (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <a
                        href={`tel:${phoneClean}`}
                        className="ag-detail-phone-btn"
                        title="Llamar"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone style={{ width: 17, height: 17 }} />
                      </a>
                      <a
                        href={`https://wa.me/${phoneClean.replace(/^\+/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ag-detail-phone-btn whatsapp"
                        title="WhatsApp"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageCircle style={{ width: 17, height: 17 }} />
                      </a>
                    </div>
                  )}
                </div>

                {/* Services */}
                {Array.isArray(detailBooking.services) && detailBooking.services.length > 0 && (
                  <div
                    style={{
                      marginBottom: 14,
                      border: "1px solid var(--ag-line)",
                      borderRadius: 14,
                      overflow: "hidden",
                    }}
                  >
                    {(detailBooking.services as any[]).map((s: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: 10,
                          padding: "11px 14px",
                          borderBottom:
                            i < (detailBooking.services as any[]).length - 1 ? "1px solid var(--ag-line2)" : "none",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{s.name || s}</span>
                        {s.duration && (
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--ag-muted)",
                              fontWeight: 700,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {s.duration}min
                          </span>
                        )}
                        {s.price && (
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 800,
                              color: "var(--ag-accent)",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {s.price}€
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Meta badges */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      background: `${stylistColor}1a`,
                      color: stylistColor,
                      borderRadius: 99,
                      padding: "4px 11px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: stylistColor }} />
                    {stylistName}
                  </span>
                  {detailBooking.canal && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        background: "oklch(0.95 0.04 230)",
                        color: "oklch(0.38 0.13 230)",
                        borderRadius: 99,
                        padding: "4px 11px",
                        textTransform: "uppercase",
                        letterSpacing: ".04em",
                      }}
                    >
                      {detailBooking.canal}
                    </span>
                  )}
                  {detailBooking.skip_availability_check && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        background: "oklch(0.96 0.05 75)",
                        color: "oklch(0.48 0.12 65)",
                        borderRadius: 99,
                        padding: "4px 11px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <ShieldAlert style={{ width: 12, height: 12 }} />
                      Sin disponibilidad
                    </span>
                  )}
                </div>

                {/* Notes */}
                {cleanNotes && !cleanNotes.startsWith("Periodo bloqueado") && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--ag-ink2)",
                      background: "var(--ag-chip)",
                      borderLeft: "3px solid var(--ag-accent)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      marginBottom: 16,
                      fontStyle: "italic",
                    }}
                  >
                    {cleanNotes}
                  </div>
                )}

                {/* Actions */}
                <div className="ag-detail-actions">
                  <button
                    className="ag-detail-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailBooking(null);
                      setSelectedBooking(detailBooking);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Pencil style={{ width: 15, height: 15 }} />
                    Editar
                  </button>
                  <button
                    className={`ag-detail-action ${isCompleted ? "" : "primary"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailBooking(null);
                      handleMarkCompleted(detailBooking);
                    }}
                  >
                    <Check style={{ width: 15, height: 15 }} />
                    {isCompleted ? "Desmarcar" : "Completar"}
                  </button>
                  {!isCompleted && (
                    <button
                      className="ag-detail-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPayMethod("cash");
                        setCustomTotal("");
                        setEditingTotal(false);
                        setPaySheetBooking(detailBooking);
                        setDetailBooking(null);
                      }}
                    >
                      <Wallet style={{ width: 15, height: 15 }} />
                      Cobrar
                    </button>
                  )}
                  <button
                    className="ag-detail-action danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailBooking(null);
                      handleDeleteBooking(detailBooking);
                    }}
                  >
                    <Trash2 style={{ width: 15, height: 15 }} />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Quick payment sheet */}
      {paySheetBooking &&
        (() => {
          const total = computeBookingTotal(paySheetBooking);
          const parsedCustom = parseFloat(customTotal);
          const effectiveTotal = customTotal !== "" && !isNaN(parsedCustom) && parsedCustom >= 0 ? parsedCustom : total;
          const svcs = Array.isArray(paySheetBooking.services) ? (paySheetBooking.services as any[]) : [];
          return (
            <div className="ag-detail-wrap" onClick={() => !paying && setPaySheetBooking(null)}>
              <div className="ag-detail-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="ag-sheet-grip" aria-hidden />
                <div className="ag-detail-grip" />
                <button
                  className="ag-detail-close"
                  onClick={() => !paying && setPaySheetBooking(null)}
                  aria-label="Cerrar"
                  disabled={paying}
                >
                  <X style={{ width: 16, height: 16 }} />
                </button>

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: "var(--ag-muted)",
                    letterSpacing: ".08em",
                    marginBottom: 10,
                    textTransform: "uppercase",
                  }}
                >
                  <Wallet style={{ width: 12, height: 12 }} />
                  Cobro rápido
                </div>

                {/* Total (editable) */}
                <div style={{ marginBottom: 18 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--ag-muted)",
                      marginBottom: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    Total a cobrar
                    {!editingTotal && !paying && (
                      <button
                        onClick={() => {
                          setCustomTotal(effectiveTotal.toFixed(2));
                          setEditingTotal(true);
                        }}
                        style={{
                          border: "none",
                          background: "var(--ag-chip, var(--glow-sunk))",
                          padding: "3px 7px",
                          cursor: "pointer",
                          color: "var(--ag-muted)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: "inherit",
                        }}
                        title="Modificar importe"
                      >
                        <Pencil style={{ width: 10, height: 10 }} />
                        Modificar
                      </button>
                    )}
                  </div>
                  {editingTotal ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        autoFocus
                        value={customTotal}
                        onChange={(e) => setCustomTotal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setEditingTotal(false);
                          if (e.key === "Escape") {
                            setCustomTotal("");
                            setEditingTotal(false);
                          }
                        }}
                        style={{
                          fontSize: 36,
                          fontWeight: 800,
                          letterSpacing: "-.04em",
                          color: "var(--ag-ink)",
                          lineHeight: 1,
                          fontVariantNumeric: "tabular-nums",
                          border: "none",
                          borderBottom: "2px solid var(--glow-brand)",
                          outline: "none",
                          background: "transparent",
                          width: "130px",
                          fontFamily: "inherit",
                          padding: "2px 0",
                        }}
                      />
                      <span style={{ fontSize: 24, color: "var(--ag-muted)" }}>€</span>
                      <button
                        onClick={() => setEditingTotal(false)}
                        style={{
                          border: "none",
                          background: "var(--glow-ok-ink, var(--glow-ok))",
                          color: "#fff",
                          borderRadius: 8,
                          padding: "6px 10px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Check style={{ width: 14, height: 14 }} />
                      </button>
                      <button
                        onClick={() => {
                          setCustomTotal("");
                          setEditingTotal(false);
                        }}
                        style={{
                          border: "1px solid var(--ag-line)",
                          background: "none",
                          color: "var(--ag-muted)",
                          borderRadius: 8,
                          padding: "6px 10px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
                      <span
                        style={{
                          fontSize: 42,
                          fontWeight: 800,
                          letterSpacing: "-.04em",
                          color: "var(--ag-ink)",
                          lineHeight: 1,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {effectiveTotal.toFixed(2)}
                      </span>
                      <span style={{ fontSize: 24, color: "var(--ag-muted)", marginLeft: 4 }}>€</span>
                      {customTotal !== "" && Math.abs(effectiveTotal - total) > 0.001 && (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "var(--ag-muted)",
                            marginLeft: 10,
                            textDecoration: "line-through",
                            alignSelf: "center",
                          }}
                        >
                          {total.toFixed(2)}€
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ag-muted)", marginTop: 4 }}>
                    {paySheetBooking.customer_name}
                  </div>
                </div>

                {/* Services breakdown */}
                {svcs.length > 0 && (
                  <div
                    style={{
                      marginBottom: 16,
                      border: "1px solid var(--ag-line)",
                      borderRadius: 14,
                      overflow: "hidden",
                    }}
                  >
                    {svcs.map((s: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: 8,
                          padding: "9px 14px",
                          borderBottom: i < svcs.length - 1 ? "1px solid var(--ag-line2)" : "none",
                          alignItems: "center",
                          fontSize: 13,
                        }}
                      >
                        <span style={{ fontWeight: 700, flex: 1 }}>{s?.name || s}</span>
                        <span style={{ fontWeight: 700, color: "var(--ag-muted)", fontVariantNumeric: "tabular-nums" }}>
                          {((Number(s?.price) || 0) * (Number(s?.quantity) || 1)).toFixed(2)}€
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Method picker */}
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "var(--ag-muted)",
                    marginBottom: 8,
                    letterSpacing: ".04em",
                    textTransform: "uppercase",
                  }}
                >
                  Método
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
                  <button
                    className={`ag-pay-method${payMethod === "cash" ? " on" : ""}`}
                    onClick={() => setPayMethod("cash")}
                    disabled={paying}
                  >
                    <Banknote style={{ width: 22, height: 22 }} />
                    <span>Efectivo</span>
                  </button>
                  <button
                    className={`ag-pay-method${payMethod === "card" ? " on" : ""}`}
                    onClick={() => setPayMethod("card")}
                    disabled={paying}
                  >
                    <Wallet style={{ width: 22, height: 22 }} />
                    <span>Tarjeta</span>
                  </button>
                </div>

                {/* Confirm */}
                <button
                  className="ag-detail-action primary"
                  style={{ width: "100%", padding: "13px 16px", fontSize: 15 }}
                  onClick={handleQuickCharge}
                  disabled={paying || effectiveTotal <= 0}
                >
                  {paying ? (
                    <>
                      <Loader2 className="glow-spinner-sm" style={{ marginRight: 0 }} />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Check style={{ width: 16, height: 16 }} />
                      Confirmar cobro · {effectiveTotal.toFixed(2)}€
                    </>
                  )}
                </button>

                {onNavigateToCash && (
                  <button
                    className="ag-detail-action"
                    style={{
                      width: "100%",
                      marginTop: 8,
                      background: "transparent",
                      border: "none",
                      color: "var(--ag-muted)",
                      fontSize: 12.5,
                      fontWeight: 600,
                      padding: 8,
                    }}
                    onClick={() => {
                      sessionStorage.setItem(
                        "pendingChargeBooking",
                        JSON.stringify({
                          id: paySheetBooking.id,
                          customer_name: paySheetBooking.customer_name,
                          stylist: paySheetBooking.stylist,
                          services: paySheetBooking.services,
                          fecha: paySheetBooking.Fecha,
                          hora: paySheetBooking.Hora,
                        }),
                      );
                      setPaySheetBooking(null);
                      onNavigateToCash();
                    }}
                    disabled={paying}
                  >
                    Opciones avanzadas (descuento, propina, mixto)
                  </button>
                )}
              </div>
            </div>
          );
        })()}

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

      {/* Quitar bloqueo desde la agenda */}
      <AlertDialog
        open={!!unblockTarget}
        onOpenChange={(open) => {
          if (!open && !unblocking) setUnblockTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitar bloqueo</AlertDialogTitle>
            <AlertDialogDescription>
              {unblockTarget && (
                <>
                  {isFullDayBlocked(unblockTarget)
                    ? `Día completo · ${format(parseISO(unblockTarget.Fecha), "EEEE d 'de' MMMM", { locale: es })}`
                    : `${unblockTarget.Hora?.slice(0, 5)}–${unblockTarget.end_time?.slice(0, 5)} · ${format(parseISO(unblockTarget.Fecha), "EEEE d 'de' MMMM", { locale: es })}`}
                  {" · "}
                  {stylists.find((s) => s.slug === unblockTarget.stylist)?.name ||
                    unblockTarget.stylist}
                  {unblockGroupCount > 1 && (
                    <>
                      <br />
                      Este bloqueo forma parte de un grupo de {unblockGroupCount} (otros días o
                      profesionales).
                    </>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unblocking}>Cancelar</AlertDialogCancel>
            {unblockGroupCount > 1 && (
              <AlertDialogAction
                disabled={unblocking}
                className="bg-chip text-ink-2 hover:bg-surface-container-high"
                onClick={(e) => {
                  e.preventDefault();
                  performUnblock(true);
                }}
              >
                Todo el bloqueo ({unblockGroupCount})
              </AlertDialogAction>
            )}
            <AlertDialogAction
              disabled={unblocking}
              onClick={(e) => {
                e.preventDefault();
                performUnblock(false);
              }}
            >
              {unblockGroupCount > 1 ? "Solo este" : "Quitar bloqueo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
