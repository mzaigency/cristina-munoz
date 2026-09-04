import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Promotion } from "@/types/booking";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromoCodeInputProps {
  tenantId?: string;
  subtotal: number;
  appliedPromotion: Promotion | null;
  onApplyPromotion: (promotion: Promotion | null) => void;
}

export const PromoCodeInput = ({
  tenantId,
  subtotal,
  appliedPromotion,
  onApplyPromotion,
}: PromoCodeInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePromoCode = async () => {
    if (!code.trim() || !tenantId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from("promotions")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("code", code.toUpperCase().trim())
        .eq("is_active", true)
        .single();

      if (fetchError || !data) {
        setError("Código no válido");
        return;
      }

      const promo = data as unknown as Promotion;
      const now = new Date().toISOString();

      // Validar fechas
      if (promo.valid_from && promo.valid_from > now) {
        setError("Este código aún no es válido");
        return;
      }
      if (promo.valid_until && promo.valid_until < now) {
        setError("Este código ha expirado");
        return;
      }

      // Validar usos máximos
      if (promo.max_uses && promo.uses_count >= promo.max_uses) {
        setError("Este código ha alcanzado el límite de usos");
        return;
      }

      // Validar compra mínima
      if (promo.min_purchase && subtotal < promo.min_purchase) {
        setError(`Compra mínima: ${promo.min_purchase.toFixed(2)} €`);
        return;
      }

      onApplyPromotion(promo);
      setCode("");
      setIsOpen(false);
    } catch {
      setError("Error al validar el código");
    } finally {
      setLoading(false);
    }
  };

  const removePromotion = () => {
    onApplyPromotion(null);
    setError(null);
  };

  const calculateDiscount = (promo: Promotion): number => {
    if (promo.discount_type === 'percentage') {
      return (subtotal * promo.discount_value) / 100;
    }
    return Math.min(promo.discount_value, subtotal);
  };

  if (appliedPromotion) {
    const discount = calculateDiscount(appliedPromotion);
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 flex items-center justify-between text-xs">
        <div className="min-w-0">
          <span className="font-semibold text-emerald-950 block truncate">
            Cortesía: {appliedPromotion.name}
          </span>
          <span className="text-[11px] text-emerald-700 font-mono">
            {appliedPromotion.code}
          </span>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="font-bold text-emerald-800 tabular-nums text-sm">
            -{discount.toFixed(2).replace(".", ",")} €
          </span>
          <button
            type="button"
            className="text-xs text-emerald-700 hover:text-emerald-950 underline underline-offset-2 ml-1"
            onClick={removePromotion}
          >
            Quitar
          </button>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition-colors font-medium py-1 group"
      >
        <span className="text-neutral-400 group-hover:text-neutral-700">✦</span>
        <span className="underline underline-offset-4 decoration-neutral-300 group-hover:decoration-neutral-700">
          ¿Tienes un código de cortesía o descuento?
        </span>
      </button>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7DFD5] space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-neutral-800">
          Código de cortesía o promoción
        </span>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setError(null);
          }}
          className="text-neutral-400 hover:text-neutral-600 text-[11px]"
        >
          Cerrar
        </button>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (error) setError(null);
            }}
            placeholder="Ej: BIENVENIDA"
            className={cn(
              "h-10 uppercase text-xs rounded-xl tracking-wider bg-white border-neutral-300",
              error && "border-destructive"
            )}
            onKeyDown={(e) => e.key === "Enter" && validatePromoCode()}
          />
          {error && (
            <p className="text-[11px] text-destructive mt-1 font-medium">{error}</p>
          )}
        </div>
        <Button
          variant="default"
          onClick={validatePromoCode}
          disabled={!code.trim() || loading}
          className="h-10 px-4 rounded-xl text-xs font-semibold shrink-0 bg-neutral-900 hover:bg-neutral-800 text-white"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Aplicar"
          )}
        </Button>
      </div>
    </div>
  );
};