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
  Sparkles,
  Plus,
  ChevronRight,
  Phone,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ServiceRow = {
  id: string;
  name: string;
  category: string | null;
  price: number | null;
  type: "Simple"|"Compuesto";
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
  initialTime: string; // "HH:mm"initialStylistSlug: string; stylists: Array<{ slug: string; name: string; color: string }>; onCreated: () => void; onMoreOptions?: (preset: { date: Date; time: string; stylistSlug: string; clientName?: string; services?: ServiceRow[]; }) => void;
} const TIME_SLOTS_15 = Array.from({ length: 24 * 4 }, (_, i) => { const h = Math.floor(i / 4); const m = (i % 4) * 15; return `${String(h).padStart(2,"0")}:${String(m).padStart(2, "0")}`;
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
  const [clientPhone, setClientPhone] = useState("");
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
      setClientPhone("");
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
        phone: clientPhone.trim() || selectedClient?.phone?.trim() || undefined,
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
      if (!force && (reason === "conflict"|| reason ==="no_stylist_available"|| /solap|ya tiene una cita/i.test(description))) { setConflictPrompt({ message: description }); return; } toast({ title:"Error",
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
        className="h-[92vh] flex flex-col p-0 rounded-t-[28px] border-t-0 bg-background/95 backdrop-blur-xl"style={{ boxShadow:"0 -8px 40px -12px rgba(20,22,40,.28)" }}
      >
        {/* Drag handle + header */}
        <div className="shrink-0 pt-2.5 px-5 pb-4 border-b border-line">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-outline/25 mb-4" />
          <SheetHeader className="text-left space-y-3">
            <SheetTitle className="flex items-center gap-2.5 text-[20px] font-bold tracking-[-0.02em] text-ink-2">
              <span className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center flex-none">
                <Sparkles className="h-[18px] w-[18px] text-white" />
              </span>
              Cita rápida
            </SheetTitle>
            <div className="flex flex-wrap gap-2">
              {/* Date chip */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="inline-flex items-center gap-1.5 rounded-full bg-chip text-ink-2 px-3.5 py-2 text-[13px] font-semibold active:scale-95 transition">
                    <CalendarIcon className="h-4 w-4 text-primary"/> {format(date,"EEE d MMM", { locale: es })}
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
                  <button className="inline-flex items-center gap-1.5 rounded-full bg-chip text-ink-2 px-3.5 py-2 text-[13px] font-semibold tabular-nums active:scale-95 transition">
                    <Clock className="h-4 w-4 text-primary" />
                    {time}
                    {endTime && <span className="text-outline">– {format(endTime, "HH:mm")}</span>}
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
                      className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold active:scale-95 transition"style={{ backgroundColor: `${currentStylist?.color ||"#6366f1"}15`,
                        color: currentStylist?.color || "#6366f1",
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-none"style={{ background: currentStylist?.color ||"#6366f1"}} /> {currentStylist?.name ||"Profesional"}
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
              <label className="text-[13px] font-semibold text-ink-2">
                Cliente
              </label>
              {selectedClient && (
                <button
                  onClick={() => {
                    setSelectedClient(null);
                    setClientQuery("");
                  }}
                  className="text-[13px] font-medium text-primary active:opacity-60"
                >
                  Cambiar
                </button>
              )}
            </div>

            {selectedClient ? (
              <div className="rounded-2xl bg-surface border border-line overflow-hidden">
                <div className="flex items-center gap-3 p-3.5">
                  <div className="h-11 w-11 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold flex-none">
                    {selectedClient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] text-ink-2 truncate tracking-[-0.01em]">
                      {selectedClient.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[12px] text-outline">
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
                {/* Teléfono del cliente ya existente */}
                <div className="flex items-center gap-2.5 px-3.5 py-3 border-t border-line">
                  <Phone className="h-4 w-4 text-outline flex-none" />
                  <input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    inputMode="tel"
                    placeholder="Añadir teléfono"
                    className="flex-1 min-w-0 bg-transparent text-[15px] text-ink-2 placeholder:text-outline/70 outline-none tabular-nums"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-surface border border-line overflow-hidden">
                {/* Nombre */}
                <div className="relative flex items-center gap-2.5 px-3.5 py-3">
                  <Search className="h-4 w-4 text-outline flex-none" />
                  <input
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    onFocus={() => clientResults.length > 0 && setShowClientResults(true)}
                    placeholder="Buscar o escribir nombre"
                    className="flex-1 min-w-0 bg-transparent text-[15px] text-ink-2 placeholder:text-outline/70 outline-none"
                  />
                  {clientSearching && <Loader2 className="h-4 w-4 animate-spin text-outline flex-none" />}

                  {showClientResults && clientResults.length > 0 && (
                    <div className="absolute z-30 top-full left-0 right-0 mt-2 bg-surface border border-line rounded-2xl shadow-soft max-h-64 overflow-y-auto">
                      {clientResults.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedClient(c);
                            setClientQuery(c.name);
                            setClientPhone(c.phone || "");
                            setShowClientResults(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 active:bg-chip text-left border-b border-line last:border-b-0 transition"
                        >
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-medium text-ink-2 truncate">{c.name}</p>
                            <div className="flex items-center gap-1.5 text-[12px] text-outline">
                              {c.phone && <span className="truncate tabular-nums">{c.phone}</span>}
                              {c.phone && <span>·</span>}
                              <span>{c.total_visits || 0} visitas</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Teléfono */}
                <div className="flex items-center gap-2.5 px-3.5 py-3 border-t border-line">
                  <Phone className="h-4 w-4 text-outline flex-none" />
                  <input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    inputMode="tel"
                    placeholder="Teléfono (opcional)"
                    className="flex-1 min-w-0 bg-transparent text-[15px] text-ink-2 placeholder:text-outline/70 outline-none tabular-nums"
                  />
                </div>
              </div>
            )}

            {!selectedClient &&
              clientQuery.trim().length >= 2 &&
              !clientSearching &&
              clientResults.length === 0 && (
                <p className="text-[12px] text-outline pl-1">
                  Se creará como cliente nuevo:{" "}
                  <span className="font-semibold text-ink-2">{clientQuery}</span>
                </p>
              )}
          </section>

          {/* Servicios */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-semibold text-ink-2">
                Servicios
              </label>
              {selectedServices.length > 0 && (
                <span className="text-[12px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full tabular-nums">
                  {totalDuration} min · {totalPrice.toFixed(0)}€
                </span>
              )}
            </div>

            {/* Seleccionados arriba, para no perderlos de vista */}
            {selectedServices.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedServices.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleService(s.id)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-brand text-white px-3 py-1.5 text-[13px] font-semibold active:scale-95 transition"
                  >
                    {s.name}
                    <X className="h-3.5 w-3.5 opacity-80" />
                  </button>
                ))}
              </div>
            )}

            {services.length > 8 && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-surface border border-line px-3.5 py-3">
                <Search className="h-4 w-4 text-outline flex-none" />
                <input
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  placeholder="Buscar servicio"
                  className="flex-1 min-w-0 bg-transparent text-[15px] text-ink-2 placeholder:text-outline/70 outline-none"
                />
                {serviceFilter && (
                  <button onClick={() => setServiceFilter("")} className="flex-none text-outline">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            <div className="space-y-4">
              {groupedServices.length === 0 && (
                <p className="text-[14px] text-outline text-center py-6">
                  Sin servicios. Crea uno en el catálogo.
                </p>
              )}
              {groupedServices.map(([cat, items]) => (
                <div key={cat} className="space-y-1.5">
                  <p className="text-[12px] font-semibold text-outline px-1">{cat}</p>
                  {/* Lista agrupada estilo iOS */}
                  <div className="rounded-2xl bg-surface border border-line overflow-hidden">
                    {items.map((s, i) => {
                      const dur =
                        s.duration_part1_active + s.duration_exposure_pause + s.duration_part2_active;
                      const active = selectedServiceIds.has(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleService(s.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3.5 py-3 text-left transition active:bg-chip",
                            i > 0 && "border-t border-line",
                            active && "bg-primary/5",
                          )}
                        >
                          {/* check circular iOS */}
                          <span
                            className={cn(
                              "w-[22px] h-[22px] rounded-full flex-none flex items-center justify-center transition",
                              active ? "bg-gradient-brand":"border-[1.5px] border-outline/40",
                            )}
                          >
                            {active && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span
                              className={cn(
                                "block text-[15px] truncate tracking-[-0.01em]",
                                active ? "font-semibold text-ink-2":"font-medium text-ink-2",
                              )}
                            >
                              {s.name}
                            </span>
                          </span>
                          <span className="flex-none flex items-center gap-2 text-[13px] tabular-nums">
                            <span className="text-outline">{dur}m</span>
                            {s.price != null && (
                              <span className="font-semibold text-ink-2">{s.price}€</span>
                            )}
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
          className="shrink-0 border-t border-line px-5 pt-3.5 bg-background/95 backdrop-blur-xl"style={{ paddingBottom:"calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <div className="flex gap-2">
            {onMoreOptions && (
              <Button
                variant="outline"
                className="shrink-0 h-12 rounded-full border-line bg-chip text-ink-2 text-[14px] font-semibold active:scale-95"
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
              className="flex-1 h-12 rounded-full text-[15px] font-semibold bg-gradient-brand text-white border-0 hover:opacity-95 active:scale-[.98] transition disabled:opacity-40"style={{ boxShadow:"0 8px 22px -10px rgba(34,64,140,.6)" }}
              disabled={!canSubmit}
              onClick={handleCreate}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-[18px] w-[18px] mr-1.5"/> Crear cita </> )} </Button> </div> </div> </SheetContent> <AlertDialog open={!!conflictPrompt} onOpenChange={(o) => !o && setConflictPrompt(null)}> <AlertDialogContent> <AlertDialogHeader> <AlertDialogTitle>Hora ocupada</AlertDialogTitle> <AlertDialogDescription> {conflictPrompt?.message ||"Esa hora se solapa con otra cita."} ¿Quieres crearla de
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
              {submitting ? <Loader2 className="h-4 w-4 animate-spin"/> :"Crear igualmente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
};
