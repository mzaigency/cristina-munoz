import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Promotion } from "@/types/booking";
import { Tag, X, Check, Loader2 } from "lucide-react";
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
      <div className="rounded-xl border border-green-200 bg-green-50/70 p-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <Check className="h-3.5 w-3.5 text-green-600" />
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-green-900 block truncate">{appliedPromotion.name}</span>
            <span className="text-[11px] text-green-700 font-mono">({appliedPromotion.code})</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-green-700 tabular-nums">-{discount.toFixed(2)} €</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-full hover:bg-green-200/50 text-green-700"
            onClick={removePromotion}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-primary transition-colors py-0.5 px-0.5 group"
      >
        <Tag className="h-3.5 w-3.5 text-neutral-400 group-hover:text-primary transition-colors" />
        <span className="underline-offset-2 hover:underline">¿Tienes un código de descuento?</span>
      </button>
    );
  }

  return (
    <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2">
      <div className="flex items-center justify-between text-xs text-neutral-600 font-medium">
        <span className="flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-primary" />
          Código promocional
        </span>
        <button
          type="button"
          onClick={() => { setIsOpen(false); setError(null); }}
          className="text-neutral-400 hover:text-neutral-600 text-xs"
        >
          Cancelar
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
            placeholder="Ej: BIENVENIDA10"
            className={cn(
              "h-10 uppercase text-xs sm:text-sm rounded-lg tracking-wider",
              error && "border-destructive"
            )}
            onKeyDown={(e) => e.key === 'Enter' && validatePromoCode()}
          />
          {error && (
            <p className="text-[11px] text-destructive mt-1 font-medium">{error}</p>
          )}
        </div>
        <Button
          variant="default"
          onClick={validatePromoCode}
          disabled={!code.trim() || loading}
          className="h-10 px-4 rounded-lg text-xs font-semibold shrink-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Aplicar"
          )}
        </Button>
      </div>
    </div>
  );
};