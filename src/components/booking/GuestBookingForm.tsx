import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, User, Phone, ArrowLeft, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useHaptic } from "@/hooks/useHaptic";
import type { BookingData } from "@/types/booking";

interface GuestBookingFormProps {
  bookingData: BookingData;
  totalDuration: number;
  totalPrice: number;
  discountedPrice?: number;
  tenantId: string;
  tenantName?: string;
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
        <button onClick={() => setStage("form")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Cambiar email
        </button>
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold">Introduce el código</h3>
          <p className="text-sm text-muted-foreground">
            Te enviamos un código de 6 dígitos a <strong>{email}</strong>
          </p>
        </div>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          inputMode="numeric"
          autoComplete="one-time-code"
          className="h-14 text-center text-3xl font-bold tracking-[0.4em] rounded-xl"
        />
        <Button
          onClick={verifyAndBook}
          disabled={loading || code.length !== 6}
          className="w-full h-12 rounded-xl text-white font-medium"
          style={{ background: "linear-gradient(100deg, #22408c, #98329a)" }}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmar reserva"}
        </Button>
        <button onClick={sendOtp} disabled={loading} className="w-full text-sm text-muted-foreground underline">
          Reenviar código
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold">Reserva en 10 segundos</h3>
        <p className="text-sm text-muted-foreground">Sin contraseñas. Te enviamos un código al email.</p>
      </div>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="g-name">Nombre</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input id="g-name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 h-12 rounded-xl" placeholder="Tu nombre" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="g-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input id="g-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 rounded-xl" placeholder="tu@email.com" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="g-phone">Teléfono</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input id="g-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 h-12 rounded-xl" placeholder="600 123 456" />
          </div>
        </div>
      </div>
      <Button
        onClick={sendOtp}
        disabled={loading}
        className="w-full h-12 rounded-xl text-white font-medium"
        style={{ background: "linear-gradient(100deg, #22408c, #98329a)" }}
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar código y reservar"}
      </Button>
      <div className="flex items-center justify-between text-sm">
        <button onClick={onBack} className="text-muted-foreground underline">Volver</button>
        <button onClick={onSwitchToLogin} className="text-primary font-medium underline">Ya tengo cuenta</button>
      </div>
    </div>
  );
}
