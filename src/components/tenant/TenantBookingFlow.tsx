import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceSelection } from "@/components/booking/ServiceSelection";
import { TenantDateTimeSelection } from "./TenantDateTimeSelection";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { BookingSummaryMobile } from "@/components/booking/BookingSummaryMobile";
import { PromoCodeInput } from "@/components/booking/PromoCodeInput";
import { SuccessCelebration } from "@/components/booking/SuccessCelebration";
import { AuthModal } from "@/components/auth/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { User, CalendarCheck, CalendarPlus, X } from "lucide-react";
import { createPortal } from "react-dom";
import { ClientCoachmark } from "@/components/coachmark/ClientCoachmark";
import { SmoothTitle } from "@/components/animations/SmoothTitle";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "motion/react";
import { Service, Stylist, BookingData, Promotion, ServicePackage } from "@/types/booking";
import { useHaptic } from "@/hooks/useHaptic";
import { useAuth } from "@/contexts/AuthContext";
import { useT } from "@/lib/tenantI18n";

interface TenantBookingFlowProps {
  tenantId: string;
  tenantName?: string;
}

export const TenantBookingFlow = ({ tenantId, tenantName }: TenantBookingFlowProps) => {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [pendingServices, setPendingServices] = useState<{ services: Service[], packageId?: string } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const bookingRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [flowOpen, setFlowOpen] = useState(false);
  const scrollToProgress = () => {
    progressRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  // El flujo de reserva vive en un overlay aparte. Se abre al pulsar "Reserva
  // ara" o cualquier CTA de reserva de la web (vía el evento global).
  const openFlow = () => setFlowOpen(true);
  const closeFlow = () => setFlowOpen(false);
  useEffect(() => {
    const handler = () => setFlowOpen(true);
    window.addEventListener("glow:open-booking", handler);
    return () => window.removeEventListener("glow:open-booking", handler);
  }, []);
  // Bloquea el scroll del fondo mientras el overlay está abierto
  useEffect(() => {
    if (!flowOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [flowOpen]);
  // Autoscroll: cada paso arranca desde arriba del overlay, acompañando al
  // usuario hasta confirmar.
  useEffect(() => {
    if (!flowOpen) return;
    const id = setTimeout(
      () => document.querySelector(".tv-book-scroll")?.scrollTo({ top: 0, behavior: "smooth" }),
      60,
    );
    return () => clearTimeout(id);
  }, [step, bookingConfirmed, flowOpen]);
  const haptic = useHaptic();
  const { user } = useAuth();
  const t = useT();
  const [bookingData, setBookingData] = useState<BookingData>({
    services: [],
    stylist: "any" as Stylist,
    date: null,
    time: null,
    name: "",
    phone: "",
    appliedPromotion: null,
    packageId: null,
  });

  // Load services, packages, and stylist count from database
  useEffect(() => {
    const loadData = async () => {
      try {
        const [servicesRes, packagesRes] = await Promise.all([
          supabase
            .from('services')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('category', { ascending: true })
            .order('name', { ascending: true }),
          supabase
            .from('service_packages')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('is_active', true),
        ]);

        if (servicesRes.error) throw servicesRes.error;

        const transformedServices: Service[] = (servicesRes.data || []).map(service => ({
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
        setPackages((packagesRes.data || []) as unknown as ServicePackage[]);
      } catch (error) {
        console.error('Error loading services:', error);
        toast({
          title: "Error",
          description: t("services.error"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) {
      loadData();
    }
  }, [tenantId, toast]);

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

  const STORAGE_KEY = `glowapp_pending_booking_${tenantId}`;

  // Persist selection so Google/email redirect doesn't lose progress
  useEffect(() => {
    if (bookingData.services.length === 0 && !bookingData.date) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        serviceIds: bookingData.services.map(s => s.id),
        packageId: bookingData.packageId,
        stylist: bookingData.stylist,
        date: bookingData.date?.toISOString() ?? null,
        time: bookingData.time,
        step,
      }));
    } catch { /* ignore */ }
  }, [bookingData, step]);

  // Restore after auth redirect (Google)
  useEffect(() => {
    if (!user || services.length === 0) return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      const restoredServices = services.filter(s => saved.serviceIds?.includes(s.id));
      if (restoredServices.length === 0) return;
      setBookingData(prev => ({
        ...prev,
        services: restoredServices,
        packageId: saved.packageId ?? null,
        stylist: saved.stylist ?? "any",
        date: saved.date ? new Date(saved.date) : null,
        time: saved.time ?? null,
      }));
      if (saved.step) setStep(saved.step);
      setFlowOpen(true);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }, [user, services]);

  const handleServicesSelect = (selectedServices: Service[], packageId?: string) => {
    // No auth gate here — login is deferred to step 3 (confirmation)
    haptic.selection();
    setBookingData({ ...bookingData, services: selectedServices, packageId: packageId || null });
    setStep(2);
    scrollToProgress();
  };

  // Handle successful authentication (from step-3 gate)
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    haptic.success();
    // User is now logged in; BookingConfirmation will re-fetch profile automatically
  };


  const handleDateTimeSelect = (date: Date, time: string, resolvedStylist?: string) => {
    const finalStylist = resolvedStylist || bookingData.stylist;
    setBookingData({ ...bookingData, date, time, stylist: finalStylist as Stylist });
    setStep(3);
    scrollToProgress();
  };

  const handleConfirmBooking = (name: string, phone: string) => {
    setBookingData({ ...bookingData, name, phone });
    setBookingConfirmed(true);
    haptic.success();
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
    <section ref={bookingRef} className="py-16 md:py-20 relative overflow-hidden">
      <ClientCoachmark
        storageKey="booking-flow-intro"
        title={t("booking.title")}
        description={t("booking.subtitle")}
        icon={CalendarCheck}
        delay={1600}
      />
      {/* Decorative background */}
      <div className="absolute inset-0 gradient-radial pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-56 h-56 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="tv-book-band mx-auto max-w-3xl mb-8 md:mb-12">
          <SmoothTitle>
            <h2 className="font-body text-neutral-900 font-bold" style={{ fontSize: "clamp(1.6rem, 4.4vw, 2.2rem)" }}>
              {t("booking.oneMinTitlePre")} <span className="font-editorial-italic">{t("booking.oneMinAccent")}</span>
            </h2>
          </SmoothTitle>
          <p className="mt-2 text-[15px] sm:text-base text-neutral-600 font-body">
            {t("booking.oneMinSub")}
          </p>
          <button className="tv-cta mt-5" onClick={openFlow}>
            <CalendarPlus className="h-4 w-4" />
            {t("hero.bookNow")}
          </button>
        </div>

        {flowOpen &&
          createPortal(
            <div className="tv-book-modal fixed inset-0 z-[80] flex items-stretch justify-center lg:items-center lg:p-6">
              <div
                className="absolute inset-0"
                style={{ background: "rgba(12,14,24,.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
                onClick={closeFlow}
              />
              <div className="tv-book-panel relative z-10 flex w-full flex-col overflow-hidden bg-white shadow-2xl max-h-[100dvh] lg:h-auto lg:max-h-[90vh] lg:w-full lg:max-w-2xl lg:rounded-[24px]">
                <header
                  className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 shrink-0"
                  style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
                >
                  <span className="font-body text-[16px] font-bold text-neutral-900">{t("booking.reserveTitle")}</span>
                  <button
                    onClick={closeFlow}
                    aria-label="Cerrar"
                    className="grid h-9 w-9 place-items-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </header>
                <div
                  className="tv-book-scroll flex-1 overflow-y-auto px-5 py-6"
                  style={{
                    // Cuando la barra-resumen móvil (fixed) está visible, deja
                    // hueco extra para que el botón Continuar no quede tapado.
                    paddingBottom:
                      bookingData.services.length > 0 && !bookingConfirmed
                        ? "calc(6rem + env(safe-area-inset-bottom))"
                        : "calc(1.5rem + env(safe-area-inset-bottom))",
                  }}
                >
          {/* Enhanced Progress Bar */}
          <div ref={progressRef} className="mb-6 md:mb-8 space-y-2 sm:space-y-3 max-w-3xl mx-auto scroll-mt-4">
            <div className="flex justify-between items-center text-xs sm:text-sm text-muted-foreground px-1">
              <span className={cn("transition-colors duration-300", step >= 1 && "text-primary font-medium")}>{t("nav.services")}</span>
              <span className={cn("transition-colors duration-300", step >= 2 && "text-primary font-medium")}>{t("booking.dateTime")}</span>
              <span className={cn("transition-colors duration-300", step >= 3 && "text-primary font-medium")}>{t("booking.confirm")}</span>
            </div>
            <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${(step / 3) * 100}%`, background: "linear-gradient(100deg, #22408c, #98329a)" }}
              />
            </div>
            <div className="text-center">
              <span className="text-xs text-muted-foreground">
                {t("booking.stepOf", { step })}
              </span>
            </div>
          </div>

          {/* Main Form - Centered */}
          <div className="max-w-3xl mx-auto w-full">
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader>
                <CardTitle className="animate-fade-in">
                  {step === 1 && t("booking.stepServices")}
                  {step === 2 && t("booking.stepDateTime")}
                  {step === 3 && t("booking.stepConfirm")}
                </CardTitle>
                <CardDescription>
                  {step === 1 && (
                    <span>{t("services.multiHint")}</span>
                  )}
                  {step === 2 && `${t("booking.totalDurationLabel")}: ${totalDuration} ${t("booking.minutes")}`}
                  {step === 3 && t("booking.finalDetails")}
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-hidden">
                {/* Sin AnimatePresence mode="wait": el paso nuevo monta al
                    instante (no se congela si la pestaña pasa a segundo plano
                    a media transición); cada paso anima su entrada. */}
                {step === 1 && !loading && (
                    <div key="step-1" className="tv-step-in">
                      <ServiceSelection
                        services={services}
                        selectedServices={bookingData.services}
                        onNext={handleServicesSelect}
                        tenantId={tenantId}
                      />
                    </div>
                  )}
                  {step === 1 && loading && (
                    <div key="loading" className="text-center py-8 text-muted-foreground tv-step-in">
                      <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                      <p>{t("services.loading")}</p>
                    </div>
                  )}
                  {step === 2 && (
                    <div key="step-2" className="tv-step-in">
                      <TenantDateTimeSelection
                        tenantId={tenantId}
                        selectedDate={bookingData.date}
                        selectedTime={bookingData.time}
                        totalDuration={totalDuration}
                        services={bookingData.services}
                        stylist="any"
                        onNext={handleDateTimeSelect}
                        onBack={handleBack}
                      />
                    </div>
                  )}
                  {step === 3 && !bookingConfirmed && !user && (
                    <div key="step-3-auth" className="tv-step-in space-y-5 text-center py-4">
                      <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-7 w-7 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-foreground">Último paso: identifícate</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                          Necesitamos tu nombre y contacto para confirmar la cita. Tarda 10 segundos.
                        </p>
                      </div>
                      <button
                        onClick={() => { haptic.selection(); setShowAuthModal(true); }}
                        className="w-full h-12 rounded-xl text-white font-medium"
                        style={{ background: "linear-gradient(100deg, #22408c, #98329a)" }}
                      >
                        Continuar para confirmar
                      </button>
                      <button
                        onClick={handleBack}
                        className="text-sm text-muted-foreground underline"
                      >
                        Volver
                      </button>
                    </div>
                  )}
                  {step === 3 && !bookingConfirmed && user && (
                    <div key="step-3" className="tv-step-in space-y-6">
                      {/* Promo Code Input */}
                      <PromoCodeInput
                        tenantId={tenantId}
                        subtotal={totalPrice}
                        appliedPromotion={bookingData.appliedPromotion || null}
                        onApplyPromotion={handleApplyPromotion}
                      />
                      
                      <BookingConfirmation
                        bookingData={bookingData}
                        totalDuration={totalDuration}
                        onConfirm={handleConfirmBooking}
                        onBack={handleBack}
                        tenantId={tenantId}
                        totalPrice={totalPrice}
                        discountedPrice={discountedPrice}
                      />
                    </div>
                  )}
                  {step === 3 && bookingConfirmed && bookingData.date && (
                    <div key="step-success" className="tv-step-in">
                      <SuccessCelebration
                        bookingDate={bookingData.date}
                        bookingTime={bookingData.time || ""}
                        stylistName={bookingData.stylist || t("booking.anyPro")}
                        services={bookingData.services}
                        totalDuration={totalDuration}
                        salonName={tenantName}
                        onViewBookings={() => navigate("/mis-citas")}
                      />
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>

          {/* Mobile Bottom Sheet Summary */}
          <AnimatePresence>
            {bookingData.services.length > 0 && !bookingConfirmed && (
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
            </div>,
            document.body,
          )}
      </div>

      {/* Auth Modal for in-situ login */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingServices(null);
        }}
        onSuccess={handleAuthSuccess}
        title={t("nav.signIn")}
        subtitle={t("booking.signInToContinue")}
      />
    </section>
  );
};

export default TenantBookingFlow;
