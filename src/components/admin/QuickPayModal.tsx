import React, { useState, useEffect } from "react";
import {
  X,
  Wallet,
  Banknote,
  Check,
  Pencil,
  Loader2,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export interface QuickPayBooking {
  id: string;
  customer_name: string;
  stylist: string;
  services: any;
  Fecha: string;
  Hora: string;
  end_time?: string | null;
}

interface QuickPayModalProps {
  booking: QuickPayBooking | null;
  paying: boolean;
  onClose: () => void;
  onConfirm: (params: {
    total: number;
    paymentMethod: "cash" | "card" | "mixed";
    mixedCash?: number;
    mixedCard?: number;
  }) => Promise<void>;
  onNavigateToCash?: () => void;
  computeBookingTotal: (b: any) => number;
}

export const QuickPayModal: React.FC<QuickPayModalProps> = ({
  booking,
  paying,
  onClose,
  onConfirm,
  onNavigateToCash,
  computeBookingTotal,
}) => {
  const [payMethod, setPayMethod] = useState<"cash" | "card" | "mixed">("cash");
  const [customTotal, setCustomTotal] = useState<string>("");
  const [editingTotal, setEditingTotal] = useState(false);
  const [mixedCash, setMixedCash] = useState<string>("");
  const [mixedCard, setMixedCard] = useState<string>("");

  const originalTotal = booking ? computeBookingTotal(booking) : 0;
  const parsedCustom = parseFloat(customTotal);
  const effectiveTotal =
    customTotal !== "" && !isNaN(parsedCustom) && parsedCustom >= 0
      ? parsedCustom
      : originalTotal;

  // Reset state on booking change
  useEffect(() => {
    if (booking) {
      setPayMethod("cash");
      setCustomTotal("");
      setEditingTotal(false);
      setMixedCash("");
      setMixedCard("");
    }
  }, [booking?.id]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !paying) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, paying]);

  // When switching to mixed, prefill a balanced 50/50 split
  const handleSelectMethod = (method: "cash" | "card" | "mixed") => {
    setPayMethod(method);
    if (method === "mixed") {
      const half = (effectiveTotal / 2).toFixed(2);
      const remainder = (effectiveTotal - parseFloat(half)).toFixed(2);
      setMixedCash(half);
      setMixedCard(remainder);
    }
  };

  const handleCashChange = (val: string) => {
    setMixedCash(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= effectiveTotal) {
      setMixedCard((effectiveTotal - num).toFixed(2));
    }
  };

  const handleCardChange = (val: string) => {
    setMixedCard(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= effectiveTotal) {
      setMixedCash((effectiveTotal - num).toFixed(2));
    }
  };

  const handleSplitFiftyFifty = () => {
    const half = (effectiveTotal / 2).toFixed(2);
    const remainder = (effectiveTotal - parseFloat(half)).toFixed(2);
    setMixedCash(half);
    setMixedCard(remainder);
  };

  if (!booking) return null;

  const svcs: any[] = Array.isArray(booking.services) ? booking.services : [];
  const isCustomPrice =
    customTotal !== "" && Math.abs(effectiveTotal - originalTotal) > 0.001;

  // Mixed calculation validation
  const numCash = parseFloat(mixedCash) || 0;
  const numCard = parseFloat(mixedCard) || 0;
  const mixedDiff = effectiveTotal - (numCash + numCard);
  const isMixedBalanced = Math.abs(mixedDiff) < 0.03;

  const canConfirm =
    !paying &&
    effectiveTotal > 0 &&
    (payMethod !== "mixed" || isMixedBalanced);

  const handleSubmit = () => {
    if (!canConfirm) return;
    onConfirm({
      total: effectiveTotal,
      paymentMethod: payMethod,
      mixedCash: payMethod === "mixed" ? numCash : undefined,
      mixedCard: payMethod === "mixed" ? numCard : undefined,
    });
  };

  return (
    <div
      className="ag-detail-wrap"
      onClick={() => !paying && onClose()}
    >
      <div
        className="ag-detail-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 510 }}
      >
        <div className="ag-detail-grip" aria-hidden />

        <button
          className="ag-detail-close"
          onClick={() => !paying && onClose()}
          aria-label="Cerrar"
          disabled={paying}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            <Wallet className="w-3.5 h-3.5 text-slate-600" />
            Cobro rápido
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {booking.customer_name}
          </span>
        </div>

        {/* ── TOTAL A COBRAR (PROMINENTE Y FÁCILMENTE EDITABLE) ── */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-4 shadow-sm">
          {!editingTotal ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total a cobrar
                </span>

                {/* BOTÓN PROMINENTE DE MODIFICAR PRECIO */}
                <button
                  type="button"
                  disabled={paying}
                  onClick={() => {
                    setCustomTotal(effectiveTotal.toFixed(2));
                    setEditingTotal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm transition transform active:scale-95 cursor-pointer"
                  title="Modificar precio libremente"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Modificar precio
                </button>
              </div>

              {/* Importe display grande */}
              <div
                className="flex items-baseline gap-2 cursor-pointer group"
                onClick={() => {
                  if (!paying) {
                    setCustomTotal(effectiveTotal.toFixed(2));
                    setEditingTotal(true);
                  }
                }}
                title="Haz clic para modificar el importe"
              >
                <span className="text-4xl font-black text-slate-900 tracking-tight tabular-nums group-hover:text-indigo-600 transition">
                  {effectiveTotal.toFixed(2)}
                </span>
                <span className="text-2xl font-bold text-slate-400">€</span>

                {isCustomPrice && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    Tarifa libre (base: {originalTotal.toFixed(2)}€)
                  </span>
                )}
              </div>

              {isCustomPrice && (
                <div className="pt-1 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Importe ajustado manualmente para esta cita.
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCustomTotal("");
                      if (payMethod === "mixed") {
                        const half = (originalTotal / 2).toFixed(2);
                        setMixedCash(half);
                        setMixedCard((originalTotal - parseFloat(half)).toFixed(2));
                      }
                    }}
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-bold underline transition"
                  >
                    <RotateCcw className="w-3 h-3" /> Reestablecer base
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* MODO EDICIÓN PROMINENTE DEL PRECIO */
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Introduce el precio a cobrar
                </span>
                <span className="text-xs text-slate-400">
                  Tarifa base: {originalTotal.toFixed(2)}€
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    autoFocus
                    value={customTotal}
                    onChange={(e) => setCustomTotal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setEditingTotal(false);
                      if (e.key === "Escape") {
                        setCustomTotal("");
                        setEditingTotal(false);
                      }
                    }}
                    className="w-full text-3xl font-black tabular-nums tracking-tight px-3.5 py-2 rounded-xl border-2 border-indigo-500 bg-white text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                    €
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseFloat(customTotal);
                    if (payMethod === "mixed" && !isNaN(parsed) && parsed > 0) {
                      const half = (parsed / 2).toFixed(2);
                      setMixedCash(half);
                      setMixedCard((parsed - parseFloat(half)).toFixed(2));
                    }
                    setEditingTotal(false);
                  }}
                  className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-sm transition"
                >
                  <Check className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomTotal("");
                    setEditingTotal(false);
                  }}
                  className="px-3.5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 font-bold text-sm transition"
                  title="Cancelar edición"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Botones rápidos de ajuste */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setCustomTotal(originalTotal.toFixed(2))}
                  className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Original ({originalTotal.toFixed(2)}€)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cur = parseFloat(customTotal) || originalTotal;
                    setCustomTotal((Math.ceil(cur / 5) * 5).toFixed(2));
                  }}
                  className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Redondear a 5€
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Servicios breakdown */}
        {svcs.length > 0 && (
          <div className="mb-4 rounded-xl border border-slate-200/80 overflow-hidden bg-white shadow-sm">
            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Servicios en esta cita
            </div>
            <div className="divide-y divide-slate-100">
              {svcs.map((s: any, idx: number) => {
                const sName = s?.name || s?.title || (typeof s === "string" ? s : "Servicio");
                const sPrice = (Number(s?.price) || 0) * (Number(s?.quantity) || 1);
                return (
                  <div key={idx} className="flex items-center justify-between px-3 py-2 text-xs">
                    <span className="font-semibold text-slate-800">{sName}</span>
                    <span className="font-bold text-slate-700 tabular-nums">
                      {sPrice.toFixed(2)}€
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MÉTODO DE PAGO: EFECTIVO / TARJETA / MIXTO ── */}
        <div className="mb-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Método de pago</span>
            {payMethod === "mixed" && (
              <span className="text-indigo-600 font-bold text-xs lowercase">
                cobro compartido
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              className={`ag-pay-method ${payMethod === "cash" ? "on" : ""}`}
              onClick={() => handleSelectMethod("cash")}
              disabled={paying}
            >
              <Banknote className="w-5 h-5" />
              <span>Efectivo</span>
            </button>

            <button
              type="button"
              className={`ag-pay-method ${payMethod === "card" ? "on" : ""}`}
              onClick={() => handleSelectMethod("card")}
              disabled={paying}
            >
              <Wallet className="w-5 h-5" />
              <span>Tarjeta</span>
            </button>

            <button
              type="button"
              className={`ag-pay-method ${payMethod === "mixed" ? "on" : ""}`}
              onClick={() => handleSelectMethod("mixed")}
              disabled={paying}
            >
              <Sparkles className="w-5 h-5" />
              <span>Mixto</span>
            </button>
          </div>

          {/* ── PANEL DE PAGO MIXTO (EFECTIVO + TARJETA) ── */}
          {payMethod === "mixed" && (
            <div className="mt-3 p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  Desglose mixto
                </span>
                <button
                  type="button"
                  onClick={handleSplitFiftyFifty}
                  className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50 transition"
                  title="Dividir 50% en efectivo y 50% en tarjeta"
                >
                  Dividir 50% / 50%
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Efectivo (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={effectiveTotal}
                    step="0.01"
                    value={mixedCash}
                    onChange={(e) => handleCashChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-base font-bold tabular-nums px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-blue-600" /> Tarjeta (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={effectiveTotal}
                    step="0.01"
                    value={mixedCard}
                    onChange={(e) => handleCardChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-base font-bold tabular-nums px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>

              {/* Indicador de balance del cobro mixto */}
              {isMixedBalanced ? (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-100/70 border border-emerald-300/70 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>
                    Total exacto: {numCash.toFixed(2)}€ efectivo + {numCard.toFixed(2)}€ tarjeta = {effectiveTotal.toFixed(2)}€
                  </span>
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-lg bg-amber-100/80 border border-amber-300/70 text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>
                    {mixedDiff > 0
                      ? `Faltan ${mixedDiff.toFixed(2)}€ para completar los ${effectiveTotal.toFixed(2)}€`
                      : `Sobran ${Math.abs(mixedDiff).toFixed(2)}€ del total de ${effectiveTotal.toFixed(2)}€`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── BOTÓN DE CONFIRMACIÓN ── */}
        <button
          className="ag-detail-action primary w-full py-3.5 text-base font-bold flex items-center justify-center gap-2"
          onClick={handleSubmit}
          disabled={!canConfirm}
        >
          {paying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Registrando cobro...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>
                Confirmar cobro · {effectiveTotal.toFixed(2)}€
                {payMethod === "mixed"
                  ? " (Mixto)"
                  : payMethod === "cash"
                  ? " (Efectivo)"
                  : " (Tarjeta)"}
              </span>
            </>
          )}
        </button>

        {/* Opciones avanzadas */}
        {onNavigateToCash && (
          <button
            type="button"
            className="w-full mt-2 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition"
            onClick={() => {
              sessionStorage.setItem(
                "pendingChargeBooking",
                JSON.stringify({
                  id: booking.id,
                  customer_name: booking.customer_name,
                  stylist: booking.stylist,
                  services: booking.services,
                  fecha: booking.Fecha,
                  hora: booking.Hora,
                }),
              );
              onClose();
              onNavigateToCash();
            }}
            disabled={paying}
          >
            Opciones avanzadas en Caja (descuento %, propina, etc.) →
          </button>
        )}
      </div>
    </div>
  );
};
