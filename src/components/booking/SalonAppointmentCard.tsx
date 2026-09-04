import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BookingData, Promotion } from "@/types/booking";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export interface SalonAppointmentCardProps {
  bookingData: BookingData;
  totalDuration: number;
  totalPrice?: number;
  discountedPrice?: number;
  clientName?: string | null;
  clientPhone?: string | null;
  tenantName?: string;
  salonCity?: string;
  tenantId?: string;
  onApplyPromotion?: (promotion: Promotion | null) => void;
  showHospitalityNote?: boolean;
}

const formatPrice = (price: number): string => {
  return `${price.toFixed(2).replace(".", ",")} €`;
};

interface StylistInfo {
  name: string;
  role: string;
  initial: string;
}

const getStylistInfo = (stylist: string | null | undefined): StylistInfo => {
  if (!stylist || stylist === "any") {
    return {
      name: "Estilista del equipo",
      role: "Asignada con mimo para tu sesión",
      initial: "CM",
    };
  }
  const s = stylist.toLowerCase();
  if (s === "cris" || s.includes("cristina")) {
    return {
      name: "Cristina Muñoz",
      role: "Dirección artística & Estilista principal",
      initial: "CM",
    };
  }
  if (s === "desi" || s.includes("desiree") || s.includes("desirée")) {
    return {
      name: "Desiree",
      role: "Estilista de autor · Especialista en color y forma",
      initial: "D",
    };
  }
  const name = stylist.charAt(0).toUpperCase() + stylist.slice(1).toLowerCase();
  return {
    name,
    role: "Estilista del equipo",
    initial: name.charAt(0),
  };
};

export const SalonAppointmentCard = ({
  bookingData,
  totalDuration,
  totalPrice = 0,
  discountedPrice,
  clientName,
  clientPhone,
  tenantName = "Cristina Muñoz",
  salonCity = "Santpedor",
  tenantId,
  onApplyPromotion,
  showHospitalityNote = true,
}: SalonAppointmentCardProps) => {
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const hasDiscount = discountedPrice !== undefined && discountedPrice < totalPrice;
  const finalPrice = hasDiscount ? discountedPrice : totalPrice;
  const stylistInfo = getStylistInfo(bookingData.stylist);

  const handleValidatePromo = async () => {
    if (!promoCode.trim() || !tenantId || !onApplyPromotion) return;
    setPromoLoading(true);
    setPromoError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("promotions")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("code", promoCode.toUpperCase().trim())
        .eq("is_active", true)
        .single();

      if (fetchError || !data) {
        setPromoError("Código no válido");
        return;
      }

      const promo = data as unknown as Promotion;
      const now = new Date().toISOString();

      if (promo.valid_from && promo.valid_from > now) {
        setPromoError("Este código aún no está activo");
        return;
      }
      if (promo.valid_until && promo.valid_until < now) {
        setPromoError("Este código ha expirado");
        return;
      }
      if (promo.max_uses && promo.uses_count >= promo.max_uses) {
        setPromoError("Límite de usos alcanzado");
        return;
      }
      if (promo.min_purchase && totalPrice < promo.min_purchase) {
        setPromoError(`Compra mínima: ${formatPrice(promo.min_purchase)}`);
        return;
      }

      onApplyPromotion(promo);
      setPromoCode("");
      setShowPromoInput(false);
    } catch {
      setPromoError("Error al verificar el código");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    if (onApplyPromotion) {
      onApplyPromotion(null);
      setPromoError(null);
    }
  };

  return (
    <div className="rounded-3xl border border-[#E7DFD5] bg-[#FAF8F5] text-neutral-800 shadow-[0_4px_24px_-4px_rgba(28,25,23,0.06)] overflow-hidden transition-all duration-300">
      {/* ── Cabecera de Autor / Tarjeta de Salón ── */}
      <div className="px-6 py-5 border-b border-[#EFE9E0] bg-gradient-to-b from-[#FFFDFB] to-[#FAF8F5] flex items-center justify-between gap-4">
        <div>
          <span className="font-editorial text-xl sm:text-2xl text-neutral-900 tracking-tight block leading-tight font-medium">
            {tenantName}
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-400 font-medium block mt-0.5">
            Peluquería & Belleza · {salonCity}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900/[0.04] border border-neutral-900/[0.08] text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-600">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block animate-pulse" />
            Pase de Cita
          </span>
        </div>
      </div>

      {/* ── Bloque Principal: Momento de la Cita (Tipografía editorial destacada) ── */}
      <div className="p-6 border-b border-[#EFE9E0] bg-white/60">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-[0.2em] block mb-1">
              Tu momento en el salón
            </span>
            <h3 className="font-editorial text-2xl sm:text-3xl text-neutral-900 capitalize font-medium leading-snug">
              {bookingData.date
                ? format(bookingData.date, "EEEE, d 'de' MMMM", { locale: es })
                : "Fecha seleccionada"}
            </h3>
          </div>

          {bookingData.time && (
            <div className="sm:text-right mt-1 sm:mt-0">
              <div className="inline-flex items-baseline gap-1">
                <span className="font-editorial text-3xl sm:text-4xl font-normal text-neutral-900 tracking-tight tabular-nums">
                  {bookingData.time}
                </span>
                <span className="text-base font-editorial-italic text-neutral-500">h</span>
              </div>
              <p className="text-xs text-neutral-400 font-medium">
                {totalDuration} min de dedicación
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Bloque Central: Carta de Servicios & Detalles ── */}
      <div className="p-6 space-y-6">
        {/* Carta de Servicios */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-[0.2em]">
              {bookingData.services.length === 1 ? "Tratamiento elegido" : "Sesión de tratamientos"}
            </span>
            <span className="text-xs text-neutral-400 font-normal">
              {bookingData.services.length} {bookingData.services.length === 1 ? "servicio" : "servicios"}
            </span>
          </div>

          <div className="space-y-2.5">
            {bookingData.services.map((service) => (
              <div key={service.id} className="group">
                <div className="flex items-baseline justify-between gap-3 text-[14px]">
                  <span className="font-medium text-neutral-800 group-hover:text-neutral-900 transition-colors">
                    {service.name}
                  </span>
                  <div className="flex-1 mx-2 border-b border-dotted border-neutral-300/80 translate-y-[-3px]" />
                  {service.price !== undefined && service.price !== null && (
                    <span className="font-semibold text-neutral-900 tabular-nums shrink-0">
                      {formatPrice(service.price)}
                    </span>
                  )}
                </div>
                {service.type === "Compuesto" && (
                  <p className="text-[11px] text-neutral-400 mt-0.5 pl-0.5">
                    Servicio en varias fases con pausa de exposición
                  </p>
                )}
              </div>
            ))}
          </div>

          {bookingData.packageId && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200/60 text-amber-900 text-xs font-medium">
              <span>✦ Pack exclusivo de tratamientos</span>
            </div>
          )}
        </div>

        {/* Separador sutil */}
        <div className="h-px bg-[#EFE9E0]" />

        {/* En manos de & A nombre de */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Estilista */}
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F0EAE1] border border-[#E3D8CC] text-neutral-800 font-editorial text-base font-medium flex items-center justify-center shrink-0 shadow-2xs">
              {stylistInfo.initial}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-[0.2em] block">
                En manos de
              </span>
              <p className="font-medium text-[15px] text-neutral-900 truncate mt-0.5">
                {stylistInfo.name}
              </p>
              <p className="text-[12px] text-neutral-500 line-clamp-1 mt-0.5">
                {stylistInfo.role}
              </p>
            </div>
          </div>

          {/* Titular */}
          {clientName && (
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-neutral-100 border border-neutral-200 text-neutral-600 font-sans text-sm font-semibold flex items-center justify-center shrink-0 shadow-2xs">
                {clientName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-[0.2em] block">
                  A nombre de
                </span>
                <p className="font-medium text-[15px] text-neutral-900 truncate mt-0.5">
                  {clientName}
                </p>
                {clientPhone && (
                  <p className="text-[12px] text-neutral-500 tabular-nums mt-0.5">
                    {clientPhone}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Código de cortesía / Promoción ── */}
        {bookingData.appliedPromotion ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-950">
                  Cortesía aplicada: {bookingData.appliedPromotion.name}
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-mono block mt-0.5">
                Código: {bookingData.appliedPromotion.code}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-bold text-emerald-800 tabular-nums text-sm">
                -{formatPrice(totalPrice - (discountedPrice ?? totalPrice))}
              </span>
              {onApplyPromotion && (
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className="text-emerald-700 hover:text-emerald-900 text-xs underline underline-offset-2"
                >
                  Quitar
                </button>
              )}
            </div>
          </div>
        ) : onApplyPromotion && tenantId ? (
          <div>
            {!showPromoInput ? (
              <button
                type="button"
                onClick={() => setShowPromoInput(true)}
                className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors font-medium flex items-center gap-1.5 py-1 group"
              >
                <span className="text-neutral-400 group-hover:text-neutral-700">✦</span>
                <span className="underline underline-offset-4 decoration-neutral-300 group-hover:decoration-neutral-700">
                  ¿Dispones de un código de cortesía o invitación?
                </span>
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-white/70 border border-[#E7DFD5] space-y-2.5 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-700">Código de cortesía o descuento</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPromoInput(false);
                      setPromoError(null);
                    }}
                    className="text-neutral-400 hover:text-neutral-600 text-[11px]"
                  >
                    Cancelar
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase());
                      if (promoError) setPromoError(null);
                    }}
                    placeholder="Ej: BIENVENIDA"
                    className="flex-1 h-10 px-3 uppercase tracking-wider text-xs rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    onKeyDown={(e) => e.key === "Enter" && handleValidatePromo()}
                  />
                  <button
                    type="button"
                    onClick={handleValidatePromo}
                    disabled={!promoCode.trim() || promoLoading}
                    className="h-10 px-4 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 disabled:opacity-50 transition-colors shrink-0"
                  >
                    {promoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Aplicar"}
                  </button>
                </div>
                {promoError && (
                  <p className="text-[11px] text-destructive font-medium">{promoError}</p>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* ── Total a abonar & Garantía de pago ── */}
        {finalPrice > 0 && (
          <div className="pt-5 border-t border-[#EFE9E0] flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-[0.2em] block mb-0.5">
                Total estimado
              </span>
              <p className="text-xs text-neutral-500 font-normal">
                Abonarás cómodamente en el salón al terminar tu sesión
              </p>
            </div>

            <div className="sm:text-right">
              {hasDiscount ? (
                <div className="flex items-baseline gap-2 sm:justify-end">
                  <span className="text-sm text-neutral-400 line-through tabular-nums">
                    {formatPrice(totalPrice)}
                  </span>
                  <span className="font-editorial text-2xl sm:text-3xl font-bold text-primary tabular-nums">
                    {formatPrice(discountedPrice!)}
                  </span>
                </div>
              ) : (
                <span className="font-editorial text-2xl sm:text-3xl font-bold text-neutral-900 tabular-nums">
                  {formatPrice(totalPrice)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Hospitalidad del Salón (Toque humano y cálido) ── */}
      {showHospitalityNote && (
        <div className="px-6 py-4 bg-[#F5F0E8]/70 border-t border-[#EAE2D7] text-xs text-neutral-600 flex items-center gap-3">
          <span className="text-base shrink-0">☕</span>
          <p className="leading-relaxed">
            <strong className="font-semibold text-neutral-800">Hospitalidad Cristina Muñoz:</strong> Te
            esperamos puntualmente con café o té de bienvenida y todo preparado para tu cuidado y relax.
          </p>
        </div>
      )}
    </div>
  );
};
