import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
import { BookingData, Promotion } from "@/types/booking";
import { PushPermissionPrompt } from "@/components/notifications/PushPermissionPrompt";
import { SelectedAddon } from "./BookingProductsAddon";
import { consumeSectionClickFor, trackEvent } from "@/lib/telemetry";
import { phoneSchema, cleanPhoneNumber } from "@/lib/phoneValidation";
import { SalonAppointmentCard } from "./SalonAppointmentCard";

interface BookingConfirmationProps {
  bookingData: BookingData;
  totalDuration: number;
  onConfirm: (name: string, phone: string) => void;
  onBack: () => void;
  tenantId?: string;
  tenantName?: string;
  logoUrl?: string | null;
  totalPrice?: number;
  discountedPrice?: number;
  addonProducts?: SelectedAddon[];
  hideFooter?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  onApplyPromotion?: (promotion: Promotion | null) => void;
}

interface UserProfile {
  full_name: string;
  email: string;
  phone: string;
}

export const BookingConfirmation = ({
  bookingData,
  totalDuration,
  onConfirm,
  onBack,
  tenantId,
  tenantName,
  logoUrl,
  totalPrice = 0,
  discountedPrice,
  addonProducts = [],
  hideFooter = false,
  onLoadingChange,
  onApplyPromotion,
}: BookingConfirmationProps) => {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [savingPhone, setSavingPhone] = useState(false);
  const { toast } = useToast();
  const confettiRef = useRef<ConfettiRef>(null);

  // Notify parent of loading / submitting state
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  const hasDiscount = discountedPrice !== undefined && discountedPrice < totalPrice;
  const finalPrice = hasDiscount ? discountedPrice : totalPrice;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          toast({
            title: "Error",
            description: "Debes iniciar sesión para continuar",
            variant: "destructive",
          });
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar tu información de perfil",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [toast]);

  const handleConfirm = async () => {
    if (!userProfile) {
      toast({
        title: "Error",
        description: "No se pudo obtener tu información de perfil",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Format date in local timezone (Madrid)
      const bookingDate = bookingData.date ? 
        `${bookingData.date.getFullYear()}-${String(bookingData.date.getMonth() + 1).padStart(2, '0')}-${String(bookingData.date.getDate()).padStart(2, '0')}` 
        : '';
      
      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: {
          Fecha: bookingDate,
          Hora: bookingData.time,
          stylist: bookingData.stylist,
          services: bookingData.services.map(s => ({ 
            id: s.id,
            name: s.name,
            type: s.type,
            duration_part1_active: s.duration_part1_active,
            duration_exposure_pause: s.duration_exposure_pause,
            duration_part2_active: s.duration_part2_active,
            price: s.price,
          })),
          total_duration: totalDuration,
          user_id: session?.user?.id || null,
          tenant_id: tenantId,
          package_id: bookingData.packageId,
          promotion_code: bookingData.appliedPromotion?.code,
          total_price: finalPrice,
        },
      });

      if (error) {
        console.error('Error creating booking:', error);
        // Detect "tenant inactive" 403 error
        const errorMsg = (error as any)?.message || '';
        const errorCtx = (error as any)?.context;
        const isTenantInactive =
          errorMsg.toLowerCase().includes('no está activo') ||
          errorMsg.toLowerCase().includes('not active') ||
          errorCtx?.status === 403;

        toast({
          title: isTenantInactive ? "Salón no disponible" : "Error",
          description: isTenantInactive
            ? "Este salón aún no está disponible para reservas. Vuelve a intentarlo en unos minutos."
            : "No se pudo completar la reserva. Por favor, intenta de nuevo.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setLoading(false);
      setConfirmed(true);
      setShowPushPrompt(true);

      // Telemetry: attribute conversion to source section if applicable
      if (tenantId) {
        const ctx = consumeSectionClickFor(tenantId);
        if (ctx) {
          void trackEvent({
            event_type: "conversion",
            section_id: ctx.sectionId,
            tenant_id: tenantId,
            position: ctx.position,
            score: ctx.score,
            metadata: { kind: "booking" },
          });
        }
      }

      onConfirm(userProfile.full_name, userProfile.phone);

      // Crear pedido de productos asociado a la cita (si hay addons)
      if (addonProducts.length > 0 && tenantId) {
        const addonsTotal = addonProducts.reduce((s, a) => s + a.price * a.quantity, 0);
        const createdBookingId = (data as any)?.bookings?.[0]?.id ?? null;
        const { error: orderErr } = await supabase.from("product_orders").insert([{
          tenant_id: tenantId,
          user_id: session?.user?.id ?? null,
          booking_id: createdBookingId,
          customer_name: userProfile.full_name,
          customer_phone: userProfile.phone,
          items: addonProducts as any,
          total: addonsTotal,
          status: "pending",
          pickup_type: "appointment",
          notes: `Recoger en cita del ${bookingDate} a las ${bookingData.time}`,
        }]);
        if (orderErr) {
          console.error("Error creating product order:", orderErr);
          toast({
            title: "Cita confirmada (productos pendientes)",
            description: "No se pudo registrar el pedido de productos. Avisa en el salón.",
            variant: "destructive",
          });
        }
      }
      
      // Trigger confetti animation
      setTimeout(() => {
        confettiRef.current?.fire({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 200);
      
      toast({
        title: "¡Reserva confirmada!",
        description: data.googleEventCreated 
          ? "Tu cita ha sido añadida al calendario de la peluquería."
          : "Tu reserva ha sido guardada correctamente.",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar tu reserva.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="text-center py-8 text-destructive">
        No se pudo cargar tu información de perfil. Por favor, intenta de nuevo.
      </div>
    );
  }

  if (!userProfile.phone) {
    const handleSavePhone = async (e: React.FormEvent) => {
      e.preventDefault();
      setPhoneError(null);
      const result = phoneSchema.safeParse(phoneInput);
      if (!result.success) {
        setPhoneError(result.error.issues[0]?.message ?? "Teléfono inválido");
        return;
      }
      const clean = cleanPhoneNumber(phoneInput);
      try {
        setSavingPhone(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error("no-session");
        const { error } = await supabase
          .from("profiles")
          .update({ phone: clean })
          .eq("id", session.user.id);
        if (error) throw error;
        setUserProfile({ ...userProfile, phone: clean });
        toast({ title: "Teléfono guardado", description: "Ya puedes confirmar tu reserva." });
      } catch (err) {
        console.error("Error saving phone:", err);
        toast({
          title: "Error",
          description: "No se pudo guardar el teléfono. Intenta de nuevo.",
          variant: "destructive",
        });
      } finally {
        setSavingPhone(false);
      }
    };

    return (
      <div className="space-y-6 py-4">
        <div className="text-center space-y-2 max-w-sm mx-auto">
          <span className="text-2xl block">✦</span>
          <h3 className="font-editorial text-xl sm:text-2xl font-medium text-neutral-900">
            Un último detalle para tu cita
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
            Indícanos tu teléfono de contacto para que el salón pueda enviarte el recordatorio y confirmar cualquier novedad.
          </p>
        </div>

        <form onSubmit={handleSavePhone} className="space-y-4 max-w-sm mx-auto">
          <div className="space-y-1.5">
            <Label htmlFor="phone-input" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Teléfono móvil
            </Label>
            <Input
              id="phone-input"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="600 000 000"
              value={phoneInput}
              onChange={(e) => {
                setPhoneInput(e.target.value);
                if (phoneError) setPhoneError(null);
              }}
              disabled={savingPhone}
              className="h-12 rounded-xl text-base"
            />
            {phoneError && (
              <p className="text-xs text-destructive font-medium">{phoneError}</p>
            )}
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={savingPhone}
              className="w-full sm:w-auto h-11 rounded-xl"
            >
              Volver
            </Button>
            <Button
              type="submit"
              disabled={savingPhone}
              className="w-full sm:flex-1 h-11 rounded-xl font-semibold shadow-sm"
            >
              {savingPhone ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Continuar"
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="relative space-y-6 text-center py-4">
        <Confetti
          ref={confettiRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-50"
        />
        <div className="space-y-2">
          <span className="text-3xl block animate-bounce">✨</span>
          <h3 className="font-editorial text-2xl sm:text-3xl md:text-4xl font-medium text-neutral-900">
            ¡Cita Confirmada!
          </h3>
          <p className="text-sm text-neutral-500 max-w-md mx-auto">
            Te esperamos con ilusión en el salón. Hemos preparado todos los detalles de tu cita.
          </p>
        </div>

        <div className="text-left max-w-lg mx-auto">
          <SalonAppointmentCard
            bookingData={bookingData}
            totalDuration={totalDuration}
            totalPrice={totalPrice}
            discountedPrice={discountedPrice}
            clientName={userProfile.full_name}
            clientPhone={userProfile.phone}
            tenantName={tenantName}
            tenantId={tenantId}
            logoUrl={logoUrl}
          />
        </div>

        <PushPermissionPrompt
          show={showPushPrompt}
          onDismiss={() => setShowPushPrompt(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen de Cita */}
      <SalonAppointmentCard
        bookingData={bookingData}
        totalDuration={totalDuration}
        totalPrice={totalPrice}
        discountedPrice={discountedPrice}
        clientName={userProfile.full_name}
        clientPhone={userProfile.phone}
        tenantName={tenantName}
        tenantId={tenantId}
        logoUrl={logoUrl}
        onApplyPromotion={onApplyPromotion}
      />

      {/* Hidden button for modal footer trigger */}
      <button
        id="booking-confirm-submit-btn"
        type="button"
        className="hidden"
        onClick={handleConfirm}
        disabled={loading}
      />

      {/* Fallback CTAs only if footer is not handled by modal */}
      {!hideFooter && (
        <div className="pt-4 border-t border-neutral-200 flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={loading}
            className="w-full sm:w-auto h-11 px-5 rounded-xl font-medium touch-manipulation text-neutral-700"
          >
            Volver
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full sm:flex-1 h-11 px-6 rounded-xl font-semibold touch-manipulation shadow-sm"
            data-guided-cta="true"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Confirmando...
              </>
            ) : (
              "Confirmar cita"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
