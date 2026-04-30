import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle2, Loader2, Tag, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
import { BookingData } from "@/types/booking";
import { PushPermissionPrompt } from "@/components/notifications/PushPermissionPrompt";
import { SelectedAddon } from "./BookingProductsAddon";

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
}: BookingConfirmationProps) => {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
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
      onConfirm(userProfile.full_name, userProfile.phone);
      
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
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-destructive font-semibold">
          Necesitas un teléfono en tu perfil para hacer una reserva
        </p>
        <p className="text-muted-foreground">
          Por favor, completa tu perfil con un número de teléfono válido antes de continuar.
        </p>
        <Button onClick={onBack} variant="outline">
          Volver
        </Button>
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

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="rounded-xl bg-salon-pink-light p-4 sm:p-6 border border-primary/20 shadow-md transition-shadow duration-300 hover:shadow-lg">
        <h4 className="mb-3 font-semibold text-foreground text-sm sm:text-base">Resumen de tu reserva:</h4>
        <div className="space-y-2 text-xs sm:text-sm">
          <p className="flex flex-wrap gap-1">
            <span className="font-medium">Nombre:</span> 
            <span className="break-all">{userProfile.full_name}</span>
          </p>
          <p className="flex flex-wrap gap-1">
            <span className="font-medium">Email:</span> 
            <span className="break-all">{userProfile.email}</span>
          </p>
          <p className="flex flex-wrap gap-1">
            <span className="font-medium">Teléfono:</span> 
            <span>{userProfile.phone}</span>
          </p>
          <p className="flex flex-wrap gap-1">
            <span className="font-medium">Fecha:</span>{" "}
            <span>{bookingData.date && format(bookingData.date, "dd-MM-yyyy")}</span>
          </p>
          <p className="flex flex-wrap gap-1">
            <span className="font-medium">Hora:</span> 
            <span>{bookingData.time}</span>
          </p>
          <p className="flex flex-wrap gap-1">
            <span className="font-medium">Profesional:</span>{" "}
            <span>{bookingData.stylist === "any" ? "Cualquiera" : bookingData.stylist?.toUpperCase()}</span>
          </p>
          <div className="flex flex-wrap gap-1 items-center">
            <span className="font-medium">Servicios:</span>{" "}
            <span>{bookingData.services.map((s) => s.name).join(", ")}</span>
            {bookingData.packageId && (
              <Badge variant="secondary" className="ml-1 text-xs">
                <Package className="h-3 w-3 mr-1" />
                Pack
              </Badge>
            )}
          </div>
          <p className="flex flex-wrap gap-1">
            <span className="font-medium">Duración total:</span> 
            <span>{totalDuration} minutos</span>
          </p>
          
          {/* Price Section */}
          {totalPrice > 0 && (
            <div className="pt-3 mt-3 border-t border-primary/20">
              {bookingData.appliedPromotion && (
                <div className="flex items-center justify-between text-xs mb-2 bg-green-100 dark:bg-green-900/30 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-green-600" />
                    <span className="text-green-700 dark:text-green-400">{bookingData.appliedPromotion.name}</span>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {bookingData.appliedPromotion.code}
                  </Badge>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-base">Total a pagar:</span>
                <div className="text-right">
                  {hasDiscount ? (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground line-through text-sm">{formatPrice(totalPrice)}</span>
                      <span className="font-bold text-xl text-green-600">{formatPrice(discountedPrice!)}</span>
                    </div>
                  ) : (
                    <span className="font-bold text-xl text-primary">{formatPrice(totalPrice)}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack} 
          disabled={loading} 
          className="w-full sm:w-auto h-11 transition-transform duration-200 hover:scale-105 touch-manipulation"
        >
          Volver
        </Button>
        <Button 
          onClick={handleConfirm} 
          disabled={loading} 
          className="w-full sm:w-auto h-11 transition-transform duration-200 hover:scale-105 touch-manipulation"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Confirmando...
            </>
          ) : (
            "Confirmar Reserva"
          )}
        </Button>
      </div>
    </div>
  );
};
