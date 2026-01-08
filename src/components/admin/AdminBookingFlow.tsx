import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ServiceSelection } from "@/components/booking/ServiceSelection";
import { StylistSelection } from "@/components/booking/StylistSelection";
import { DateTimeSelection } from "@/components/booking/DateTimeSelection";
import { RecurrenceSelector, RecurrenceConfig } from "@/components/admin/RecurrenceSelector";
import { Loader2 } from "lucide-react";
import { Service, Stylist } from "@/types/booking";

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface AdminBookingData {
  services: Service[];
  stylist: Stylist | null;
  date: Date | null;
  time: string;
  customerName: string;
  customerUsername: string;
  selectedUser: UserProfile | null;
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
  const [loading, setLoading] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [bookingData, setBookingData] = useState<AdminBookingData>({
    services: [],
    stylist: null,
    date: null,
    time: "",
    customerName: "",
    customerUsername: "",
    selectedUser: null,
    recurrence: {
      enabled: false,
      intervalValue: 2,
      intervalUnit: "weeks",
      occurrences: 4,
    },
  });
  const { toast } = useToast();

  // Real-time search for users as admin types
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

  const handleSelectUser = (profile: UserProfile) => {
    setBookingData((prev) => ({
      ...prev,
      customerName: profile.full_name || profile.username || "",
      customerUsername: profile.username || "",
      selectedUser: profile,
    }));
    setSearchUsername(profile.username || profile.full_name || "");
    setShowResults(false);
    setSearchResults([]);
  };

  useEffect(() => {
    fetchServices();
  }, []);

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

    // Add computed duration field and type cast
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

  const handleServicesSelect = (selectedServices: Service[]) => {
    setBookingData({ ...bookingData, services: selectedServices });
    setStep(2);
  };

  const handleStylistSelect = (stylist: Stylist) => {
    setBookingData({ ...bookingData, stylist });
    setStep(3);
  };

  const handleDateTimeSelect = (
    date: Date,
    time: string,
    resolvedStylist?: Stylist,
    skipAvailabilityCheck?: boolean,
  ) => {
    // If a resolved stylist is provided (from 'any' selection), use it instead
    const finalStylist = resolvedStylist || bookingData.stylist;
    setBookingData({ ...bookingData, date, time, stylist: finalStylist, skipAvailabilityCheck });
    setStep(4);
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

    // Determine if we should skip availability checks
    // This is set in DateTimeSelection when admin uses custom time
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
        // Format date in local timezone to avoid timezone issues
        date: `${bookingData.date!.getFullYear()}-${String(bookingData.date!.getMonth() + 1).padStart(2, "0")}-${String(bookingData.date!.getDate()).padStart(2, "0")}`,
        time: bookingData.time,
        stylist: bookingData.stylist,
        total_duration: totalDuration,
        skipAvailabilityCheck, // Pass the flag to skip validations
        tenant_id: tenantId,
        canal: "crm" as const, // Reservas desde el CRM
        // Recurrence configuration
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
    <Card className="w-full max-w-4xl mx-auto">
      <div className="p-6">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  s <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Servicios</span>
            <span>Peluquera</span>
            <span>Fecha/Hora</span>
            <span>Contacto</span>
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && (
          <ServiceSelection services={services} selectedServices={bookingData.services} onNext={handleServicesSelect} />
        )}

        {step === 2 && (
          <StylistSelection selectedStylist={bookingData.stylist} onNext={handleStylistSelect} onBack={handleBack} />
        )}

        {step === 3 && (
          <DateTimeSelection
            selectedDate={bookingData.date}
            selectedTime={bookingData.time}
            totalDuration={totalDuration}
            services={bookingData.services}
            stylist={bookingData.stylist!}
            tenantId={tenantId}
            onNext={handleDateTimeSelect}
            onBack={handleBack}
            isAdmin={true}
          />
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Datos del cliente</h3>

              <div className="space-y-2">
                <Label htmlFor="customerName">Nombre completo</Label>
                <Input
                  id="customerName"
                  value={bookingData.customerName}
                  onChange={(e) => setBookingData({ ...bookingData, customerName: e.target.value })}
                  placeholder="Nombre del cliente"
                />
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="customerUsername">Usuario (opcional)</Label>
                <Input
                  id="customerUsername"
                  type="text"
                  value={searchUsername}
                  onChange={(e) => {
                    setSearchUsername(e.target.value);
                    // Clear selected user if typing again
                    if (bookingData.selectedUser) {
                      setBookingData((prev) => ({ ...prev, selectedUser: null, customerUsername: "" }));
                    }
                  }}
                  onFocus={() => searchResults.length > 0 && setShowResults(true)}
                  placeholder="Buscar por nombre o @username"
                />
                {searching && <p className="text-xs text-muted-foreground">Buscando...</p>}
                <p className="text-xs text-muted-foreground">
                  {bookingData.selectedUser
                    ? `Usuario vinculado: @${bookingData.selectedUser.username || bookingData.selectedUser.full_name}`
                    : "Vincula la cita a un usuario registrado"}
                </p>

                {/* Search Results Dropdown */}
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
                  <strong>Peluquera:</strong>{" "}
                  {bookingData.stylist === "any" ? "Cualquiera" : bookingData.stylist === "cris" ? "Cris" : "Desi"}
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
              <Button onClick={handleConfirmBooking} disabled={loading}>
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
        )}
      </div>
    </Card>
  );
};
