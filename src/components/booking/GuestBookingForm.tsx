import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useHaptic } from "@/hooks/useHaptic";
import type { BookingData } from "@/types/booking";
import { SalonAppointmentCard } from "./SalonAppointmentCard";

interface GuestBookingFormProps {
  bookingData: BookingData;
  totalDuration: number;
  totalPrice: number;
  discountedPrice?: number;
  tenantId: string;
  tenantName?: string;
  logoUrl?: string | null;
  onSuccess: (name: string, phone: string) => void;
  onSwitchToLogin: () => void;
  onBack: () => void;
}

type Stage = "form" | "otp";

export function GuestBookingForm({
  bookingData,
  totalDuration,
  totalPrice,
  discountedPrice,
  tenantId,
  tenantName,
  logoUrl,
  onSuccess,
  onSwitchToLogin,
  onBack,
}: GuestBookingFormProps) {
  const [stage, setStage] = useState<Stage>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const haptic = useHaptic();

  const finalPrice = discountedPrice ?? totalPrice;

  const sendOtp = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast({ title: "Faltan datos", description: "Completa nombre, email y teléfono.", variant: "destructive" });
      return;
    }
    setLoading(true);
    haptic.selection();
    try {
      const { error } = await supabase.functions.invoke("send-otp", {
        body: { email: email.trim(), tenant_id: tenantId, tenant_name: tenantName },
      });
      if (error) throw error;
      haptic.success();
      setStage("otp");
      toast({ title: "Código enviado", description: `Revisa tu email (${email}).` });
    } catch (err: any) {
      haptic.error();
      toast({ title: "No se pudo enviar", description: err?.message || "Inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndBook = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast({ title: "Código no válido", description: "Introduce los 6 dígitos.", variant: "destructive" });
      return;
    }
    if (!bookingData.date || !bookingData.time) {
      toast({ title: "Faltan datos de la cita", variant: "destructive" });
      return;
    }
    setLoading(true);
    haptic.selection();
    try {
      const bookingDate = `${bookingData.date.getFullYear()}-${String(bookingData.date.getMonth() + 1).padStart(2, "0")}-${String(bookingData.date.getDate()).padStart(2, "0")}`;
      const cameFromQr = typeof window !== "undefined" && sessionStorage.getItem(`glowapp_qr_tracked_${tenantId}`) === "1";
      const payload = {
        Fecha: bookingDate,
        Hora: bookingData.time,
        stylist: bookingData.stylist,
        services: bookingData.services.map((s) => ({
          id: s.id,
          name: s.name,
          type: s.type,
          duration_part1_active: s.duration_part1_active,
          duration_exposure_pause: s.duration_exposure_pause,
          duration_part2_active: s.duration_part2_active,
          price: s.price,
        })),
        total_duration: totalDuration,
        tenant_id: tenantId,
        total_price: finalPrice,
        source: cameFromQr ? "qr" : "guest_otp",
      };
      const { data, error } = await supabase.functions.invoke("verify-otp-and-book", {
        body: {
          email: email.trim(),
          code,
          full_name: name.trim(),
          phone: phone.trim(),
          booking: payload,
        },
      });
      if (error) throw error;
      // Establish a real client session so /mis-citas works and the user isn't bounced to /auth.
      const tokenHash = (data as any)?.token_hash;
      if (tokenHash) {
        try {
          await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
        } catch (e) {
          console.warn("auto sign-in failed", e);
        }
      }
      haptic.success();
      onSuccess(name.trim(), phone.trim());
    } catch (err: any) {
      haptic.error();
      toast({
        title: "No se pudo confirmar",
        description: err?.message || "Código incorrecto o caducado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (stage === "otp") {
    return (
      <div className="space-y-5">
        <button onClick={() => setStage("form")} className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Cambiar email
        </button>
        <div className="text-center space-y-2">
          <h3 className="text-xl sm:text-2xl font-bold text-neutral-900">Introduce el código</h3>
          <p className="text-sm text-neutral-600">
            Hemos enviado un código de 6 dígitos a <strong className="text-neutral-900">{email}</strong>
          </p>
          <div className="text-xs text-neutral-500 bg-neutral-50 border border-neutral-200/80 p-3 rounded-xl leading-relaxed max-w-sm mx-auto">
            💡 Revisa también tu carpeta de <em>Correo no deseado</em> o <em>Spam</em> si no lo ves de inmediato.
          </div>
        </div>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          inputMode="numeric"
          autoComplete="one-time-code"
          className="h-14 text-center text-3xl font-bold tracking-[0.4em] rounded-xl border-neutral-300 focus:border-primary max-w-xs mx-auto"
        />
        <Button
          onClick={verifyAndBook}
          disabled={loading || code.length !== 6}
          className="w-full h-12 rounded-xl text-white font-semibold text-base shadow-sm max-w-xs mx-auto block"
          style={{ background: "linear-gradient(100deg, #22408C, #98329A)" }}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Confirmar reserva"}
        </Button>
        <button
          type="button"
          onClick={sendOtp}
          disabled={loading}
          className="w-full py-2 text-xs text-primary font-medium hover:underline text-center"
        >
          ¿No has recibido el código? Pulsa aquí para reenviar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen de Cita */}
      <SalonAppointmentCard
        bookingData={bookingData}
        totalDuration={totalDuration}
        totalPrice={totalPrice}
        discountedPrice={discountedPrice}
        clientName={name.trim() || null}
        clientPhone={phone.trim() || null}
        tenantName={tenantName}
        tenantId={tenantId}
        logoUrl={logoUrl}
      />

      {/* Formulario de Contacto */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 space-y-4">
        <div>
          <h4 className="text-base sm:text-lg font-bold text-neutral-900">
            Tus datos de reserva
          </h4>
          <p className="text-xs text-neutral-500 mt-0.5">
            Sin contraseña previa. Te enviaremos un código de confirmación a tu email.
          </p>
        </div>

        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="g-name" className="text-xs font-semibold text-neutral-700">Nombre completo</Label>
            <Input
              id="g-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl bg-white border-neutral-300"
              placeholder="Ej: Marta García"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="g-email" className="text-xs font-semibold text-neutral-700">Email (para tu confirmación)</Label>
            <Input
              id="g-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl bg-white border-neutral-300"
              placeholder="tu@email.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="g-phone" className="text-xs font-semibold text-neutral-700">Teléfono móvil</Label>
            <Input
              id="g-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 rounded-xl bg-white border-neutral-300"
              placeholder="600 123 456"
            />
          </div>
        </div>

        <Button
          onClick={sendOtp}
          disabled={loading}
          className="w-full h-12 rounded-xl text-white font-semibold text-base shadow-sm"
          style={{ background: "linear-gradient(100deg, #22408C, #98329A)" }}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar código y reservar cita"}
        </Button>

        <div className="flex items-center justify-between text-xs pt-1">
          <button onClick={onBack} className="text-neutral-500 hover:text-neutral-900 underline">
            Volver atrás
          </button>
          <button onClick={onSwitchToLogin} className="text-primary font-medium hover:underline">
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </div>
      </div>
    </div>
  );
}
