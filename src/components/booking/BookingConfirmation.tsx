import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookingData } from "./BookingFlow";
import { format } from "date-fns";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BookingConfirmationProps {
  bookingData: BookingData;
  totalDuration: number;
  onConfirm: (name: string, phone: string) => void;
  onBack: () => void;
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
}: BookingConfirmationProps) => {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { toast } = useToast();

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
          })),
          total_duration: totalDuration,
          user_id: session?.user?.id || null,
        },
      });

      if (error) {
        console.error('Error creating booking:', error);
        toast({
          title: "Error",
          description: "No se pudo completar la reserva. Por favor, intenta de nuevo.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log('Booking created:', data);
      setLoading(false);
      setConfirmed(true);
      onConfirm(userProfile.full_name, userProfile.phone);
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
      <div className="space-y-8 text-center py-8">
        <div className="flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 animate-in zoom-in duration-500">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-3xl md:text-4xl font-bold text-foreground">¡Tu Cita ha sido Confirmada!</h3>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Recibirás un mensaje de confirmación en tu teléfono con todos los detalles de tu reserva.
          </p>
        </div>
        <div className="rounded-lg border-2 border-green-200 bg-green-50/50 p-6 text-left max-w-lg mx-auto">
          <h4 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Resumen de tu cita
          </h4>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium text-muted-foreground col-span-1">Nombre:</span>
              <span className="col-span-2">{userProfile.full_name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium text-muted-foreground col-span-1">Email:</span>
              <span className="col-span-2 break-all">{userProfile.email}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium text-muted-foreground col-span-1">Teléfono:</span>
              <span className="col-span-2">{userProfile.phone}</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium text-muted-foreground col-span-1">Fecha:</span>
              <span className="col-span-2">{bookingData.date && format(bookingData.date, "dd-MM-yyyy")}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium text-muted-foreground col-span-1">Hora:</span>
              <span className="col-span-2">{bookingData.time}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium text-muted-foreground col-span-1">Peluquera:</span>
              <span className="col-span-2">{bookingData.stylist === "any" ? "Cualquiera" : bookingData.stylist?.toUpperCase()}</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium text-muted-foreground col-span-1">Servicios:</span>
              <span className="col-span-2">{bookingData.services.map((s) => s.name).join(", ")}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium text-muted-foreground col-span-1">Duración:</span>
              <span className="col-span-2">{totalDuration} minutos</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Nos vemos pronto en el salón ✨
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-salon-pink-light p-6">
        <h4 className="mb-3 font-semibold text-foreground">Resumen de tu reserva:</h4>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Nombre:</span> {userProfile.full_name}
          </p>
          <p>
            <span className="font-medium">Email:</span> {userProfile.email}
          </p>
          <p>
            <span className="font-medium">Teléfono:</span> {userProfile.phone}
          </p>
          <p>
            <span className="font-medium">Fecha:</span>{" "}
            {bookingData.date && format(bookingData.date, "dd-MM-yyyy")}
          </p>
          <p>
            <span className="font-medium">Hora:</span> {bookingData.time}
          </p>
          <p>
            <span className="font-medium">Peluquera:</span>{" "}
            {bookingData.stylist === "any" ? "Cualquiera" : bookingData.stylist?.toUpperCase()}
          </p>
          <p>
            <span className="font-medium">Servicios:</span>{" "}
            {bookingData.services.map((s) => s.name).join(", ")}
          </p>
          <p>
            <span className="font-medium">Duración total:</span> {totalDuration} minutos
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
          Volver
        </Button>
        <Button onClick={handleConfirm} disabled={loading}>
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
