import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceSelection } from "./ServiceSelection";
import { StylistSelection } from "./StylistSelection";
import { DateTimeSelection } from "./DateTimeSelection";
import { BookingConfirmation } from "./BookingConfirmation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export type Service = {
  id: string;
  name: string;
  type: 'Simple' | 'Compuesto';
  duration_part1_active: number;
  duration_exposure_pause: number;
  duration_part2_active: number;
  category: string;
  // Computed field for total duration
  duration: number;
};

export type Stylist = "cris" | "desi" | "any";

export type BookingData = {
  services: Service[];
  stylist: Stylist | null;
  date: Date | null;
  time: string | null;
  name: string;
  phone: string;
};

export const BookingFlow = () => {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const bookingRef = useRef<HTMLElement>(null);
  const [bookingData, setBookingData] = useState<BookingData>({
    services: [],
    stylist: null,
    date: null,
    time: null,
    name: "",
    phone: "",
  });

  // Check authentication status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load services from database
  useEffect(() => {
    const loadServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (error) throw error;

        // Transform data to include computed duration field
        const transformedServices: Service[] = (data || []).map(service => ({
          id: service.id,
          name: service.name,
          type: service.type as 'Simple' | 'Compuesto',
          duration_part1_active: service.duration_part1_active,
          duration_exposure_pause: service.duration_exposure_pause,
          duration_part2_active: service.duration_part2_active,
          category: service.category || 'Otros',
          duration: service.duration_part1_active + service.duration_exposure_pause + service.duration_part2_active,
        }));

        setServices(transformedServices);
      } catch (error) {
        console.error('Error loading services:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los servicios",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [toast]);

  const totalDuration = bookingData.services.reduce((sum, service) => sum + service.duration, 0);

  const handleServicesSelect = (services: Service[]) => {
    // Check if user is logged in before proceeding
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para continuar con la reserva",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    setBookingData({ ...bookingData, services });
    setStep(2);
    // Scroll to top of booking section when moving to stylist selection
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleStylistSelect = (stylist: Stylist) => {
    setBookingData({ ...bookingData, stylist });
    setStep(3);
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDateTimeSelect = (date: Date, time: string) => {
    setBookingData({ ...bookingData, date, time });
    setStep(4);
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleConfirmBooking = (name: string, phone: string) => {
    setBookingData({ ...bookingData, name, phone });
    // Here you would send the booking to the backend
    console.log("Booking confirmed:", { ...bookingData, name, phone });
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <section ref={bookingRef} className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Reserva tu Cita
          </h2>
          <p className="text-lg text-muted-foreground">
            Sigue los pasos para reservar tu cita de forma rápida y sencilla
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          {/* Progress indicator */}
          <div className="mb-8 flex justify-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-2 w-16 rounded-full transition-colors ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>
                {step === 1 && "Selecciona tus servicios"}
                {step === 2 && "Elige tu peluquera"}
                {step === 3 && "Selecciona fecha y hora"}
                {step === 4 && "Confirma tu reserva"}
              </CardTitle>
              <CardDescription>
                {step === 1 && (
                  <div>
                    <p>Puedes seleccionar varios servicios</p>
                    {!user && (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 mt-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm">
                          Debes <Link to="/auth" className="underline hover:text-amber-700 dark:hover:text-amber-400">iniciar sesión</Link> para continuar
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {step === 2 && "Elige quien te atenderá o deja que decidamos nosotras"}
                {step === 3 && `Duración total: ${totalDuration} minutos`}
                {step === 4 && "Últimos detalles para completar tu reserva"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 1 && !loading && (
                <ServiceSelection
                  services={services}
                  selectedServices={bookingData.services}
                  onNext={handleServicesSelect}
                />
              )}
              {step === 1 && loading && (
                <div className="text-center py-8 text-muted-foreground">
                  Cargando servicios...
                </div>
              )}
              {step === 2 && (
                <StylistSelection
                  selectedStylist={bookingData.stylist}
                  onNext={handleStylistSelect}
                  onBack={handleBack}
                />
              )}
              {step === 3 && (
                <DateTimeSelection
                  selectedDate={bookingData.date}
                  selectedTime={bookingData.time}
                  totalDuration={totalDuration}
                  services={bookingData.services}
                  stylist={bookingData.stylist!}
                  onNext={handleDateTimeSelect}
                  onBack={handleBack}
                />
              )}
              {step === 4 && (
                <BookingConfirmation
                  bookingData={bookingData}
                  totalDuration={totalDuration}
                  onConfirm={handleConfirmBooking}
                  onBack={handleBack}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
