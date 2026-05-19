import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ServiceSelection } from "@/components/booking/ServiceSelection";
import { DateTimeSelection } from "@/components/booking/DateTimeSelection";
import { RecurrenceSelector, RecurrenceConfig } from "@/components/admin/RecurrenceSelector";
import { Loader2, UserCircle, AtSign, Check } from "lucide-react";
import { Service, Stylist } from "@/types/booking";
import { GuidedStep } from "@/components/guided/GuidedStep";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const STEP_TITLES = [
  "Selecciona los servicios",
  "Selecciona fecha y hora",
  "Datos del cliente",
] as const;

const STEP_DESCRIPTIONS = [
  "Puedes seleccionar varios servicios",
  "Elige el día y la hora libre",
  "Últimos detalles para crear la cita",
] as const;

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface ClientRecord {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  tags: string[];
  total_visits: number;
  total_spent: number;
}

interface AdminBookingData {
  services: Service[];
  stylist: Stylist | null;
  date: Date | null;
  time: string;
  customerName: string;
  customerUsername: string;
  selectedUser: UserProfile | null;
  selectedClient: ClientRecord | null;
  skipAvailabilityCheck?: boolean;
  recurrence: RecurrenceConfig;
}

interface AdminBookingFlowProps {
  onComplete: () => void;
  onCancel: () => void;
  tenantId: string;
}

export const AdminBookingFlow = ({ onComplete, onCancel, tenantId }: AdminBookingFlowProps) => {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [tenantStylists, setTenantStylists] = useState<Array<{ slug: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Client autocomplete state
  const [clientSearchResults, setClientSearchResults] = useState<ClientRecord[]>([]);
  const [showClientResults, setShowClientResults] = useState(false);
  const [clientSearching, setClientSearching] = useState(false);

  const [bookingData, setBookingData] = useState<AdminBookingData>({
    services: [],
    stylist: "any" as Stylist,
    date: null,
    time: "",
    customerName: "",
    customerUsername: "",
    selectedUser: null,
    selectedClient: null,
    recurrence: {
      enabled: false,
      intervalValue: 2,
      intervalUnit: "weeks",
      occurrences: 4,
    },
  });
  const { toast } = useToast();

  // Real-time search for clients as admin types the name
  useEffect(() => {
    const searchClients = async () => {
      const term = bookingData.customerName.trim();
      if (term.length < 2 || bookingData.selectedClient) {
        setClientSearchResults([]);
        setShowClientResults(false);
        return;
      }

      setClientSearching(true);
      try {
        const { data, error } = await supabase
          .from("clients" as any)
          .select("id, name, phone, email, tags, total_visits, total_spent")
          .eq("tenant_id", tenantId)
          .ilike("name", `%${term}%`)
          .neq("is_blocked", true)
          .limit(8);

        if (error) throw error;
        setClientSearchResults((data || []) as unknown as ClientRecord[]);
        setShowClientResults((data || []).length > 0);
      } catch (error) {
        console.error("Error searching clients:", error);
        setClientSearchResults([]);
      } finally {
        setClientSearching(false);
      }
    };

    const debounce = setTimeout(searchClients, 250);
    return () => clearTimeout(debounce);
  }, [bookingData.customerName, bookingData.selectedClient, tenantId]);

  // Real-time search for users as admin types @username
  useEffect(() => {
    const searchUsers = async () => {
      const term = searchUsername.trim();
      if (term.length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setSearching(true);
      try {
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .or(`username.ilike.%${term}%,full_name.ilike.%${term}%`)
          .limit(10);

        if (error) throw error;
        setSearchResults(profiles || []);
        setShowResults(true);
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchUsername]);

  const handleSelectClient = (client: ClientRecord) => {
    setBookingData((prev) => ({
      ...prev,
      customerName: client.name,
      selectedClient: client,
    }));
    setShowClientResults(false);
    setClientSearchResults([]);
  };

  const handleClearClient = () => {
    setBookingData((prev) => ({
      ...prev,
      selectedClient: null,
    }));
  };

  const handleSelectUser = (profile: UserProfile) => {
    setBookingData((prev) => ({
      ...prev,
      customerName: prev.customerName || profile.full_name || profile.username || "",
      customerUsername: profile.username || "",
      selectedUser: profile,
    }));
    setSearchUsername(profile.username || profile.full_name || "");
    setShowResults(false);
    setSearchResults([]);
  };

  useEffect(() => {
    fetchServices();
    supabase
      .from("tenant_stylists")
      .select("slug, name")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .then(({ data }) => {
        if (data) setTenantStylists(data as Array<{ slug: string; name: string }>);
      });
  }, [tenantId]);

  const fetchServices = async () => {
    const { data, error } = await supabase.from("services").select("*").eq("tenant_id", tenantId).order("name");

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios",
        variant: "destructive",
      });
      return;
    }

    const servicesWithDuration = (data || []).map((service) => ({
      ...service,
      type: service.type as "Simple" | "Compuesto",
      duration: service.duration_part1_active + service.duration_exposure_pause + service.duration_part2_active,
    }));

    setServices(servicesWithDuration);
  };

  const totalDuration = bookingData.services.reduce(
    (sum, service) =>
      sum + service.duration_part1_active + service.duration_exposure_pause + service.duration_part2_active,
    0,
  );

  const progressRef = useRef<HTMLDivElement>(null);
  const scrollToProgress = () => {
    progressRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleServicesSelect = (selectedServices: Service[]) => {
    setBookingData({ ...bookingData, services: selectedServices });
    setStep(2);
    scrollToProgress();
  };

  const handleDateTimeSelect = (
    date: Date,
    time: string,
    resolvedStylist?: Stylist,
    skipAvailabilityCheck?: boolean,
  ) => {
    const finalStylist = resolvedStylist || bookingData.stylist;
    setBookingData({ ...bookingData, date, time, stylist: finalStylist, skipAvailabilityCheck });
    setStep(3);
    scrollToProgress();
  };

  const handleConfirmBooking = async () => {
    if (!bookingData.customerName.trim()) {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive",
      });
      return;
    }

    const skipAvailabilityCheck = bookingData.skipAvailabilityCheck || false;

    try {
      setLoading(true);

      const bookingPayload = {
        customer_name: bookingData.customerName,
        username: bookingData.customerUsername || null,
        user_id: bookingData.selectedUser?.id || null,
        services: bookingData.services.map((s) => ({
          id: s.id,
          name: s.name,
          duration_part1_active: s.duration_part1_active,
          duration_exposure_pause: s.duration_exposure_pause,
          duration_part2_active: s.duration_part2_active,
          type: s.type,
        })),
        date: `${bookingData.date!.getFullYear()}-${String(bookingData.date!.getMonth() + 1).padStart(2, "0")}-${String(bookingData.date!.getDate()).padStart(2, "0")}`,
        time: bookingData.time,
        stylist: bookingData.stylist,
        total_duration: totalDuration,
        skipAvailabilityCheck,
        tenant_id: tenantId,
        canal: "crm" as const,
        recurrence: bookingData.recurrence.enabled
          ? {
              intervalValue: bookingData.recurrence.intervalValue,
              intervalUnit: bookingData.recurrence.intervalUnit,
              occurrences: bookingData.recurrence.occurrences,
            }
          : null,
      };

      const { data, error } = await supabase.functions.invoke("create-booking", {
        body: bookingPayload,
      });

      if (error) throw error;

      const totalCreated = data?.bookings?.length || 1;
      const message = bookingData.recurrence.enabled
        ? `Se han creado ${totalCreated} citas recurrentes`
        : "La cita se ha creado correctamente";

      toast({
        title: "¡Cita creada!",
        description: message,
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear la cita",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onCancel();
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col">
        {/* Header */}
        <div className="mb-4 pr-8">
          <h2 className="text-lg sm:text-xl font-bold text-foreground">{STEP_TITLES[step - 1]}</h2>
          <p className="text-sm text-muted-foreground mt-1">{STEP_DESCRIPTIONS[step - 1]}</p>
        </div>

        {/* Progress bar (mirror public booking) */}
        <div ref={progressRef} className="mb-6 space-y-3 max-w-3xl mx-auto w-full scroll-mt-4">
          <div className="flex justify-between items-center text-sm text-muted-foreground px-1">
            <span className={cn("transition-colors duration-300", step >= 1 && "text-primary font-medium")}>Servicios</span>
            <span className={cn("transition-colors duration-300", step >= 2 && "text-primary font-medium")}>Fecha y hora</span>
            <span className={cn("transition-colors duration-300", step >= 3 && "text-primary font-medium")}>Confirmar</span>
          </div>
          <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-700 ease-out shadow-glow"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
          <div className="text-center">
            <span className="text-xs text-muted-foreground">
              Paso {step} de 3 ({Math.round((step / 3) * 100)}% completado)
            </span>
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && (
          <GuidedStep isActive>
            <ServiceSelection services={services} selectedServices={bookingData.services} onNext={handleServicesSelect} />
          </GuidedStep>
        )}

        {step === 2 && (
          <GuidedStep isActive>
            <DateTimeSelection
              selectedDate={bookingData.date}
              selectedTime={bookingData.time}
              totalDuration={totalDuration}
              services={bookingData.services}
              stylist="any"
              tenantId={tenantId}
              onNext={handleDateTimeSelect}
              onBack={handleBack}
              isAdmin={true}
            />
          </GuidedStep>
        )}

        {step === 3 && (
          <GuidedStep isActive>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Datos del cliente</h3>

              {/* Customer Name with Client Autocomplete */}
              <div className="space-y-2 relative">
                <Label htmlFor="customerName">Nombre completo</Label>
                <Input
                  id="customerName"
                  value={bookingData.customerName}
                  onChange={(e) => {
                    setBookingData({ ...bookingData, customerName: e.target.value, selectedClient: null });
                  }}
                  onFocus={() => clientSearchResults.length > 0 && setShowClientResults(true)}
                  placeholder="Escribe para buscar clientes..."
                />
                {clientSearching && (
                  <p className="text-xs text-muted-foreground">Buscando clientes...</p>
                )}

                {/* Selected client badge */}
                {bookingData.selectedClient && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                    <UserCircle className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{bookingData.selectedClient.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{bookingData.selectedClient.total_visits || 0} visitas</span>
                        <span>·</span>
                        <span>{(bookingData.selectedClient.total_spent || 0).toFixed(0)}€</span>
                        {bookingData.selectedClient.tags?.map(tag => (
                          <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleClearClient}>
                      <span className="sr-only">Desvincular cliente</span>×
                    </Button>
                  </div>
                )}

                {/* Client Search Results Dropdown */}
                {showClientResults && clientSearchResults.length > 0 && !bookingData.selectedClient && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border rounded-lg shadow-lg max-h-[250px] overflow-y-auto">
                    {clientSearchResults.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left border-b last:border-b-0"
                      >
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm shrink-0">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{client.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {client.phone && <span>{client.phone}</span>}
                            <span>{client.total_visits || 0} visitas</span>
                            <span>{(client.total_spent || 0).toFixed(0)}€</span>
                          </div>
                        </div>
                        {client.tags?.length > 0 && (
                          <div className="flex gap-1">
                            {client.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User @ search */}
              <div className="space-y-2 relative">
                <Label htmlFor="customerUsername">
                  <AtSign className="inline h-3.5 w-3.5 mr-1" />
                  Vincular cuenta (opcional)
                </Label>
                <Input
                  id="customerUsername"
                  type="text"
                  value={searchUsername}
                  onChange={(e) => {
                    setSearchUsername(e.target.value);
                    if (bookingData.selectedUser) {
                      setBookingData((prev) => ({ ...prev, selectedUser: null, customerUsername: "" }));
                    }
                  }}
                  onFocus={() => searchResults.length > 0 && setShowResults(true)}
                  placeholder="Buscar por nombre o @username"
                />
                {searching && <p className="text-xs text-muted-foreground">Buscando...</p>}
                <p className="text-xs text-muted-foreground">
                  {bookingData.selectedUser ? (
                    <span className="text-primary flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Vinculado: @{bookingData.selectedUser.username || bookingData.selectedUser.full_name}
                    </span>
                  ) : (
                    "Vincula la cita a un usuario registrado en la app"
                  )}
                </p>

                {/* User Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border rounded-lg shadow-lg max-h-[250px] overflow-y-auto">
                    {searchResults.map((profile) => (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => handleSelectUser(profile)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left border-b last:border-b-0"
                      >
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                            {(profile.full_name || profile.username || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{profile.full_name || profile.username || "Usuario"}</p>
                          {profile.username && (
                            <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Recurrence Options */}
              <RecurrenceSelector
                value={bookingData.recurrence}
                onChange={(recurrence) => setBookingData({ ...bookingData, recurrence })}
              />

              <div className="pt-4 border-t space-y-2">
                <h4 className="font-medium">Resumen de la cita:</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Servicios:</strong> {bookingData.services.map((s) => s.name).join(", ")}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Profesional:</strong>{" "}
                  {bookingData.stylist === "any"
                    ? "Siguiente disponible"
                    : tenantStylists.find((s) => s.slug === bookingData.stylist)?.name || bookingData.stylist}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Fecha y hora:</strong> {bookingData.date?.toLocaleDateString("es-ES")} a las{" "}
                  {bookingData.time}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Duración total:</strong> {totalDuration} minutos
                </p>
                {bookingData.recurrence.enabled && (
                  <p className="text-sm text-primary font-medium">
                    <strong>Repetición:</strong> Cada {bookingData.recurrence.intervalValue}{" "}
                    {bookingData.recurrence.intervalUnit === "days"
                      ? "días"
                      : bookingData.recurrence.intervalUnit === "weeks"
                        ? "semanas"
                        : "meses"}
                    , {bookingData.recurrence.occurrences} citas en total
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                Volver
              </Button>
              <Button onClick={handleConfirmBooking} disabled={loading} data-guided-cta="true">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : bookingData.recurrence.enabled ? (
                  `Crear ${bookingData.recurrence.occurrences} Citas`
                ) : (
                  "Crear Cita"
                )}
              </Button>
            </div>
          </div>
          </GuidedStep>
        )}

      </div>

      {/* Guided helper banner — same style as public booking */}
      <div
        className="sticky bottom-0 left-0 right-0 z-30 px-4 py-2.5 bg-background/90 backdrop-blur-xl border-t border-border flex items-center gap-2 rounded-b-lg"
        style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}
        role="status"
        aria-live="polite"
      >
        <span className="text-base shrink-0" aria-hidden>👉</span>
        <p className="text-xs sm:text-sm text-foreground/90 leading-snug">
          {step === 1 && <>Elige uno o varios servicios y pulsa <span className="font-semibold text-primary">Continuar</span>.</>}
          {step === 2 && <>Elige la profesional o "Siguiente disponible" para asignar automáticamente.</>}
          {step === 3 && <>Selecciona un día y luego una hora libre. Después pulsa <span className="font-semibold text-primary">Continuar</span>.</>}
          {step === 4 && <>Revisa los datos y pulsa <span className="font-semibold text-primary">Crear Cita</span> abajo.</>}
        </p>
      </div>
    </div>
  );
};
