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
  tenantId?: string;
  logoUrl?: string | null;
  onApplyPromotion?: (promotion: Promotion | null) => void;
}

const formatPrice = (price: number): string => {
  return `${price.toFixed(2).replace(".", ",")} €`;
};

const getStylistName = (stylist: string | null | undefined): string => {
  if (!stylist || stylist === "any") return "Cualquiera disponible";
  const s = stylist.toLowerCase();
  if (s === "cris" || s.includes("cristina")) return "Cristina Muñoz";
  if (s === "desi" || s.includes("desiree") || s.includes("desirée")) return "Desiree";
  return stylist.charAt(0).toUpperCase() + stylist.slice(1);
};

export const SalonAppointmentCard = ({
  bookingData,
  totalDuration,
  totalPrice = 0,
  discountedPrice,
  clientName,
  clientPhone,
  tenantName,
  tenantId,
  logoUrl,
  onApplyPromotion,
}: SalonAppointmentCardProps) => {
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const hasDiscount = discountedPrice !== undefined && discountedPrice < totalPrice;
  const finalPrice = hasDiscount ? discountedPrice : totalPrice;
  const stylistName = getStylistName(bookingData.stylist);

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

  const formattedDate = bookingData.date
    ? (() => {
        const str = format(bookingData.date, "EEEE, d 'de' MMMM", { locale: es });
        return str.charAt(0).toUpperCase() + str.slice(1);
      })()
    : "Fecha por definir";

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden transition-all duration-200">
      {/* ── Cabecera: Logo del Salón, Nombre y Estado ── */}
      <div className="p-4 sm:p-5 bg-gradient-to-b from-neutral-50/50 to-white border-b border-neutral-100 flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={tenantName || "Salón"}
              className="h-9 sm:h-10 w-auto max-w-[120px] object-contain shrink-0"
              loading="eager"
            />
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neutral-100 text-neutral-800 font-bold text-sm flex items-center justify-center shrink-0">
              {(tenantName || "S").charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <h4 className="text-base sm:text-lg font-bold text-neutral-900 truncate leading-tight">
              {tenantName || "Salón de Belleza"}
            </h4>
            <p className="text-xs text-neutral-400 font-medium mt-0.5">Resumen de tu cita</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-700 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          En salón
        </span>
      </div>

      {/* ── Bloque Destacado: Fecha y Hora con Gradiente Sutil en la Píldora ── */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
            Día reservado
          </span>
          <p className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
            {formattedDate}
          </p>
        </div>

        <div className="sm:text-right shrink-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-primary/[0.08] to-purple-600/[0.08] border border-primary/15 text-primary">
            <span className="font-bold text-[15px] sm:text-base tabular-nums">
              {bookingData.time} h
            </span>
            <span className="text-neutral-300">·</span>
            <span className="text-xs font-semibold text-neutral-600">
              {totalDuration} min
            </span>
          </div>
        </div>
      </div>

      {/* ── Servicios ── */}
      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            {bookingData.services.length === 1 ? "Servicio" : "Servicios"}
          </span>
          {bookingData.packageId && (
            <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-800 text-[11px] font-semibold">
              Pack seleccionado
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          {bookingData.services.map((service) => (
            <div key={service.id} className="flex items-center justify-between gap-3 text-[13.5px]">
              <div className="min-w-0">
                <span className="font-semibold text-neutral-900 block truncate">
                  {service.name}
                </span>
                {service.type === "Compuesto" && (
                  <span className="text-xs text-neutral-500 block">
                    {service.duration_part1_active + service.duration_part2_active} min activos + {service.duration_exposure_pause} min pausa
                  </span>
                )}
              </div>
              {service.price !== undefined && service.price !== null && (
                <span className="font-bold text-neutral-900 tabular-nums shrink-0">
                  {formatPrice(service.price)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Profesional y Cliente ── */}
      <div className="p-4 sm:p-5 bg-neutral-50/40 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[13px]">
        <div>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">
            Profesional
          </span>
          <p className="font-semibold text-neutral-900">{stylistName}</p>
        </div>

        {clientName && (
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">
              A nombre de
            </span>
            <p className="font-semibold text-neutral-900">{clientName}</p>
            {clientPhone && (
              <span className="text-xs text-neutral-500 tabular-nums block">{clientPhone}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Código Promocional ── */}
      {bookingData.appliedPromotion ? (
        <div className="px-4 py-3 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border-t border-emerald-500/20 flex items-center justify-between text-xs">
          <div className="min-w-0">
            <span className="font-semibold text-emerald-950 block truncate">
              Descuento ({bookingData.appliedPromotion.code}): {bookingData.appliedPromotion.name}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-bold text-emerald-800 tabular-nums">
              -{formatPrice(totalPrice - (discountedPrice ?? totalPrice))}
            </span>
            {onApplyPromotion && (
              <button
                type="button"
                onClick={handleRemovePromo}
                className="text-emerald-700 hover:text-emerald-950 font-semibold underline text-xs"
              >
                Quitar
              </button>
            )}
          </div>
        </div>
      ) : onApplyPromotion && tenantId ? (
        <div className="px-4 py-3 bg-neutral-50/50 border-t border-neutral-100">
          {!showPromoInput ? (
            <button
              type="button"
              onClick={() => setShowPromoInput(true)}
              className="text-xs text-neutral-500 hover:text-neutral-900 font-medium underline underline-offset-2 transition-colors"
            >
              ¿Tienes un código de descuento?
            </button>
          ) : (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-neutral-600 font-medium">
                <span>Código de descuento</span>
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

      {/* ── Total a abonar ── */}
      {finalPrice > 0 && (
        <div className="p-4 sm:p-5 bg-gradient-to-b from-neutral-50/60 to-neutral-100/40 border-t border-neutral-200/80">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                Total a pagar
              </span>
              <span className="text-[11px] text-neutral-400 font-normal">
                En el salón tras tu servicio
              </span>
            </div>

            <div className="text-right">
              {hasDiscount ? (
                <div className="flex items-baseline gap-2 justify-end">
                  <span className="text-sm text-neutral-400 line-through tabular-nums">
                    {formatPrice(totalPrice)}
                  </span>
                  <span className="text-2xl font-black text-primary tabular-nums">
                    {formatPrice(discountedPrice!)}
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-black text-neutral-900 tabular-nums">
                  {formatPrice(totalPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Savings badge */}
          {hasDiscount && (
            <div className="mt-2 flex justify-end">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-700 tabular-nums">
                Ahorras {formatPrice(totalPrice - (discountedPrice ?? totalPrice))}
                {bookingData.appliedPromotion?.discount_type === "percentage" && (
                  <> ({Math.round(bookingData.appliedPromotion.discount_value)}%)</>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Trust micro-messages ── */}
      <div className="px-4 sm:px-5 py-3 flex flex-col gap-1.5 text-[11px] text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span>🛡️</span> Sin cargos en tarjeta — pagas en el salón tras tu servicio
        </span>
        <span className="flex items-center gap-1.5">
          <span>⏱️</span> Cancelación gratuita hasta 24 h antes de tu cita
        </span>
      </div>
    </div>
  );
};
