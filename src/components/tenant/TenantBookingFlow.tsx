import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceSelection } from "@/components/booking/ServiceSelection";
import { TenantDateTimeSelection } from "./TenantDateTimeSelection";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { BookingSummaryMobile } from "@/components/booking/BookingSummaryMobile";
import { PromoCodeInput } from "@/components/booking/PromoCodeInput";
import { SuccessCelebration } from "@/components/booking/SuccessCelebration";
import { AuthModal } from "@/components/auth/AuthModal";
import { GuestBookingForm } from "@/components/booking/GuestBookingForm";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHaptic } from "@/hooks/useHaptic";
import { useAuth } from "@/contexts/AuthContext";
import { useT } from "@/lib/tenantI18n";

const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined) return "";
  return `${price.toFixed(2).replace('.', ',')} €`;
};

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
  // ahora" o cualquier CTA de reserva de la web (vía el evento global).
  const openFlow = () => setFlowOpen(true);
  const closeFlow = () => setFlowOpen(false);
  const [pendingServiceId, setPendingServiceId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ serviceId?: string }>;
      const targetServiceId = customEvent.detail?.serviceId;

      if (targetServiceId) {
        if (services.length > 0) {
          const target = services.find((s) => s.id === targetServiceId);
          if (target) {
            setBookingData((prev) => ({
              ...prev,
              services: [target],
              packageId: null,
            }));
            setStep(1);
          }
        } else {
          setPendingServiceId(targetServiceId);
        }
      }
      setFlowOpen(true);
    };

    window.addEventListener("glow:open-booking", handler);
    return () => window.removeEventListener("glow:open-booking", handler);
  }, [services]);

  // Handle pending service when services finish loading
  useEffect(() => {
    if (pendingServiceId && services.length > 0) {
      const target = services.find((s) => s.id === pendingServiceId);
      if (target) {
        setBookingData((prev) => ({
          ...prev,
          services: [target],
          packageId: null,
        }));
        setStep(1);
      }
      setPendingServiceId(null);
    }
  }, [pendingServiceId, services]);
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
    <section ref={bookingRef} className="tv-section tv-section--white relative overflow-hidden">
      <ClientCoachmark
        storageKey="booking-flow-intro"
        title={t("booking.title")}
        description={t("booking.subtitle")}
        icon={CalendarCheck}
        delay={1600}
      />
      
      <div className="container mx-auto px-5 md:px-8 max-w-5xl relative z-10">
        <div
          className="relative mx-auto max-w-2xl overflow-hidden rounded-[30px] p-8 sm:p-12 text-center transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, #f0f3ff 0%, #faf5ff 45%, #fdf2f8 100%)",
            border: "1px solid rgba(152, 50, 154, 0.14)",
            boxShadow:
              "0 20px 48px -12px rgba(84, 52, 160, 0.10), 0 0 0 1px rgba(255, 255, 255, 0.9) inset",
          }}
        >
          {/* Subtle soft ambient glow from top */}
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background: "radial-gradient(500px circle at 50% 0%, rgba(152, 50, 154, 0.10), transparent 60%)",
            }}
          />
          {/* Liquid glass light reflection on top edge */}
          <div className="pointer-events-none absolute top-0 left-12 right-12 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

          <div className="relative z-10">
            {/* Title */}
            <h2 className="font-editorial text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight leading-snug">
              {t("booking.oneMinTitlePre")}{" "}
              <span className="font-editorial-italic">
                {t("booking.oneMinAccent")}
              </span>
            </h2>

            {/* Subtitle */}
            <p className="mt-3 text-[14.5px] sm:text-base text-neutral-600 font-body max-w-md mx-auto leading-relaxed">
              {t("booking.oneMinSub")}
            </p>

            {/* CTA Button */}
            <div className="mt-7 flex justify-center">
              <button
                onClick={openFlow}
                className="tv-cta text-[14.5px] px-8 py-3.5 rounded-full shadow-[0_10px_28px_-6px_rgba(84,52,160,0.38)] hover:shadow-[0_16px_36px_-6px_rgba(152,50,154,0.48)] hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <CalendarPlus className="h-4 w-4 mr-2" />
                {t("hero.bookNow")}
              </button>
            </div>
          </div>
        </div>

        {flowOpen &&
          createPortal(
            <div data-booking-flow role="dialog" aria-modal="true" aria-label={t("booking.reserveTitle")} className="tv-book-modal fixed inset-0 z-[80] flex items-stretch justify-center lg:items-center lg:p-6">
              <div
                className="absolute inset-0"
                style={{ background: "rgba(12,14,24,.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
                onClick={closeFlow}
              />
              <div className="tv-book-panel relative z-10 flex w-full flex-col overflow-hidden bg-white shadow-2xl max-h-[100dvh] lg:h-auto lg:max-h-[92vh] lg:w-full lg:max-w-4xl lg:rounded-[28px]">
                <header
                  className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 shrink-0"
                  style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
                >
                  <span className="font-body text-[17px] font-bold text-neutral-900">{t("booking.reserveTitle")}</span>
                  <button
                    onClick={closeFlow}
                    aria-label="Cerrar"
                    className="grid h-9 w-9 place-items-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </header>
                <div
                  className={cn(
                    "tv-book-scroll flex-1 overflow-y-auto px-6 sm:px-8 py-5",
                    bookingData.services.length > 0 && !bookingConfirmed && step >= 2
                      ? "pb-20 lg:pb-6"
                      : "pb-6"
                  )}
                >
          {/* Enhanced Progress Bar */}
          <div ref={progressRef} className="mb-6 md:mb-8 space-y-2 sm:space-y-3 max-w-4xl mx-auto scroll-mt-4">
            <div className="flex justify-between items-center text-xs sm:text-sm text-muted-foreground px-1">
              <span className={cn("transition-colors duration-300", step >= 1 && "text-primary font-medium")}>{t("nav.services")}</span>
              <span className={cn("transition-colors duration-300", step >= 2 && "text-primary font-medium")}>{t("booking.dateTime")}</span>
              <span className={cn("transition-colors duration-300", step >= 3 && "text-primary font-medium")}>{t("booking.confirm")}</span>
            </div>
            <div
              className="relative h-2 w-full bg-muted rounded-full overflow-hidden"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={3}
              aria-valuenow={step}
              aria-label={t("booking.stepOf", { step })}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${(step / 3) * 100}%`, background: "linear-gradient(100deg, #22408C, #98329A)" }}
              />
            </div>
            <div className="text-center" aria-live="polite" aria-atomic="true">
              <span className="text-xs text-muted-foreground">
                {t("booking.stepOf", { step })}
              </span>
            </div>
          </div>


          {/* Main Form - Centered */}
          <div className="max-w-4xl mx-auto w-full">
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="px-0 pt-0 pb-3 sm:pb-4">
                <CardTitle className="animate-fade-in text-xl sm:text-2xl text-neutral-900 font-bold">
                  {step === 1 && t("booking.stepServices")}
                  {step === 2 && t("booking.stepDateTime")}
                  {step === 3 && t("booking.stepConfirm")}
                </CardTitle>
                <CardDescription className="text-sm text-neutral-500">
                  {step === 1 && (
                    <span>{t("services.multiHint")}</span>
                  )}
                  {step === 2 && `${t("booking.totalDurationLabel")}: ${totalDuration} ${t("booking.minutes")}`}
                  {step === 3 && t("booking.finalDetails")}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 py-0 overflow-hidden">
                {/* Sin AnimatePresence mode="wait": el paso nuevo monta al
                    instante (no se congela si la pestaña pasa a segundo plano
                    a media transición); cada paso anima su entrada. */}
                {step === 1 && !loading && (
                    <div key="step-1" className="tv-step-in">
                      <ServiceSelection
                        services={services}
                        selectedServices={bookingData.services}
                        onNext={handleServicesSelect}
                        onSelectionChange={(selected, packageId) =>
                          setBookingData((prev) => ({
                            ...prev,
                            services: selected,
                            packageId: packageId || null,
                          }))
                        }
                        tenantId={tenantId}
                        hideFooter={true}
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
                        onChange={(date, time, resolvedStylist) =>
                          setBookingData((prev) => ({
                            ...prev,
                            date,
                            time,
                            stylist: (resolvedStylist || prev.stylist) as Stylist,
                          }))
                        }
                        hideFooter={true}
                      />
                    </div>
                  )}
                  {step === 3 && !bookingConfirmed && !user && (
                    <div key="step-3-auth" className="tv-step-in">
                      <GuestBookingForm
                        bookingData={bookingData}
                        totalDuration={totalDuration}
                        totalPrice={totalPrice}
                        discountedPrice={bookingData.appliedPromotion ? discountedPrice : undefined}
                        tenantId={tenantId}
                        tenantName={tenantName}
                        onSuccess={(name, phone) => {
                          setBookingData({ ...bookingData, name, phone });
                          setBookingConfirmed(true);
                          haptic.success();
                        }}
                        onSwitchToLogin={() => { haptic.selection(); setShowAuthModal(true); }}
                        onBack={handleBack}
                      />
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
                </div>

                {/* Permanent Fixed Modal Footer for Steps 1 & 2 */}
                {!bookingConfirmed && step <= 2 && (
                  <footer className="shrink-0 border-t border-neutral-200/90 bg-white/95 backdrop-blur-md px-6 sm:px-8 py-3.5 z-30 flex items-center justify-between gap-4">
                    {step === 1 && (
                      <>
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className="min-w-0">
                            <p className={cn(
                              "text-xs sm:text-sm font-semibold transition-colors duration-200 truncate",
                              bookingData.services.length > 0 ? 'text-neutral-900' : 'text-muted-foreground'
                            )}>
                              {bookingData.services.length} {bookingData.services.length === 1 ? "servicio" : "servicios"}
                              {bookingData.services.length > 0 && (
                                <span className="text-neutral-500 font-normal ml-1">
                                  ({totalDuration} min)
                                </span>
                              )}
                            </p>
                            {totalPrice > 0 && (
                              <p className="font-bold text-base sm:text-lg text-primary tabular-nums leading-tight">
                                {formatPrice(totalPrice)}
                                {bookingData.packageId && (
                                  <Badge variant="secondary" className="text-[10px] ml-1.5 align-middle">Pack</Badge>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            haptic.selection();
                            setStep(2);
                            scrollToProgress();
                          }}
                          disabled={bookingData.services.length === 0}
                          data-guided-cta="true"
                          className="h-11 px-6 sm:px-7 rounded-xl font-semibold transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-[1.03] active:scale-[0.97] disabled:scale-100 touch-manipulation shadow-sm shrink-0"
                        >
                          Continuar
                        </Button>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <Button
                          variant="outline"
                          onClick={handleBack}
                          className="h-11 px-5 rounded-xl font-medium transition-transform duration-200 hover:scale-105"
                        >
                          {t("booking.back")}
                        </Button>
                        <Button
                          onClick={() => {
                            haptic.selection();
                            setStep(3);
                            scrollToProgress();
                          }}
                          disabled={!bookingData.date || !bookingData.time}
                          className="h-11 px-6 sm:px-7 rounded-xl font-semibold transition-transform duration-200 hover:scale-105 disabled:scale-100 shadow-sm shrink-0"
                        >
                          {t("booking.continue")}
                        </Button>
                      </>
                    )}
                  </footer>
                )}
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
