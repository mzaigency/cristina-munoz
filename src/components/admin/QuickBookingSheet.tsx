import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addMinutes } from "date-fns";
import { es } from "date-fns/locale";
import {
  Loader2,
  UserCircle,
  Search,
  CalendarIcon,
  Clock,
  Scissors,
  Sparkles,
  Plus,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ServiceRow = {
  id: string;
  name: string;
  category: string | null;
  price: number | null;
  type: "Simple" | "Compuesto";
  duration_part1_active: number;
  duration_exposure_pause: number;
  duration_part2_active: number;
};

type ClientRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  tags: string[];
  total_visits: number;
  total_spent: number;
};

interface QuickBookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  initialDate: Date;
  initialTime: string; // "HH:mm"
  initialStylistSlug: string;
  stylists: Array<{ slug: string; name: string; color: string }>;
  onCreated: () => void;
  onMoreOptions?: (preset: {
    date: Date;
    time: string;
    stylistSlug: string;
    clientName?: string;
    services?: ServiceRow[];
  }) => void;
}

const TIME_SLOTS_15 = Array.from({ length: 24 * 4 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

export const QuickBookingSheet = ({
  open,
  onOpenChange,
  tenantId,
  initialDate,
  initialTime,
  initialStylistSlug,
  stylists,
  onCreated,
  onMoreOptions,
}: QuickBookingSheetProps) => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(initialDate);
  const [time, setTime] = useState<string>(initialTime);
  const [stylistSlug, setStylistSlug] = useState<string>(initialStylistSlug);

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [serviceFilter, setServiceFilter] = useState("");

  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState<ClientRow[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const [clientSearching, setClientSearching] = useState(false);
  const [showClientResults, setShowClientResults] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [conflictPrompt, setConflictPrompt] = useState<{ message: string } | null>(null);

  // Reset when sheet opens with new context
  useEffect(() => {
    if (open) {
      setDate(initialDate);
      setTime(initialTime);
      setStylistSlug(initialStylistSlug);
      setSelectedServiceIds(new Set());
      setSelectedClient(null);
      setClientQuery("");
      setServiceFilter("");
    }
  }, [open, initialDate, initialTime, initialStylistSlug]);

  // Load services
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("services")
        .select(
          "id, name, category, price, type, duration_part1_active, duration_exposure_pause, duration_part2_active",
        )
        .eq("tenant_id", tenantId)
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      setServices((data || []) as ServiceRow[]);
    })();
  }, [open, tenantId]);

  // Debounced client autocomplete
  useEffect(() => {
    if (!open) return;
    const term = clientQuery.trim();
    if (term.length < 2 || selectedClient) {
      setClientResults([]);
      setShowClientResults(false);
      return;
    }
    setClientSearching(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from("clients" as any)
          .select("id, name, phone, email, tags, total_visits, total_spent")
          .eq("tenant_id", tenantId)
          .ilike("name", `%${term}%`)
          .neq("is_blocked", true)
          .limit(6);
        setClientResults((data || []) as unknown as ClientRow[]);
        setShowClientResults(true);
      } finally {
        setClientSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [clientQuery, selectedClient, tenantId, open]);

  const selectedServices = useMemo(
    () => services.filter((s) => selectedServiceIds.has(s.id)),
    [services, selectedServiceIds],
  );

  const totalDuration = useMemo(
    () =>
      selectedServices.reduce(
        (sum, s) =>
          sum + s.duration_part1_active + s.duration_exposure_pause + s.duration_part2_active,
        0,
      ),
    [selectedServices],
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + (s.price || 0), 0),
    [selectedServices],
  );

  const endTime = useMemo(() => {
    if (!time || totalDuration === 0) return null;
    const [h, m] = time.split(":").map(Number);
    const start = new Date(date);
    start.setHours(h, m, 0, 0);
    return addMinutes(start, totalDuration);
  }, [date, time, totalDuration]);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const groupedServices = useMemo(() => {
    const filtered = serviceFilter
      ? services.filter((s) =>
          s.name.toLowerCase().includes(serviceFilter.toLowerCase()),
        )
      : services;
    const map = new Map<string, ServiceRow[]>();
    filtered.forEach((s) => {
      const cat = s.category || "Otros";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    });
    return Array.from(map.entries());
  }, [services, serviceFilter]);

  const currentStylist = stylists.find((s) => s.slug === stylistSlug);

  const canSubmit =
    !!clientQuery.trim() && selectedServices.length > 0 && !!time && !!stylistSlug && !submitting;

  const submitBooking = async (force: boolean) => {
    setSubmitting(true);
    try {
      const payload = {
        customer_name: selectedClient?.name || clientQuery.trim(),
        username: null,
        user_id: null,
        services: selectedServices.map((s) => ({
          id: s.id,
          name: s.name,
          duration_part1_active: s.duration_part1_active,
          duration_exposure_pause: s.duration_exposure_pause,
          duration_part2_active: s.duration_part2_active,
          type: s.type,
        })),
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
        time,
        stylist: stylistSlug,
        total_duration: totalDuration,
        skipAvailabilityCheck: force,
        tenant_id: tenantId,
        canal: "crm" as const,
        recurrence: null,
      };

      const { error } = await supabase.functions.invoke("create-booking", {
        body: payload,
      });
      if (error) throw error;

      toast({
        title: "¡Cita creada!",
        description: `${payload.customer_name} · ${format(date, "EEE d MMM", { locale: es })} · ${time}`,
      });
      setConflictPrompt(null);
      onCreated();
      onOpenChange(false);
    } catch (e: any) {
      let description = e?.message || "No se pudo crear la cita";
      let reason: string | undefined;
      try {
        const body = await e?.context?.json?.();
        if (body?.error) description = body.error;
        reason = body?.details?.reason;
      } catch {}

      // If conflict and we didn't force, ask the admin whether to overlap on purpose
      if (!force && (reason === "conflict" || reason === "no_stylist_available" || /solap|ya tiene una cita/i.test(description))) {
        setConflictPrompt({ message: description });
        return;
      }

      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async () => {
    if (!canSubmit) return;
    await submitBooking(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] flex flex-col p-0 rounded-t-3xl border-t bg-background/95 backdrop-blur-xl"
      >
        {/* Drag handle + header */}
        <div className="shrink-0 pt-2 px-5 pb-3 border-b border-border/40">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-muted-foreground/30 mb-3" />
          <SheetHeader className="text-left space-y-1">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Cita rápida
            </SheetTitle>
            <div className="flex flex-wrap gap-1.5">
              {/* Date chip */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium hover:bg-primary/15 transition">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {format(date, "EEE d MMM", { locale: es })}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              {/* Time chip */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium hover:bg-primary/15 transition">
                    <Clock className="h-3.5 w-3.5" />
                    {time}
                    {endTime && (
                      <span className="text-primary/60">
                        – {format(endTime, "HH:mm")}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-1 max-h-72 overflow-y-auto" align="start">
                  <div className="grid grid-cols-2 gap-1">
                    {TIME_SLOTS_15.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTime(t)}
                        className={cn(
                          "px-2 py-1.5 text-xs rounded-md hover:bg-muted transition",
                          t === time && "bg-primary text-primary-foreground",
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Stylist chip */}
              {stylists.length > 1 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition"
                      style={{
                        backgroundColor: `${currentStylist?.color || "#6366f1"}15`,
                        color: currentStylist?.color || "#6366f1",
                      }}
                    >
                      <UserCircle className="h-3.5 w-3.5" />
                      {currentStylist?.name || "Profesional"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-1" align="start">
                    {stylists.map((s) => (
                      <button
                        key={s.slug}
                        onClick={() => setStylistSlug(s.slug)}
                        className={cn(
                          "w-full text-left px-2.5 py-2 text-sm rounded-md hover:bg-muted transition flex items-center gap-2",
                          s.slug === stylistSlug && "bg-muted",
                        )}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.name}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </SheetHeader>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Cliente */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cliente
              </label>
              {selectedClient && (
                <button
                  onClick={() => {
                    setSelectedClient(null);
                    setClientQuery("");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cambiar
                </button>
              )}
            </div>

            {selectedClient ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold">
                  {selectedClient.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{selectedClient.name}</p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{selectedClient.total_visits || 0} visitas</span>
                    <span>·</span>
                    <span>{(selectedClient.total_spent || 0).toFixed(0)}€</span>
                    {selectedClient.tags?.slice(0, 1).map((t) => (
                      <Badge key={t} variant="outline" className="text-[9px] px-1 py-0">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={clientQuery}
                  onChange={(e) => setClientQuery(e.target.value)}
                  onFocus={() => clientResults.length > 0 && setShowClientResults(true)}
                  placeholder="Buscar cliente o escribir nombre nuevo..."
                  className="pl-9 h-11 rounded-xl"
                />
                {clientSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}

                {showClientResults && clientResults.length > 0 && (
                  <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-card border rounded-xl shadow-lg max-h-64 overflow-y-auto">
                    {clientResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedClient(c);
                          setClientQuery(c.name);
                          setShowClientResults(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted text-left border-b last:border-b-0 transition"
                      >
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            {c.phone && <span className="truncate">{c.phone}</span>}
                            <span>·</span>
                            <span>{c.total_visits || 0} visitas</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {clientQuery.trim().length >= 2 &&
                  !clientSearching &&
                  clientResults.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1.5 pl-1">
                      Nuevo cliente: <span className="font-medium text-foreground">{clientQuery}</span>
                    </p>
                  )}
              </div>
            )}
          </section>

          {/* Servicios */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Servicios
              </label>
              {selectedServices.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {totalDuration} min · {totalPrice.toFixed(0)}€
                </span>
              )}
            </div>

            {services.length > 8 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  placeholder="Filtrar servicios..."
                  className="pl-8 h-9 rounded-lg text-sm"
                />
              </div>
            )}

            <div className="space-y-3">
              {groupedServices.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin servicios. Crea uno en el catálogo.
                </p>
              )}
              {groupedServices.map(([cat, items]) => (
                <div key={cat} className="space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wide px-0.5">
                    {cat}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((s) => {
                      const dur =
                        s.duration_part1_active + s.duration_exposure_pause + s.duration_part2_active;
                      const active = selectedServiceIds.has(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleService(s.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
                            active
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-card hover:bg-muted border-border/60",
                          )}
                        >
                          <Scissors className="h-3 w-3" />
                          <span>{s.name}</span>
                          <span className={cn("text-[10px]", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                            {dur}m
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sticky footer */}
        <div
          className="shrink-0 border-t border-border/40 px-5 pt-3 bg-background/95 backdrop-blur-xl"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <div className="flex gap-2">
            {onMoreOptions && (
              <Button
                variant="outline"
                className="shrink-0"
                onClick={() =>
                  onMoreOptions({
                    date,
                    time,
                    stylistSlug,
                    clientName: clientQuery.trim() || undefined,
                    services: selectedServices,
                  })
                }
              >
                Más opciones
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            <Button
              className="flex-1 h-11 rounded-xl text-sm font-semibold"
              disabled={!canSubmit}
              onClick={handleCreate}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Crear cita
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>

      <AlertDialog open={!!conflictPrompt} onOpenChange={(o) => !o && setConflictPrompt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hora ocupada</AlertDialogTitle>
            <AlertDialogDescription>
              {conflictPrompt?.message || "Esa hora se solapa con otra cita."} ¿Quieres crearla de
              todos modos? Quedará solapada en la agenda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={(e) => {
                e.preventDefault();
                submitBooking(true);
              }}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear igualmente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
};
