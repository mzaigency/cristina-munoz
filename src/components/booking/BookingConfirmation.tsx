import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Loader2, Tag, Package, Phone, Clock, User as UserIcon, Scissors } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
import { BookingData } from "@/types/booking";
import { PushPermissionPrompt } from "@/components/notifications/PushPermissionPrompt";
import { SelectedAddon } from "./BookingProductsAddon";
import { consumeSectionClickFor, trackEvent } from "@/lib/telemetry";
import { phoneSchema, cleanPhoneNumber } from "@/lib/phoneValidation";

interface BookingConfirmationProps {
  bookingData: BookingData;
  totalDuration: number;
  onConfirm: (name: string, phone: string) => void;
  onBack: () => void;
  tenantId?: string;
  totalPrice?: number;
  discountedPrice?: number;
  addonProducts?: SelectedAddon[];
}

interface UserProfile {
  full_name: string;
  email: string;
  phone: string;
}

const formatPrice = (price: number): string => {
  return `${price.toFixed(2).replace('.', ',')} €`;
};

export const BookingConfirmation = ({
  bookingData,
  totalDuration,
  onConfirm,
  onBack,
  tenantId,
  totalPrice = 0,
  discountedPrice,
  addonProducts = [],
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
      <div className="space-y-5 py-2">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Phone className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">
            Solo falta tu teléfono
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Lo necesitamos para que el salón pueda contactarte si hay cualquier cambio en tu cita.
          </p>
        </div>

        <form onSubmit={handleSavePhone} className="space-y-3 max-w-sm mx-auto">
          <div className="space-y-1.5">
            <Label htmlFor="phone-input" className="text-sm">Teléfono móvil</Label>
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
              className="h-11"
            />
            {phoneError && (
              <p className="text-xs text-destructive">{phoneError}</p>
            )}
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={savingPhone}
              className="w-full sm:w-auto h-11"
            >
              Volver
            </Button>
            <Button
              type="submit"
              disabled={savingPhone}
              className="w-full sm:flex-1 h-11"
            >
              {savingPhone ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar y continuar"
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="relative space-y-6 sm:space-y-8 text-center py-6 sm:py-8">
        <Confetti
          ref={confettiRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-50"
        />
        <div className="flex justify-center">
          <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-green-100 animate-in zoom-in duration-500">
            <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
          </div>
        </div>
        <div className="space-y-2 sm:space-y-3">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">¡Cita Confirmada!</h3>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-md mx-auto px-2">
            Recibirás un mensaje de confirmación con todos los detalles de tu reserva.
          </p>
        </div>
        <div className="rounded-xl border-2 border-green-200 bg-green-50/50 p-4 sm:p-6 text-left max-w-lg mx-auto">
          <h4 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
            Resumen de tu cita
          </h4>
          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
            <div className="flex flex-wrap gap-1 sm:grid sm:grid-cols-3 sm:gap-2">
              <span className="font-medium text-muted-foreground sm:col-span-1">Nombre:</span>
              <span className="sm:col-span-2">{userProfile.full_name}</span>
            </div>
            <div className="flex flex-wrap gap-1 sm:grid sm:grid-cols-3 sm:gap-2">
              <span className="font-medium text-muted-foreground sm:col-span-1">Email:</span>
              <span className="sm:col-span-2 break-all">{userProfile.email}</span>
            </div>
            <div className="flex flex-wrap gap-1 sm:grid sm:grid-cols-3 sm:gap-2">
              <span className="font-medium text-muted-foreground sm:col-span-1">Teléfono:</span>
              <span className="sm:col-span-2">{userProfile.phone}</span>
            </div>
            <div className="h-px bg-border my-1.5 sm:my-2" />
            <div className="flex flex-wrap gap-1 sm:grid sm:grid-cols-3 sm:gap-2">
              <span className="font-medium text-muted-foreground sm:col-span-1">Fecha:</span>
              <span className="sm:col-span-2">{bookingData.date && format(bookingData.date, "dd-MM-yyyy")}</span>
            </div>
            <div className="flex flex-wrap gap-1 sm:grid sm:grid-cols-3 sm:gap-2">
              <span className="font-medium text-muted-foreground sm:col-span-1">Hora:</span>
              <span className="sm:col-span-2">{bookingData.time}</span>
            </div>
            <div className="flex flex-wrap gap-1 sm:grid sm:grid-cols-3 sm:gap-2">
              <span className="font-medium text-muted-foreground sm:col-span-1">Profesional:</span>
              <span className="sm:col-span-2">{bookingData.stylist === "any" ? "Cualquiera" : bookingData.stylist?.toUpperCase()}</span>
            </div>
            <div className="h-px bg-border my-1.5 sm:my-2" />
            <div className="flex flex-wrap gap-1 sm:grid sm:grid-cols-3 sm:gap-2">
              <span className="font-medium text-muted-foreground sm:col-span-1">Servicios:</span>
              <span className="sm:col-span-2">{bookingData.services.map((s) => s.name).join(", ")}</span>
            </div>
            <div className="flex flex-wrap gap-1 sm:grid sm:grid-cols-3 sm:gap-2">
              <span className="font-medium text-muted-foreground sm:col-span-1">Duración:</span>
              <span className="sm:col-span-2">{totalDuration} minutos</span>
            </div>
            {finalPrice > 0 && (
              <div className="flex flex-wrap gap-1 sm:grid sm:grid-cols-3 sm:gap-2">
                <span className="font-medium text-muted-foreground sm:col-span-1">Total:</span>
                <span className="sm:col-span-2 font-bold text-primary">{formatPrice(finalPrice)}</span>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Nos vemos pronto en el salón ✨
        </p>
        <PushPermissionPrompt
          show={showPushPrompt}
          onDismiss={() => setShowPushPrompt(false)}
        />
      </div>
    );
  }

  const dayNum = bookingData.date ? format(bookingData.date, "d", { locale: es }) : "";
  const monthShort = bookingData.date ? format(bookingData.date, "MMM", { locale: es }).toUpperCase() : "";
  const weekday = bookingData.date ? format(bookingData.date, "EEEE", { locale: es }) : "";

  return (
    <div className="space-y-5">
      {/* Ticket estilo iOS Wallet */}
      <div className="rounded-3xl bg-card border border-border/60 overflow-hidden shadow-sm">
        {/* Cabecera: fecha grande + hora */}
        <div className="flex items-stretch">
          {/* Bloque fecha tipo icono calendario */}
          <div className="flex flex-col items-center justify-center px-5 py-5 bg-gradient-to-br from-primary/10 to-accent/10 border-r border-border/40 min-w-[92px]">
            <span className="text-[10px] font-bold tracking-widest text-primary">{monthShort}</span>
            <span className="text-[38px] font-bold leading-none text-foreground tabular-nums mt-0.5">{dayNum}</span>
            <span className="text-[11px] text-muted-foreground capitalize mt-1">{weekday}</span>
          </div>

          {/* Hora + total */}
          <div className="flex-1 flex flex-col justify-center px-5 py-5 min-w-0">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium uppercase tracking-wider">Hora</span>
            </div>
            <p className="text-[28px] font-bold text-foreground leading-tight tabular-nums mt-0.5">
              {bookingData.time}
            </p>
            <p className="text-[12px] text-muted-foreground tabular-nums">{totalDuration} min</p>
          </div>
        </div>

        {/* Divisor con muescas tipo ticket */}
        <div className="relative h-3 border-y border-dashed border-border/60 bg-muted/30">
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-background border border-border/60" />
          <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-background border border-border/60" />
        </div>

        {/* Detalles */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Scissors className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Servicios</p>
              <p className="text-[14px] font-medium text-foreground leading-snug">
                {bookingData.services.map((s) => s.name).join(" · ")}
              </p>
              {bookingData.packageId && (
                <Badge variant="secondary" className="mt-1 text-[10px] h-4 px-1.5">
                  <Package className="h-2.5 w-2.5 mr-0.5" />
                  Pack
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <UserIcon className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Profesional</p>
              <p className="text-[14px] font-medium text-foreground">
                {bookingData.stylist === "any" ? "Cualquiera disponible" : bookingData.stylist?.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Precio destacado abajo */}
        {finalPrice > 0 && (
          <div className="px-5 py-4 border-t border-border/40 bg-muted/20 flex items-baseline justify-between">
            <span className="text-[13px] font-medium text-muted-foreground">Total</span>
            {hasDiscount ? (
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] text-muted-foreground line-through tabular-nums">{formatPrice(totalPrice)}</span>
                <span className="text-[22px] font-bold text-green-600 tabular-nums">{formatPrice(discountedPrice!)}</span>
              </div>
            ) : (
              <span className="text-[22px] font-bold text-foreground tabular-nums">{formatPrice(totalPrice)}</span>
            )}
          </div>
        )}

        {bookingData.appliedPromotion && (
          <div className="px-5 py-2.5 border-t border-border/40 bg-green-500/5 flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <Tag className="h-3 w-3 text-green-600 shrink-0" />
              <span className="text-green-700 truncate font-medium">{bookingData.appliedPromotion.name}</span>
            </div>
            <Badge variant="secondary" className="font-mono text-[10px] shrink-0">
              {bookingData.appliedPromotion.code}
            </Badge>
          </div>
        )}
      </div>

      {/* A nombre de — línea sutil */}
      <div className="px-1 flex items-center justify-between text-[12px]">
        <span className="text-muted-foreground">A nombre de</span>
        <span className="font-medium text-foreground truncate ml-2">{userProfile.full_name}</span>
      </div>

      {/* CTAs Sticky Bottom */}
      <div className="sticky bottom-0 -mx-6 sm:-mx-8 -mb-5 mt-6 px-6 sm:px-8 py-3.5 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 shadow-[0_-8px_24px_rgba(0,0,0,0.07)] z-20 flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-3">
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
            "Confirmar reserva"
          )}
        </Button>
      </div>
    </div>
  );
};
