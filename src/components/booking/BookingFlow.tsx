import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceSelection } from "./ServiceSelection";
import { StylistSelection } from "./StylistSelection";
import { DateTimeSelection } from "./DateTimeSelection";
import { BookingConfirmation } from "./BookingConfirmation";
import { BookingSummaryMobile } from "./BookingSummaryMobile";
import { PromoCodeInput } from "./PromoCodeInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { User } from "lucide-react";
import { SmoothTitle } from "@/components/animations/SmoothTitle";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Service, Stylist, BookingData, Promotion, ServicePackage } from "@/types/booking";

interface BookingFlowProps {
  tenantId?: string;
}

export const BookingFlow = ({ tenantId }: BookingFlowProps) => {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
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
    appliedPromotion: null,
    packageId: null,
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

  // Load services and packages from database
  useEffect(() => {
    const loadData = async () => {
      try {
        const query = supabase
          .from('services')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        // Filter by tenant if provided
        if (tenantId) {
          query.eq('tenant_id', tenantId);
        }

        const { data, error } = await query;

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
          price: service.price,
        }));

        setServices(transformedServices);

        // Load packages if tenant
        if (tenantId) {
          const { data: packagesData } = await supabase
            .from('service_packages')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('is_active', true);
          
          setPackages((packagesData || []) as unknown as ServicePackage[]);
        }
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

    loadData();
  }, [toast, tenantId]);

  const totalDuration = bookingData.services.reduce((sum, service) => sum + service.duration, 0);

  // Calculate prices
  const { totalPrice, discountedPrice } = useMemo(() => {
    let total = 0;
    
    // If using a package, use package price
    if (bookingData.packageId) {
      const pkg = packages.find(p => p.id === bookingData.packageId);
      total = pkg?.package_price || 0;
    } else {
      // Sum individual service prices
      total = bookingData.services.reduce((sum, s) => sum + (s.price || 0), 0);
    }

    let discounted = total;

    // Apply promotion if exists
    if (bookingData.appliedPromotion) {
      const promo = bookingData.appliedPromotion;
      if (promo.discount_type === 'percentage') {
        discounted = total - (total * promo.discount_value / 100);
      } else {
        discounted = Math.max(0, total - promo.discount_value);
      }
    }

    return { totalPrice: total, discountedPrice: discounted };
  }, [bookingData.services, bookingData.packageId, bookingData.appliedPromotion, packages]);

  const handleServicesSelect = (services: Service[], packageId?: string) => {
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
    
    setBookingData({ ...bookingData, services, packageId: packageId || null });
    setStep(2);
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleStylistSelect = (stylist: Stylist) => {
    setBookingData({ ...bookingData, stylist });
    setStep(3);
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDateTimeSelect = (date: Date, time: string, resolvedStylist?: Stylist) => {
    const finalStylist = resolvedStylist || bookingData.stylist;
    setBookingData({ ...bookingData, date, time, stylist: finalStylist });
    setStep(4);
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleConfirmBooking = (name: string, phone: string) => {
    setBookingData({ ...bookingData, name, phone });
  };

  const handleApplyPromotion = (promotion: Promotion | null) => {
    setBookingData({ ...bookingData, appliedPromotion: promotion });
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleRemoveService = (serviceId: string) => {
    const updatedServices = bookingData.services.filter(s => s.id !== serviceId);
    setBookingData({ ...bookingData, services: updatedServices, packageId: null });
  };

  return (
    <section ref={bookingRef} className={cn("py-20 relative overflow-hidden", bookingData.services.length > 0 && "pb-32 lg:pb-20")}>
      {/* Decorative background */}
      <div className="absolute inset-0 gradient-radial pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-56 h-56 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-12 text-center">
          <SmoothTitle>
            <h2 className="mb-4 text-3xl md:text-4xl font-bold text-foreground">
              Reserva tu Cita
            </h2>
          </SmoothTitle>
          <div className="line-accent mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">
            Sigue los pasos para reservar tu cita de forma rápida y sencilla
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          {/* Enhanced Progress Bar */}
          <div className="mb-8 space-y-3 max-w-3xl mx-auto">
            <div className="flex justify-between items-center text-sm text-muted-foreground px-1">
              <span className={cn("transition-colors duration-300", step >= 1 && "text-primary font-medium")}>Servicios</span>
              <span className={cn("transition-colors duration-300", step >= 2 && "text-primary font-medium")}>Peluquera</span>
              <span className={cn("transition-colors duration-300", step >= 3 && "text-primary font-medium")}>Fecha</span>
              <span className={cn("transition-colors duration-300", step >= 4 && "text-primary font-medium")}>Confirmar</span>
            </div>
            <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-700 ease-out shadow-glow"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
            <div className="text-center">
              <span className="text-xs text-muted-foreground">
                Paso {step} de 4 ({Math.round((step / 4) * 100)}% completado)
              </span>
            </div>
          </div>

          {/* Main Form - Centered */}
          <div className="max-w-3xl mx-auto w-full">
            <Card className="border-none card-elevated glass">
              <CardHeader>
                <CardTitle className="animate-fade-in">
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
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 mt-2 animate-fade-in">
                          <User className="h-4 w-4" />
                          <span className="text-sm">
                            Debes <Link to="/auth" className="underline hover:text-amber-700 dark:hover:text-amber-400 transition-colors">iniciar sesión</Link> para continuar
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
              <CardContent className="overflow-hidden">
                <AnimatePresence mode="wait">
                  {step === 1 && !loading && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <ServiceSelection
                        services={services}
                        selectedServices={bookingData.services}
                        onNext={handleServicesSelect}
                        tenantId={tenantId}
                      />
                    </motion.div>
                  )}
                  {step === 1 && loading && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                      <p>Cargando servicios...</p>
                    </motion.div>
                  )}
                  {step === 2 && (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <StylistSelection
                        selectedStylist={bookingData.stylist}
                        onNext={handleStylistSelect}
                        onBack={handleBack}
                      />
                    </motion.div>
                  )}
                  {step === 3 && (
                    <motion.div
                      key="step-3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <DateTimeSelection
                        selectedDate={bookingData.date}
                        selectedTime={bookingData.time}
                        totalDuration={totalDuration}
                        services={bookingData.services}
                        stylist={bookingData.stylist!}
                        onNext={handleDateTimeSelect}
                        onBack={handleBack}
                      />
                    </motion.div>
                  )}
                  {step === 4 && (
                    <motion.div
                      key="step-4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="space-y-6"
                    >
                      {/* Promo Code Input */}
                      {tenantId && (
                        <PromoCodeInput
                          tenantId={tenantId}
                          subtotal={totalPrice}
                          appliedPromotion={bookingData.appliedPromotion || null}
                          onApplyPromotion={handleApplyPromotion}
                        />
                      )}
                      
                      <BookingConfirmation
                        bookingData={bookingData}
                        totalDuration={totalDuration}
                        onConfirm={handleConfirmBooking}
                        onBack={handleBack}
                        totalPrice={totalPrice}
                        discountedPrice={discountedPrice}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Bottom Sheet Summary */}
          <AnimatePresence>
            {bookingData.services.length > 0 && (
              <BookingSummaryMobile
                bookingData={bookingData}
                totalDuration={totalDuration}
                step={step}
                onRemoveService={step === 1 ? handleRemoveService : undefined}
                totalPrice={totalPrice}
                discountedPrice={bookingData.appliedPromotion ? discountedPrice : undefined}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
